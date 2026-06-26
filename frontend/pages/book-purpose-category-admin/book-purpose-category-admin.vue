<template>
  <view class="page">
    <view class="header">
      <text class="subtitle">为账本用途配置默认关联的二级交易分类，创建账本时将自动勾选</text>
    </view>

    <scroll-view scroll-x class="purpose-scroll" :show-scrollbar="false">
      <view class="purpose-row">
        <view
          v-for="item in purposes"
          :key="item.purpose"
          class="purpose-chip"
          :class="{ active: currentPurpose === item.purpose }"
          @click="switchPurpose(item.purpose)"
        >
          <text>{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="type-tabs">
      <view
        v-for="t in typeTabs"
        :key="t.value"
        class="type-tab"
        :class="{ active: currentType === t.value }"
        @click="currentType = t.value"
      >
        <text>{{ t.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="scroll">
      <view v-for="parent in filteredParents" :key="parent.id" class="block">
        <view class="parent-row">
          <app-icon class="cat-icon" :icon="parent.icon || '📁'" :category-name="parent.name" :size="18" color="#F5A623" />
          <text class="parent-name">{{ parent.name }}</text>
        </view>
        <view
          v-for="child in (parent.children || [])"
          :key="child.id"
          class="child-row"
          @click="toggleCategory(child.id)"
        >
          <app-icon class="cat-icon" :icon="child.icon || '📝'" :category-name="child.name" :size="18" color="#F5A623" />
          <text class="child-name">{{ child.name }}</text>
          <text class="check" :class="{ checked: isSelected(child.id) }">{{ isSelected(child.id) ? '✓' : '' }}</text>
        </view>
        <view v-if="!(parent.children && parent.children.length)" class="empty-child">
          <text>该一级分类下暂无二级分类</text>
        </view>
      </view>
      <view class="tips">
        <text class="tips-line">• 仅可选择二级分类（实际记账类别）</text>
        <text class="tips-line">• 当前用途已选 {{ selectedCategoryIds.length }} 项</text>
      </view>
    </scroll-view>

    <view class="footer-btn-wrap">
      <button class="save-btn" :loading="saving" @click="save">保存关联</button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      purposes: [],
      currentPurpose: 0,
      currentType: 0,
      typeTabs: [
        { value: 0, label: '支出' },
        { value: 1, label: '收入' }
      ],
      expenseTree: [],
      incomeTree: [],
      selectedCategoryIds: [],
      loading: false,
      saving: false
    };
  },
  computed: {
    filteredParents() {
      return this.currentType === 0 ? this.expenseTree : this.incomeTree;
    }
  },
  onLoad() {
    this.checkAdminAndLoad();
  },
  methods: {
    async checkAdminAndLoad() {
      try {
        const isAdmin = await api.feedbacks.checkAdmin();
        if (!isAdmin) {
          uni.showModal({
            title: '无权限',
            content: '您不是管理员，无法访问此页面',
            showCancel: false,
            success: () => uni.navigateBack()
          });
          return;
        }
        await this.init();
      } catch (e) {
        uni.navigateBack();
      }
    },
    async init() {
      this.loading = true;
      try {
        const [purposes, exp, inc] = await Promise.all([
          api.bookPurposeCategories.getPurposes(),
          api.categories.getAdminList(0),
          api.categories.getAdminList(1)
        ]);
        this.purposes = Array.isArray(purposes) ? purposes : [];
        this.expenseTree = Array.isArray(exp) ? exp : [];
        this.incomeTree = Array.isArray(inc) ? inc : [];
        if (this.purposes.length && !this.purposes.some(p => p.purpose === this.currentPurpose)) {
          this.currentPurpose = this.purposes[0].purpose;
        }
        await this.loadSelectedForPurpose(this.currentPurpose);
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    async switchPurpose(purpose) {
      if (purpose === this.currentPurpose) return;
      this.currentPurpose = purpose;
      await this.loadSelectedForPurpose(purpose);
    },
    async loadSelectedForPurpose(purpose) {
      try {
        const config = await api.bookPurposeCategories.getAdminConfig(purpose);
        const list = config && Array.isArray(config.categories) ? config.categories : [];
        this.selectedCategoryIds = list.map(c => c.id);
      } catch (e) {
        this.selectedCategoryIds = [];
      }
    },
    isSelected(id) {
      return this.selectedCategoryIds.indexOf(id) >= 0;
    },
    toggleCategory(id) {
      const i = this.selectedCategoryIds.indexOf(id);
      if (i >= 0) {
        this.selectedCategoryIds = this.selectedCategoryIds.filter(x => x !== id);
      } else {
        this.selectedCategoryIds = [...this.selectedCategoryIds, id];
      }
    },
    async save() {
      if (this.saving) return;
      this.saving = true;
      try {
        await api.bookPurposeCategories.saveAdminConfig(this.currentPurpose, {
          categoryIds: [...this.selectedCategoryIds]
        });
        uni.showToast({ title: '已保存', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '保存失败', icon: 'none' });
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 160rpx;
}

.header {
  padding: 24rpx 32rpx 8rpx;
  .subtitle {
    font-size: 24rpx;
    color: #888;
    line-height: 1.5;
  }
}

.purpose-scroll {
  white-space: nowrap;
  padding: 16rpx 24rpx 0;
}

.purpose-row {
  display: inline-flex;
  gap: 16rpx;
}

.purpose-chip {
  display: inline-flex;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  font-size: 26rpx;
  color: #666;
  &.active {
    background: #F7B84D;
    color: #fff;
    font-weight: 600;
  }
}

.type-tabs {
  display: flex;
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.type-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
  color: #666;
  &.active {
    background: #F7B84D;
    color: #fff;
    font-weight: bold;
  }
}

.loading-wrap {
  padding: 80rpx;
  text-align: center;
  .loading-text { color: #999; font-size: 28rpx; }
}

.scroll {
  max-height: calc(100vh - 360rpx);
  padding: 0 24rpx 24rpx;
}

.block {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.parent-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: rgba(245, 166, 35, 0.08);
}

.parent-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.child-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 24rpx 22rpx 48rpx;
  border-top: 1rpx solid #f0f0f0;
}

.child-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.cat-icon {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.check {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  &.checked {
    background: #F7B84D;
    border-color: #F7B84D;
  }
}

.empty-child {
  padding: 16rpx 24rpx 24rpx 48rpx;
  font-size: 24rpx;
  color: #999;
}

.tips {
  padding: 8rpx 8rpx 32rpx;
  .tips-line {
    display: block;
    font-size: 22rpx;
    color: #999;
    line-height: 1.6;
  }
}

.footer-btn-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #f5f5f5 40%);
}

.save-btn {
  background: linear-gradient(135deg, #F7B84D 0%, #F5A623 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 30rpx;
  border: none;
}
</style>
