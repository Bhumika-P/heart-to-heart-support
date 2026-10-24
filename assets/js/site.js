const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
// Preserve emulator routing only on loopback, never on deployed pages.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulator')==='1'){
  const banner=document.createElement('div');banner.className='preview-banner';banner.textContent='Local test preview · Sample data only · No email is sent';document.body.prepend(banner);
  document.querySelectorAll('a[href]').forEach(a=>{const u=new URL(a.href);if(u.origin===location.origin&&u.pathname.endsWith('.html')){u.searchParams.set('emulator','1');a.href=u.href;}});
}

// Keep the welcome message on one line at the largest size its space allows.
const heroLabel=document.querySelector('.hero-label');
if(heroLabel){
  const fitWelcome=()=>{
    heroLabel.style.fontSize=getComputedStyle(heroLabel).getPropertyValue('--welcome-max').trim();
    const range=document.createRange();
    range.selectNodeContents(heroLabel);
    const textWidth=range.getBoundingClientRect().width;
    const available=heroLabel.clientWidth;
    if(textWidth>available&&available>0){
      const size=parseFloat(getComputedStyle(heroLabel).fontSize);
      heroLabel.style.fontSize=(Math.floor(size*available/textWidth*10)/10)+'px';
    }
  };
  fitWelcome();
  document.fonts?.ready.then(fitWelcome);
  window.addEventListener('resize',fitWelcome);
}
