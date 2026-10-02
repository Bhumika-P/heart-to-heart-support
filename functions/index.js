import {initializeApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {onInit} from 'firebase-functions/v2/core';
import {defineSecret,defineString} from 'firebase-functions/params';
import {createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {text,id,eventInput,occurrences,rsvpInput,contactInput} from './validation.js';
const emulated=process.env.FUNCTIONS_EMULATOR==='true';
const databaseURL=defineString('DATABASE_URL',{default:'https://hearttoheart-14e56-default-rtdb.firebaseio.com'});
const mailTo=defineString('MAIL_TO',{default:'hthlifecoaching@gmail.com'});
const mailFrom=defineString('MAIL_FROM',{default:''});
const smtp=defineSecret('SMTP_URL');
let db;
// Parameters resolve at runtime, after the CLI has analyzed the function exports.
onInit(()=>{
  initializeApp({databaseURL:emulated?'https://demo-heart-to-heart-default-rtdb.firebaseio.com':databaseURL.value()});
  db=getDatabase();
});
const options={region:'us-central1',minInstances:0,maxInstances:2,timeoutSeconds:60};
const hash=value=>createHash('sha256').update(value).digest('hex');
const validate=(fn,value)=>{try{return fn(value);}catch(error){throw new HttpsError('invalid-argument',error.message);}};
async function admin(request){if(!request.auth||(await db.ref(`admins/${request.auth.uid}`).get()).val()!==true)throw new HttpsError('permission-denied','Administrator access is required.');}
async function throttle(request,kind,email){
  if(request.data?.website)throw new HttpsError('invalid-argument','Unable to submit this form.');
  // One fixed record per hash, with expiring counters, avoids accumulating raw IPs.
  for(const [key,limit] of [[`ip:${request.rawRequest.ip||'unknown'}`,20],[`email:${email}`,5]]){
    const now=Date.now(); const result=await db.ref(`rateLimits/${hash(kind+key)}`).transaction(old=>{
      const value=old&&old.expiresAt>now?old:{count:0,expiresAt:now+3600000};
      if(value.count>=limit)return;return {...value,count:value.count+1};
    });if(!result.committed)throw new HttpsError('resource-exhausted','Too many requests. Please try again in an hour.');
  }
}
async function notify(path,subject,body,replyTo){
  const delivery=db.ref(`${path}/delivery`);
  const lock=await delivery.transaction(old=>{
    if(old?.status==='sent'||(old?.status==='sending'&&old.at>Date.now()-120000))return;
    return {status:'sending',at:Date.now()};
  });
  if(!lock.committed)return;
  try{
    if(emulated){await delivery.set({status:'sent',at:Date.now(),emulated:true});return;}
    if(!mailTo.value()||!mailFrom.value()||!smtp.value())throw Error('Email provider not configured');
    const transport=nodemailer.createTransport(smtp.value(),{connectionTimeout:10000,socketTimeout:15000});
    await transport.sendMail({from:mailFrom.value(),to:mailTo.value(),replyTo,subject,text:body});
    await delivery.set({status:'sent',at:Date.now()});
  }catch{await delivery.set({status:'failed',at:Date.now()});}
}
function rsvpMail(record,event){return `A session RSVP has been received.\n\nName: ${record.name}\nEmail: ${record.email}\nSession: ${event.name}\nWhen: ${new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeStyle:'short',timeZone:event.timezone}).format(event.startAt)} (${event.timezone})\nLocation: ${event.locationTitle}\n${event.address}\n\nView attendees in the admin dashboard. Please keep participant information confidential.`;}
export const saveEvent=onCall(options,async request=>{
  await admin(request);
  const data=request.data||{};
  if(data.id){
    const key=validate(id,data.id),event=validate(eventInput,data);
    const result=await db.ref(`events/${key}`).transaction(old=>{
      // RTDB first invokes transactions with a possibly empty local cache.
      // Returning null lets the server retry with the current record.
      if(!old)return null;
      if(old.updatedAt!==data.updatedAt)return;
      return {...event,createdAt:old.createdAt,updatedAt:Date.now(),seriesId:old.seriesId||key};
    });if(!result.committed||!result.snapshot.exists())throw new HttpsError('aborted','This event changed or was deleted. Reload it before saving.');
    return {ids:[key]};
  }
  const entries=validate(occurrences,data),updates={},ids=[];
  const seriesId=db.ref('events').push().key;
  for(const event of entries){const key=db.ref('events').push().key;ids.push(key);updates[`events/${key}`]={...event,seriesId,createdAt:Date.now(),updatedAt:Date.now()};}
  await db.ref().update(updates);return {ids};
});
export const deleteEvent=onCall(options,async request=>{
  await admin(request);const key=validate(id,request.data?.id);
  // Removing an event also removes its private RSVP records.
  await db.ref().update({[`events/${key}`]:null,[`rsvps/${key}`]:null});return {ok:true};
});
export const submitRsvp=onCall({...options,secrets:[smtp]},async request=>{
  const data=validate(rsvpInput,request.data||{});await throttle(request,'rsvp',data.email);
  const event=(await db.ref(`events/${data.eventId}`).get()).val();
  if(!event||!event.rsvpOpen||event.startAt<=Date.now())throw new HttpsError('failed-precondition','This session is no longer accepting RSVPs. Please choose another session.');
  const key=hash(data.email),path=`rsvps/${data.eventId}/${key}`;
  const record={name:data.name,email:data.email,createdAt:Date.now(),delivery:{status:'pending',at:Date.now()}};
  const result=await db.ref(path).transaction(old=>old?undefined:record);
  // A repeat never overwrites someone else's name or reveals whether they registered.
  if(result.committed)await notify(path,`Session RSVP: ${event.name}`,rsvpMail(record,event),data.email);
  return {ok:true,message:'Thank you. Your RSVP has been received. We look forward to welcoming you.'};
});
export const submitContact=onCall({...options,secrets:[smtp]},async request=>{
  const data=validate(contactInput,request.data||{});await throttle(request,'contact',data.email);
  // A request token prevents retries from creating duplicate messages.
  const requestId=validate(id,request.data.requestId);
  const key=hash(data.email+requestId),path=`messages/${key}`;
  const result=await db.ref(path).transaction(old=>old?undefined:{...data,createdAt:Date.now(),delivery:{status:'pending',at:Date.now()}});
  if(result.committed)await notify(path,`Website contact: ${data.subject}`,`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,data.email);
  return {ok:true,message:'Thank you. Your message has been received.'};
});
export const retryNotification=onCall({...options,secrets:[smtp]},async request=>{
  await admin(request);const data=request.data||{};let path,record,event;
  if(data.kind==='rsvp'){
    const eventId=validate(id,data.eventId),recordId=validate(id,data.recordId);path=`rsvps/${eventId}/${recordId}`;
    [record,event]=await Promise.all([db.ref(path).get().then(s=>s.val()),db.ref(`events/${eventId}`).get().then(s=>s.val())]);
    if(!record||!event)throw new HttpsError('not-found','Record not found.');
    await notify(path,`Session RSVP: ${event.name}`,rsvpMail(record,event),record.email);
  }else if(data.kind==='contact'){
    path=`messages/${validate(id,data.recordId)}`;record=(await db.ref(path).get()).val();
    if(!record)throw new HttpsError('not-found','Message not found.');
    await notify(path,`Website contact: ${record.subject}`,`Name: ${record.name}\nEmail: ${record.email}\n\n${record.message}`,record.email);
  }else throw new HttpsError('invalid-argument','Invalid notification type.');
  return {status:(await db.ref(`${path}/delivery/status`).get()).val()};
});
export const deleteRecord=onCall(options,async request=>{
  await admin(request);const data=request.data||{},key=validate(id,data.recordId);
  if(data.kind==='contact')await db.ref(`messages/${key}`).remove();
  else if(data.kind==='rsvp')await db.ref(`rsvps/${validate(id,data.eventId)}/${key}`).remove();
  else throw new HttpsError('invalid-argument','Invalid record type.');
  return {ok:true};
});
