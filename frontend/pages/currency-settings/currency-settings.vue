<template>
  <view class="currency-settings-container">
    <view class="header">
      <text class="title">币种汇率设置</text>
      <text class="subtitle">设置各币种兑人民币的汇率</text>
    </view>
    
    <!-- 加载中 -->
    <view class="loading-section" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 币种列表 -->
    <view class="currency-list" v-else-if="currencyRates.length > 0">
      <view 
        v-for="rate in currencyRates" 
        :key="rate.currency"
        class="currency-item"
        :class="{ disabled: !rate.isEnabled }"
      >
        <view class="currency-info">
          <view class="currency-header">
            <text class="currency-symbol">{{ rate.currencySymbol }}</text>
            <text class="currency-name">{{ rate.currencyName }}</text>
            <text class="currency-code">{{ rate.currencyCode }}</text>
          </view>
          <view class="rate-row">
            <text class="rate-label">1 {{ rate.currencyCode }} =</text>
            <input 
              type="digit"
              class="rate-input"
              :value="rate.rate"
              :disabled="rate.currency === 0"
              @blur="onRateChange(rate, $event)"
              placeholder="请输入汇率"
            />
            <text class="rate-unit">CNY</text>
          </view>
        </view>
        <view class="currency-toggle">
          <switch 
            :checked="rate.isEnabled"
            :disabled="rate.currency === 0"
            @change="onToggleChange(rate, $event)"
            color="#F7B84D"
          />
        </view>
      </view>
    </view>
    

    
    <!-- 保存按钮 -->
    <view class="save-section">
      <button class="save-btn" :loading="saving" @click="saveSettings">
        保存设置
      </button>
    </view>
    
    <!-- 提示信息 -->
    <view class="tips-section">
      <text class="tips-title">说明</text>
      <text class="tips-item">• 汇率表示 1 单位外币兑换的人民币金额</text>
      <text class="tips-item">• 人民币汇率固定为 1，无法修改</text>
      <text class="tips-item">• 关闭的币种将不会在记账时显示</text>
      <text class="tips-item">• 默认汇率仅供参考，请根据实际情况调整</text>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      currencyRates: [],
      loading: false,
      saving: false,
      debugInfo: ''
    };
  },
  
  onLoad() {
    this.loadCurrencyRates();
  },
  
  methods: {
    async loadCurrencyRates() {
      this.loading = true;
      this.debugInfo = '开始加载...';
      try {
        const res = await api.currencyRates.getAll();

        
        this.debugInfo = `响应类型: ${typeof res}, 是数组: ${Array.isArray(res)}, 内容: ${JSON.stringify(res).substring(0, 200)}`;
        
        if (Array.isArray(res)) {
          this.currencyRates = res;
        } else if (res && Array.isArray(res.data)) {
          this.currencyRates = res.data;
        } else if (res && typeof res === 'object') {
          // 尝试转换为数组
          this.currencyRates = Object.values(res);
        } else {
          this.currencyRates = [];
        }
        
        
        if (this.currencyRates.length === 0) {
          this.debugInfo += ' | 数组为空';
        }
      } catch (error) {
        this.debugInfo = `错误: ${error.message || error}`;
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    onRateChange(rate, event) {
      const newRate = parseFloat(event.detail.value);
      if (!isNaN(newRate) && newRate > 0) {
        rate.rate = newRate;
      }
    },
    
    onToggleChange(rate, event) {
      rate.isEnabled = event.detail.value;
    },
    
    async saveSettings() {
      this.saving = true;
      try {
        const rates = this.currencyRates.map(r => ({
          currency: r.currency,
          rate: r.rate,
          isEnabled: r.isEnabled,
          sortOrder: r.sortOrder
        }));
        
        await api.currencyRates.batchUpdate({ rates });
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } catch (error) {
        uni.showToast({
          title: '保存失败',
          icon: 'error'
        });
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.currency-settings-container {
  min-height: 100vh;
  background: #F5F6F8;
  padding: 20rpx;
  box-sizing: border-box;
}

.loading-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 20rpx;
  
  .loading-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.empty-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 20rpx;
  
  .empty-text {
    font-size: 28rpx;
    color: #999999;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .debug-text {
    font-size: 20rpx;
    color: #F5A623;
    display: block;
    word-break: break-all;
    text-align: left;
    padding: 20rpx;
    background: #FFF5F5;
    border-radius: 8rpx;
  }
}

.header {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #FFFFFF;
    display: block;
    margin-bottom: 10rpx;
  }
  
  .subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.currency-list {
  background: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  
  .currency-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 20rpx;
    border-bottom: 1rpx solid #F0F0F0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.disabled {
      opacity: 0.5;
    }
    
    .currency-info {
      flex: 1;
      
      .currency-header {
        display: flex;
        align-items: center;
        margin-bottom: 12rpx;
        
        .currency-symbol {
          font-size: 32rpx;
          margin-right: 12rpx;
          color: #F5A623;
          font-weight: bold;
        }
        
        .currency-name {
          font-size: 28rpx;
          color: #333333;
          font-weight: 500;
          margin-right: 12rpx;
        }
        
        .currency-code {
          font-size: 24rpx;
          color: #999999;
          background: #F5F5F5;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
        }
      }
      
      .rate-row {
        display: flex;
        align-items: center;
        
        .rate-label {
          font-size: 24rpx;
          color: #666666;
          margin-right: 10rpx;
        }
        
        .rate-input {
          width: 160rpx;
          height: 56rpx;
          background: #F5F5F5;
          border-radius: 8rpx;
          padding: 0 16rpx;
          font-size: 28rpx;
          color: #333333;
          text-align: center;
        }
        
        .rate-unit {
          font-size: 24rpx;
          color: #F7B84D;
          margin-left: 10rpx;
          font-weight: 500;
        }
      }
    }
    
    .currency-toggle {
      margin-left: 20rpx;
    }
  }
}

.save-section {
  padding: 20rpx 0;
  
  .save-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    border-radius: 44rpx;
    color: #FFFFFF;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    
    &:active {
      opacity: 0.9;
    }
  }
}

.tips-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  
  .tips-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .tips-item {
    font-size: 24rpx;
    color: #999999;
    display: block;
    line-height: 40rpx;
  }
}
</style>
