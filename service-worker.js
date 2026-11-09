// Service Worker - permite o funcionamento offline (PWA)
const CACHE_NAME = 'jogo-do-galo-v1';

const LOCAL_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './pwa/manifest.json',
    './img/icon.webp',
    './img/icon.webp',
    './img/icon.webp'
];

// Instalação: guarda os ficheiros base em cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS))
    );
    self.skipWaiting();
});

// Ativação: remove caches antigas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Pedidos: cache primeiro; se não existir, vai à rede e guarda a resposta
// (assim o Bootstrap e as fontes também ficam disponíveis offline após a 1.ª visita)
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && (response.ok || response.type === 'opaque')) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => caches.match('./index.html'));
        })
    );
});
