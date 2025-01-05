import admin from 'firebase-admin';
import serviceAccount from '../firebase-service-account.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
/*// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsWtMTVmZwLAG8P6Gp5_SqV6r24WYPuc0",
  authDomain: "fintread-70e2e.firebaseapp.com",
  projectId: "fintread-70e2e",
  storageBucket: "fintread-70e2e.firebasestorage.app",
  messagingSenderId: "1709448650",
  appId: "1:1709448650:web:de5e07a842e36bc9394333",
  measurementId: "G-2FNTWKFS0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); */
