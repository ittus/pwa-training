importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v27'
var CACHE_DYNAMIC_NAME = 'dynamic-v2'

var STATIC_FILES =[
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(cache => {
//       return cache.keys()
//         .then(keys => {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         })
//     })
// }

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }))
      })
  )
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}
self.addEventListener('fetch', function(event) {
  var url = 'https://try-pwa-73a1a.firebaseio.com/posts'
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request)
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
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
      event.respondWith(
        caches.match(event.request)
      );
  } else {
      event.respondWith(
        caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            } else {
              return fetch(event.request)
                .then(function(res) {
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  return caches.open(CACHE_DYNAMIC_NAME)
                    .then(function(cache) {
                      cache.put(event.request.url, res.clone());
                      return res;
                    })
                })
                .catch(() => {
                  return caches.open(CACHE_STATIC_NAME)
                    .then(function(cache) {
                      if (event.request.headers.get('accept').includes('text/html')) {
                        return cache.match('/offline.html')
                      }
                    })
                });
            }
          })
      );
  }

});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(() => {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html')
//                 })
//             });
//         }
//       })
//   );
// });

// Network -> Cache fallback strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(res => {
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(function(cache) {
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//       })
//       .catch((err) => {
//         return caches.match(event.request)
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });


self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background syncing', event)
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(data => {
          for (var dt of data) {
            fetch('https://us-central1-try-pwa-73a1a.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=477ae5a62fd5ade3f1e3a08c013af882&auto=format&fit=crop&w=1352&q=80"
              })
            })
            .then(res => {
              console.log('Sent data', res);
              if (res.ok) {
                res.json()
                  .then(function(resData) {
                    deleteItemFromData('sync-posts', resData.id);
                  })
              }
            })
            .catch(err => {
              console.log('Error while sending data', err);
            })
          }
        })
    );
  }
})

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);
  if (action === 'confirm') {
    console.log('Confirm was choosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then(function(clis) {
          var client = clis.find(function(c) {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    )
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event);
});

self.addEventListener('push', function(event) {
  console.log('Push Notification received!', event);
  var data = {title: 'New!', content: 'Something new happended!', openUrl: '/'};
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
});
