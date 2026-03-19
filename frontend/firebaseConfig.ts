import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCxzZEiZMUAqw0D1ImjOMdmGroE2JnV6sk",
  authDomain: "bbcast-backend.firebaseapp.com",
  projectId: "bbcast-backend",
  storageBucket: "bbcast-backend.firebasestorage.app",
  messagingSenderId: "412084001830",
  appId: "1:412084001830:web:9d4c4ffc090f7e92295ae7",
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
