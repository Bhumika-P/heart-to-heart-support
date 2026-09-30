// Run only from a trusted terminal with Google Application Default Credentials.
// This script does not send email or expose passwords.
import {readFile} from 'node:fs/promises';
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';
const path=process.argv[2];
if(!path)throw Error('Usage: node functions/provision-admins.js "path/to/admins.txt" [--apply]');
const addresses=[...new Set((await readFile(path,'utf8')).split(/\r?\n/).map(s=>s.trim().toLowerCase()).filter(Boolean))];
if(!addresses.length||addresses.some(s=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))throw Error('admins.txt must contain one valid email address per line.');
if(!process.argv.includes('--apply')){console.log(`Validated ${addresses.length} administrator addresses. Run with --apply to grant access in hearttoheart-14e56.`);process.exit(0);}
initializeApp({credential:applicationDefault(),projectId:'hearttoheart-14e56',databaseURL:'https://hearttoheart-14e56-default-rtdb.firebaseio.com'});
for(const email of addresses){let user;try{user=await getAuth().getUserByEmail(email);}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await getAuth().createUser({email});}await getDatabase().ref(`admins/${user.uid}`).set(true);console.log(`Administrator enabled: ${email}`);}
console.log('Done. New users can choose Reset password on admin.html after Email/Password sign-in is enabled. No emails were sent by this script.');
