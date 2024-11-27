import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: 'AIzaSyCbZ7b5s1F4eqMxxFW6Zy9dKnwnREMziCk',
    authDomain: 'ecotrack-c8e02.firebaseapp.com',
    projectId: 'ecotrack-c8e02',
    storageBucket: 'ecotrack-c8e02.appspot.com', // Note: Changed from .firebasestorage.app to .appspot.com
    messagingSenderId: '749261735518',
    appId: '1:749261735518:web:29e894a05642a2a7c596cf',
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
