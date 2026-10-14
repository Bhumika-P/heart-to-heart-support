import {call,backendReady} from './firebase-client.js';
import {status,errorMessage} from './ui.js';
const params=new URLSearchParams(location.hash.slice(1)),action=params.get('action'),token=params.get('token');
// Keep opaque management tokens out of subsequent navigation and shared URLs.
history.replaceState(null,'',location.pathname+location.search);
const form=document.querySelector('#subscription-action-form'),title=document.querySelector('#subscription-title'),description=document.querySelector('#subscription-description'),button=document.querySelector('#subscription-action'),feedback=form.querySelector('.form-status');
const valid=['confirm','unsubscribe'].includes(action)&&/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(token||'');
form.querySelector('[data-form-fields]').disabled=!backendReady||!valid;
if(valid){
  title.textContent=action==='confirm'?'Confirm Your Subscription':'Unsubscribe from Event Emails';
  description.textContent=action==='confirm'?'Click below to receive upcoming-event invitations about one week before each meeting date, including both session options.':'Click below to stop upcoming-event invitations. Your RSVPs and separate 24-hour session reminders will remain unchanged.';
  button.textContent=action==='confirm'?'Confirm Subscription':'Unsubscribe';
}else{form.hidden=true;description.textContent='This link is missing or invalid. Subscribe on the Group Sessions page, or use the link in your most recent email.';}
if(!backendReady)status(feedback,'Subscription preferences are temporarily unavailable. Please try again later.',true);
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!valid||!backendReady)return;button.disabled=true;status(feedback,'Updating your email preference…');
  try{const result=await call(action==='confirm'?'confirmEventSubscription':'unsubscribeFromEvents',{token});status(feedback,result.message);}
  catch(error){status(feedback,errorMessage(error),true);button.disabled=false;}
});
