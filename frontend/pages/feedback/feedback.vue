<template>
  <view class="feedback-container">
    <!-- 表单区域 -->
    <view class="feedback-form">
      <!-- 反馈类型 -->
      <view class="form-section">
        <text class="section-title">反馈类型</text>
        <view class="type-selector">
          <view 
            v-for="type in feedbackTypes" 
            :key="type.value"
            class="type-item"
            :class="{ selected: form.type === type.value }"
            @click="form.type = type.value"
          >
            <text class="type-icon">{{ type.icon }}</text>
            <text class="type-name">{{ type.name }}</text>
          </view>
        </view>
      </view>
      
      <!-- 标题 -->
      <view class="form-section">
        <text class="section-title">标题</text>
        <input 
          class="form-input"
          v-model="form.title"
          placeholder="请简要描述您的问题或建议"
          maxlength="50"
        />
      </view>
      
      <!-- 详细内容 -->
      <view class="form-section">
        <text class="section-title">详细内容</text>
        <textarea 
          class="form-textarea"
          v-model="form.content"
          placeholder="请详细描述您遇到的问题、建议或想要的功能..."
          maxlength="1000"
        />
        <text class="char-count">{{ form.content.length }}/1000</text>
      </view>
      
      <!-- 联系方式（可选） -->
      <view class="form-section">
        <text class="section-title">联系方式（选填）</text>
        <input 
          class="form-input"
          v-model="form.contact"
          placeholder="输入您的邮箱，方便我们联系您"
          maxlength="100"
        />
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" :loading="submitting" @click="submitFeedback">
          提交反馈
        </button>
      </view>
    </view>
    
    <!-- 我的反馈记录 -->
    <view class="feedback-history" v-if="feedbackList.length > 0">
      <text class="history-title">我的反馈记录</text>
      <view 
        v-for="item in feedbackList" 
        :key="item.id"
        class="feedback-item"
      >
        <view class="item-header">
          <text class="item-type" :class="'type-' + item.type">{{ item.typeName }}</text>
          <text class="item-status" :class="'status-' + item.status">{{ item.statusName }}</text>
        </view>
        <text class="item-title">{{ item.title }}</text>
        <text class="item-content">{{ item.content }}</text>
        <view class="item-footer">
          <text class="item-date">{{ formatDate(item.createdAt) }}</text>
        </view>
        <!-- 管理员回复 -->
        <view class="admin-reply" v-if="item.adminReply">
          <text class="reply-label">官方回复：</text>
          <text class="reply-content">{{ item.adminReply }}</text>
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
      form: {
        type: 0,
        title: '',
        content: '',
        contact: ''
      },
      feedbackTypes: [
        { value: 0, name: '功能建议', icon: '💡' },
        { value: 1, name: '问题反馈', icon: '🐛' },
        { value: 2, name: '投诉', icon: '😤' },
        { value: 99, name: '其他', icon: '📝' }
      ],
      feedbackList: [],
      submitting: false,
      loading: false
    };
  },
  
  onLoad() {
    this.loadFeedbackList();
  },
  
  methods: {
    formatDate,
    
    async loadFeedbackList() {
      this.loading = true;
      try {
        const res = await api.feedbacks.getList();
        this.feedbackList = res || [];
      } catch (error) {
        console.error('加载反馈列表失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async submitFeedback() {
      // 验证表单
      if (!this.form.title.trim()) {
        uni.showToast({
          title: '请输入标题',
          icon: 'none'
        });
        return;
      }
      
      if (!this.form.content.trim()) {
        uni.showToast({
          title: '请输入详细内容',
          icon: 'none'
        });
        return;
      }
      
      this.submitting = true;
      try {
        await api.feedbacks.create({
          type: this.form.type,
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          contact: this.form.contact.trim() || null
        });
        
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
        // 清空表单
        this.form.title = '';
        this.form.content = '';
        this.form.contact = '';
        
        // 重新加载列表
        this.loadFeedbackList();
      } catch (error) {
        console.error('提交反馈失败:', error);
        uni.showToast({
          title: '提交失败',
          icon: 'error'
        });
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.feedback-container {
  min-height: 100vh;
  background: #F5F6F8;
  padding: 20rpx;
  box-sizing: border-box;
}

.feedback-form {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .form-section {
    margin-bottom: 24rpx;
    
    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      margin-bottom: 16rpx;
      display: block;
    }
    
    .type-selector {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12rpx;
      
      .type-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 10rpx;
        border-radius: 12rpx;
        background: #F5F5F5;
        border: 2rpx solid transparent;
        transition: all 0.3s;
        
        &.selected {
          background: rgba(245, 166, 35, 0.1);
          border-color: #F7B84D;
        }
        
        .type-icon {
          font-size: 36rpx;
          margin-bottom: 8rpx;
        }
        
        .type-name {
          font-size: 22rpx;
          color: #666666;
        }
      }
    }
    
    .form-input {
      width: 100%;
      height: 80rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      box-sizing: border-box;
    }
    
    .form-textarea {
      width: 100%;
      height: 240rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 20rpx;
      font-size: 28rpx;
      box-sizing: border-box;
    }
    
    .char-count {
      font-size: 24rpx;
      color: #999999;
      text-align: right;
      display: block;
      margin-top: 8rpx;
    }
  }
}

.submit-section {
  padding-top: 16rpx;
  
  .submit-btn {
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

.feedback-history {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  
  .history-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .feedback-item {
    padding: 20rpx;
    background: #FAFAFA;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .item-type {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        
        &.type-0 {
          background: rgba(245, 166, 35, 0.2);
          color: #F7B84D;
        }
        
        &.type-1 {
          background: rgba(245, 166, 35, 0.2);
          color: #F5A623;
        }
        
        &.type-2 {
          background: rgba(255, 193, 7, 0.2);
          color: #FFC107;
        }
        
        &.type-99 {
          background: rgba(158, 158, 158, 0.2);
          color: #9E9E9E;
        }
      }
      
      .item-status {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        
        &.status-0 {
          background: rgba(158, 158, 158, 0.2);
          color: #9E9E9E;
        }
        
        &.status-1 {
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
        }
        
        &.status-2 {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }
        
        &.status-3 {
          background: rgba(158, 158, 158, 0.2);
          color: #9E9E9E;
        }
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
      display: block;
      margin-bottom: 12rpx;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .item-footer {
      .item-date {
        font-size: 22rpx;
        color: #999999;
      }
    }
    
    .admin-reply {
      margin-top: 16rpx;
      padding: 16rpx;
      background: rgba(245, 166, 35, 0.1);
      border-radius: 8rpx;
      border-left: 4rpx solid #F7B84D;
      
      .reply-label {
        font-size: 22rpx;
        color: #F7B84D;
        font-weight: bold;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .reply-content {
        font-size: 24rpx;
        color: #333333;
      }
    }
  }
}
</style>
