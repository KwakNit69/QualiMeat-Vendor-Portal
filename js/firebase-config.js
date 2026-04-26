import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2c1f9guIlAXOiDTIUKyIXF-kGfl3xgDk",
  authDomain: "qualimeatdb.firebaseapp.com",
  projectId: "qualimeatdb",
  storageBucket: "qualimeatdb.firebasestorage.app",
  messagingSenderId: "247856692336",
  appId: "1:247856692336:web:e39f42000af793a7a308b5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);