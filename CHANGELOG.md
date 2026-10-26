# Changelog

## 1.5.7 — 2026-10-25

- Add a little more space above and below the home page welcome message while keeping its size and style.

## 1.5.6 — 2026-10-25

- Enlarge the italic welcome message and reduce the vertical spacing between the home page picture and feature boxes.

## 1.5.5 — 2026-10-25

- Change the home page heading to Your Path for Understanding, Hope & Healing.
- Adjust the introduction line breaks and move the italic welcome message below the picture, above the three feature boxes.

## 1.5.4 — 2026-10-25

- Replace the enlarged coaching thumbnail with a restored high-resolution landscape for clearer rocks, trees, and path details; preserve the approved cream overlay and layout.

## 1.5.3 — 2026-10-25

- Use the approved coaching path image on the home page with a translucent cream overlay for readable text on desktop and mobile.

## 1.5.2 — 2026-10-25

- Move the smaller coaching logo to the upper-right of the biography text.
- Put Connect with Sherée directly under her portrait and wrap the biography around the picture and button.

## 1.5.1 — 2026-10-25

- Remove the Back to Main Website button from the home page picture and its reserved mobile spacing; retain Main Website in the navigation.

## 1.5.0 — 2026-10-25

- Match the main website navigation typography and spacing and add a Main Website menu link.
- Publish support pages at clean directory URLs, with redirects preserving query strings and fragments from older .html links.
- Keep nested page assets and dynamic links rooted correctly.

## 1.4.17 — 2026-10-25

- Add a Back to Main Website button at the bottom-right of the home page picture, linking to the main website home page.

## 1.4.16 — 2026-10-24

- Center the three-sentence Workbooks summary in a white box with a tan inset border, placing each sentence on its own line.

## 1.4.15 — 2026-10-24

- Update the requested Workbooks sentence and link each workbook cover to its own About page.
- Wrap book About page text around the cover and use the full content width below it; keep phone layouts readable.

## 1.4.14 — 2026-10-24

- Place Transformation Guide and Breakthrough Journal covers beside their matching paragraphs on Workbooks; both covers link back to Helpful Resources.

## 1.4.13 — 2026-10-24

- Add the provided Transformation Guide and Breakthrough Journal explanation to Workbooks, retaining the bottom return link.

## 1.4.12 — 2026-10-24

- Credit Sherée’s son and his wife on Polaris Frequency Studio in the music section.
- Add an intentionally blank Workbooks page linked from Transformation Guide & Breakthrough Journal, with a bottom link back to Helpful Resources.

## 1.4.11 — 2026-10-24

- Change the Resources book heading to Books by Sherée Bergman and others.

## 1.4.10 — 2026-10-24

- Match the main website book cards with equal-height covers and aligned About and Buy buttons.
- Add book details and Ken Nair’s recommended book; retain the Words of Hope and Books by Sherée Bergman headings.
- Preserve the music, tools, and remaining resource sections.

## 1.4.9 — 2026-10-24

- Italicize the home page welcome label and size it to fill its available width on one line.

## 1.4.8 — 2026-10-24

- Keep the home page welcome label on one line and reduce its font to fit the available space after font loading and screen resizing.

## 1.4.7 — 2026-10-24

- Change the upper-right home page label to Welcome to our Support Group, with wrapping for the longer wording.

## 1.4.6 — 2026-10-24

- Change the upper-right home page picture label to Support Group Site.

## 1.4.5 — 2026-10-24

- Remove Our Group from the shared navigation while keeping the detailed support group page linked from the home page Learn More button.

## 1.4.4 — 2026-10-24

- Add an About Our Support Group page covering participation, meeting expectations, topics, faith, privacy, fees, sponsorship, and joining.
- Link the new page from Our Group navigation and the home page Learn More button.

## 1.4.3 — 2026-10-24

- Add a Support Group label at the upper right of the home page picture, with mobile spacing to keep the introduction readable.

## 1.4.2 — 2026-10-23

- Add Healing to the home page support, education, and encouragement line.

## 1.4.1 — 2026-10-23

- Change the home page heading to “A Place for Understanding, Hope & Healing.”

## 1.2.9 — 2026-10-01

- Set hthlifecoaching@gmail.com as the backend notification recipient default for RSVP, contact, and retry notifications.
- Update the email configuration template and document the separate Firebase deployment required to change existing live routing.

## 1.2.8 — 2026-10-01

- Correct the sponsorship box location to the entry of the meeting room.

## 1.2.7 — 2026-10-01

- Add the $10 session fee and sponsorship information directly beneath the Group Sessions introduction, with a link to contact Sherée.

## 1.2.6 — 2026-10-01

- Clarify on the home page that the morning and evening sessions are identical teachings.

## 1.2.5 — 2026-10-01

- Change the home-page founder button from “Our Story” to “Her Story.”

## 1.2.4 — 2026-09-30

- Apply the reviewed “Leader and co-leaders” wording to the agreement page and Word download.

## 1.2.3 — 2026-09-30

- Apply the updated “If the leader or co-leader sees a member in public” wording to the agreement page and Word download.

## 1.2.2 — 2026-09-30

- Correct the agreement heading to “Leader & Co-Leaders Exception” on the web page and in the Word download.

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
