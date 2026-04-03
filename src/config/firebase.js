import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyCt_de9z-v_czo2P-D1kLcf07P-8vEia-U",
  authDomain: "plantify-572b7.firebaseapp.com",
  projectId: "plantify-572b7",
  storageBucket: "plantify-572b7.firebasestorage.app",
  messagingSenderId: "932186460404",
  appId: "1:932186460404:web:50b86d123fa79aaebdcea1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);