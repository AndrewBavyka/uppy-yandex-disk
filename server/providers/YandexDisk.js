import fs from 'fs';
import { Readable } from 'stream';

const BASE_URL = 'https://cloud-api.yandex.net/v1/disk/resources';
const USER_INFO_URL = 'https://cloud-api.yandex.net/v1/disk/';

function getNextPagePath(data, directoryPath) {
  if (data._embedded) {
    const { offset, limit, total } = data._embedded;
    if (offset + limit < total) {
      const nextOffset = offset + limit;
      return `?path=${encodeURIComponent(directoryPath)}&limit=${limit}&offset=${nextOffset}`;
    }
  }

  return null;
}

function adaptData(res, userInfo, directoryPath) {
  const data = {
    username: userInfo.display_name || 'Unknown',
    items: [],
    nextPagePath: getNextPagePath(res, directoryPath),
  };

  const folderIcon = ``;

  if (res._embedded && res._embedded.items) {
    res._embedded.items.forEach((item) => {
      const isFolder = item.type === 'dir';
      const icon = isFolder ? folderIcon : (item.preview || '');
      const name = item.name || 'Unnamed';

      data.items.push({
        isFolder,
        icon,
        name,
        mimeType: isFolder ? null : item.mime_type || '',
        id: item.resource_id || 'unknown',
        thumbnail: isFolder ? folderIcon : (item.preview || ''),
        requestPath: encodeURIComponent(item.path || ''),
        modifiedDate: item.modified || null,
        size: isFolder ? null : item.size || null,
      });
    });
  }

  return data;
}

export default class YandexDisk {
  static version = 2;

  static get oauthProvider() {
    return 'yandexdisk';
  }

  static grantDynamicToUserSession(state) {
    return state;
  }

  // Метод для получения информации о пользователе
  async getUserInfo(token) {
    const resp = await fetch(`${USER_INFO_URL}`, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Ошибка получения информации о пользователе: ${resp.status} ${resp.statusText}: ${errorText}`);
    }

    const userInfo = await resp.json();
    return userInfo.user;
  }

  // Метод для обработки списка файлов и директорий
  async list({ token, directory = '/', query = {} }) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const currentDirectory = query.path || directory;
    const path = `${BASE_URL}?path=${encodeURIComponent(currentDirectory)}&limit=${limit}&offset=${offset}`;

    const resp = await fetch(path, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Ошибка HTTP: ${resp.status} ${resp.statusText}: ${errorText}`);
    }

    const data = await resp.json();
    const userInfo = await this.getUserInfo(token);
    const adaptedData = adaptData(data, userInfo, currentDirectory);

    return adaptedData;
  }

  // Метод для получения размера файла
  async size({ token, id, query = {} }) {
    const resp = await fetch(`${BASE_URL}?path=${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!resp.ok) {
      throw new Error(`Ошибка получения размера файла: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    return data.size || null;
  }

  // Метод для скачивания файла с Яндекс Диска
  async download({ token, id, query }) {
    const urlResp = await fetch(`${BASE_URL}/download?path=${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!urlResp.ok) {
      const errorText = await urlResp.text();
      throw new Error(`Ошибка получения URL для скачивания: ${urlResp.status} ${urlResp.statusText}: ${errorText}`);
    }

    const { href: downloadUrl } = await urlResp.json();

    const fileResp = await fetch(downloadUrl, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!fileResp.ok) {
      const errorText = await fileResp.text();
      throw new Error(`Ошибка скачивания файла: ${fileResp.status} ${fileResp.statusText}: ${errorText}`);
    }

    return { stream: Readable.from(fileResp.body) }; // Используем Readable.from
  }


  // Метод для скачивания и сохранения файла локально
  async downloadAndSave({ token, id, savePath, query }) {
    // Получаем размер файла
    const fileSize = await this.size({ token, id, query });
    console.log(`Размер файла: ${fileSize} байт`);

    const { stream } = await this.download({ token, id, query });
    const writeStream = fs.createWriteStream(savePath);
    stream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ success: true, message: 'Файл успешно сохранен' }));
      writeStream.on('error', reject);
    });
  }

  async logout() {
    const className = this.constructor[0];

    if (this.storage) {
      await this.storage.removeItem(`companion-${className}-auth-token`);
    }

    return { success: true };
  }
}
