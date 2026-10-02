import {DateTime, IANAZone} from 'luxon';
export function text(value, label, max=200, min=1){
  if(typeof value!=='string')throw Error(`${label} is required.`);
  const result=value.trim();
  if(result.length<min||result.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result))throw Error(`${label} must be ${min}–${max} characters.`);
  return result;
}
export function email(value){const result=text(value,'Email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)||/[\r\n]/.test(result))throw Error('Enter a valid email address.');return result;}
export function id(value){if(typeof value!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(value))throw Error('Invalid record.');return value;}
export function eventInput(data, now=Date.now()){
  const name=text(data.name,'Event name',160), description=text(data.description,'Description',3000);
  const locationTitle=text(data.locationTitle,'Location name',160),address=text(data.address,'Location address or online meeting instructions',500);
  const timezone=text(data.timezone,'Timezone',60);
  if(!IANAZone.isValidZone(timezone))throw Error('Choose a valid timezone.');
  if(!['morning','evening'].includes(data.session))throw Error('Choose morning or evening.');
  const start=DateTime.fromISO(data.startLocal,{zone:timezone}),end=DateTime.fromISO(data.endLocal,{zone:timezone});
  if(!start.isValid||!end.isValid||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.startLocal)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.endLocal))throw Error('Enter valid start and end dates.');
  // Reject nonexistent spring-forward times instead of silently shifting them.
  if(start.toFormat("yyyy-MM-dd'T'HH:mm")!==data.startLocal||end.toFormat("yyyy-MM-dd'T'HH:mm")!==data.endLocal)throw Error('That local time does not exist due to daylight saving time.');
  if(start.toMillis()<=now)throw Error('The session must start in the future.');
  if(end<=start||end.diff(start,'hours').hours>12)throw Error('End time must follow the start, within 12 hours.');
  if(typeof data.rsvpOpen!=='boolean')throw Error('Choose whether RSVPs are open.');
  return {name,description,locationTitle,address,timezone,session:data.session,startAt:start.toMillis(),endAt:end.toMillis(),rsvpOpen:data.rsvpOpen,startLocal:data.startLocal,endLocal:data.endLocal};
}
export function occurrences(data, now=Date.now()){
  const base=eventInput(data,now),count=Number(data.occurrences||1);
  if(!Number.isInteger(count)||count<1||count>26)throw Error('Choose 1–26 sessions.');
  return Array.from({length:count},(_,n)=>eventInput({...data,startLocal:DateTime.fromISO(base.startLocal,{zone:base.timezone}).plus({weeks:2*n}).toFormat("yyyy-MM-dd'T'HH:mm"),endLocal:DateTime.fromISO(base.endLocal,{zone:base.timezone}).plus({weeks:2*n}).toFormat("yyyy-MM-dd'T'HH:mm")},now));
}
export function rsvpInput(data){return {eventId:id(data.eventId),name:text(data.name,'Name',120),email:email(data.email),reminderOptIn:data.reminderOptIn===true};}
export function contactInput(data){return {name:text(data.name,'Name',120),email:email(data.email),subject:text(data.subject,'Subject',160),message:text(data.message,'Message',5000,10)};}
