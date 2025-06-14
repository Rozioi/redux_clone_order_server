import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const cloudConfig = {
  yandex: {
    token: process.env.YANDEX_DISK_TOKEN || '',
  },
  google: {
    apiKey: process.env.GOOGLE_DRIVE_API_KEY || '',
  }
};

// Проверяем наличие необходимых токенов
export const validateCloudConfig = () => {
  const missingTokens = [];
  
  if (!cloudConfig.yandex.token) {
    missingTokens.push('YANDEX_DISK_TOKEN');
  }
  
  if (!cloudConfig.google.apiKey) {
    missingTokens.push('GOOGLE_DRIVE_API_KEY');
  }
  
  if (missingTokens.length > 0) {
    console.warn('Внимание: Отсутствуют следующие токены:', missingTokens.join(', '));
  }
  
  return missingTokens.length === 0;
}; 