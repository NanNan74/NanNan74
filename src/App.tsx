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
            }}
          >
            {STATIONS.map(st => (
              <option key={st.id} value={st.id} className="bg-slate-800 text-white">
                {st.name} ({st.id})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* --- NỘI DUNG CHÍNH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CỘT TRÁI: THÔNG TIN TRẠM & GPS (Chiếm 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Mực nước & Trạng thái */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
            {/* Background Effect */}
            <div className={`absolute top-0 right-0 p-10 opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 w-32 h-32 ${status.bg.replace('/20','')}`}></div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thiết bị giám sát</h2>
                <div className="text-xl font-bold text-white mt-1">{selectedStation.name}</div>
                <div className="text-xs text-slate-500 font-mono">{selectedStation.id}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'} flex items-center gap-1`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            
            <div className="flex items-end gap-3 my-6">
              <span className="text-7xl font-bold text-white tracking-tighter">
                {currentLevel}<span className="text-2xl text-slate-400">%</span>
              </span>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${status.bg}`}>
              <div style={{ color: status.color }}>{status.icon}</div>
              <div>
                <div className="text-xs text-slate-300">Trạng thái hiện tại</div>
                <div className="font-bold text-sm" style={{ color: status.color }}>{status.text}</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
               <span className="flex items-center gap-1"><History size={14}/> Cập nhật:</span>
               <span className="font-mono text-white">{lastUpdate}</span>
            </div>
          </div>

          {/* 2. GPS - Chỉ hiện khi có sóng, không bắt buộc */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-lg">
             <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase">
               <Navigation size={18} className="text-blue-500"/> Định vị GPS (NEO-6M)
             </h3>

             {hasGPS ? (
               // TRƯỜNG HỢP CÓ SÓNG GPS
               <>
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700 text-center">
                     <p className="text-[10px] text-slate-500 uppercase">Latitude</p>
                     <p className="text-blue-400 font-mono font-bold text-lg">{gps.lat.toFixed(6)}</p>
                   </div>
                   <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700 text-center">
                     <p className="text-[10px] text-slate-500 uppercase">Longitude</p>
                     <p className="text-blue-400 font-mono font-bold text-lg">{gps.lng.toFixed(6)}</p>
                   </div>
                 </div>
                 <a 
                   href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lng}`} 
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition text-sm font-medium shadow-lg shadow-blue-500/20"
                 >
                   <MapPin size={16} /> Xem trên Google Maps
                 </a>
               </>
             ) : (
               // TRƯỜNG HỢP MẤT SÓNG GPS (Vẫn hiện đẹp)
               <div className="flex flex-col items-center justify-center py-4 text-slate-500 bg-[#0f172a] rounded-lg border border-slate-700 border-dashed">
                 <Signal size={32} className="mb-2 animate-pulse text-slate-600" />
                 <span className="text-sm font-medium">Đang dò tìm vệ tinh...</span>
                 <span className="text-xs mt-1 text-slate-600">Mực nước vẫn cập nhật bình thường</span>
               </div>
             )}
          </div>

        </div>

        {/* CỘT PHẢI: BIỂU ĐỒ & LỊCH SỬ (Chiếm 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Biểu đồ */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl flex-1 min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm uppercase">
                <Activity className="text-purple-500"/> Biểu đồ theo thời gian
              </h3>
              <div className="flex gap-4 text-xs">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Thực tế</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Ngưỡng báo động</div>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    tick={{fill: '#94a3b8', fontSize: 11}} 
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    domain={[0, 100]} 
                    tick={{fill: '#94a3b8', fontSize: 11}} 
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa' }}
                    cursor={{ stroke: '#475569', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="level" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{r: 4, fill:'#1e293b', stroke:'#3b82f6', strokeWidth: 2}}
                    activeDot={{r: 6, fill: '#60a5fa'}}
                    animationDuration={1000}
                  />
                  <Line type="monotone" dataKey="max" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng nhật ký */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-lg">
             <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase">
              <History className="text-green-500"/> Lịch sử đo đạc gần nhất
            </h3>
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs uppercase bg-slate-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-300">Thời gian</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Mực nước</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {historyData.slice().reverse().map((log, index) => (
                    <tr key={index} className="hover:bg-slate-800/50 transition duration-150">
                      <td className="px-4 py-3 font-mono text-slate-300">{log.time}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-700 rounded-full h-1.5 max-w-[100px] inline-block mr-2 align-middle">
                          <div className={`h-1.5 rounded-full ${getStatusColor(log.level).color.replace('text','bg')}`} style={{width: `${log.level}%`}}></div>
                        </div>
                        <span className="text-white font-bold">{log.level}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${log.level >= 50 ? 'border-red-500/30 bg-red-500/10 text-red-400' : (log.level >= 30 ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-green-500/30 bg-green-500/10 text-green-400')}`}>
                          {log.level >= 50 ? 'NGUY HIỂM' : (log.level >= 30 ? 'CẢNH BÁO' : 'AN TOÀN')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-slate-500 italic">Chưa có dữ liệu...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
