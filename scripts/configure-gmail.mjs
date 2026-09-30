// Receives the masked prompt value over stdin; never writes credentials to disk.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const nodemailer=require('nodemailer');
try {
 let input='';for await(const chunk of process.stdin)input+=chunk;
 const {sender,password}=JSON.parse(input);input='';
 if(!/^[^\s@]+@gmail\.com$/i.test(sender)||!/^\S{16}$/.test(password))throw Error('Invalid Gmail setup input');
 const smtp=`smtps://${encodeURIComponent(sender)}:${encodeURIComponent(password)}@smtp.gmail.com:465`;
 const transport=nodemailer.createTransport(smtp,{connectionTimeout:10000,socketTimeout:15000});
 await transport.verify();transport.close();
 const token=execFileSync(process.env.ComSpec,['/d','/s','/c','gcloud auth print-access-token'],{encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 const base='https://secretmanager.googleapis.com/v1/projects/hearttoheart-14e56/secrets';
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 const existing=await fetch(base+'/SMTP_URL',{headers});
 if(existing.status===404){const r=await fetch(base+'?secretId=SMTP_URL',{method:'POST',headers,body:JSON.stringify({replication:{automatic:{}}})});if(!r.ok)throw Error('Secret creation failed '+r.status);}
 else if(!existing.ok)throw Error('Secret access failed '+existing.status);
 const uploaded=await fetch(base+'/SMTP_URL:addVersion',{method:'POST',headers,body:JSON.stringify({payload:{data:Buffer.from(smtp).toString('base64')}})});
 if(!uploaded.ok)throw Error('Secret upload failed '+uploaded.status);
 console.log('SUCCESS: Gmail connection verified and SMTP_URL saved securely. No email was sent. You can close this window and tell Codex it is ready.');
}catch(error){console.error('Setup failed:',error.code||'Unable to verify Gmail or save the secret. Check the app password and Google Cloud sign-in.');process.exitCode=1;}
