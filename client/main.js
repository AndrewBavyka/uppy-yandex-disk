import Uppy from '@uppy/core'
import GoogleDrive from '@uppy/google-drive'
import XHR from '@uppy/xhr-upload';
import Dashboard from '@uppy/dashboard'
import YandexDisk from './providers/YandexDisk'
import Russian from '@uppy/locales/lib/ru_RU'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import './styles/dashboard_custom.css'

const uppy = new Uppy({
  debug: true,
  // locale: Russian
})

uppy.use(GoogleDrive, {
  companionUrl: 'http://localhost:3020',
})

uppy.use(YandexDisk, {
  companionUrl: 'http://localhost:3020',
  companionAllowedHosts: ["http://localhost:3020", "http://localhost:5173", "https://oauth.yandex.ru"],
})

uppy.use(Dashboard, {
  plugins: ['GoogleDrive', 'YandexDisk'],
  trigger: '.trigger-button',
  target: 'body',
  showProgressDetails: true,
  closeModalOnClickOutside: true,
  proudlyDisplayPoweredByUppy: false,
})


uppy.use(XHR, {
  endpoint: 'http://localhost:3020/upload',
  fieldName: 'file',
  formData: true,
  bundle: false, 
});

