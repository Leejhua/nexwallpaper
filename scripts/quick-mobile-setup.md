# 手机访问开发服务器设置指南

## 问题说明
WSL2 使用虚拟网络，外部设备（如手机）无法直接访问 WSL2 内部的服务。

## 解决方案

### 方法 1：自动设置（推荐）
1. 以**管理员身份**打开 PowerShell
2. 导航到项目目录：`cd C:\Users\你的用户名\...你的项目路径...\labubu-gallery-react`
3. 运行：`.\scripts\setup-mobile-access.ps1`

### 方法 2：手动设置

#### 步骤 1：获取 IP 地址
在 WSL2 终端中运行：
```bash
# 获取 WSL2 IP
hostname -I
# 结果例如：192.168.168.43

# 获取 Windows 主机网关 IP
cat /etc/resolv.conf | grep nameserver
# 结果例如：nameserver 192.168.160.1
```

在 Windows PowerShell（管理员）中运行：
```powershell
# 获取 Windows 主机的实际 WiFi IP
ipconfig | findstr "IPv4"
# 找到类似 192.168.1.xxx 的地址
```

#### 步骤 2：设置端口转发
在 Windows PowerShell（管理员）中运行：
```powershell
# 替换 WSL_IP 为你的 WSL2 IP 地址
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=WSL_IP
netsh interface portproxy add v4tov4 listenport=3002 listenaddress=0.0.0.0 connectport=3002 connectaddress=WSL_IP
```

#### 步骤 3：配置防火墙
```powershell
# 允许端口 3001 和 3002 通过防火墙
netsh advfirewall firewall add rule name="WSL2 Dev Server 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="WSL2 Dev Server 3002" dir=in action=allow protocol=TCP localport=3002
```

### 方法 3：使用 ngrok（临时方案）
```bash
# 安装 ngrok
npm install -g ngrok

# 创建隧道
ngrok http 3001
```

## 访问方式

### 使用端口转发后：
手机浏览器访问：`http://你的Windows主机IP:3001`

例如：`http://192.168.1.100:3001`

### 使用 ngrok：
使用 ngrok 提供的公网地址

## 故障排除

1. **确认服务器正在运行**：
   ```bash
   ss -tlnp | grep :3001
   ```

2. **检查端口转发规则**：
   ```powershell
   netsh interface portproxy show v4tov4
   ```

3. **清理端口转发规则**：
   ```powershell
   netsh interface portproxy delete v4tov4 listenport=3001
   netsh interface portproxy delete v4tov4 listenport=3002
   ```

4. **检查防火墙规则**：
   ```powershell
   netsh advfirewall firewall show rule name="WSL2 Dev Server 3001"
   ```

## 常见问题

- **手机仍然无法访问**：检查路由器设置，某些路由器默认阻止设备间通信
- **开发服务器重启后失效**：WSL2 的 IP 可能会变化，需要重新运行设置脚本
- **防火墙阻止**：确保 Windows 防火墙允许相应端口

## 重启后重新设置

由于 WSL2 重启后 IP 可能变化，建议：
1. 将设置脚本添加到 Windows 启动项
2. 或每次开发前运行一次设置脚本 