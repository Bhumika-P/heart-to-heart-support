import {call,backendReady} from './firebase-client.js';
import {status,errorMessage,formData} from './ui.js';
const form=document.querySelector('#contact-form');let requestId=crypto.randomUUID();
form.querySelector('[data-form-fields]').disabled=!backendReady;
if(!backendReady){
  form.querySelectorAll('input,textarea,button').forEach(control=>control.disabled=true);
  status(form.querySelector('.form-status'),'Online messages are not available yet. Please check back soon.');
}
form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]'),feedback=form.querySelector('.form-status');button.disabled=true;status(feedback,'Sending your message…');try{const result=await call('submitContact',{...formData(form),requestId});status(feedback,result.message);form.reset();requestId=crypto.randomUUID();}catch(error){status(feedback,errorMessage(error),true);}finally{button.disabled=false;}});
