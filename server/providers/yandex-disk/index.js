import fs from 'fs';
import { Readable } from 'stream';
import { transformData } from './adapter.js';

const BASE_URL = 'https://cloud-api.yandex.net/v1/disk/resources';
const USER_INFO_URL = 'https://cloud-api.yandex.net/v1/disk/';

export default class YandexDisk {
    static version = 2;

    static get oauthProvider() {
        return 'yandexdisk';
    }

    static grantDynamicToUserSession(state) {
        return state;
    }

    // Вынести его в adapter
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
        const adaptedData = transformData(data, userInfo, currentDirectory);

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

    // Метод для получения только ссылки на скачивание файла с Яндекс Диска
    async downloadLink({ token, id }) {
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
        return downloadUrl;
    }

    // Метод download для работы с Companion
    async download({ token, id }) {
        const downloadUrl = await this.downloadLink({ token, id });
        const response = await fetch(downloadUrl, {
            headers: {
                Authorization: `OAuth ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Ошибка при загрузке файла: ${response.statusText}`);
        }

        return { stream: Readable.fromWeb(response.body) };
    }

    // Метод для скачивания и сохранения файла локально
    async downloadAndSave({ token, id, savePath }) {
        const downloadUrl = await this.downloadLink({ token, id });
        const response = await fetch(downloadUrl, {
            headers: {
                Authorization: `OAuth ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Ошибка при загрузке файла: ${response.statusText}`);
        }

        const writeStream = fs.createWriteStream(savePath);
        response.body.pipe(writeStream);

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