// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAi2Qx4Pu54BogdlAQrVsG3sPryyZjS54w",
  authDomain: "sorano-89f98.firebaseapp.com",
  projectId: "sorano-89f98",
  storageBucket: "sorano-89f98.firebasestorage.app",
  messagingSenderId: "648407978248",
  appId: "1:648407978248:web:8576730700b542fe8edcbd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); 
