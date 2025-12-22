import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Placeholder config for development/emulator usage
// When deploying to production, replace this with your actual Firebase Web App config
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "bbcast-backend.firebaseapp.com",
  projectId: "bbcast-backend",
  storageBucket: "bbcast-backend.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development mode
if (__DEV__) {
  try {
    // Note: If testing on Android Emulator, use '10.0.2.2' instead of 'localhost'
    // If testing on a physical device, use your machine's LAN IP address
    const emulatorHost = 'localhost';
    
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    connectFirestoreEmulator(db, emulatorHost, 8080);
    console.log('Connected to Firebase Emulators');
  } catch (e) {
    console.error('Error connecting to emulators', e);
  }
}

export { auth, db, signInAnonymously };
