import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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
