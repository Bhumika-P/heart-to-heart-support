# Firebase setup

The owner selected Firebase and enabled Blaze. The frontend remains hosted on GitHub Pages. Activate `backendEnabled` in `assets/js/site-config.js` only after the functions, rules, administrators, and email provider have been configured and verified.

Project: `hearttoheart-14e56`

Realtime Database: `https://hearttoheart-14e56-default-rtdb.firebaseio.com`

## 1. Authentication

In Firebase Console → Authentication → Sign-in method, enable **Email/Password**. Add the production domain to Authentication → Settings → Authorized domains when the domain is chosen. Add `localhost` only if you want local sign-in against production; prefer emulators for testing.

This website does not offer public registration. Administrators must be provisioned. A signed-in Firebase account alone does not grant access to the dashboard or private records.

## 2. Database rules to copy and paste

Open `firebase-realtime-database-rules.json` in the root of this repository. Copy its entire contents into Firebase Console → Realtime Database → Rules, then click Publish.

The rules are complete. Do not replace `.read` or `.write` at the root with `true`.

Public visitors can read `events`. Each authenticated user can read only their own `admins/<UID>` flag. Only approved administrators can read RSVP and contact-message records. All direct browser database writes are denied, including administrator writes. Mutations pass through server functions, which validate inputs and check admin permission. The Firebase Admin SDK used by those functions bypasses rules intentionally, so the callable authorization checks are also essential.

Copying rules alone will not activate RSVP, contact, or event-saving functions. Complete the backend steps as well.

## 3. Provision all addresses in admins.txt

The user-supplied `admins.txt` contains three administrator addresses. It is intentionally gitignored and is not included in the hosting output. Keep the source copy in `Z:\Mom Website\admins.txt`.

The following dry run validates the complete list without changing Firebase:

```powershell
node functions/provision-admins.js 'Z:\Mom Website\admins.txt'
```

To apply, use trusted Google Application Default Credentials with Firebase Authentication and Realtime Database administration permissions for this project. For example, authenticate with the Google Cloud CLI using `gcloud auth application-default login`, then run:

```powershell
node functions/provision-admins.js 'Z:\Mom Website\admins.txt' --apply
```

The script creates missing Authentication accounts and sets `admins/<UID>` to `true` for every listed address. It does not generate or email passwords. Each new administrator can select **Reset password** on `admin.html` to set their own password using Firebase's email flow. Use Firebase's normal account recovery flow rather than putting passwords in source code.

Manual alternative: create each user in Authentication → Users, copy their UID, and add a boolean `true` at `admins/<UID>` in the Realtime Database Data tab. UIDs, not email addresses, are the keys. Removing that flag revokes authorization even if the user still has a valid login token. This setup does not automatically remove previously provisioned administrators when the text file changes; remove their flags explicitly.

## 4. Email delivery

The public contact form and RSVP form use callable functions. Each submission is stored privately and an email notification is attempted. The admin dashboard shows pending, sending, sent, or failed delivery and offers a retry for unsent notifications. A saved submission remains visible if email delivery fails. SMTP has no universal exactly-once guarantee: after an interrupted delivery, a retry can produce a duplicate email.

Enable the Blaze billing plan before deploying Cloud Functions. Set up the desired SMTP provider and a verified sending address. The notification recipient is `hthlifecoaching@gmail.com`; keep mail routing in server configuration.

Copy `functions/.env.example` to `functions/.env.hearttoheart-14e56` and fill `MAIL_TO` and `MAIL_FROM`. Keep this file private. The SMTP connection string is stored in Firebase Secret Manager:

```powershell
npx firebase functions:secrets:set SMTP_URL --project hearttoheart-14e56
```

Paste the connection string into the CLI secret prompt, not into a public file or chat. A typical format is `smtps://URL_ENCODED_USER:URL_ENCODED_PASSWORD@SMTP_HOST:465`. Use provider-specific SMTP settings. Firebase is the backend; it is not itself a general outbound email provider.

For a Gmail sender with a Google app password, use `scripts/configure-gmail.ps1 -Sender "sender@gmail.com"` from PowerShell. It prompts with masked input, verifies SMTP authentication without sending email, and uploads directly to Secret Manager. It never saves the password in a local file. The sender needs two-step verification and an app password. Changing the Gmail account password can revoke app passwords; rerun this setup and redeploy the functions after rotating the credential.

Functions use zero minimum instances and a maximum of two instances per function. This limits concurrent scaling, not total monthly spending. Configure billing alerts and a Cloud Functions spend cap separately if desired. Keep only recent deployment images with `firebase functions:artifacts:setpolicy --days 1 --project hearttoheart-14e56`.

## 5. Build and deploy when ready

```powershell
npm ci
npm --prefix functions ci
npm run build
npm test
npx firebase login
npx firebase deploy --only database,functions --project hearttoheart-14e56
```

GitHub Pages hosts the static website using the repository Actions workflow. After configuring and verifying the backend, set `backendEnabled: true` in `assets/js/site-config.js`, rebuild, and publish through that workflow. Add `bhumika-p.github.io` to Firebase authorized domains. A Firebase backend deployment does not publish the Pages frontend. Source documents, admin addresses, server email configuration, and credentials are excluded from `dist`.

## 6. Live acceptance check

Sign in with each intended admin account. Create a real session, edit it, verify it is publicly visible, and confirm its timezone/location. Submit an authorized test RSVP and contact message, verify they appear in the dashboard, and verify actual inbox delivery. Delete the test records. Verify an ordinary account cannot see private records or manage events. These production checks have not been run by the local build process.

## Event behavior

The event editor creates 1–26 occurrences every two weeks, preserving local wall-clock time across daylight saving transitions. Each occurrence is independently editable. Start/end dates and timezone are explicit. Events are ordered by date, public pages hide past sessions, and RSVPs can be closed. Deleting an event permanently removes its related website RSVP records after confirmation; administrators should contact affected attendees before deleting an event that people planned to attend.

The RSVP form requests exactly name and email. The confidentiality document is available to read, print with signature lines, and download in its original Word format. No electronic signature requirement was inferred from the source document.

## Change the notification recipient

Set `MAIL_TO=hthlifecoaching@gmail.com` in the private `functions/.env.hearttoheart-14e56` file. Preserve the existing `MAIL_FROM` and SMTP secret when changing only the destination inbox. An existing deployed `MAIL_TO` value overrides the source default, so a GitHub Pages release alone does not change live email routing.

With Firebase access to `hearttoheart-14e56`, deploy the three email-producing functions:

```sh
npx firebase deploy --project hearttoheart-14e56 --only functions:submitRsvp,functions:submitContact,functions:retryNotification
```

Verify that all three deployed functions have `MAIL_TO=hthlifecoaching@gmail.com`. Then use a clearly labeled test contact message and a test RSVP to confirm delivery to the new inbox. Existing messages remain in the admin dashboard; messages previously delivered to the old inbox are not moved.
