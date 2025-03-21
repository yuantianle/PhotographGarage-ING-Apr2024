// ---- 动态设置元素尺寸 ----
const SIZE_SMALL = 80;
const SIZE_MEDIUM = 150;
const SIZE_LARGE = 220;
let imageSize = SIZE_MEDIUM; // 默认中图
let paginationEnabled = false; // 默认启用分页

// 默认的公共事件图片的图片映射
const defaultPublicEventImages = {
    'Polaroid': 'polaroid.png',
    'Canon_Digital': 'canon_digit.png',
    'Canon_Film': 'canon_film.png',
};

let currentPage = 1; // 当前页码

var photosPerPage = -1;

let events = {}; // 存储更复杂的结构来存储嵌套目录
let eventsCache = {}; // 确保eventsCache在这里被定义

// 计算每页显示的图片数量
function calculatePhotosPerPage() {
    const pageWidth = window.innerWidth; // 获取窗口宽度
    const pageHeight = window.innerHeight; // 获取窗口高度作为目标显示范围
    const imageWidth = imageSize * 1.8; // 图片宽度
    const imageHeight = imageSize * 1.7; // 图片高度

    // 计算每行可以容纳的图片数量
    const imagesPerRow = Math.floor(pageWidth / imageWidth);

    // 计算每列可以容纳的图片数量，基于调整后的高度
    const imagesPerColumn = Math.floor(pageHeight / imageHeight);

    // 计算每页显示的图片数量
    const photosPerPage = imagesPerRow * imagesPerColumn;

    return photosPerPage;
}

document.addEventListener("DOMContentLoaded", async function () {

    // 获取按钮元素和分页控件元素
    const paginationToggleButton = document.getElementById('pagination-toggle');
    const paginationControls = document.getElementById('pagination');
    // 设置按钮初始状态
    if (paginationEnabled) {
        paginationToggleButton.classList.add('active');
        paginationControls.style.display = 'block';
        paginationToggleButton.innerHTML = '<i class="fa fa-toggle-on"></i> Pagin';
    } else {
        paginationToggleButton.classList.remove('active');
        paginationControls.style.display = 'none';
        paginationToggleButton.innerHTML = '<i class="fa fa-toggle-off"></i> Pagin';
    }
    // ---- 监听分页按钮 ----
    document.getElementById('pagination-toggle').addEventListener('click', function () {
        paginationEnabled = !paginationEnabled; // 切换分页状态

        // 根据分页是否启用来显示或隐藏分页控件
        paginationControls.style.display = paginationEnabled ? 'block' : 'none';

        // 根据分页是否启用来重新加载图片
        showPhotos(currentEvent.split('/'));

        // 根据 paginationEnabled 的状态更新按钮的激活状态
        if (paginationEnabled) {
            this.classList.add('active');
            this.innerHTML = '<i class="fa fa-toggle-on"></i> Pagin'; // 更新为激活状态的文本和图标
        } else {
            this.classList.remove('active');
            this.innerHTML = '<i class="fa fa-toggle-off"></i> Pagin'; // 更新为非激活状态的文本和图标
        }
    });

    // ---- 懒加载图片 ----
    function setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const src = image.dataset.src;
                    if (src) { // 只在 src 实际存在时才尝试加载图片
                        image.src = src;
                    }
                    observer.unobserve(image); // 图片加载后取消观察
                }
            });
        }, { rootMargin: "50px 0px", threshold: 0.01 });
        const lazyLoadImages = document.querySelectorAll('img[data-src]');
        lazyLoadImages.forEach(image => imageObserver.observe(image));
    }
    setupLazyLoading(); // 初始调用

    let currentEvent = null; // 初始状态，没有事件被选中

    // 初始化尺寸按钮并设置data-size属性
    document.getElementById('size-small').setAttribute('data-size', SIZE_SMALL);
    document.getElementById('size-medium').setAttribute('data-size', SIZE_MEDIUM);
    document.getElementById('size-large').setAttribute('data-size', SIZE_LARGE);
    // 为尺寸按钮添加点击事件
    document.getElementById('size-small').addEventListener('click', () => setImageSize(SIZE_SMALL));
    document.getElementById('size-medium').addEventListener('click', () => setImageSize(SIZE_MEDIUM));
    document.getElementById('size-large').addEventListener('click', () => setImageSize(SIZE_LARGE));

    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        if (parseInt(btn.getAttribute('data-size'), 10) === imageSize) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    function setImageSize(size, path) {
        imageSize = size;

        // 更新按钮的激活状态
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(btn => {
            if (parseInt(btn.getAttribute('data-size'), 10) === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        // 更新图片和文件夹尺寸
        const gallery = document.getElementById('photo-gallery');
        gallery.innerHTML = '';

        // 构建新的路径数组，使用当前事件或默认值
        const newPathVariable = currentEvent ? currentEvent.split('/') : ['public'];
        currentEvent = newPathVariable.join('/'); // 更新currentEvent为字符串

        // 显示新路径下的文件夹和图片
        showEvents(newPathVariable);
        showPhotos(newPathVariable);

        // 更新图片和文件夹尺寸后
        iso.layout();

        // 滚动到页面顶部
        window.scrollTo(0, 0);
    }

    // 初始化Isotope
    var iso = new Isotope('#photo-gallery', {
        itemSelector: '.photo-container', // 或者你用来标识图片容器的类
        percentPosition: true,
        masonry: {
            columnWidth: imageSize * 1.2, // 或者用来保持布局一致性的元素
            gutter: 10 // 你可以根据需要调整槽宽
        }
    });

    var totalItemsNum = 0; // 总项目数
    // ---- 设置文件夹委托监听器 ----
    document.getElementById('photo-gallery').addEventListener('click', function (e) {
        if (e.target && e.target.matches('.event-button')) {
            const eventName = e.target.getAttribute('data-event');
            // 构建新的路径数组
            const newPathVariable = (currentEvent ? currentEvent.split('/') : ['public']).concat(eventName);
            currentEvent = newPathVariable.join('/');
            // 清空画廊一次，然后调用两个函数以显示新内容
            const gallery = document.getElementById('photo-gallery');
            gallery.innerHTML = '';

            showEvents(newPathVariable); // 显示新路径下的文件夹
            showPhotos(newPathVariable); // 显示新路径下的图片
        }
    });

    // ---- 显示/隐藏尺寸调整按钮 ----
    document.getElementById('size-controls-toggle').addEventListener('click', function () {
        var sizeControls = document.getElementById('size-controls');
        var isDisplayNone = sizeControls.style.display === 'none';
        var isShowClassPresent = sizeControls.classList.contains('show');

        // 如果display为none，或display为block但没有.show类，则显示元素
        if (isDisplayNone || (!isDisplayNone && !isShowClassPresent)) {
            sizeControls.style.display = 'block';
            setTimeout(function () {
                sizeControls.classList.add('show');
            }, 10); // 添加.show类来显示元素
        } else {
            sizeControls.classList.remove('show');
            setTimeout(function () {
                // 当动画完成后再隐藏元素，或者如果没有动画，直接隐藏
                sizeControls.style.display = 'none';
            }, 300); // 假设移除.show类会触发一个渐隐动画
        }
    });
    document.addEventListener('click', function (event) {
        var sizeControls = document.getElementById('size-controls');
        var sizeControlsToggle = document.getElementById('size-controls-toggle');

        // 检查点击事件是否发生在size-controls或其子元素上
        var clickInsideControls = sizeControls.contains(event.target);

        // 检查点击事件是否发生在size-controls-toggle上
        var clickOnToggle = sizeControlsToggle.contains(event.target);

        // 如果点击发生在控件和切换按钮外部，则隐藏控件
        if (!clickInsideControls && !clickOnToggle) {
            sizeControls.classList.remove('show');
            setTimeout(function () {
                // 当动画完成后再隐藏元素，或者如果没有动画，直接隐藏
                sizeControls.style.display = 'none';
            }, 300); // 假设移除.show类会触发一个渐隐动画
        }
    });


    // ---- 从API获取数据 ----
    async function fetchData() {
        const apiUrl = 'https://7jaqpxmr1h.execute-api.us-west-2.amazonaws.com/prod';

        const authToken = localStorage.getItem('authToken');

        // 检查 token 是否已过期，如果过期则清除并返回 null
        if (isTokenExpired(authToken)) {
            console.warn('Token 已过期，需重新登录');
            localStorage.removeItem('authToken');
            return null;
        }
        // 检查是否已登录
        if (!authToken) {
            console.warn('用户未登录，无法加载数据');
            return null; // 返回空，避免未登录时加载图片
        }

        if (eventsCache[apiUrl]) {
            console.log('Using cached data');
            return eventsCache[apiUrl]; // 使用缓存的数据
        }

        toggleLoadingIndicator(true);
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            if (!response.ok) {
                // 如果返回 401，说明 token 无效或已过期，清除 token
                if (response.status === 401) {
                    console.warn('Token 无效或已过期，需重新登录');
                    localStorage.removeItem('authToken');
                }
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // 如果返回的数据中包含 statusCode，说明验证失败; 成功的时候只会返回data
            if (data.statusCode && response.status === 200) {
                console.error("后端返回StatusCode(表明验证失败)，跳过图片加载:", data.body);
                // 这里把错误信息展示给用户，而不是再去调用 processPhotos
                return;
            }
            eventsCache[apiUrl] = data; // 缓存数据
            return data;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
        finally {
            toggleLoadingIndicator(false);
        }
    }

    document.getElementById('login-btn').addEventListener('click', function () {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            document.getElementById('error').innerText = 'Please correct Account/Password input.';
            return;
        }

        // 调用后端登录 API，替换为你在 API Gateway 上配置的 URL
        fetch('https://x67i134qw3.execute-api.us-west-2.amazonaws.com/prod/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            mode: 'cors' // 允许跨域
        })
            .then(response => response.json())
            .then(async data => {
                const parsedBody = JSON.parse(data.body); // 这里解析 body 里的 JSON
                if (parsedBody.token) {
                    localStorage.setItem('authToken', parsedBody.token);// 保存令牌（这里示例用 localStorage，生产环境建议使用 HttpOnly Cookie）

                    // 登录成功后清除之前缓存的数据
                    eventsCache = {};
                    // 登录成功后隐藏登录框
                    document.getElementById('login-box').style.display = 'none';
                    document.getElementById('overlay').style.display = 'none';
                    // 显示 “Log out” 按钮
                    document.getElementById('logout-btn').style.display = 'inline-block';
                    // 显示 toggle-container
                    document.getElementById('toggle-container').style.display = 'block';
                    // 登录后加载相册
                    const photosData = await fetchData();
                    //get number
                    if (photosData) {
                        processPhotos(photosData);
                        showEvents(['public']);
                        showPhotos(['public']);
                        updateBreadcrumb(['public']); // 初始路径
                        updatePagination('public', 1); // 初始分页控件
                    }
                    else {
                        console.error("后端返回错误:", photosData);
                    }
                } else {
                    document.getElementById('error').innerText = data.error || '登录失败';
                }
            })
            .catch(err => {
                console.error(err);
                document.getElementById('error').innerText = '网络错误，请重试';
            });
    });

    // 页面加载时检查登录状态
    window.onload = function () {
        const token = localStorage.getItem("authToken");
        if (!token || isTokenExpired(token)) {
            document.getElementById('login-box').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'none';
        }
        else {  // token 存在且有效，则不显示登录窗，直接加载内容，并显示 Log out 按钮
            document.getElementById('login-box').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline-block';
            document.getElementById('toggle-container').style.display = 'block';
            // 直接加载相册数据
            fetchData().then(data => {
                if (data) {
                    processPhotos(data);
                    showEvents(['public']);
                    showPhotos(['public']);
                    updateBreadcrumb(['public']);
                    updatePagination('public', 1);
                }
            });
        }
    };

    function isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1])); // 解析 JWT payload
            const exp = payload.exp * 1000; // 过期时间（转换成毫秒）
            return Date.now() > exp; // 过期返回 true
        } catch (e) {
            return true; // 解析失败视为无效 token
        }
    }

    function toggleLoadingIndicator(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (show) {
            loadingIndicator.style.visibility = 'visible';
            loadingIndicator.style.opacity = '1';
            loadingIndicator.style.transform = 'translate(-50%, -50%) scale(1)';
        } else {
            loadingIndicator.style.opacity = '0';
            loadingIndicator.style.transform = 'translate(-50%, -50%) scale(0.6)';
            // 当动画完成后设置visibility为hidden
            setTimeout(() => {
                loadingIndicator.style.visibility = 'hidden';
            }, 500); // 500ms是过渡时间
        }
    }

    function processPhotos(photos) {
        const imageExtensions = /\.(jpg|jpeg|png)$/i;
        photos.forEach(photoUrl => {
            const match = photoUrl.match(/public\/(.+)$/);
            if (match) {
                const path = match[1]; // 'event1/sub-event1/photo1.jpg'
                const pathSegments = path.split('/'); // 将路径分割成段
                let currentLevel = events;

                // 遍历路径的每一部分，除了最后一部分（图片名称）
                for (let i = 0; i < pathSegments.length - 1; i++) {
                    if (!currentLevel[pathSegments[i]]) {
                        currentLevel[pathSegments[i]] = {};
                    }
                    currentLevel = currentLevel[pathSegments[i]];
                }

                // 最后一部分是图片文件，我们在这里添加它
                const photoName = pathSegments[pathSegments.length - 1];
                if (!currentLevel.photos) {
                    currentLevel.photos = [];
                }
                // 检查路径是否以图片格式结尾，如果是则添加到 photos 数组中
                if (imageExtensions.test(photoName)) {
                    currentLevel.photos.push(photoUrl);
                }
            }
        });
    }

    // 显示所有事件
    function showEvents(pathArray = ['public']) {
        // 显示加载指示器
        toggleLoadingIndicator(true);

        function checkAllImagesLoaded() {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad) {
                // 所有图片都已处理，隐藏加载指示器
                toggleLoadingIndicator(false);
            }
        }

        const gallery = document.getElementById('photo-gallery');

        // 根据路径数组遍历到当前目录层级
        let currentLevel = events;
        for (let i = 1; i < pathArray.length; i++) {
            if (currentLevel[pathArray[i]]) { // 确保存在这个路径段
                currentLevel = currentLevel[pathArray[i]];
            } else {
                // 如果路径不存在，可能需要输出一些错误信息或者处理逻辑
                console.error("Path does not exist:", pathArray[i]);
                return; // 早期返回防止进一步错误
            }
        }

        if (typeof currentLevel !== 'object' || currentLevel === null) {
            console.error("Invalid current level:", currentLevel);
            return; // 如果当前层级不是一个对象或为null，停止执行
        }

        updateBreadcrumb(pathArray); // 更新面包屑导航

        let imagesToLoad = 0; // 跟踪需要加载的图片数量
        let imagesLoaded = 0; // 跟踪已加载的图片数量

        Object.keys(currentLevel)
            .sort((a, b) => b.localeCompare(a)) // 按事件名降序排序
            .forEach(key => {
                if ((typeof currentLevel[key] === 'object' && currentLevel[key] !== null) && key !== 'photos') {
                    // 创建文件夹按钮
                    const eventButton = document.createElement('div');
                    eventButton.setAttribute('data-event', key); // 存储事件（目录）名称
                    eventButton.classList.add('event-button');

                    // 设置文件夹风格
                    const defaultImage = pathArray[0] === 'public' ? defaultPublicEventImages[key] : null;// 检查是否为这个路径设置了默认图片，特别是对于位于public根目录下的文件夹

                    const albumCover = albumCoverImages[key];
                    // 从 currentLevel[key].photos 中模糊匹配的图片
                    let resolvedImageCoverUrl = null;
                    if (Array.isArray(currentLevel[key].photos)) {
                        resolvedImageCoverUrl = currentLevel[key].photos.find(photo => {
                            // 如果 albumCover 存在并且有通配符 '*'
                            if (typeof albumCover === 'string' && albumCover.includes('*')) {
                                const pattern = albumCover.replace("+", "https://marcus-photograph-garage.s3.amazonaws.com/public").replace('*', key).split('*')[0]; // 替换并截取前缀
                                return photo.startsWith(pattern); // 检查当前 photo 是否匹配该前缀
                            }
                            return false;
                        });
                    }


                    const imageUrl = (defaultImage || resolvedImageCoverUrl || currentLevel[key].photos?.[0] || 'unnamed.png').replace('public/', 'public_small/'); // 使用第一张图片作为文件夹封面
                    eventButton.style.backgroundImage = `url("${imageUrl}")`;
                    eventButton.style.width = `${imageSize}px`;
                    eventButton.style.height = `${imageSize}px`;
                    eventButton.style.marginBottom = '45px';
                    eventButton.style.backgroundRepeat = 'no-repeat';
                    // title is the name of the folder
                    eventButton.setAttribute('title', key);

                    // 监测背景图片的加载
                    const img = new Image();
                    img.onload = img.onerror = checkAllImagesLoaded;
                    img.src = imageUrl;
                    imagesToLoad++;

                    // 添加文件夹图标元素
                    const folderIcon = document.createElement('img');
                    defaultImage ? folderIcon.style.opacity = 0 : folderIcon.src = 'folder2.png'; // 替换为你的文件夹图标路径
                    folderIcon.style.filter = 'hue-rotate(200deg)'; // 让图标变蓝
                    folderIcon.style.width = '30%'; // 根据需要调整大小
                    folderIcon.style.height = '30%';
                    folderIcon.style.position = 'absolute'; // 使用绝对定位
                    folderIcon.style.bottom = '16%'; // 调整位置
                    folderIcon.style.right = '1%';
                    folderIcon.style.pointerEvents = 'none'; // 允许点击事件穿透图标
                    eventButton.appendChild(folderIcon);

                    // 添加目录名称
                    const eventName = document.createElement('div');
                    eventName.classList.add('event-name');
                    eventName.textContent = key;
                    eventButton.appendChild(eventName);

                    // 将完整的文件夹按钮添加到画廊中
                    gallery.appendChild(eventButton);
                }
            });

        if (imagesToLoad === 0) {
            // 如果没有任何异步加载的图像，立即隐藏加载指示器
            toggleLoadingIndicator(false);
        }

        // 重置当前页面
        currentPage = 1;
        // 计算分页
        const totalItems = Object.keys(currentLevel).length;
        updatePagination(totalItems, pathArray); // 使用适当的参数更新分页控件
        updateBreadcrumb(pathArray); // 更新面包屑导航
    }

    // 为每张图片异步加载JSON信息
    async function fetchPhotoInfo(baseImageUrl) {
        const infoUrl = `${baseImageUrl}_info.json`;
        toggleLoadingIndicator(true);
        try {
            const response = await fetch(infoUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch photo info');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching photo info:', error);
            return null;
        } finally {
            toggleLoadingIndicator(false);
        }
    }

    photosPerPage = calculatePhotosPerPage(); // 每页显示的图片数量

    // 根据事件显示照片
    async function showPhotos(pathArray) {
        const gallery = document.getElementById('photo-gallery');

        //清除目录里面的照片
        const photoContainers = gallery.querySelectorAll('.photo-container');
        photoContainers.forEach(container => {
            container.remove(); // 移除图片容器
        });

        // 遍历到当前选中目录的层级
        let currentLevel = events;
        for (let i = 1; i < pathArray.length; i++) {
            currentLevel = currentLevel[pathArray[i]];
        }
        const photos = currentLevel.photos || [];

        // 根据当前图片数量决定是否显示分页控制按钮
        const paginationToggleButton = document.getElementById('pagination-toggle');
        if (photos.length > 1) { // 如果我们处在子文件夹（即图片文件夹）中
            paginationToggleButton.style.display = 'block';
        } else { // 如果我们不在图片文件夹中
            paginationToggleButton.style.display = 'none';
        }

        const totalPhotos = photos.length;
        let photosToShow;
        // 计算当前页应显示的图片
        if (paginationEnabled) {
            // 计算当前页应显示的图片
            const startIndex = (currentPage - 1) * photosPerPage;
            const endIndex = Math.min(startIndex + photosPerPage, totalPhotos);
            photosToShow = photos.slice(startIndex, endIndex);
        } else {
            // 如果分页未启用，显示所有图片
            photosToShow = photos;
        }

        // 创建一个存储新元素的数组
        const newElements = [];
        // 创建一个存储所有图片加载Promise的数组
        const loadPromises = [];

        for (const photoUrl of photosToShow) {
            // 创建包含图片和图片名的容器
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-container'); // 可以添加样式

            const link = document.createElement('a');
            link.href = photoUrl; //原图URL
            link.dataset.fancybox = 'gallery';
            // 替换URL路径指向压缩图片
            const compressedPhotoUrl = photoUrl.replace('public', 'public_small');
            const baseImageUrl = compressedPhotoUrl.replace(/\.\w+$/, ''); // 删除最后的文件扩展名，如 .png

            // 创建图片元素
            const img = document.createElement('img');
            img.setAttribute('data-src', compressedPhotoUrl); // 这里是压缩图URL，懒加载
            img.classList.add('lazy'); // 可以添加一个类以便于样式设定
            img.style.width = `${imageSize}px`;
            img.style.height = "auto";
            img.style.margin = "10px";
            photoContainer.style.visibility = 'hidden'; // 初始设置为不可见

            const infoPromise = fetchPhotoInfo(baseImageUrl); // 不立即await
            // 创建一个新的Promise
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = function () {
                    photoContainer.style.visibility = 'visible'; // 图片加载完成后设置为可见
                    resolve(); // 标记 Promise 为解决状态
                };
                img.onerror = reject;
            });

            try {
                const [info] = await Promise.all([infoPromise]);
                // 现在设置caption和其他信息

                if (!info) {
                    console.error('No info found for', photoUrl);
                    return;
                }
                link.dataset.caption = `
                            <div style="
                            position: absolute;
                            top: 90%;
                            left: 3%;
                            font-size: 1.2em;
                        ">
                        <span class="caption-key">⏳ Exposure Time: </span> <span class="caption-value">${info['Exposure Time']}</span><br>
                        <span class="caption-key">💿 Aperture: </span> <span class="caption-value">${info['F Number']}</span><br>
                        <span class="caption-key">🔆 ISO Speed: </span> <span class="caption-value">${info['ISO Speed']}</span><br>
                        <span class="caption-key">🔭 Focal Length: </span> <span class="caption-value">${info['Focal Length']}</span><br>
                        <span class="caption-key">📸 Flash: </span> <span class="caption-value">${info['Flash']}</span>
                    </div>
                    `;

            } catch (error) {
                console.error("Error loading resources", error);
            }
            // 添加图片到链接元素
            link.appendChild(img);
            link.dataset.fancybox = "gallery1";

            // 提取图片名（假设URL结构为 .../eventName/photoName.jpg）
            const originalphotoName = photoUrl.split('/').pop().split('?')[0]; // 移除URL的查询参数（如果有）
            const photoName = originalphotoName.includes('-') ? originalphotoName.split('-')[0] + '.jpg' : originalphotoName; // 截取"-"之前的部分并确保扩展名为.JPG

            // 创建并添加图片名的文本元素
            const nameElement = document.createElement('div');
            nameElement.textContent = photoName;
            nameElement.classList.add('photo-name'); // 添加样式
            nameElement.style.width = `${imageSize}px`; // 动态设置宽度以匹配图片

            // 将链接和图片名添加到容器
            photoContainer.appendChild(link);
            photoContainer.appendChild(nameElement);
            photoContainer.setAttribute('title', photoName);

            gallery.appendChild(photoContainer);// 将容器添加到画廊
            newElements.push(photoContainer); // 添加新元素到数组中
            loadPromises.push(loadPromise);// 将这个Promise添加到数组中
        };

        Fancybox.bind("[data-fancybox = 'gallery1']", {
            loop: true,
            contentClick: "toggleCover",
            Images: {
                Panzoom: {
                    maxScale: 2,
                },
                protected: true,
            },
            buttons: [
                'slideShow',
                'zoom',
                'fullScreen',
                'close',
                'thumbs'
            ],
            Toolbar: {
                display: {
                    left: ["infobar"],
                    middle: [
                        "zoomIn",
                        "zoomOut",
                        "toggle1to1",
                        "rotateCCW",
                        "rotateCW",
                        "flipX",
                        "flipY",
                    ],
                    right: ["slideshow", "thumbs", "close"],
                },

            }
        });

        setupLazyLoading(); // 为新添加的图片设置懒加载
        // 使用 imagesLoaded 确保所有图片加载完成后再执行 Isotope 布局
        Promise.all(loadPromises).then(() => {
            iso.appended(newElements);
            iso.layout();
        }).catch(error => console.error('Error loading images:', error));

        // 更新分页控件
        if (paginationEnabled) {
            updatePagination(totalPhotos, pathArray); // 仅当分页启用时更新分页控件
        }
        updateBreadcrumb(pathArray); // 更新面包屑导航
    }

    // 更新分页控件
    function updatePagination(totalItems, pathArray) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = ''; // 清空现有的分页按钮

        // 根据项目类型（事件或照片）计算总页数
        const totalPages = Math.ceil(totalItems / photosPerPage);

        // 如果只有一页或没有内容，隐藏分页控件
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        } else {
            pagination.style.display = 'block'; // 确保分页控件可见
        }

        // 为每一页创建一个按钮
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active'); // 标记当前页码的按钮为活动状态
            }
            pageButton.addEventListener('click', () => {
                currentPage = i; // 更新当前页
                updatePagination(totalItems, pathArray); // 重要：在页面变化时更新分页控件状态
                showPhotos(pathArray); // 根据新的当前页显示图片
            });
            pagination.appendChild(pageButton);
        }
        // 滚动到页面顶部
        window.scrollTo(0, 0);
    }

    // 更新面包屑导航函数
    function updateBreadcrumb(pathArray) {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = ''; // 清空当前面包屑

        pathArray.forEach((item, index) => {
            const crumbLink = document.createElement('a');
            crumbLink.href = '#';
            crumbLink.textContent = index === 0 ? 'Public' : item;
            crumbLink.addEventListener('click', (e) => {
                e.preventDefault();
                const newPathArray = pathArray.slice(0, index + 1);
                currentEvent = newPathArray.join('/'); // 更新当前事件路径
                // 先清空画廊内容，然后加载新内容
                const gallery = document.getElementById('photo-gallery');
                gallery.innerHTML = '';
                showEvents(newPathArray);
                showPhotos(newPathArray);
            });

            // 如果是路径数组的最后一个元素，则添加高亮样式类
            if (index === pathArray.length - 1) {
                crumbLink.classList.add('active-breadcrumb');
            }

            breadcrumb.appendChild(crumbLink);
            if (index < pathArray.length - 1) {
                breadcrumb.append(' / ');
            }
        });
    }

    // 绑定点击事件
    document.getElementById('logout-btn').addEventListener('click', logout);
});