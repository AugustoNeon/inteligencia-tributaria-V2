/**
 * Service worker do app instalável (PWA).
 * Estratégia: rede primeiro p/ navegação (conteúdo sempre fresco, com
 * fallback offline); cache primeiro p/ os assets do Vite (nomes com hash,
 * imutáveis). Nada de bibliotecas — o app inteiro segue sem dependências
 * de runtime além do React.
 */
const CACHE = 'intel-tributaria-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // páginas: rede primeiro, cache como fallback offline
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copia))
          return resposta
        })
        .catch(() => caches.match(request)),
    )
    return
  }

  // assets: cache primeiro, rede preenche na primeira visita
  evento.respondWith(
    caches.match(request).then(
      (cacheado) =>
        cacheado ??
        fetch(request).then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copia))
          }
          return resposta
        }),
    ),
  )
})
