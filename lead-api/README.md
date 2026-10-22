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

The current local frontend is a preview: `lead-config.js` has an empty endpoint.
No database is configured on the inspected PALM Site yet. Before collecting
real enquiries, deploy this API with a D1 binding named `DB`, set
`ALLOWED_ORIGIN` to the exact published frontend origin, and set
`window.PALM_LEAD_ENDPOINT` in `lead-config.js` to the verified `/api/leads` URL.
For a different API origin, add that exact origin to the frontend CSP's
`connect-src`. The standalone CanvasCode HTML deliberately blocks network
submissions and is for preview only. Do not use it as the production frontend.

Run tests with Node 24 or later: `node --test tests/worker.test.mjs`.
Tests use fictional contacts, including a real in-memory SQLite write with both
migrations applied. They do not send enquiries to a live backend.
