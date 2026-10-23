import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.js';

test('newsletter saves consent and deduplicates email without creating a journey enquiry', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0002_create_newsletter_subscribers.sql', import.meta.url), 'utf8'));
  const env = { ALLOWED_ORIGIN:'https://palm.example', DB:{ prepare(sql) {
    return { bind(...values) { return { async run() { return db.prepare(sql).run(...values); } }; } };
  } } };
  const request = (body, origin = env.ALLOWED_ORIGIN) => new Request('https://api.example/api/subscriptions', {
    method:'POST', headers:{origin,'content-type':'application/json'},
    body:JSON.stringify({startedAt:Date.now()-2000,...body})
  });
  try {
    assert.equal((await worker.fetch(request({email:'guest@example.com',consent:false}),env)).status,400);
    assert.equal((await worker.fetch(request({email:'bad',consent:true}),env)).status,400);
    assert.equal((await worker.fetch(request({email:'guest@example.com',consent:true},'https://other.example'),env)).status,403);
    assert.equal(db.prepare('SELECT count(*) AS count FROM newsletter_subscribers').get().count,0);
    for (const email of ['Guest@example.com','guest@example.com']) {
      const res = await worker.fetch(request({email,consent:true}),env);
      assert.equal(res.status,200);
      assert.equal((await res.json()).ok,true);
    }
    const rows = db.prepare('SELECT * FROM newsletter_subscribers').all();
    assert.equal(rows.length,1);
    assert.equal(rows[0].email,'guest@example.com');
    assert.equal(rows[0].consent_version,'palm-updates-v1');
    assert.equal(rows[0].status,'subscribed');
    assert.ok(rows[0].consent_at);
  } finally { db.close(); }
});
