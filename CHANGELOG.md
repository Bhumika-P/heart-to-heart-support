# Changelog

## 1.2.1 — 2026-09-30

- Apply the reviewed home-page corrections for emotional abuse, healing tools, community wording, the founder bio, and the founder quote.
- Replace the confidentiality agreement with the supplied confidentiality and disclaimer agreement, including recording restrictions, confidentiality limits, personal responsibility, and crisis guidance.
- Update the printable page, two-page Word download, and related agreement references.

## 1.2.0 — 2026-09-30

- Activate Firebase-backed session management, private RSVPs, contact messages, and administrator access.
- Connect Gmail notifications through a Secret Manager credential, with a masked local setup helper.
- Initialize database parameters at function startup so production deployments can analyze exports correctly.
- Allow functions to scale down to zero; limit each to two concurrent instances.
- Update privacy information and add an administrator guide.

## 1.1.0 — 2026-09-30

- Build and publish the compiled website to GitHub Pages automatically when main changes, fixing Firebase SDK imports on the live site.
- Add synchronized version numbers to the website footer, application packages, and public version file.
- Complete local browser verification of sessions, RSVPs, contact messages, admin views, and responsive page layouts.
- Keep live forms and Firebase activation disabled while the owner selects a provider; retain local emulator testing.
- Disable forms until JavaScript is ready and prevent native GET submission of personal data.
- Document production setup and verification separately from the website release.

## 1.0.0 — Initial implementation

- Implement the supplied Heart to Heart concept and source documents, including the public pages, original text, confidentiality agreement, resources, and supplied branding assets.
- Add Firebase Realtime Database rules, authenticated admin tools, biweekly session creation, RSVP and contact functions, and private notification delivery status.
