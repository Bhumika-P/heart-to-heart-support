import test from 'node:test';
import assert from 'node:assert/strict';
import {contactMail} from '../functions/contact-email.js';

const record={name:'Jamie Example',email:'jamie+support@example.org',subject:'Question about sessions',message:'Hello Sherée,\nCould you tell me more about the support group?'};
test('Support Group contact email includes form fields, HTML, and a readable text alternative',()=>{
  const mail=contactMail(record);
  assert.match(mail.html,/SUPPORT GROUP CONTACT/);
  assert.match(mail.html,/background:#65283b/);
  for(const value of [record.name,record.email,record.subject])assert.ok(mail.html.includes(value));
  assert.match(mail.html,/Hello Sherée,<br>Could you/);
  for(const value of Object.values(record))assert.ok(mail.text.includes(value));
  assert.equal(mail.subject,'Support Group contact: Question about sessions');
  assert.equal(mail.replyTo,record.email);
  assert.doesNotMatch(mail.html,/MAIN WEBSITE|Selected interests|Preferred call times/);
});
test('Reply button targets the submitting email and preserves the original subject safely',()=>{
  const mail=contactMail({...record,subject:'Books & "healing"?'});
  const href=mail.html.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&');
  const url=new URL(href);
  assert.equal(url.protocol,'mailto:');
  assert.equal(decodeURIComponent(url.pathname),record.email);
  assert.equal(url.searchParams.get('subject'),'Re: Books & "healing"?');
});
test('Visitor markup is escaped and message line endings are preserved as line breaks',()=>{
  const mail=contactMail({...record,name:'<img src=x onerror=alert(1)>',subject:'<script>alert(1)</script>',message:'First\r\n<script>bad()</script>\rLast'});
  assert.doesNotMatch(mail.html,/<script>|<img/);
  assert.match(mail.html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(mail.html,/First<br>&lt;script&gt;bad\(\)&lt;\/script&gt;<br>Last/);
});
