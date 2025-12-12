import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
// THÊM: import 'set' để lưu dữ liệu
import { ref, onValue, set } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Activity, Navigation, Droplets, History, AlertTriangle, CheckCircle, Signal, Settings, Save, Bell } from 'lucide-react';

// --- CẤU HÌNH MẶC ĐỊNH ---
const DEFAULT_CHAT_ID = "-5023306137"; 

const STATIONS = [
  { id: 'river-002', name: 'Nhà Ngọc Anh', address: 'Khu vực Hạ lưu (Trạm chính)' }, 
  { id: 'river-001', name: 'Nhà Ánh Như', address: 'Khu vực Thượng nguồn' },
  { id: 'river-003', name: 'Nhà Thủy Tiên', address: 'Khu vực Trũng thấp' }
];

function App() {
  const [selectedStation, setSelectedStation] = useState(STATIONS[0]);
  
  // State dữ liệu hiển thị
  const [currentLevel, setCurrentLevel] = useState(0);
  const [historyData, setHistoryData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Đang chờ kết nối...");
  const [gps, setGps] = useState({ lat: 0, lng: 0 });
  const [isOnline, setIsOnline] = useState(false);

  // --- STATE CẤU HÌNH (QUAN TRỌNG) ---
  const [config, setConfig] = useState({
    min: 0,
    max: 50,
    chatId: DEFAULT_CHAT_ID, // Mặc định hiển thị luôn
    active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- LẮNG NGHE DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    setCurrentLevel(0);
    setHistoryData([]);
    setGps({ lat: 0, lng: 0 }); 
    setLastUpdate("Đang tải dữ liệu...");
    setIsOnline(false);

    const deviceRef = ref(db, `devices/${selectedStation.id}`);

    const unsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsOnline(true);
        setCurrentLevel(Number(data.water_level_percent || 0));
        setLastUpdate(data.last_updated || new Date().toLocaleTimeString('vi-VN'));
        
        setGps({ 
          lat: Number(data.latitude || 0), 
          lng: Number(data.longitude || 0) 
        });

        // --- LOGIC LẤY CẤU HÌNH ---
        if (data.config) {
          // Nếu trên Firebase có dữ liệu, lấy về
          setConfig({
            min: data.config.min !== undefined ? data.config.min : 0,
            max: data.config.max !== undefined ? data.config.max : 50,
            chatId: data.config.telegram_id || DEFAULT_CHAT_ID,
            active: data.config.alert_active ?? true
          });
        } else {
          // Nếu Firebase chưa có (lần đầu), dùng mặc định
          setConfig(prev => ({ ...prev, chatId: DEFAULT_CHAT_ID }));
        }

        if (data.history) {
          const list = Object.keys(data.history).map(key => ({
            id: key, ...data.history[key]
          }));
          setHistoryData(list.slice(-15)); 
        } else {
          setHistoryData(prev => {
             const newData = [...prev, { 
               id: Date.now().toString(), 
               time: new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}), 
               level: Number(data.water_level_percent || 0) 
             }];
             return newData.slice(-20);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [selectedStation]);

  // --- HÀM LƯU CẤU HÌNH ---
  const handleSaveConfig = () => {
    setIsSaving(true);
    const configRef = ref(db, `devices/${selectedStation.id}/config`);
    
    // Gửi cấu hình lên Firebase để ESP32 đọc
    set(configRef, {
      min: Number(config.min),
      max: Number(config.max),
      telegram_id: config.chatId,
      alert_active: config.active
    })
    .then(() => {
      alert(`✅ Đã lưu!\nChat ID: ${config.chatId}\nBáo động khi > ${config.max}%`);
      setIsSaving(false);
    })
    .catch((err) => {
      alert("❌ Lỗi: " + err.message);
      setIsSaving(false);
    });
  };

  // Logic màu sắc dựa trên cấu hình Max
  const getStatusColor = (level) => {
    // Dùng config.max thay vì số cứng 50
    if (level >= config.max) return { color: '#ef4444', text: 'NGUY HIỂM', bg: 'bg-red-500/20', icon: <AlertTriangle /> };
    if (level >= config.max * 0.7) return { color: '#f59e0b', text: 'CẢNH BÁO', bg: 'bg-ye
