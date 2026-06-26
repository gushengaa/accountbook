/** 隐藏微信原生 tabBar，使用自定义底部导航 */
export function hideNativeTabBar() {
  uni.hideTabBar({
    animation: false,
    fail: () => {}
  });
}
