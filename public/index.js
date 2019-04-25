(function () {
    /**
     * 生成书籍列表卡片（dom元素）
     * @param {Object} book 书籍相关数据
     */
    function createCard(book) {
        var li = document.createElement('li');
        // var img = document.createElement('img');
        var title = document.createElement('div');
        var author = document.createElement('div');
        var desc = document.createElement('div');
        var publisher = document.createElement('span');
        var price = document.createElement('span');
        title.className = 'title';
        author.className = 'author';
        desc.className = 'desc';
        // img.src = book.image;
        title.innerText = book.title;
        author.innerText = book.author;
        publisher.innerText = book.publisher;
        price.innerText = book.price;

        book.publisher && desc.appendChild(publisher);
        book.price && desc.appendChild(price);
        // li.appendChild(img);
        li.appendChild(title);
        li.appendChild(author);
        li.appendChild(desc);

        return li;
    }

    /**
     * 根据获取的数据列表，生成书籍展示列表
     * @param {Array} list 书籍列表数据
     */
    function fillList(list) {
        list.forEach(function (book) {
            var node = createCard(book);
            document.querySelector('#js-list').appendChild(node);
        });
    }

    /**
     * 控制tip展示与显示的内容
     * @param {string | undefined} text tip的提示内容
     */
    function tip(text) {
        if (text === undefined) {
            document.querySelector('#js-tip').style = 'display: none';
        } else {
            document.querySelector('#js-tip').innerHTML = text;
            document.querySelector('#js-tip').style = 'display: block';
        }
    }

    /**
     * 控制loading动画的展示
     * @param {boolean | undefined} isloading 是否展示loading
     */
    function loading(isloading) {
        if (isloading) {
            tip();
            document.querySelector('#js-loading').style = 'display: block';
        } else {
            document.querySelector('#js-loading').style = 'display: none';
        }
    }

    /**
     * 根据用户输入结果
     * 使用XMLHttpRequest查询并展示数据列表
     */
    function queryBook() {
        var input = document.querySelector('#js-search-input');
        var query = input.value;
        var url = '/book?q=' + query + '&fields=id,title,image,author,publisher,price';
        var cacheData;
        if (query === '') {
            tip('请输入关键词');
            return;
        }
        document.querySelector('#js-list').innerHTML = '';
        document.querySelector('#js-thanks').style = 'display: none';
        loading(true);
        var remotePromise = getApiDataRemote(url);
        getApiDataFromCache(url).then(function (data) {
            if (data) {
                loading(false);
                input.blur();            
                fillList(data.books);
                document.querySelector('#js-thanks').style = 'display: block';
            }
            cacheData = data || {};
            return remotePromise;
        }).then(function (data) {
            if (JSON.stringify(data) !== JSON.stringify(cacheData)) {
                loading(false);                
                input.blur();
                fillList(data.books);
                document.querySelector('#js-thanks').style = 'display: block';
            }
        });
    }

    /**
     * 监听“搜索”按钮点击事件
     */
    document.querySelector('#js-search-btn').addEventListener('click', function () {
        queryBook();
    });

    /**
     * 监听“回车”事件
     */
    window.addEventListener('keypress', function (e) {
        if (e.keyCode === 13) {
            queryBook();
        }
    });
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        return false;
    });
    // 添加到主屏幕后响应
    window.addEventListener('beforeinstallprompt', function (event) {
        event.userChoice.then(result => {
            console.log(result);
            // {outcome: "dismissed", platform: ""} // 取消添加
            // {outcome: "accepted", platform: "web"} // 完成添加
        });
    });

    // 手动添加，要等到符合规格后才能起效
    let savedPrompt = null; // 用来保存 事件
    const btn = document.getElementById('btn');
    // 添加到主屏幕后响应
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        savedPrompt = e;
        return false;
    });
    btn.addEventListener('click', function () {
        if (savedPrompt) {
            console.log(savedPrompt);
            // 异步触发横幅显示，弹出选择框，代替浏览器默认动作
            savedPrompt.prompt();
            // 接收选择结果
            savedPrompt.userChoice.then(result => {
                console.log(result);
            });
        }
    });
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        var publicKey = 'BOEQSjdhorIf8M0XFNlwohK3sTzO9iJwvbYU-fuXRF0tvRpPPMGO6d_gJC_pUQwBT7wD8rKutpNTFHOHN3VqJ0A';
        // 注册service worker
        registerServiceWorker('./sw.js').then(function (registration) {
            return Promise.all([
                registration,
                askPermission()
            ])
        }).then(function (result) {
            var registration = result[0];
            document.querySelector('#js-notification-btn').addEventListener('click', function () {
                var title = 'PWA即学即用';
                var options = {
                    body: '邀请你一起学习',
                    icon: '/img/icons/book-128.png',
                    actions: [{
                        action: 'show-book',
                        title: '去看看'
                    }, {
                        action: 'contact-me',
                        title: '联系我'
                    }],
                    tag: 'pwa-starter',
                    renotify: true
                };
                var mb = myBrowser();
                if ("Safari" == mb) {
                    var notification = new Notification(title, options);
                    notification.addEventListener('click', function (e) {
                        document.querySelector('.panel').classList.add('show');
                    });
                } else {
                    registration.showNotification(title, options); 
                }  

            });
            console.log('Service Worker 注册成功');
            // 开启该客户端的消息推送订阅功能
            return subscribeUserToPush(registration, publicKey);
        }).then(function (subscription) {
            // 将生成的客户端订阅信息存储在自己的服务器上
            var body = {subscription: subscription};
            body.uniqueid = new Date().getTime();
            return sendSubscriptionToServer(JSON.stringify(body));
        }).then(function (res) {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    }

    function myBrowser(){
        var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf("Opera") > -1;
        if (isOpera) {
            return "Opera"
        }; //判断是否Opera浏览器
        if (userAgent.indexOf("Firefox") > -1) {
            return "FF";
        } //判断是否Firefox浏览器
        if (userAgent.indexOf("Chrome") > -1){
      return "Chrome";
     }
        if (userAgent.indexOf("Safari") > -1) {
            return "Safari";
        } //判断是否Safari浏览器
        if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
            return "IE";
        }; //判断是否IE浏览器
    }

    
    /* ======= 消息通信 ======= */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function (e) {
            var action = e.data;
            console.log(`receive post-message from sw, action is '${e.data}'`);
            switch (action) {
                case 'show-book':
                    location.href = 'https://book.douban.com/subject/20515024/';
                    break;
                case 'contact-me':
                    location.href = 'mailto:someone@sample.com';
                    break;
                default:
                    document.querySelector('.panel').classList.add('show');
                    break;
            }
        });
    }
    function getApiDataFromCache(url) {
        if ('caches' in window) {
            return caches.match(url).then(function (cache) {
                if (!cache) {
                    return;
                }
                return cache.json();
            });
        }
        else {
            return Promise.resolve();
        }
    }

    function getApiDataRemote(url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.timeout = 60000;
            xhr.onreadystatechange = function () {
                var response = {};
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        response = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        response = xhr.responseText;
                    }
                    resolve(response);
                }
                else if (xhr.readyState === 4) {
                    resolve();
                }
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.ontimeout = reject;
            xhr.open('GET', url, true);
            xhr.send(null);
        });
    }
    function registerServiceWorker(file) {
        return navigator.serviceWorker.register(file);
    }

    
    /**
     * 用户订阅相关的push信息
     * 会生成对应的pushSubscription数据，用于标识用户与安全验证
     * @param {ServiceWorker Registration} registration
     * @param {string} publicKey 公钥
     * @return {Promise}
     */
    function subscribeUserToPush(registration, publicKey) {
        var subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: window.urlBase64ToUint8Array(publicKey)
        }; 
        return registration.pushManager.subscribe(subscribeOptions).then(function (pushSubscription) {
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
            return pushSubscription;
        });
    }

    /**
     * 将浏览器生成的subscription信息提交到服务端
     * 服务端保存该信息用于向特定的客户端用户推送
     * @param {string} body 请求体
     * @param {string} url 提交的api路径，默认为/subscription
     * @return {Promise}
     */
    function sendSubscriptionToServer(body, url) {
        url = url || '/subscription';
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.timeout = 60000;
            xhr.onreadystatechange = function () {
                var response = {};
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        response = JSON.parse(xhr.responseText);
                    }
                    catch (e) {
                        response = xhr.responseText;
                    }
                    resolve(response);
                }
                else if (xhr.readyState === 4) {
                    resolve();
                }
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.ontimeout = reject;
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(body);
        });
    }

        /**
     * 获取用户授权，将
     */
    function askPermission() {
        return new Promise(function (resolve, reject) {
            var permissionResult = Notification.requestPermission(function (result) {
                resolve(result);
            });
      
            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        }).then(function (permissionResult) {
            if (permissionResult !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            }
        });
    }
})();