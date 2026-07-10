<template>
  <view v-if="visible" class="transaction-detail-modal" @click="handleClose">
    <view class="detail-content" @click.stop>
      <view class="detail-header">
        <text class="detail-title">交易详情</text>
        <text class="detail-close" @click="handleClose">×</text>
      </view>
      
      <scroll-view class="detail-body" scroll-y v-if="transaction">
        <!-- 金额和类型 -->
        <view class="detail-amount-section">
          <view class="amount-type" :class="transaction.type === 0 ? 'expense' : 'income'">
            <text class="type-text">{{ transaction.type === 0 ? '支出' : '收入' }}</text>
          </view>
          <text class="amount-value" :class="transaction.type === 0 ? 'expense' : 'income'">
            {{ transaction.type === 0 ? '-' : '+' }}¥{{ transaction.amount.toFixed(2) }}
          </text>
        </view>
        
        <!-- 分类信息 -->
        <view class="detail-item">
          <text class="detail-label">分类</text>
          <view class="detail-value category-value">
            <view class="category-icon-small" :style="{ backgroundColor: transaction.categoryColor }">
              <app-icon :icon="transaction.categoryIcon" :category-name="transaction.categoryName" :size="16" color="#FFFFFF" />
            </view>
            <text>{{ transaction.categoryName }}</text>
          </view>
        </view>
        
        <!-- 日期时间 -->
        <view class="detail-item">
          <text class="detail-label">时间</text>
          <text class="detail-value">{{ formatDate(transaction.transactionDate, 'YYYY-MM-DD HH:mm') }}</text>
        </view>
        
        <!-- 创建者信息（一起账本） -->
        <view v-if="transaction.accountBookType === 1 && (transaction.userName || transaction.userId)" class="detail-item">
          <text class="detail-label">创建者</text>
          <view class="detail-value creator-value">
            <view v-if="isMyTransaction" class="my-label-small">我</view>
            <view v-else class="creator-info">
              <view v-if="transaction.userAvatar" class="creator-avatar-small">
                <image :src="transaction.userAvatar" mode="aspectFill"></image>
              </view>
              <view v-else class="creator-avatar-placeholder-small">
                <text>{{ transaction.userName?.charAt(0) || '?' }}</text>
              </view>
              <text>{{ transaction.userName || '未知用户' }}</text>
            </view>
          </view>
        </view>
        
        <!-- 备注 -->
        <view v-if="transaction.remark" class="detail-item">
          <text class="detail-label">备注</text>
          <text class="detail-value remark-value">{{ transaction.remark }}</text>
        </view>

        <!-- 消费渠道（支出） -->
        <view v-if="transaction.type === 0 && transaction.spendingChannel > 0" class="detail-item">
          <text class="detail-label">在哪里买的</text>
          <view class="detail-value">
            <text>在</text>
            <text class="detail-channel-name">{{ transaction.spendingChannelName }}</text>
            <text>买的</text>
          </view>
        </view>
        
        <!-- 图片 -->
        <view v-if="transaction.images && transaction.images.length > 0" class="detail-item">
          <text class="detail-label">图片</text>
          <view class="detail-images">
            <view 
              v-for="(img, index) in transaction.images" 
              :key="img.id || index"
              class="detail-image-item"
              @click="previewImages(index)"
            >
              <image :src="img.imageUrl" mode="aspectFill"></image>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { formatDate } from '@/utils/util';
import { mapState } from 'vuex';

export default {
  name: 'TransactionDetail',
  props: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      default: false
    },
    // 交易数据
    transaction: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapState(['userInfo']),
    // 判断是否是本人的交易记录
    isMyTransaction() {
      if (!this.userInfo || !this.transaction || !this.transaction.userId) {
        return false;
      }
      return this.userInfo.id === this.transaction.userId;
    }
  },
  methods: {
    formatDate,
    
    handleClose() {
      this.$emit('close');
    },
    
    previewImages(index) {
      if (this.transaction && this.transaction.images && this.transaction.images.length > 0) {
        const imageUrls = this.transaction.images.map(img => img.imageUrl);
        uni.previewImage({
          urls: imageUrls,
          current: index
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.transaction-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  
  .detail-content {
    width: 100%;
    max-width: 640rpx;
    max-height: 80vh;
    background: #FFFFFF;
    border-radius: 32rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32rpx;
      border-bottom: 1rpx solid #F5F5F5;
      
      .detail-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .detail-close {
        font-size: 48rpx;
        color: #999999;
        line-height: 1;
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .detail-body {
      flex: 1;
      padding: 32rpx;
      overflow-y: auto;
      
      .detail-amount-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48rpx 0;
        margin-bottom: 32rpx;
        
        .amount-type {
          padding: 8rpx 24rpx;
          border-radius: 32rpx;
          margin-bottom: 24rpx;
          
          &.expense {
            background: rgba(232, 93, 75, 0.1);
            
            .type-text {
              color: #E85D4B;
            }
          }
          
          &.income {
            background: rgba(81, 207, 102, 0.1);
            
            .type-text {
              color: #5CB85C;
            }
          }
          
          .type-text {
            font-size: 24rpx;
            font-weight: 500;
          }
        }
        
        .amount-value {
          font-size: 64rpx;
          font-weight: bold;
          
          &.expense {
            color: #E85D4B;
          }
          
          &.income {
            color: #5CB85C;
          }
        }
      }
      
      .detail-item {
        display: flex;
        flex-direction: column;
        margin-bottom: 32rpx;
        
        .detail-label {
          font-size: 24rpx;
          color: #999999;
          margin-bottom: 16rpx;
        }
        
        .detail-value {
          font-size: 28rpx;
          color: #333333;

          .detail-channel-name {
            color: #2064f5a8;
            font-weight: 600;
          }
          
          &.category-value {
            display: flex;
            align-items: center;
            gap: 16rpx;
            
            .category-icon-small {
              width: 48rpx;
              height: 48rpx;
              border-radius: 12rpx;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24rpx;
            }
          }
          
          &.creator-value {
            display: flex;
            align-items: center;
            gap: 12rpx;
            
            .my-label-small {
              font-size: 24rpx;
              color: #F7B84D;
              background: rgba(245, 166, 35, 0.1);
              padding: 4rpx 16rpx;
              border-radius: 16rpx;
              border: 1rpx solid #F7B84D;
              font-weight: bold;
            }
            
            .creator-info {
              display: flex;
              align-items: center;
              gap: 12rpx;
              
              .creator-avatar-small,
              .creator-avatar-placeholder-small {
                width: 48rpx;
                height: 48rpx;
                border-radius: 24rpx;
                overflow: hidden;
                
                image {
                  width: 100%;
                  height: 100%;
                }
              }
              
              .creator-avatar-placeholder-small {
                background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #FFFFFF;
                font-size: 20rpx;
                font-weight: bold;
              }
            }
          }
          
          &.remark-value {
            line-height: 1.6;
            word-break: break-all;
          }
        }
        
        .detail-images {
          display: flex;
          flex-wrap: wrap;
          gap: 16rpx;
          
          .detail-image-item {
            width: 200rpx;
            height: 200rpx;
            border-radius: 16rpx;
            overflow: hidden;
            border: 1rpx solid #F5F5F5;
            
            image {
              width: 100%;
              height: 100%;
            }
          }
        }
      }
    }
  }
}
</style>



