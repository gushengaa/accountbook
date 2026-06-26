<template>
  <view class="feedback-admin-container">
    <!-- 顶部筛选器 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          v-for="tab in statusTabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: filterStatus === tab.value }"
          @click="filterStatus = tab.value; loadFeedbacks()"
        >
          <text>{{ tab.name }}</text>
        </view>
      </view>
    </view>
    
    <!-- 反馈列表 -->
    <view class="feedback-list" v-if="feedbackList.length > 0">
      <view 
        v-for="item in feedbackList" 
        :key="item.id"
        class="feedback-item"
        @click="showDetail(item)"
      >
        <view class="item-header">
          <view class="user-info">
            <image class="user-avatar" :src="item.userAvatar || '/static/default-avatar.png'" mode="aspectFill" />
            <text class="user-name">{{ item.userName || '匿名用户' }}</text>
          </view>
          <text class="item-status" :class="'status-' + item.status">{{ item.statusName }}</text>
        </view>
        <view class="item-meta">
          <text class="item-type" :class="'type-' + item.type">{{ item.typeName }}</text>
          <text class="item-date">{{ formatDate(item.createdAt) }}</text>
        </view>
        <text class="item-title">{{ item.title }}</text>
        <text class="item-content">{{ item.content }}</text>
        <view class="item-contact" v-if="item.contact">
          <text class="contact-label">联系方式：</text>
          <text class="contact-value">{{ item.contact }}</text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading">
      <text class="empty-text">暂无反馈记录</text>
    </view>
    
    <!-- 反馈详情弹窗 -->
    <view v-if="showDetailModal" class="detail-modal" @click="showDetailModal = false">
      <view class="detail-content" @click.stop>
        <view class="detail-header">
          <text class="detail-title">反馈详情</text>
          <text class="detail-close" @click="showDetailModal = false">×</text>
        </view>
        <scroll-view class="detail-body" scroll-y>
          <view class="detail-user">
            <image class="detail-avatar" :src="selectedFeedback?.userAvatar || '/static/default-avatar.png'" mode="aspectFill" />
            <view class="detail-user-info">
              <text class="detail-username">{{ selectedFeedback?.userName || '匿名用户' }}</text>
              <text class="detail-date">{{ formatDate(selectedFeedback?.createdAt) }}</text>
            </view>
          </view>
          
          <view class="detail-tags">
            <text class="tag" :class="'type-' + selectedFeedback?.type">{{ selectedFeedback?.typeName }}</text>
            <text class="tag" :class="'status-' + selectedFeedback?.status">{{ selectedFeedback?.statusName }}</text>
          </view>
          
          <text class="detail-feedback-title">{{ selectedFeedback?.title }}</text>
          <text class="detail-feedback-content">{{ selectedFeedback?.content }}</text>
          
          <view class="detail-contact" v-if="selectedFeedback?.contact">
            <text class="contact-label">联系方式：</text>
            <text class="contact-value">{{ selectedFeedback.contact }}</text>
          </view>
          
          <!-- 处理区域 -->
          <view class="process-section">
            <text class="section-title">处理反馈</text>
            
            <view class="status-selector">
              <text class="label">状态：</text>
              <view class="status-options">
                <view 
                  v-for="s in processStatuses" 
                  :key="s.value"
                  class="status-option"
                  :class="{ active: processForm.status === s.value }"
                  @click="processForm.status = s.value"
                >
                  <text>{{ s.name }}</text>
                </view>
              </view>
            </view>
            
            <view class="reply-section">
              <text class="label">回复内容：</text>
              <textarea 
                class="reply-input"
                v-model="processForm.adminReply"
                placeholder="输入回复内容..."
                maxlength="500"
              />
            </view>
            
            <button class="process-btn" :loading="processing" @click="processFeedback">
              提交处理
            </button>
          </view>
        </scroll-view>
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
      feedbackList: [],
      loading: false,
      filterStatus: -1,
      statusTabs: [
        { value: -1, name: '全部' },
        { value: 0, name: '待处理' },
        { value: 1, name: '处理中' },
        { value: 2, name: '已完成' },
        { value: 3, name: '已关闭' }
      ],
      processStatuses: [
        { value: 0, name: '待处理' },
        { value: 1, name: '处理中' },
        { value: 2, name: '已完成' },
        { value: 3, name: '已关闭' }
      ],
      showDetailModal: false,
      selectedFeedback: null,
      processForm: {
        status: 0,
        adminReply: ''
      },
      processing: false
    };
  },
  
  onLoad() {
    this.checkAdmin();
  },
  
  methods: {
    formatDate,
    
    async checkAdmin() {
      try {
        const isAdmin = await api.feedbacks.checkAdmin();
        if (!isAdmin) {
          uni.showModal({
            title: '无权限',
            content: '您不是管理员，无法访问此页面',
            showCancel: false,
            success: () => {
              uni.navigateBack();
            }
          });
          return;
        }
        this.loadFeedbacks();
      } catch (error) {
        console.error('检查管理员权限失败:', error);
        uni.navigateBack();
      }
    },
    
    async loadFeedbacks() {
      this.loading = true;
      try {
        const res = await api.feedbacks.adminGetList(this.filterStatus);
        this.feedbackList = res || [];
      } catch (error) {
        console.error('加载反馈列表失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    showDetail(feedback) {
      this.selectedFeedback = feedback;
      this.processForm.status = feedback.status;
      this.processForm.adminReply = feedback.adminReply || '';
      this.showDetailModal = true;
    },
    
    async processFeedback() {
      this.processing = true;
      try {
        await api.feedbacks.adminProcess(this.selectedFeedback.id, {
          status: this.processForm.status,
          adminReply: this.processForm.adminReply
        });
        
        uni.showToast({
          title: '处理成功',
          icon: 'success'
        });
        
        this.showDetailModal = false;
        this.loadFeedbacks();
      } catch (error) {
        console.error('处理反馈失败:', error);
        uni.showToast({
          title: '处理失败',
          icon: 'error'
        });
      } finally {
        this.processing = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.feedback-admin-container {
  min-height: 100vh;
  background: #F5F6F8;
}

.filter-section {
  background: #FFFFFF;
  padding: 20rpx;
  margin-bottom: 20rpx;
  
  .filter-tabs {
    display: flex;
    gap: 16rpx;
    overflow-x: auto;
    
    .filter-tab {
      padding: 12rpx 24rpx;
      background: #F5F5F5;
      border-radius: 24rpx;
      font-size: 26rpx;
      color: #666666;
      white-space: nowrap;
      
      &.active {
        background: #F7B84D;
        color: #FFFFFF;
      }
    }
  }
}

.feedback-list {
  padding: 0 20rpx;
  
  .feedback-item {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .user-avatar {
          width: 48rpx;
          height: 48rpx;
          border-radius: 50%;
        }
        
        .user-name {
          font-size: 26rpx;
          color: #333333;
        }
      }
      
      .item-status {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        
        &.status-0 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
        &.status-1 { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
        &.status-2 { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
        &.status-3 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      }
    }
    
    .item-meta {
      display: flex;
      gap: 12rpx;
      margin-bottom: 12rpx;
      
      .item-type {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        
        &.type-0 { background: rgba(245, 166, 35, 0.2); color: #F7B84D; }
        &.type-1 { background: rgba(245, 166, 35, 0.2); color: #F5A623; }
        &.type-2 { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
        &.type-99 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
      }
      
      .item-date {
        font-size: 22rpx;
        color: #999999;
      }
    }
    
    .item-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .item-content {
      font-size: 24rpx;
      color: #666666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .item-contact {
      margin-top: 12rpx;
      font-size: 22rpx;
      
      .contact-label { color: #999999; }
      .contact-value { color: #F7B84D; }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
  
  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  
  .detail-content {
    width: 100%;
    max-height: 90vh;
    background: #FFFFFF;
    border-radius: 32rpx 32rpx 0 0;
    display: flex;
    flex-direction: column;
    
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32rpx;
      border-bottom: 1rpx solid #F5F5F5;
      
      .detail-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .detail-close {
        font-size: 48rpx;
        color: #999999;
      }
    }
    
    .detail-body {
      flex: 1;
      padding: 24rpx;
      max-height: 70vh;
      
      .detail-user {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 20rpx;
        
        .detail-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
        }
        
        .detail-user-info {
          .detail-username {
            font-size: 28rpx;
            font-weight: bold;
            color: #333333;
            display: block;
          }
          
          .detail-date {
            font-size: 24rpx;
            color: #999999;
          }
        }
      }
      
      .detail-tags {
        display: flex;
        gap: 12rpx;
        margin-bottom: 20rpx;
        
        .tag {
          font-size: 22rpx;
          padding: 6rpx 16rpx;
          border-radius: 16rpx;
          
          &.type-0 { background: rgba(245, 166, 35, 0.2); color: #F7B84D; }
          &.type-1 { background: rgba(245, 166, 35, 0.2); color: #F5A623; }
          &.type-2 { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
          &.type-99 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
          
          &.status-0 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
          &.status-1 { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
          &.status-2 { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
          &.status-3 { background: rgba(158, 158, 158, 0.2); color: #9E9E9E; }
        }
      }
      
      .detail-feedback-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        display: block;
        margin-bottom: 16rpx;
      }
      
      .detail-feedback-content {
        font-size: 28rpx;
        color: #666666;
        line-height: 1.6;
        display: block;
        margin-bottom: 20rpx;
      }
      
      .detail-contact {
        padding: 16rpx;
        background: #F5F5F5;
        border-radius: 12rpx;
        margin-bottom: 24rpx;
        
        .contact-label {
          font-size: 24rpx;
          color: #999999;
        }
        
        .contact-value {
          font-size: 24rpx;
          color: #F7B84D;
        }
      }
      
      .process-section {
        border-top: 1rpx solid #F5F5F5;
        padding-top: 24rpx;
        
        .section-title {
          font-size: 28rpx;
          font-weight: bold;
          color: #333333;
          display: block;
          margin-bottom: 20rpx;
        }
        
        .status-selector {
          margin-bottom: 20rpx;
          
          .label {
            font-size: 26rpx;
            color: #666666;
            display: block;
            margin-bottom: 12rpx;
          }
          
          .status-options {
            display: flex;
            gap: 12rpx;
            flex-wrap: wrap;
            
            .status-option {
              padding: 12rpx 24rpx;
              background: #F5F5F5;
              border-radius: 24rpx;
              font-size: 24rpx;
              color: #666666;
              
              &.active {
                background: #F7B84D;
                color: #FFFFFF;
              }
            }
          }
        }
        
        .reply-section {
          margin-bottom: 20rpx;
          
          .label {
            font-size: 26rpx;
            color: #666666;
            display: block;
            margin-bottom: 12rpx;
          }
          
          .reply-input {
            width: 100%;
            height: 200rpx;
            background: #F5F5F5;
            border-radius: 12rpx;
            padding: 20rpx;
            font-size: 26rpx;
            box-sizing: border-box;
          }
        }
        
        .process-btn {
          width: 100%;
          height: 80rpx;
          background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
          border-radius: 40rpx;
          color: #FFFFFF;
          font-size: 28rpx;
          font-weight: bold;
          border: none;
        }
      }
    }
  }
}
</style>
