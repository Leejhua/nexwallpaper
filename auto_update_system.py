#!/usr/bin/env python3
"""
自动更新系统
定期检测URL状态并更新数据文件
"""

import os
import shutil
import json
from datetime import datetime, timedelta
from comprehensive_url_checker import ComprehensiveURLChecker

class AutoUpdateSystem:
    def __init__(self):
        self.backup_dir = "backups"
        self.log_file = "update_log.txt"
        self.config_file = "update_config.json"
        self.load_config()
    
    def load_config(self):
        """加载配置文件"""
        default_config = {
            "update_interval_hours": 24,  # 每24小时检查一次
            "backup_retention_days": 7,   # 保留7天的备份
            "min_success_rate": 90,       # 最低成功率阈值
            "auto_apply_updates": True,   # 自动应用更新
            "notification_email": None    # 通知邮箱
        }
        
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = {**default_config, **json.load(f)}
        else:
            self.config = default_config
            self.save_config()
    
    def save_config(self):
        """保存配置文件"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def log(self, message):
        """记录日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        
        print(log_entry.strip())
    
    def create_backup(self):
        """创建数据文件备份"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"complete_gallery_data_{timestamp}.js"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        if os.path.exists("complete_gallery_data.js"):
            shutil.copy2("complete_gallery_data.js", backup_path)
            self.log(f"✅ 创建备份: {backup_filename}")
            return backup_path
        else:
            self.log("⚠️  原数据文件不存在，跳过备份")
            return None
    
    def cleanup_old_backups(self):
        """清理过期备份"""
        if not os.path.exists(self.backup_dir):
            return
        
        cutoff_date = datetime.now() - timedelta(days=self.config["backup_retention_days"])
        
        for filename in os.listdir(self.backup_dir):
            if filename.startswith("complete_gallery_data_") and filename.endswith(".js"):
                file_path = os.path.join(self.backup_dir, filename)
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                
                if file_time < cutoff_date:
                    os.remove(file_path)
                    self.log(f"🗑️  删除过期备份: {filename}")
    
    def check_and_update(self):
        """检查URL状态并更新数据文件"""
        self.log("🚀 开始定期URL检测和更新")
        
        # 创建备份
        backup_path = self.create_backup()
        
        try:
            # 运行URL检测
            checker = ComprehensiveURLChecker()
            checker.check_all_urls()
            
            # 分析结果
            stats = checker.results['statistics']
            success_rate = (stats['working'] / stats['total']) * 100
            
            self.log(f"📊 检测完成: {stats['working']}/{stats['total']} ({success_rate:.1f}%)")
            
            # 检查是否需要更新
            if success_rate < self.config["min_success_rate"]:
                self.log(f"⚠️  成功率 {success_rate:.1f}% 低于阈值 {self.config['min_success_rate']}%")
                
                if self.config["auto_apply_updates"]:
                    # 自动应用更新
                    self.apply_update(checker)
                else:
                    self.log("🔄 需要手动确认更新")
                    self.generate_update_report(checker)
            else:
                self.log(f"✅ 成功率 {success_rate:.1f}% 正常，无需更新")
            
            # 保存检测报告
            checker.save_json_report()
            
        except Exception as e:
            self.log(f"❌ 检测过程出错: {str(e)}")
            
            # 如果有备份，恢复原文件
            if backup_path and os.path.exists(backup_path):
                shutil.copy2(backup_path, "complete_gallery_data.js")
                self.log("🔄 已恢复原数据文件")
        
        # 清理过期备份
        self.cleanup_old_backups()
    
    def apply_update(self, checker):
        """应用更新"""
        try:
            # 生成更新后的数据文件
            checker.generate_updated_data_file()
            
            # 替换原文件
            if os.path.exists("complete_gallery_data_updated.js"):
                shutil.move("complete_gallery_data_updated.js", "complete_gallery_data.js")
                self.log("✅ 已应用数据文件更新")
                
                # 生成更新报告
                self.generate_update_report(checker, applied=True)
            else:
                self.log("❌ 更新文件生成失败")
                
        except Exception as e:
            self.log(f"❌ 应用更新失败: {str(e)}")
    
    def generate_update_report(self, checker, applied=False):
        """生成更新报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"update_report_{timestamp}.md"
        
        stats = checker.results['statistics']
        
        report_content = f"""# 🔄 数据更新报告

## 📅 更新时间
{datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")}

## 📊 检测统计
- **总计**: {stats['total']} 个媒体文件
- **正常**: {stats['working']} 个 ({stats['working']/stats['total']*100:.1f}%)
- **失效**: {stats['broken']} 个 ({stats['broken']/stats['total']*100:.1f}%)

## 📂 按分类统计
"""
        
        for category, data in stats['by_category'].items():
            success_rate = data['working']/data['total']*100 if data['total'] > 0 else 0
            report_content += f"- **{category}**: {data['working']}/{data['total']} ({success_rate:.1f}%)\n"
        
        report_content += f"""
## 🌐 按来源统计
"""
        
        for source, data in stats['by_source'].items():
            success_rate = data['working']/data['total']*100 if data['total'] > 0 else 0
            report_content += f"- **{source}**: {data['working']}/{data['total']} ({success_rate:.1f}%)\n"
        
        if checker.results['broken_urls']:
            report_content += f"""
## ❌ 失效URL列表
"""
            for i, item in enumerate(checker.results['broken_urls'], 1):
                report_content += f"""
### {i}. {item['title']}
- **分类**: {item['category']}
- **来源**: {item['source']}
- **类型**: {item['type']}
- **URL**: `{item['url']}`
- **错误**: {item['error']}
"""
        
        report_content += f"""
## 🔧 更新状态
{'✅ 已自动应用更新' if applied else '⏳ 等待手动确认'}

## 📁 相关文件
- 备份文件: `backups/complete_gallery_data_*.js`
- 检测报告: `url_check_report.json`
- 更新日志: `update_log.txt`
"""
        
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        self.log(f"📝 已生成更新报告: {report_filename}")
    
    def run_once(self):
        """运行一次检测和更新"""
        self.check_and_update()
    
    def setup_cron_job(self):
        """设置定时任务"""
        cron_command = f"0 */{self.config['update_interval_hours']} * * * cd {os.getcwd()} && python3 auto_update_system.py"
        
        print("📅 设置定时任务:")
        print(f"   命令: {cron_command}")
        print("   请手动添加到crontab中:")
        print(f"   crontab -e")
        print(f"   添加行: {cron_command}")

def main():
    import sys
    
    updater = AutoUpdateSystem()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "setup":
            updater.setup_cron_job()
        elif sys.argv[1] == "config":
            print("📋 当前配置:")
            for key, value in updater.config.items():
                print(f"   {key}: {value}")
        else:
            print("用法: python3 auto_update_system.py [setup|config]")
    else:
        updater.run_once()

if __name__ == "__main__":
    main()
