<template>
  <view class="page">
    <view class="header">
      <text class="subtitle">管理系统默认收支分类（二级为实际记账类别）</text>
    </view>

    <view class="type-tabs">
      <view
        v-for="t in typeTabs"
        :key="t.value"
        class="type-tab"
        :class="{ active: currentType === t.value }"
        @click="onTypeChange(t.value)"
      >
        <text>{{ t.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="scroll" :scroll-with-animation="true">
      <view v-for="parent in tree" :key="parent.id" class="block">
        <view class="row parent-row">
          <app-icon class="cat-icon" :icon="parent.icon || '📁'" :category-name="parent.name" :size="18" color="#F5A623" />
          <view class="row-main">
            <text class="level-tag">一级</text>
            <text class="cat-name">{{ parent.name }}</text>
            <text v-if="parent.isUsed" class="badge used">已使用</text>
          </view>
          <switch
            :checked="parent.isVisible"
            color="#F7B84D"
            @change="onVisibleChange(parent, $event)"
          />
          <text class="link-btn" @click="openEdit(parent, true)">编辑</text>
          <text
            v-if="!parent.isUsed"
            class="link-btn danger"
            @click="confirmDelete(parent)"
          >删除</text>
        </view>

        <view
          v-for="child in (parent.children || [])"
          :key="child.id"
          class="row child-row"
        >
          <app-icon class="cat-icon" :icon="child.icon || '📝'" :category-name="child.name" :size="18" color="#F5A623" />
          <view class="row-main">
            <text class="level-tag sub">二级</text>
            <text class="cat-name">{{ child.name }}</text>
            <text v-if="child.isUsed" class="badge used">已使用</text>
          </view>
          <switch
            :checked="child.isVisible"
            color="#F7B84D"
            @change="onVisibleChange(child, $event)"
          />
          <text class="link-btn" @click="openEdit(child, false)">编辑</text>
          <text
            v-if="!child.isUsed"
            class="link-btn danger"
            @click="confirmDelete(child)"
          >删除</text>
        </view>
      </view>

      <view class="tips">
        <text class="tips-line">• 已使用的类别不可改名或删除，仅可关闭「展示」</text>
        <text class="tips-line">• 删除一级前请先删除其下二级分类</text>
      </view>
    </scroll-view>

    <view class="footer-btn-wrap">
      <button class="add-btn" @click="onAddTap">新增分类</button>
    </view>

    <!-- 编辑/新增弹层 -->
    <view v-if="showForm" class="mask" @click="closeForm">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">{{ formMode === 'add' ? '新增分类' : '编辑分类' }}</text>
          <text class="sheet-close" @click="closeForm">×</text>
        </view>
        <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="true">
          <view v-if="formMode === 'add'" class="field">
            <text class="label">级别</text>
            <text class="value">{{ formIsParent ? '一级（分组）' : '二级（记账类别）' }}</text>
          </view>
          <view v-if="!formIsParent" class="field">
            <text class="label">所属一级</text>
            <picker
              v-if="!form.isUsed"
              mode="selector"
              :range="parentPickerLabels"
              :value="parentPickerIndex"
              @change="onParentPick"
            >
              <view class="picker-value">{{ parentPickerLabels[parentPickerIndex] || '请选择' }}</view>
            </picker>
            <view v-else class="picker-value muted">{{ parentPickerLabels[parentPickerIndex] || '—' }}</view>
          </view>
          <view class="field">
            <text class="label">名称</text>
            <input
              class="input"
              placeholder-class="input-ph"
              v-model="form.name"
              :disabled="form.isUsed"
              placeholder="分类名称"
              maxlength="50"
            />
          </view>
          <view class="field">
            <text class="label">图标</text>
            <input
              class="input"
              placeholder-class="input-ph"
              v-model="form.icon"
              :disabled="form.isUsed"
              placeholder="如 emoji"
              maxlength="20"
            />
          </view>
          <view class="field">
            <text class="label">颜色</text>
            <input
              class="input"
              placeholder-class="input-ph"
              v-model="form.color"
              :disabled="form.isUsed"
              placeholder="#RRGGBB"
              maxlength="20"
            />
          </view>
          <view class="field">
            <text class="label">排序</text>
            <input
              class="input"
              placeholder-class="input-ph"
              type="number"
              v-model="form.sortOrder"
              :disabled="form.isUsed"
              placeholder="数字越小越靠前"
            />
          </view>
          <view class="field row-between">
            <text class="label">展示</text>
            <switch :checked="form.isVisible" color="#F7B84D" @change="e => (form.isVisible = e.detail.value)" />
          </view>
          <view class="sheet-scroll-pad" />
        </scroll-view>
        <view class="sheet-footer" @tap.stop>
          <view
            class="save-sheet"
            :class="{ 'save-sheet--loading': saving }"
            @tap.stop="submitForm"
          >
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
      currentType: 0,
      typeTabs: [
        { value: 0, label: '支出' },
        { value: 1, label: '收入' }
      ],
      tree: [],
      loading: false,
      showForm: false,
      formMode: 'add',
      formIsParent: true,
      form: {
        id: null,
        name: '',
        icon: '',
        color: '#F5A623',
        type: 0,
        parentId: null,
        sortOrder: 0,
        isVisible: true,
        isUsed: false
      },
      parentPickerIndex: 0,
      saving: false
    };
  },
  computed: {
    parentPickerLabels() {
      return this.tree.map((p) => p.name);
    }
  },
  onLoad() {
    this.load();
  },
  methods: {
    onTypeChange(val) {
      this.currentType = val;
      this.load();
    },
    async load() {
      this.loading = true;
      try {
        const res = await api.categories.getAdminList(this.currentType);
        this.tree = Array.isArray(res) ? res : [];
      } catch (e) {
        this.tree = [];
      } finally {
        this.loading = false;
      }
    },
    async onVisibleChange(cat, e) {
      const next = e.detail.value;
      const payload = {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        parentId: cat.parentId != null ? cat.parentId : null,
        sortOrder: cat.sortOrder != null ? cat.sortOrder : 0,
        isVisible: next
      };
      try {
        await api.categories.updateAdmin(cat.id, payload);
        cat.isVisible = next;
        uni.showToast({ title: '已更新', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: err.message || '失败', icon: 'none' });
        cat.isVisible = !next;
      }
    },
    openEdit(cat, isParent) {
      this.formMode = 'edit';
      this.formIsParent = isParent;
      this.form = {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '',
        color: cat.color || '#F5A623',
        type: cat.type,
        parentId: cat.parentId,
        sortOrder: String(cat.sortOrder ?? 0),
        isVisible: cat.isVisible !== false,
        isUsed: !!cat.isUsed
      };
      if (!isParent) {
        const idx = this.tree.findIndex((p) => p.id === cat.parentId);
        this.parentPickerIndex = idx >= 0 ? idx : 0;
      }
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    onAddTap() {
      uni.showActionSheet({
        itemList: ['一级分类（分组）', '二级分类（记账）'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.startAdd(true);
          } else if (res.tapIndex === 1) {
            if (!this.tree.length) {
              uni.showToast({ title: '请先添加一级分类', icon: 'none' });
              return;
            }
            this.startAdd(false);
          }
        }
      });
    },
    startAdd(isParent) {
      this.formMode = 'add';
      this.formIsParent = isParent;
      this.form = {
        id: null,
        name: '',
        icon: isParent ? '📁' : '📝',
        color: '#F5A623',
        type: this.currentType,
        parentId: isParent ? null : this.tree[0]?.id ?? null,
        sortOrder: '0',
        isVisible: true,
        isUsed: false
      };
      this.parentPickerIndex = 0;
      this.showForm = true;
    },
    onParentPick(e) {
      this.parentPickerIndex = Number(e.detail.value);
      const p = this.tree[this.parentPickerIndex];
      if (p) this.form.parentId = p.id;
    },
    buildPayload() {
      const sort = parseInt(String(this.form.sortOrder), 10);
      let parentId = null;
      if (!this.formIsParent) {
        const p = this.tree[this.parentPickerIndex];
        parentId = p ? p.id : this.form.parentId;
      }
      return {
        name: (this.form.name || '').trim(),
        icon: this.form.icon || null,
        color: this.form.color || null,
        type: this.form.type,
        parentId,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        isVisible: !!this.form.isVisible
      };
    },
    async submitForm() {
      if (this.saving) return;
      const payload = this.buildPayload();
      if (!payload.name) {
        uni.showToast({ title: '请填写名称', icon: 'none' });
        return;
      }
      if (!this.formIsParent && (payload.parentId === null || payload.parentId === undefined)) {
        uni.showToast({ title: '请选择所属一级', icon: 'none' });
        return;
      }
      if (this.formMode === 'edit' && (this.form.id === null || this.form.id === undefined || this.form.id === '')) {
        uni.showToast({ title: '数据异常，请关闭后重试', icon: 'none' });
        return;
      }
      this.saving = true;
      try {
        if (this.formMode === 'add') {
          await api.categories.createAdmin(payload);
          uni.showToast({ title: '已添加', icon: 'success' });
        } else {
          await api.categories.updateAdmin(Number(this.form.id), payload);
          uni.showToast({ title: '已保存', icon: 'success' });
        }
        this.closeForm();
        await this.load();
      } catch (e) {
        const msg = (e && e.message) ? e.message : '保存失败';
        uni.showToast({ title: msg, icon: 'none', duration: 2500 });
      } finally {
        this.saving = false;
      }
    },
    confirmDelete(cat) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除「${cat.name}」吗？`,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await api.categories.deleteAdmin(cat.id);
            uni.showToast({ title: '已删除', icon: 'success' });
            await this.load();
          } catch (e) {
            uni.showToast({ title: (e && e.message) || '删除失败', icon: 'none' });
          }
        }
      });
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
  .loading-text {
    color: #999;
    font-size: 28rpx;
  }
}

.scroll {
  max-height: calc(100vh - 280rpx);
  padding: 0 24rpx 24rpx;
}

.block {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-wrap: wrap;
  gap: 8rpx;
}

.parent-row {
  background: rgba(245, 166, 35, 0.08);
}

.child-row {
  padding-left: 48rpx;
}

.cat-icon {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-main {
  flex: 1;
  min-width: 200rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.level-tag {
  font-size: 20rpx;
  color: #F7B84D;
  border: 1rpx solid #F7B84D;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  &.sub {
    color: #888;
    border-color: #ccc;
  }
}

.cat-name {
  font-size: 28rpx;
  color: #333;
}

.badge.used {
  font-size: 20rpx;
  color: #fff;
  background: #F5A623;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.link-btn {
  font-size: 24rpx;
  color: #F7B84D;
  padding: 8rpx 12rpx;
  &.danger {
    color: #F5A623;
  }
}

.tips {
  padding: 16rpx 8rpx 32rpx;
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

.add-btn {
  background: linear-gradient(135deg, #F7B84D 0%, #44a08d 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 30rpx;
  border: none;
}

.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.sheet {
  display: flex;
  flex-direction: column;
  width: 86vw;
  max-width: 760rpx;
  height: 100vh;
  max-height: 100vh;
  background: #fff;
  border-radius: 24rpx 0 0 24rpx;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  animation: slide-in-right 0.24s ease-out;
}

.sheet-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #eee;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: bold;
}

.sheet-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.sheet-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx 32rpx 8rpx;
}

.sheet-scroll-pad {
  height: 24rpx;
}

.sheet-footer {
  position: relative;
  z-index: 20;
  flex-shrink: 0;
  padding: 12rpx 32rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #fff;
  box-shadow: -8rpx 0 24rpx rgba(0, 0, 0, 0.06);
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0.98;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.field {
  margin-bottom: 28rpx;
  .label {
    display: block;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;
  }
  .value {
    font-size: 28rpx;
    color: #333;
  }
  &.row-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* 与 height 同值的 line-height + 仅水平 padding，避免未聚焦时文字偏上（小程序 input 常见表现） */
.input {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.picker-value {
  min-height: 96rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  line-height: 1.4;
  &.muted {
    color: #999;
    background: #f5f5f5;
  }
}

.save-sheet {
  width: 100%;
  margin: 0;
  height: 96rpx;
  line-height: 96rpx;
  background: #F7B84D;
  color: #fff;
  border-radius: 48rpx;
  font-size: 30rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  &--loading {
    opacity: 0.85;
  }
}
</style>

<style lang="scss">
/* 小程序原生 input 的 placeholder 需非 scoped */
.input-ph {
  line-height: 96rpx;
  font-size: 30rpx;
  color: #bbbbbb;
}
</style>
