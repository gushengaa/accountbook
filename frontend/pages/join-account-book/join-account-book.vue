<template>
  <view class="join-container">
    <view class="join-header">
      <text class="join-title">加入集体账本</text>
      <text class="join-subtitle">输入分享码加入账本</text>
    </view>
    
    <view class="join-content">
      <view class="input-section">
        <text class="input-label">分享码</text>
        <input 
          class="share-code-input" 
          v-model="shareCode"
          placeholder="请输入6位分享码"
          :focus="true"
          maxlength="6"
          type="text"
        />
      </view>
      
      <button 
        class="join-btn" 
        @click="joinAccountBook"
        :loading="joining"
        :disabled="!shareCode || shareCode.length !== 6"
      >
        {{ joining ? '加入中...' : '加入账本' }}
      </button>
      
      <view class="tips-section">
        <text class="tips-text">💡 提示：分享码由账本创建者提供</text>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      shareCode: '',
      joining: false
    };
  },
  onLoad(options) {
    // 如果URL中有分享码参数，自动填充
    if (options.shareCode) {
      this.shareCode = options.shareCode;
    }
  },
  methods: {
    async joinAccountBook() {
      if (!this.shareCode || this.shareCode.length !== 6) {
        uni.showToast({
          title: '请输入6位分享码',
          icon: 'none'
        });
        return;
      }
      
      this.joining = true;
      
      try {
        const result = await api.sharedAccountBooks.join({
          shareCode: this.shareCode
        });
        
        uni.showToast({
          title: '加入成功',
          icon: 'success'
        });
        
        // 延迟跳转到账本详情页
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${result.id}&type=1`
          });
        }, 1500);
        
      } catch (error) {
        console.error('加入账本失败', error);
        uni.showToast({
          title: error.message || '加入失败，请检查分享码是否正确',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.joining = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.join-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.join-header {
  text-align: center;
  margin-bottom: 80rpx;
  
  .join-title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
  }
  
  .join-subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.join-content {
  width: 100%;
  max-width: 600rpx;
  
  .input-section {
    margin-bottom: 48rpx;
    
    .input-label {
      display: block;
      font-size: 28rpx;
      color: #FFFFFF;
      margin-bottom: 16rpx;
      font-weight: 500;
    }
    
    .share-code-input {
      width: 100%;
      height: 96rpx;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16rpx;
      padding: 0 32rpx;
      font-size: 36rpx;
      font-weight: bold;
      letter-spacing: 8rpx;
      text-align: center;
      box-sizing: border-box;
    }
  }
  
  .join-btn {
    width: 100%;
    height: 96rpx;
    background: #FFFFFF;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    border: none;
    
    text {
      font-size: 32rpx;
      font-weight: 500;
      color: #F5A623;
    }
    
    &[disabled] {
      opacity: 0.6;
    }
  }
  
  .tips-section {
    text-align: center;
    
    .tips-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>
