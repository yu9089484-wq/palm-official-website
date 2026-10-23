# PALM publication configuration

Published successfully on 2026-10-23. Website hosting version: 5. API hosting version: 3.

- Official website: https://palmjourney.com/
- Original platform URL: https://palm-official.yu9089484.chatgpt.site
- Website hosting project: `appgprj_6acc3a6702348191a5a9289b2efa6b86`
- Enquiry API: https://palm-enquiries.yu9089484.chatgpt.site/api/leads
- API hosting project: `appgprj_6ad9dad47894819181a9fca5e4aa34a1`
- Subscription API: https://palm-enquiries.yu9089484.chatgpt.site/api/subscriptions
- API database binding: `DB`; tables: `leads`, `newsletter_subscribers`, `email_notifications`. Migrations 0000–0003 applied.
- API source commit: `70f96903785f4eebe726256b32bbce2bf04f42f8`; active runtime environment revision: 4.
- API `ALLOWED_ORIGIN`: `https://palm-official.yu9089484.chatgpt.site,https://palmjourney.com` (exact origin allowlist).
- Business contact: `palm529018@gmail.com`.

The API is deployed and a fictional launch-verification submission was confirmed in the hosted database. The website frontend is configured to submit to it. All contact information and selected journey requirements are saved together.

Email notifications are configured through Resend. New enquiries and new subscriptions notify `palm529018@gmail.com` from `PALM <notifications@mail.palmjourney.com>`. The sending-only key is restricted to `mail.palmjourney.com` and stored as a secret in the hosting environment; it is not in the source repository. Database records remain available through Sites database tools in Codex. There is no standalone admin login page. The footer email link independently opens the visitor's email application.

Fictional verification rows include `PALM Launch Test (Fictional)`, `PALM Browser Test (Fictional)` and the later email-delivery checks. They are not customer enquiries. No customer records or credentials are stored in this repository.

The live browser submission was confirmed in the database. All eight gallery photos loaded, the 115-second video played, the 390px viewport had no horizontal overflow, and browser error logs were empty. Seven API tests passed. The publication video is 1280×720, approximately 8 MB; the prior 35 MB version remains available in Git history and the original local preview assets.

For future changes, update the frontend API URL, CSP `connect-src`, and API `ALLOWED_ORIGIN` together when binding a new domain. GitHub stores the source; hosting is managed through Sites. GitHub pushes alone do not deploy this website.

## Source update — 2026-10-23

The published version contains the reviewed mobile layout, four new visit photos (12 gallery photos total), a second compressed video, gentle automatic photo/video playback, pastel navigation icons, brand typography and the header subscription dialog. All seven services and three journey cards remain visible on mobile. Existing page text is preserved.

Version 5 removes the three-row request editor (health needs, travel window and records status) and its obsolete preview action. Service examples now populate the existing editable notes field. Contact details, city/date selection, consent and submission remain available. Desktop and 390px mobile checks passed, and the published form opens without JavaScript errors.

The domain is verified and HTTPS is active. Aliyun DNS has the two provider-required apex A records and ownership-validation TXT records; existing nameservers are unchanged. The canonical URL is https://palmjourney.com/. Only the apex hostname is configured; `www` is not currently bound.

Initial launch checks: no broken loaded images or horizontal overflow at desktop width; mobile subscription submitted successfully and was read back from `newsletter_subscribers`. The verification email `palm-domain-launch-check@example.com` is fictional and must be excluded from future campaign exports. At that point, nine API tests passed and no notification emails had been sent.

## Email notification release — 2026-10-23

API version 3 was deployed with migration 0003 and the Resend runtime settings. All 13 API tests passed. A labelled test enquiry and a test subscription each produced an owner notification, and Resend reported both messages as **Delivered**. This confirms recipient-server delivery; inbox placement was not inspected.

The database records the provider message ID and sanitized notification status. `accepted` means Resend accepted the send request, rather than proving final delivery. Notification failures retain the original enquiry or subscription. Automatic retries and historical backfill are not implemented. Duplicate subscriptions do not send repeated notifications, and no campaigns or visitor confirmation emails are sent.
