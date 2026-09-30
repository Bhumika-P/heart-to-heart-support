import {db,ref,onValue,call,backendReady} from './firebase-client.js';
import {el,status,errorMessage,eventTime,formData,action} from './ui.js';
const list=document.querySelector('#events-list'),notice=document.querySelector('#schedule-status'),dialog=document.querySelector('#rsvp-dialog'),form=document.querySelector('#rsvp-form');
let events=[],filter=new URLSearchParams(location.search).get('session')||'all';
if(form)form.querySelector('[data-form-fields]').disabled=!backendReady;
if(!['all','morning','evening'].includes(filter))filter='all';
function render(){
  for(const kind of ['morning','evening']){const upcoming=events.find(e=>e.session===kind);const next=document.querySelector(`[data-next="${kind}"]`);if(next)next.textContent=upcoming?eventTime(upcoming):'Every two weeks · See upcoming dates';}
  if(!list)return;
  document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('active',button.dataset.filter===filter);button.setAttribute('aria-pressed',String(button.dataset.filter===filter));});
  const shown=events.filter(e=>filter==='all'||e.session===filter);list.replaceChildren();notice.textContent='';
  if(!shown.length){const panel=el('div',undefined,'empty-state');panel.append(el('h2','New sessions are on their way'),el('p','There are no published upcoming sessions in this view. Please check back soon or contact Sherée with a question.'));const link=el('a','Contact Sherée');link.href='contact.html';panel.append(link);list.append(panel);return;}
  for(const event of shown){
    const card=el('article',undefined,'event-card');card.append(el('p',`${event.session==='morning'?'Morning':'Evening'} Session`,'eyebrow'),el('h2',event.name),el('p',eventTime(event),'event-date'),el('p',`${event.locationTitle}\n${event.address}`,'event-location'),el('p',event.description));
    if(event.rsvpOpen)card.append(action('RSVP for This Session',()=>openRsvp(event),'button'));else card.append(el('p','RSVPs are currently closed.','badge'));
    list.append(card);
  }
}
if(backendReady)onValue(ref(db,'events'),snapshot=>{events=Object.entries(snapshot.val()||{}).map(([id,event])=>({id,...event})).filter(e=>e.startAt>Date.now()).sort((a,b)=>a.startAt-b.startAt);render();},()=>{if(notice){notice.textContent='We couldn’t load the schedule. Please try again later.';notice.classList.add('error');}});
else render();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;render();}));
let returnFocus;
function openRsvp(event){returnFocus=document.activeElement;form.reset();form.querySelector('[name=eventId]').value=event.id;document.querySelector('#rsvp-event').textContent=`${event.name} — ${eventTime(event)}`;form.querySelector('.form-status').textContent='';form.querySelector('button[type=submit]').disabled=false;dialog.showModal();}
dialog?.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>returnFocus?.focus());
form?.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]'),feedback=form.querySelector('.form-status');button.disabled=true;status(feedback,'Sending your RSVP…');try{const result=await call('submitRsvp',formData(form));status(feedback,result.message);form.querySelectorAll('input:not([type=hidden])').forEach(i=>i.value='');}catch(error){status(feedback,errorMessage(error),true);button.disabled=false;}});
