"use strict";

import mime from 'mime-types';

const ICON_FOLDER_PATH = "server/providers/yandex-disk/assets/folder-icon.svg";

const isFolder = (item) => item.type === 'dir';
const getItemSize = (item) => (isFolder(item) ? null : item.size || null);
const getItemIcon = (item) => (isFolder(item) ? '' : item.preview || '');
const getItemName = (item) => item.name || 'Unnamed';
const getMimeType = (item) => (isFolder(item) ? null : mime.lookup(getItemName(item)) || '');
const getItemId = (item) => item.resource_id || 'unknown';
const getItemRequestPath = (item) => encodeURIComponent(item.path || '');
const getItemModifiedDate = (item) => item.modified || null;
const getItemThumbnailUrl = (item) => (isFolder(item) ? '' : item.preview || '');

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

function transformData(res, userInfo, directoryPath) {
    const data = {
        username: userInfo.display_name || 'Unknown',
        items: [],
        nextPagePath: getNextPagePath(res, directoryPath),
    };

    const folderIcon = ICON_FOLDER_PATH;

    if (res._embedded && res._embedded.items) {
        res._embedded.items.forEach((item) => {
            data.items.push({
                isFolder: isFolder(item),
                icon: isFolder(item) ? folderIcon : getItemIcon(item),
                name: getItemName(item),
                mimeType: getMimeType(item),
                id: getItemId(item),
                thumbnail: getItemThumbnailUrl(item),
                requestPath: getItemRequestPath(item),
                modifiedDate: getItemModifiedDate(item),
                size: getItemSize(item),
            });
        });
    }

    return data;
}

export { transformData };
