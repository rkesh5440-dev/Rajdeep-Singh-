/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "fd039c6e8f4fc3102d1c9d887842ad2d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "779915902f8224b268aaf9ecca4cf0e2"
  }, {
    "url": "pwa-192x192.png",
    "revision": "708386355d1e62a96ee2b3ae1fa49799"
  }, {
    "url": "index.html",
    "revision": "dbd5d250b0d983a77fa7c6a3c3e1842f"
  }, {
    "url": "icon.svg",
    "revision": "3c6556d69c9f385e3fbb6e76f6415d24"
  }, {
    "url": "favicon.ico",
    "revision": "f84df81c5947eed9fafb0c9ea3352f40"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "9f5318ba52fa36eb627f574e68a69a87"
  }, {
    "url": "src/assets/images/stage_stormspire_arena_1795190371166.jpg",
    "revision": "1c2de46cc563d87389b8b8530304a18e"
  }, {
    "url": "src/assets/images/stage_cinderforge_keep_1795190372065.jpg",
    "revision": "bc9ab66dc4af4f86b52af94c6f46733b"
  }, {
    "url": "src/assets/images/stage_ashenwood_ruins_1795190370935.jpg",
    "revision": "05074edf5f31bee10899f337b992ec8e"
  }, {
    "url": "assets/index-DPl35iZ7.css",
    "revision": null
  }, {
    "url": "assets/index-D6eWfy_2.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "9f5318ba52fa36eb627f574e68a69a87"
  }, {
    "url": "favicon.ico",
    "revision": "f84df81c5947eed9fafb0c9ea3352f40"
  }, {
    "url": "icon.svg",
    "revision": "3c6556d69c9f385e3fbb6e76f6415d24"
  }, {
    "url": "pwa-192x192.png",
    "revision": "708386355d1e62a96ee2b3ae1fa49799"
  }, {
    "url": "pwa-512x512.png",
    "revision": "779915902f8224b268aaf9ecca4cf0e2"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "fd039c6e8f4fc3102d1c9d887842ad2d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "0213f21f9282ab0c6bc3536708064fac"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
