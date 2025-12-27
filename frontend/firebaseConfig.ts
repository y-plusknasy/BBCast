import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Production Firebase Web App config
const firebaseConfig = {
  apiKey: "AIzaSyAtnjiSl6DPxS1YY-PFsoeCVZjAzzB6a58",
  authDomain: "bbcast-backend.firebaseapp.com",
  projectId: "bbcast-backend",
  storageBucket: "bbcast-backend.firebasestorage.app",
  messagingSenderId: "412084001830",
  appId: "1:412084001830:web:9d4c4ffc090f7e92295ae7"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
// Persistence is enabled by default in React Native for Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Note: Emulator connection is disabled to develop against production data directly.
// If you want to use emulators, uncomment the following block.
/*
if (__DEV__) {
  try {
    const emulatorHost = 'localhost';
    // connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    // connectFirestoreEmulator(db, emulatorHost, 8080);
    console.log('Connected to Firebase Emulators');
  } catch (e) {
    console.error('Error connecting to emulators', e);
  }
}
*/

export { auth, db, signInAnonymously };
