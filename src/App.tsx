import React, { useState, useEffect, useCallback } from 'react';
import { StatusCard } from './components/StatusCard';
import { HistoryChart } from './components/HistoryChart';
import { HistoryList } from './components/HistoryList';
import { ConfigPanel } from './components/ConfigPanel';
import { GeminiAnalysis } from './components/GeminiAnalysis';
import { FirmwareModal } from './components/FirmwareModal';
import { GitHubModal } from './components/GitHubModal';
import { generateMockReading } from './services/mockService';
import { DEFAULT_DEVICES, DEFAULT_CONFIG } from './constants';
import { WaterReading, SystemConfig, Device } from './types';
import { ShieldCheck, Cpu, Loader2, Wifi, Terminal, CheckCircle2, Github, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEFAULT_DEVICES[0]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [isFirmwareOpen, setIsFirmwareOpen] = useState(false);
  const [firmwareInitialTab, setFirmwareInitialTab] = useState<'guide' | 'telegram' | 'code'>('guide');
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  
  // Simulate System Boot Sequence
  useEffect(() => {
    const steps = [
      "Khởi tạo Core System...",
      "Kết nối vệ tinh GPS...",
      "Đồng bộ hóa Gemini AI...",
      "Thiết lập giao thức bảo mật...",
      "Hoàn tất."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      } else {
        setBootStep(currentStep);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Simulate data stream
  useEffect(() => {
    // Initial Seed
    const initialReadings: WaterReading[] = [];
    let seedLevel = 40;
    const now = Date.now();
    for(let i=20; i>0; i--) {
        const reading = generateMockReading(selectedDevice.id, seedLevel);
        reading.timestamp = now - (i * 5000); // Back in time
        initialReadings.push(reading);
        seedLevel = reading.level;
    }
    setReadings(initialReadings);

    // Live Interval
    const interval = setInterval(() => {
      setReadings(prev => {
        const lastLevel = prev.length > 0 ? prev[prev.length - 1].level : 50;
        const newReading = generateMockReading(selectedDevice.id, lastLevel);
        
        // Keep only last 50 readings
        const newHistory = [...prev, newReading].slice(-50);
        return newHistory;
      });
    }, 3000); // New data every 3 seconds

    return () => clearInterval(interval);
  }, [selectedDevice]);

  const handleSaveConfig = useCallback((newConfig: SystemConfig) => {
    setConfig(newConfig);
    console.log("Config saved:", newConfig);
  }, []);

  const handleOpenFirmware = (tab: 'guide' | 'telegram' | 'code' = 'guide') => {
    setFirmwareInitialTab(tab);
    setIsFirmwareOpen(true);
  };

  if (isBooting) {
    const bootMessages = [
      "System Kernel Loading...",
      "Connecting to GPS Satellites...",
      "Initializing AI Neural Network...",
      "Establishing Secure Connection...",
      "System Ready."
    ];

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-mono relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <ShieldCheck className="w-20 h-20 text-blue-500 relative z-10" />
          </div>
          
          <h2 className="text-3xl font-bold mb-1 tracking-widest text-white uppercase">FloodGuard</h2>
          <p className="text-slate-500 text-sm mb-8">System v2.5.0</p>

          <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 font-mono text-sm h-48 flex flex-col">
            {bootMessages.map((msg, index) => (
              <div key={index} className={`flex items-center mb-2 transition-all duration-500 ${index > bootStep ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                {index < bootStep ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                ) : index === bootStep ? (
                  <Loader2 className="w-4 h-4 text-blue-500 mr-2 animate-spin flex-shrink-0" />
                ) : (
                   <div className="w-4 h-4 mr-2"></div>
                )}
                <span className={index === bootStep ? "text-blue-400 font-bold" : "text-slate-400"}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out" 
              style={{width: `${Math.min((bootStep / (bootMessages.length - 1)) * 100, 100)}%`}}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-10 font-sans selection:bg-blue-500/30">
      <FirmwareModal 
        isOpen={isFirmwareOpen} 
        onClose={() => setIsFirmwareOpen(false)} 
        config={config} 
        initialTab={firmwareInitialTab}
      />
      
      <GitHubModal 
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
      />

      {/* Navbar */}
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
               <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">
                FloodGuard <span className="text-blue-500">AI</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center">
                <Terminal className="w-3 h-3 mr-1" /> HCMUE Project
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsGitHubOpen(true)}
              className="hidden md:flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition-all border border-slate-700"
              title="Hướng dẫn đẩy code lên GitHub & Public Web"
            >
               <Github className="w-4 h-4" />
               <span className="text-sm font-medium">GitHub / Public Web</span>
            </button>

            <button 
              onClick={() => handleOpenFirmware('guide')}
              className="hidden md:flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all border border-blue-500 shadow-lg shadow-blue-900/50 group animate-pulse-slow"
            >
               <Cpu className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
               <span className="text-sm font-bold">Nạp Code ESP32</span>
            </button>

            <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs font-bold text-green-400 hidden sm:inline">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 mt-8 animate-fade-in-up">
        
        {/* Device Selector & Mobile Buttons */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chọn trạm quan trắc:</label>
            <div className="relative group">
              <select 
                value={selectedDevice.id}
                onChange={(e) => {
                    const dev = DEFAULT_DEVICES.find(d => d.id === e.target.value);
                    if(dev) setSelectedDevice(dev);
                }}
                className="w-full bg-slate-800 border border-slate-700 group-hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-lg transition-all appearance-none cursor-pointer"
              >
                {DEFAULT_DEVICES.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          {/* Mobile Firmware Button */}
          <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={() => setIsGitHubOpen(true)}
                className="md:hidden flex-1 flex items-center justify-center space-x-2 bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 font-bold shadow-lg active:scale-95 transition-transform"
              >
                <Globe className="w-4 h-4" />
                <span>Web / Deploy</span>
              </button>
              
              <button 
                onClick={() => handleOpenFirmware('code')}
                className="md:hidden flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl border border-blue-500 font-bold shadow-lg active:scale-95 transition-transform"
              >
                <Cpu className="w-4 h-4" />
                <span>Nạp Code</span>
              </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Status & Config */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <StatusCard currentReading={readings.length > 0 ? readings[readings.length - 1] : null} />
            <ConfigPanel 
                config={config} 
                onSave={handleSaveConfig} 
                onViewCode={() => handleOpenFirmware('code')}
            />
            <GeminiAnalysis data={readings} config={config} />
          </div>

          {/* Right Column: Charts & History */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <HistoryChart data={readings} config={config} />
            <HistoryList data={[...readings].reverse()} />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center py-8 border-t border-slate-800">
        <div className="flex justify-center items-center space-x-2 text-slate-600 text-sm mb-2">
            <Cpu className="w-4 h-4" />
            <span>ESP32</span>
            <span>•</span>
            <Terminal className="w-4 h-4" />
            <span>PlatformIO</span>
            <span>•</span>
            <span className="font-bold text-blue-500/80">Gemini AI</span>
        </div>
        <p className="text-slate-500 text-xs">© 2025 FloodGuard System - HCMUE Student Project</p>
      </footer>
    </div>
  );
};

export default App;
