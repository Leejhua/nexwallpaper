# WSL2 端口转发设置脚本
# 以管理员身份运行此脚本

# 获取 WSL2 的 IP 地址
$wslIP = (wsl hostname -I).Trim()
Write-Host "WSL2 IP 地址: $wslIP"

# 获取 Windows 主机的 IP 地址
$windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
Write-Host "Windows 主机 IP 地址: $windowsIP"

# 删除现有的端口转发规则（如果存在）
Write-Host "清理现有规则..."
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=3002 listenaddress=0.0.0.0

# 添加端口转发规则
Write-Host "设置端口转发..."
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIP
netsh interface portproxy add v4tov4 listenport=3002 listenaddress=0.0.0.0 connectport=3002 connectaddress=$wslIP

# 配置防火墙规则
Write-Host "配置防火墙规则..."
New-NetFirewallRule -DisplayName "WSL2 Dev Server 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "WSL2 Dev Server 3002" -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# 显示当前端口转发规则
Write-Host "当前端口转发规则:"
netsh interface portproxy show v4tov4

Write-Host ""
Write-Host "设置完成！"
Write-Host "现在你可以在手机上使用以下地址访问:"
Write-Host "http://$windowsIP`:3001"
Write-Host ""
Write-Host "如果仍然无法访问，请检查:"
Write-Host "1. 手机和电脑在同一个 WiFi 网络"
Write-Host "2. Windows 防火墙设置"
Write-Host "3. 路由器是否阻止设备间通信" 