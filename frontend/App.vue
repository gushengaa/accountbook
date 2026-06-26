<script>
import store from './store';
import { loadIconFont } from './utils/loadIconFont';

export default {
  globalData: {
    iconFontReady: false
  },
  onLaunch: function() {
    console.log('App Launch');
    loadIconFont()
      .then(() => console.log('iconfont loaded'))
      .catch((err) => console.error('iconfont load failed', err));
    
    // 隐藏原生 tabBar，使用自定义底部导航
    uni.hideTabBar({ animation: false, fail: () => {} });
    
    // 未登录用户默认进入访客浏览模式，直接进入首页
    const token = uni.getStorageSync('token');
    if (!token) {
      store.dispatch('setGuestMode', true);
    }
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  }
}
</script>

<style lang="scss">
/* 引入全局样式 */
@import './uni.scss';

/* 小程序用 loadIconFont 内嵌 base64；H5 用 assets 下 ttf */
/* #ifndef MP-WEIXIN */
@font-face {
  font-family: 'iconfont';
  src: url('@/assets/iconfont/iconfont.ttf') format('truetype');
  font-display: swap;
}
/* #endif */

/* 全局样式 */
page {
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

/* 通用容器 */
.container {
  padding: 24rpx;
}

/* 卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  color: #FFFFFF;
  border-radius: 50rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  border: none;
}

.btn-secondary {
  background: #F5F5F5;
  color: #333333;
  border-radius: 50rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  border: none;
}

/* 输入框样式 */
.input {
  background: #F5F5F5;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  border: none;
}

/* 文字样式 */
.text-primary {
  color: #F5A623;
}

.text-secondary {
  color: #999999;
}

.text-success {
  color: #5CB85C;
}

.text-error {
  color: #E85D4B;
}

/* 布局 */
.flex {
  display: flex;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 间距 */
.mt-sm { margin-top: 16rpx; }
.mt-base { margin-top: 24rpx; }
.mt-lg { margin-top: 32rpx; }
.mb-sm { margin-bottom: 16rpx; }
.mb-base { margin-bottom: 24rpx; }
.mb-lg { margin-bottom: 32rpx; }
</style>
