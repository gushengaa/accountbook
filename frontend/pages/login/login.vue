<template>
  <view class="login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.jpg" mode="aspectFit"></image>
      <text class="title">乌鸦爱记账</text>
      <text class="subtitle">记录生活的每一笔</text>
    </view>
    
    <view class="login-content">
      <button 
        class="login-btn" 
        :loading="loading"
        @click="handleWeChatLogin"
      >
        <text class="btn-text">微信快速登录</text>
      </button>
      
      <button 
        class="guest-btn" 
        @click="enterGuestMode"
      >
        <text class="btn-text">访客浏览</text>
      </button>
      
      <view class="tips">
        <view class="agreement-label" @click="toggleAgreement">
          <view class="custom-checkbox" :class="{ 'checked': agreed }">
            <text class="checkmark" v-if="agreed">✓</text>
          </view>
          <text class="tips-text">我已阅读并同意</text>
          <text class="link-text" @click.stop="openUserAgreement">《用户协议》</text>
          <text class="tips-text">和</text>
          <text class="link-text" @click.stop="openPrivacyPolicy">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      loading: false,
      agreed: false
    };
  },
  methods: {
    ...mapActions(['login']),
    
    async handleWeChatLogin() {
      if (this.loading) return;
      
      // 检查是否同意用户协议和隐私政策
      if (!this.agreed) {
        uni.showToast({
          title: '请先同意用户协议和隐私政策',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.loading = true;
      
      try {
        // 获取微信登录 code
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          });
        });
        
        if (!loginRes.code) {
          uni.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          });
          return;
        }
        
        // 获取用户信息（可选）
        let userInfo = null;
        // 调用后端登录接口
        const result = await api.auth.wechatLogin({
          code: loginRes.code,
          userInfo: userInfo
        });
        console.log('登录', result);
        // 保存登录信息
        await this.login({
          token: result.token,
          userInfo: result.userInfo
        });
        
        // 清除体验模式标识
        this.$store.dispatch('setGuestMode', false);
        
        // 跳转到首页（使用 reLaunch 清除页面栈，从非 tabbar 页面跳转到 tabbar 页面）
        uni.reLaunch({
          url: '/pages/index/index'
        });
        
      } catch (error) {
        console.error('登录失败', error);
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    toggleAgreement() {
      this.agreed = !this.agreed;
    },
    
    openUserAgreement() {
      uni.navigateTo({
        url: '/pages/user-agreement/user-agreement'
      });
    },
    
    openPrivacyPolicy() {
      uni.navigateTo({
        url: '/pages/privacy-policy/privacy-policy'
      });
    },
    
    async enterGuestMode() {
      this.$store.dispatch('setGuestMode', true);
      uni.reLaunch({
        url: '/pages/index/index'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 120rpx;
  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 32rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.2);
	border: 2px solid #fff;
  }
  
  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

  .login-content {
  width: 100%;
  
  .login-btn {
    width: 100%;
    height: 96rpx;
    background: #FFFFFF;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    border: none;
    
    .btn-text {
      font-size: 32rpx;
      font-weight: 500;
      color: #F5A623;
    }
  }
  
  .guest-btn {
    width: 100%;
    height: 96rpx;
    background: transparent;
    border: 2rpx solid rgba(255, 255, 255, 0.8);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    
    .btn-text {
      font-size: 32rpx;
      font-weight: 500;
      color: #FFFFFF;
    }
  }
  
  .tips {
    text-align: center;
    
    .agreement-label {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      
      .custom-checkbox {
        width: 32rpx;
        height: 32rpx;
        border: 2px solid rgba(255, 255, 255, 0.7);
        border-radius: 4rpx;
        margin-right: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        transition: all 0.3s;
        
        &.checked {
          background: #F5A623;
          border-color: #F5A623;
        }
        
        .checkmark {
          color: #FFFFFF;
          font-size: 24rpx;
          font-weight: bold;
          line-height: 1;
        }
      }
    }
    
    .tips-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      margin-left: 8rpx;
    }
    
    .link-text {
      font-size: 24rpx;
      color: #FFFFFF;
      text-decoration: underline;
      margin: 0 4rpx;
    }
  }
}
</style>

