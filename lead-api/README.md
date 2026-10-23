# PALM enquiry and subscription API

Public write-only service for the PALM website at https://palmjourney.com.
Backend origin: https://palm-enquiries.yu9089484.chatgpt.site.

- `POST /api/leads` validates and stores a consented enquiry in D1.
- `POST /api/subscriptions` saves a consented newsletter subscription.
- `GET /health` reports service readiness.
- There is no public read endpoint. The owner reads submissions through the Sites database tools.

The production frontend uses these API endpoints. Standalone CanvasCode files
are local previews and deliberately block live submissions.

## Runtime configuration

Keep runtime values in Sites environment settings, not in this repository:

- `ALLOWED_ORIGIN`: `https://palm-official.yu9089484.chatgpt.site,https://palmjourney.com`.
- `RESEND_API_KEY`: secret, sending-only key restricted to `mail.palmjourney.com`.
- `NOTIFICATION_FROM`: `PALM <notifications@mail.palmjourney.com>`.
- `NOTIFICATION_TO`: `palm529018@gmail.com`.

The Worker requires a D1 binding named `DB`. Sites applies the ordered SQL
migrations under `drizzle/` during publication, including
`0003_email_notifications.sql`. Preserve existing migrations and records.
Deploy a saved version after changing runtime settings to activate them.

## Email notifications

After saving an enquiry or a new subscription, the Worker notifies the fixed
owner address through Resend. Replies are addressed to the visitor's submitted
email address. Duplicate subscriptions do not send repeated notifications.

Messages use plain text, an idempotency key and a 10-second timeout. The
`email_notifications` table records provider acceptance as `accepted`; this
does not prove inbox delivery. Confirm delivery in the Resend dashboard.
Failures retain the original submission and a sanitized error code, without
provider error bodies. Automatic retries and historical backfill are not implemented.

## Build and verify

Run `npm test` with Node 24 or later. Tests use fictional contacts and mocked
email delivery; they do not submit enquiries or send live mail.
Build with `npm run build`, then publish through the Sites workflow helper.
The helper packages the Worker and SQL migrations together.

For a live delivery check, submit a clearly labelled test through each endpoint
and confirm its matching Resend delivery event. Never commit credentials or
copy production contact data into fixtures.
