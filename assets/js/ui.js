export const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
export const status=(node,message,error=false)=>{node.textContent=message;node.className=error?'form-status error':'form-status success';};
export function errorMessage(error){
  const code=error?.code||'';
  if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found')return 'Unable to sign in. Check your email and password.';
  if(code==='auth/too-many-requests')return 'Too many sign-in attempts. Please try again later.';
  if(code==='auth/network-request-failed')return 'Unable to connect. Check your internet connection and try again.';
  if(['functions/invalid-argument','functions/failed-precondition','functions/resource-exhausted','functions/aborted','functions/permission-denied','functions/not-found'].includes(code))return error.message;
  return 'Unable to complete this request right now. Please try again later.';
}
export function eventTime(event){
  const date=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:event.timezone}).format(event.startAt);
  const time=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:event.timezone});
  const zone=new Intl.DateTimeFormat('en-US',{timeZoneName:'short',timeZone:event.timezone}).formatToParts(event.startAt).find(p=>p.type==='timeZoneName').value;
  return `${date} · ${time.format(event.startAt)} – ${time.format(event.endAt)} ${zone}`;
}
export const formData=form=>Object.fromEntries(new FormData(form).entries());
export function action(label,handler,style='button outline'){const button=el('button',label,style);button.type='button';button.addEventListener('click',handler);return button;}
