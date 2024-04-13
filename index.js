// ---- 动态设置元素尺寸 ----
const SIZE_SMALL = 80;
const SIZE_MEDIUM = 150;
const SIZE_LARGE = 220;
let imageSize = SIZE_MEDIUM; // 默认中图
let paginationEnabled = true; // 默认启用分页

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

    // 获取按钮元素
    const paginationToggleButton = document.getElementById('pagination-toggle');

    // 设置按钮初始状态
    if (paginationEnabled) {
        paginationToggleButton.classList.add('active');
        paginationToggleButton.innerHTML = '<i class="fa fa-toggle-on"></i> Pagin';
    } else {
        paginationToggleButton.classList.remove('active');
        paginationToggleButton.innerHTML = '<i class="fa fa-toggle-off"></i> Pagin';
    }
    // ---- 监听分页按钮 ----
    document.getElementById('pagination-toggle').addEventListener('click', function () {
        paginationEnabled = !paginationEnabled; // 切换分页状态

        // 获取分页控件的元素
        const paginationControls = document.getElementById('pagination');

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

        // 阻止事件冒泡，避免触发上层元素的事件
        event.stopPropagation();

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
        if (eventsCache[apiUrl]) {
            console.log('Using cached data');
            return eventsCache[apiUrl]; // 使用缓存的数据
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            eventsCache[apiUrl] = data; // 缓存数据
            return data;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    document.getElementById('loading-indicator').style.display = 'block'; // 显示加载指示器
    const data = await fetchData(); // 使用新的fetchData函数
    if (data && data.body) {
        const photos = JSON.parse(data.body);
        processPhotos(photos);
        showEvents(['public']); // 初次加载页面时显示所有事件
        showPhotos(['public']); // 初次加载页面时显示所有图片
        updateBreadcrumb(['public']); // 初始路径
        updatePagination('public', 1); // 初始分页控件
    }
    document.getElementById('loading-indicator').style.display = 'none'; // 隐藏加载指示器

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

        Object.keys(currentLevel).forEach(key => {
            if ((typeof currentLevel[key] === 'object' && currentLevel[key] !== null) && key !== 'photos') {
                // 创建文件夹按钮
                const eventButton = document.createElement('div');
                eventButton.setAttribute('data-event', key); // 存储事件（目录）名称
                eventButton.classList.add('event-button');

                // 设置文件夹风格  
                const defaultImage = pathArray[0] === 'public' ? defaultPublicEventImages[key] : null;// 检查是否为这个路径设置了默认图片，特别是对于位于public根目录下的文件夹
                var originalString = `url("${currentLevel[key].photos?.[0] || defaultImage || 'unnamed.png'}")`;
                eventButton.style.backgroundImage = originalString;
                eventButton.style.backgroundSize = 'contain';
                eventButton.style.width = `${imageSize}px`;
                eventButton.style.height = `${imageSize}px`;
                eventButton.style.marginBottom = '45px';
                eventButton.style.backgroundRepeat = 'no-repeat';
                // title is the name of the folder
                eventButton.setAttribute('title', key);

                // 添加文件夹图标元素
                const folderIcon = document.createElement('img');
                defaultImage ? folderIcon.style.opacity = 0 : folderIcon.src = 'folder.png'; // 替换为你的文件夹图标路径
                folderIcon.style.width = '50%'; // 根据需要调整大小
                folderIcon.style.height = '50%';
                folderIcon.style.position = 'absolute'; // 使用绝对定位
                folderIcon.style.bottom = '5px'; // 调整位置
                folderIcon.style.right = '5px';
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
        try {
            const response = await fetch(infoUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch photo info');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching photo info:', error);
            return null;
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
            const photoName = photoUrl.split('/').pop().split('?')[0]; // 移除URL的查询参数（如果有）

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
                protected: false,
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

});