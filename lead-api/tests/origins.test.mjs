import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('both official hosts can submit; lookalike hosts remain blocked', async () => {
  const approved = ['https://palm-official.yu9089484.chatgpt.site', 'https://palmjourney.com'];
  const env = { ALLOWED_ORIGIN: approved.join(', '), DB: {} };
  for (const route of ['/api/leads', '/api/subscriptions']) {
    for (const origin of [...approved, 'https://palmjourney.com.attacker.example', 'http://palmjourney.com']) {
      const response = await worker.fetch(new Request('https://api.example' + route, { method: 'OPTIONS', headers: { origin } }), env);
      assert.equal(response.status, approved.includes(origin) ? 204 : 403);
      assert.equal(response.headers.get('access-control-allow-origin'), approved.includes(origin) ? origin : null);
      const post = await worker.fetch(new Request('https://api.example' + route, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}' }), env);
      assert.equal(post.status, approved.includes(origin) ? 400 : 403);
    }
  }
});
