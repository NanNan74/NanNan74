// api/iot.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// CẤU HÌNH FIREBASE (Em nhớ điền lại API KEY chuẩn của em vào chỗ ... nhé)
const firebaseConfig = {
  apiKey: "AIzaSyD4PayQZK5ihS0dbVrPIWFEpXd...", // <-- COPY LẠI KEY TỪ FILE firebase.ts DÁN VÀO ĐÂY
  authDomain: "canhbaolulut-bcdf0.firebaseapp.com",
  projectId: "canhbaolulut-bcdf0",
  storageBucket: "canhbaolulut-bcdf0.firebasestorage.app",
  messagingSenderId: "963271211348",
  appId: "1:963271211348:web:278cadf7886d03ab0f30c1",
  measurementId: "G-6CKRKCEXL0"
};

// Khởi tạo Firebase (chỉ khởi tạo 1 lần)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hàm xử lý chính của Vercel (Serverless Function)
export default async function handler(req, res) {
  // Chỉ chấp nhận lệnh POST từ ESP32
  if (req.method === 'POST') {
    try {
      const { device_id, water_level_percent, water_level_cm, latitude, longitude } = req.body;

      console.log(`Nhận dữ liệu từ ${device_id}: ${water_level_percent}%`);

      // Lưu vào Firebase
      const sensorRef = doc(db, "sensors", device_id || "unknown_device");
      await setDoc(sensorRef, {
        device_id: device_id,
        percent: water_level_percent,
        cm: water_level_cm || 0,
        lat: latitude,
        lng: longitude,
        status: water_level_percent > 50 ? "NGUY HIỂM" : (water_level_percent > 30 ? "CẢNH BÁO" : "AN TOÀN"),
        last_update: Timestamp.now()
      }, { merge: true });

      // Trả về OK cho ESP32
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    // Nếu ai đó mở link này bằng trình duyệt (GET)
    res.status(200).send("IoT Server is Running! Send POST request to update.");
  }
}
