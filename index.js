
document.addEventListener("DOMContentLoaded", function () {
    // ---- 隐藏分页控件 ----
    const pagination = document.getElementById('pagination');
    pagination.style.display = 'none'; // 隐藏分页控件

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

    // ---- 动态设置图片尺寸 ----
    let currentEvent = null; // 初始状态，没有事件被选中
    const SIZE_SMALL = 80;
    const SIZE_MEDIUM = 150;
    const SIZE_LARGE = 220;
    let imageSize = SIZE_MEDIUM; // 默认中图
    // 初始化尺寸按钮并设置data-size属性
    document.getElementById('size-small').setAttribute('data-size', SIZE_SMALL);
    document.getElementById('size-medium').setAttribute('data-size', SIZE_MEDIUM);
    document.getElementById('size-large').setAttribute('data-size', SIZE_LARGE);
    // 为尺寸按钮添加点击事件
    document.getElementById('size-small').addEventListener('click', () => setImageSize(SIZE_SMALL));
    document.getElementById('size-medium').addEventListener('click', () => setImageSize(SIZE_MEDIUM));
    document.getElementById('size-large').addEventListener('click', () => setImageSize(SIZE_LARGE));
    function setImageSize(size) {
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
        // 重新显示图片
        if (currentEvent) { // 如果已选择事件，则刷新图片展示以应用新尺寸
            showPhotos(currentEvent.split('/'));
        }
    }


    // ---- 设置文件夹委托监听器 ----
    document.getElementById('photo-gallery').addEventListener('click', function (e) {
        if (e.target && e.target.matches('.event-button')) {
            const eventName = e.target.getAttribute('data-event');
            const newPathArray = currentEvent ? currentEvent.split('/').concat(eventName) : [eventName];
            onEventSelected(newPathArray);// 这是点击文件夹（事件）按钮时调用的函数
        }
    });
    function onEventSelected(eventPathArray) {
        currentEvent = eventPathArray.join('/'); // 更新当前事件
        currentPage = 1; // 重置为第一页
        if (events[currentEvent] && events[currentEvent].photos) {
            showPhotos(eventPathArray);
        } else {
            showEvents(eventPathArray);
        }
    }

    // ---- 显示/隐藏尺寸调整按钮 ----
    document.getElementById('size-controls-toggle').addEventListener('click', function () {
        var sizeControls = document.getElementById('size-controls');
        if (sizeControls.style.display === 'none') {
            sizeControls.style.display = 'block';
            setTimeout(function () {
                sizeControls.classList.add('show');
            }, 10); // 稍微延迟添加 show 类来触发动画
        } else {
            sizeControls.classList.remove('show');
            setTimeout(function () {
                sizeControls.style.display = 'none';
            }, 300); // 等待动画完成后再隐藏
        }
    });

    // ---- 从API获取数据 ----
    let events = {}; // 存储更复杂的结构来存储嵌套目录

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
                updateBreadcrumb(['public']); // 初始路径
                updatePagination('public', 1); // 初始分页控件
            }
        })
        .catch(error => console.error('Error:', error));

    function processPhotos(photos) {
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
                currentLevel.photos.push(photoUrl);
            }
        });
        console.log(events);
    }

    // 显示所有事件
    function showEvents(pathArray = ['public']) {
        const gallery = document.getElementById('photo-gallery');
        pagination.style.display = 'none';// 隐藏分页控件
        document.getElementById('size-controls').style.display = 'none'; // 隐藏尺寸调整按钮
        gallery.innerHTML = ''; // 清空画廊

        // 根据路径数组遍历到当前目录层级
        let currentLevel = events;
        for (let i = 1; i < pathArray.length; i++) {
            if(currentLevel[pathArray[i]]) { // 确保存在这个路径段
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
            const eventButton = document.createElement('div');
            eventButton.setAttribute('data-event', key); // 存储事件（目录）名称
            eventButton.classList.add('event-button');
            eventButton.style.backgroundImage = `url(${currentLevel[key].photos?.[0] || 'unnamed.png'})`; // 使用默认图片路径作为后备
            const eventName = document.createElement('div');
            eventName.classList.add('event-name');
            eventName.textContent = key; // 目录名称
            eventButton.appendChild(eventName);
            gallery.appendChild(eventButton);
        });

        // 重置当前页面
        currentPage = 1;
        // 计算分页
        const totalItems = Object.keys(currentLevel).length;
        updatePagination(totalItems, pathArray); // 使用适当的参数更新分页控件
        updateBreadcrumb(pathArray); // 更新面包屑导航
    }

    let currentPage = 1; // 当前页码
    const photosPerPage = 21; // 每页显示的图片数量

    // 根据事件显示照片
    function showPhotos(pathArray) {
        const gallery = document.getElementById('photo-gallery');
        pagination.style.display = 'block'; // 显示分页控件
        document.getElementById('size-controls').style.display = 'block'; // 显示尺寸调整按钮
        gallery.innerHTML = ''; // 清空画廊

        // 遍历到当前选中目录的层级
        let currentLevel = events;
        for (let i = 1; i < pathArray.length; i++) {
            currentLevel = currentLevel[pathArray[i]];
        }

        const photos = currentLevel.photos || [];
        const totalPhotos = photos.length;
        // 计算当前页应显示的图片
        const startIndex = (currentPage - 1) * photosPerPage;
        const endIndex = startIndex + photosPerPage;
        const photosToShow = photos.slice(startIndex, endIndex);

        photosToShow.forEach(photoUrl => {
            // 创建包含图片和图片名的容器
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-container'); // 可以添加样式

            const link = document.createElement('a');
            link.href = photoUrl;
            link.dataset.fancybox = event;
            link.dataset.caption = 'Loading...';

            // 创建图片元素
            const img = document.createElement('img');
            img.setAttribute('data-src', photoUrl); // 设置图片源
            img.classList.add('lazy'); // 可以添加一个类以便于样式设定
            img.style.width = `${imageSize}px`;
            img.style.height = "auto";
            img.style.margin = "10px";

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

            // 将容器添加到画廊
            gallery.appendChild(photoContainer);


            // 为 FancyBox 设置 beforeShow 回调
            $(link).fancybox({
                beforeShow: function (instance, slide) {
                    // 使用当前图片的 URL 调用 fetchImageInfo
                    fetchImageInfo(photoUrl).then(info => {
                        console.log('Image info:', info);
                        // 更新 caption
                        let newCaption = `
                        <div>
                        <span class="caption-key">⌛Exposure Time: </span> <span class="caption-value">${info['Exposure Time']}</span><br>
                        <span class="caption-key">💿Aperture: </span> <span class="caption-value">${info['F Number']}</span><br>
                        <span class="caption-key">🔆ISO Speed: </span> <span class="caption-value">${info['ISO Speed']}</span><br>
                        <span class="caption-key">🔭Focal Length: </span> <span class="caption-value">${info['Focal Length']}</span><br>
                        <span class="caption-key">📸Flash: </span> <span class="caption-value">${info['Flash']}</span>
                        </div>
                        `;
                        // 试着直接更新 caption 文本
                        $(".fancybox-caption").html(newCaption);
                        // 或者，如果你有访问当前 FancyBox 实例的方式，尝试更新实例属性
                        instance.current.opts.caption = newCaption;
                    }).catch(error => {
                        console.error('Error fetching image info:', error);
                        $(".fancybox-caption").text("Image information is not available.");
                        // 或更新实例属性
                        instance.current.opts.caption = "Image information is not available.";
                    });
                }
            });
        });

        setupLazyLoading(); // 为新添加的图片设置懒加载
        updatePagination(totalPhotos, pathArray); // 确保正确计算和传递总图片数
        updateBreadcrumb(pathArray); // 更新面包屑导航
    }

    // 获取图片信息
    function fetchImageInfo(photoUrl) {
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
                console.log('response:', responseBody);
                // 根据响应体中的数据更新 DOM
                return responseBody;
            })
            .catch(error => {
                console.error('Error fetching image info:', error);
            });
    }


    function updatePagination(totalPhotos, pathArray) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = ''; // 清空现有的分页按钮

        const totalPages = Math.ceil(totalPhotos / photosPerPage);
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        } else {
            pagination.style.display = 'block';
        }

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active'); // 标记当前页码的按钮
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                showPhotos(pathArray); // 重新显示当前目录的图片
            });
            pagination.appendChild(pageButton);
        }
    }

    function updateBreadcrumb(pathArray) {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = ''; // 清空当前面包屑
    
        pathArray.forEach((item, index) => {
            const crumbLink = document.createElement('a');
            crumbLink.href = '#';
            crumbLink.textContent = index === 0 ? 'Public' : item; // 第一个路径显示为"Public"
            crumbLink.addEventListener('click', (e) => {
                e.preventDefault();
                showEvents(pathArray.slice(0, index + 1));
            });
    
            breadcrumb.appendChild(crumbLink);
            if (index < pathArray.length - 1) {
                breadcrumb.append(' / ');
            }
        });
    }

});

document.querySelectorAll('.event-button').forEach(button => {
    button.addEventListener('click', () => {
        const eventName = button.getAttribute('data-event'); // 获取事件名称
        onEventSelected(eventName); // 调用onEventSelected函数并传入事件名称
    });
});