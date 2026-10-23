# PALM publication configuration

Published successfully on 2026-10-23. Website hosting version: 4. API hosting version: 2.

- Official website: https://palmjourney.com/
- Original platform URL: https://palm-official.yu9089484.chatgpt.site
- Website hosting project: `appgprj_6acc3a6702348191a5a9289b2efa6b86`
- Enquiry API: https://palm-enquiries.yu9089484.chatgpt.site/api/leads
- API hosting project: `appgprj_6ad9dad47894819181a9fca5e4aa34a1`
- Subscription API: https://palm-enquiries.yu9089484.chatgpt.site/api/subscriptions
- API database binding: `DB`; tables: `leads`, `newsletter_subscribers`. Migrations 0000–0002 applied.
- API `ALLOWED_ORIGIN`: `https://palm-official.yu9089484.chatgpt.site,https://palmjourney.com` (exact origin allowlist).
- Business contact: `palm529018@gmail.com`.

The API is deployed and a fictional launch-verification submission was confirmed in the hosted database. The website frontend is configured to submit to it. All contact information and selected journey requirements are saved together.

Email notifications are **not configured**. A footer email link opens the visitor's email application; it is not an automatic notification service. Database records can currently be reviewed by the owner using Sites database tools in Codex. There is no standalone admin login page. Do not promise email delivery until a sending provider is connected and receipt verified.

Two fictional verification rows exist: `PALM Launch Test (Fictional)` and `PALM Browser Test (Fictional)`. They are not customer enquiries. No customer records or credentials are stored in this repository.

The live browser submission was confirmed in the database. All eight gallery photos loaded, the 115-second video played, the 390px viewport had no horizontal overflow, and browser error logs were empty. Seven API tests passed. The publication video is 1280×720, approximately 8 MB; the prior 35 MB version remains available in Git history and the original local preview assets.

For future changes, update the frontend API URL, CSP `connect-src`, and API `ALLOWED_ORIGIN` together when binding a new domain. GitHub stores the source; hosting is managed through Sites. GitHub pushes alone do not deploy this website.

## Source update — 2026-10-23

The published version contains the reviewed mobile layout, four new visit photos (12 gallery photos total), a second compressed video, gentle automatic photo/video playback, pastel navigation icons, brand typography and the header subscription dialog. All seven services and three journey cards remain visible on mobile. Existing page text is preserved.

The domain is verified and HTTPS is active. Aliyun DNS has the two provider-required apex A records and ownership-validation TXT records; existing nameservers are unchanged. The canonical URL is https://palmjourney.com/. Only the apex hostname is configured; `www` is not currently bound.

Launch checks: no broken loaded images or horizontal overflow at desktop width; mobile subscription submitted successfully and was read back from `newsletter_subscribers`. The verification email `palm-domain-launch-check@example.com` is fictional and must be excluded from future campaign exports. Nine API tests pass, including exact origin checks and SQLite persistence. No campaign or notification emails were sent.
