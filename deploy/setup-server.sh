#!/bin/bash
# 腾讯云 Ubuntu 服务器初始化脚本
# 适用：Ubuntu 22.04 / 24.04，IP 124.222.233.110
# 用法：sudo bash setup-server.sh

set -e

echo "==> 更新系统..."
apt update && apt upgrade -y

echo "==> 安装基础工具..."
apt install -y ca-certificates curl gnupg git ufw nginx certbot python3-certbot-nginx

echo "==> 配置时区..."
timedatectl set-timezone Asia/Shanghai

echo "==> 配置防火墙..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# 8080 仅本机 Nginx 反代使用，不对公网开放
ufw --force enable

echo "==> 安装 Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> 配置腾讯云 Docker 镜像加速..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl daemon-reload
systemctl enable docker
systemctl restart docker

echo "==> 创建部署目录..."
mkdir -p /opt/accountbook
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /opt/accountbook 2>/dev/null || true

echo ""
echo "============================================"
echo " 服务器初始化完成"
echo "============================================"
echo ""
echo "下一步："
echo "  1. 腾讯云控制台 → 安全组，放行 22、80、443"
echo "  2. 将代码上传到 /opt/accountbook"
echo "  3. cd /opt/accountbook && cp .env.example .env && nano .env"
echo "  4. bash deploy/deploy.sh          # 启动 API + PostgreSQL"
echo "  5. 若有旧库备份：bash deploy/restore-db.sh backups/xxx.sql.gz"
echo "  6. 配置 Nginx 与 SSL：sudo bash deploy/install-nginx.sh"
echo ""
