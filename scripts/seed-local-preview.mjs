// Synthetic fixtures for the loopback demo emulators only; never contacts production.
const base='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const credentials={email:'preview-admin@example.test',password:'LocalPreviewOnly!42',returnSecureToken:true};
async function auth(action){return (await fetch(`${base}/accounts:${action}?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)})).json();}
let account=await auth('signUp');if(account.error?.message==='EMAIL_EXISTS')account=await auth('signInWithPassword');if(!account.localId)throw Error(JSON.stringify(account));
const response=await fetch(`http://127.0.0.1:9000/admins/${account.localId}.json?ns=demo-heart-to-heart-default-rtdb`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:'true'});if(!response.ok)throw Error('Unable to seed local admin');
console.log('Local preview administrator ready: preview-admin@example.test / LocalPreviewOnly!42');
