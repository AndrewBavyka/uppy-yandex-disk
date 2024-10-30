import Uppy from '@uppy/core'
import XHR from '@uppy/xhr-upload';
import Dashboard from '@uppy/dashboard'
import YandexDisk from './providers/YandexDisk'
import Dropbox from '@uppy/dropbox';

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import './styles/dashboard_custom.css'

const uppy = new Uppy({
  debug: true,
  // locale: Russian
})


uppy.use(YandexDisk, {
  companionUrl: 'http://localhost:3020',
  companionAllowedHosts: ["http://localhost:3020", "http://localhost:5173", "https://oauth.yandex.ru"],
})

uppy.use(Dropbox, {
  companionUrl: 'http://localhost:3020',
  companionAllowedHosts: ["http://localhost:3020", "http://localhost:5173", "https://www.dropbox.com"],
});

uppy.use(Dashboard, {
  plugins: ['YandexDisk', 'Dropbox'],
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
