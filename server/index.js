import { mkdtempSync, existsSync, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import companion from '@uppy/companion';
import cors from 'cors';
import multer from 'multer';

import YandexDisk from './providers/YandexDisk.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3020',
    'https://oauth.yandex.ru',
  ],
  credentials: true, // Разрешить передачу куков и других учетных данных 
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Настройка сессии 
app.use(session({
  secret: 'some-secret',
  resave: true,
  saveUninitialized: true,
}));

// Проверка и создание папки uploads
const uploadDir = path.resolve('uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
  console.log(`Папка ${uploadDir} была создана`);
}

// Настройка multer для обработки загружаемых файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

// Настройки Companion для работы с кастомным провайдером
const companionOptions = {
  customProviders: {
    yandexdisk: {
      config: {
        authorize_url: 'https://oauth.yandex.ru/authorize',
        access_url: 'https://oauth.yandex.ru/token',
        oauth: 2,
        key: process.env.COMPANION_DISK_CLIENT_ID,
        secret: process.env.COMPANION_DISK_SECRET,
      },
      module: YandexDisk,
    },
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: mkdtempSync(path.join(os.tmpdir(), 'companion-')),
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:3020',
    'https://oauth.yandex.ru',
  ],
  uploadUrls: ['http://localhost:3020/upload'],
  secret: 'some-secret',
  debug: true,
};

const { app: companionApp } = companion.app(companionOptions);
app.use(companionApp);


app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не найден в запросе' });
  }

  res.status(200).json({ message: 'Файл успешно загружен', file: req.file });
});


app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});


app.use((err, req, res, next) => {
  console.error('\x1b[31m', err.stack, '\x1b[0m');
  res.status(err.status || 500).json({ message: err.message, error: err });
});


companion.socket(app.listen(3020), companionOptions);

console.log('Welcome to Companion!');
console.log(`Listening on http://localhost:3020`);
