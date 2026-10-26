# Support Group contact notification — October 26, 2026

Prepared in `functions/contact-email.js` and wired into `submitContact` and the contact branch of `retryNotification` in `functions/index.js`.

- Matches the main website's burgundy/cream contact-email design.
- Header: Heart to Heart / Hope & Healing / SUPPORT GROUP CONTACT.
- Contact details: Your name, Email address, Subject. Separate Message panel preserves line breaks.
- Reply button uses the submitting address and original subject. Native Reply-To and plain-text fallback remain.
- Visitor-provided text is HTML escaped. No recipient, secret, database-rule, RSVP, or reminder behavior changes.

17 unit tests passed with `node --test tests/unit.test.mjs tests/contact-email.test.mjs`. The default test script now includes the contact-email tests. Static build and `git diff --check` passed.

Fictional local preview: `/Users/sheree/Documents/GITHUB/support-group-contact-email-preview.html`; screenshot alongside it with `.png` extension. No test email was sent.

## Activated October 26, 2026

- The CLI's local function discovery failed to produce a manifest: HTTP discovery timed out at 10 seconds, and file discovery timed out at 120 seconds. The function code itself analyzed successfully when Firebase's SDK analyzer was run directly.
- Generated a fresh manifest with the installed Firebase SDK, temporarily supplied it as `functions/functions.yaml`, and deployed only `submitContact` and `retryNotification`. A transient function-list API error cleared on retry. The temporary manifest was removed after deployment; never commit a stale generated manifest.
- Both functions are ACTIVE. Revisions: `submitcontact-00003-vum` and `retrynotification-00004-yoj`. Deployment completed around 12:42 p.m. Central on October 26.
- Downloaded each deployed source archive through the authenticated Google API and confirmed SHA-256 equality of `index.js` and `contact-email.js` with the local source.
- Sent one clearly labeled test contact notification to the existing owner inbox, `hthlifecoaching@gmail.com`, with subject `TEST — Support Group HTML email verification`. Its exact live delivery record reports `sent` and is not emulated. This verifies provider acceptance; inbox rendering was not inspected.
- Evidence outside the public website: `/Users/sheree/Documents/GITHUB/support-contact-email-deployment-verification.json` and `/Users/sheree/Documents/GITHUB/support-contact-email-live-test.json`.
- No database rules, IAM bindings, recipients, or SMTP secret values were changed. RSVP/reminder functions were not deployed.

For a future recurrence, generate the manifest directly from the current source with the installed SDK before deployment, then remove the generated file afterward. The analyzer command, run from `functions/`, is:

```sh
FUNCTIONS_CONTROL_API=true FUNCTIONS_MANIFEST_OUTPUT_PATH=/absolute/path/to/functions/functions.yaml node node_modules/firebase-functions/lib/bin/firebase-functions.js .
```

Deploy only the intended existing contact functions with the Firebase CLI. Ensure the bundled Node binary is available on PATH to child processes.
