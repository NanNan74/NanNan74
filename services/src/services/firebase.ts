import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của con (Thầy đã điền sẵn mã)
const firebaseConfig = {
  apiKey: "AIzaSyD4pAYQZK5ihS0dbVrPIWfEpXdfwLjZzVw",
  authDomain: "canhbaolulut-bcdf0.firebaseapp.com",
  projectId: "canhbaolulut-bcdf0",
  storageBucket: "canhbaolulut-bcdf0.firebasestorage.app",
  messagingSenderId: "963271211348",
  appId: "1:963271211348:web:278cadf7886d03ab0f30c1",
  measurementId: "G-6CKRKCEXL0"
};

// Khởi tạo kết nối
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
