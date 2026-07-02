<template>
  <view class="detail-container">
    <!-- 账本信息 -->
    <view class="book-info-card">
      <view class="book-header">
        <text class="book-name">{{ accountBook?.name }}</text>
        <text v-if="accountBookType === 1">
          <text v-if="accountBook?.status === 1" class="status-badge ended">已结束</text>
          <text v-else class="status-badge active">进行中</text>
        </text>
        <text v-else-if="accountBook?.isDefault" class="status-badge default">默认</text>
      </view>
      <view class="book-tags">
        <text class="tag type-tag">{{ accountBookType === 0 ? '个人账本' : '一起账本' }}</text>
        <text class="tag category-tag" v-if="accountBook?.categoryName">{{ accountBook.categoryName }}</text>
      </view>
      <text class="book-description">{{ accountBook?.description || '暂无描述' }}</text>
      
      <view class="book-stats">
        <view class="stat-item" v-if="accountBookType === 1">
          <text class="stat-label">成员</text>
          <text class="stat-value">{{ accountBook?.memberCount || 0 }}人</text>
        </view>
        <view class="stat-item" v-if="accountBook?.budget">
          <text class="stat-label">预算</text>
          <text class="stat-value">¥{{ accountBook?.budget?.toFixed(2) }}</text>
        </view>
      </view>
      
      <view class="share-code-section" v-if="accountBookType === 1 && accountBook?.shareCode">
        <text class="share-code-label">分享码</text>
        <view class="share-code-box">
          <text class="share-code">{{ accountBook?.shareCode }}</text>
          <view class="share-code-actions">
            <text class="copy-btn" @click="copyShareCode">复制</text>
            <button 
              class="share-btn" 
              open-type="share"
              @click="shareAccountBook"
            >
              <text>分享</text>
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 功能按钮 -->
    <view class="action-buttons" :class="{ 'four-columns': accountBookType === 0, 'five-columns': accountBookType === 1 }">
      <view 
        class="action-btn" 
        :class="{ disabled: isBookEnded }"
        @click="goToAddTransaction"
      >
        <view class="action-icon"><app-icon name="plusempty" :size="22" color="#F5A623" /></view>
        <text class="action-text">记账</text>
      </view>
      <view class="action-btn" @click="goToStatistics">
        <view class="action-icon"><app-icon name="bars" :size="22" color="#F5A623" /></view>
        <text class="action-text">统计</text>
      </view>
      <view class="action-btn" v-if="accountBookType === 1" @click="goToMembers">
        <view class="action-icon"><app-icon name="staff" :size="22" color="#F5A623" /></view>
        <text class="action-text">成员</text>
      </view>
      <view class="action-btn" @click="goToSettings">
        <view class="action-icon"><app-icon name="gear" :size="22" color="#F5A623" /></view>
        <text class="action-text">设置</text>
      </view>
      <view class="action-btn" v-if="accountBookType === 1" @click="goToReport">
        <view class="action-icon"><app-icon name="list" :size="22" color="#F5A623" /></view>
        <text class="action-text">总结</text>
      </view>
      <view class="action-btn" v-if="accountBookType === 0" @click="selectAsCurrent">
        <view class="action-icon"><app-icon name="checkmarkempty" :size="22" color="#F5A623" /></view>
        <text class="action-text">设为当前</text>
      </view>
    </view>
    
    <!-- 交易记录 -->
    <view class="recent-transactions">
      <view class="section-header">
        <text class="section-title">交易记录</text>
        <text class="section-count" v-if="filteredTransactions.length > 0">共{{ filteredTransactions.length }}条</text>
      </view>
      
      <!-- 筛选器和汇总统计 -->
      <view class="filter-summary-section">
        <!-- 筛选器 -->
        <view class="filter-section">
          <view class="filter-row">
            <!-- 一起账本有起止日期时：日期范围选择 -->
            <view class="filter-item" v-if="useDateRangePicker">
              <text class="filter-label">日期</text>
              <view class="date-range-pickers">
                <picker 
                  mode="date" 
                  :value="selectedDateStart" 
                  :start="bookStartDate" 
                  :end="selectedDateEnd || bookEndDate"
                  @change="onDateRangeStartChange"
                >
                  <view class="filter-picker date-picker">
                    <text>{{ selectedDateStart || '开始' }}</text>
                    <view class="picker-arrow"></view>
                  </view>
                </picker>
                <text class="date-range-sep">至</text>
                <picker 
                  mode="date" 
                  :value="selectedDateEnd" 
                  :start="selectedDateStart || bookStartDate" 
                  :end="bookEndDate"
                  @change="onDateRangeEndChange"
                >
                  <view class="filter-picker date-picker">
                    <text>{{ selectedDateEnd || '结束' }}</text>
                    <view class="picker-arrow"></view>
                  </view>
                </picker>
              </view>
            </view>
            <!-- 其他情况：月份选择 -->
            <view class="filter-item" v-else>
              <text class="filter-label">日期</text>
              <picker mode="date" fields="month" :value="selectedMonth" @change="onMonthChange">
                <view class="filter-picker">
                  <text>{{ selectedMonthText }}</text>
                  <view class="picker-arrow"></view>
                </view>
              </picker>
            </view>
            <view class="filter-item">
              <text class="filter-label">类型</text>
              <view class="type-filter">
                <view 
                  class="type-filter-item" 
                  :class="{ active: selectedType === null }"
                  @click="selectedType = null"
                >
                  <text>全部</text>
                </view>
                <view 
                  class="type-filter-item" 
                  :class="{ active: selectedType === 0 }"
                  @click="selectedType = 0"
                >
                  <text>支出</text>
                </view>
                <view 
                  class="type-filter-item" 
                  :class="{ active: selectedType === 1 }"
                  @click="selectedType = 1"
                >
                  <text>收入</text>
                </view>
              </view>
            </view>
            <view class="filter-item">
              <text class="filter-label">分类</text>
              <picker 
                mode="selector" 
                :range="categoryOptions" 
                range-key="name"
                :value="selectedCategoryIndex"
                @change="onCategoryChange"
              >
                <view class="filter-picker">
                  <text>{{ selectedCategoryName }}</text>
                  <view class="picker-arrow"></view>
                </view>
              </picker>
            </view>
            <view class="filter-item" v-if="accountBookType === 1">
              <text class="filter-label">成员</text>
              <picker 
                mode="selector" 
                :range="memberOptions" 
                range-key="name"
                :value="selectedMemberIndex"
                @change="onMemberChange"
              >
                <view class="filter-picker">
                  <text>{{ selectedMemberName }}</text>
                  <view class="picker-arrow"></view>
                </view>
              </picker>
            </view>
          </view>
        </view>
        
        <!-- 汇总统计 -->
        <view class="summary-section" v-if="filteredTransactions.length > 0">
        <view class="summary-item expense">
          <text class="summary-amount">¥{{ monthExpense.toFixed(2) }}</text>
          <text class="summary-label">支出</text>
        </view>
        <view class="summary-item income">
          <text class="summary-amount">¥{{ monthIncome.toFixed(2) }}</text>
          <text class="summary-label">收入</text>
        </view>
        <view class="summary-item balance">
          <text class="summary-amount" :class="{ negative: monthBalance < 0 }">¥{{ monthBalance.toFixed(2) }}</text>
          <text class="summary-label">结余</text>
        </view>
        </view>
        <!-- 成员均摊费用（根据交易分摊表） -->
        <view class="member-allocation-section" v-if="accountBookType === 1 && memberAllocationSummary.length > 0">
          <text class="member-allocation-title">成员各自消费</text>
          <view class="member-allocation-list">
            <view 
              v-for="m in memberAllocationSummary" 
              :key="`alloc-${String(m.userId)}`" 
              class="member-allocation-item"
              :class="{ active: isAllocationMemberActive(m) }"
              @click="onMemberAllocationClick(m)"
            >
              <text class="member-name">{{ m.userName || '未知' }}</text>
              <text class="member-amount">¥{{ m.totalAmount.toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view v-if="filteredTransactions.length === 0" class="empty-state">
        <text class="empty-text">还没有交易记录</text>
      </view>
      
      <view v-else class="transaction-list">
        <view 
          v-for="item in filteredTransactions" 
          :key="item.id"
          class="transaction-item"
          @click="viewTransaction(item)"
          @longpress="deleteTransaction(item)"
        >
            <view class="transaction-left">
              <view class="category-icon" :style="{ backgroundColor: item.categoryColor }">
                <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="18" color="#FFFFFF" />
              </view>
              <view class="transaction-info">
                <text class="category-name">{{ item.categoryName }}</text>
                <text v-if="item.remark" class="transaction-remark">{{ item.remark }}</text>
                <view class="transaction-meta">
                  <text class="transaction-date">{{ formatDate(item.transactionDate, 'MM-DD') }}</text>
                  <text v-if="accountBookType === 1 && item.userName" class="transaction-creator">{{ item.userName }}</text>
                </view>
              </view>
            </view>
          <view class="transaction-right">
            <view class="transaction-amount-wrapper">
              <text 
                class="transaction-amount" 
                :class="item.type === 0 ? 'expense' : 'income'"
              >
                {{ item.type === 0 ? '-' : '+' }}¥{{ item.amount.toFixed(2) }}
              </text>
              <view v-if="accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0" class="allocation-avatars">
                <view v-for="a in (item.allocations || [])" :key="a.userId" class="allocation-avatar-circle">
                  <text>{{ (a.userName || '?').charAt(0) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 交易详情弹框组件 -->
    <transaction-detail
      :visible="showTransactionDetail"
      :transaction="selectedTransaction"
      @close="closeTransactionDetail"
    />
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate } from '@/utils/util';
import { requireWechatLogin } from '@/utils/auth';
import { mapState, mapActions } from 'vuex';
import TransactionDetail from '@/components/transaction-detail/transaction-detail.vue';

export default {
  components: {
    TransactionDetail
  },
  computed: {
    ...mapState(['userInfo']),
    // 账本已结束（一起账本 status===1 时不可记账）
    isBookEnded() {
      return this.accountBookType === 1 && this.accountBook?.status === 1;
    },
    // 一起账本且有起止日期时使用日期范围选择
    useDateRangePicker() {
      return this.accountBookType === 1
        && this.accountBook?.startDate
        && this.accountBook?.endDate;
    },
    // 账本起止日期（YYYY-MM-DD）
    bookStartDate() {
      if (!this.accountBook?.startDate) return '';
      return String(this.accountBook.startDate).substring(0, 10);
    },
    bookEndDate() {
      if (!this.accountBook?.endDate) return '';
      return String(this.accountBook.endDate).substring(0, 10);
    },
    // 选中的月份文本
    selectedMonthText() {
      if (!this.selectedMonth) return '';
      const [year, month] = this.selectedMonth.split('-');
      return `${year}年${parseInt(month)}月`;
    },
    // 基础筛选后的交易记录（不包含“成员各自消费”卡片筛选）
    transactionsBeforeAllocationFilter() {
      let transactions = this.allTransactions || [];
      
      // 按日期筛选
      if (this.useDateRangePicker && this.selectedDateStart && this.selectedDateEnd) {
        const startDate = new Date(this.selectedDateStart + 'T00:00:00');
        const endDate = new Date(this.selectedDateEnd + 'T23:59:59');
        transactions = transactions.filter(t => {
          const transDate = new Date(t.transactionDate);
          return transDate >= startDate && transDate <= endDate;
        });
      } else if (!this.useDateRangePicker && this.selectedMonth) {
        const [year, month] = this.selectedMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        transactions = transactions.filter(t => {
          const transDate = new Date(t.transactionDate);
          return transDate >= startDate && transDate <= endDate;
        });
      }
      
      // 按类型筛选
      if (this.selectedType !== null) {
        transactions = transactions.filter(t => t.type === this.selectedType);
      }
      
      // 按分类筛选：大类对应其下全部小类 id；选中小类时仅匹配该 id
      if (this.selectedCategoryId !== null && this.selectedCategoryId !== undefined && this.selectedCategoryId !== '') {
        const opt = this.categoryOptions.find(
          (c) => c.id != null && Number(c.id) === Number(this.selectedCategoryId)
        );
        const ids = opt && opt.filterCategoryIds ? opt.filterCategoryIds.map((x) => Number(x)) : [];
        if (ids.length > 0) {
          const set = new Set(ids);
          transactions = transactions.filter((t) => set.has(Number(t.categoryId)));
        } else {
          transactions = [];
        }
      }
      
      // 按成员筛选（顶部筛选器）
      if (this.accountBookType === 1 && this.selectedMemberId !== null) {
        transactions = transactions.filter(t => t.userId === this.selectedMemberId);
      }

      return transactions;
    },
    // 筛选后的交易记录
    filteredTransactions() {
      let transactions = this.transactionsBeforeAllocationFilter || [];
      // 按“成员各自消费”卡片筛选（独立于顶部筛选器）
      if (this.accountBookType === 1 && this.selectedAllocationMemberId !== null) {
        const aid = String(this.selectedAllocationMemberId);
        transactions = transactions.filter(
          (t) => (t.allocations || []).some((a) => String(a.userId) === aid)
        );
      }
      return transactions;
    },
    // 当月支出合计
    monthExpense() {
      return this.filteredTransactions
        .filter(t => t.type === 0)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    },
    // 当月收入合计
    monthIncome() {
      return this.filteredTransactions
        .filter(t => t.type === 1)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    },
    // 结余 = 预算 - 支出（无预算时预算视为0）
    monthBalance() {
      const budget = this.accountBook?.budget ?? 0;
      return budget - this.monthExpense;
    },
    // 分类选项：「全部」+ 各大类；记账落在小类 id，选大类时用 filterCategoryIds 包含其下全部小类 id
    categoryOptions() {
      const options = [{ id: null, name: '全部', filterCategoryIds: null }];
      let parents = this.allCategories || [];
      if (this.selectedType !== null) {
        parents = parents.filter((p) => p.type === this.selectedType);
      }
      const rows = [];
      for (const p of parents) {
        if (p.children && p.children.length > 0) {
          rows.push({
            id: p.id,
            name: p.name,
            filterCategoryIds: p.children.map((ch) => ch.id)
          });
        } else {
          rows.push({
            id: p.id,
            name: p.name,
            filterCategoryIds: [p.id]
          });
        }
      }
      return options.concat(rows);
    },
    // 当前选中的分类索引
    selectedCategoryIndex() {
      if (this.selectedCategoryId == null || this.selectedCategoryId === '') {
        return 0;
      }
      const index = this.categoryOptions.findIndex(
        (c) => c.id != null && Number(c.id) === Number(this.selectedCategoryId)
      );
      return index >= 0 ? index : 0;
    },
    // 当前选中的分类名称
    selectedCategoryName() {
      if (this.selectedCategoryId == null || this.selectedCategoryId === '') {
        return '全部';
      }
      const category = this.categoryOptions.find(
        (c) => c.id != null && Number(c.id) === Number(this.selectedCategoryId)
      );
      return category ? category.name : '全部';
    },
    // 成员选项列表（包含"全部"选项）
    memberOptions() {
      if (this.accountBookType !== 1 || !this.accountBook || !this.accountBook.members) {
        return [{ id: null, name: '全部' }];
      }
      const options = [{ id: null, name: '全部' }];
      // 添加创建者（如果不在成员列表中）
      const creatorId = this.accountBook.creatorId || this.accountBook.userId;
      const creatorInMembers = this.accountBook.members.some(m => m.userId === creatorId);
      if (!creatorInMembers && creatorId) {
        options.push({
          id: creatorId,
          name: this.accountBook.creatorName || '创建者'
        });
      }
      // 添加成员
      return options.concat(this.accountBook.members.map(m => ({
        id: m.userId,
        name: m.userName || '未知用户'
      })));
    },
    // 当前选中的成员索引
    selectedMemberIndex() {
      const index = this.memberOptions.findIndex(m => m.id === this.selectedMemberId);
      return index >= 0 ? index : 0;
    },
    // 当前选中的成员名称
    selectedMemberName() {
      const member = this.memberOptions.find(m => m.id === this.selectedMemberId);
      return member ? member.name : '全部';
    },
    // 成员均摊费用汇总（不受“成员各自消费”卡片筛选影响，避免点击后排序跳动）
    memberAllocationSummary() {
      if (this.accountBookType !== 1 || !this.accountBook || !this.accountBook.members) return [];
      const expenseList = (this.transactionsBeforeAllocationFilter || []).filter(t => t.type === 0);
      const byUserId = new Map();

      this.accountBook.members.forEach((m) => {
        if (m.userId === null || m.userId === undefined || m.userId === '') return;
        const k = String(m.userId);
        byUserId.set(k, {
          userId: k,
          userName: m.userName || '未知',
          userAvatar: m.userAvatar || null,
          totalAmount: 0
        });
      });

      expenseList.forEach(t => {
        const allocations = t.allocations || [];
        if (allocations.length === 0) return;
        const amount = parseFloat(t.amount) || 0;
        allocations.forEach(a => {
          if (a.userId === null || a.userId === undefined || a.userId === '') return;
          const uid = String(a.userId);
          const share = a.amount != null && a.amount !== undefined
            ? parseFloat(a.amount)
            : amount / allocations.length;
          if (byUserId.has(uid)) {
            byUserId.get(uid).totalAmount += share;
          } else {
            byUserId.set(uid, {
              userId: uid,
              userName: a.userName || '未知',
              userAvatar: a.userAvatar || null,
              totalAmount: share
            });
          }
        });
      });
      return Array.from(byUserId.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    }
  },
  watch: {
    selectedType() {
      if (this.selectedCategoryId == null || this.selectedCategoryId === '') return;
      const stillInList = this.categoryOptions.some(
        (o) => o.id != null && Number(o.id) === Number(this.selectedCategoryId)
      );
      if (!stillInList) {
        this.selectedCategoryId = null;
      }
    }
  },
  data() {
    // 获取当前月份
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      accountBookId: null,
      accountBookType: 1, // 0-个人账本，1-一起账本
      accountBook: null,
      allTransactions: [], // 所有交易记录
      selectedMonth: currentMonth, // 选中的月份 YYYY-MM
      selectedDateStart: '', // 日期范围：开始 YYYY-MM-DD（一起账本有起止日期时）
      selectedDateEnd: '', // 日期范围：结束 YYYY-MM-DD
      selectedType: null, // 选中的类型 null-全部, 0-支出, 1-收入
      selectedCategoryId: null, // 选中的分类ID
      allCategories: [], // 所有分类
      loading: false,
      showTransactionDetail: false, // 是否显示交易详情弹框
      selectedTransaction: null, // 选中的交易
      selectedMemberId: null, // 顶部筛选器-成员ID
      selectedAllocationMemberId: null // 成员各自消费卡片-成员ID（独立筛选）
    };
  },
  onLoad(options) {
    if (options.id) {
      const newAccountBookId = parseInt(options.id);
      const newAccountBookType = options.type ? parseInt(options.type) : 1;
      
      // 清空旧数据，确保每次加载都是全新的
      this.accountBook = null;
      this.allTransactions = [];
      this.selectedMemberId = null;
      this.selectedAllocationMemberId = null;
      this.selectedCategoryId = null;
      this.selectedType = null;
      this.selectedDateStart = '';
      this.selectedDateEnd = '';
      
      // 设置新的账本ID和类型
      this.accountBookId = newAccountBookId;
      this.accountBookType = newAccountBookType;
      
      // 加载数据
      this.loadData();
    }
  },
  onShow() {
    // 获取当前页面参数
    let options = {};
    try {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        options = currentPage.options || {};
      }
    } catch (e) {
      console.warn('获取页面参数失败', e);
    }
    
    if (options.id) {
      const newAccountBookId = parseInt(options.id);
      const newAccountBookType = options.type ? parseInt(options.type) : 1;
      
      // 如果账本ID或类型发生变化，清空旧数据并重新加载
      if (this.accountBookId !== newAccountBookId || this.accountBookType !== newAccountBookType) {
        this.accountBookId = newAccountBookId;
        this.accountBookType = newAccountBookType;
        // 清空旧数据
        this.accountBook = null;
        this.allTransactions = [];
        this.selectedMemberId = null;
        this.selectedCategoryId = null;
        this.selectedType = null;
        this.selectedDateStart = '';
        this.selectedDateEnd = '';
        this.loadData();
      } else if (this.accountBookId) {
        // 如果参数没变化，也刷新一下数据（可能数据有更新）
        this.loadData();
      }
    } else if (this.accountBookId) {
      // 如果没有参数但已有账本ID，刷新数据
      this.loadData();
    }
  },
  // 微信小程序分享功能
  onShareAppMessage() {
    if (this.accountBookType === 1 && this.accountBook?.shareCode) {
      return {
        title: `邀请你加入一起账本：${this.accountBook.name}`,
        path: `/pages/join-account-book/join-account-book?shareCode=${this.accountBook.shareCode}`,
        imageUrl: '/static/invite.jpg' // 可以设置分享图片URL
      };
    }
    return {
      title: '乌鸦记账',
      path: '/pages/index/index'
    };
  },
  methods: {
    ...mapActions(['setCurrentAccountBook']),
    formatDate,

    async loadData() {
      this.loading = true;
      try {
        // 根据类型加载账本详情
        if (this.accountBookType === 0) {
          // 个人账本
          this.accountBook = await api.accountBooks.getById(this.accountBookId);
        } else {
          // 一起账本
          this.accountBook = await api.sharedAccountBooks.getById(this.accountBookId);
        }
        
        // 加载所有交易记录（一起账本和个人账本使用相同的接口）
        const transactions = await api.transactions.getByAccountBook(this.accountBookId);
        // 为每条交易添加账本类型字段，供详情组件使用
        this.allTransactions = transactions.map(t => ({
          ...t,
          accountBookType: this.accountBookType
        }));
        
        // 加载账本关联的交易分类（支出和收入），仅展示该账本关联的自分类
        const [expenseCategories, incomeCategories] = await Promise.all([
          api.categories.getList(0, this.accountBookId),
          api.categories.getList(1, this.accountBookId)
        ]);
        this.allCategories = [...(expenseCategories || []), ...(incomeCategories || [])];
        
        // 一起账本有起止日期时，初始化日期范围
        if (this.accountBookType === 1 && this.accountBook?.startDate && this.accountBook?.endDate) {
          this.selectedDateStart = String(this.accountBook.startDate).substring(0, 10);
          this.selectedDateEnd = String(this.accountBook.endDate).substring(0, 10);
        }
        
      } catch (error) {
        console.error('加载数据失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    copyShareCode() {
      if (!this.accountBook?.shareCode) return;
      uni.setClipboardData({
        data: this.accountBook.shareCode,
        success: () => {
          uni.showToast({
            title: '分享码已复制',
            icon: 'success'
          });
        }
      });
    },
    
    async selectAsCurrent() {
      // 设置为当前账本
      const accountBook = { ...this.accountBook, type: 0 };
      await this.setCurrentAccountBook(accountBook);
      uni.showToast({
        title: '设置成功',
        icon: 'success'
      });
    },
    
    goToAddTransaction() {
      if (!requireWechatLogin()) {
        return;
      }

      if (this.isBookEnded) {
        uni.showToast({
          title: '已结束的账本不能继续记账',
          icon: 'none'
        });
        return;
      }
      if (this.accountBookType === 0) {
        const accountBook = { ...this.accountBook, type: 0 };
        this.setCurrentAccountBook(accountBook);
      } else {
        this.$store.dispatch('setCurrentSharedAccountBook', {
          ...this.accountBook,
          id: this.accountBookId,
          type: 1
        });
      }
      uni.navigateTo({
        url: `/pages/add-transaction/add-transaction?accountBookId=${this.accountBookId}&accountBookType=${this.accountBookType}`
      });
    },
    
    goToStatistics() {
      if (this.accountBookType === 0) {
        const accountBook = { ...this.accountBook, type: 0 };
        this.setCurrentAccountBook(accountBook);
        uni.switchTab({
          url: '/pages/statistics/statistics'
        });
      } else {
        this.$store.dispatch('setCurrentSharedAccountBook', {
          ...this.accountBook,
          id: this.accountBookId,
          type: 1
        });
        uni.navigateTo({
          url: `/pages/shared-account-book-statistics/shared-account-book-statistics?id=${this.accountBookId}`
        });
      }
    },
    
    goToMembers() {
      uni.navigateTo({
        url: `/pages/shared-account-book-members/shared-account-book-members?id=${this.accountBookId}`
      });
    },
    
    goToSettings() {
      // 跳转到创建/编辑账本页面编辑账本（个人账本和一起账本均支持）
      uni.navigateTo({
        url: `/pages/create-shared-account-book/create-shared-account-book?id=${this.accountBookId}&type=${this.accountBookType}`
      });
    },
    
    goToReport() {
      uni.navigateTo({
        url: `/pages/shared-account-book-report/shared-account-book-report?id=${this.accountBookId}`
      });
    },
    
    shareAccountBook() {
      if (!this.accountBook?.shareCode) {
        uni.showToast({
          title: '分享码不存在',
          icon: 'none'
        });
        return;
      }
      
      // 在微信小程序中，分享功能通过右上角菜单触发
      // 这里提示用户使用右上角分享按钮
      uni.showModal({
        title: '分享账本',
        content: `分享码：${this.accountBook.shareCode}\n\n请点击右上角"..."按钮，选择"转发"分享给好友`,
        showCancel: false,
        confirmText: '知道了'
      });
    },
    
    viewTransaction(transaction) {
      this.selectedTransaction = transaction;
      this.showTransactionDetail = true;
    },
    
    closeTransactionDetail() {
      this.showTransactionDetail = false;
      this.selectedTransaction = null;
    },
    
    previewTransactionImages(transaction) {
      if (transaction.images && transaction.images.length > 0) {
        const imageUrls = transaction.images.map(img => img.imageUrl);
        uni.previewImage({
          urls: imageUrls,
          current: 0
        });
      }
    },
    
    // 判断是否是本人的交易记录
    isMyTransaction(transaction) {
      if (!this.userInfo || !transaction.userId) {
        return false;
      }
      return this.userInfo.id === transaction.userId;
    },
    
    // 删除交易记录
    async deleteTransaction(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条交易记录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await api.transactions.delete(item.id);
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 重新加载数据
              this.loadData();
            } catch (error) {
              console.error('删除失败', error);
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 月份选择变化
    onMonthChange(e) {
      this.selectedMonth = e.detail.value;
    },
    // 日期范围：开始日期变化
    onDateRangeStartChange(e) {
      const val = e.detail.value;
      this.selectedDateStart = val;
      if (this.selectedDateEnd && val > this.selectedDateEnd) {
        this.selectedDateEnd = val;
      }
    },
    // 日期范围：结束日期变化
    onDateRangeEndChange(e) {
      const val = e.detail.value;
      this.selectedDateEnd = val;
      if (this.selectedDateStart && val < this.selectedDateStart) {
        this.selectedDateStart = val;
      }
    },
    
    // 分类选择变化
    onCategoryChange(e) {
      const index = e.detail.value;
      const selectedCategory = this.categoryOptions[index];
      this.selectedCategoryId = selectedCategory ? selectedCategory.id : null;
    },
    
    // 成员选择变化
    onMemberChange(e) {
      const index = e.detail.value;
      const selectedMember = this.memberOptions[index];
      this.selectedMemberId = selectedMember ? selectedMember.id : null;
    },
    
    // 分摊成员卡片是否高亮（按成员ID单选）
    isAllocationMemberActive(member) {
      if (this.selectedAllocationMemberId === null || this.selectedAllocationMemberId === undefined || this.selectedAllocationMemberId === '') {
        return false;
      }
      return String(this.selectedAllocationMemberId) === String(member.userId);
    },

    // 点击“成员各自消费”项，切换成员筛选
    onMemberAllocationClick(member) {
      if (!member || member.userId === null || member.userId === undefined || member.userId === '') return;
      const uid = String(member.userId);
      this.selectedAllocationMemberId = String(this.selectedAllocationMemberId) === uid ? null : uid;
    }
  }
};
</script>

<style lang="scss" scoped>
.detail-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
}

.book-info-card {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  color: #FFFFFF;
  
  .book-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .book-name {
      font-size: 36rpx;
      font-weight: bold;
      flex: 1;
    }
    
    .status-badge {
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      background: rgba(255, 255, 255, 0.3);
      
      &.default {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
  
  .book-tags {
    display: flex;
    gap: 12rpx;
    margin-bottom: 16rpx;
    flex-wrap: wrap;
    
    .tag {
      font-size: 22rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      background: rgba(255, 255, 255, 0.25);
      
      &.type-tag {
        background: rgba(255, 255, 255, 0.35);
        font-weight: 500;
      }
      
      &.category-tag {
        background: rgba(255, 193, 7, 0.6);
      }
    }
  }
  
  .book-description {
    font-size: 24rpx;
    opacity: 0.9;
    margin-bottom: 32rpx;
    display: block;
  }
  
  .book-stats {
    display: flex;
    gap: 48rpx;
    margin-bottom: 32rpx;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      
      .stat-label {
        font-size: 24rpx;
        opacity: 0.8;
        margin-bottom: 8rpx;
      }
      
      .stat-value {
        font-size: 32rpx;
        font-weight: bold;
      }
    }
  }
  
  .share-code-section {
    padding-top: 32rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.3);
    
    .share-code-label {
      font-size: 24rpx;
      opacity: 0.9;
      margin-bottom: 16rpx;
      display: block;
    }
    
    .share-code-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16rpx;
      padding: 24rpx;
      
      .share-code {
        font-size: 36rpx;
        font-weight: bold;
        letter-spacing: 8rpx;
        flex: 1;
      }
      
      .share-code-actions {
        display: flex;
        gap: 12rpx;
        align-items: center;
      }
      
      .copy-btn {
        font-size: 24rpx;
        padding: 8rpx 16rpx;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 8rpx;
        white-space: nowrap;
      }
      
      .share-btn {
        font-size: 24rpx;
        padding: 8rpx 16rpx;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 8rpx;
        border: none;
        line-height: normal;
        white-space: nowrap;
        
        &::after {
          border: none;
        }
        
        text {
          color: #FFFFFF;
        }
      }
    }
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 32rpx;
  
  &.three-columns {
    grid-template-columns: repeat(3, 1fr);
  }
  
  &.four-columns {
    grid-template-columns: repeat(4, 1fr);
  }
  
  &.five-columns {
    grid-template-columns: repeat(5, 1fr);
    
    .action-btn {
      padding: 20rpx 8rpx;
      
      .action-icon {
        margin-bottom: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .action-text {
        font-size: 22rpx;
      }
    }
  }
  
  .action-btn {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: none;
    
    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    
    &.share-btn {
      background: #FFFFFF;
      border: none;
      padding: 24rpx;
      line-height: normal;
      
      &::after {
        border: none;
      }
    }
    
    .action-icon {
      margin-bottom: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .action-text {
      font-size: 24rpx;
      color: #333333;
    }
  }
}

.recent-transactions {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .section-count {
      font-size: 24rpx;
      color: #999999;
    }
  }
  
  .filter-summary-section {
    padding: 24rpx;
    margin: 0 -32rpx 16rpx -32rpx;
    border-bottom: 1rpx solid #F0F0F0;
    
    .filter-section {
      margin-bottom: 20rpx;
      
      .filter-row {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
      
      .filter-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .filter-label {
          font-size: 26rpx;
          color: #666666;
          width: 80rpx;
          flex-shrink: 0;
        }
        
        .date-range-pickers {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12rpx;
          
          .date-range-sep {
            font-size: 24rpx;
            color: #999999;
            flex-shrink: 0;
          }
          
          .filter-picker.date-picker {
            flex: 1;
            min-width: 0;
          }
        }
        
        .filter-picker {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12rpx 16rpx;
          background: #F8F8F8;
          border-radius: 8rpx;
          font-size: 26rpx;
          color: #333333;
          
          .picker-arrow {
            width: 20rpx;
            height: 26rpx;
            position: relative;
            
            &::after {
              content: '>';
              position: absolute;
              right: 0;
              color: #999999;
              font-size: 24rpx;
            }
          }
        }
        
        .type-filter {
          flex: 1;
          display: flex;
          gap: 12rpx;
          
          .type-filter-item {
            flex: 1;
            padding: 10rpx 16rpx;
            background: #F8F8F8;
            border-radius: 8rpx;
            text-align: center;
            font-size: 24rpx;
            color: #666666;
            transition: all 0.3s;
            
            &.active {
              background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
              color: #FFFFFF;
              font-weight: 500;
            }
          }
        }
      }
      }
    }
    
    .member-allocation-section {
      margin-top: 24rpx;
      padding-top: 20rpx;
      border-top: 1rpx solid #F0F0F0;
      .member-allocation-title {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 16rpx;
        font-weight: 500;
      }
      .member-allocation-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16rpx;
      }
      .member-allocation-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12rpx 8rpx;
        background: #F8F8F8;
        border-radius: 12rpx;
        min-width: 0;
        border: 2rpx solid transparent;
        
        &.active {
          background: #FFF0F0;
          border-color: #F7B84D;
        }
      }
      .member-name {
        font-size: 22rpx;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }
      .member-amount {
        margin-top: 8rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: #F5A623;
      }
    }
    
    .summary-section {
      padding: 0;
      margin-bottom: 0;
      display: flex;
      justify-content: space-around;
      
      .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        flex: 1;
        
        .summary-label {
          font-size: 24rpx;
          color: #999999;
        }
        
        .summary-amount {
          font-size: 32rpx;
          font-weight: bold;
          color: #333333;
          
          &.negative {
            color: #E85D4B;
          }
        }
        
        &.expense .summary-amount {
          color: #E85D4B;
        }
        
        &.income .summary-amount {
          color: #5CB85C;
        }
        
        &.balance .summary-amount {
          color: #333333;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 80rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #999999;
    }
  }
  
  .transaction-list {
    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #F0F0F0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .transaction-left {
        display: flex;
        align-items: center;
        flex: 1;
        
        .category-icon {
          width: 72rpx;
          height: 72rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36rpx;
          margin-right: 20rpx;
        }
        
        .transaction-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          
          .category-name {
            font-size: 27rpx;
            color: #333333;
            margin-bottom: 6rpx;
          }
          
          .transaction-remark {
            font-size: 23rpx;
            color: #999999;
            margin-bottom: 5rpx;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
          }
          
          .transaction-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8rpx;
            margin-top: 4rpx;
          }
          
          .transaction-date {
            font-size: 23rpx;
            color: #999999;
          }
          
          .transaction-creator {
            font-size: 23rpx;
            color: #999999;
          }
        }
      }
      
      .transaction-right {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .transaction-amount-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5rpx;
          
          .allocation-avatars {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 6rpx;
            margin-bottom: 4rpx;
          }
          
          .allocation-avatar-circle {
            width: 36rpx;
            height: 36rpx;
            border-radius: 50%;
            background: #CCCCCC;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 20rpx;
            font-weight: bold;
          }
          
          .transaction-amount {
            font-size: 30rpx;
            font-weight: bold;
            
            &.expense {
              color: #E85D4B;
            }
            
            &.income {
              color: #5CB85C;
            }
          }
        }
      }
    }
  }
}
</style>


