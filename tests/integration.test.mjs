import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DateTime} from '../functions/node_modules/luxon/build/es6/luxon.mjs';
const project='demo-heart-to-heart',ns=project+'-default-rtdb';
const endpoint=`http://127.0.0.1:9000`,authURL='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
async function database(path,method='GET',data,token){const url=`${endpoint}/${path}.json?ns=${ns}${token&&token!=='owner'?'&auth='+encodeURIComponent(token):''}`;const response=await fetch(url,{method,headers:{'Content-Type':'application/json',...(token==='owner'?{Authorization:'Bearer owner'}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,data:await response.json()};}
async function signup(email){const response=await fetch(`${authURL}/accounts:signUp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'LocalTestOnly!42',returnSecureToken:true})});const data=await response.json();assert.ok(data.idToken,JSON.stringify(data));return data;}
async function call(name,data,token){const response=await fetch(`http://127.0.0.1:5001/${project}/us-central1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data})});return {status:response.status,...await response.json()};}
const event={name:'LOCAL TEST Morning Session',description:'Local emulator session only.',locationTitle:'Test room',address:'123 Example Street',timezone:'America/Chicago',session:'morning',startLocal:'2030-10-26T10:00',endLocal:'2030-10-26T11:30',rsvpOpen:true,occurrences:2};
test('complete local backend and database privacy flow',async()=>{
  const rules=JSON.parse(await readFile(new URL('../firebase-realtime-database-rules.json',import.meta.url),'utf8'));
  assert.equal((await database('.settings/rules','PUT',rules,'owner')).status,200);
  await database('','PUT',{},'owner');
  const suffix=Date.now(),admin=await signup(`admin-${suffix}@example.test`),visitor=await signup(`visitor-${suffix}@example.test`);
  await database(`admins/${admin.localId}`,'PUT',true,'owner');
  assert.equal((await database('events')).status,200);
  for(const path of ['rsvps','messages','admins','rateLimits','eventSubscriptions','subscriptionInvitations'])assert.notEqual((await database(path)).status,200,`${path} must be private`);
  assert.notEqual((await database('rsvps','GET',undefined,visitor.idToken)).status,200);
  assert.notEqual((await database(`admins/${visitor.localId}`,'PUT',true,visitor.idToken)).status,200);
  assert.notEqual((await database('events/hacked','PUT',event,admin.idToken)).status,200,'Even admins must use validated functions');
  assert.equal((await call('saveEvent',event)).error.status,'PERMISSION_DENIED');
  assert.equal((await call('saveEvent',event,visitor.idToken)).error.status,'PERMISSION_DENIED');
  const saved=await call('saveEvent',event,admin.idToken);assert.ok(saved.result,JSON.stringify(saved));assert.equal(saved.result.ids.length,2);
  const eventId=saved.result.ids[0];let value=(await database(`events/${eventId}`)).data;
  const edited=await call('saveEvent',{...value,id:eventId,name:'Edited local session'},admin.idToken);assert.ok(edited.result,JSON.stringify(edited));assert.equal(edited.result.ids[0],eventId);
  assert.equal((await call('saveEvent',{...value,id:eventId,name:'Stale edit'},admin.idToken)).error.status,'ABORTED');
  const rsvp={eventId,name:'Local Visitor',email:'local-visitor@example.test',reminderOptIn:true};
  assert.equal((await call('submitRsvp',rsvp)).result.ok,true);
  assert.equal((await call('submitRsvp',{...rsvp,name:'Different name'})).result.ok,true);
  const records=(await database(`rsvps/${eventId}`,'GET',undefined,admin.idToken)).data;
  assert.equal(Object.keys(records).length,1);const record=Object.values(records)[0];assert.equal(record.name,'Local Visitor');assert.equal(record.delivery.status,'sent');assert.equal(record.delivery.emulated,true);assert.equal(record.confirmationDelivery.status,'sent');assert.equal(record.reminderOptIn,true);
  const recordId=Object.keys(records)[0],privateUpdate={kind:'rsvp',eventId,recordId,attended:true,reminderOptIn:false,sponsorshipStatus:'arranged',sponsorshipNote:'Local test sponsor'};
  // Existing 24-hour opt-ins never become recurring subscribers automatically.
  assert.equal((await database('eventSubscriptions','GET',undefined,'owner')).data,null);
  const address='subscription@example.test',subscriberId=createHash('sha256').update(address).digest('hex');
  assert.equal((await call('subscribeToEvents',{email:address})).result.ok,true);
  let subscription=(await database(`eventSubscriptions/${subscriberId}`,'GET',undefined,'owner')).data;
  assert.equal(subscription.status,'pending');assert.equal(subscription.confirmationDelivery.emulated,true);
  const confirmToken=subscriberId+'.'+subscription.confirmationToken,unsubscribeToken=subscriberId+'.'+subscription.unsubscribeToken;
  assert.equal((await call('confirmEventSubscription',{token:subscriberId+'.'+'0'.repeat(64)})).error.status,'FAILED_PRECONDITION');
  assert.equal((await call('confirmEventSubscription',{token:confirmToken})).result.ok,true);
  assert.equal((await call('confirmEventSubscription',{token:confirmToken})).result.ok,true);
  // Exercise the actual scheduled HTTP handler entirely inside the emulator.
  const weekStart=DateTime.now().setZone('America/Chicago').plus({weeks:1}).startOf('day');
  for(const [session,hours] of [['morning',0],['evening',8]]){
    const start=weekStart.plus({hours}),end=start.plus({hours:1});
    assert.ok((await call('saveEvent',{...event,session,occurrences:1,startLocal:start.toFormat("yyyy-MM-dd'T'HH:mm"),endLocal:end.toFormat("yyyy-MM-dd'T'HH:mm")},admin.idToken)).result);
  }
  async function sweep(){const response=await fetch(`http://127.0.0.1:5001/${project}/us-central1/sendUpcomingEventInvitations-0`,{method:'POST',headers:{'X-CloudScheduler-JobName':'local-test'}});assert.equal(response.status,200,await response.text());}
  await sweep();
  let invitations=(await database(`subscriptionInvitations/${subscriberId}`,'GET',undefined,'owner')).data;
  assert.equal(Object.keys(invitations).length,1);const firstDelivery=Object.values(invitations)[0].delivery;
  assert.equal(firstDelivery.status,'sent');assert.equal(firstDelivery.emulated,true);
  await sweep();invitations=(await database(`subscriptionInvitations/${subscriberId}`,'GET',undefined,'owner')).data;
  assert.deepEqual(Object.values(invitations)[0].delivery,firstDelivery);
  assert.equal((await call('unsubscribeFromEvents',{token:unsubscribeToken})).result.ok,true);
  assert.equal((await call('unsubscribeFromEvents',{token:unsubscribeToken})).result.ok,true);
  assert.equal((await database(`eventSubscriptions/${subscriberId}`,'GET',undefined,'owner')).data.status,'unsubscribed');
  await database(`subscriptionInvitations/${subscriberId}`,'DELETE',undefined,'owner');await sweep();
  assert.equal((await database(`subscriptionInvitations/${subscriberId}`,'GET',undefined,'owner')).data,null);
  assert.equal((await call('confirmEventSubscription',{token:confirmToken})).error.status,'FAILED_PRECONDITION');
  assert.equal((await database(`rsvps/${eventId}/${recordId}`,'GET',undefined,'owner')).data.reminderOptIn,true);
  // Resubscription requires fresh confirmation; old links cannot cancel the new generation.
  assert.equal((await call('submitRsvp',{...rsvp,subscriptionOptIn:true})).result.ok,true);
  const rsvpSubscriberId=createHash('sha256').update(rsvp.email).digest('hex');
  assert.equal((await database(`eventSubscriptions/${rsvpSubscriberId}`,'GET',undefined,'owner')).data.status,'pending');
  assert.equal((await call('subscribeToEvents',{email:address})).result.ok,true);
  subscription=(await database(`eventSubscriptions/${subscriberId}`,'GET',undefined,'owner')).data;
  assert.equal(subscription.status,'pending');assert.notEqual(subscription.confirmationToken,confirmToken.split('.')[1]);
  assert.equal((await call('unsubscribeFromEvents',{token:unsubscribeToken})).error.status,'FAILED_PRECONDITION');
  await database(`eventSubscriptions/${subscriberId}/confirmationExpiresAt`,'PUT',Date.now()-1,'owner');
  assert.equal((await call('confirmEventSubscription',{token:subscriberId+'.'+subscription.confirmationToken})).error.status,'FAILED_PRECONDITION');
  assert.equal((await database('eventSubscriptions','GET',undefined,admin.idToken)).status,401);
  assert.equal((await call('updatePrivateRecord',privateUpdate,visitor.idToken)).error.status,'PERMISSION_DENIED');
  assert.equal((await call('updatePrivateRecord',privateUpdate,admin.idToken)).result.ok,true);
  const updated=(await database(`rsvps/${eventId}/${recordId}`,'GET',undefined,admin.idToken)).data;
  assert.equal(updated.attended,true);assert.equal(updated.reminderOptIn,false);assert.equal(updated.sponsorshipStatus,'arranged');assert.equal(updated.email,record.email);
  assert.equal((await call('updatePrivateRecord',{...privateUpdate,sponsorshipStatus:'invalid'},admin.idToken)).error.status,'INVALID_ARGUMENT');
  assert.equal((await call('retryNotification',{kind:'rsvp',eventId,recordId,audience:'participant'},admin.idToken)).result.status,'sent');
  assert.notEqual((await database(`rsvps/${eventId}`)).status,200);
  value=(await database(`events/${eventId}`)).data;
  await call('saveEvent',{...value,id:eventId,rsvpOpen:false},admin.idToken);
  assert.equal((await call('submitRsvp',{...rsvp,email:'closed@example.test'})).error.status,'FAILED_PRECONDITION');
  const message={name:'Test Sender',email:'test-sender@example.test',subject:'Local test',message:'This is an emulator-only contact message.',requestId:'local-test-token'};
  assert.equal((await call('submitContact',message)).result.ok,true);
  assert.equal((await call('submitContact',message)).result.ok,true);
  const messages=(await database('messages','GET',undefined,admin.idToken)).data;assert.equal(Object.keys(messages).length,1);
  const messageId=Object.keys(messages)[0];assert.equal((await call('updatePrivateRecord',{kind:'contact',recordId:messageId,handled:true},admin.idToken)).result.ok,true);
  assert.equal((await database(`messages/${messageId}`,'GET',undefined,admin.idToken)).data.handled,true);
  assert.equal((await call('submitContact',{...message,website:'spam'})).error.status,'INVALID_ARGUMENT');
  assert.equal((await call('submitContact',{...message,email:'not-an-email'})).error.status,'INVALID_ARGUMENT');
  assert.equal((await call('deleteRecord',{kind:'contact',recordId:messageId},visitor.idToken)).error.status,'PERMISSION_DENIED');
  await call('deleteRecord',{kind:'contact',recordId:messageId},admin.idToken);assert.equal((await database(`messages/${messageId}`,'GET',undefined,admin.idToken)).data,null);
  await call('deleteEvent',{id:eventId},admin.idToken);assert.equal((await database(`events/${eventId}`)).data,null);assert.equal((await database(`rsvps/${eventId}`,'GET',undefined,admin.idToken)).data,null);
  await database(`admins/${admin.localId}`,'DELETE',undefined,'owner');
  assert.equal((await call('saveEvent',event,admin.idToken)).error.status,'PERMISSION_DENIED');
  assert.notEqual((await database('messages','GET',undefined,admin.idToken)).status,200);
});
