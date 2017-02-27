//caching pages
const urlsToCache = [
  '/skeleton',
  'js/main.js',
  'css/main.css',
  'imgs/icon.png'
];

const staticCacheName = 'wittr-static-v10'
const imageCache = 'wittr-image-cache'
const wittrCacheNames = [staticCacheName, imageCache];

self.addEventListener('install', (event) => {
  //event.waitUntil created room for syncronous code to be run.
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});
//testing stuff
self.addEventListener('activate', (event) => {
  let currCacheName;

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name.startsWith('wittr') && !wittrCacheNames.includes(name);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
})

self.addEventListener('fetch', function(event) {
  let requestUrl = new URL(event.request.url);

  // checks that the request is intra-site
  if(requestUrl.origin === location.origin) {
    if(requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'));
      return;
    }

    if(requestUrl.pathname.startsWith('/photos/')) {
      return event.respondWith(_servePhotos(event.request));
    }

    if(requestUrl.pathname.startsWith('/avatars/')) {
      return event.respondWith(_serveAvatars(event.request));
    }
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if(event.data.action == 'refresh') {
    self.skipWaiting();
  }
});

const _servePhotos = (request) => {
  let sizeAgnosticUrl = request.url.replace(/-\d+px\.\w{3,4}$/, '');

  return caches.open(imageCache).then((cache) => {
    return cache.match(sizeAgnosticUrl)
      .then((cachedImageResponse) => {
         if(cachedImageResponse) return cachedImageResponse;

         return fetch(request).then((response) => {
           cache.put(sizeAgnosticUrl, response.clone());
           return response;
         })
      });
  });
};

const _serveAvatars = (request) => {
  const sizeAgnosticUrl = request.url.replace(/-\d+\w+\.\w{3,4}$/, '');
  return caches.open(imageCache).then((cache) => {
    return cache.match(sizeAgnosticUrl).then((cachedUrl) => {
      let networkResponse = _fetchUpdatedAvatar(cache, sizeAgnosticUrl, request);
      return cachedUrl || networkResponse;
    })
  })
};

const _fetchUpdatedAvatar = (cacheObj, cacheKey, request) => {
  return fetch(request).then((response) => {
    cacheObj.put(cacheKey, response.clone());
    return response
  });
}
