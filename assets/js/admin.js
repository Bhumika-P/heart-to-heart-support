import {auth,db,ref,get,onValue,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail,call,backendReady} from './firebase-client.js';
import {el,status,errorMessage,eventTime,formData,action} from './ui.js';
const login=document.querySelector('#login-form'),editor=document.querySelector('#event-form'),panel=document.querySelector('#admin-panel'),authPanel=document.querySelector('#auth-panel'),notice=document.querySelector('#admin-status');
let events={},rsvps={},messages={},unsubscribers=[],selectedEvent=null,authRevision=0,rsvpView='cards',attendeeFocus;
const attendeeDialog=document.querySelector('#attendees-dialog');
attendeeDialog.addEventListener('cancel',event=>event.preventDefault());
document.querySelector('#close-attendees').addEventListener('click',()=>attendeeDialog.close());
attendeeDialog.addEventListener('close',()=>{const trigger=document.querySelector(`[data-view-rsvps="${selectedEvent}"]`);(trigger||(attendeeFocus?.isConnected?attendeeFocus:null))?.focus();});
document.querySelectorAll('[data-rsvp-view]').forEach(button=>button.addEventListener('click',()=>{rsvpView=button.dataset.rsvpView;renderAttendees();}));
const feedback=editor.querySelector('.form-status');
login.querySelector('[data-form-fields]').disabled=!backendReady;
editor.querySelector('[data-form-fields]').disabled=!backendReady;
if(!backendReady){authPanel.hidden=true;status(notice,'Administration is not connected yet. The website owner is choosing the session and form provider.');}
login.addEventListener('submit',async event=>{event.preventDefault();const data=formData(login),button=login.querySelector('[type=submit]');button.disabled=true;status(login.querySelector('.form-status'),'Signing in…');try{await signInWithEmailAndPassword(auth,data.email,data.password);login.reset();status(login.querySelector('.form-status'),'');}catch(error){status(login.querySelector('.form-status'),errorMessage(error),true);}finally{button.disabled=false;}});
document.querySelector('#reset-password').addEventListener('click',async()=>{const email=login.elements.email.value;if(!email||!login.elements.email.checkValidity()){status(login.querySelector('.form-status'),'Enter your email address first.',true);return;}try{await sendPasswordResetEmail(auth,email);status(login.querySelector('.form-status'),'If this account exists, a password-reset email will be sent.');}catch(error){status(login.querySelector('.form-status'),errorMessage(error),true);}});
document.querySelector('#sign-out').addEventListener('click',()=>signOut(auth));
function clearPrivate(){unsubscribers.forEach(fn=>fn());unsubscribers=[];events={};rsvps={};messages={};selectedEvent=null;document.querySelector('#admin-events').replaceChildren();document.querySelector('#attendees-list').replaceChildren();document.querySelector('#messages-list').replaceChildren();if(attendeeDialog.open)attendeeDialog.close();resetEditor();}
onAuthStateChanged(auth,async user=>{
  if(!backendReady)return;
  const revision=++authRevision;clearPrivate();panel.hidden=true;authPanel.hidden=false;notice.textContent='';
  if(!user)return;
  try{
    const allowed=(await get(ref(db,`admins/${user.uid}`))).val()===true;
    if(revision!==authRevision)return;
    if(!allowed){status(notice,'This account does not have administrator access. Please contact the website owner.',true);await signOut(auth);status(notice,'This account does not have administrator access. Please contact the website owner.',true);return;}
    panel.hidden=false;authPanel.hidden=true;document.querySelector('#admin-identity').textContent=`Signed in as ${user.email}`;
    // Immediately clear sensitive UI if access is revoked during this session.
    unsubscribers.push(onValue(ref(db,`admins/${user.uid}`),s=>{if(s.val()!==true)signOut(auth);},()=>signOut(auth)));
    const denied=()=>{clearPrivate();panel.hidden=true;status(notice,'Unable to load administrator data. Please sign in again.',true);signOut(auth);};
    unsubscribers.push(onValue(ref(db,'events'),s=>{events=s.val()||{};renderEvents();renderAttendees();},denied));
    unsubscribers.push(onValue(ref(db,'rsvps'),s=>{rsvps=s.val()||{};renderEvents();renderAttendees();},denied));
    unsubscribers.push(onValue(ref(db,'messages'),s=>{messages=s.val()||{};renderMessages();},denied));
  }catch(error){status(notice,errorMessage(error),true);}
});
function resetEditor(){editor.reset();editor.elements.id.value='';editor.elements.updatedAt.value='';document.querySelector('#editor-title').textContent='Create a Session';document.querySelector('#repeat-field').hidden=false;document.querySelector('#repeat-note').hidden=false;editor.elements.occurrences.disabled=false;feedback.textContent='';}
document.querySelector('#cancel-edit').addEventListener('click',resetEditor);
editor.addEventListener('submit',async event=>{
  event.preventDefault();const button=editor.querySelector('[type=submit]');button.disabled=true;
  const data={...formData(editor),rsvpOpen:editor.elements.rsvpOpen.checked};data.updatedAt=Number(data.updatedAt);data.occurrences=Number(data.occurrences||1);
  status(feedback,'Saving session…');
  try{const result=await call('saveEvent',data);resetEditor();status(feedback,`${result.ids.length===1?'Session':result.ids.length+' sessions'} saved.`);}catch(error){status(feedback,errorMessage(error),true);}finally{button.disabled=false;}
});
function editEvent(id){const event=events[id];resetEditor();for(const [key,value] of Object.entries({...event,id})){const field=editor.elements.namedItem(key);if(field){if(field.type==='checkbox')field.checked=value;else field.value=value;}}document.querySelector('#editor-title').textContent='Edit Session';document.querySelector('#repeat-field').hidden=true;document.querySelector('#repeat-note').hidden=true;editor.elements.occurrences.disabled=true;editor.scrollIntoView({behavior:'smooth',block:'start'});editor.elements.name.focus();}
async function deleteEvent(id){const count=Object.keys(rsvps[id]||{}).length;if(!confirm(`Delete “${events[id].name}” and its ${count} RSVP record(s)? This cannot be undone.`))return;try{await call('deleteEvent',{id});if(editor.elements.id.value===id)resetEditor();status(notice,'Session deleted.');}catch(error){status(notice,errorMessage(error),true);}}
document.querySelector('#event-search').addEventListener('input',renderEvents);
function renderEvents(){const container=document.querySelector('#admin-events');container.replaceChildren();const term=document.querySelector('#event-search').value.toLowerCase();const rows=Object.entries(events).filter(([,v])=>`${v.name} ${v.locationTitle}`.toLowerCase().includes(term)).sort(([,a],[,b])=>a.startAt-b.startAt);if(!rows.length){container.append(el('p','No sessions found. Create a session using the form.'));return;}for(const [id,event] of rows){const card=el('article',undefined,'admin-event'),actions=el('div',undefined,'actions');card.append(el('h3',event.name),el('p',eventTime(event)),el('p',event.locationTitle),el('p',`${event.startAt<Date.now()?'Past session · ':''}${event.rsvpOpen?'RSVPs open':'RSVPs closed'} · ${Object.keys(rsvps[id]||{}).length} RSVP(s)`,'badge'));actions.append(action('Edit',()=>editEvent(id)),viewRsvpAction(id),action('Delete',()=>deleteEvent(id),'button outline danger'));card.append(actions);container.append(card);}}
function viewRsvpAction(id){const button=action('View RSVPs',()=>{selectedEvent=id;rsvpView='cards';attendeeFocus=document.activeElement;document.querySelector('#attendees-status').textContent='';renderAttendees();attendeeDialog.showModal();});button.dataset.viewRsvps=id;return button;}
function deliveryNode(record,data){const box=el('div',undefined,'delivery');const state=record.delivery?.status||'pending';box.append(el('p',`Email notification: ${state}${record.delivery?.emulated?' (local test)':''}`));if(state!=='sent'){box.append(action('Retry Email',async event=>{const button=event.currentTarget;button.disabled=true;try{const result=await call('retryNotification',data);status(notice,result.status==='sent'?'Notification sent.':'Notification could not be sent. Check the email configuration.',result.status!=='sent');}catch(error){status(notice,errorMessage(error),true);}finally{button.disabled=false;}}));}return box;}
function attendanceForm(record,key){
  const form=el('form',undefined,'private-record-form');form.method='post';
  function checkbox(name,label,checked){const wrapper=el('label',undefined,'checkbox'),input=el('input');input.type='checkbox';input.name=name;input.checked=checked;wrapper.append(input,document.createTextNode(label));form.append(wrapper);}
  checkbox('attended','Attended this session',record.attended===true);
  checkbox('reminderOptIn','Email reminder requested',record.reminderOptIn===true);
  const label=el('label','Sponsorship'),select=el('select');select.name='sponsorshipStatus';
  for(const [value,title] of [['none','No sponsorship recorded'],['requested','Assistance requested'],['arranged','Sponsorship arranged']]){const option=el('option',title);option.value=value;select.append(option);}select.value=record.sponsorshipStatus||'none';label.append(select);form.append(label);
  const noteLabel=el('label','Private sponsorship note'),note=el('textarea');note.name='sponsorshipNote';note.maxLength=1000;note.rows=2;note.value=record.sponsorshipNote||'';noteLabel.append(note);form.append(noteLabel);
  const button=el('button','Save Private Details','button outline');button.type='submit';form.append(button);const feedback=el('p',undefined,'form-status');feedback.setAttribute('role','status');form.append(feedback);
  const eventId=selectedEvent;
  form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;try{await call('updatePrivateRecord',{kind:'rsvp',eventId,recordId:key,...formData(form),attended:form.elements.attended.checked,reminderOptIn:form.elements.reminderOptIn.checked});status(document.querySelector('#attendees-status'),'Private details saved.');}catch(error){status(feedback,errorMessage(error),true);}finally{button.disabled=false;}});
  return form;
}
function renderAttendees(){
  const container=document.querySelector('#attendees-list');
  const expanded=new Set([...container.querySelectorAll('details[open]')].map(item=>item.dataset.key));container.replaceChildren();
  if(!selectedEvent||!events[selectedEvent]){if(attendeeDialog.open)attendeeDialog.close();return;}
  document.querySelector('#attendees-title').textContent=`RSVPs — ${events[selectedEvent].name}`;
  const entries=Object.entries(rsvps[selectedEvent]||{}).sort(([,a],[,b])=>a.name.localeCompare(b.name));
  document.querySelector('#attendees-session').textContent=`${eventTime(events[selectedEvent])} · ${entries.length} RSVP(s) · ${entries.filter(([,r])=>r.attended).length} attended`;
  container.className=rsvpView==='cards'?'attendee-grid':'attendee-rows';
  document.querySelectorAll('[data-rsvp-view]').forEach(button=>{const active=button.dataset.rsvpView===rsvpView;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  if(!entries.length)container.append(el('p','No RSVPs for this session yet.'));
  for(const [key,record] of entries){
    const card=el(rsvpView==='list'?'details':'article',undefined,'attendee');
    if(rsvpView==='list'){card.dataset.key=key;card.open=expanded.has(key);card.append(el('summary',`${record.name}${record.attended?' · Attended':''}`));}else card.append(el('h3',record.name));
    card.append(el('p',record.email),el('p',`Received ${new Date(record.createdAt).toLocaleString()}`),deliveryNode(record,{kind:'rsvp',eventId:selectedEvent,recordId:key}));
    const confirmation={...record,delivery:record.confirmationDelivery||{status:'not recorded'}};
    const delivery=deliveryNode(confirmation,{kind:'rsvp',eventId:selectedEvent,recordId:key,audience:'participant'});delivery.querySelector('p').textContent=`Participant confirmation: ${record.confirmationDelivery?.status||'not recorded'}`;card.append(delivery);
    card.append(el('p',`Reminder: ${record.reminderOptIn?(record.reminderDelivery?.status||'requested'):'not requested'}`),attendanceForm(record,key));
    const eventId=selectedEvent;card.append(action('Remove RSVP',()=>removeRecord({kind:'rsvp',eventId,recordId:key}),'button outline danger'));container.append(card);
  }
}
function renderMessages(){const container=document.querySelector('#messages-list');container.replaceChildren();const entries=Object.entries(messages).sort(([,a],[,b])=>b.createdAt-a.createdAt);if(!entries.length)container.append(el('p','No contact messages yet.'));for(const [key,record] of entries){const card=el('article',undefined,'message-card');card.append(el('h3',record.subject),el('p',`${record.name} · ${record.email}`),el('p',new Date(record.createdAt).toLocaleString()),el('p',record.message,'message-body'),deliveryNode(record,{kind:'contact',recordId:key}));card.append(action(record.handled?'Mark as Unhandled':'Mark as Handled',async event=>{event.currentTarget.disabled=true;try{await call('updatePrivateRecord',{kind:'contact',recordId:key,handled:!record.handled});}catch(error){status(notice,errorMessage(error),true);event.currentTarget.disabled=false;}}));card.append(el('p',record.handled?'Handled':'Needs attention','badge'));card.append(action('Delete Message',()=>removeRecord({kind:'contact',recordId:key}),'button outline danger'));container.append(card);}}
async function removeRecord(data){if(!confirm('Permanently delete this private record? Email copies are not deleted.'))return;try{await call('deleteRecord',data);status(notice,'Record deleted.');}catch(error){status(notice,errorMessage(error),true);}}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelector('#sessions-panel').hidden=button.dataset.tab!=='sessions';document.querySelector('#messages-panel').hidden=button.dataset.tab!=='messages';}));
