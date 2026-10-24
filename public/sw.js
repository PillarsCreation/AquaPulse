/**
 * AquaPulse Service Worker
 * 缓存优先策略：静态资源离线可用，API 请求网络优先
 */

const CACHE_NAME = 'aquapulse-v1';
const OFFLINE_URL = '/index.html';

// 需要预缓存的静态资源
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// 安装事件：预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // 立即激活，不等待旧的 SW 退出
  self.skipWaiting();
});

// 激活事件：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 立即控制所有页面
  self.clients.claim();
});

// 请求拦截策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求：网络优先，失败回退缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功获取后克隆一份存入缓存
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败，尝试从缓存读取
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ success: false, error: '网络不可用，请检查网络连接' }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            );
          });
        })
    );
    return;
  }

  // 静态资源请求：缓存优先，失败回退网络
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // 只缓存成功的同源 GET 请求
          if (
            response.status === 200 &&
            response.type === 'basic' &&
            request.method === 'GET'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络请求也失败时，返回离线页面
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('离线不可用', { status: 503 });
        });
    })
  );
});
