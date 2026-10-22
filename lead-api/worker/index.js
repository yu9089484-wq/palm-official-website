const json = (body, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'access-control-allow-origin': origin,
    'vary': 'Origin'
  }
});

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || url.origin;
    const corsOrigin = requestOrigin === allowedOrigin ? requestOrigin : '';

    if (request.method === 'OPTIONS' && url.pathname === '/api/leads') {
      if (!corsOrigin) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': corsOrigin,
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type, accept',
          'access-control-max-age': '86400',
          'vary': 'Origin'
        }
      });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'palm-leads' }, 200, corsOrigin);
    }
    if (request.method !== 'POST' || url.pathname !== '/api/leads') {
      return json({ error: 'Not found' }, 404, corsOrigin);
    }
    if (!env.DB) return json({ error: 'Database unavailable' }, 503, corsOrigin);
    if (requestOrigin && !corsOrigin) return json({ error: 'Origin not allowed' }, 403, '');
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 20000) return json({ error: 'Request too large' }, 413, corsOrigin);

    let body;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'Invalid JSON' }, 400, corsOrigin);
      const chunks = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 20000) {
          await reader.cancel();
          return json({ error: 'Request too large' }, 413, corsOrigin);
        }
        chunks.push(value);
      }
      body = JSON.parse(await new Blob(chunks).text());
    } catch {
      return json({ error: 'Invalid JSON' }, 400, corsOrigin);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid request' }, 400, corsOrigin);
    }

    if (clean(body.website, 100)) return json({ ok: true }, 202, corsOrigin);
    const startedAt = Number(body.startedAt || 0);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1200) {
      return json({ error: 'Please try again' }, 429, corsOrigin);
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 120).toLowerCase();
    const country = clean(body.country, 80);
    const whatsapp = clean(body.whatsapp, 40);
    const cities = Array.isArray(body.cities) ? body.cities.map(value => clean(value, 80)).filter(Boolean).slice(0, 6) : [];
    const customCity = clean(body.customCity, 100);
    const travelStart = clean(body.travelStart, 10);
    const travelEnd = clean(body.travelEnd, 10);
    const needs = clean(body.needs, 1000);
    const serviceKey = clean(body.serviceKey, 40);
    const journeyNeeds = clean(body.journeyNeeds, 300);
    const travelWindow = clean(body.travelWindow, 80);
    const recordsStatus = clean(body.recordsStatus, 80);
    const source = clean(body.source, 50) || 'palm-website';

    if (!name || !country || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Required fields are invalid' }, 400, corsOrigin);
    }
    if (body.consent !== true) return json({ error: 'Consent is required' }, 400, corsOrigin);
    if (!cities.length && !customCity) return json({ error: 'Preferred city is required' }, 400, corsOrigin);
    if (!validDate(travelStart) || !validDate(travelEnd) || (travelStart && travelEnd && travelEnd < travelStart)) {
      return json({ error: 'Travel dates are invalid' }, 400, corsOrigin);
    }

    const id = 'lead_' + crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO leads (id, created_at, status, source, name, email, country, whatsapp, cities, custom_city, travel_start, travel_end, needs, consent_at, service_key, journey_needs, travel_window, records_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, createdAt, 'new', source, name, email, country, whatsapp || null,
      JSON.stringify(cities), customCity || null, travelStart || null, travelEnd || null,
      needs || null, createdAt, serviceKey || null, journeyNeeds || null,
      travelWindow || null, recordsStatus || null
    ).run();

    return json({ ok: true, id }, 201, corsOrigin);
  }
};
