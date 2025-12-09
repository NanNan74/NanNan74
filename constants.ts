import { Device, SystemConfig } from './types';

export const DEFAULT_DEVICES: Device[] = [
  { id: 'tank-001', name: 'Device tank-001 (Bể chứa A)', location: 'Zone A' },
  { id: 'river-002', name: 'Device river-002 (Sông Hương)', location: 'Zone B' },
  { id: 'sewer-003', name: 'Device sewer-003 (Cống thoát 3)', location: 'Zone C' },
];

export const DEFAULT_CONFIG: SystemConfig = {
  minThreshold: 10,
  maxThreshold: 80,
  enableAlerts: true,
  telegramChatId: '8481271735', // From screenshot example
  telegramBotToken: '',
};
