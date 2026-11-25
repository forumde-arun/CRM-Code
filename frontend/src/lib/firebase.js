
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAglEP47kLygslQ1zV5zUGu7il58oU79G4",
  authDomain: "whatsapp-crm-11e17.firebaseapp.com",
  projectId: "whatsapp-crm-11e17",
  storageBucket: "whatsapp-crm-11e17.firebasestorage.app",
  messagingSenderId: "252017084567",
  appId: "1:252017084567:web:b7889840e986549d8141d2",
  measurementId: "G-T7GDDTDZE1"
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
console.log('Frontend Firebase project:', firebaseConfig.projectId);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

