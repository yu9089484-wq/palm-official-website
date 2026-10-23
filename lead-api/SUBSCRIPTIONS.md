# PALM newsletter subscriptions

The header Subscribe button opens a responsive email-only dialog. Existing website copy and journey enquiries are unchanged.

## Production status — 2026-10-23

Direct collection is deployed at `https://palm-enquiries.yu9089484.chatgpt.site/api/subscriptions`. Migrations 0002 and 0003 are applied. A fictional email submitted through `https://palmjourney.com/` was confirmed in the hosted database. Both the custom domain and the original platform hostname are explicitly allowed by CORS. API version 3 sends an owner notification for each newly inserted subscription; a test notification was confirmed as Delivered in Resend.

## Deployment sequence

1. Keep the ordered SQL migrations, including `drizzle/0002_create_newsletter_subscribers.sql` and `drizzle/0003_email_notifications.sql`, in the Sites publication package. Sites applies pending migrations during deployment.
2. Deploy the updated worker with the existing DB binding, allowed website origins and server-only Resend settings described in `README.md`. `POST /api/subscriptions` accepts email, consent, startedAt and the website honeypot.
3. Verify the endpoint, then set `window.PALM_SUBSCRIBE_ENDPOINT` in `web/lead-config.js` to the verified subscription endpoint and deploy the frontend.

The production frontend has its verified endpoint configured. Local design previews keep the endpoint empty and offer an explicit email link to PALM instead of claiming a subscription was saved.

Records are stored separately in `newsletter_subscribers`, with consent timestamp and consent text version. Duplicate normalized emails do not create duplicate rows or repeated owner notifications. No subscriber email list is publicly readable. New subscriptions notify `palm529018@gmail.com`; this service does not send campaigns or subscriber confirmations. PALM handles stop requests through the contact email disclosed in the dialog; remove unsubscribed addresses from any future campaign exports.

Validation: `node --test lead-api/tests/*.test.mjs` covers actual SQLite persistence, consent, email validation, duplicate handling and allowed origins, together with the existing enquiry tests.
