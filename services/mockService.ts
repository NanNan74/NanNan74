import { WaterReading } from '../types';

// Simulates generating a reading from an ESP32
export const generateMockReading = (deviceId: string, prevLevel: number): WaterReading => {
  // Simulate fluctuation
  const change = (Math.random() - 0.5) * 10; 
  let newLevel = prevLevel + change;
  
  // Clamp between 0 and 100
  if (newLevel < 0) newLevel = 0;
  if (newLevel > 100) newLevel = 100;

  let status: WaterReading['status'] = 'NORMAL';
  if (newLevel < 10) status = 'LOW';
  else if (newLevel > 80) status = 'HIGH';
  if (newLevel > 90) status = 'CRITICAL';

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    level: parseFloat(newLevel.toFixed(2)),
    deviceId,
    status
  };
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
