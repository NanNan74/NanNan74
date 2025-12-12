import React, { useState, useEffect } from 'react';
// Import db từ file firebase bạn vừa sửa lúc nãy
import { db } from './services/firebase'; 
import { ref, onValue, set } from "firebase/database";

// Code giao diện và logic chính
function App() {
  const [telegramId, setTelegramId] = useState("");
  const [minThreshold, setMinThreshold] = useState(10);
  const [maxThreshold, setMaxThreshold] = useState(80);
  const [waterLevel, setWaterLevel] = useState(0);
  const [status, setStatus] = useState("Đang kết nối...");

  // --- 1. KẾT NỐI REALTIME DATABASE ---
  useEffect(() => {
    // Lắng nghe mực nước
    const sensorRef = ref(db, 'sensors/waterLevel');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        setWaterLevel(val);
        setStatus("🟢 Đang hoạt động");
      } else {
        setStatus("🟡 Chờ dữ liệu từ ESP32...");
      }
    });

    // Lấy lại cấu hình cũ
    const configRef = ref(db, 'config');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTelegramId(data.telegramId || "");
        setMinThreshold(data.minThreshold || 10);
        setMaxThreshold(data.maxThreshold || 80);
      }
    });

    return () => {
      unsubscribeSensor();
      unsubscribeConfig();
    };
  }, []);

  // --- 2. HÀM LƯU CẤU HÌNH ---
  const handleSaveConfig = () => {
    if (!telegramId) return alert("⚠️ Vui lòng nhập Telegram ID!");

    set(ref(db, 'config'), {
      telegramId: telegramId,
      minThreshold: Number(minThreshold),
      maxThreshold: Number(maxThreshold)
    })
    .then(() => alert("✅ Đã lưu cấu hình thành công! ESP32 sẽ nhận được ngay."))
    .catch((err) => alert("❌ Lỗi lưu: " + err.message));
  };

  // --- 3. GIAO DIỆN ---
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      fontFamily: 'Segoe UI, sans-serif' 
    }}>
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>
          FLOODGUARD AI
        </h1>
        <p style={{ color: '#94a3b8' }}>Hệ thống cảnh báo lũ lụt IoT</p>
        <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#fbbf24' }}>
          Trạng thái: {status}
        </div>
      </div>

      {/* VÒNG TRÒN HIỂN THỊ MỰC NƯỚC */}
      <div style={{ 
        margin: '40px 0', 
        width: '200px', 
        height: '200px', 
        borderRadius: '50%', 
        border: `8px solid ${waterLevel > maxThreshold ? '#ef4444' : '#22c55e'}`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#1e293b',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}>
        <span style={{ fontSize: '4rem', fontWeight: 'bold' }}>{waterLevel}%</span>
        <span style={{ color: '#cbd5e1' }}>Mực nước</span>
      </div>

      {/* FORM CẤU HÌNH */}
      <div style={{ 
        background: '#1e293b', 
        padding: '30px', 
        borderRadius: '15px', 
        width: '90%', 
        maxWidth: '400px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
          ⚙️ Cấu hình thiết bị
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>Telegram ID:</label>
          <input 
            type="text" 
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="-123456xxx"
            style={{ 
              width: '100%', padding: '10px', borderRadius: '6px', 
              border: '1px solid #475569', background: '#334155', color: 'white', outline: 'none' 
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Min (%):</label>
            <input 
              type="number" 
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: '#334155', color: 'white' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Max (%):</label>
            <input 
              type="number" 
              value={maxThreshold}
              onChange={(e) => setMaxThreshold(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: '#334155', color: 'white' }}
            />
          </div>
        </div>

        <button 
          onClick={handleSaveConfig}
          style={{ 
            width: '100%', padding: '12px', background: '#2563eb', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem',
            transition: 'background 0.2s'
          }}
        >
          LƯU CẤU HÌNH
        </button>
      </div>
    </div>
  );
}

export default App;
