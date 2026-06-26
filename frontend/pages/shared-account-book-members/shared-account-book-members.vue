<template>
  <view class="members-container">
    <view class="members-list">
      <view 
        v-for="member in members" 
        :key="member.id"
        class="member-item"
      >
        <view class="member-info">
          <image 
            class="member-avatar" 
            :src="member.userAvatar || '/static/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="member-details">
            <text class="member-name">{{ member.userName }}</text>
            <text class="member-role">{{ member.role === 1 ? '管理员' : '成员' }}</text>
          </view>
        </view>
        <view class="member-actions" v-if="canManage">
          <text 
            v-if="member.userId !== currentUserId && member.role === 0" 
            class="remove-btn"
            @click="removeMember(member)"
          >
            移除
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      sharedAccountBookId: null,
      sharedAccountBook: null,
      members: [],
      currentUserId: null
    };
  },
  computed: {
    ...mapState(['userInfo']),
    canManage() {
      // 检查当前用户是否是创建者或管理员
      if (!this.sharedAccountBook || !this.userInfo) return false;
      const currentMember = this.members.find(m => m.userId === this.userInfo.id);
      return this.sharedAccountBook.creatorId === this.userInfo.id || currentMember?.role === 1;
    }
  },
  onLoad(options) {
    if (options.id) {
      this.sharedAccountBookId = parseInt(options.id);
      this.loadData();
    }
  },
  methods: {
    async loadData() {
      try {
        this.sharedAccountBook = await api.sharedAccountBooks.getById(this.sharedAccountBookId);
        this.members = this.sharedAccountBook.members || [];
        this.currentUserId = this.userInfo?.id;
      } catch (error) {
        console.error('加载成员失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    },
    
    async removeMember(member) {
      uni.showModal({
        title: '确认移除',
        content: `确定要移除成员 ${member.userName} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await api.sharedAccountBooks.removeMember(this.sharedAccountBookId, member.userId);
              uni.showToast({
                title: '移除成功',
                icon: 'success'
              });
              await this.loadData();
            } catch (error) {
              uni.showToast({
                title: error.message || '移除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.members-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
}

.members-list {
  .member-item {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .member-info {
      display: flex;
      align-items: center;
      flex: 1;
      
      .member-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        margin-right: 24rpx;
      }
      
      .member-details {
        display: flex;
        flex-direction: column;
        
        .member-name {
          font-size: 28rpx;
          font-weight: bold;
          color: #333333;
          margin-bottom: 8rpx;
        }
        
        .member-role {
          font-size: 24rpx;
          color: #999999;
        }
      }
    }
    
    .member-actions {
      .remove-btn {
        font-size: 24rpx;
        color: #F5A623;
        padding: 8rpx 16rpx;
        border: 1rpx solid #F5A623;
        border-radius: 8rpx;
      }
    }
  }
}
</style>










