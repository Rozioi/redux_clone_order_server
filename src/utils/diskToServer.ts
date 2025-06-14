import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { cloudConfig } from '../config/cloud.config';
import { config } from '../config/env';

interface DownloadResult {
  success: boolean;
  filePath?: string;
  originalName?: string;
  error?: string;
}

interface CloudStorageConfig {
  type: 'google' | 'yandex';
  apiKey?: string;
  token?: string;
}

const isModDownloaded = (fileName: string): boolean => {
  return fs.existsSync(path.join(__dirname, 'mods', fileName));
};

const getFileExtension = (url: string): string => {
  const extension = path.extname(url);
  return extension || '.zip';
};

const createModsDirectory = (): void => {
  const modsPath = path.join(__dirname, 'mods');
  if (!fs.existsSync(modsPath)) {
    fs.mkdirSync(modsPath, { recursive: true });
  }
};

const generateUniqueFileName = (): string => {
  return `${uuidv4()}.zip`;
};


const downloadFromGoogleDrive = async (
  driveLink: string,
): Promise<DownloadResult> => {
  try {
    // Извлекаем ID файла из ссылки
    const fileIdMatch = driveLink.match(/[-\w]{25,}/);
    if (!fileIdMatch) throw new Error('Неверный формат ссылки Google Drive');

    const fileId = fileIdMatch[0];
    const directLink = `https://drive.usercontent.google.com/uc?id=${fileId}&export=download`;

    const res = await axios({
      url: directLink,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      },
      timeout: 30000
    });

    createModsDirectory();

    const fileName = generateUniqueFileName();
    const filePath = path.join(__dirname, 'mods', fileName);
    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      res.data.pipe(writer);

      writer.on('error', err => {
        reject({ success: false, error: `Ошибка записи файла: ${err.message}` });
      });

      writer.on('finish', () => {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          reject({ success: false, error: 'Скачанный файл пуст' });
        } else {
          resolve({
            success: true,
            filePath: `${config.SERVER_URL}/mods/download/${fileName}`,
            originalName: fileName
          });
        }
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка при скачивании с Google Drive: ${error.message}`
    };
  }
};


const downloadFromYandexDisk = async (yandexLink: string, configCloud: CloudStorageConfig): Promise<DownloadResult> => {
  try {
    if (!configCloud.token) {
      throw new Error('Требуется токен для доступа к Яндекс.Диску');
    }

    const downloadUrl = await getYandexDownloadUrl(yandexLink, configCloud.token);
    
    const res = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Authorization': `OAuth ${configCloud.token}`,
        'Accept': 'application/octet-stream',
        'Content-Type': 'application/octet-stream'
      },
      timeout: 30000,
    });

    createModsDirectory();
    const uniqueFilename = generateUniqueFileName();
    const filePath = path.join(__dirname, 'mods', uniqueFilename);
    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ 
        success: true, 
        filePath: `${config.SERVER_URL}/mods/download/${uniqueFilename}`,
        originalName: uniqueFilename
      }));
      writer.on('error', (error) => reject({ success: false, error: error.message }));
      res.data.pipe(writer);
    });
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка при скачивании с Яндекс.Диска: ${error.message}`
    };
  }
};

const getYandexDownloadUrl = async (yandexLink: string, token: string): Promise<string> => {
  try {
    const response = await axios.get('https://cloud-api.yandex.net/v1/disk/public/resources/download', {
      params: {
        public_key: yandexLink
      },
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });
    return response.data.href;
  } catch (error: any) {
    throw new Error(`Ошибка получения ссылки для скачивания: ${error.message}`);
  }
};

export async function downloadFileFromCloud(
  fileLink: string,
  config?: CloudStorageConfig
): Promise<DownloadResult> {
  try {
    const isGoogleDrive = fileLink.includes('drive.google.com');
    const isYandexDisk = fileLink.includes('disk.yandex');

    const storageConfig: CloudStorageConfig = config || {
      type: isGoogleDrive ? 'google' : 'yandex',
      token: cloudConfig.yandex.token,
      apiKey: cloudConfig.google.apiKey
    };

    if (isGoogleDrive) {
      return await downloadFromGoogleDrive(fileLink);
    } else if (isYandexDisk) {
      return await downloadFromYandexDisk(fileLink, storageConfig);
    } else {
      throw new Error('Неподдерживаемый тип облачного хранилища');
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка при скачивании файла: ${error.message}`
    };
  }
}

// Для обратной совместимости
export async function downloadFileFromGoogleDrive(driveLink: string): Promise<void> {
  const result = await downloadFileFromCloud(driveLink, { type: 'google' });
  if (!result.success) {
    throw new Error(result.error);
  }
}