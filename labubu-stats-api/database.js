const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'stats.db'), (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    const createStatsTable = `
      CREATE TABLE IF NOT EXISTS wallpaper_stats (
        id TEXT PRIMARY KEY,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createActionsTable = `
      CREATE TABLE IF NOT EXISTS user_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallpaper_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallpaper_id) REFERENCES wallpaper_stats (id)
      )
    `;

    this.db.run(createStatsTable, (err) => {
      if (err) {
        console.error('Error creating stats table:', err.message);
      } else {
        console.log('Stats table ready');
      }
    });

    this.db.run(createActionsTable, (err) => {
      if (err) {
        console.error('Error creating actions table:', err.message);
      } else {
        console.log('Actions table ready');
      }
    });
  }

  // 获取壁纸统计数据
  getStats(wallpaperId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM wallpaper_stats 
        WHERE id = ?
      `;
      
      this.db.get(query, [wallpaperId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {
            id: wallpaperId,
            view_count: 0,
            like_count: 0,
            download_count: 0
          });
        }
      });
    });
  }

  // 批量获取统计数据
  getBatchStats(wallpaperIds) {
    return new Promise((resolve, reject) => {
      if (!wallpaperIds || wallpaperIds.length === 0) {
        resolve({});
        return;
      }

      const placeholders = wallpaperIds.map(() => '?').join(',');
      const query = `
        SELECT * FROM wallpaper_stats 
        WHERE id IN (${placeholders})
      `;
      
      this.db.all(query, wallpaperIds, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const statsMap = {};
          rows.forEach(row => {
            statsMap[row.id] = row;
          });
          
          // 为没有记录的ID添加默认值
          wallpaperIds.forEach(id => {
            if (!statsMap[id]) {
              statsMap[id] = {
                id: id,
                view_count: 0,
                like_count: 0,
                download_count: 0
              };
            }
          });
          
          resolve(statsMap);
        }
      });
    });
  }

  // 记录用户操作
  recordAction(wallpaperId, actionType, ipAddress, userAgent) {
    return new Promise((resolve, reject) => {
      // 首先确保统计记录存在
      this.ensureStatsRecord(wallpaperId)
        .then(() => {
          // 更新统计数据
          return this.updateStats(wallpaperId, actionType);
        })
        .then(() => {
          // 记录用户操作
          const insertAction = `
            INSERT INTO user_actions (wallpaper_id, action_type, ip_address, user_agent)
            VALUES (?, ?, ?, ?)
          `;
          
          this.db.run(insertAction, [wallpaperId, actionType, ipAddress, userAgent], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true, actionId: this.lastID });
            }
          });
        })
        .catch(reject);
    });
  }

  // 确保统计记录存在
  ensureStatsRecord(wallpaperId) {
    return new Promise((resolve, reject) => {
      const insertOrIgnore = `
        INSERT OR IGNORE INTO wallpaper_stats (id, view_count, like_count, download_count)
        VALUES (?, 0, 0, 0)
      `;
      
      this.db.run(insertOrIgnore, [wallpaperId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 更新统计数据
  updateStats(wallpaperId, actionType) {
    return new Promise((resolve, reject) => {
      let updateQuery;
      
      switch (actionType) {
        case 'view':
          updateQuery = `
            UPDATE wallpaper_stats 
            SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          break;
        case 'like':
          updateQuery = `
            UPDATE wallpaper_stats 
            SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          break;
        case 'unlike':
          updateQuery = `
            UPDATE wallpaper_stats 
            SET like_count = MAX(0, like_count - 1), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          break;
        case 'download':
          updateQuery = `
            UPDATE wallpaper_stats 
            SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          break;
        default:
          reject(new Error('Invalid action type'));
          return;
      }
      
      this.db.run(updateQuery, [wallpaperId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取热门壁纸
  getPopularWallpapers(limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT *, (view_count * 1 + like_count * 3 + download_count * 2) as popularity_score
        FROM wallpaper_stats 
        ORDER BY popularity_score DESC, updated_at DESC
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = Database;
