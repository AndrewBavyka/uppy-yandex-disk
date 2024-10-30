import got from 'got';
import { prepareStream } from '@uppy/companion/lib/server/helpers/utils.js';
import Provider from '@uppy/companion/lib/server/provider/Provider.js';

import { transformData } from './adapter.js';

const BASE_URL = 'https://cloud-api.yandex.net/v1/disk/resources';
const USER_INFO_URL = 'https://cloud-api.yandex.net/v1/disk/';

export default class YandexDisk extends Provider {
    static version = 2;
    static oauthProvider = 'yandexdisk';

    allowLocalUrls = true;

    /**
     * Получает информацию о пользователе.
     * 
     * @param {string} token - OAuth токен пользователя.
     * @returns {Promise<Object>} Информация о пользователе.
     */
    async getUserInfo(token) {
        const { body } = await got(USER_INFO_URL, {
            headers: { Authorization: `OAuth ${token}` },
            responseType: 'json',
        });

        return body.user;
    }

    /**
     * Получает список файлов/папок в указанной директории.
     * 
     * @param {Object} params - Параметры запроса.
     * @param {string} params.token - OAuth токен пользователя.
     * @param {string} [params.directory='/'] - Директория для получения списка.
     * @param {Object} [params.query={}] - Дополнительные параметры запроса.
     * @returns {Promise<Object>} Отформатированный список файлов/папок.
     */
    async list({ token, directory = '/', query = {} }) {
        const { limit = 20, offset = 0, path = directory } = query;
        const url = `${BASE_URL}?path=${encodeURIComponent(path)}&limit=${limit}&offset=${offset}`;

        const { body } = await got(url, {
            headers: { Authorization: `OAuth ${token}` },
            responseType: 'json',
        });

        const userInfo = await this.getUserInfo(token);

        return transformData(body, userInfo, path);
    }

    /**
     * Получает размер файла по его идентификатору.
     * 
     * @param {Object} params - Параметры запроса.
     * @param {string} params.token - OAuth токен пользователя.
     * @param {string} params.id - Идентификатор файла.
     * @returns {Promise<number|null>} Размер файла или null, если не найден.
     */
    async size({ token, id }) {
        const url = `${BASE_URL}?path=${encodeURIComponent(id)}`;

        const { body } = await got(url, {
            headers: { Authorization: `OAuth ${token}` },
            responseType: 'json',
        });

        return body.size || null;
    }

    /**
     * Получает ссылку для скачивания файла по его идентификатору.
     * 
     * @param {Object} params - Параметры запроса.
     * @param {string} params.token - OAuth токен пользователя.
     * @param {string} params.id - Идентификатор файла.
     * @returns {Promise<string>} Ссылка для скачивания файла.
     */
    async downloadLink({ token, id }) {
        const url = `${BASE_URL}/download?path=${encodeURIComponent(id)}`;

        const { body } = await got(url, {
            headers: { Authorization: `OAuth ${token}` },
            responseType: 'json',
        });

        return body.href;
    }

    /**
     * Загружает файл в виде потока по его идентификатору.
     * 
     * @param {Object} params - Параметры запроса.
     * @param {string} params.token - OAuth токен пользователя.
     * @param {string} params.id - Идентификатор файла.
     * @returns {Promise<Object>} Объект с потоком данных файла.
     */
    async download({ token, id }) {
        const downloadUrl = await this.downloadLink({ token, id });
        const stream = got.stream(downloadUrl, { headers: { Authorization: `OAuth ${token}` } });

        await prepareStream(stream);

        // DEBUG
        stream.on('end', () => console.log('Файл успешно загружен.'));
        stream.on('error', (error) => console.error(`Ошибка потока при загрузке файла: ${error.message}`));

        return { stream };
    }

    /**
     * Завершает сессию пользователя, удаляя токен из хранилища.
     * 
     * @returns {Promise<Object>} Результат выхода.
     */
    async logout() {
        if (this.storage) {
            await this.storage.removeItem(`companion-${this.constructor.name}-auth-token`);
        }

        return { success: true };
    }
}
