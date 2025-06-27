const API_BASE = 'http://localhost:3001/api';

let currentPage = 1;
let isLoading = false;
let hasMore = true;

// DOM元素
const wallpaperGrid = document.getElementById('wallpaperGrid');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const detailModal = document.getElementById('detailModal');
const uploadForm = document.getElementById('uploadForm');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadWallpapers();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 上传按钮
    uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'block';
    });

    // 关闭模态框
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // 上传表单提交
    uploadForm.addEventListener('submit', handleUpload);

    // 搜索
    searchBtn.addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 分类筛选
    document.getElementById('categoryFilter').addEventListener('change', handleSearch);

    // 加载更多
    loadMoreBtn.addEventListener('click', loadMoreWallpapers);
}

// 加载壁纸
async function loadWallpapers(reset = false) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (reset) {
        currentPage = 1;
        hasMore = true;
        wallpaperGrid.innerHTML = '<div class="loading">加载中...</div>';
    }

    try {
        const category = document.getElementById('categoryFilter').value;
        const search = document.getElementById('searchInput').value;
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });

        if (category !== 'all') params.append('category', category);
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE}/wallpapers?${params}`);
        const wallpapers = await response.json();

        if (reset) {
            wallpaperGrid.innerHTML = '';
        } else {
            // 移除加载提示
            const loading = wallpaperGrid.querySelector('.loading');
            if (loading) loading.remove();
        }

        if (wallpapers.length === 0) {
            if (reset) {
                wallpaperGrid.innerHTML = '<div class="loading">暂无壁纸</div>';
            }
            hasMore = false;
        } else {
            renderWallpapers(wallpapers);
            if (wallpapers.length < 20) {
                hasMore = false;
            }
        }

        updateLoadMoreButton();
    } catch (error) {
        console.error('加载壁纸失败:', error);
        wallpaperGrid.innerHTML = '<div class="loading">加载失败，请刷新重试</div>';
    }

    isLoading = false;
}

// 渲染壁纸
function renderWallpapers(wallpapers) {
    wallpapers.forEach(wallpaper => {
        const wallpaperElement = createWallpaperElement(wallpaper);
        wallpaperGrid.appendChild(wallpaperElement);
    });
}

// 创建壁纸元素
function createWallpaperElement(wallpaper) {
    const div = document.createElement('div');
    div.className = 'wallpaper-item';
    div.onclick = () => showWallpaperDetail(wallpaper.id);

    div.innerHTML = `
        <img src="${API_BASE.replace('/api', '')}/uploads/${wallpaper.filename}" 
             alt="${wallpaper.title}" 
             loading="lazy">
        <div class="wallpaper-info">
            <div class="wallpaper-title">${wallpaper.title}</div>
            <div class="wallpaper-meta">
                <span class="wallpaper-category">${getCategoryName(wallpaper.category)}</span>
                <span>${wallpaper.width}×${wallpaper.height}</span>
            </div>
            <div class="wallpaper-meta">
                <span>下载: ${wallpaper.downloads}</span>
                <span>${formatDate(wallpaper.upload_date)}</span>
            </div>
        </div>
    `;

    return div;
}

// 显示壁纸详情
async function showWallpaperDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/wallpapers/${id}`);
        const wallpaper = await response.json();

        const detailContent = document.getElementById('wallpaperDetail');
        detailContent.innerHTML = `
            <div class="wallpaper-detail-content">
                <img src="${API_BASE.replace('/api', '')}/uploads/${wallpaper.filename}" 
                     alt="${wallpaper.title}">
                <h2>${wallpaper.title}</h2>
                <div class="detail-info">
                    <p><strong>分类:</strong> ${getCategoryName(wallpaper.category)}</p>
                    <p><strong>分辨率:</strong> ${wallpaper.width} × ${wallpaper.height}</p>
                    <p><strong>文件大小:</strong> ${formatFileSize(wallpaper.size)}</p>
                    <p><strong>下载次数:</strong> ${wallpaper.downloads}</p>
                    <p><strong>上传时间:</strong> ${formatDate(wallpaper.upload_date)}</p>
                </div>
                <button class="download-btn" onclick="downloadWallpaper('${wallpaper.id}', '${wallpaper.title}')">
                    下载壁纸
                </button>
            </div>
        `;

        detailModal.style.display = 'block';
    } catch (error) {
        console.error('获取壁纸详情失败:', error);
        alert('获取壁纸详情失败');
    }
}

// 下载壁纸
function downloadWallpaper(id, title) {
    const link = document.createElement('a');
    link.href = `${API_BASE}/download/${id}`;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 处理上传
async function handleUpload(e) {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '上传中...';

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('上传成功！');
            uploadModal.style.display = 'none';
            uploadForm.reset();
            loadWallpapers(true); // 重新加载壁纸列表
        } else {
            alert(result.error || '上传失败');
        }
    } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请重试');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = '上传';
}

// 处理搜索
function handleSearch() {
    loadWallpapers(true);
}

// 加载更多壁纸
function loadMoreWallpapers() {
    if (hasMore && !isLoading) {
        currentPage++;
        loadWallpapers();
    }
}

// 更新加载更多按钮状态
function updateLoadMoreButton() {
    if (hasMore) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = isLoading ? '加载中...' : '加载更多';
        loadMoreBtn.disabled = isLoading;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// 工具函数
function getCategoryName(category) {
    const categories = {
        'nature': '自然风景',
        'abstract': '抽象艺术',
        'anime': '动漫',
        'tech': '科技',
        'other': '其他'
    };
    return categories[category] || '其他';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
