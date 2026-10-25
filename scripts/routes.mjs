// Static directory pages work with GitHub Pages without server rewrite rules.
export const pagePath=name=>name==='index.html'?'/':`/${name.slice(0,-5)}/`;
export function publicHtml(html,names){
  const known=new Set(names);
  return html.replace(/\b(href|src)="([^"]+)"/g,(attribute,key,url)=>{
    if(/^(?:[a-z]+:|\/\/|#)/i.test(url))return attribute;
    const match=url.match(/^\/?([^/?#]+\.html)([?#].*)?$/);
    if(match&&known.has(match[1]))return `${key}="${pagePath(match[1])}${match[2]||''}"`;
    if(url.startsWith('assets/'))return `${key}="/${url}"`;
    return attribute;
  });
}
export function legacyRedirect(path){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Heart to Heart</title><link rel="canonical" href="https://support.hearttoheartlifecoaching.com${path}"><script>const target=new URL(${JSON.stringify(path)},location.origin);target.search=location.search;target.hash=location.hash;location.replace(target.href);</script><noscript><meta http-equiv="refresh" content="0;url=${path}"></noscript></head><body><a href="${path}">Continue to Heart to Heart</a></body></html>`;
}
