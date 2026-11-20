const CACHE = "soplo-0.9.3";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icono-192.png", "./icono-512.png", "./icono-mask-512.png", "./icono-apple.png", "./favicon.png", "./video/sopla.mp4", "./video/sopla.jpg", "./video/regresa.mp4", "./video/regresa.jpg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function rango(req) {
  const cache = await caches.open(CACHE);
  let res = await cache.match(req.url, {ignoreSearch: true});
  if (!res) { try { res = await fetch(req.url); if (res.ok) await cache.put(req.url, res.clone()); } catch (e) { return new Response(null, {status: 504}); } }
  const buf = await res.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "") || [];
  const ini = Number(m[1] || 0), fin = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(ini, fin + 1), {status: 206, headers: {"Content-Range": `bytes ${ini}-${fin}/${buf.byteLength}`,
    "Content-Length": String(fin - ini + 1), "Content-Type": res.headers.get("Content-Type") || "video/mp4", "Accept-Ranges": "bytes"}});
}
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.headers.get("range")) { e.respondWith(rango(e.request)); return; }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return res;
  }).catch(() => caches.match("./index.html"))));
});
