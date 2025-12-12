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
    if (level >= config.max * 0.7) return { color: '#f59e0b', text: 'CẢNH BÁO', bg: 'bg-yellow-500/20', icon: <Activity /> };
    return { color: '#22c55e', text: 'BÌNH THƯỜNG', bg: 'bg-green-500/20', icon: <CheckCircle /> };
  };

  const status = getStatusColor(currentLevel);
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
          <p className="text-slate-400 text-xs mt-1">Hệ thống cảnh báo lũ lụt thời gian thực</p>
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

        {/* CỘT TRÁI (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Mực nước & Trạng thái */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-10 opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 w-32 h-32 ${status.bg.replace('/20','')}`}></div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thiết bị giám sát</h2>
                <div className="text-xl font-bold text-white mt-1">{selectedStation.name}</div>
                <div className={`px-2 py-0.5 rounded text-[10px] mt-1 inline-block border ${isOnline ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
              <div className="text-right">
                 <div className="text-5xl font-bold text-white tracking-tighter">
                  {currentLevel}<span className="text-xl text-slate-400">%</span>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${status.bg}`}>
              <div style={{ color: status.color }}>{status.icon}</div>
              <div className="flex-1">
                <div className="text-xs text-slate-300">Trạng thái hiện tại</div>
                <div className="font-bold text-sm" style={{ color: status.color }}>{status.text}</div>
              </div>
            </div>
          </div>

          {/* 2. CẤU HÌNH CẢNH BÁO (BẮT BUỘC ĐỂ SET TELEGRAM) */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-lg">
             <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase">
               <Settings size={18} className="text-blue-500"/> Cấu hình & Liên kết
             </h3>
             
             <div className="space-y-4">
                {/* ID TELEGRAM */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Telegram Chat ID (Nhóm)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none text-sm font-mono"
                    value={config.chatId}
                    onChange={(e) => setConfig({...config, chatId: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Mặc định: {DEFAULT_CHAT_ID}</p>
                </div>

                {/* NGƯỠNG MIN / MAX */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Báo an toàn (&lt;%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none text-sm"
                      value={config.min}
                      onChange={(e) => setConfig({...config, min: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Báo nguy hiểm (&gt;%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none text-sm"
                      value={config.max}
                      onChange={(e) => setConfig({...config, max: e.target.value})}
                    />
                  </div>
                </div>

                {/* NÚT LƯU */}
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
                >
                  {isSaving ? "Đang đồng bộ..." : <><Save size={16}/> Lưu xuống thiết bị</>}
                </button>
             </div>
          </div>

          {/* 3. GPS */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-lg">
             {hasGPS ? (
               <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lng}`} 
                 target="_blank" rel="noreferrer"
                 className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
               >
                 <MapPin size={16}/> {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
               </a>
             ) : (
               <div className="flex items-center gap-2 text-slate-500 text-sm">
                 <Signal size={16} className="animate-pulse"/> Đang dò tìm GPS...
               </div>
             )}
          </div>
        </div>

        {/* CỘT PHẢI (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-xl flex-1 min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm uppercase">
                <Activity className="text-purple-500"/> Biểu đồ theo thời gian
              </h3>
              <div className="flex gap-4 text-xs">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Thực tế</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Ngưỡng {config.max}%</div>
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
                  <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 11}} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill:'#1e293b'}} activeDot={{r: 6}} />
                  {/* Đường giới hạn đỏ chạy theo config.max */}
                  <Line type="monotone" dataKey={() => config.max} stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={1} name="Báo động" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Lịch sử */}
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 shadow-lg">
             <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm uppercase">
              <History className="text-green-500"/> Lịch sử đo đạc gần nhất
            </h3>
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs uppercase bg-slate-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-300">Thời gian</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Mực nước</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {historyData.slice().reverse().map((log, index) => (
                    <tr key={index} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-slate-300">{log.time}</td>
                      <td className="px-4 py-3 text-white font-bold">{log.level}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${log.level >= config.max ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
                          {log.level >= config.max ? 'NGUY HIỂM' : 'AN TOÀN'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
