importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

workbox.routing.registerRoute(/.*(googleapis|gstatic)\.com.*$/, workbox.strategies.staleWhileRevalidate({
  cacheName: 'google-fonts',
  plugins: [
    new workbox.expiration.Plugin({
      maxEntries: 3,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
    })
  ]
}));

workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'material-css'
}));

workbox.routing.registerRoute(/.*(firebasestorage\.googleapis)\.com.*$/, workbox.strategies.staleWhileRevalidate({
  cacheName: 'post-images'
}));

workbox.routing.registerRoute('https://try-pwa-73a1a.firebaseio.com/posts.json',
  function (args) {
    return fetch(args.event.request)
      .then(res => {
        var clonedRes = res.clone();
        clearAllData('posts').then(() => {
          return clonedRes.json();
        }).then((data) => {
          for (let key in data) {
            writeData('posts', data[key]);
          }
        })
        return res;
      })
  }
);

workbox.routing.registerRoute(function(routeData) {
    return (routeData.event.request.headers.get('accept').includes('text/html'));
  },
  function (args) {
    return caches.match(args.event.request)
      .then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(args.event.request)
            .then(function(res) {
              return caches.open('dynamic')
                .then(function(cache) {
                  cache.put(args.event.request.url, res.clone());
                  return res;
                })
            })
            .catch(() => {
              return caches.match('/offline.html')
                .then(function(res) {
                  return res
                })
            });
        }
      })
  }
);

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "5f449a3b87aba80fccb8c48878e84427"
  },
  {
    "url": "manifest.json",
    "revision": "133ee104999efa5fe753a35d79b7494f"
  },
  {
    "url": "offline.html",
    "revision": "958ef89d30ac864ae37cab755b87438b"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "3914e4317aa542dca41697dec1cd673c"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "6889e1e50f2ebe5e403e64e1e51a04fb"
  },
  {
    "url": "src/js/feed.js",
    "revision": "841b62eb44688ea0750bb68abed88677"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "fc9b524f3806d9249184ac8e5616e08b"
  },
  {
    "url": "sw-base.js",
    "revision": "bd191cd77ba0131ba936df892e1e59f5"
  },
  {
    "url": "sw.js",
    "revision": "e7430b06f7bdc2f3146d34fd1174a65b"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);
