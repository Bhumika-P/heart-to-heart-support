export function sessionDetails(event){
  const format=new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeStyle:'short',timeZone:event.timezone});
  return `${event.name}\n${format.format(event.startAt)} – ${new Intl.DateTimeFormat('en-US',{timeStyle:'short',timeZone:event.timezone}).format(event.endAt)} (${event.timezone})\n${event.locationTitle}\n${event.address}`;
}
export function participantMail(record,event,reminder=false){
  return `${reminder?'This is your requested reminder for your upcoming session.':'Thank you for reserving your place. Your RSVP has been received.'}\n\n${sessionDetails(event)}\n\nA $10 fee per session helps cover room rental, setup, and other support-group expenses. If you need sponsorship assistance, please contact Sherée privately.\n\n${!reminder&&record.reminderOptIn?'You requested a reminder about 24 hours before this session.\n\n':''}Questions or changes? Contact Sherée at hthlifecoaching@gmail.com or https://support.hearttoheartlifecoaching.com/contact.html. Reply to stop your reminder.\n\nFuture meetings: https://support.hearttoheartlifecoaching.com/schedule.html`;
}
export function reminderDue(event,record,now=Date.now()){
  return record.reminderOptIn===true&&event.startAt>now+3600000&&event.startAt<=now+25*3600000&&record.reminderDelivery?.status!=='sent';
}
