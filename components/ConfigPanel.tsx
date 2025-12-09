import React, { useState, useEffect } from 'react';
import { SystemConfig } from '../types';
import { Settings, Save, Bell, HelpCircle, FileCode } from 'lucide-react';

interface ConfigPanelProps {
  config: SystemConfig;
  onSave: (newConfig: SystemConfig) => void;
  onViewCode: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onSave, onViewCode }) => {
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLocalConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 h-full">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center border-b border-slate-700 pb-2">
        <Settings className="w-5 h-5 mr-2 text-blue-400" />
        Cấu hình cảnh báo
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Ngưỡng tối thiểu (%):
          </label>
          <input
            type="number"
            name="minThreshold"
            value={localConfig.minThreshold}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Ngưỡng tối đa (%):
          </label>
          <input
            type="number"
            name="maxThreshold"
            value={localConfig.maxThreshold}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 py-2">
          <input
            type="checkbox"
            name="enableAlerts"
            id="enableAlerts"
            checked={localConfig.enableAlerts}
            onChange={handleChange}
            className="w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
          />
          <label htmlFor="enableAlerts" className="text-sm font-medium text-slate-300 select-none">
            Bật cảnh báo Telegram
          </label>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center justify-between">
             <div className="flex items-center">
                <Bell className="w-3 h-3 mr-1" /> Telegram Chat ID:
             </div>
             <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center">
                <HelpCircle className="w-3 h-3 mr-1" /> Lấy ID ở đâu?
             </a>
          </label>
          <input
            type="text"
            name="telegramChatId"
            value={localConfig.telegramChatId}
            onChange={handleChange}
            placeholder="Nhập Chat ID của bạn..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="pt-2">
           <label className="block text-sm font-medium text-slate-400 mb-1">
             Telegram Bot Token:
           </label>
           <input
             type="text"
             name="telegramBotToken"
             value={localConfig.telegramBotToken}
             onChange={handleChange}
             placeholder="Nhập Token từ @BotFather..."
             className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
           />
        </div>

        <div className="flex space-x-2 mt-4">
            <button
              type="button"
              onClick={onViewCode}
              className="flex-1 py-2 px-3 rounded-lg font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all flex justify-center items-center text-xs"
            >
              <FileCode className="w-4 h-4 mr-2" /> Xem Code C++
            </button>
            <button
              type="submit"
              className={`flex-[2] py-2 px-4 rounded-lg font-bold text-white transition-all flex justify-center items-center ${
                isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaved ? (
                <>
                  <Save className="w-5 h-5 mr-2" /> Đã lưu!
                </>
              ) : (
                'Lưu Cấu Hình'
              )}
            </button>
        </div>
      </form>
    </div>
  );
};