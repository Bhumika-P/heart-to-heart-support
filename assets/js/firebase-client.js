import {initializeApp} from 'firebase/app';
import {getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail} from 'firebase/auth';
import {getDatabase, ref, onValue, get, connectDatabaseEmulator} from 'firebase/database';
import {getFunctions, httpsCallable, connectFunctionsEmulator} from 'firebase/functions';
import {firebaseConfig, functionsRegion} from './firebase-config.js';
// Only localhost builds explicitly opened with ?emulator=1 can reach local emulators.
const local = ['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('emulator') === '1';
const config = local ? {...firebaseConfig, projectId:'demo-heart-to-heart', apiKey:'demo-key', databaseURL:'https://demo-heart-to-heart-default-rtdb.firebaseio.com'} : firebaseConfig;
const app = initializeApp(config);
export const auth = getAuth(app), db = getDatabase(app), functions = getFunctions(app, functionsRegion);
if(local){ connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true}); connectDatabaseEmulator(db,'127.0.0.1',9000); connectFunctionsEmulator(functions,'127.0.0.1',5001); }
export {ref,onValue,get,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail};
export const call = (name, data) => httpsCallable(functions,name)(data).then(r=>r.data);
