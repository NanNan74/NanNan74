export interface WaterReading {
  id: string;
  timestamp: number;
  level: number; // 0 to 100 percentage
  deviceId: string;
  status: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
}

export interface SystemConfig {
  minThreshold: number;
  maxThreshold: number;
  enableAlerts: boolean;
  telegramChatId: string;
  telegramBotToken: string;
}

export interface Device {
  id: string;
  name: string;
  location: string;
}
