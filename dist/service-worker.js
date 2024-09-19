importScripts("/precache-manifest.1be22682feadccb5f86448894b96e97b.js", "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.__precacheManifest = [].concat(self.__precacheManifest || []);
// eslint-disable-next-line no-undef
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

// eslint-disable-next-line no-undef
workbox.core.setCacheNameDetails({prefix: "tarkan-basic"});
// eslint-disable-next-line no-undef
workbox.core.skipWaiting();
