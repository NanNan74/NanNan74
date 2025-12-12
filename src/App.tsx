import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { ref, onValue, set, push, limitToLast, query } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Droplets, History, Activity, Save } from 'lucide-react';

// --- KIỂU DỮ LIỆU ---
interface LogData {
  id: string;
  time: string;
  level: number;
  status: string;
}

function App() {
  // State
  const [currentLevel, setCurrentLevel] = useState(0);
  const [historyData, setHistoryData] = useState<LogData[]>([]);
  const [lastUpdate, setLastUpdate] = useState("Đang tải...");
  
  // Config State
  const [telegramId, setTelegramId] = useState("");
  const [minThreshold, setMinThreshold] = useState(10);
  const [maxThreshold, setMaxThreshold] = useState(80);
  const [isAlertEnabled, setIsAlertEnabled] = useState(true);

  // --- 1. LẤY DỮ LIỆU TỪ FIREBASE ---
  useEffect(() => {
    // A. Lắng nghe giá trị hiện tại (sensors/current)
    const currentRef = ref(db, 'sensors/current');
    onValue(currentRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) setCurrentLevel(Number(val));
    });

    // B. Lắng nghe thời gian cập nhật cuối
    const timeRef = ref(db, 'sensors/lastUpdate');
    onValue(timeRef, (snapshot) => {
      if(snapshot.val()) setLastUpdate(snapshot.val());
    });

    // C. Lắng nghe Lịch sử (Lấy 10 dòng cuối cùng từ sensors/history)
    const historyRef = query(ref(db, 'sensors/history'), limitToLast(10));
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển đổi object thành mảng để vẽ biểu đồ
        const list: LogData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setHistoryData(list);
      }
    });

    // D. Lấy cấu hình
    const configRef = ref(db, 'config');
    onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTelegramId(data.telegramId || "");
        setMinThreshold(data.minThreshold || 10);
        setMaxThreshold(data.maxThreshold || 80);
        setIsAlertEnabled(data.isAlertEnabled ?? true);
      }
    });
  }, []);

  // --- 2. HÀM LƯU CẤU HÌNH ---
  const handleSaveConfig = () => {
    set(ref(db, 'config'), {
      telegramId,
      minThreshold: Number(minThreshold),
      maxThreshold: Number(maxThreshold),
      isAlertEnabled
    })
    .then(() => alert("✅ Đã lưu cấu hình thành công!"))
    .catch(err => alert("❌ Lỗi: " + err.message));
  };

  // Xác định trạng thái (Low/High/Normal)
  const getStatus = (level: number) => {
    if (level >= maxThreshold) return { text: "HIGH", color: "text-red-500", bg: "bg-red-500/10" };
    if (level <= minThreshold) return { text: "LOW", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { text: "NORMAL", color: "text-green-500", bg: "bg-green-500/10" };
  };

  const currentStatus = getStatus(currentLevel);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans">
      {/* HEADER */}
      <header className="mb-8 flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" /> CẢNH BÁO LŨ LỤT - DASHBOARD
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hệ thống giám sát mực nước thời gian thực</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium">System Online</span>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* CỘT 1: TRẠNG THÁI HIỆN TẠI */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Droplets className="text-blue-400" /> Trạng thái mới nhất
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Thiết bị</span>
              <span className="font-medium text-white">ESP32-Sensor-01</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Mực nước</span>
              <span className={`text-2xl font-bold ${currentStatus.color}`}>{currentLevel}%</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Cảnh báo</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${currentStatus.bg} ${currentStatus.color}`}>
                {currentStatus.text}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Cập nhật lúc</span>
              <span className="text-sm text-white">{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* CỘT 2: BIỂU ĐỒ (Dùng Recharts) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-purple-400" /> Biểu đồ mực nước gần đây
          </h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI DƯỚI: BẢNG LỊCH SỬ */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="text-orange-400" /> Lịch sử đo đạc
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-700 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Mực nước (%)</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {historyData.slice().reverse().map((log) => (
                  <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3">{log.time}</td>
                    <td className="px-4 py-3 font-medium text-white">{log.level}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatus(log.level).bg} ${getStatus(log.level).color}`}>
                        {getStatus(log.level).text}
                      </span>
                    </td>
                  </tr>
                ))}
                {historyData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-slate-500">Chưa có dữ liệu lịch sử</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT PHẢI DƯỚI: CẤU HÌNH */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="text-gray-400" /> Cấu hình cảnh báo
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ngưỡng tối thiểu (%):</label>
              <input 
                type="number" 
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ngưỡng tối đa (%):</label>
              <input 
                type="number" 
                value={maxThreshold}
                onChange={(e) => setMaxThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" 
                checked={isAlertEnabled}
                onChange={(e) => setIsAlertEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Bật cảnh báo Telegram</span>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Telegram Chat ID:</label>
              <input 
                type="text" 
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="-123456789"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>

            <button 
              onClick={handleSaveConfig}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu Cấu Hình
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
