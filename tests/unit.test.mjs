import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {eventInput,occurrences,rsvpInput,contactInput} from '../functions/validation.js';
const base={name:'Morning support',description:'A welcoming session.',locationTitle:'Community room',address:'123 Example Street',timezone:'America/Chicago',session:'morning',startLocal:'2030-10-26T10:00',endLocal:'2030-10-26T11:30',rsvpOpen:true};
test('biweekly recurrence preserves local time across daylight saving',()=>{const rows=occurrences({...base,occurrences:3},0);assert.equal(rows.length,3);assert.equal(rows[1].startLocal,'2030-11-09T10:00');assert.equal(rows[1].startAt-rows[0].startAt,14*86400000+3600000);});
test('event validation rejects invalid duration, recurrence, zones and past dates',()=>{for(const value of [{...base,endLocal:'2030-10-26T09:00'},{...base,timezone:'invalid/zone'},{...base,startLocal:'2000-01-01T10:00'}])assert.throws(()=>eventInput(value));assert.throws(()=>occurrences({...base,occurrences:100}));assert.throws(()=>eventInput({...base,startLocal:'2030-03-10T02:30',endLocal:'2030-03-10T04:00'},0));});
test('forms validate data and normalize email without HTML interpretation',()=>{assert.equal(rsvpInput({eventId:'abc',name:'<script>name</script>',email:' PERSON@EXAMPLE.COM '}).email,'person@example.com');assert.throws(()=>rsvpInput({eventId:'../admins',name:'X',email:'a@b.com'}));assert.throws(()=>contactInput({name:'X',email:'x@y.com\r\nBcc:a@b.com',subject:'X',message:'This is a message'}));assert.throws(()=>contactInput({name:'X',email:'a@b.com',subject:'X',message:'short'}));});
test('public HTML preserves the complete source home and about wording',async()=>{const source=JSON.parse((await readFile(new URL('../docs/source-content.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');for(const [key,file,start] of [['Home Page','index.html',1],['ABOUT','about.html',2]]){const page=await readFile(new URL('../'+file,import.meta.url),'utf8');for(const paragraph of source[key].slice(start))assert.ok(page.includes(escape(paragraph)),`${file} missing: ${paragraph.slice(0,70)}`);}});
test('rules expose events only and never permit direct client writes',async()=>{const rules=JSON.parse(await readFile(new URL('../firebase-realtime-database-rules.json',import.meta.url),'utf8'));assert.equal(rules.rules['.read'],false);assert.equal(rules.rules['.write'],false);assert.equal(rules.rules.events['.read'],true);assert.match(rules.rules.rsvps['.read'],/admins/);assert.match(rules.rules.messages['.read'],/admins/);});
test('release versions agree in packages, public metadata, and every built footer',async()=>{const root=resolve(import.meta.dirname,'..');const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));const functions=JSON.parse(await readFile(resolve(root,'functions/package.json'),'utf8'));assert.equal(functions.version,pkg.version);assert.equal((await readFile(resolve(root,'dist/assets/data/version.txt'),'utf8')).trim(),pkg.version);for(const file of (await readdir(resolve(root,'dist'))).filter(f=>f.endsWith('.html'))){assert.ok((await readFile(resolve(root,'dist',file),'utf8')).includes(`<span data-version>v${pkg.version}</span>`));}});
test('all internal HTML file links resolve and public build excludes private source files',async()=>{const root=resolve(import.meta.dirname,'..');for(const file of (await readdir(root)).filter(f=>f.endsWith('.html'))){const page=await readFile(resolve(root,file),'utf8');for(const match of page.matchAll(/(?:href|src)="([^"]+)"/g)){const url=match[1];if(/^(https?:|#|mailto:)/.test(url))continue;const path=decodeURIComponent(url.split(/[?#]/)[0]);if(path.startsWith('assets/js/'))continue;await readFile(resolve(root,path));}}const dist=await readdir(resolve(root,'dist'));assert.ok(!dist.includes('admins.txt'));assert.ok(!dist.includes('functions'));const contact=await readFile(resolve(root,'dist/contact.html'),'utf8');assert.ok(!contact.includes('heartsriseagain@gmail.com'));});

import {participantMail,reminderDue} from '../functions/participant-mail.js';
import {meetingGroups,invitationDue,invitationMail,parseSubscriptionToken,subscriptionLink} from '../functions/event-subscriptions.js';
import {DateTime} from '../functions/node_modules/luxon/build/es6/luxon.mjs';
test('subscription opt-in is explicit and independent of the 24-hour reminder',()=>{
 const data={eventId:'event',name:'Visitor',email:'visitor@example.test'};
 assert.equal(rsvpInput(data).subscriptionOptIn,false);
 assert.equal(rsvpInput({...data,subscriptionOptIn:'on',reminderOptIn:true}).subscriptionOptIn,false);
 assert.equal(rsvpInput({...data,subscriptionOptIn:true}).reminderOptIn,false);
 assert.equal(rsvpInput({...data,reminderOptIn:true}).subscriptionOptIn,false);
});
test('one calendar-week invitation groups both sessions and preserves local time across DST',()=>{
 const morning=eventInput({...base,startLocal:'2030-11-04T10:00',endLocal:'2030-11-04T11:30'},0);
 const evening=eventInput({...base,session:'evening',startLocal:'2030-11-04T18:00',endLocal:'2030-11-04T19:30'},0);
 const next=eventInput({...base,startLocal:'2030-11-18T10:00',endLocal:'2030-11-18T11:30'},0);
 const groups=meetingGroups({morning,evening,next},0);
 assert.equal(groups.length,2);assert.equal(groups[0].sessions.length,2);
 assert.equal(DateTime.fromMillis(groups[0].dueAt,{zone:base.timezone}).toFormat("yyyy-MM-dd'T'HH:mm"),'2030-10-28T10:00');
 assert.equal(morning.startAt-groups[0].dueAt,7*86400000+3600000);
 const active={status:'active',confirmedAt:groups[0].dueAt-1};
 assert.equal(invitationDue(groups[0],active,groups[0].dueAt-1),false);
 assert.equal(invitationDue(groups[0],active,groups[0].dueAt),true);
 assert.equal(invitationDue(groups[0],{...active,status:'pending'},groups[0].dueAt),false);
 assert.equal(invitationDue(groups[0],{...active,status:'unsubscribed'},groups[0].dueAt),false);
 assert.equal(invitationDue(groups[0],active,groups[0].dueAt+86400000),false);
 const body=invitationMail(groups[0],'https://example.test/unsubscribe');
 for(const text of ['MORNING SESSION','EVENING SESSION','10:00 AM','6:00 PM','RSVPs are open.','$10','Book costs are separate','sponsorship','schedule.html','example.test/unsubscribe','separate 24-hour'])assert.ok(body.includes(text),text);
 const missing=invitationMail(meetingGroups({morning},0)[0],'unsubscribe');assert.ok(missing.includes('No session has been published'));
});
test('subscription management links are opaque, validated, and kept in URL fragments',()=>{
 const key='a'.repeat(64),nonce='b'.repeat(64),link=subscriptionLink('unsubscribe',key,nonce);
 assert.deepEqual(parseSubscriptionToken(key+'.'+nonce),[key,nonce]);
 assert.ok(link.includes('subscription.html#action=unsubscribe'));assert.ok(!link.includes('@'));
 for(const token of ['',key,'../events','a'.repeat(500)])assert.throws(()=>parseSubscriptionToken(token));
});
test('reminders require opt-in, remain within the send window, and stop once sent',()=>{
 const now=100000000,event={startAt:now+24*3600000};
 assert.equal(reminderDue(event,{reminderOptIn:true},now),true);
 assert.equal(reminderDue(event,{reminderOptIn:false},now),false);
 assert.equal(reminderDue(event,{reminderOptIn:true,reminderDelivery:{status:'sent'}},now),false);
 assert.equal(reminderDue({startAt:now-1},{reminderOptIn:true},now),false);
 assert.equal(reminderDue({startAt:now+26*3600000},{reminderOptIn:true},now),false);
 assert.equal(reminderDue({startAt:now+30*60000},{reminderOptIn:true},now),false);
 assert.equal(reminderDue(event,{reminderOptIn:true,reminderDelivery:{status:'failed'}},now),true);
});
test('confirmation and reminder include the selected session and contact information',()=>{
 const event={name:'Morning meeting',startAt:Date.UTC(2030,0,1,16),endAt:Date.UTC(2030,0,1,18),timezone:'America/Chicago',locationTitle:'Community Room',address:'123 Example Street'};
 const confirmation=participantMail({reminderOptIn:true},event);
 for(const phrase of ['Morning meeting','10:00 AM','12:00 PM','Community Room','123 Example Street','$10','hthlifecoaching@gmail.com','schedule.html','requested a reminder'])assert.ok(confirmation.includes(phrase),phrase);
 assert.ok(!participantMail({reminderOptIn:false},event).includes('requested a reminder'));
 assert.ok(participantMail({},event,true).includes('requested reminder'));
});
