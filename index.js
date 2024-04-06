
document.addEventListener("DOMContentLoaded", function () {
    const gallery = document.getElementById('photo-gallery');
    const pagination = document.getElementById('pagination');
    pagination.style.display = 'none'; // 隐藏分页控件

    const lazyLoadImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                imageObserver.unobserve(image);
            }
        });
    });

    lazyLoadImages.forEach(image => imageObserver.observe(image));


    let events = {}; // 存储按事件分组的图片URL
    let currentPage = 1; // 当前页码
    const photosPerPage = 21; // 每页显示的图片数量
    let currentEvent = null; // 初始状态，没有事件被选中

    function updatePagination(event, totalPages) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = ''; // 清空现有分页按钮

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            // 标记当前页码的按钮为激活状态
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', function () {
                currentPage = i;
                // 根据是在查看所有事件还是特定事件的照片集来调用相应的函数
                if (currentEvent === null) {
                    showEvents();
                } else {
                    showPhotos(currentEvent, i);
                }
                updatePagination(currentEvent, totalPages); // 重新生成分页按钮以反映新的激活状态
            });
            paginationContainer.appendChild(pageButton);
        }
        // 可选：滚动到分页控件的位置
        paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateBreadcrumb(pathArray) {
        breadcrumb.innerHTML = ''; // 清空当前路径
        pathArray.forEach((part, index) => {
            if (index > 0) {
                // 为分隔符添加样式
                const divider = document.createElement('span');
                divider.textContent = ' / ';
                breadcrumb.appendChild(divider);
            }

            const span = document.createElement('span');
            span.textContent = part;
            // 为路径部分添加样式
            span.style.color = 'blue';
            span.style.cursor = 'pointer';

            if (index < pathArray.length - 1) {
                span.onclick = () => {
                    if (index === 0) {
                        showEvents(); // 返回到根路径
                    }
                    // 这里可以根据需要添加更多的逻辑来处理其他路径部分的点击事件
                };
            } else {
                // 最后一个路径部分不需要点击事件，可以改变其样式
                span.style.cursor = 'default';
                span.style.color = 'black';
            }
            breadcrumb.appendChild(span);
        });
    }

    // 显示所有事件
    function showEvents() {
        pagination.style.display = 'none';// 隐藏分页控件
        document.getElementById('size-controls').style.display = 'none'; // 隐藏尺寸调整按钮
        gallery.innerHTML = ''; // 清空画廊
        Object.keys(events).forEach(event => {
            const eventButton = document.createElement('div');
            eventButton.setAttribute('data-event', event); // 存储事件名称，用于后续引用
            eventButton.addEventListener('click', () => {
                onEventSelected(event);
            });
            eventButton.classList.add('event-button'); // 添加CSS类
            if (events[event].length > 0) {
                // 设置第一张图片为背景图
                eventButton.style.backgroundImage = `url(${events[event][0]})`;
            }
            // 创建一个覆盖层来显示事件名称
            const eventName = document.createElement('div');
            eventName.classList.add('event-name'); // 为事件名称添加CSS类
            eventName.textContent = event; // 设置事件名称为文件夹的名字

            // 将事件名称覆盖层添加到按钮上
            eventButton.appendChild(eventName);

            eventButton.onclick = () => {
                showPhotos(event); // 显示此事件的照片
                updateBreadcrumb(['public', event]); // 更新路径
            };
            gallery.appendChild(eventButton);
        });

        // 计算分页
        const totalEvents = Object.keys(events).length;
        const totalPages = Math.ceil(totalEvents / photosPerPage);

        // 重置当前页面
        currentPage = 1;
        updatePagination('all', totalPages); // 使用适当的参数更新分页控件
        pagination.innerHTML = ''; // 直接隐藏或清空分页控件

        // 重置面包屑为仅显示到“public”目录
        updateBreadcrumb(['public']); // 调用此函数以重置面包屑
    }

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
        if (currentEvent) { // 确保有事件被选中时才刷新图库
            if (currentEvent) {
                showPhotos(currentEvent, currentPage);
            }
        }
    }

    // 假设这是点击事件按钮时调用的函数
    function onEventSelected(event) {
        currentEvent = event; // 更新当前事件
        currentPage = 1; // 重置为第一页
        showPhotos(currentEvent, currentPage); // 显示选中事件的照片
    }

    // 根据事件显示照片
    function showPhotos(event, page = 1) {
        pagination.style.display = 'block'; // 显示分页控件
        document.getElementById('size-controls').style.display = 'block'; // 显示尺寸调整按钮
        gallery.innerHTML = ''; // 清空画廊
        const startIndex = (page - 1) * photosPerPage; // 计算当前页的起始索引
        const endIndex = startIndex + photosPerPage; // 计算当前页的结束索引
        const eventPhotos = events[event].slice(startIndex, endIndex); // 获取当前页的照片

        eventPhotos.forEach(photoUrl => {
            // 创建包含图片和图片名的容器
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-container'); // 可以添加样式

            const link = document.createElement('a');
            link.href = photoUrl;
            link.dataset.fancybox = event;
            link.dataset.caption = 'Loading...';

            // 创建图片元素
            const img = document.createElement('img');
            img.src = photoUrl; // 设置图片源
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

        const totalPages = Math.ceil(events[event].length / photosPerPage); // 计算总页数
        updatePagination(event, totalPages); // 更新分页控件
    }

    document.getElementById('size-controls-toggle').addEventListener('click', function() {
        var sizeControls = document.getElementById('size-controls');
        if (sizeControls.style.display === 'none') {
            sizeControls.style.display = 'block';
            setTimeout(function() {
                sizeControls.classList.add('show');
            }, 10); // 稍微延迟添加 show 类来触发动画
        } else {
            sizeControls.classList.remove('show');
            setTimeout(function() {
                sizeControls.style.display = 'none';
            }, 300); // 等待动画完成后再隐藏
        }
    });

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

    // 模拟从API获取数据
    fetch('https://7jaqpxmr1h.execute-api.us-west-2.amazonaws.com/prod')
        .then(response => response.json())
        .then(data => {
            if (data.body) {
                const photos = JSON.parse(data.body);
                photos.forEach(photoUrl => {
                    const match = photoUrl.match(/public\/(.*?)\/(.+)/);
                    if (match) {
                        const eventName = match[1];
                        if (!events[eventName]) events[eventName] = [];
                        events[eventName].push(photoUrl);
                    }
                });
                showEvents(); // 初次加载页面时显示所有事件
                updateBreadcrumb(['public']); // 初始路径
                updatePagination('public', 1); // 初始分页控件
            }
        })
        .catch(error => console.error('Error:', error));
});

document.querySelectorAll('.event-button').forEach(button => {
    button.addEventListener('click', () => {
        const eventName = button.getAttribute('data-event'); // 获取事件名称
        onEventSelected(eventName); // 调用onEventSelected函数并传入事件名称
    });
});