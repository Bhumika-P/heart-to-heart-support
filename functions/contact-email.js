// Visitor-provided fields remain text, even inside links and HTML attributes.
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function contactMail(record){
  const row=(label,value)=>`<tr><td style="padding:8px 0;color:#765c61;font-size:13px;font-weight:bold">${label}<br><span style="color:#30262a;font-size:16px;font-weight:normal;overflow-wrap:anywhere">${escapeHtml(value)}</span></td></tr>`;
  const panel=(title,content)=>`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;border:1px solid #d9c9b8;background:#fffdf9"><tr><td style="padding:20px"><h2 style="margin:0 0 12px;color:#65283b;font-size:19px">${title}</h2>${content}</td></tr></table>`;
  const reply=escapeHtml(`mailto:${encodeURIComponent(record.email)}?subject=${encodeURIComponent(`Re: ${record.subject}`)}`);
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Support Group Contact</title></head>
<body style="margin:0;background:#f2ece3;color:#30262a;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#faf7f1">
<tr><td style="padding:28px 24px;background:#65283b;color:#ffffff;text-align:center">
<div style="font-family:Georgia,serif;font-size:30px;font-weight:bold">Heart to Heart</div>
<div style="font-size:14px">Hope &amp; Healing</div>
<div style="margin-top:16px;font-size:12px;letter-spacing:2px;font-weight:bold">SUPPORT GROUP CONTACT</div></td></tr>
<tr><td style="padding:26px 24px"><h1 style="margin:0 0 8px;color:#65283b;font-size:25px">New contact submission</h1>
<p style="margin:0 0 24px">Someone has reached out through the Heart to Heart Support Group website.</p>
${panel('Contact details',`<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${row('Your name',record.name)}${row('Email address',record.email)}${row('Subject',record.subject)}</table>`)}
${panel('Message',`<p style="margin:0;overflow-wrap:anywhere">${escapeHtml(record.message).replace(/\r\n|\r|\n/g,'<br>')}</p>`)}
<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td style="border-radius:4px;background:#65283b;text-align:center"><a href="${reply}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-weight:bold;text-decoration:none">Reply to sender</a></td></tr></table>
<p style="text-align:center;font-size:13px;color:#765c61;margin:16px 0 0">You can also use Reply in your email app.</p></td></tr>
<tr><td style="padding:20px 24px;border-top:1px solid #d9c9b8;font-size:12px;color:#765c61;text-align:center">Heart to Heart Life Coaching LLC<br>Support Group submission · Please keep this message private.</td></tr>
</table></td></tr></table></body></html>`;
  return {
    subject:`Support Group contact: ${record.subject}`,
    replyTo:record.email,
    text:`Heart to Heart — Hope & Healing\nSUPPORT GROUP CONTACT\n\nContact details\nYour name: ${record.name}\nEmail address: ${record.email}\nSubject: ${record.subject}\n\nMessage\n${record.message}\n\nReply to: ${record.email}\n\nSupport Group submission · Please keep this message private.`,
    html
  };
}
