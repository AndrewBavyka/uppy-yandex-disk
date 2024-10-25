/** @jsx h */

import { UIPlugin } from "@uppy/core";
import {
  Provider,
  getAllowedHosts,
  tokenStorage,
} from "@uppy/companion-client";
import { ProviderViews } from "@uppy/provider-views";
import { h } from "preact";

const defaultOptions = {};

export default class YandexDisk extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);

    this.id = this.opts.id || "YandexDisk";
    this.type = "acquirer";
    this.storage = this.opts.storage || tokenStorage;
    this.rootFolderId = null;
    this.files = [];

    this.icon = () => (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3.73101 17.8475C2.71312 19.7947 2.65077 22.7812 3.95315 22.7812C9.26057 23.6857 30.5426 13.5283 28.9107 10.1339C28.199 8.67051 25.1691 7.77111 21.2953 8.03026C20.5085 8.00087 19.732 7.84117 18.9974 7.55769C18.85 7.50688 18.7026 7.45606 18.545 7.41033C16.3483 6.73472 13.9789 6.89767 11.8955 7.86765C10.0908 8.71442 8.61264 10.1277 7.68615 11.8921C7.52347 12.2021 7.37096 12.5273 7.21337 12.8474C6.7965 13.7163 6.38472 14.5852 5.84076 15.1848C5.03892 15.9897 4.33114 16.8829 3.73101 17.8475Z"
          fill="#012B5B"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M4 19.2004V20.381C4 21.3722 4.19 22.3245 4.54 23.199C7.105 24.5109 13.055 24.3457 18.89 21.6929C24.3 19.2198 28.035 15.3329 29 12.5974C29.175 12.1013 29.384 10.8179 28.855 10.1632C27.265 8.19546 20.665 8.71534 13.905 11.7909C9.16 13.9578 5.53 16.8342 4 19.2004Z"
          fill="#1884FF"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3.61699 19.2004C2.61225 21.1087 2.86362 22.5393 4.15953 23.199C6.73658 24.5109 12.7146 24.3457 18.577 21.6929C24.0124 19.2198 27.765 15.3329 28.7345 12.5974C28.9857 11.8888 29.2369 10.9615 28.5888 10.1632C26.9913 8.19546 20.3603 8.71534 13.5685 11.7909C8.80124 13.9578 5.15418 16.8342 3.61699 19.2004Z"
          fill="url(#paint0_radial_49768_6825)"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.5388 20.5456C22.0806 18.9765 24.4911 16.7878 23.9149 15.6585C23.344 14.5292 20.003 14.8889 16.4612 16.458C12.9195 18.0271 10.5089 20.2108 11.0851 21.3401C11.656 22.4694 14.997 22.1146 18.5388 20.5406V20.5456Z"
          fill="white"
        />
        <defs>
          <radialGradient
            id="paint0_radial_49768_6825"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(17.7483 18.5347) rotate(64.4897) scale(7.29019 18.0716)"
          >
            <stop stop-color="#89C0FF" />
            <stop offset="0.61" stop-color="#1884FF" />
            <stop offset="1" stop-color="#1884FF" />
          </radialGradient>
        </defs>
      </svg>
    );

    // Настройка разрешенных хостов для Companion
    this.opts.companionAllowedHosts = getAllowedHosts(
      this.opts.companionAllowedHosts,
      this.opts.companionUrl
    );

    // Создаем объект провайдера для взаимодействия с Companion
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      provider: "yandexdisk",
      pluginId: this.id,
    });

    // Регистрируем клиент для запросов в Uppy
    uppy.registerRequestClient(YandexDisk.name, this.provider);

    // Локализация плагина
    this.defaultLocale = {
      strings: {
        pluginNameYandexDisk: "Yandex Disk",
      },
    };

    // Объединяем переданные опции с дефолтными
    this.opts = { ...defaultOptions, ...opts };

    // Инициализация i18n для локализации
    this.i18nInit();

    // Устанавливаем название плагина на основе локализации
    this.title = this.i18n("pluginNameYandexDisk");

    // Массив для хранения файлов
    this.files = [];
  }

  // Устанавливаем плагин и подключаем интерфейс
  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider,
    });

    const { target } = this.opts;
    if (target) {
      this.mount(target, this);
    }
  }

  // Удаление плагина и очищение представлений
  uninstall() {
    this.view.tearDown();
    this.unmount();
  }

  // Первый рендер компонента — получение списка файлов/папок
  onFirstRender() {
    return this.view.getFolder();
  }

  // Метод рендеринга интерфейса плагина
  render(state) {
    return this.view.render(state);
  }
}
