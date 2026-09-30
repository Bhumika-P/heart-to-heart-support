import {call} from './firebase-client.js';
import {status,errorMessage,formData} from './ui.js';
const form=document.querySelector('#contact-form');let requestId=crypto.randomUUID();
form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]'),feedback=form.querySelector('.form-status');button.disabled=true;status(feedback,'Sending your message…');try{const result=await call('submitContact',{...formData(form),requestId});status(feedback,result.message);form.reset();requestId=crypto.randomUUID();}catch(error){status(feedback,errorMessage(error),true);}finally{button.disabled=false;}});
