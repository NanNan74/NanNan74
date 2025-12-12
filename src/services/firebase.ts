import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD4paYQZK5ihS0dbVrPIWFEpXdfwLjZzVw",
  authDomain: "canhbaolulut-bcdf0.firebaseapp.com",
  databaseURL: "https://canhbaolulut-bcdf0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "canhbaolulut-bcdf0",
  storageBucket: "canhbaolulut-bcdf0.firebasestorage.app",
  messagingSenderId: "963271211348",
  appId: "1:963271211348:web:278cadf7886d03ab0f30c1"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
