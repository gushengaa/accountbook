#!/bin/bash
# 安装 Nginx 配置并申请 SSL 证书
# 用法：sudo bash deploy/install-nginx.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx/planor.cn.conf"
CONF_DST="/etc/nginx/sites-available/planor.cn"

if [ ! -f "$CONF_SRC" ]; then
  echo "错误：找不到 $CONF_SRC"
  exit 1
fi

echo "==> 安装 Nginx 站点配置..."
cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/planor.cn

# 移除默认站点（若存在）
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo ""
echo "==> Nginx 已配置 HTTP 反代"
echo "    测试：curl http://127.0.0.1/accountbook/swagger/index.html"
echo ""
echo "下一步申请 HTTPS 证书（需确保 www.planor.cn 已解析到本机 124.222.233.110）："
echo "  sudo certbot --nginx -d www.planor.cn -d planor.cn"
echo ""

read -r -p "是否现在申请 SSL 证书？(y/N) " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  certbot --nginx -d www.planor.cn -d planor.cn
  echo "证书申请完成，Certbot 会自动续期"
fi
