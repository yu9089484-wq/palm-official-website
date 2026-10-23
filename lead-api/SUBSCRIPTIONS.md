# PALM newsletter subscriptions

The header Subscribe button opens a responsive email-only dialog. Existing website copy and journey enquiries are unchanged.

## Enable direct collection

1. Apply `drizzle/0002_create_newsletter_subscribers.sql` to the production database.
2. Deploy the updated worker with the existing DB binding and allowed website origin. `POST /api/subscriptions` accepts email, consent, startedAt and the website honeypot.
3. Verify the endpoint, then set `window.PALM_SUBSCRIBE_ENDPOINT` in `web/lead-config.js` to the verified subscription endpoint and deploy the frontend.

Until those steps are complete the endpoint stays empty. The form offers an explicit email link to PALM; it does not claim an email has been saved or automatically send email. The local previews always keep the endpoint empty.

Records are stored separately in `newsletter_subscribers`, with consent timestamp and consent text version. Duplicate normalized emails do not create duplicate rows. No subscriber email list is publicly readable. This change does not send campaigns, confirmations or company email notifications. PALM handles stop requests through the contact email disclosed in the dialog; remove unsubscribed addresses from any future campaign exports.

Validation: `node --test lead-api/tests/*.test.mjs` covers actual SQLite persistence, consent, email validation, duplicate handling and allowed origins, together with the existing enquiry tests.
