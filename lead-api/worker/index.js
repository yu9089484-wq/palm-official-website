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

// Credentials and the fixed recipient are server-only runtime settings.
async function notifyOwner(env, { id, kind, text, replyTo }) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_FROM || !env.NOTIFICATION_TO) return;
  const notificationId = `${kind}_${id}`;
  try {
    await env.DB.prepare(
      'INSERT INTO email_notifications (id, record_id, kind, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(notificationId, id, kind, 'pending', new Date().toISOString()).run();
    let status = 'failed';
    let providerId = null;
    let failure = 'network_error';
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': notificationId
        },
        body: JSON.stringify({
          from: env.NOTIFICATION_FROM,
          to: [env.NOTIFICATION_TO],
          reply_to: replyTo,
          subject: kind === 'lead' ? 'PALM | New website enquiry' : 'PALM | New newsletter subscriber',
          text
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && typeof data.id === 'string') {
        status = 'accepted';
        providerId = data.id;
        failure = null;
      } else {
        // Never store provider error bodies: they may echo customer data or secrets.
        failure = `http_${response.status}`;
      }
    } catch { /* Keep the saved enquiry and mark the notification for follow-up. */ }
    await env.DB.prepare(
      'UPDATE email_notifications SET status = ?, provider_id = ?, error_code = ?, updated_at = ? WHERE id = ?'
    ).bind(status, providerId, failure, new Date().toISOString(), notificationId).run();
  } catch {
    console.error('PALM notification processing failed; submitted record remains stored.');
  }
}

async function scheduleNotification(env, ctx, message) {
  const task = notifyOwner(env, message);
  if (ctx?.waitUntil) ctx.waitUntil(task);
  else await task;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGIN || url.origin).split(',').map(value => value.trim()).filter(Boolean);
    const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
    const isSubscription = url.pathname === '/api/subscriptions';
    const isSubmissionRoute = url.pathname === '/api/leads' || isSubscription;

    if (request.method === 'OPTIONS' && isSubmissionRoute) {
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
    if (request.method !== 'POST' || !isSubmissionRoute) {
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

    if (isSubscription) {
      if (typeof body.email !== 'string' || body.email.trim().length > 120 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        return json({ error: 'A valid email is required' }, 400, corsOrigin);
      }
      if (body.consent !== true) return json({ error: 'Consent is required' }, 400, corsOrigin);
      const subscribedAt = new Date().toISOString();
      const subscriberId = 'sub_' + crypto.randomUUID();
      const subscriberEmail = body.email.trim().toLowerCase();
      const saved = await env.DB.prepare(
        'INSERT INTO newsletter_subscribers (id, email, subscribed_at, consent_at, consent_version, status) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING'
      ).bind(subscriberId, subscriberEmail, subscribedAt, subscribedAt, 'palm-updates-v1', 'subscribed').run();
      if (Number(saved?.meta?.changes ?? saved?.changes ?? 0) > 0) {
        await scheduleNotification(env, ctx, {
          id: subscriberId, kind: 'subscription', replyTo: subscriberEmail,
          text: `A visitor subscribed to PALM updates.\n\nEmail: ${subscriberEmail}\nConsent recorded: ${subscribedAt}\nReference: ${subscriberId}`
        });
      }
      return json({ ok: true }, 200, corsOrigin);
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

    await scheduleNotification(env, ctx, {
      id, kind: 'lead', replyTo: email,
      text: [
        'A new enquiry was submitted on the PALM website.', '',
        `Reference: ${id}`, `Submitted: ${createdAt}`, `Name: ${name}`,
        `Email: ${email}`, `Country: ${country}`, `Phone / WhatsApp: ${whatsapp || 'Not provided'}`,
        `Preferred cities: ${[...cities, customCity].filter(Boolean).join(', ')}`,
        `Travel dates: ${travelStart || 'Flexible'} — ${travelEnd || 'Flexible'}`,
        `Service: ${serviceKey || 'Not specified'}`, '', 'Guest notes:', needs || 'Not provided',
        ...(journeyNeeds ? ['', 'Additional request:', journeyNeeds] : []),
        '', 'Reply to this email to contact the guest. The original enquiry is saved in the PALM database.'
      ].join('\n')
    });
    return json({ ok: true, id }, 201, corsOrigin);
  }
};
