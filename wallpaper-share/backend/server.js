const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 创建上传目录
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 数据库初始化
const db = new sqlite3.Database('wallpapers.db');

// 创建壁纸表
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wallpapers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT,
        filename TEXT NOT NULL,
        original_name TEXT,
        width INTEGER,
        height INTEGER,
        size INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        downloads INTEGER DEFAULT 0
    )`);
});

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只支持 JPEG, PNG, WEBP 格式的图片'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    }
});

// API路由

// 上传壁纸
app.post('/api/upload', upload.single('wallpaper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }

        const { title, category } = req.body;
        const id = uuidv4();
        const filePath = path.join(uploadDir, req.file.filename);

        // 获取图片信息
        const metadata = await sharp(filePath).metadata();

        // 保存到数据库
        db.run(
            `INSERT INTO wallpapers (id, title, category, filename, original_name, width, height, size) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title || '未命名', category || 'other', req.file.filename, 
             req.file.originalname, metadata.width, metadata.height, req.file.size],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: '保存失败' });
                }
                res.json({ 
                    message: '上传成功', 
                    id: id,
                    filename: req.file.filename 
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '上传处理失败' });
    }
});

// 获取壁纸列表
app.get('/api/wallpapers', (req, res) => {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM wallpapers WHERE 1=1';
    let params = [];

    if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
    }

    if (search) {
        query += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }

    query += ' ORDER BY upload_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '获取数据失败' });
        }
        res.json(rows);
    });
});

// 获取单个壁纸详情
app.get('/api/wallpapers/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM wallpapers WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '获取数据失败' });
        }
        if (!row) {
            return res.status(404).json({ error: '壁纸不存在' });
        }
        res.json(row);
    });
});

// 下载壁纸（增加下载计数）
app.get('/api/download/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM wallpapers WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: '壁纸不存在' });
        }

        // 增加下载计数
        db.run('UPDATE wallpapers SET downloads = downloads + 1 WHERE id = ?', [id]);

        const filePath = path.join(__dirname, uploadDir, row.filename);
        res.download(filePath, row.original_name);
    });
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
    db.all('SELECT DISTINCT category, COUNT(*) as count FROM wallpapers GROUP BY category', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '获取分类失败' });
        }
        res.json(rows);
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
