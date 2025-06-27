const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

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
        downloads INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        review_date DATETIME,
        reviewer TEXT,
        review_note TEXT,
        content_score REAL DEFAULT 0.0
    )`);
    
    // 创建管理员表
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 插入默认管理员账户 (用户名: admin, 密码: admin123)
    const bcrypt = require('bcrypt');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, 
        ['admin', defaultPassword]);
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

// 中间件：验证管理员token
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: '需要管理员权限' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: '无效的token' });
    }
};

// 增强的内容安全检查函数
function checkContentSafety(title, category, filename, originalName) {
    // NSFW关键词库（可扩展）
    const nsfwKeywords = [
        // 中文敏感词
        '色情', '裸体', '成人', '性感', '诱惑', '暴露', '私密', '激情', '床戏', '内衣',
        '比基尼', '泳装', '透视', '低胸', '短裙', '丝袜', '制服', '角色扮演',
        '暴力', '血腥', '恐怖', '杀戮', '死亡', '尸体', '战争', '武器',
        '政治', '敏感', '反动', '分裂', '恐怖主义', '极端',
        
        // 英文敏感词
        'nsfw', 'porn', 'sex', 'nude', 'naked', 'adult', 'xxx', 'erotic',
        'sexy', 'bikini', 'lingerie', 'underwear', 'breast', 'ass', 'butt',
        'violence', 'blood', 'gore', 'kill', 'death', 'weapon', 'gun',
        'political', 'terrorism', 'extreme',
        
        // 数字代码
        '18+', 'r18', 'r-18', '成人向', 'adult-only'
    ];
    
    // 可疑文件名模式
    const suspiciousPatterns = [
        /\b(sex|porn|nude|xxx|nsfw)\b/i,
        /\b(r18|r-18|18\+)\b/i,
        /\b(adult|erotic|sexy)\b/i,
        /\b(血腥|暴力|色情)\b/i
    ];
    
    const content = (title + ' ' + category + ' ' + filename + ' ' + originalName).toLowerCase();
    let riskScore = 0;
    let riskReasons = [];
    
    // 1. 关键词检测
    for (const keyword of nsfwKeywords) {
        if (content.includes(keyword.toLowerCase())) {
            riskScore += 0.3;
            riskReasons.push(`包含敏感词汇: ${keyword}`);
        }
    }
    
    // 2. 文件名模式检测
    const fullFilename = filename + ' ' + originalName;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullFilename)) {
            riskScore += 0.4;
            riskReasons.push('文件名包含可疑模式');
        }
    }
    
    // 3. 标题长度和特征检测
    if (title && title.length > 50) {
        riskScore += 0.1; // 过长标题可能是垃圾内容
    }
    
    // 4. 特殊字符检测
    const specialCharCount = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []).length;
    if (specialCharCount > 10) {
        riskScore += 0.2;
        riskReasons.push('包含过多特殊字符');
    }
    
    // 5. 重复字符检测
    const repeatedChars = content.match(/(.)\1{4,}/g);
    if (repeatedChars && repeatedChars.length > 0) {
        riskScore += 0.1;
        riskReasons.push('包含异常重复字符');
    }
    
    // 决策逻辑
    let status = 'approved';
    let reason = '内容安全';
    
    if (riskScore >= 0.7) {
        status = 'rejected';
        reason = '高风险内容: ' + riskReasons.join(', ');
    } else if (riskScore >= 0.3) {
        status = 'pending';
        reason = '中等风险内容，需要进一步检查: ' + riskReasons.join(', ');
    }
    
    return {
        safe: status === 'approved',
        status: status,
        score: Math.min(riskScore, 1.0),
        reason: reason,
        riskFactors: riskReasons
    };
}

// 简单的图片文件检测（基于文件大小和类型）
function checkImageSafety(file) {
    let riskScore = 0;
    let riskReasons = [];
    
    // 1. 文件大小检测
    if (file.size < 10000) { // 小于10KB可能是低质量图片
        riskScore += 0.1;
        riskReasons.push('文件过小');
    } else if (file.size > 50 * 1024 * 1024) { // 大于50MB可能是异常文件
        riskScore += 0.2;
        riskReasons.push('文件过大');
    }
    
    // 2. 文件类型检测
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        riskScore += 0.5;
        riskReasons.push('不支持的文件类型');
    }
    
    // 3. 文件扩展名与MIME类型一致性检查
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    };
    
    if (mimeMap[ext] && mimeMap[ext] !== file.mimetype) {
        riskScore += 0.3;
        riskReasons.push('文件扩展名与类型不匹配');
    }
    
    return {
        score: riskScore,
        reasons: riskReasons
    };
}

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
            if (err) {
                return res.status(500).json({ error: '数据库错误' });
            }
            
            if (!admin || !bcrypt.compareSync(password, admin.password)) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }
            
            const token = jwt.sign(
                { id: admin.id, username: admin.username },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                message: '登录成功',
                token,
                admin: { id: admin.id, username: admin.username }
            });
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 获取待审核的壁纸
app.get('/api/admin/pending', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    db.all(
        `SELECT * FROM wallpapers WHERE status = 'pending' 
         ORDER BY upload_date DESC LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, wallpapers) => {
            if (err) {
                console.error('获取待审核壁纸失败:', err);
                return res.status(500).json({ error: '获取数据失败' });
            }
            res.json(wallpapers);
        }
    );
});

// 审核壁纸
app.post('/api/admin/review/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body; // status: 'approved' 或 'rejected'
    const reviewer = req.admin.username;
    
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: '无效的审核状态' });
    }
    
    db.run(
        `UPDATE wallpapers SET status = ?, review_date = CURRENT_TIMESTAMP, 
         reviewer = ?, review_note = ? WHERE id = ?`,
        [status, reviewer, note || '', id],
        function(err) {
            if (err) {
                console.error('审核失败:', err);
                return res.status(500).json({ error: '审核失败' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: '壁纸不存在' });
            }
            
            res.json({ 
                message: `壁纸已${status === 'approved' ? '通过' : '拒绝'}审核`,
                status 
            });
        }
    );
});

// 获取审核统计
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    const queries = [
        "SELECT COUNT(*) as pending FROM wallpapers WHERE status = 'pending'",
        "SELECT COUNT(*) as approved FROM wallpapers WHERE status = 'approved'",
        "SELECT COUNT(*) as rejected FROM wallpapers WHERE status = 'rejected'",
        "SELECT COUNT(*) as total FROM wallpapers"
    ];
    
    Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
            db.get(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        })
    )).then(results => {
        res.json({
            pending: results[0].pending,
            approved: results[1].approved,
            rejected: results[2].rejected,
            total: results[3].total
        });
    }).catch(err => {
        console.error('获取统计失败:', err);
        res.status(500).json({ error: '获取统计失败' });
    });
});

// 上传壁纸
app.post('/api/upload', upload.single('wallpaper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }

        const { title, category } = req.body;
        const id = uuidv4();

        // 简化版本：使用默认尺寸信息
        const width = 1920;
        const height = 1080;

        // 综合内容安全检查
        const contentCheck = checkContentSafety(
            title || '未命名', 
            category || 'other', 
            req.file.filename, 
            req.file.originalname
        );
        
        const imageCheck = checkImageSafety(req.file);
        
        // 综合评分
        const totalRiskScore = contentCheck.score + imageCheck.score;
        let finalStatus = contentCheck.status;
        let finalReason = contentCheck.reason;
        
        // 如果图片检查也有风险，调整状态
        if (imageCheck.score > 0.3) {
            if (finalStatus === 'approved') {
                finalStatus = 'pending';
            }
            finalReason += '; 图片检查: ' + imageCheck.reasons.join(', ');
        }
        
        // 最终决策：完全自动化
        if (totalRiskScore >= 0.7) {
            finalStatus = 'rejected';
        } else if (totalRiskScore >= 0.2) {
            // 中等风险也自动通过，但记录风险信息
            finalStatus = 'approved';
            finalReason = '自动通过 (中等风险): ' + finalReason;
        } else {
            finalStatus = 'approved';
            finalReason = '自动通过 (低风险)';
        }

        // 保存到数据库
        db.run(
            `INSERT INTO wallpapers (id, title, category, filename, original_name, width, height, size, status, content_score, review_note) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title || '未命名', category || 'other', req.file.filename, 
             req.file.originalname, width, height, req.file.size, finalStatus, totalRiskScore, finalReason],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: '保存失败' });
                }

                let message = '壁纸上传成功！';
                if (finalStatus === 'approved') {
                    message += ' 已通过自动审核。';
                } else {
                    message += ' 内容不符合社区规范，已被自动拒绝。';
                    
                    // 删除被拒绝的文件
                    const filePath = path.join(__dirname, uploadDir, req.file.filename);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('删除文件失败:', unlinkErr);
                    });
                }

                res.json({ 
                    message,
                    id,
                    status: finalStatus,
                    reason: finalReason,
                    riskScore: totalRiskScore,
                    filename: finalStatus === 'approved' ? req.file.filename : null
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

    let query = "SELECT * FROM wallpapers WHERE status = 'approved'";
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
    db.all("SELECT DISTINCT category, COUNT(*) as count FROM wallpapers WHERE status = 'approved' GROUP BY category", (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '获取分类失败' });
        }
        res.json(rows);
    });
});

// 获取审核统计（用于监控）
app.get('/api/stats', (req, res) => {
    const queries = [
        "SELECT COUNT(*) as approved FROM wallpapers WHERE status = 'approved'",
        "SELECT COUNT(*) as rejected FROM wallpapers WHERE status = 'rejected'",
        "SELECT COUNT(*) as total FROM wallpapers",
        "SELECT AVG(content_score) as avgRiskScore FROM wallpapers"
    ];
    
    Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
            db.get(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        })
    )).then(results => {
        res.json({
            approved: results[0].approved,
            rejected: results[1].rejected,
            total: results[2].total,
            avgRiskScore: results[3].avgRiskScore || 0,
            approvalRate: results[2].total > 0 ? (results[0].approved / results[2].total * 100).toFixed(2) + '%' : '0%'
        });
    }).catch(err => {
        console.error('获取统计失败:', err);
        res.status(500).json({ error: '获取统计失败' });
    });
});

// 获取最近被拒绝的内容（用于监控和改进算法）
app.get('/api/rejected', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    db.all(
        `SELECT title, category, review_note, content_score, upload_date 
         FROM wallpapers WHERE status = 'rejected' 
         ORDER BY upload_date DESC LIMIT ?`,
        [limit],
        (err, wallpapers) => {
            if (err) {
                console.error('获取被拒绝内容失败:', err);
                return res.status(500).json({ error: '获取数据失败' });
            }
            res.json(wallpapers);
        }
    );
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
