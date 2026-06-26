<template>
  <view class="page">
    <view class="header">
      <text class="subtitle">管理记账页可选支付方式，支持自定义、排序与展示开关</text>
    </view>

    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="scroll" :scroll-with-animation="true">
      <view v-for="(item, index) in list" :key="item.id" class="row">
        <view class="sort-actions">
          <text class="sort-btn" :class="{ disabled: index === 0 }" @click="moveUp(index)">↑</text>
          <text class="sort-btn" :class="{ disabled: index === list.length - 1 }" @click="moveDown(index)">↓</text>
        </view>
        <view class="row-icon" :style="{ backgroundColor: item.color || '#F5F5F5' }">
          <app-icon :icon="item.icon || '💳'" :category-name="item.name" :size="18" color="#FFFFFF" />
        </view>
        <view class="row-main">
          <text class="row-name">{{ item.name }}</text>
          <text class="row-meta">编码 {{ item.value }}</text>
          <text v-if="item.isUsed" class="badge used">已使用</text>
        </view>
        <switch :checked="item.isVisible" color="#F7B84D" @change="onVisibleChange(item, $event)" />
        <text class="link-btn" @click="openEdit(item)">编辑</text>
        <text v-if="!item.isUsed" class="link-btn danger" @click="confirmDelete(item)">删除</text>
      </view>

      <view class="tips">
        <text class="tips-line">• 已使用的支付方式不可改名或删除，仅可调整展示与排序</text>
        <text class="tips-line">• 新增项编码可不填，系统自动分配（6-98）</text>
      </view>
    </scroll-view>

    <view class="footer-btn-wrap">
      <button class="add-btn" @click="openAdd">新增支付方式</button>
    </view>

    <view v-if="showForm" class="mask" @click="closeForm">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">{{ formMode === 'add' ? '新增支付方式' : '编辑支付方式' }}</text>
          <text class="sheet-close" @click="closeForm">×</text>
        </view>
        <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="true">
          <view class="field">
            <text class="label">名称</text>
            <input class="input" v-model="form.name" :disabled="form.isUsed" placeholder="如：支付宝" maxlength="50" />
          </view>
          <view class="field">
            <text class="label">编码</text>
            <input
              class="input"
              type="number"
              v-model="form.value"
              :disabled="formMode === 'edit' && form.isUsed"
              placeholder="留空自动分配"
            />
          </view>
          <view class="field">
            <text class="label">图标</text>
            <input class="input" v-model="form.icon" :disabled="form.isUsed" placeholder="emoji 或图标名" maxlength="20" />
          </view>
          <view class="field">
            <text class="label">颜色</text>
            <input class="input" v-model="form.color" :disabled="form.isUsed" placeholder="#RRGGBB" maxlength="20" />
          </view>
          <view class="field">
            <text class="label">排序</text>
            <input class="input" type="number" v-model="form.sortOrder" placeholder="数字越小越靠前" />
          </view>
          <view class="field row-between">
            <text class="label">展示</text>
            <switch :checked="form.isVisible" color="#F7B84D" @change="e => (form.isVisible = e.detail.value)" />
          </view>
          <view class="sheet-scroll-pad" />
        </scroll-view>
        <view class="sheet-footer" @tap.stop>
          <view class="save-sheet" :class="{ 'save-sheet--loading': saving }" @tap.stop="submitForm">
            <text>{{ saving ? '保存中...' : '保存' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      list: [],
      loading: false,
      showForm: false,
      formMode: 'add',
      saving: false,
      form: {
        id: null,
        name: '',
        value: '',
        icon: '💳',
        color: '#1677FF',
        sortOrder: '0',
        isVisible: true,
        isUsed: false
      }
    };
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
        await this.load();
      } catch (e) {
        uni.navigateBack();
      }
    },
    async load() {
      this.loading = true;
      try {
        const res = await api.paymentMethodTypes.getAdminList();
        this.list = Array.isArray(res) ? res : [];
      } catch (e) {
        this.list = [];
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    buildPayload() {
      const sort = parseInt(String(this.form.sortOrder), 10);
      const valueRaw = String(this.form.value ?? '').trim();
      const payload = {
        name: (this.form.name || '').trim(),
        icon: this.form.icon || null,
        color: this.form.color || null,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        isVisible: !!this.form.isVisible
      };
      if (valueRaw !== '') {
        payload.value = parseInt(valueRaw, 10);
      }
      return payload;
    },
    async onVisibleChange(item, e) {
      const next = e.detail.value;
      const payload = {
        name: item.name,
        icon: item.icon,
        color: item.color,
        value: item.value,
        sortOrder: item.sortOrder ?? 0,
        isVisible: next
      };
      try {
        await api.paymentMethodTypes.updateAdmin(item.id, payload);
        item.isVisible = next;
        uni.showToast({ title: '已更新', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: err.message || '失败', icon: 'none' });
        item.isVisible = !next;
      }
    },
    openAdd() {
      this.formMode = 'add';
      this.form = {
        id: null,
        name: '',
        value: '',
        icon: '💳',
        color: '#1677FF',
        sortOrder: String(this.list.length),
        isVisible: true,
        isUsed: false
      };
      this.showForm = true;
    },
    openEdit(item) {
      this.formMode = 'edit';
      this.form = {
        id: item.id,
        name: item.name,
        value: String(item.value),
        icon: item.icon || '',
        color: item.color || '#1677FF',
        sortOrder: String(item.sortOrder ?? 0),
        isVisible: item.isVisible !== false,
        isUsed: !!item.isUsed
      };
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    async submitForm() {
      if (this.saving) return;
      const payload = this.buildPayload();
      if (!payload.name) {
        uni.showToast({ title: '请输入名称', icon: 'none' });
        return;
      }
      this.saving = true;
      try {
        if (this.formMode === 'add') {
          await api.paymentMethodTypes.createAdmin(payload);
        } else {
          await api.paymentMethodTypes.updateAdmin(this.form.id, payload);
        }
        this.closeForm();
        await this.load();
        uni.showToast({ title: '已保存', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: err.message || '保存失败', icon: 'none' });
      } finally {
        this.saving = false;
      }
    },
    confirmDelete(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除「${item.name}」吗？`,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await api.paymentMethodTypes.deleteAdmin(item.id);
            await this.load();
            uni.showToast({ title: '已删除', icon: 'success' });
          } catch (err) {
            uni.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      });
    },
    async persistOrder() {
      await api.paymentMethodTypes.reorderAdmin({
        orderedIds: this.list.map(item => item.id)
      });
    },
    async moveUp(index) {
      if (index <= 0) return;
      const next = [...this.list];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      this.list = next;
      try {
        await this.persistOrder();
        await this.load();
      } catch (err) {
        uni.showToast({ title: err.message || '排序失败', icon: 'none' });
        await this.load();
      }
    },
    async moveDown(index) {
      if (index >= this.list.length - 1) return;
      const next = [...this.list];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      this.list = next;
      try {
        await this.persistOrder();
        await this.load();
      } catch (err) {
        uni.showToast({ title: err.message || '排序失败', icon: 'none' });
        await this.load();
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

.loading-wrap {
  padding: 80rpx 0;
  text-align: center;
  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.scroll {
  max-height: calc(100vh - 220rpx);
  padding: 16rpx 24rpx 0;
  box-sizing: border-box;
}

.row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 16rpx;
  margin-bottom: 16rpx;
}

.sort-actions {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex-shrink: 0;
}

.sort-btn {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: #F5A623;
  background: #FFF8EB;
  border-radius: 8rpx;

  &.disabled {
    color: #ccc;
    background: #f5f5f5;
  }
}

.row-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
}

.row-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.row-meta {
  font-size: 22rpx;
  color: #999;
}

.badge.used {
  font-size: 20rpx;
  color: #F5A623;
  background: rgba(245, 166, 35, 0.12);
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.link-btn {
  font-size: 24rpx;
  color: #F5A623;
  flex-shrink: 0;
  padding: 0 4rpx;

  &.danger {
    color: #e74c3c;
  }
}

.tips {
  padding: 8rpx 8rpx 24rpx;
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
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.add-btn {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.sheet-close {
  font-size: 44rpx;
  color: #999;
  line-height: 1;
}

.sheet-scroll {
  flex: 1;
  min-height: 0;
  padding: 16rpx 32rpx 0;
  box-sizing: border-box;
}

.field {
  margin-bottom: 24rpx;
  .label {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 10rpx;
  }
  .input {
    width: 100%;
    height: 80rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
  &.row-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .label {
      margin-bottom: 0;
    }
  }
}

.sheet-scroll-pad {
  height: 24rpx;
}

.sheet-footer {
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.save-sheet {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;

  &--loading {
    opacity: 0.7;
  }
}
</style>
