// server.js - File này sẽ chạy trên Render để hứng dữ liệu ESP32

import express from 'express';
import cors from 'cors';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// 1. CẤU HÌNH FIREBASE (Copy y nguyên từ file firebase.ts của em sang đây để server dùng được)
const firebaseConfig = {
  apiKey: "AIzaSyD4PayQZK5ihS0dbVrPIWFEpXd...", // <-- Em COPY FULL KEY TRONG FILE firebase.ts DÁN VÀO ĐÂY NHÉ
  authDomain: "canhbaolulut-bcdf0.firebaseapp.com",
  projectId: "canhbaolulut-bcdf0",
  storageBucket: "canhbaolulut-bcdf0.firebasestorage.app",
  messagingSenderId: "963271211348",
  appId: "1:963271211348:web:278cadf7886d03ab0f30c1",
  measurementId: "G-6CKRKCEXL0"
};

// Khởi tạo Firebase cho Server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 2. KHỞI TẠO SERVER
const app = express();
app.use(cors());
app.use(express.json()); // Để đọc được JSON từ ESP32

const PORT = process.env.PORT || 3000;

// 3. API HỨNG DỮ LIỆU TỪ ESP32
// Đường dẫn này khớp với code ESP32: /api/iot/water-level
app.post('/api/iot/water-level', async (req, res) => {
  try {
    const { device_id, water_level_percent, water_level_cm, latitude, longitude } = req.body;

    console.log(`📩 Nhận dữ liệu từ ${device_id}: ${water_level_percent}%`);

    // Lưu vào Firebase Firestore
    // Nó sẽ lưu vào bảng 'sensors', id là tên thiết bị
    const sensorRef = doc(db, "sensors", device_id || "unknown_device");
    
    await setDoc(sensorRef, {
      device_id: device_id,
      percent: water_level_percent,
      cm: water_level_cm || 0,
      lat: latitude,
      lng: longitude,
      status: water_level_percent > 50 ? "NGUY HIỂM" : (water_level_percent > 30 ? "CẢNH BÁO" : "AN TOÀN"),
      last_update: Timestamp.now()
    }, { merge: true }); // merge: true để cập nhật đè lên chứ không xóa cũ

    res.status(200).json({ message: "ESP32 Data Saved to Firebase!" });

  } catch (error) {
    console.error("❌ Lỗi lưu Firebase:", error);
    res.status(500).json({ error: error.message });
  }
});

// Chạy Server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại port ${PORT}`);
});
