import {mkdir,cp,readdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
if(dist!==resolve(root,'dist')) throw Error('Invalid output');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const name of await readdir(root)){if(name.endsWith('.html'))await cp(resolve(root,name),resolve(dist,name));}
for(const folder of ['css','img','files'])await cp(resolve(root,'assets',folder),resolve(dist,'assets',folder),{recursive:true});
await build({absWorkingDir:root,entryPoints:['assets/js/site.js','assets/js/schedule.js','assets/js/contact.js','assets/js/admin.js'],outdir:'dist/assets/js',bundle:true,splitting:true,format:'esm',minify:true,target:['es2022'],sourcemap:false});
console.log('Built static website in dist/');
