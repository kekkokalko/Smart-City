let cacheName = 'smartcityCache';
let filesToCache = [
    '/',
    './static/css/base.css',
    './static/css/explore.css',
    './static/css/footer.css',
    './static/css/index.css',
    './static/css/location.css',
    './static/css/login.css',
    './static/css/register.css',
    './static/css/resetpwd.css',
    './static/css/user.css',
    './static/images/bus.png',
    './static/images/location.png',
    './static/images/grattacielo.png',
    './static/images/hosp.png',
    './static/images/city.png',
    './static/images/smart-city.png',
    './static/images/nuvole.jpeg',
    './static/images/palazzo.png',
    './static/images/point.png',
    './static/images/white.png',
    './static/images/tower.png',
    './script.js',
    './templates/404.html',
    './templates/500.html',
    './templates/base.html',
    './templates/explore.html',
    './templates/index.html',
    './templates/location.html',
    './templates/login.html',
    './templates/register.html',
    './templates/reset_password.html',
    './templates/reset_password_request.html',
    './templates/user.html',
    './templates/_location.html'
];


// Initialize deferredPrompt for use later to show browser install prompt.
let deferredPrompt;

self.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  showInstallPromotion();
  // Optionally, send analytics event that PWA install promo was shown.
  console.log(`'beforeinstallprompt' event was fired.`);
});


// When the 'install' event is fired we will cache
// the html, javascript, css, images and any other files important
// to the operation of the application shell
self.addEventListener('install', (e) => {
  console.log('[ServiceWorker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName)
    console.log('[ServiceWorker] Caching app shell');
    await cache.addAll(filesToCache);
  })());
});

// We then listen for the service worker to be activated/started. Once it is
// ensures that your service worker updates its cache whenever any of the app shell files change.
// In order for this to work, you'd need to increment the cacheName variable at the top of this service worker file.
self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil((async () => {
    const cacheKeys = await caches.keys();
    cacheKeys.map(async (key) => {
      if (key !== cacheName) {
        console.log('[ServiceWorker] Removing old cache', key);
        await caches.delete(key);
      }
    });
  })());
  return self.clients.claim();
});


// Serve the app shell from the cache
// If the file is not in the cache then try to get it via the network.
// otherwise give an error and display an offline page
// This is a just basic example, a better solution is to use the
// Service Worker Precache module https://github.com/GoogleChromeLabs/sw-precache
self.addEventListener('fetch', (e) => {
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }

    try {
      const response = await fetch(e.request);

      // We could cache this new resource if we wanted to.
      // const cache = await caches.open(cacheName);
      // console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      // cache.put(e.request, response.clone());
      return response;
    } catch(error) {
      console.log('Fetch failed; returning offline page instead.', error);
      // In reality you'd have many different
      // fallbacks, depending on URL & headers.
      // Eg, a fallback silhouette image for avatars.
      let url = e.request.url;
      let extension = url.split('.').pop();
      console.log('URL: ', url);

      if (extension === 'jpg' || extension === 'png') {
          const FALLBACK_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180" stroke-linejoin="round">
            <path stroke="#DDD" stroke-width="25" d="M99,18 15,162H183z"/>
            <path stroke-width="17" fill="#FFF" d="M99,18 15,162H183z" stroke="#eee"/>
            <path d="M91,70a9,9 0 0,1 18,0l-5,50a4,4 0 0,1-8,0z" fill="#aaa"/>
            <circle cy="138" r="9" cx="100" fill="#aaa"/>
            </svg>`;
          // const FALLBACK_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path class="heroicon-ui" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm16 8.59V6H4v6.59l4.3-4.3a1 1 0 0 1 1.4 0l5.3 5.3 2.3-2.3a1 1 0 0 1 1.4 0l1.3 1.3zm0 2.82l-2-2-2.3 2.3a1 1 0 0 1-1.4 0L9 10.4l-5 5V18h16v-2.59zM15 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>`;
          return Promise.resolve(new Response(FALLBACK_IMAGE, {
              headers: {
                  'Content-Type': 'image/svg+xml'
              }
          }));
      }
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match('index.html');
      return cachedResponse;
    }
  })());
});