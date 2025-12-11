import { Device, SystemConfig } from './types';

export const DEFAULT_DEVICES: Device[] = [
  { id: 'tank-001', name: 'Nhà Ánh Như', location: 'Zone A' },
  { id: 'river-002', name: 'Nhà Ngọc Anh', location: 'Zone B' },
  { id: 'sewer-003', name: 'Nhà Thủy Tiên', location: 'Zone C' },
];

export const DEFAULT_CONFIG: SystemConfig = {
  minThreshold: 10,
  maxThreshold: 80,
  enableAlerts: true,
  telegramChatId: '8481271735', // From screenshot example
  telegramBotToken: '',
};
