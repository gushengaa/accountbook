<template>
  <view class="shared-account-books-container">
    <!-- 创建按钮 -->
    <view class="create-btn" @click="goToCreate">
      <text class="create-icon">+</text>
      <text class="create-text">创建集体账本</text>
    </view>
    
    <!-- 加入按钮 -->
    <view class="join-btn" @click="showJoinDialog = true">
      <text class="join-icon">🔗</text>
      <text class="join-text">加入集体账本</text>
    </view>
    
    <!-- 集体账本列表 -->
    <view class="shared-account-books-list">
      <view 
        v-for="book in sharedAccountBooks" 
        :key="book.id"
        class="shared-account-book-item"
        @click="viewSharedAccountBook(book)"
      >
        <view class="book-header">
          <text class="book-name">{{ book.name }}</text>
          <text v-if="book.status === 1" class="status-badge ended">已结束</text>
          <text v-else class="status-badge active">进行中</text>
        </view>
        <text class="book-description">{{ book.description || '暂无描述' }}</text>
        <view class="book-info">
          <text class="info-item">创建者：{{ book.creatorName }}</text>
          <text class="info-item">成员：{{ book.memberCount }}人</text>
          <text v-if="book.budget" class="info-item">预算：¥{{ book.budget.toFixed(2) }}</text>
        </view>
        <view class="book-footer">
          <text class="share-code">分享码：{{ book.shareCode }}</text>
          <text class="book-date">创建于 {{ formatDate(book.createdAt) }}</text>
        </view>
      </view>
      
      <view v-if="sharedAccountBooks.length === 0" class="empty-state">
        <text class="empty-text">还没有集体账本</text>
        <text class="empty-hint">创建或加入一个集体账本开始使用吧~</text>
      </view>
    </view>
    
    <!-- 加入集体账本弹窗 -->
    <view v-if="showJoinDialog" class="dialog-mask" @click="showJoinDialog = false">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">加入集体账本</text>
          <text class="dialog-close" @click="showJoinDialog = false">×</text>
        </view>
        <view class="dialog-body">
          <input 
            class="dialog-input" 
            v-model="shareCode"
            placeholder="请输入分享码"
            :focus="true"
            maxlength="6"
          />
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn cancel" @click="showJoinDialog = false">取消</button>
          <button class="dialog-btn confirm" @click="joinSharedAccountBook" :loading="joining">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate } from '@/utils/util';

export default {
  data() {
    return {
      sharedAccountBooks: [],
      showJoinDialog: false,
      shareCode: '',
      joining: false,
      loading: false
    };
  },
  onLoad() {
    this.loadSharedAccountBooks();
  },
  onShow() {
    this.loadSharedAccountBooks();
  },
  methods: {
    formatDate,
    
    async loadSharedAccountBooks() {
      this.loading = true;
      try {
        this.sharedAccountBooks = await api.sharedAccountBooks.getList();
      } catch (error) {
        console.error('加载集体账本失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    goToCreate() {
      uni.navigateTo({
        url: '/pages/create-shared-account-book/create-shared-account-book'
      });
    },
    
    async joinSharedAccountBook() {
      if (!this.shareCode.trim()) {
        uni.showToast({
          title: '请输入分享码',
          icon: 'none'
        });
        return;
      }
      
      this.joining = true;
      
      try {
        await api.sharedAccountBooks.join({
          shareCode: this.shareCode.trim().toUpperCase()
        });
        
        uni.showToast({
          title: '加入成功',
          icon: 'success'
        });
        
        this.showJoinDialog = false;
        this.shareCode = '';
        await this.loadSharedAccountBooks();
        
      } catch (error) {
        console.error('加入失败', error);
        uni.showToast({
          title: error.message || '加入失败',
          icon: 'none'
        });
      } finally {
        this.joining = false;
      }
    },
    
    viewSharedAccountBook(book) {
      uni.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}`
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.shared-account-books-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

.create-btn, .join-btn {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  .create-icon, .join-icon {
    font-size: 48rpx;
    margin-right: 24rpx;
  }
  
  .create-text, .join-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }
}

.create-btn {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  color: #FFFFFF;
  
  .create-text {
    color: #FFFFFF;
  }
}

.shared-account-books-list {
  .shared-account-book-item {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    
    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      
      .book-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        flex: 1;
      }
      
      .status-badge {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        
        &.active {
          background: #F5A623;
          color: #FFFFFF;
        }
        
        &.ended {
          background: #999999;
          color: #FFFFFF;
        }
      }
    }
    
    .book-description {
      font-size: 24rpx;
      color: #999999;
      margin-bottom: 16rpx;
      display: block;
    }
    
    .book-info {
      display: flex;
      flex-wrap: wrap;
      gap: 24rpx;
      margin-bottom: 16rpx;
      
      .info-item {
        font-size: 24rpx;
        color: #666666;
      }
    }
    
    .book-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16rpx;
      border-top: 1rpx solid #F5F5F5;
      
      .share-code {
        font-size: 24rpx;
        color: #F5A623;
        font-weight: bold;
      }
      
      .book-date {
        font-size: 24rpx;
        color: #CCCCCC;
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 120rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #999999;
      margin-bottom: 16rpx;
      display: block;
    }
    
    .empty-hint {
      font-size: 24rpx;
      color: #CCCCCC;
    }
  }
}

.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-content {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .dialog-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .dialog-close {
      font-size: 48rpx;
      color: #999999;
      line-height: 1;
    }
  }
  
  .dialog-body {
    padding: 32rpx;
    
    .dialog-input {
      width: 100%;
      background: #F5F5F5;
      border-radius: 16rpx;
      padding: 24rpx;
      font-size: 32rpx;
      text-align: center;
      letter-spacing: 8rpx;
      border: none;
    }
  }
  
  .dialog-footer {
    display: flex;
    border-top: 1rpx solid #F5F5F5;
    
    .dialog-btn {
      flex: 1;
      height: 96rpx;
      border: none;
      font-size: 28rpx;
      
      &.cancel {
        background: #F5F5F5;
        color: #333333;
        border-right: 1rpx solid #F5F5F5;
      }
      
      &.confirm {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        color: #FFFFFF;
      }
    }
  }
}
</style>










