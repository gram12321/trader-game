import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAh04xhwYDwlYayhfV_hx4asL_BFJxH_U8",
    authDomain: "tradinggame-abb81.firebaseapp.com",
    projectId: "tradinggame-abb81",
    storageBucket: "tradinggame-abb81.firebasestorage.app",
    messagingSenderId: "484425254643",
    appId: "1:484425254643:web:f3aa396791fa166e1ed986"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 