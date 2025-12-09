import React, { useState } from 'react';
import { X, Copy, Check, Code, Cpu, MapPin, Waves, BookOpen, FileCode, Play } from 'lucide-react';
import { SystemConfig } from '../types';

interface FirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
}

export const FirmwareModal: React.FC<FirmwareModalProps> = ({ isOpen, onClose, config }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'guide'>('guide'); // Default to guide since they are asking how

  if (!isOpen) return null;

  const firmwareCode = `/*
 * PROJECT: HỆ THỐNG CẢNH BÁO LŨ LỤT (FLOOD WARNING SYSTEM)
 * TEAM: Nhóm Slầy Gơ, HCMUE
 * HARDWARE: 
 *  - ESP32 (DOIT DEVKIT V1)
 *  - Cảm biến siêu âm (HC-SR04 hoặc JSN-SR04T chống nước)
 *  - Module GPS (NEO-6M hoặc tương đương)
 *  - 3 LED (Xanh, Vàng, Đỏ) + Còi 5V (Active Buzzer)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

// --- 1. CẤU HÌNH WIFI & TELEGRAM ---
const char* ssid = "TEN_WIFI_CUA_BAN";     
const char* password = "MAT_KHAU_WIFI";    

#define BOTtoken "${config.telegramBotToken || 'NHAP_BOT_TOKEN_VAO_DAY'}" 
#define CHAT_ID "${config.telegramChatId}"

WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

// --- 2. CẤU HÌNH CHÂN (GPIO) ---
// Đèn & Còi
#define LED_LOW 18       // Xanh
#define LED_NORMAL 19    // Vàng
#define LED_HIGH 21      // Đỏ
#define BUZZER_PIN 23    // Còi

// Cảm biến siêu âm (HC-SR04)
#define TRIG_PIN 5       
#define ECHO_PIN 17      

// GPS (Serial 2 của ESP32)
#define RXD2 16          // TX của GPS -> GPIO 16
#define TXD2 4           // RX của GPS -> GPIO 4
HardwareSerial neogps(2);
TinyGPSPlus gps;

// --- 3. CẤU HÌNH BỂ CHỨA ---
// Khoảng cách từ cảm biến đến đáy bể (cm) - Tức là mực nước 0%
const int DISTANCE_EMPTY = 200; 
// Khoảng cách từ cảm biến đến mực nước đầy (cm) - Tức là mực nước 100%
const int DISTANCE_FULL = 20;   

// --- BIẾN TOÀN CỤC ---
String currentStatus = "INIT";
String lastSentStatus = "";
unsigned long lastCheckTime = 0;
const long checkInterval = 2000; 

void updateHardware(int percent);
int getWaterLevel();
String getGPSLocation();

void setup() {
  Serial.begin(115200);
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2); 

  pinMode(LED_LOW, OUTPUT);
  pinMode(LED_NORMAL, OUTPUT);
  pinMode(LED_HIGH, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 15) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" WiFi Connected!");
    client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
    bot.sendMessage(CHAT_ID, "Hệ thống Slầy Gơ (GPS + Ultrasonic) đã khởi động!", "");
  } else {
    Serial.println(" WiFi Failed! Running Offline.");
  }
}

void loop() {
  while (neogps.available()) {
    gps.encode(neogps.read());
  }

  if (millis() - lastCheckTime > checkInterval) {
    lastCheckTime = millis();
    
    int percent = getWaterLevel();
    Serial.printf("Water: %d%% | Status: %s\n", percent, currentStatus.c_str());

    updateHardware(percent);

    if (WiFi.status() == WL_CONNECTED) {
      if (currentStatus != lastSentStatus) {
        String message = "⚠️ <b>CẢNH BÁO LŨ LỤT!</b>\n";
        message += "---------------------\n";
        message += "🌊 Mức nước: " + String(percent) + "%\n";
        message += "📊 Trạng thái: " + currentStatus + "\n";
        
        String locationLink = getGPSLocation();
        if (locationLink != "") {
          message += "📍 Vị trí: " + locationLink + "\n";
        } else {
          message += "📍 Vị trí: Đang dò tìm vệ tinh...\n";
        }
        
        if (bot.sendMessage(CHAT_ID, message, "HTML")) {
          lastSentStatus = currentStatus;
        }
      }
    }
  }
}

int getWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = duration * 0.034 / 2;
  int level = map(distance, DISTANCE_EMPTY, DISTANCE_FULL, 0, 100);
  
  if (level < 0) level = 0;
  if (level > 100) level = 100;
  
  return level;
}

String getGPSLocation() {
  if (gps.location.isValid()) {
    return "https://www.google.com/maps?q=" + 
           String(gps.location.lat(), 6) + "," + 
           String(gps.location.lng(), 6);
  }
  return "";
}

void updateHardware(int percent) {
  digitalWrite(LED_LOW, LOW);
  digitalWrite(LED_NORMAL, LOW);
  digitalWrite(LED_HIGH, LOW);
  noTone(BUZZER_PIN);

  if (percent < ${config.minThreshold}) {
    currentStatus = "AN TOÀN";
    digitalWrite(LED_LOW, HIGH);
  }
  else if (percent >= ${config.minThreshold} && percent < ${config.maxThreshold}) {
    currentStatus = "CẢNH BÁO";
    digitalWrite(LED_NORMAL, HIGH);
  }
  else {
    currentStatus = "NGUY HIỂM";
    digitalWrite(LED_HIGH, HIGH);
    tone(BUZZER_PIN, 1500); 
  }
}
`;

  const iniCode = `[env:esp32doit-devkit-v1]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino
monitor_speed = 115200
lib_deps = 
	witnessmenow/UniversalTelegramBot @ ^1.3.0
	bblanchon/ArduinoJson @ ^6.21.3
	mikalhart/TinyGPSPlus @ ^1.0.3`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nạp Code ESP32</h2>
               <div className="text-xs text-slate-400 mt-0.5">Sử dụng PlatformIO Extension</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900">
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'guide' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <BookOpen className="w-4 h-4 mr-2" /> 1. Hướng dẫn Tạo Project
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <Code className="w-4 h-4 mr-2" /> 2. Mã Nguồn (Copy & Paste)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
           {activeTab === 'code' ? (
               <>
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center text-xs text-slate-400 font-mono">
                        <FileCode className="w-4 h-4 mr-2 text-blue-500" />
                        src/main.cpp
                    </div>
                    <button 
                        onClick={() => handleCopy(firmwareCode)}
                        className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${
                            copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                    >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP CODE'}
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] font-mono text-sm relative custom-scrollbar">
                    <pre className="text-blue-300 whitespace-pre-wrap leading-relaxed">{firmwareCode}</pre>
                </div>
               </>
           ) : (
               <div className="flex-1 overflow-auto p-8 bg-slate-900 text-slate-300 custom-scrollbar">
                   <div className="max-w-3xl mx-auto space-y-8">
                        
                       {/* Intro Box */}
                       <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 rounded-xl p-6 flex items-start gap-4">
                           <div className="bg-blue-600/20 p-3 rounded-full">
                               <Cpu className="w-6 h-6 text-blue-400" />
                           </div>
                           <div>
                               <h3 className="text-white font-bold text-lg mb-1">Bạn đã có PlatformIO!</h3>
                               <p className="text-sm text-slate-300">
                                   Hình ảnh của bạn cho thấy extension đã được cài đặt. Bây giờ hãy làm theo 3 bước sau để nạp code vào mạch ESP32.
                               </p>
                           </div>
                       </div>

                       {/* Step 1 */}
                       <div className="space-y-3 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước 1: Tạo dự án mới</h3>
                           <p className="text-sm text-slate-400">Trong VS Code, bấm vào biểu tượng "Đầu người ngoài hành tinh" bên trái, chọn <span className="text-white font-medium">PIO Home -&gt; Open -&gt; New Project</span>:</p>
                           <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                               <li className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between">
                                   <span className="text-slate-400">Name:</span>
                                   <span className="text-green-400 font-mono font-bold">FloodGuard</span>
                               </li>
                               <li className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between">
                                   <span className="text-slate-400">Board:</span>
                                   <span className="text-yellow-400 font-mono font-bold">DOIT ESP32 DEVKIT V1</span>
                               </li>
                               <li className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between">
                                   <span className="text-slate-400">Framework:</span>
                                   <span className="text-blue-400 font-mono font-bold">Arduino</span>
                               </li>
                           </ul>
                       </div>

                       {/* Step 2 */}
                       <div className="space-y-3 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước 2: Cấu hình thư viện</h3>
                           <p className="text-sm text-slate-400">
                               Mở file <code className="text-yellow-400 bg-slate-800 px-1 rounded">platformio.ini</code> (nằm ở thư mục gốc dự án) và dán đè nội dung sau vào:
                           </p>
                           <div className="bg-black/50 p-4 rounded-lg border border-slate-700 relative group font-mono text-xs">
                                <pre className="text-green-400">{iniCode}</pre>
                                <button 
                                    onClick={() => handleCopy(iniCode)}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    Copy
                                </button>
                           </div>
                       </div>

                       {/* Step 3 */}
                       <div className="space-y-3 relative pl-8 border-l-2 border-slate-700 pb-2">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước 3: Dán Code & Nạp</h3>
                           <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                               <li>Chuyển sang tab <strong className="text-white">2. Mã Nguồn</strong> ở cửa sổ này và bấm <strong>Sao chép Code</strong>.</li>
                               <li>Trong VS Code, mở file <code className="text-yellow-400 bg-slate-800 px-1 rounded">src/main.cpp</code>.</li>
                               <li>Xóa hết nội dung cũ và dán code vừa copy vào.</li>
                               <li>Sửa <code className="text-white">ssid</code> và <code className="text-white">password</code> Wifi trong code.</li>
                               <li>Cắm cáp ESP32 vào máy tính.</li>
                               <li>Bấm nút mũi tên <strong className="text-white">➡️ (Upload)</strong> dưới đáy màn hình VS Code.</li>
                           </ol>
                       </div>

                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};