importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

workbox.routing.registerRoute(/.*(googleapis|gstatic)\.com.*$/, workbox.strategies.staleWhileRevalidate({
  cacheName: 'google-fonts',
  plugins: [
    new workbox.expiration.Plugin({
      maxEntries: 10,
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
workbox.precaching.precacheAndRoute([]);
