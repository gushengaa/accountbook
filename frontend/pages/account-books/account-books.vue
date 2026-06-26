<template>
  <view class="account-books-container">
    <!-- 操作按钮组（与筛选栏统一风格） -->
<!--    <view class="action-buttons">
      <view class="action-btn create-account-book" @click="goToCreateAccountBook">
        <text class="action-icon">➕</text>
        <text class="action-text">创建账本</text>
      </view>
      <view class="action-btn join-shared" @click="showJoinDialog = true">
        <text class="action-icon">🔗</text>
        <text class="action-text">加入账本</text>
      </view>
    </view> -->
    
    <!-- 账本类型 + 状态（同一行，类型在左、状态在右） -->
    <view class="filter-row">
      <view class="account-type-tabs">
        <view 
          class="type-tab" 
          :class="{ active: accountBookTab === 'personal', 'tab-personal': accountBookTab === 'personal' }"
          @click="switchAccountBookTab('personal')"
        >
          <text class="tab-text">个人账本</text>
        </view>
        <view 
          class="type-tab" 
          :class="{ active: accountBookTab === 'shared', 'tab-shared': accountBookTab === 'shared' }"
          @click="switchAccountBookTab('shared')"
        >
          <text class="tab-text">集体账本</text>
        </view>
      </view>
      
      <view class="status-tags">
        <view 
          class="status-tag" 
          :class="{ active: statusTab === 'all', 'tag-all': statusTab === 'all' }"
          @click="statusTab = 'all'"
        >
          <text class="status-tag-text">全部</text>
        </view>
        <view 
          class="status-tag" 
          :class="{ active: statusTab === 'active', 'tag-active': statusTab === 'active' }"
          @click="statusTab = 'active'"
        >
          <text class="status-tag-text">进行中</text>
        </view>
        <view 
          class="status-tag" 
          :class="{ active: statusTab === 'ended', 'tag-ended': statusTab === 'ended' }"
          @click="statusTab = 'ended'"
        >
          <text class="status-tag-text">已结束</text>
        </view>
      </view>
    </view>
    
    <!-- 个人账本列表 -->
    <view v-if="accountBookTab === 'personal'" class="account-books-section">
      <view v-if="displayedPersonalBooks.length > 0" class="account-books-list">
        <view 
          v-for="book in displayedPersonalBooks" 
          :key="book.id"
          class="account-book-item"
          :class="{ active: currentAccountBook?.id === book.id && currentAccountBook?.type === 0 }"
          :style="getBookCardTintStyle(book.category)"
          @click="viewAccountBook(book, 0)"
        >
          <view class="book-accent"></view>
          <view class="book-card-inner">
            <view class="book-header">
              <view class="book-title-block">
                <view class="book-icon">
                  <app-icon :icon="getBookCategoryEmoji(book.category)" :category-name="book.categoryName" size="22rpx" color="#FFFFFF" />
                </view>
                <text class="book-name">{{ book.name }}</text>
              </view>
              <view class="book-badges">
                <text class="badge category" :style="getBookCategoryBadgeStyle(book.category)">{{ book.categoryName || '日常消费' }}</text>
                <text v-if="book.isDefault" class="badge default">默认</text>
                <text v-if="currentAccountBook?.id === book.id && currentAccountBook?.type === 0" class="badge current">当前</text>
              </view>
            </view>
            <text class="book-description">{{ book.description || '暂无描述' }}</text>
            <view class="book-footer">
              <text class="book-date">创建于 {{ formatDate(book.createdAt) }}</text>
              <view class="book-actions">
                <text class="delete-btn" @click.stop="showDeleteDialog(book, 0)">删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">{{ statusTab === 'all' ? '还没有个人账本' : (statusTab === 'active' ? '还没有进行中的个人账本' : '还没有已结束的个人账本') }}</text>
        <text class="empty-hint">{{ statusTab === 'all' || statusTab === 'active' ? '点击上方「创建账本」开始使用' : '已结束的账本将显示在此' }}</text>
      </view>
    </view>
    
    <!-- 集体账本列表 -->
    <view v-if="accountBookTab === 'shared'" class="account-books-section">
      <view v-if="displayedSharedBooks.length > 0" class="account-books-list">
        <view 
          v-for="book in displayedSharedBooks" 
          :key="book.id"
          class="account-book-item shared"
          :class="{ active: currentAccountBook?.id === book.id && currentAccountBook?.type === 1 }"
          :style="getBookCardTintStyle(book.category)"
          @click="viewSharedAccountBook(book)"
        >
          <view class="book-accent"></view>
          <view class="book-card-inner">
            <view class="book-header">
              <view class="book-title-block">
                <view class="book-icon">
                  <app-icon :icon="getBookCategoryEmoji(book.category)" :category-name="book.categoryName" size="22rpx" color="#FFFFFF" />
                </view>
                <text class="book-name">{{ book.name }}</text>
              </view>
              <view class="book-badges">
                <text class="badge shared-type">集体</text>
                <text class="badge category" :style="getBookCategoryBadgeStyle(book.category)">{{ book.categoryName || '日常消费' }}</text>
                <text v-if="book.status === 1" class="badge ended">已结束</text>
                <text v-else class="badge active-status">进行中</text>
                <text v-if="currentAccountBook?.id === book.id && currentAccountBook?.type === 1" class="badge current">当前</text>
              </view>
            </view>
            <text class="book-description">{{ book.description || '暂无描述' }}</text>
            <view class="book-info">
              <text class="info-item">创建者：{{ book.creatorName }}</text>
              <text class="info-item">成员：{{ book.memberCount }}人</text>
              <text v-if="book.budget" class="info-item">预算：¥{{ book.budget.toFixed(2) }}</text>
            </view>
            <view class="book-footer">
              <text class="share-code">分享码：{{ book.shareCode }}</text>
              <view class="book-footer-right">
                <text class="book-date">创建于 {{ formatDate(book.createdAt) }}</text>
                <text class="delete-btn" @click.stop="showDeleteDialog(book, 1)">删除</text>
              </view>
            </view>
            <view class="book-share-actions">
              <text class="copy-code-btn" @click.stop="copyShareCode(book)">复制分享码</text>
              <button 
                class="invite-btn" 
                open-type="share"
                :data-book="book"
                @click.stop="setShareBook(book)"
              >
                <text>邀请好友加入</text>
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">{{ statusTab === 'all' ? '还没有集体账本' : (statusTab === 'active' ? '还没有进行中的集体账本' : '还没有已结束的集体账本') }}</text>
        <text class="empty-hint">{{ statusTab === 'all' || statusTab === 'active' ? '点击上方「创建账本」或「加入账本」' : '已结束的集体账本将显示在此' }}</text>
      </view>
    </view>
    
    <!-- 删除账本确认弹窗 -->
    <view v-if="showDeleteConfirmDialog" class="dialog-mask" @click="showDeleteConfirmDialog = false">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">删除账本</text>
          <text class="dialog-close" @click="showDeleteConfirmDialog = false">×</text>
        </view>
        <view class="dialog-body">
          <text class="delete-confirm-text">确定要删除"{{ deleteTargetBook?.name }}"吗？</text>
          <text class="delete-warning-text">删除后将无法恢复，所有交易记录也会被删除！</text>
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn cancel" @click="showDeleteConfirmDialog = false" :plain="true">取消</button>
          <button class="dialog-btn confirm delete" @click="confirmDelete" :loading="deleting" :plain="true">删除</button>
        </view>
      </view>
    </view>
    
    <!-- 加入集体账本弹窗 -->
    <view v-if="showJoinDialog" class="dialog-mask" @click="showJoinDialog = false">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">加入账本</text>
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
          <button class="dialog-btn cancel" @click="showJoinDialog = false" :plain="true">取消</button>
          <button class="dialog-btn confirm" @click="joinSharedAccountBook" :loading="joining" :plain="true">确定</button>
        </view>
      </view>
    </view>

    <!-- 悬浮新建账本 -->
    <view class="fab-create-book" @click="goToCreateAccountBook">
      <view class="fab-create-book-inner">
        <text class="fab-create-book-icon">+</text>
      </view>
    </view>

    <app-tab-bar :current="1" />
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate } from '@/utils/util';
import { hideNativeTabBar } from '@/utils/tabBar';
import { requireWechatLogin } from '@/utils/auth';
import {
  getBookCategoryBadgeStyle,
  getBookCategoryEmoji,
  getBookCardTintStyle
} from '@/utils/iconMap';
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      accountBookTab: 'personal', // 'personal' | 'shared' 选项卡
      statusTab: 'active', // 'all' 全部 | 'active' 进行中 | 'ended' 已结束，默认进行中
      personalAccountBooks: [],
      sharedAccountBooks: [],
      showJoinDialog: false,
      showDeleteConfirmDialog: false,
      shareCode: '',
      joining: false,
      deleting: false,
      deleteTargetBook: null,
      deleteBookType: 0, // 0-个人账本，1-集体账本
      currentShareBook: null // 当前要分享的账本
    };
  },
  computed: {
    ...mapState(['currentAccountBook']),
    // 按状态筛选后的个人账本：全部/进行中/已结束
    displayedPersonalBooks() {
      const list = this.personalAccountBooks || [];
      if (this.statusTab === 'all') return list;
      if (this.statusTab === 'active') return list.filter(b => b.status !== 1);
      return list.filter(b => b.status === 1);
    },
    // 按状态筛选后的集体账本
    displayedSharedBooks() {
      const list = this.sharedAccountBooks || [];
      if (this.statusTab === 'all') return list;
      if (this.statusTab === 'active') return list.filter(b => b.status !== 1);
      return list.filter(b => b.status === 1);
    }
  },
  onLoad() {
    const savedTab = uni.getStorageSync('accountBookTab');
    if (savedTab === 'personal' || savedTab === 'shared') {
      this.accountBookTab = savedTab;
    }
    this.loadAccountBooks();
  },
  onShow() {
    hideNativeTabBar();
    this.loadAccountBooks();
  },
  // 微信小程序分享功能
  onShareAppMessage() {
    if (this.currentShareBook?.shareCode) {
      return {
        title: `邀请你加入集体账本：${this.currentShareBook.name}`,
        path: `/pages/join-account-book/join-account-book?shareCode=${this.currentShareBook.shareCode}`,
        imageUrl: '/static/invite.jpg'
      };
    }
    return {
      title: '乌鸦记账 - 简单好用的记账工具',
      path: '/pages/index/index'
    };
  },
  methods: {
    ...mapActions(['setCurrentAccountBook', 'updateAccountBooks']),
    formatDate,
    getBookCategoryEmoji,
    getBookCategoryBadgeStyle,
    getBookCardTintStyle,

    switchAccountBookTab(tab) {
      this.accountBookTab = tab;
      uni.setStorageSync('accountBookTab', tab);
    },
    
    async loadAccountBooks() {
      // 如果是体验模式，不加载数据
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.personalAccountBooks = [];
        this.sharedAccountBooks = [];
        return;
      }
      
      try {
        // 加载个人账本
        const personalBooks = await api.accountBooks.getList();
        this.personalAccountBooks = personalBooks;
        
        // 加载集体账本
        let sharedBooks = [];
        try {
          sharedBooks = await api.sharedAccountBooks.getList();
        } catch (error) {
          console.error('加载集体账本失败', error);
        }
        this.sharedAccountBooks = sharedBooks;
        
        // 更新 store
        this.updateAccountBooks(personalBooks);
      } catch (error) {
        console.error('加载账本失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    },
    
    async selectAccountBook(book) {
      // 设置账本类型为个人账本
      const accountBook = { ...book, type: 0 };
      await this.setCurrentAccountBook(accountBook);
      uni.showToast({
        title: '切换成功',
        icon: 'success'
      });
      // 延迟返回首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        });
      }, 500);
    },
    
    viewAccountBook(book, type) {
      // 查看账本详情（支持个人账本和集体账本）
      uni.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}&type=${type}`
      });
    },
    
    viewSharedAccountBook(book) {
      // 查看集体账本详情（兼容旧代码）
      this.viewAccountBook(book, 1);
    },
    
    // 设置要分享的账本
    setShareBook(book) {
      this.currentShareBook = book;
    },
    
    // 复制分享码
    copyShareCode(book) {
      if (!book.shareCode) {
        uni.showToast({
          title: '分享码不存在',
          icon: 'none'
        });
        return;
      }
      uni.setClipboardData({
        data: book.shareCode,
        success: () => {
          uni.showToast({
            title: '分享码已复制',
            icon: 'success'
          });
        }
      });
    },
    
    goToCreateAccountBook() {
      if (!requireWechatLogin()) {
        return;
      }
      
      uni.navigateTo({
        url: '/pages/create-shared-account-book/create-shared-account-book'
      });
    },
    
    async joinSharedAccountBook() {
      if (!requireWechatLogin()) {
        return;
      }
      
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
        await this.loadAccountBooks();
        
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
    
    showDeleteDialog(book, type) {
      this.deleteTargetBook = book;
      this.deleteBookType = type;
      this.showDeleteConfirmDialog = true;
    },
    
    async confirmDelete() {
      if (!this.deleteTargetBook) return;
      
      this.deleting = true;
      
      try {
        if (this.deleteBookType === 0) {
          // 删除个人账本
          await api.accountBooks.delete(this.deleteTargetBook.id);
        } else {
          // 删除集体账本
          await api.sharedAccountBooks.delete(this.deleteTargetBook.id);
        }
        
        // 如果删除的是当前账本，清除当前账本
        if (this.currentAccountBook?.id === this.deleteTargetBook.id) {
          await this.setCurrentAccountBook(null);
        }
        
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        this.showDeleteConfirmDialog = false;
        this.deleteTargetBook = null;
        
        // 刷新列表
        await this.loadAccountBooks();
        
      } catch (error) {
        console.error('删除失败', error);
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        });
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.account-books-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

/* 底部悬浮新建（避开 tabBar） */
.fab-create-book {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  box-shadow: 0 8rpx 28rpx rgba(245, 166, 35, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.fab-create-book-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-create-book-icon {
  font-size: 56rpx;
  color: #ffffff;
  font-weight: 300;
  line-height: 1;
  /* 偏下时上移微调 */
  transform: translateY(-6rpx);
}

.action-buttons {
  display: flex;
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  gap: 8rpx;
  
  .action-btn {
    flex: 1;
    border-radius: 12rpx;
    padding: 12rpx 20rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    transition: all 0.3s;
    
    .action-icon {
      font-size: 26rpx;
    }
    
    .action-text {
      font-size: 24rpx;
      font-weight: 500;
    }
    
    &.create-account-book {
      background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      
      .action-text {
        color: #FFFFFF;
      }
    }
    
    &.join-shared {
      background: rgba(245, 166, 35, 0.15);
      border: 2rpx solid rgba(245, 166, 35, 0.5);
      
      .action-text {
        color: #F5A623;
      }
    }
  }
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.account-type-tabs {
  display: flex;
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 6rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  
  .type-tab {
    text-align: center;
    padding: 8rpx 20rpx;
    border-radius: 12rpx;
    transition: all 0.3s;
    
    .tab-text {
      font-size: 24rpx;
      color: #666666;
      font-weight: 500;
    }
    
    &.active.tab-personal {
      background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      
      .tab-text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }

    &.active.tab-shared {
      background: linear-gradient(135deg, #E8940C 0%, #D4820A 100%);
      
      .tab-text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }
  }
}

.status-tags {
  display: flex;
  gap: 12rpx;
  
  .status-tag {
    padding: 6rpx 20rpx;
    border-radius: 12rpx;
    background: #FFFFFF;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s;
    
    .status-tag-text {
      font-size: 22rpx;
      color: #666666;
      font-weight: 500;
    }
    
    &.active.tag-all {
      background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      
      .status-tag-text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }

    &.active.tag-active {
      background: linear-gradient(135deg, #5CB85C 0%, #7BC87E 100%);
      
      .status-tag-text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }

    &.active.tag-ended {
      background: linear-gradient(135deg, #8E99A8 0%, #A8B0BC 100%);
      
      .status-tag-text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }
  }
}

.account-books-section {
  margin-bottom: 32rpx;
}

.account-books-list {
  .account-book-item {
    position: relative;
    display: flex;
    background: #FFFBF5;
    border-radius: 16rpx;
    margin-bottom: 24rpx;
    border: 2rpx solid var(--book-tint-border, rgba(245, 166, 35, 0.15));
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    overflow: hidden;
    
    &.active {
      border-color: var(--book-accent, #F5A623);
      box-shadow: 0 6rpx 20rpx var(--book-tint, rgba(245, 166, 35, 0.12));
    }

    .book-accent {
      width: 8rpx;
      flex-shrink: 0;
      background: var(--book-accent, #F5A623);
    }

    .book-card-inner {
      flex: 1;
      min-width: 0;
      padding: 28rpx 28rpx 28rpx 24rpx;
      background: linear-gradient(135deg, var(--book-tint, rgba(245, 166, 35, 0.06)) 0%, #FFFBF5 42%);
    }
    
    .book-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16rpx;
      margin-bottom: 16rpx;

      .book-title-block {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        gap: 12rpx;
      }

      .book-icon {
        width: 56rpx;
        height: 56rpx;
        border-radius: 14rpx;
        background: var(--book-accent, #F5A623);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4rpx 12rpx var(--book-tint, rgba(245, 166, 35, 0.25));
      }
      
      .book-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        flex: 1;
        min-width: 0;
        line-height: 1.35;
      }
      
      .book-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8rpx;
        align-items: center;
        justify-content: flex-end;
        max-width: 52%;
        
        .badge {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          border: 1rpx solid transparent;
          
          &.category {
            font-weight: 500;
          }

          &.shared-type {
            background: rgba(232, 148, 12, 0.14);
            color: #C8780A;
            border-color: rgba(200, 120, 10, 0.28);
            font-weight: 600;
          }
          
          &.default {
            background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
            color: #FFFFFF;
          }
          
          &.current {
            background: rgba(245, 166, 35, 0.12);
            color: #E8940C;
            border-color: rgba(245, 166, 35, 0.35);
            font-weight: bold;
          }
          
          &.active-status {
            background: rgba(92, 184, 92, 0.12);
            color: #5CB85C;
            border-color: rgba(92, 184, 92, 0.3);
            font-weight: 600;
          }
          
          &.ended {
            background: rgba(142, 153, 168, 0.12);
            color: #8E99A8;
            border-color: rgba(142, 153, 168, 0.3);
          }
        }
      }
    }
    
    .book-description {
      font-size: 24rpx;
      color: #888888;
      margin-bottom: 16rpx;
      display: block;
      line-height: 1.5;
    }
    
    .book-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx 24rpx;
      margin-bottom: 16rpx;
      
      .info-item {
        font-size: 24rpx;
        color: #666666;
        padding: 6rpx 14rpx;
        border-radius: 8rpx;
        background: rgba(255, 255, 255, 0.75);
      }
    }
    
    .book-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16rpx;
      border-top: 1rpx solid rgba(0, 0, 0, 0.05);
      
      .share-code {
        font-size: 24rpx;
        color: var(--book-accent, #F7B84D);
        font-weight: bold;
      }
      
      .book-date {
        font-size: 24rpx;
        color: #BBBBBB;
      }
      
      .book-actions {
        display: flex;
        align-items: center;
        gap: 16rpx;
      }
      
      .book-footer-right {
        display: flex;
        align-items: center;
        gap: 16rpx;
      }
      
      .delete-btn {
        font-size: 24rpx;
        color: #E85D4B;
        padding: 8rpx 16rpx;
        border-radius: 8rpx;
        background: rgba(232, 93, 75, 0.1);
      }
    }
    
    .book-share-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 16rpx;
      margin-top: 16rpx;
      padding-top: 16rpx;
      border-top: 1rpx solid rgba(0, 0, 0, 0.05);
      
      .copy-code-btn {
        font-size: 24rpx;
        color: var(--book-accent, #F7B84D);
        padding: 12rpx 24rpx;
        border-radius: 24rpx;
        background: var(--book-tint, rgba(245, 166, 35, 0.1));
        border: 1rpx solid var(--book-tint-border, rgba(245, 166, 35, 0.2));
      }
      
      .invite-btn {
        font-size: 24rpx;
        color: #FFFFFF;
        padding: 0;
        margin: 0;
        line-height: 1;
        background: linear-gradient(135deg, #E8940C 0%, #F0A83C 100%);
        border: none;
        border-radius: 24rpx;
        
        text {
          display: block;
          padding: 12rpx 24rpx;
        }
        
        &::after {
          border: none;
        }
      }
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
    box-sizing: border-box;
    
    .dialog-input {
      width: 100%;
      background: #F5F5F5;
      border-radius: 16rpx;
      padding: 24rpx;
      font-size: 48rpx;
      font-weight: bold;
      text-align: center;
      letter-spacing: 12rpx;
      border: none;
      box-sizing: border-box;
      min-height: 100rpx;
      line-height: 1.5;
    }
    
    .delete-confirm-text {
      font-size: 32rpx;
      color: #333333;
      font-weight: bold;
      margin-bottom: 16rpx;
      display: block;
      text-align: center;
    }
    
    .delete-warning-text {
      font-size: 24rpx;
      color: #F5A623;
      display: block;
      text-align: center;
      margin-top: 8rpx;
    }
  }
  
  .dialog-footer {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx 32rpx;
    border-top: 1rpx solid #F5F5F5;
    box-sizing: border-box;
    
    .dialog-btn {
      flex: 1;
      height: 88rpx;
      border-radius: 44rpx;
      border: none !important;
      outline: none;
      font-size: 32rpx;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      margin: 0;
      padding: 0;
      line-height: 88rpx;
      
      &::after {
        border: none !important;
        border-radius: 44rpx;
      }
      
      &.cancel {
        background: #F5F5F5 !important;
        color: #666666;
      }
      
      &.confirm {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%) !important;
        color: #FFFFFF;
        box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
      }
      
      &.delete {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%) !important;
        color: #FFFFFF;
      }
    }
  }
}
</style>
