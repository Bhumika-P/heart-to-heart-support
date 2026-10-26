// Normalize explicit index filenames while preserving RSVP filters and subscription fragments.
if(location.pathname.endsWith('/index.html'))history.replaceState(null,'',location.pathname.slice(0,-10)+location.search+location.hash);
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
// Preserve emulator routing only on loopback, never on deployed pages.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulator')==='1'){
  const banner=document.createElement('div');banner.className='preview-banner';banner.textContent='Local test preview · Sample data only · No email is sent';document.body.prepend(banner);
  document.querySelectorAll('a[href]').forEach(a=>{const u=new URL(a.href);if(u.origin===location.origin&&!u.pathname.startsWith('/assets/')){u.searchParams.set('emulator','1');a.href=u.href;}});
}

// Keep the welcome message on one line at the largest size its space allows.
const heroLabel=document.querySelector('.hero-label');
if(heroLabel){
  const fitWelcome=()=>{
    heroLabel.style.fontSize=getComputedStyle(heroLabel).getPropertyValue('--welcome-max').trim();
    const range=document.createRange();
    range.selectNodeContents(heroLabel.querySelector(".welcome-text")||heroLabel);
    const textWidth=range.getBoundingClientRect().width;
    const decorations=[...heroLabel.querySelectorAll(".icon")].reduce((sum,el)=>sum+el.getBoundingClientRect().width,0);
    const gaps=heroLabel.querySelector(".welcome-text")?2*parseFloat(getComputedStyle(heroLabel).columnGap):0;
    const available=Math.max(0,heroLabel.clientWidth-decorations-gaps-2);
    if(textWidth>0&&available>0){
      const size=parseFloat(getComputedStyle(heroLabel).fontSize);
      heroLabel.style.fontSize=(Math.floor(Math.min(size,size*available/textWidth)*10)/10)+'px';
    }
  };
  fitWelcome();
  document.fonts?.ready.then(fitWelcome);
  window.addEventListener('resize',fitWelcome);
}
