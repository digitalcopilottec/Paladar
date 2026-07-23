// Service worker do Paladar: deixa o app instalável e abre instantâneo
// (cache do HTML/JS/CSS/ícones), mas nunca serve dados da API do cache —
// pedido, mesa e caixa têm que vir sempre da rede, senão mostra informação
// velha e o operador toma decisão errada.
const CACHE = 'paladar-v5';
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API e uploads: sempre rede. Dado de restaurante não pode ficar velho.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;
  if (e.request.method !== 'GET') return;

  // Resto (app shell, imagens do cardápio, fontes): cache primeiro, guarda a
  // versão nova em segundo plano pra próxima visita já vir atualizada.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
