# PALM publication configuration

Published successfully on 2026-10-22. Website hosting version: 3.

- Website: https://palm-official.yu9089484.chatgpt.site
- Website hosting project: `appgprj_6acc3a6702348191a5a9289b2efa6b86`
- Enquiry API: https://palm-enquiries.yu9089484.chatgpt.site/api/leads
- API hosting project: `appgprj_6ad9dad47894819181a9fca5e4aa34a1`
- API database binding: `DB`; table: `leads`.
- API `ALLOWED_ORIGIN`: `https://palm-official.yu9089484.chatgpt.site`.
- Business contact: `palm529018@gmail.com`.

The API is deployed and a fictional launch-verification submission was confirmed in the hosted database. The website frontend is configured to submit to it. All contact information and selected journey requirements are saved together.

Email notifications are **not configured**. A footer email link opens the visitor's email application; it is not an automatic notification service. Database records can currently be reviewed by the owner using Sites database tools in Codex. There is no standalone admin login page. Do not promise email delivery until a sending provider is connected and receipt verified.

Two fictional verification rows exist: `PALM Launch Test (Fictional)` and `PALM Browser Test (Fictional)`. They are not customer enquiries. No customer records or credentials are stored in this repository.

The live browser submission was confirmed in the database. All eight gallery photos loaded, the 115-second video played, the 390px viewport had no horizontal overflow, and browser error logs were empty. Seven API tests passed. The publication video is 1280×720, approximately 8 MB; the prior 35 MB version remains available in Git history and the original local preview assets.

For future changes, update the frontend API URL, CSP `connect-src`, and API `ALLOWED_ORIGIN` together when binding a new domain. GitHub stores the source; hosting is managed through Sites. GitHub pushes alone do not deploy this website.
