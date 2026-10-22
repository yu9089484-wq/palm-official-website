import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const origin = 'https://palm.example';
const createEnv = () => {
  const inserts = [];
  return {
    inserts,
    env: {
      ALLOWED_ORIGIN: origin,
      DB: {
        prepare(sql) {
          return { bind(...values) { return { async run() { inserts.push({ sql, values }); } }; } };
        }
      }
    }
  };
};

test('stores a valid consented lead', async () => {
  const state = createEnv();
  const request = new Request('https://api.example/api/leads', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Demo Guest', email: 'demo@example.com', country: 'Macao',
      cities: ['Macao'], consent: true, startedAt: Date.now() - 2000
    })
  });
  const response = await worker.fetch(request, state.env);
  assert.equal(response.status, 201);
  assert.equal(state.inserts.length, 1);
  assert.equal(state.inserts[0].values[2], 'new');
});

test('rejects invalid fields without writing', async () => {
  const state = createEnv();
  const request = new Request('https://api.example/api/leads', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'bad', country: '', consent: true, startedAt: Date.now() - 2000 })
  });
  const response = await worker.fetch(request, state.env);
  assert.equal(response.status, 400);
  assert.equal(state.inserts.length, 0);
});

test('rejects unapproved origins', async () => {
  const state = createEnv();
  const request = new Request('https://api.example/api/leads', {
    method: 'POST', headers: { origin: 'https://wrong.example', 'content-type': 'application/json' }, body: '{}'
  });
  const response = await worker.fetch(request, state.env);
  assert.equal(response.status, 403);
  assert.equal(state.inserts.length, 0);
});

test('stores the selected request together with contact details in one lead', async () => {
  const state = createEnv();
  const request = new Request('https://api.example/api/leads', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Fictional Guest', email: 'guest@example.com', country: 'Canada',
      cities: ['Macao'], consent: true, startedAt: Date.now() - 2000,
      serviceKey: 'dental', journeyNeeds: 'A fictional request for dental appointment coordination.',
      travelWindow: 'Within 3-6 months', recordsStatus: 'Check-up reports',
      needs: 'I would like language support for appointments.'
    })
  });
  const response = await worker.fetch(request, state.env);
  assert.equal(response.status, 201);
  assert.equal(state.inserts.length, 1);
  const values = state.inserts[0].values;
  assert.equal(values[4], 'Fictional Guest');
  assert.equal(values[5], 'guest@example.com');
  assert.equal(values[12], 'I would like language support for appointments.');
  assert.deepEqual(values.slice(14), [
    'dental', 'A fictional request for dental appointment coordination.',
    'Within 3-6 months', 'Check-up reports'
  ]);
});

test('requires consent before saving a prefilled request', async () => {
  const state = createEnv();
  const request = new Request('https://api.example/api/leads', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({name: 'Fictional Guest', email: 'guest@example.com', country: 'Canada',
      cities: ['Macao'], consent: false, startedAt: Date.now() - 2000,
      journeyNeeds: 'A fictional request.'})
  });
  assert.equal((await worker.fetch(request, state.env)).status, 400);
  assert.equal(state.inserts.length, 0);
});

test('migrations and worker insert persist the combined enquiry in SQLite', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    for (const migration of ['0000_create_leads.sql', '0001_add_journey_request.sql']) {
      db.exec(readFileSync(new URL(`../drizzle/${migration}`, import.meta.url), 'utf8'));
    }
    const response = await worker.fetch(new Request('https://api.example/api/leads', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Fictional Guest', email: 'preview@example.com', country: 'Canada',
        cities: ['Macao'], consent: true, startedAt: Date.now() - 2000,
        serviceKey: 'dental', journeyNeeds: 'Fictional dental coordination request.',
        travelWindow: 'Flexible', recordsStatus: 'Not sure yet', needs: 'Language support requested.' })
    }), {
      ALLOWED_ORIGIN: origin,
      DB: { prepare(sql) { return { bind(...values) { return { async run() { return db.prepare(sql).run(...values); } }; } }; } }
    });
    assert.equal(response.status, 201);
    const { id } = await response.json();
    const saved = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    assert.equal(saved.email, 'preview@example.com');
    assert.equal(saved.service_key, 'dental');
    assert.equal(saved.journey_needs, 'Fictional dental coordination request.');
    assert.equal(saved.travel_window, 'Flexible');
    assert.equal(saved.records_status, 'Not sure yet');
    assert.equal(saved.needs, 'Language support requested.');
  } finally { db.close(); }
});
