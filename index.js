// ---- 动态设置元素尺寸 ----
const SIZE_SMALL = 80;
const SIZE_MEDIUM = 150;
const SIZE_LARGE = 220;
let imageSize = SIZE_MEDIUM; // 默认中图

// 计算每页显示的图片数量
function calculatePhotosPerPage() {
    const pageWidth = window.innerWidth; // 获取窗口宽度
    const pageHeight = window.innerHeight; // 获取窗口高度作为目标显示范围
    const imageWidth = imageSize * 1.8; // 图片宽度
    const imageHeight = imageSize * 1.8; // 图片高度

    // 计算每行可以容纳的图片数量
    const imagesPerRow = Math.floor(pageWidth / imageWidth);

    // 计算每列可以容纳的图片数量，基于调整后的高度
    const imagesPerColumn = Math.floor(pageHeight / imageHeight);

    // 计算每页显示的图片数量
    const photosPerPage = imagesPerRow * imagesPerColumn;

    return photosPerPage;
}

document.addEventListener("DOMContentLoaded", function () {
    // ---- 隐藏分页控件 ----
    const pagination = document.getElementById('pagination');

    // ---- 懒加载图片 ----
    const imageObserver = new IntersectionObserver((entries, observer) => { // 创建 IntersectionObserver 实例
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                observer.unobserve(image); // 图片加载后取消观察
            }
        });
    }, { rootMargin: "50px 0px", threshold: 0.01 });
    function setupLazyLoading() {
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
    let events = {}; // 存储更复杂的结构来存储嵌套目录
    document.getElementById('loading-indicator').style.display = 'block'; // 显示加载指示器
    // 模拟从API获取数据 (完成)
    fetch('https://7jaqpxmr1h.execute-api.us-west-2.amazonaws.com/prod')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.body) {
                const photos = JSON.parse(data.body);
                processPhotos(photos);
                showEvents(['public']); // 初次加载页面时显示所有事件
                showPhotos(['public']); // 初次加载页面时显示所有图片
                updateBreadcrumb(['public']); // 初始路径
                updatePagination('public', 1); // 初始分页控件
            }
        })
        .catch(error => console.error('Error:', error))
        .finally(() => {
            document.getElementById('loading-indicator').style.display = 'none'; // 隐藏加载指示器
        });;

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

    // 默认的公共事件图片的图片映射
    const defaultPublicEventImages = {
        'Polaroid': 'polaroid.png',
        'Canon_Digital': 'canon_digit.png',
        'Canon_Film': 'canon_film.png',
    };

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

    let currentPage = 1; // 当前页码
    const photosPerPage = calculatePhotosPerPage(); // 每页显示的图片数量

    // 根据事件显示照片
    function showPhotos(pathArray) {
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

        const totalPhotos = photos.length;
        // 计算当前页应显示的图片
        const startIndex = (currentPage - 1) * photosPerPage;
        const endIndex = Math.min(startIndex + photosPerPage, totalPhotos);
        const photosToShow = photos.slice(startIndex, endIndex);

        // 创建一个存储新元素的数组
        const newElements = [];
        // 创建一个存储所有图片加载Promise的数组
        const loadPromises = [];

        photosToShow.forEach(photoUrl => {
            // 创建包含图片和图片名的容器
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-container'); // 可以添加样式

            const link = document.createElement('a');
            link.href = photoUrl;
            link.dataset.fancybox = 'gallery';
            link.dataset.caption = `
            <div style="
                position: absolute;
                top: 90%;
                left: 3%;
                font-size: 1.2em;
            ">Loading...</div>
        `;

            // 创建图片元素
            const img = document.createElement('img');
            img.setAttribute('data-src', photoUrl); // 设置图片源
            img.classList.add('lazy'); // 可以添加一个类以便于样式设定
            img.style.width = `${imageSize}px`;
            img.style.height = "auto";
            img.style.margin = "10px";
            photoContainer.style.visibility = 'hidden'; // 初始设置为不可见
            // 创建一个新的Promise
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = function () {
                    photoContainer.style.visibility = 'visible'; // 图片加载完成后设置为可见
                    resolve(); // 标记 Promise 为解决状态
                };
                img.onerror = reject;
            });

            // 添加图片到链接元素
            link.appendChild(img);

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

            if (link.dataset.caption === `
            <div style="
                position: absolute;
                top: 90%;
                left: 3%;
                font-size: 1.2em;
            ">Loading...</div>
        `) {
                // 为 FancyBox 设置 beforeShow 回调
                Fancybox.bind("[data-fancybox = 'gallery']", {
                    on: {
                        "loaded": (fancybox, slide) => {
                            // 使用当前图片的 URL 调用 fetchImageInfo
                            fetchImageInfo(photoUrl).then(info => {
                                // 更新 caption
                                let newCaption = `
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
                                slide.caption = newCaption;
                                fancybox.setContent(slide); //直接更新实例属性
                            }).catch(error => {
                                console.error('Error fetching image info:', error);
                                slide.caption = "Image information is not available.";
                                fancybox.setContent(slide);
                            });
                        }
                    },
                    loop: true,
                    contentClick: "iterateZoom",
                    Images: {
                        Panzoom: {
                            maxScale: 3,
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
                    thumbs: {
                        autoStart: true,
                        axis: 'y',
                        type: "modern",
                    },
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
            }
        });

        setupLazyLoading(); // 为新添加的图片设置懒加载
        // 使用 imagesLoaded 确保所有图片加载完成后再执行 Isotope 布局
        Promise.all(loadPromises).then(() => {
            iso.appended(newElements);
            iso.layout();
        }).catch(error => console.error('Error loading images:', error));

        updatePagination(totalPhotos, pathArray); // 确保正确计算和传递总图片数
        updateBreadcrumb(pathArray); // 更新面包屑导航
    }


    // 获取图片信息
    function fetchImageInfo(photoUrl) {
        document.getElementById('loading-indicator').style.display = 'block'; // 显示加载指示器
        // 提取 photoKey 从完整的 S3 URL
        const urlParts = new URL(photoUrl);
        const photoKey = urlParts.pathname.substring(1); // 移除开头的斜杠

        console.log('Fetching image info for:', photoKey);
        // 修改URL为您的API Gateway暴露的Lambda函数的端点
        const apiUrl = `https://7jaqpxmr1h.execute-api.us-west-2.amazonaws.com/prod/imageinfo?photoKey=${encodeURIComponent(photoKey)}`;

        // 发送GET请求到Lambda函数
        return fetch(apiUrl)
            .then(response => {
                //console.log('Response:', response);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // 首先，解析响应体中的 JSON 字符串
                const responseBody = JSON.parse(data.body);
                // 根据响应体中的数据更新 DOM
                return responseBody;
            })
            .catch(error => {
                console.error('Error fetching image info:', error);
            })
            .finally(() => {
                document.getElementById('loading-indicator').style.display = 'none'; // 隐藏加载指示器
            });
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

            breadcrumb.appendChild(crumbLink);
            if (index < pathArray.length - 1) {
                breadcrumb.append(' / ');
            }
        });
    }

});