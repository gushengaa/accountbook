<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card" @click="goToEdit">
      <image 
        class="avatar" 
        :src="userInfo?.avatarUrl || '/static/default-avatar.png'"
        mode="aspectFill"
      />
      <text class="nickname">{{ userInfo?.nickName || (isGuestMode ? '访客' : '未设置昵称') }}</text>
      <text v-if="userInfo?.phoneNumber" class="phone">{{ userInfo.phoneNumber }}</text>
      <view class="edit-hint" v-if="!isGuestMode">
        <app-icon class="edit-icon" name="compose" :size="14" color="rgba(255,255,255,0.95)" />
        <text class="edit-text">点击编辑资料</text>
      </view>
      <view class="guest-hint" v-else>
        <text class="guest-text">访客模式 - 可浏览各页面，记账需微信登录</text>
      </view>
    </view>
    
    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" v-if="isAdmin" @click="goToCurrencySettings">
        <view class="menu-icon"><app-icon name="wallet" :size="22" color="#F5A623" /></view>
        <text class="menu-text">币种设置</text>
        <text class="admin-badge">管理员</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item admin-item" v-if="isAdmin" @click="goToCategoryAdmin">
        <view class="menu-icon"><app-icon name="list" :size="22" color="#F5A623" /></view>
        <text class="menu-text">交易类别管理</text>
        <text class="admin-badge">管理员</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item admin-item" v-if="isAdmin" @click="goToPaymentMethodAdmin">
        <view class="menu-icon"><app-icon name="wallet" :size="22" color="#F5A623" /></view>
        <text class="menu-text">支付方式管理</text>
        <text class="admin-badge">管理员</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item admin-item" v-if="isAdmin" @click="goToBookPurposeCategoryAdmin">
        <view class="menu-icon"><app-icon name="link" :size="22" color="#F5A623" /></view>
        <text class="menu-text">用途分类关联</text>
        <text class="admin-badge">管理员</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item" @click="goToFeedback">
        <view class="menu-icon"><app-icon name="chatbubble" :size="22" color="#F5A623" /></view>
        <text class="menu-text">投诉建议</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item admin-item" v-if="isAdmin" @click="goToFeedbackAdmin">
        <view class="menu-icon"><app-icon name="gear" :size="22" color="#F5A623" /></view>
        <text class="menu-text">反馈管理</text>
        <text class="admin-badge">管理员</text>
        <view class="menu-arrow"></view>
      </view>
      <view class="menu-item" @click="showAbout">
        <view class="menu-icon"><app-icon name="info" :size="22" color="#F5A623" /></view>
        <text class="menu-text">关于我们</text>
        <view class="menu-arrow"></view>
      </view>
      <button class="menu-item share-btn" open-type="share">
        <view class="menu-icon"><app-icon name="paperplane" :size="22" color="#F5A623" /></view>
        <text class="menu-text">分享好友</text>
        <view class="menu-arrow"></view>
      </button>
    </view>
    
    <!-- 退出登录/登录按钮 -->
    <view class="logout-section">
      <button v-if="!isGuestMode" class="logout-btn" @click="handleLogout">退出登录</button>
      <button v-else class="login-btn" @click="openLoginSheet">立即登录</button>
    </view>

    <app-tab-bar :current="3" />

    <!-- 登录确认底部弹窗 -->
    <view v-if="showLoginSheet" class="login-sheet-mask" @click="closeLoginSheet">
      <view class="login-sheet-panel" @click.stop>
        <view class="login-sheet-title">微信授权登录</view>
        <text class="login-sheet-desc">授权后可同步账本与交易数据，享受完整记账功能</text>
        <text class="login-sheet-tip">授权登录即表示同意《用户协议》和《隐私政策》</text>
        <view class="login-sheet-actions">
          <button class="login-sheet-btn secondary" @click="closeLoginSheet">我再想想</button>
          <button class="login-sheet-btn primary" :loading="loginLoading" @click="handleWeChatLogin">授权登录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { api } from '@/utils/api';
import { hideNativeTabBar } from '@/utils/tabBar';
import { requireWechatLogin } from '@/utils/auth';

export default {
  data() {
    return {
      isAdmin: false,
      showLoginSheet: false,
      loginLoading: false
    };
  },
  computed: {
    ...mapState(['userInfo', 'isGuestMode'])
  },
  onShow() {
    hideNativeTabBar();
    this.checkAdmin();
    this.refreshUserInfo();
  },
  // 微信分享功能
  onShareAppMessage() {
    return {
      title: '乌鸦爱记账 - 简单好用的记账工具',
      path: '/pages/index/index',
      imageUrl: '/static/share-image.png' // 可选：分享图片
    };
  },
  methods: {
    ...mapActions(['login', 'logout']),
    
    goToEdit() {
      if (!requireWechatLogin()) {
        return;
      }
      
      uni.navigateTo({
        url: '/pages/profile/edit'
      });
    },
    
    goToAccountBooks() {
      uni.navigateTo({
        url: '/pages/account-books/account-books'
      });
    },
    
    goToSharedAccountBooks() {
      // 已整合到账本页面
      uni.navigateTo({
        url: '/pages/account-books/account-books'
      });
    },
    
    goToStatistics() {
      uni.switchTab({
        url: '/pages/statistics/statistics'
      });
    },
    
    goToCurrencySettings() {
      uni.navigateTo({
        url: '/pages/currency-settings/currency-settings'
      });
    },

    goToCategoryAdmin() {
      uni.navigateTo({
        url: '/pages/category-admin/category-admin'
      });
    },

    goToPaymentMethodAdmin() {
      uni.navigateTo({
        url: '/pages/payment-method-admin/payment-method-admin'
      });
    },

    goToBookPurposeCategoryAdmin() {
      uni.navigateTo({
        url: '/pages/book-purpose-category-admin/book-purpose-category-admin'
      });
    },
    
    goToFeedback() {
      uni.navigateTo({
        url: '/pages/feedback/feedback'
      });
    },
    
    goToFeedbackAdmin() {
      uni.navigateTo({
        url: '/pages/feedback-admin/feedback-admin'
      });
    },
    
    async checkAdmin() {
      if (this.isGuestMode || !this.$store.state.token) {
        this.isAdmin = false;
        return;
      }
      try {
        const result = await api.feedbacks.checkAdmin();
        this.isAdmin = result === true;
      } catch (error) {
        console.error('检查管理员权限失败:', error);
        this.isAdmin = false;
      }
    },

    async refreshUserInfo() {
      if (this.isGuestMode || !this.$store.state.token) {
        return;
      }
      try {
        const user = await api.auth.getUserInfo();
        if (!user) return;
        this.$store.commit('SET_USER_INFO', {
          id: user.id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber
        });
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      }
    },
    
    showAbout() {
      uni.showModal({
        title: '关于我们',
        content: '乌鸦爱记账 v1.0.0\n\n一款简单易用的记账工具，帮助您记录生活的每一笔。',
        showCancel: false
      });
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            this.logout();
          }
        }
      });
    },
    
    openLoginSheet() {
      this.showLoginSheet = true;
    },

    closeLoginSheet() {
      if (this.loginLoading) return;
      this.showLoginSheet = false;
    },

    async handleWeChatLogin() {
      if (this.loginLoading) return;

      this.loginLoading = true;
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          });
        });

        if (!loginRes.code) {
          uni.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }

        const result = await api.auth.wechatLogin({
          code: loginRes.code,
          userInfo: null
        });

        await this.login({
          token: result.token,
          userInfo: result.userInfo
        });
        this.$store.dispatch('setGuestMode', false);
        this.showLoginSheet = false;
        await this.checkAdmin();
        uni.showToast({ title: '登录成功', icon: 'success' });
      } catch (error) {
        console.error('登录失败', error);
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loginLoading = false;
      }
    },
    
    goToLogin() {
      this.openLoginSheet();
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 24rpx;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: #F5F5F5;
  min-height: 100vh;
}

  .user-card {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
  position: relative;
  cursor: pointer;
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 80rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    margin-bottom: 24rpx;
  }
  
  .nickname {
    font-size: 36rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
  }
  
  .phone {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 16rpx;
  }
  
  .edit-hint {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 8rpx;
    padding: 8rpx 16rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20rpx;
    
    .edit-icon {
      display: flex;
      align-items: center;
    }
    
    .edit-text {
      font-size: 22rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .guest-hint {
    margin-top: 16rpx;
    text-align: center;
    
    .guest-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.menu-list {
  background: #FFFFFF;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    &:last-child {
      border-bottom: none;
    }
    
    // 分享按钮样式重置
    &.share-btn {
      background: transparent;
      padding: 32rpx;
      margin: 0;
      border: none;
      border-radius: 0;
      line-height: normal;
      font-size: inherit;
      text-align: left;
      border-bottom: 1rpx solid #F5F5F5;
      
      &::after {
        border: none;
      }
    }
    
    // 管理员菜单项
    &.admin-item {
      background: rgba(255, 107, 107, 0.05);
      
      .admin-badge {
        font-size: 20rpx;
        color: #FFFFFF;
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        margin-left: auto;
        margin-right: 16rpx;
      }
    }
    
    .menu-icon {
      width: 40rpx;
      margin-right: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .menu-text {
      flex: 1;
      font-size: 28rpx;
      color: #333333;
    }
    
    .menu-arrow {
      font-size: 28rpx;
      color: #CCCCCC;
      position: relative;
      width: 20rpx;
      height: 28rpx;
      
      &::after {
        content: '>';
        position: absolute;
        right: 0;
      }
    }
  }
}

.logout-section {
  padding: 32rpx 0;
  
  .logout-btn {
    width: 100%;
    height: 96rpx;
    background: #F5F5F5;
    color: #F5A623;
    border-radius: 48rpx;
    font-size: 28rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .login-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    border-radius: 48rpx;
    font-size: 28rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.login-sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
}

.login-sheet-panel {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.login-sheet-title {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 16rpx;
}

.login-sheet-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.login-sheet-tip {
  display: block;
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 32rpx;
}

.login-sheet-actions {
  display: flex;
  gap: 24rpx;
}

.login-sheet-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  border: none;
  margin: 0;
  padding: 0;

  &::after {
    border: none;
  }

  &.secondary {
    background: #F5F5F5;
    color: #666666;
  }

  &.primary {
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    font-weight: 600;
  }
}
</style>

