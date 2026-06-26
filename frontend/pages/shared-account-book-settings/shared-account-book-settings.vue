<template>
  <view class="settings-container">
    <view class="form-section">
      <text class="form-label">账本名称</text>
      <input 
        class="form-input" 
        v-model="form.name"
        placeholder="请输入账本名称"
      />
    </view>
    
    <view class="form-section">
      <text class="form-label">账本描述</text>
      <textarea 
        class="form-textarea" 
        v-model="form.description"
        placeholder="描述一下这个集体账本的用途"
        maxlength="200"
      />
    </view>
    
    <view class="form-section">
      <text class="form-label">开始日期（可选）</text>
      <picker 
        mode="date" 
        :value="form.startDate"
        @change="onStartDateChange"
      >
        <view class="picker-input">
          <text :class="form.startDate ? 'picker-text' : 'picker-placeholder'">
            {{ form.startDate || '请选择开始日期' }}
          </text>
        </view>
      </picker>
    </view>
    
    <view class="form-section">
      <text class="form-label">结束日期（可选）</text>
      <picker 
        mode="date" 
        :value="form.endDate"
        :start="form.startDate"
        @change="onEndDateChange"
      >
        <view class="picker-input">
          <text :class="form.endDate ? 'picker-text' : 'picker-placeholder'">
            {{ form.endDate || '请选择结束日期' }}
          </text>
        </view>
      </picker>
    </view>
    
    <view class="form-section">
      <text class="form-label">预算金额</text>
      <input 
        class="form-input" 
        type="digit"
        v-model="form.budget"
        placeholder="0.00"
      />
    </view>
    
    <view class="form-section">
      <text class="form-label">账本状态</text>
      <picker 
        :range="statusOptions" 
        :value="statusIndex"
        @change="onStatusChange"
      >
        <view class="picker-view">
          <text>{{ statusOptions[statusIndex] }}</text>
          <text class="picker-arrow">></text>
        </view>
      </picker>
    </view>
    
    <view class="form-section">
      <text class="form-label">默认币种</text>
      <picker 
        :range="defaultCurrencyPickerOptions" 
        range-key="label"
        :value="defaultCurrencyIndex"
        @change="onDefaultCurrencyChange"
      >
        <view class="picker-input">
          <text :class="form.defaultCurrency !== null && form.defaultCurrency !== undefined ? 'picker-text' : 'picker-placeholder'">
            {{ defaultCurrencyLabel || '不设置（使用全局默认）' }}
          </text>
        </view>
      </picker>
      <text class="form-hint">记账时默认选中的币种</text>
    </view>
    
    <view class="form-section">
      <text class="form-label">账本启用币种</text>
      <view class="currency-multi-hint">不勾选任何项表示使用您全局启用的全部币种</view>
      <view class="currency-check-list">
        <view 
          v-for="opt in currencyOptions" 
          :key="opt.value"
          class="currency-check-item"
          @click="toggleEnabledCurrency(opt.value)"
        >
          <text class="currency-check-symbol">{{ opt.symbol }}</text>
          <text class="currency-check-name">{{ opt.name }}</text>
          <text class="currency-check-box" :class="{ checked: isCurrencyEnabled(opt.value) }">{{ isCurrencyEnabled(opt.value) ? '✓' : '' }}</text>
        </view>
      </view>
    </view>
    
    <view class="form-section">
      <text class="form-label">关联交易类别</text>
      <view class="linked-category-hint">选择后，记账时仅展示这些类别；不选则展示全部</view>
      <view class="linked-category-tree">
        <view v-for="group in linkedCategoryGroups" :key="group.typeLabel" class="linked-type-group">
          <text class="linked-type-label">{{ group.typeLabel }}</text>
          <view v-for="parent in group.parents" :key="parent.id" class="linked-parent-block">
            <view 
              class="linked-category-item linked-parent"
              @click="toggleLinkedCategory(parent.id)"
            >
              <app-icon v-if="parent.icon || parent.name" class="linked-cat-icon" :icon="parent.icon" :category-name="parent.name" :size="16" color="#F5A623" />
              <text class="linked-cat-name">{{ parent.name }}</text>
              <text class="linked-cat-check" :class="{ checked: isLinkedCategorySelected(parent.id) }">{{ isLinkedCategorySelected(parent.id) ? '✓' : '' }}</text>
            </view>
            <view v-for="child in (parent.children || [])" :key="child.id" class="linked-child-row">
              <view 
                class="linked-category-item linked-child"
                @click="toggleLinkedCategory(child.id)"
              >
                <text class="linked-cat-name">{{ child.name }}</text>
                <text class="linked-cat-check" :class="{ checked: isLinkedCategorySelected(child.id) }">{{ isLinkedCategorySelected(child.id) ? '✓' : '' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="submit-section">
      <button class="submit-btn" @click="updateSharedAccountBook" :loading="updating">
        保存
      </button>
    </view>
    
    <view class="danger-section" v-if="isCreator">
      <button class="danger-btn" @click="deleteSharedAccountBook">
        删除集体账本
      </button>
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
      form: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 0,
        defaultCurrency: null,
        enabledCurrencyIds: [],
        linkedCategoryIds: []
      },
      currencyOptions: [],
      linkedCategoryOptions: [],
      linkedCategoryGroups: [],
      statusOptions: ['进行中', '已结束'],
      statusIndex: 0,
      updating: false
    };
  },
  computed: {
    ...mapState(['userInfo']),
    defaultCurrencyPickerOptions() {
      return [{ value: null, name: '', symbol: '', label: '不设置（使用全局默认）' }, ...this.currencyOptions];
    },
    defaultCurrencyIndex() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === undefined) return 0;
      const i = this.defaultCurrencyPickerOptions.findIndex(o => o.value === this.form.defaultCurrency);
      return i >= 0 ? i : 0;
    },
    defaultCurrencyLabel() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === undefined) return '';
      const o = this.currencyOptions.find(o => o.value === this.form.defaultCurrency);
      return o ? `${o.symbol} ${o.name}` : '';
    },
    isCreator() {
      return this.sharedAccountBook && this.userInfo && 
             this.sharedAccountBook.creatorId === this.userInfo.id;
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
        await this.loadCurrencyOptions();
        await this.loadLinkedCategoryOptions();
        this.sharedAccountBook = await api.sharedAccountBooks.getById(this.sharedAccountBookId);
        this.form.name = this.sharedAccountBook.name;
        this.form.description = this.sharedAccountBook.description || '';
        this.form.startDate = this.sharedAccountBook.startDate ? this.formatDate(this.sharedAccountBook.startDate) : '';
        this.form.endDate = this.sharedAccountBook.endDate ? this.formatDate(this.sharedAccountBook.endDate) : '';
        this.form.budget = this.sharedAccountBook.budget ? this.sharedAccountBook.budget.toString() : '';
        this.form.status = this.sharedAccountBook.status;
        this.statusIndex = this.sharedAccountBook.status;
        this.form.defaultCurrency = this.sharedAccountBook.defaultCurrency ?? null;
        this.form.enabledCurrencyIds = Array.isArray(this.sharedAccountBook.enabledCurrencyIds) ? [...this.sharedAccountBook.enabledCurrencyIds] : [];
        this.form.linkedCategoryIds = Array.isArray(this.sharedAccountBook.linkedCategoryIds) ? [...this.sharedAccountBook.linkedCategoryIds] : [];
      } catch (error) {
        console.error('加载数据失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    onStartDateChange(e) {
      this.form.startDate = e.detail.value;
      // 如果结束日期早于开始日期，清空结束日期
      if (this.form.endDate && this.form.endDate < this.form.startDate) {
        this.form.endDate = '';
      }
    },
    
    onEndDateChange(e) {
      this.form.endDate = e.detail.value;
      // 验证结束日期不能早于开始日期
      if (this.form.startDate && this.form.endDate < this.form.startDate) {
        uni.showToast({
          title: '结束日期不能早于开始日期',
          icon: 'none'
        });
        this.form.endDate = '';
        return;
      }
    },
    
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.form.status = this.statusIndex;
    },
    
    async loadCurrencyOptions() {
      try {
        const rates = await api.currencyRates.getEnabled();
        this.currencyOptions = rates.map(r => ({
          value: r.currency,
          name: r.currencyName,
          symbol: r.currencySymbol,
          label: `${r.currencySymbol} ${r.currencyName}`
        }));
        if (this.currencyOptions.length === 0) {
          this.currencyOptions = [{ value: 0, name: '人民币', symbol: '¥', label: '¥ 人民币' }];
        }
      } catch (e) {
        this.currencyOptions = [{ value: 0, name: '人民币', symbol: '¥', label: '¥ 人民币' }];
      }
    },
    onDefaultCurrencyChange(e) {
      const idx = parseInt(e.detail.value, 10);
      const opts = this.defaultCurrencyPickerOptions;
      if (opts[idx]) {
        this.form.defaultCurrency = opts[idx].value;
      }
    },
    isCurrencyEnabled(value) {
      if (!this.form.enabledCurrencyIds || this.form.enabledCurrencyIds.length === 0) return true;
      return this.form.enabledCurrencyIds.includes(value);
    },
    toggleEnabledCurrency(value) {
      if (!this.form.enabledCurrencyIds) this.form.enabledCurrencyIds = [];
      const allIds = this.currencyOptions.map(o => o.value);
      if (this.form.enabledCurrencyIds.length === 0) {
        this.form.enabledCurrencyIds = allIds.filter(id => id !== value);
      } else {
        const i = this.form.enabledCurrencyIds.indexOf(value);
        if (i >= 0) {
          this.form.enabledCurrencyIds = this.form.enabledCurrencyIds.filter(id => id !== value);
        } else {
          this.form.enabledCurrencyIds = [...this.form.enabledCurrencyIds, value];
        }
      }
    },
    
    async loadLinkedCategoryOptions() {
      try {
        const [exp, inc] = await Promise.all([
          api.categories.getList(0),
          api.categories.getList(1)
        ]);
        const flat = (arr, typeLabel) => {
          const out = [];
          for (const p of arr || []) {
            out.push({ id: p.id, name: p.name, type: p.type, typeLabel });
            for (const c of p.children || []) {
              out.push({ id: c.id, name: c.name, type: c.type, typeLabel });
            }
          }
          return out;
        };
        this.linkedCategoryOptions = [...flat(exp, '支出'), ...flat(inc, '收入')];
        const toGroup = (arr, typeLabel) => ({
          typeLabel,
          parents: (arr || []).map(p => ({
            id: p.id,
            name: p.name,
            icon: p.icon,
            color: p.color,
            children: (p.children || []).map(c => ({ id: c.id, name: c.name, type: c.type }))
          }))
        });
        this.linkedCategoryGroups = [
          ...(exp && exp.length ? [toGroup(exp, '支出')] : []),
          ...(inc && inc.length ? [toGroup(inc, '收入')] : [])
        ];
      } catch (e) {
        this.linkedCategoryOptions = [];
        this.linkedCategoryGroups = [];
      }
    },
    isLinkedCategorySelected(id) {
      return this.form.linkedCategoryIds && this.form.linkedCategoryIds.indexOf(id) >= 0;
    },
    toggleLinkedCategory(id) {
      if (!this.form.linkedCategoryIds) this.form.linkedCategoryIds = [];
      const i = this.form.linkedCategoryIds.indexOf(id);
      if (i >= 0) {
        this.form.linkedCategoryIds = this.form.linkedCategoryIds.filter(x => x !== id);
      } else {
        this.form.linkedCategoryIds = [...this.form.linkedCategoryIds, id];
      }
    },
    
    async updateSharedAccountBook() {
      if (!this.form.name.trim()) {
        uni.showToast({
          title: '请输入账本名称',
          icon: 'none'
        });
        return;
      }
      
      this.updating = true;
      
      try {
        // 验证日期
        if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
          uni.showToast({
            title: '结束日期不能早于开始日期',
            icon: 'none'
          });
          return;
        }
        
        await api.sharedAccountBooks.update(this.sharedAccountBookId, {
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          startDate: this.form.startDate || null,
          endDate: this.form.endDate || null,
          budget: this.form.budget ? parseFloat(this.form.budget) : null,
          status: this.form.status,
          defaultCurrency: this.form.defaultCurrency ?? undefined,
          enabledCurrencyIds: (this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0) ? this.form.enabledCurrencyIds : undefined,
          linkedCategoryIds: (this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0) ? this.form.linkedCategoryIds : undefined
        });
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
        
      } catch (error) {
        console.error('更新失败', error);
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        });
      } finally {
        this.updating = false;
      }
    },
    
    async deleteSharedAccountBook() {
      uni.showModal({
        title: '确认删除',
        content: '删除集体账本将同时删除所有相关数据，此操作不可恢复！',
        confirmColor: '#F5A623',
        success: async (res) => {
          if (res.confirm) {
            try {
              await api.sharedAccountBooks.delete(this.sharedAccountBookId);
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            } catch (error) {
              uni.showToast({
                title: error.message || '删除失败',
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
.settings-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.form-section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  
  .form-label {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .form-input {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    background: #F5F5F5;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    border: none;
    box-sizing: border-box;
  }
  
  .form-textarea {
    width: 100%;
    min-height: 120rpx;
    background: #F5F5F5;
    border-radius: 16rpx;
    padding: 24rpx;
    font-size: 28rpx;
    border: none;
    box-sizing: border-box;
  }
  
  .picker-input {
    width: 100%;
    background: #F5F5F5;
    border-radius: 16rpx;
    padding: 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    
    .picker-text {
      color: #333333;
    }
    
    .picker-placeholder {
      color: #999999;
    }
  }
  
  .picker-view {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F5F5F5;
    border-radius: 16rpx;
    padding: 24rpx;
    font-size: 28rpx;
    color: #333333;
    box-sizing: border-box;
    
    .picker-arrow {
      color: #999999;
    }
  }
  
  .form-hint {
    font-size: 24rpx;
    color: #999999;
    margin-top: 16rpx;
    display: block;
  }
  
  .currency-multi-hint {
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 16rpx;
  }
  
  .currency-check-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }
  
  .currency-check-item {
    display: flex;
    align-items: center;
    padding: 16rpx 20rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    min-width: 140rpx;
    
    .currency-check-symbol {
      font-size: 28rpx;
      margin-right: 8rpx;
      font-weight: bold;
    }
    .currency-check-name {
      font-size: 24rpx;
      color: #333;
      flex: 1;
    }
    .currency-check-box {
      width: 36rpx;
      height: 36rpx;
      border: 2rpx solid #ddd;
      border-radius: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      color: #fff;
      margin-left: 8rpx;
      
      &.checked {
        background: #F7B84D;
        border-color: #F7B84D;
      }
    }
  }
  
  .linked-category-hint {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
  }
  
  .linked-category-tree {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }
  
  .linked-type-group {
    .linked-type-label {
      display: block;
      font-size: 24rpx;
      font-weight: bold;
      color: #666;
      margin-bottom: 12rpx;
      padding-left: 8rpx;
      border-left: 4rpx solid #F7B84D;
    }
    .linked-parent-block {
      margin-bottom: 12rpx;
    }
    .linked-parent {
      background: #F0F9F8;
      border-left: 4rpx solid #F7B84D;
    }
    .linked-child-row {
      padding-left: 32rpx;
      margin-top: 8rpx;
    }
    .linked-child {
      background: #F8F8F8;
      border-left: 2rpx solid #ddd;
    }
  }
  
  .linked-category-item {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    border-radius: 12rpx;
    border: 2rpx solid transparent;
    min-width: 0;
    
    .linked-cat-icon {
      font-size: 28rpx;
      margin-right: 10rpx;
    }
    .linked-cat-name {
      font-size: 24rpx;
      color: #333;
      flex: 1;
    }
    .linked-cat-check {
      width: 36rpx;
      height: 36rpx;
      border: 2rpx solid #ddd;
      border-radius: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      color: #fff;
      margin-left: 8rpx;
      flex-shrink: 0;
      
      &.checked {
        background: #F7B84D;
        border-color: #F7B84D;
      }
    }
  }
}

.submit-section {
  padding: 32rpx 0;
  
  .submit-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
  }
}

.danger-section {
  padding: 32rpx 0;
  
  .danger-btn {
    width: 100%;
    height: 96rpx;
    background: #FFFFFF;
    color: #F5A623;
    border-radius: 48rpx;
    font-size: 28rpx;
    border: 2rpx solid #F5A623;
  }
}
</style>

