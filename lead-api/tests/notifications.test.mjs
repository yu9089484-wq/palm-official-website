import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.js';

const origin = 'https://palm.example';
function setup() {
  const db = new DatabaseSync(':memory:');
  for (const migration of ['0000_create_leads.sql', '0001_add_journey_request.sql', '0002_create_newsletter_subscribers.sql', '0003_email_notifications.sql']) {
    db.exec(readFileSync(new URL(`../drizzle/${migration}`, import.meta.url), 'utf8'));
  }
  return { db, env: {
    ALLOWED_ORIGIN: origin, RESEND_API_KEY: 'test-only-secret',
    NOTIFICATION_FROM: 'PALM <notifications@example.com>', NOTIFICATION_TO: 'owner@example.com',
    DB: { prepare(sql) { return { bind(...args) { return { async run() { return db.prepare(sql).run(...args); } }; } }; } }
  } };
}
function request(path = 'leads', extra = {}) {
  return new Request(`https://api.example/api/${path}`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Fictional Guest', email: 'guest@example.com', country: 'Canada',
      cities: ['Macao'], consent: true, startedAt: Date.now() - 2000, needs: '<script>literal guest note</script>', ...extra })
  });
}

test('sends only to configured owner after durable storage, without leaking secrets to visitor', async t => {
  const { db, env } = setup();
  try {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 1);
      calls.push({ url, options });
      return Response.json({ id: 'provider-test-id' });
    });
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 201);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.resend.com/emails');
    const payload = JSON.parse(calls[0].options.body);
    assert.deepEqual(payload.to, ['owner@example.com']);
    assert.equal(payload.reply_to, 'guest@example.com');
    assert.match(payload.text, /literal guest note/);
    assert.equal(payload.html, undefined);
    assert.ok(calls[0].options.headers['Idempotency-Key']);
    assert.equal(db.prepare('SELECT status FROM email_notifications').get().status, 'accepted');
    assert.doesNotMatch(await response.text(), /test-only-secret|owner@example.com|provider-test-id/);
  } finally { db.close(); }
});

test('failed mail preserves enquiry and records a sanitized failure', async t => {
  const { db, env } = setup();
  try {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'private provider detail' }, { status: 503 }));
    assert.equal((await worker.fetch(request(), env)).status, 201);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 1);
    const notification = db.prepare('SELECT * FROM email_notifications').get();
    assert.equal(notification.status, 'failed');
    assert.equal(notification.error_code, 'http_503');
    assert.doesNotMatch(JSON.stringify(notification), /private provider detail/);
  } finally { db.close(); }
});

test('duplicate subscriptions do not trigger repeated owner notifications', async t => {
  const { db, env } = setup();
  try {
    let sent = 0;
    t.mock.method(globalThis, 'fetch', async () => { sent++; return Response.json({ id: 'subscriber-test-id' }); });
    assert.equal((await worker.fetch(request('subscriptions'), env)).status, 200);
    assert.equal((await worker.fetch(request('subscriptions'), env)).status, 200);
    assert.equal(sent, 1);
  } finally { db.close(); }
});

test('unconfigured mail and rejected submissions do not send messages', async t => {
  const { db, env } = setup();
  try {
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not send'); });
    assert.equal((await worker.fetch(request('leads', { consent: false }), env)).status, 400);
    delete env.RESEND_API_KEY;
    assert.equal((await worker.fetch(request(), env)).status, 201);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM email_notifications').get().n, 0);
  } finally { db.close(); }
});
