import {DateTime} from 'luxon';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {sessionDetails} from './participant-mail.js';

export const scheduleUrl='https://support.hearttoheartlifecoaching.com/schedule.html';
const subscriptionUrl='https://support.hearttoheartlifecoaching.com/subscription.html';
const day=86400000;
const hash=value=>createHash('sha256').update(value).digest('hex');
export function subscriptionLink(action,key,nonce){return `${subscriptionUrl}#${new URLSearchParams({action,token:`${key}.${nonce}`})}`;}
export function parseSubscriptionToken(token){
  if(typeof token!=='string'||! /^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token))throw Error('This subscription link is invalid.');
  return token.split('.');
}
const matches=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));

// A single invitation covers all published sessions on the same local date.
// Calendar subtraction keeps a week-before reminder at the same local time across DST.
export function meetingGroups(events,now=Date.now()){
  const groups=new Map();
  for(const [id,event] of Object.entries(events)){
    if(event.startAt<=now)continue;
    const start=DateTime.fromMillis(event.startAt,{zone:event.timezone});
    if(!start.isValid)continue;
    const key=hash(`${event.timezone}:${start.toISODate()}`);
    if(!groups.has(key))groups.set(key,{key,date:start.toISODate(),timezone:event.timezone,sessions:[]});
    groups.get(key).sessions.push({id,...event});
  }
  return [...groups.values()].map(group=>{
    group.sessions.sort((a,b)=>a.startAt-b.startAt);
    group.dueAt=DateTime.fromMillis(group.sessions[0].startAt,{zone:group.timezone}).minus({weeks:1}).toMillis();
    return group;
  }).sort((a,b)=>a.dueAt-b.dueAt);
}
export function invitationDue(group,record,now=Date.now()){
  return record.status==='active'&&record.confirmedAt<=now&&group.dueAt<=now&&now<group.dueAt+day;
}
export function invitationMail(group,unsubscribeUrl){
  const sections=['morning','evening'].map(kind=>{
    const sessions=group.sessions.filter(event=>event.session===kind);
    return `${kind==='morning'?'MORNING':'EVENING'} SESSION\n${sessions.length?sessions.map(event=>`${sessionDetails(event)}\n${event.description}\n${event.rsvpOpen?'RSVPs are open.':'RSVPs are currently closed; check the schedule for updates.'}`).join('\n\n'):'No session has been published for this date. Check the schedule for updates.'}`;
  });
  return `Your next Heart to Heart support group meeting is coming up in one week. You receive this invitation because you subscribed to upcoming-event emails.\n\n${sections.join('\n\n')}\n\nMorning and evening sessions offer identical teachings. Choose the session that works for you and reserve your place:\n${scheduleUrl}\n\nSESSION FEE & SPONSORSHIP\nA $10 fee is required each time you attend a session. This helps cover room rental, setup, and other support-group expenses. Book costs are separate. If you need help covering session fees or book costs, please contact Sherée privately about sponsorship assistance.\n\nQuestions: hthlifecoaching@gmail.com or https://support.hearttoheartlifecoaching.com/contact.html\n\nThis subscription does not reserve a place or enable the separate 24-hour RSVP reminder.\nUnsubscribe from upcoming-event emails:\n${unsubscribeUrl}`;
}

export function subscriptionService(db,notify,clock=Date.now){
  async function request(email){
    const key=hash(email),path=`eventSubscriptions/${key}`,now=clock();
    const candidate={email,status:'pending',createdAt:now,confirmationExpiresAt:now+7*day,confirmationToken:randomBytes(32).toString('hex'),unsubscribeToken:randomBytes(32).toString('hex')};
    const result=await db.ref(path).transaction(old=>{
      if(old?.status==='active')return;
      if(old?.status==='pending'&&old.confirmationExpiresAt>now)return old;
      return candidate;
    });
    const record=result.snapshot.val();
    if(!record||record.status!=='pending')return;
    const body=`Please confirm that you want upcoming-event emails from Heart to Heart. You will receive an invitation about one week before each meeting date, with morning and evening session details and an RSVP link.\n\nConfirm your subscription (link expires in 7 days):\n${subscriptionLink('confirm',key,record.confirmationToken)}\n\nA $10 fee is required each time you attend a session; book costs are separate. Contact Sherée privately if you need sponsorship assistance.\n\nIf you did not request this, ignore this email or cancel the request:\n${subscriptionLink('unsubscribe',key,record.unsubscribeToken)}\n\nFuture meetings: ${scheduleUrl}`;
    return await notify(path,'Confirm your Heart to Heart event reminders',body,undefined,record.email,'confirmationDelivery');
  }
  async function confirm(token){
    const [key,nonce]=parseSubscriptionToken(token),now=clock();
    const result=await db.ref(`eventSubscriptions/${key}`).transaction(old=>{
      if(!old)return null;
      if(!matches(old.confirmationToken,nonce)||old.status==='unsubscribed')return;
      if(old.status==='active')return old;
      if(old.confirmationExpiresAt<=now)return;
      return {...old,status:'active',confirmedAt:now};
    });
    if(!result.committed||!result.snapshot.exists())throw Error('This confirmation link has expired or is no longer valid. Please subscribe again.');
  }
  async function unsubscribe(token){
    const [key,nonce]=parseSubscriptionToken(token);
    const result=await db.ref(`eventSubscriptions/${key}`).transaction(old=>{
      if(!old)return null;
      if(!matches(old.unsubscribeToken,nonce))return;
      return {...old,status:'unsubscribed',unsubscribedAt:clock()};
    });
    if(!result.committed||!result.snapshot.exists())throw Error('This unsubscribe link is no longer valid. Use the link in your most recent reminder email.');
  }
  async function sendInvitations(){
    const now=clock(),events=(await db.ref('events').orderByChild('startAt').startAt(now+1).get()).val()||{};
    const groups=meetingGroups(events,now).filter(group=>group.dueAt<=now&&now<group.dueAt+day);
    if(!groups.length)return;
    const records=(await db.ref('eventSubscriptions').get()).val()||{};
    for(const group of groups){
      const date=DateTime.fromISO(group.date,{zone:group.timezone}).toLocaleString(DateTime.DATE_FULL);
      for(const [key,record] of Object.entries(records))if(invitationDue(group,record,now)){
        const stillActive=async()=>{const current=(await db.ref(`eventSubscriptions/${key}`).get()).val();return current?.status==='active'&&current.unsubscribeToken===record.unsubscribeToken;};
        await notify(`subscriptionInvitations/${key}/${group.key}`,`RSVP for Heart to Heart — ${date}`,invitationMail(group,subscriptionLink('unsubscribe',key,record.unsubscribeToken)),undefined,record.email,'delivery',stillActive);
      }
    }
  }
  return {request,confirm,unsubscribe,sendInvitations};
}
