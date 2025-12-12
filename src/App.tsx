import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { ref, onValue } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Activity, Navigation, Wifi, Droplets, History, AlertTriangle, CheckCircle, Signal } from 'lucide-react';

// --- 1. CẤU HÌNH DANH SÁCH TRẠM ---
// Đã sửa river-002 thành Nhà Ngọc Anh theo yêu cầu
const STATIONS = [
  { id: 'river-002', name: 'Nhà Ngọc Anh', address: 'Khu vực Hạ lưu (Trạm chính)' }, 
  { id: 'river-001', name: 'Nhà Ánh Như', address: 'Khu vực Thượng nguồn' },
  { id: 'river-003', name: 'Nhà Thủy Tiên', address: 'Khu vực Trũng thấp' }
];

interface LogData {
  id: string;
  time: string;
  level: number;
}

function App() {
  const [selectedStation, setSelectedStation] = useState(STATIONS[0]);
  
  // State dữ liệu
  const [currentLevel, setCurrentLevel] = useState(0);
  const [historyData, setHistoryData] = useState<LogData[]>([]);
  const [lastUpdate, setLastUpdate] = useState("Đang chờ kết nối...");
  const [gps, setGps] = useState({ lat: 0, lng: 0 });
  const [isOnline, setIsOnline] = useState(false);

  // --- 2. LẮNG NGHE DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    // Reset dữ liệu tạm thời khi chuyển trạm
    setCurrentLevel(0);
    setHistoryData([]);
    setGps({ lat: 0, lng: 0 }); 
    setLastUpdate("Đang tải dữ liệu...");
    setIsOnline(false);

    // Lắng nghe nhánh: devices/{device_id}
    const deviceRef = ref(db, `devices/${selectedStation.id}`);

    const unsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsOnline(true);
        // Cập nhật mực nước
        setCurrentLevel(Number(data.water_level_percent || 0));
        setLastUpdate(data.last_updated || new Date().toLocaleTimeString('vi-VN'));
        
        // Cập nhật GPS (Nếu ESP gửi 0 thì nhận 0)
        setGps({ 
          lat: Number(data.latitude || 0), 
          lng: Number(data.longitude || 0) 
        });

        // Xử lý lịch sử (nếu có) hoặc tự tạo để vẽ biểu đồ cho đẹp
        if (data.history) {
          const list = Object.keys(data.history).map(key => ({
            id: key, ...data.history[key]
          }));
          setHistoryData(list.slice(-15)); 
        } else {
          // Code này để vẽ biểu đồ chạy chạy khi chưa có backend lưu history
          setHistoryData(prev => {
             const newData = [...prev, { 
               id: Date.now().toString(), 
               time: new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}), 
               level: Number(data.water_level_percent || 0) 
             }];
             return newData.slice(-20); // Giữ lại 20 điểm dữ liệu
          });
        }
      }
    });

    return () => unsubscribe();
  }, [selectedStation]);

  // Logic màu sắc cảnh báo
  const getStatusColor = (level: number) => {
    if (level >= 50) return { color: '#ef4444', text: 'NGUY HIỂM', bg: 'bg-red-500/20', icon: <AlertTriangle /> };
    if (level >= 30) return { color: '#f59e0b', text: 'CẢNH BÁO', bg: 'bg-yellow-500/20', icon: <Activity /> };
    return { color: '#22c55e', text: 'BÌNH THƯỜNG', bg: 'bg-green-500/20', icon: <CheckCircle /> };
  };

  const status = getStatusColor(currentLevel);
  // Kiểm tra xem GPS có hợp lệ không (Khác 0)
  const hasGPS = gps.lat !== 0 && gps.lng !== 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-6">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-blue-500 flex items-center gap-2">
            <Droplets size={28} className="fill-blue-500 text-blue-500" /> 
            FLOODGUARD <span className="text-white">DASHBOARD</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Hệ thống cảnh báo lũ lụt thời gian thực - HCMUE</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
          <MapPin size={18} className="ml-2 text-slate-400" />
          <select 
            className="bg-transparent text-white p-2 outline-none cursor-pointer font-medium text-sm min-w-[180px]"
            value={selectedStation.id}
            onChange={(e) => {
              const station = STATIONS.find(s => s.id === e.target.value);
              if (station) setSelectedStation(station);
