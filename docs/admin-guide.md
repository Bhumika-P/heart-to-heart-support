# Running the Heart to Heart website

## Sign in

Open https://bhumika-p.github.io/heart-to-heart-support/admin.html and use an address listed in the private `admins.txt`. For a new account, enter the email address and select **Reset password**, then follow Google's email to set a password. Check spam if it does not arrive. Account passwords and email-sending app passwords are separate credentials.

## Publish sessions

Enter the event name, morning/evening selection, start and end, timezone, location, address or public joining instructions, and description. Select how many sessions to create every two weeks, then **Save Session**. Each date can be edited independently. Create morning and evening series separately. Check the public schedule after saving.

Locations and descriptions are public. Do not include private meeting passwords or participant information. Past events disappear from the public upcoming schedule. Turn off **Accept RSVPs** to close registration without deleting the event. Deleting an event also deletes its stored RSVP records.

## RSVPs and messages

Select **View RSVPs** for a session to see the private participant list. Select **Contact Messages** to read incoming messages. The notification recipient is now configured as hthlifecoaching@gmail.com. This destination takes effect after the notification functions are redeployed with the updated MAIL_TO setting. **Email notification: sent** means the email server accepted it; check the receiving inbox for delivery.

If delivery shows failed or pending, the submission is still stored. Use **Retry Email** after the email configuration is restored. Do not repeatedly retry a message already accepted by the email server. Treat participant details and message content as confidential.

## Before the first meeting

Publish the actual dates and locations, check them on the public schedule, and read the confidentiality agreement. Members can read, print, or download the original agreement. The website does not collect electronic signatures, payments, or member accounts.

## Release 1.3.0: RSVP viewer and private follow-up

Click **View RSVPs** for a session to open the private RSVP dialog. It opens in Cards mode; choose Expandable List for collapsible attendee rows. Only the X closes the viewer. Names and email addresses stay private to authorized administrators.

Each record shows administrator notification and participant-confirmation delivery separately. Retry a failed confirmation from that record. Save attendance, reminder preference, sponsorship status (none/requested/arranged), and a private sponsorship note. Use the reminder checkbox to stop a participant's requested reminder if they ask. Do not enable reminders without the participant's permission. Contact messages can be marked handled or unhandled.

New RSVPs receive a confirmation email. A visitor can explicitly opt in to one reminder roughly 24 hours before the selected session. An hourly scheduled function checks upcoming sessions and uses per-record delivery locks. Existing RSVP records have no reminder consent and will not be enrolled automatically. Gmail sends each email individually; no attendee list is shared with other participants.

Deploy `submitRsvp`, `retryNotification`, `updatePrivateRecord`, and `sendSessionReminders` plus the database rules with the Firebase CLI. The scheduled function needs Cloud Scheduler; Firebase may require the relevant Google Cloud APIs and billing already used for the existing functions. GitHub Pages publishing alone does not deploy these functions. Retain the existing SMTP_URL secret and MAIL_FROM/MAIL_TO settings.

The agreement PDF is generated from the reviewed text in `docs/source-content.json` using `scripts/create-agreement-pdf.py` (ReportLab). Actual cover images come from Sherée's author Books page; see `docs/image-assets.md`.
