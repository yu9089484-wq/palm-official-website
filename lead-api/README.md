# PALM lead API

Public write-only endpoint for the PALM website enquiry form.

- POST /api/leads validates and stores a consented lead in D1.
- GET /health reports service readiness.
- There is no public read endpoint. The site owner reads submissions through the Sites database tools.
- Set ALLOWED_ORIGIN to the final PALM website origin before publication.
- Keep the frontend in preview mode until the endpoint is deployed and verified.

## Linked journey request

The request and email/contact details are saved together in one `leads` row.
The added optional fields are `serviceKey`, `journeyNeeds`, `travelWindow`, and
`recordsStatus`; `needs` remains the guest's additional travel notes.
Apply `drizzle/0000_create_leads.sql` and then `drizzle/0001_add_journey_request.sql`
for a new database. Existing databases only need migration 0001.

The published frontend uses the verified API and D1 database. See
`../DEPLOYMENT.md` for production URLs and binding configuration. The standalone
CanvasCode HTML remains preview-only. Local design previews should use an empty
endpoint; production accepts the exact official site origin. Email notifications
are not configured, and there is no standalone admin login page.

Run tests with Node 24 or later: `node --test tests/worker.test.mjs`.
Tests use fictional contacts, including a real in-memory SQLite write with both
migrations applied. They do not send enquiries to a live backend.
