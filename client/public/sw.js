// Service worker do Paladar: deixa o app instalável e abre instantâneo mesmo
// com internet ruim, mas nunca serve dados da API do cache — pedido, mesa e
// caixa têm que vir sempre da rede, senão mostra informação velha e o
// operador toma decisão errada.
const CACHE = 'paladar-v6';
const SHELL = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

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

  // Navegação (index.html) e o próprio JS/CSS: rede primeiro. O nome do
  // arquivo muda a cada build (hash) — se o cache serve um index.html velho
  // apontando pra um .js que não existe mais, a tela fica em branco.
  const ehCodigo = e.request.mode === 'navigate' || /\.(js|css)$/.test(url.pathname);
  if (ehCodigo) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Resto (ícones, fotos do cardápio): cache primeiro, atualiza em segundo
  // plano — aqui um arquivo velho no pior caso só mostra uma foto antiga.
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
