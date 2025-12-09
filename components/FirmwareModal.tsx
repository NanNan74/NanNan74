import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code, Cpu, BookOpen, FileCode, MessageCircle, Send } from 'lucide-react';
import { SystemConfig } from '../types';

interface FirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  initialTab?: 'guide' | 'telegram' | 'code';
}

export const FirmwareModal: React.FC<FirmwareModalProps> = ({ isOpen, onClose, config, initialTab = 'guide' }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'telegram' | 'code'>(initialTab);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Placeholder logic for the code display
  const botTokenDisplay = config.telegramBotToken ? config.telegramBotToken : 'PASTE_BOT_TOKEN_HERE';
  const chatIdDisplay = config.telegramChatId ? config.telegramChatId : 'PASTE_CHAT_ID_HERE';

  const firmwareCode = `/*
 * PROJECT: HỆ THỐNG CẢNH BÁO LŨ LỤT (FLOOD WARNING SYSTEM)
 * TEAM: Nhóm Slầy Gơ, HCMUE
 * HARDWARE: 
 *  - ESP32 (DOIT DEVKIT V1)
 *  - Cảm biến siêu âm (HC-SR04 hoặc JSN-SR04T chống nước)
 *  - Module GPS (NEO-6M)
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

// Lấy từ @BotFather
#define BOTtoken "${botTokenDisplay}" 
// Lấy từ @userinfobot hoặc ID của bạn
#define CHAT_ID "${chatIdDisplay}"

WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

// --- 2. CẤU HÌNH CHÂN (GPIO) ---
// Đèn & Còi
#define LED_LOW 18       // Xanh (An toàn)
#define LED_NORMAL 19    // Vàng (Cảnh báo)
#define LED_HIGH 21      // Đỏ (Nguy hiểm)
#define BUZZER_PIN 23    // Còi

// Cảm biến siêu âm (HC-SR04)
#define TRIG_PIN 5       
#define ECHO_PIN 17      

// GPS (Serial 2 của ESP32)
#define RXD2 16          // TX của GPS -> GPIO 16 (RX2)
#define TXD2 4           // RX của GPS -> GPIO 4 (TX2)
HardwareSerial neogps(2);
TinyGPSPlus gps;

// --- 3. CẤU HÌNH BỂ CHỨA ---
// Khoảng cách từ cảm biến đến đáy (cm) -> Mức nước 0%
const int DISTANCE_EMPTY = 200; 
// Khoảng cách từ cảm biến đến mặt nước đầy (cm) -> Mức nước 100%
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
  
  client.setCACert(TELEGRAM_CERTIFICATE_ROOT); // Add root certificate for api.telegram.org
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 15) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" WiFi Connected!");
    bot.sendMessage(CHAT_ID, "🚀 Hệ thống Cảnh báo Lũ lụt đã khởi động!", "");
  } else {
    Serial.println(" WiFi Failed! Running Offline.");
  }
}

void loop() {
  // Đọc dữ liệu GPS liên tục
  while (neogps.available()) {
    gps.encode(neogps.read());
  }

  if (millis() - lastCheckTime > checkInterval) {
    lastCheckTime = millis();
    
    int percent = getWaterLevel();
    Serial.printf("Water: %d%% | Status: %s\n", percent, currentStatus.c_str());

    updateHardware(percent);

    // Logic gửi Telegram
    if (WiFi.status() == WL_CONNECTED) {
      // Chỉ gửi khi trạng thái thay đổi (VD: Từ An toàn -> Cảnh báo)
      // Hoặc gửi định kỳ nếu đang ở mức Nguy Hiểm (cần thêm logic đếm thời gian)
      if (currentStatus != lastSentStatus) {
        
        String message = "";
        if (currentStatus == "NGUY HIỂM") message += "🚨 <b>CẢNH BÁO KHẨN CẤP!</b> 🚨\n";
        else if (currentStatus == "CẢNH BÁO") message += "⚠️ <b>Cảnh báo mức nước cao</b>\n";
        else message += "✅ <b>Trạng thái an toàn</b>\n";
        
        message += "---------------------\n";
        message += "🌊 Mức nước: " + String(percent) + "%\n";
        message += "📊 Trạng thái: " + currentStatus + "\n";
        
        String locationLink = getGPSLocation();
        if (locationLink != "") {
          message += "📍 Vị trí: <a href='" + locationLink + "'>Xem trên Google Maps</a>\n";
        } else {
          message += "📍 Vị trí: Đang dò tìm vệ tinh...\n";
        }
        
        if (bot.sendMessage(CHAT_ID, message, "HTML")) {
          lastSentStatus = currentStatus;
        } else {
          Serial.println("Gửi Telegram thất bại");
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
  
  // Xử lý nhiễu cơ bản
  if (distance == 0 || distance > 400) return 0; // Out of range

  int level = map(distance, DISTANCE_EMPTY, DISTANCE_FULL, 0, 100);
  
  if (level < 0) level = 0;
  if (level > 100) level = 100;
  
  return level;
}

String getGPSLocation() {
  if (gps.location.isValid()) {
    // Trả về link Google Maps
    return "https://www.google.com/maps?q=" + 
           String(gps.location.lat(), 6) + "," + 
           String(gps.location.lng(), 6);
  }
  return "";
}

void updateHardware(int percent) {
  // Reset đèn
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
    tone(BUZZER_PIN, 1500); // Còi kêu
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
      <div className="bg-slate-900 w-full max-w-5xl rounded-xl border border-slate-700 shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Cấu hình & Nạp Code ESP32</h2>
               <div className="text-xs text-slate-400 mt-0.5">Làm theo thứ tự 1 - 2 - 3 để hoàn thành</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'guide' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <BookOpen className="w-4 h-4 mr-2" /> 1. Tạo Project
            </button>
            <button 
                onClick={() => setActiveTab('telegram')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'telegram' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <MessageCircle className="w-4 h-4 mr-2" /> 2. Tạo Bot Telegram
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <Code className="w-4 h-4 mr-2" /> 3. Mã Nguồn (Copy)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
           
           {/* TAB 1: GUIDE */}
           {activeTab === 'guide' && (
               <div className="flex-1 overflow-auto p-8 bg-slate-900 text-slate-300 custom-scrollbar">
                   <div className="max-w-3xl mx-auto space-y-8">
                       <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 rounded-xl p-6 flex items-start gap-4">
                           <div className="bg-blue-600/20 p-3 rounded-full">
                               <Cpu className="w-6 h-6 text-blue-400" />
                           </div>
                           <div>
                               <h3 className="text-white font-bold text-lg mb-1">Khởi tạo PlatformIO</h3>
                               <p className="text-sm text-slate-300">
                                   Bạn cần tạo Project trước, sau đó cấu hình thư viện để ESP32 có thể hiểu được lệnh gửi tin nhắn Telegram.
                               </p>
                           </div>
                       </div>

                       <div className="space-y-3 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước 1: Tạo dự án mới</h3>
                           <p className="text-sm text-slate-400">Trong VS Code, bấm vào icon "Alien" (PlatformIO) -&gt; <span className="text-white font-medium">PIO Home -&gt; Open -&gt; New Project</span>:</p>
                           <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                               <li className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between">
                                   <span className="text-slate-400">Name:</span>
                                   <span className="text-green-400 font-mono font-bold">FloodGuard</span>
                               </li>
                               <li className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between">
                                   <span className="text-slate-400">Board:</span>
                                   <span className="text-yellow-400 font-mono font-bold">DOIT ESP32 DEVKIT V1</span>
                               </li>
                           </ul>
                       </div>

                       <div className="space-y-3 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước 2: Cấu hình thư viện (quan trọng)</h3>
                           <p className="text-sm text-slate-400">
                               Mở file <code className="text-yellow-400 bg-slate-800 px-1 rounded">platformio.ini</code> ở thư mục gốc và dán đè nội dung sau:
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
                   </div>
               </div>
           )}

           {/* TAB 2: TELEGRAM SETUP */}
           {activeTab === 'telegram' && (
               <div className="flex-1 overflow-auto p-8 bg-slate-900 text-slate-300 custom-scrollbar">
                   <div className="max-w-3xl mx-auto space-y-8">
                       <div className="bg-gradient-to-r from-sky-900/40 to-blue-900/40 border border-sky-800/50 rounded-xl p-6 flex items-start gap-4">
                           <div className="bg-sky-600/20 p-3 rounded-full">
                               <Send className="w-6 h-6 text-sky-400" />
                           </div>
                           <div>
                               <h3 className="text-white font-bold text-lg mb-1">Cấu hình Bot Telegram</h3>
                               <p className="text-sm text-slate-300">
                                   Để ESP32 gửi tin nhắn cho bạn, bạn cần tạo một "Con Bot" ảo. Làm theo các bước dưới đây trên điện thoại hoặc máy tính.
                               </p>
                           </div>
                       </div>

                       <div className="space-y-4 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước A: Lấy Bot Token</h3>
                           <ol className="list-decimal list-inside text-sm text-slate-400 space-y-3">
                               <li>Mở Telegram, tìm kiếm từ khóa <strong className="text-sky-400">@BotFather</strong> (có tích xanh).</li>
                               <li>Chat <code className="bg-slate-800 px-1 text-white">/newbot</code> và làm theo hướng dẫn (Đặt tên Bot, ví dụ: <code>CanhBaoLuLut_Bot</code>).</li>
                               <li>BotFather sẽ đưa cho bạn một đoạn mã dài (Token). <strong className="text-red-400">Copy mã này.</strong></li>
                           </ol>
                           <div className="bg-slate-800 p-4 rounded border border-slate-700">
                                <label className="block text-xs text-slate-500 mb-1">Dán Token của bạn vào đây (để hệ thống tự điền vào code):</label>
                                <input type="text" placeholder="Ví dụ: 7843243:AAG..." className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono text-sm" defaultValue={config.telegramBotToken} readOnly />
                           </div>
                       </div>

                       <div className="space-y-4 relative pl-8 border-l-2 border-slate-700">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-500"></div>
                           <h3 className="text-lg font-bold text-white">Bước B: Lấy Chat ID của bạn</h3>
                           <ol className="list-decimal list-inside text-sm text-slate-400 space-y-3">
                               <li>Tìm kiếm bot tên là <strong className="text-sky-400">@userinfobot</strong> hoặc <strong className="text-sky-400">@GetMyIDBot</strong>.</li>
                               <li>Chat <code className="bg-slate-800 px-1 text-white">/start</code>.</li>
                               <li>Bot sẽ trả về dãy số (ID). Đó là ID của bạn.</li>
                               <li><strong className="text-yellow-400">Quan trọng:</strong> Bạn phải Chat "Hello" vào con Bot mới tạo ở Bước A thì nó mới có quyền nhắn tin cho bạn.</li>
                           </ol>
                           <div className="bg-slate-800 p-4 rounded border border-slate-700">
                                <label className="block text-xs text-slate-500 mb-1">Dán Chat ID vào đây:</label>
                                <input type="text" placeholder="Ví dụ: 848127..." className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono text-sm" defaultValue={config.telegramChatId} readOnly />
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {/* TAB 3: CODE */}
           {activeTab === 'code' && (
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
                
                <div className="flex-1 overflow-auto bg-[#1e1e1e] font-mono text-sm relative custom-scrollbar flex">
                    {/* Line Numbers */}
                    <div className="bg-[#1e1e1e] text-slate-600 text-right pr-4 pl-2 py-4 select-none border-r border-slate-800 min-w-[3rem]">
                        {firmwareCode.split('\n').map((_, i) => (
                            <div key={i} className="leading-relaxed">{i + 1}</div>
                        ))}
                    </div>
                    {/* Code Content */}
                    <pre className="text-blue-300 p-4 whitespace-pre-wrap leading-relaxed flex-1">{firmwareCode}</pre>
                </div>
               </>
           )}
        </div>
      </div>
    </div>
  );
};