import {mkdir,cp,readdir,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root=resolve(import.meta.dirname,'..');
const {version}=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const functionsPackage=JSON.parse(await readFile(resolve(root,'functions/package.json'),'utf8'));
const versionFile=(await readFile(resolve(root,'assets/data/version.txt'),'utf8')).trim();
if(versionFile!==version||functionsPackage.version!==version)throw Error('Version mismatch. Run npm run version:sync.');
const dist=resolve(root,'dist');
if(dist!==resolve(root,'dist')) throw Error('Invalid output');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const name of await readdir(root)){if(name.endsWith('.html')){
  let html=await readFile(resolve(root,name),'utf8');
  html=html.replace(/<span data-version>[^<]*<\/span>/g,`<span data-version>v${version}</span>`);
  html=html.replaceAll('assets/css/main.css"',`assets/css/main.css?v=${version}"`);
  html=html.replace(/src="assets\/js\/([^"?]+)"/g,`src="assets/js/$1?v=${version}"`);
  await writeFile(resolve(dist,name),html);
}}
for(const folder of ['css','img','files','data'])await cp(resolve(root,'assets',folder),resolve(dist,'assets',folder),{recursive:true});
await writeFile(resolve(dist,'.nojekyll'),'');
await build({absWorkingDir:root,entryPoints:['assets/js/site.js','assets/js/schedule.js','assets/js/contact.js','assets/js/admin.js'],outdir:'dist/assets/js',bundle:true,splitting:true,format:'esm',minify:true,target:['es2022'],sourcemap:false});
console.log('Built static website in dist/');
