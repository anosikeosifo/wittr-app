//caching pages
const urlsToCache = [
  '/',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png'
];

const staticCacheName = 'wittr-static-v2'

self.addEventListener('install', (event) => {
  //event.waitUntil created room for syncronous code to be run.
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});
//just testing
self.addEventListener('activate', (event) => {
  let currCacheName;
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name.startsWith('wittr') && name != staticCacheName;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      ); 
    })
  ); 
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  console.log('event data: ', event.data);
})