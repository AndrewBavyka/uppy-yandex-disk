import fs from 'fs';
import { Readable } from 'stream';

const BASE_URL = 'https://cloud-api.yandex.net/v1/disk/resources';
const USER_INFO_URL = 'https://cloud-api.yandex.net/v1/disk/';


function getNextPagePath(data, directoryPath) {
  if (data._embedded) {
    const { offset, limit, total } = data._embedded;

    // console.log(`Path: ${directoryPath}, Offset: ${offset}, Limit: ${limit}, Total: ${total}`);

    if (offset + limit < total) {
      const nextOffset = offset + limit;
      return `?path=${encodeURIComponent(directoryPath)}&limit=${limit}&offset=${nextOffset}`;
    }
  }
  return null;
}


function adaptData(res, directoryPath) {
  const data = {
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

    const data = await resp.json();
    const adaptedData = adaptData(data, currentDirectory);

    return adaptedData;
  }


  async logout() {
    const className = this.constructor[0];

    if (this.storage) {
      await this.storage.removeItem(`companion-${className}-auth-token`);
    }

    return { success: true };
  }
}
