<template>
  <view class="create-account-book-container">
    <view class="form-section" v-if="!editId">
      <text class="form-label">账本类型</text>
      <view class="type-selector">
        <view 
          class="type-option" 
          :class="{ active: form.type === 0 }"
          @click="form.type = 0"
        >
          <!-- <text class="type-icon">👤</text> -->
          <text class="type-name">个人账本</text>
        </view>
        <view 
          class="type-option" 
          :class="{ active: form.type === 1 }"
          @click="form.type = 1"
        >
          <!-- <text class="type-icon">👥</text> -->
          <text class="type-name">一起账本</text>
        </view>
      </view>
    </view>
    
    <view class="form-section">
      <text class="form-label">账本名称</text>
      <input 
        class="form-input" 
        v-model="form.name"
        :placeholder="form.type === 0 ? '例如：我的日常账本' : '例如：2024年春节旅游'"
        :focus="true"
      />
    </view>
    
    <view class="form-section">
      <text class="form-label">账本描述</text>
      <textarea 
        class="form-textarea" 
        v-model="form.description"
        :placeholder="form.type === 0 ? '描述一下这个账本的用途（可选）' : '描述一下这个一起账本的用途（可选）'"
        maxlength="100"
      />
    </view>
    <view class="form-section">
      <text class="form-label">账本用途</text>
      <view class="category-selector">
        <view 
          v-for="cat in categoryOptions" 
          :key="cat.value"
          class="category-option"
          :class="{ active: form.category === cat.value }"
          @click="onPurposeSelect(cat.value)"
        >
          <app-icon class="category-icon" :icon="cat.icon" :category-name="cat.name" :size="20" :color="form.category === cat.value ? '#F5A623' : '#666666'" />
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    

    <!-- 个人账本预算 -->
    <view v-if="form.type === 0" class="form-section">
      <text class="form-label">预算金额（可选）</text>
      <input 
        class="form-input" 
        type="digit"
        v-model="form.budget"
        placeholder="0.00"
      />
      <text class="form-hint">设置预算可以帮助控制支出</text>
    </view>
    
    <!-- 一起账本特有字段 -->
    <template v-if="form.type === 1">
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
        <text class="form-label">预算金额（可选）</text>
        <input 
          class="form-input" 
          type="digit"
          v-model="form.budget"
          placeholder="0.00"
        />
        <text class="form-hint">设置预算可以帮助控制支出</text>
      </view>
    </template>
    
    <!-- 账本币种（可选） -->
<!--    <view class="form-section">
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
    </view> -->
    
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
    
    <view class="form-section" v-show="false">
      <text class="form-label">关联交易类别</text>
      <view class="linked-category-hint">选择后，记账时仅展示这些类别；不选则展示全部</view>
      <view class="linked-category-section">
        <view v-for="group in displayedLinkedCategoryRows" :key="group.typeLabel" class="linked-type-block">
          <text class="section-title">{{ group.typeLabel }}</text>
          <view v-for="(row, rowIndex) in group.rows" :key="rowIndex" class="category-row-wrapper">
            <view 
              v-for="parent in row" 
              :key="parent.id" 
              class="parent-cell"
            >
              <view 
                class="parent-category-item"
                :class="{ active: isParentFullSelected(parent), semiActive: isParentSemiSelected(parent) }"
              >
                <view class="parent-category-content" @click="toggleParentExpand(parent)">
                  <view class="parent-icon" :style="{ backgroundColor: parent.color || '#AA96DA' }">
                    <app-icon :icon="parent.icon || '📁'" :category-name="parent.name" :size="16" color="#FFFFFF" />
                  </view>
                  <text class="parent-name">{{ parent.name }}</text>
                </view>
                <text 
                  class="linked-cat-check" 
                  :class="{ checked: isParentFullSelected(parent), semi: isParentSemiSelected(parent) }" 
                  @click.stop="onParentClick(parent)"
                >{{ isParentFullSelected(parent) ? '✓' : (isParentSemiSelected(parent) ? '－' : '') }}</text>
              </view>
            </view>
            <view v-if="expandedParentForRow(row)" class="children-full-row">
              <view class="children-expand-area">
                <text class="children-label">子分类</text>
                <view class="children-grid">
                  <view 
                    v-for="child in (expandedParentForRow(row).children || [])" 
                    :key="child.id"
                    class="category-item"
                    :class="{ selected: isLinkedCategorySelected(child.id) }"
                    @click="toggleLinkedCategory(child.id)"
                  >
                    <view class="category-icon-wrapper">
                      <view class="category-icon" :style="{ backgroundColor: child.color || '#AA96DA' }">
                        <app-icon :icon="child.icon || '📝'" :category-name="child.name" :size="14" color="#FFFFFF" />
                      </view>
                    </view>
                    <text class="category-name">{{ child.name }}</text>
                    <text class="linked-cat-check" :class="{ checked: isLinkedCategorySelected(child.id) }">{{ isLinkedCategorySelected(child.id) ? '✓' : '' }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view 
            v-if="hasMoreForType(group.typeLabel)" 
            class="category-expand-btn"
            @click="toggleLinkedCategoryExpand(group.typeLabel)"
          >
            <text>{{ isExpandedForType(group.typeLabel) ? '收起' : '展开更多' }}</text>
          </view>
        </view>
      </view>
    </view>
    <!-- 个人账本特有字段 -->
    <view class="form-section" v-if="form.type === 0">
      <view class="checkbox-wrapper">
        <checkbox-group @change="onIsDefaultChange">
          <label class="checkbox-label">
            <checkbox :checked="form.isDefault" value="default" />
            <text class="checkbox-text">设为默认账本</text>
          </label>
        </checkbox-group>
      </view>
      <text class="form-hint">默认账本会在首页优先显示</text>
    </view>
    <view class="submit-section">
      <button class="submit-btn" @click="createAccountBook" :loading="creating">
        {{ editId ? '保存' : (form.type === 0 ? '创建个人账本' : '创建一起账本') }}
      </button>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      form: {
        type: 0, // 0-个人账本，1-一起账本
        name: '',
        description: '',
        category: 0, // 账本用途类型
        isDefault: false, // 个人账本专用
        startDate: '', // 一起账本专用
        endDate: '', // 一起账本专用
        budget: '', // 一起账本专用
        defaultCurrency: 0, // 默认人民币
        enabledCurrencyIds: [0], // 默认只勾选人民币
        linkedCategoryIds: [] // 账本关联的交易类别ID，空表示记账时展示全部类别
      },
      currencyOptions: [],
      linkedCategoryOptions: [], // 平铺列表（兼容）
      linkedCategoryGroups: [], // 按类型+父子分组：[{ typeLabel, parents: [{ id, name, icon, children }] }]
      expandedParentId: null, // 当前展开子分类的父类 id，仅展示该父类的子类
      linkedCategoryExpandedByType: {}, // 按类型（支出/收入）分别控制是否展开，如 { '支出': true, '收入': false }
      editId: null, // 编辑时传入的一起账本 id，有值时为编辑模式
      categoryOptions: [
        { value: 0, name: '日常消费', icon: '🏠' },
        { value: 1, name: '旅行', icon: '✈️' },
        { value: 2, name: '装修', icon: '🔧' },
        { value: 3, name: '结婚', icon: '💒' },
        { value: 4, name: '育儿', icon: '👶' },
        { value: 5, name: '生意', icon: '💼' },
        { value: 6, name: '家庭', icon: '👨‍👩‍👧‍👦' },
        { value: 7, name: '活动', icon: '🎉' },
        { value: 99, name: '其他', icon: '📝' }
      ],
      creating: false
    };
  },
  computed: {
    linkedCategoryRows() {
      const chunk = (arr, size) => {
        if (!arr || !arr.length) return [];
        const out = [];
        for (let i = 0; i < arr.length; i += size) {
          out.push(arr.slice(i, i + size));
        }
        return out;
      };
      return (this.linkedCategoryGroups || []).map(g => ({
        typeLabel: g.typeLabel,
        rows: chunk(g.parents || [], 1)
      }));
    },
    // 默认只显示前 4 个父分类行，按类型（支出/收入）分别展开
    displayedLinkedCategoryRows() {
      const limit = 4;
      if (!this.linkedCategoryRows || !this.linkedCategoryRows.length) return [];
      return this.linkedCategoryRows.map(g => {
        const expanded = !!this.linkedCategoryExpandedByType[g.typeLabel];
        const rows = g.rows || [];
        const showRows = (rows.length > limit && !expanded) ? rows.slice(0, limit) : rows;
        return { typeLabel: g.typeLabel, rows: showRows };
      });
    },
    // 某类型是否有更多可展开（用于显示该类型下的“展开更多”按钮）
    hasMoreForType() {
      return (typeLabel) => {
        const g = (this.linkedCategoryRows || []).find(r => r.typeLabel === typeLabel);
        return g && g.rows && g.rows.length > 4;
      };
    },
    isExpandedForType() {
      return (typeLabel) => !!this.linkedCategoryExpandedByType[typeLabel];
    },
    defaultCurrencyPickerOptions() {
      return [{ value: null, name: '', symbol: '', label: '不设置（使用全局默认）' }, ...this.currencyOptions];
    },
    defaultCurrencyIndex() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === undefined) return 0;
      const i = this.defaultCurrencyPickerOptions.findIndex(o => o.value === this.form.defaultCurrency);
      return i >= 0 ? i : 0;
    },
    defaultCurrencyLabel() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === undefined) return '不设置（使用全局默认）';
      const o = this.currencyOptions.find(o => o.value === this.form.defaultCurrency);
      return o ? `${o.symbol} ${o.name}` : '';
    }
  },
  onLoad(options) {
    this.loadCurrencyOptions();
    this.loadLinkedCategoryOptions();
    if (options && options.id) {
      this.editId = parseInt(options.id, 10);
      const editType = options.type != null ? parseInt(options.type, 10) : 1; // 0-个人，1-一起账本，默认一起账本
      if (this.editId) {
        this.loadAccountBookForEdit(editType);
      }
    } else {
      this.applyPurposeDefaultCategories(this.form.category);
    }
  },
  methods: {
    onPurposeSelect(value) {
      this.form.category = value;
      if (!this.editId) {
        this.applyPurposeDefaultCategories(value);
      }
    },
    async applyPurposeDefaultCategories(purpose) {
      try {
        const res = await api.bookPurposeCategories.getByPurpose(purpose);
        const ids = res && Array.isArray(res.categoryIds) ? res.categoryIds : [];
        this.form.linkedCategoryIds = ids.length > 0 ? [...ids] : [];
      } catch (e) {
        console.warn('加载用途默认分类失败', e);
      }
    },
    async loadAccountBookForEdit(editType = 1) {
      if (!this.editId) return;
      try {
        const isPersonal = editType === 0;
        const book = isPersonal
          ? await api.accountBooks.getById(this.editId)
          : await api.sharedAccountBooks.getById(this.editId);
        this.form.type = isPersonal ? 0 : 1;
        this.form.name = book.name || '';
        this.form.description = book.description || '';
        this.form.category = book.category != null ? book.category : 0;
        this.form.isDefault = !!book.isDefault;
        this.form.startDate = book.startDate ? String(book.startDate).substring(0, 10) : '';
        this.form.endDate = book.endDate ? String(book.endDate).substring(0, 10) : '';
        this.form.budget = book.budget != null && book.budget !== '' ? String(book.budget) : '';
        this.form.defaultCurrency = book.defaultCurrency ?? null;
        this.form.enabledCurrencyIds = Array.isArray(book.enabledCurrencyIds) ? [...book.enabledCurrencyIds] : [];
        this.form.linkedCategoryIds = Array.isArray(book.linkedCategoryIds) ? [...book.linkedCategoryIds] : [];
        uni.setNavigationBarTitle({ title: '编辑账本' });
      } catch (e) {
        console.error('加载账本失败', e);
        uni.showToast({ title: '加载账本失败', icon: 'none' });
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
            children: (p.children || []).map(c => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color }))
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
    isParentFullSelected(parent) {
      if (!this.form.linkedCategoryIds) return false;
      if (!this.isLinkedCategorySelected(parent.id)) return false;
      const children = parent.children || [];
      if (children.length === 0) return true;
      return children.every(c => this.form.linkedCategoryIds.indexOf(c.id) >= 0);
    },
    isParentSemiSelected(parent) {
      if (!this.form.linkedCategoryIds) return false;
      if (this.isParentFullSelected(parent)) return false;
      const children = parent.children || [];
      const parentIn = this.isLinkedCategorySelected(parent.id);
      const someChildrenIn = children.some(c => this.form.linkedCategoryIds.indexOf(c.id) >= 0);
      return parentIn || someChildrenIn;
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
    toggleLinkedCategoryExpand(typeLabel) {
      const cur = !!this.linkedCategoryExpandedByType[typeLabel];
      this.linkedCategoryExpandedByType = { ...this.linkedCategoryExpandedByType, [typeLabel]: !cur };
    },
    // 点击父分类空白处（图标+名称）仅展开/收起子分类，不改变勾选
    toggleParentExpand(parent) {
      this.expandedParentId = this.expandedParentId === parent.id ? null : parent.id;
    },
    // 点击父分类的勾选区域：全选/取消全选该父及其子分类
    onParentClick(parent) {
      if (!this.form.linkedCategoryIds) this.form.linkedCategoryIds = [];
      const childIds = (parent.children || []).map(c => c.id);
      if (this.isParentFullSelected(parent)) {
        this.form.linkedCategoryIds = this.form.linkedCategoryIds.filter(id => id !== parent.id && childIds.indexOf(id) < 0);
        this.expandedParentId = null;
      } else {
        const toAdd = [parent.id, ...childIds].filter(id => this.form.linkedCategoryIds.indexOf(id) < 0);
        this.form.linkedCategoryIds = [...this.form.linkedCategoryIds, ...toAdd];
        this.expandedParentId = parent.id;
      }
    },
    expandedParentForRow(row) {
      if (!this.expandedParentId || !row || !row.length) return null;
      return row.find(p => p.id === this.expandedParentId) || null;
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
    onIsDefaultChange(e) {
      this.form.isDefault = e.detail.value.includes('default');
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
    
    async createAccountBook() {
      if (!this.form.name.trim()) {
        uni.showToast({
          title: '请输入账本名称',
          icon: 'none'
        });
        return;
      }
      
      // 验证日期（仅一起账本）
      if (this.form.type === 1) {
        if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
          uni.showToast({
            title: '结束日期不能早于开始日期',
            icon: 'none'
          });
          return;
        }
      }
      
      this.creating = true;
      
      try {
        if (this.editId) {
          if (this.form.type === 0) {
            // 编辑个人账本
            await api.accountBooks.update(this.editId, {
              name: this.form.name.trim(),
              description: this.form.description.trim() || null,
              category: this.form.category,
              budget: this.form.budget ? parseFloat(this.form.budget) : null,
              isDefault: this.form.isDefault,
              defaultCurrency: this.form.defaultCurrency ?? null,
              enabledCurrencyIds: (this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0) ? this.form.enabledCurrencyIds : null,
              linkedCategoryIds: (this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0) ? this.form.linkedCategoryIds : null
            });
          } else {
            // 编辑一起账本
            await api.sharedAccountBooks.update(this.editId, {
              name: this.form.name.trim(),
              description: this.form.description.trim() || null,
              category: this.form.category,
              startDate: this.form.startDate || null,
              endDate: this.form.endDate || null,
              budget: this.form.budget ? parseFloat(this.form.budget) : null,
              defaultCurrency: this.form.defaultCurrency ?? null,
              enabledCurrencyIds: (this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0) ? this.form.enabledCurrencyIds : null,
              linkedCategoryIds: (this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0) ? this.form.linkedCategoryIds : null
            });
          }
          uni.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateBack();
          }, 800);
          return;
        }
        
        const result = await api.accountBooks.create({
          type: this.form.type,
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          category: this.form.category,
          isDefault: this.form.type === 0 ? this.form.isDefault : undefined,
          startDate: this.form.type === 1 ? (this.form.startDate || null) : undefined,
          endDate: this.form.type === 1 ? (this.form.endDate || null) : undefined,
          budget: this.form.budget ? parseFloat(this.form.budget) : undefined,
          defaultCurrency: this.form.defaultCurrency ?? undefined,
          enabledCurrencyIds: (this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0) ? this.form.enabledCurrencyIds : undefined,
          linkedCategoryIds: (this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0) ? this.form.linkedCategoryIds : undefined
        });
        
        uni.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        if (this.form.type === 0) {
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' });
          }, 1500);
        } else {
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${result.id}`
            });
          }, 1500);
        }
        
      } catch (error) {
        console.error(this.editId ? '保存失败' : '创建失败', error);
        uni.showToast({
          title: error.message || (this.editId ? '保存失败' : '创建失败'),
          icon: 'none'
        });
      } finally {
        this.creating = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.create-account-book-container {
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
  width: 100%;
  
  .form-label {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .type-selector {
    display: flex;
    gap: 24rpx;
    box-sizing: border-box;
    width: 100%;
    
    .type-option {
      flex: 1;
      background: #F5F5F5;
      border-radius: 16rpx;
      padding: 32rpx;
      text-align: center;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      box-sizing: border-box;
      min-width: 0;
      
      &.active {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        border-color: #F5A623;
        
        .type-icon,
        .type-name {
          color: #FFFFFF;
        }
      }
      
      .type-icon {
        font-size: 48rpx;
        display: block;
        margin-bottom: 16rpx;
      }
      
      .type-name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333333;
        display: block;
      }
    }
  }
  
  .category-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10rpx;
    
    .category-option {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 14rpx 10rpx;
      background: #F5F5F5;
      border-radius: 10rpx;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      
      &.active {
        background: rgba(245, 166, 35, 0.15);
        border-color: #F7B84D;
        
        .category-name {
          color: #F7B84D;
          font-weight: bold;
        }
      }
      
      .category-icon {
        font-size: 30rpx;
        margin-right: 8rpx;
      }
      
      .category-name {
        font-size: 25rpx;
        color: #333333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  
  .form-input {
    width: 100%;
    min-height: 88rpx;
    line-height: 1.5;
    background: #F5F5F5;
    border-radius: 16rpx;
    padding: 24rpx;
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
  
  .form-hint {
    font-size: 24rpx;
    color: #999999;
    margin-top: 16rpx;
    display: block;
  }
  
  .checkbox-wrapper {
    margin-top: 16rpx;
    
    .checkbox-label {
      display: flex;
      align-items: center;
      
      .checkbox-text {
        font-size: 28rpx;
        color: #333333;
        margin-left: 16rpx;
      }
    }
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
    border: 2rpx solid transparent;
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
  
  /* 与记录交易页分类样式一致 */
  .linked-category-section {
    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      margin-bottom: 20rpx;
      display: block;
    }
    .category-expand-btn {
      margin-top: 16rpx;
      padding: 16rpx 0;
      text-align: center;
      font-size: 26rpx;
      color: #F7B84D;
      font-weight: 500;
    }
    .linked-type-block {
      margin-bottom: 24rpx;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .category-row-wrapper {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12rpx;
      margin-bottom: 12rpx;
    }
    .children-full-row {
      grid-column: 1;
      width: 100%;
      min-width: 0;
    }
    .parent-cell {
      min-width: 0;
    }
    .parent-category-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 16rpx 12rpx;
      background: #F8F8F8;
      border-radius: 10rpx;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      min-width: 0;
      &.active {
        background: rgba(245, 166, 35, 0.15);
        border-color: #F7B84D;
        box-shadow: 0 2rpx 8rpx rgba(245, 166, 35, 0.2);
        .parent-name {
          color: #F7B84D;
          font-weight: bold;
        }
      }
      &.semiActive {
        background: rgba(245, 166, 35, 0.08);
        border-color: rgba(245, 166, 35, 0.5);
        .parent-name {
          color: #E8940C;
        }
      }
      .parent-category-content {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
        min-width: 0;
      }
      .parent-icon {
        width: 40rpx;
        height: 40rpx;
        border-radius: 10rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22rpx;
        margin-right: 8rpx;
        flex-shrink: 0;
      }
      .parent-name {
        font-size: 22rpx;
        color: #333333;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
      }
      .linked-cat-check {
        width: 32rpx;
        height: 32rpx;
        border: 2rpx solid #ddd;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20rpx;
        color: #fff;
        margin-left: 6rpx;
        flex-shrink: 0;
        &.checked {
          background: #F7B84D;
          border-color: #F7B84D;
        }
        &.semi {
          background: rgba(245, 166, 35, 0.6);
          border-color: #F7B84D;
          font-size: 24rpx;
          font-weight: bold;
        }
      }
    }
    .children-expand-area {
      margin-top: 12rpx;
      padding: 12rpx 16rpx;
      border-left: 4rpx solid #F7B84D;
      background: rgba(245, 166, 35, 0.06);
      border-radius: 0 12rpx 12rpx 0;
      width: 100%;
      box-sizing: border-box;
      .children-label {
        display: block;
        font-size: 22rpx;
        color: #F7B84D;
        margin-bottom: 12rpx;
        font-weight: 500;
      }
      .children-grid {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        gap: 12rpx;
        align-content: flex-start;
        .category-item {
          display: flex;
          align-items: center;
          padding: 12rpx 20rpx;
          background: #FFFFFF;
          border-radius: 32rpx;
          border: 2rpx solid #E8E8E8;
          transition: all 0.2s;
          &.selected {
            background: rgba(245, 166, 35, 0.15);
            border-color: #F7B84D;
            .category-name {
              color: #F7B84D;
              font-weight: 500;
            }
          }
          .category-icon-wrapper {
            margin-right: 6rpx;
            .category-icon {
              width: 36rpx;
              height: 36rpx;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20rpx;
            }
          }
          .category-name {
            font-size: 24rpx;
            color: #333333;
            white-space: nowrap;
            flex: 1;
            min-width: 0;
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
    }
  }
}

.submit-section {
  padding: 32rpx 0;
  box-sizing: border-box;
  width: 100%;
  
  .submit-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
}
</style>

