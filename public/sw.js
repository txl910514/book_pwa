var cacheName = 'bs1.0';
var apiCacheName = 'api-0-1-1';
var cacheFiles = [
    '/',
    './index.html',
    './base64util.js',
    './index.js',
    './style.css',
    './img/book.png',
    './img/loading.svg'
];
self.addEventListener('install', function (e) {
    console.log('Service Worker 状态： install');
    var cacheOpenPromise = caches.open(cacheName).then(function (cache) {
        return cache.addAll(cacheFiles);
    });
    e.waitUntil(cacheOpenPromise);
});

self.addEventListener('fetch', function (e) {
    var cacheRequestUrls = [
        '/book?'
    ];
    console.log('现在正在请求：' + e.request.url);
    var needCache = cacheRequestUrls.some(function (url) {
        return e.request.url.indexOf(url) > -1;
    });
    
    if (needCache) {
        console.log(1111);
        // 需要缓存
        // 使用fetch请求数据，并将请求结果clone一份缓存到cache
        // 此部分缓存后在browser中使用全局变量caches获取
        caches.open(apiCacheName).then(function (cache) {
            return fetch(e.request).then(function (response) {
                cache.put(e.request.url, response.clone());
                return response;
            });
        });
    }
    else {
        console.log(2222);
        // 非api请求，直接查询cache
        // 如果有cache则直接返回，否则通过fetch请求
        e.respondWith(
            caches.match(e.request).then(function (cache) {
                return cache || fetch(e.request);
            }).catch(function (err) {
                console.log(err);
                return fetch(e.request);
            })
        );
    }
});

self.addEventListener('activate', function (e) {
    console.log('Service Worker 状态： activate');
    var cachePromise = caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
            if (key !== cacheName) {
                return caches.delete(key);
            }
        }));
    })
    e.waitUntil(cachePromise);
    return self.clients.claim();
});

/* ============== */
/* push处理相关部分 */
/* ============== */
// 添加service worker对push的监听
self.addEventListener('push', function (e) {
    var data = e.data;
    if (e.data) {
        data = data.json();
        console.log('push的数据为：', data);
        self.registration.showNotification(data.text);        
    } 
    else {
        console.log('push没有任何数据');
    }
});