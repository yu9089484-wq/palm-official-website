# PALM newsletter subscriptions

The header Subscribe button opens a responsive email-only dialog. Existing website copy and journey enquiries are unchanged.

## Production status — 2026-10-23

Direct collection is deployed at `https://palm-enquiries.yu9089484.chatgpt.site/api/subscriptions`. Migration 0002 is applied. A fictional email submitted through `https://palmjourney.com/` was confirmed in the hosted database. Both the custom domain and the original platform hostname are explicitly allowed by CORS.

## Deployment sequence

1. Apply `drizzle/0002_create_newsletter_subscribers.sql` to the production database.
2. Deploy the updated worker with the existing DB binding and allowed website origin. `POST /api/subscriptions` accepts email, consent, startedAt and the website honeypot.
3. Verify the endpoint, then set `window.PALM_SUBSCRIBE_ENDPOINT` in `web/lead-config.js` to the verified subscription endpoint and deploy the frontend.

The production frontend has its verified endpoint configured. Local design previews keep the endpoint empty and offer an explicit email link to PALM instead of claiming a subscription was saved.

Records are stored separately in `newsletter_subscribers`, with consent timestamp and consent text version. Duplicate normalized emails do not create duplicate rows. No subscriber email list is publicly readable. This change does not send campaigns, confirmations or company email notifications. PALM handles stop requests through the contact email disclosed in the dialog; remove unsubscribed addresses from any future campaign exports.

Validation: `node --test lead-api/tests/*.test.mjs` covers actual SQLite persistence, consent, email validation, duplicate handling and allowed origins, together with the existing enquiry tests.
