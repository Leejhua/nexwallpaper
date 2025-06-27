// 临时添加壁纸详情API
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('wallpapers.db');

// 获取单个壁纸详情
app.get('/api/wallpapers/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(
        'SELECT * FROM wallpapers WHERE id = ? AND status = "approved"',
        [id],
        (err, wallpaper) => {
            if (err) {
                console.error('获取壁纸详情失败:', err);
                return res.status(500).json({ error: '获取数据失败' });
            }
            
            if (!wallpaper) {
                return res.status(404).json({ error: '壁纸不存在' });
            }
            
            res.json(wallpaper);
        }
    );
});

// 壁纸下载计数
app.post('/api/wallpapers/:id/download', (req, res) => {
    const { id } = req.params;
    
    db.run(
        'UPDATE wallpapers SET downloads = downloads + 1 WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                console.error('更新下载计数失败:', err);
                return res.status(500).json({ error: '更新失败' });
            }
            
            res.json({ success: true, changes: this.changes });
        }
    );
});

module.exports = { app, db };
