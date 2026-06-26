<template>
  <view class="index-container">
    <!-- 顶部区域（上 1/3 + 底部圆弧） -->
    <view class="top-bg">
      <!-- 账本类型 + 账本选择器（卡片外部上方，同一行） -->
      <view class="header-row">
        <view class="account-type-switch" @click.stop>
          <view class="switch-track">
            <view
              class="switch-thumb"
              :class="{ 'switch-thumb--right': accountBookTab === 'shared' }"
            />
            <view class="switch-labels">
              <view
                class="switch-label"
                :class="{ 'switch-label--active': accountBookTab === 'personal' }"
                @click="switchAccountBookTab('personal')"
              >
                <text>个人账本</text>
              </view>
              <view
                class="switch-label"
                :class="{ 'switch-label--active': accountBookTab === 'shared' }"
                @click="switchAccountBookTab('shared')"
              >
                <text>集体账本</text>
              </view>
            </view>
          </view>
        </view>
        <view class="header-right">
          <view 
            class="account-book-selector" 
            @click="openAccountBookPicker"
          >
            <text class="account-book-name">{{ currentBook?.name || '选择账本' }}</text>
            <text class="selector-arrow">▼</text>
          </view>
          <view class="add-book-btn" @click="goToCreateAccountBook">
            <app-icon class="add-book-icon" name="plusempty" :size="18" color="#F5A623" />
          </view>
        </view>
      </view>
      <!-- 账本统计卡片 -->
      <view class="stats-card">
        <view class="stats-content-wrapper">
          <!-- 集体账本且无账本时显示引导 -->
          <view v-if="accountBookTab === 'shared' && !currentSharedBook" class="no-shared-book">
            <view class="empty-icon">
              <app-icon name="staff" :size="40" color="#F5A623" />
            </view>
            <text class="empty-title">还没有集体账本</text>
            <text class="empty-desc">创建或加入集体账本，和家人朋友一起记账</text>
            <view class="empty-btns">
              <view class="empty-btn primary" @click="goToCreateAccountBook">
                <text>创建账本</text>
              </view>
              <view class="empty-btn secondary" @click="goToJoinAccountBook">
                <text>加入账本</text>
              </view>
            </view>
          </view>
          <!-- 有统计内容时：个人账本 或 已选集体账本 -->
          <template v-else>
            <view class="stats-header">
              <text class="stats-title">{{ statsTitle }}</text>
            </view>
            <view class="stats-content">
              <view class="stat-item stat-item--expense">
                <text class="stat-label">支出</text>
                <text class="stat-value expense">￥{{ formatAmount(currentMonthExpense) }}</text>
              </view>
              <template v-if="currentBook && currentMonthIncome > 0">
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-label">收入</text>
                <text class="stat-value income">￥{{ formatAmount(currentMonthIncome) }}</text>
              </view>
              </template>
              <template v-if="currentBook && currentBook.budget > 0">
                <view class="stat-divider"></view>
                <view class="stat-item stat-item--budget">
                  <text class="stat-label">预算剩余</text>
                  <text class="stat-value budget">￥{{ (currentBudgetRemaining ?? 0).toFixed(2) }}</text>
                </view>
              </template>
            </view>
            <view class="stats-book-link" v-if="currentBook" @click="goToCurrentBookDetail">
              <text>共{{ displayTransactionsCount }}笔交易，查看全部{{ '>' }}</text>
            </view>
          </template>
        </view>
      </view>
    </view>
    
    <view v-if="isGuestMode" class="guest-tip-bar" @click="goToLogin">
      <text class="guest-tip-text">访客模式下，微信登录后可使用记账等完整功能</text>
      <text class="guest-tip-action">去登录 ›</text>
    </view>
    
    <!-- 昨日 / 今日 / 本周支出统计 -->
    <view class="period-summary-strip" v-if="showPeriodSummary" @click="goToStatistics">
      <view class="strip-header">
        <view class="strip-title-wrap">
          <app-icon class="strip-title-icon" name="bars" :size="16" color="#F5A623" />
          <text class="strip-title">收支小结</text>
        </view>
      </view>
      <view class="strip-items">
        <view
          v-for="item in periodSummaryItems"
          :key="item.key"
          class="strip-item"
        >
          <text class="strip-amount">¥{{ item.expenseAmount.toFixed(2) }}</text>
          <text class="strip-name">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 最近交易 -->
    <view class="recent-transactions" :class="{ 'has-top-gap': !showPeriodSummary }">
      <view class="section-header">
        <view class="section-title-wrap">
          <app-icon class="section-title-icon" name="list" :size="16" color="#F5A623" />
          <text class="section-title">最近交易</text>
        </view>
        <view class="section-more" @click="viewAllTransactions">
          <text>查看全部</text>
          <text class="more-arrow">{{ '>' }}</text>
        </view>
      </view>
      
      <view v-if="displayTransactions.length === 0" class="empty-state">
        <text class="empty-text">还没有交易记录</text>
        <text class="empty-hint">点击上方按钮开始记账吧~</text>
      </view>
      
      <view v-else class="transaction-list">
        <view 
          v-for="item in displayTransactions" 
          :key="item.id"
          class="transaction-item"
          @click="viewTransaction(item)"
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
                <text v-if="item.accountBookType === 1 && item.userName" class="transaction-creator">{{ item.userName }}</text>
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
              <view v-if="item.accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0" class="allocation-avatars">
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

    <app-tab-bar :current="0" />

    <!-- 账本选择器弹窗（置于 TabBar 之后，z-index 高于 TabBar） -->
    <view v-if="showAccountBookPicker" class="account-book-picker-modal" @click="showAccountBookPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择账本</text>
          <text class="picker-close" @click="showAccountBookPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="picker-body" :show-scrollbar="false">
          <view v-if="pickerPersonalAccountBooks.length > 0" class="account-book-group">
            <text class="group-title">个人账本</text>
            <view 
              v-for="book in pickerPersonalAccountBooks" 
              :key="book.id"
              class="account-book-item"
              :class="{ active: currentAccountBook?.id === book.id && currentAccountBook?.type === 0 }"
              @click="selectAccountBook(book)"
            >
              <view class="book-info">
                <view class="book-name-row">
                  <text class="book-name">{{ book.name }}</text>
                  <text class="book-category" v-if="book.categoryName">{{ book.categoryName }}</text>
                </view>
                <text class="book-desc" v-if="book.description">{{ book.description }}</text>
              </view>
              <text v-if="currentAccountBook?.id === book.id && currentAccountBook?.type === 0" class="check-icon">✓</text>
            </view>
          </view>
          <view v-if="pickerPersonalAccountBooks.length === 0" class="empty-account-books">
            <text class="empty-text">还没有账本</text>
            <text class="empty-hint">点击下方按钮创建账本</text>
          </view>
          <view class="picker-body-pad" />
        </scroll-view>
      </view>
    </view>
    
    <view v-if="showSharedBookPicker" class="account-book-picker-modal" @click="showSharedBookPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择集体账本</text>
          <text class="picker-close" @click="showSharedBookPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="picker-body" :show-scrollbar="false">
          <view v-if="pickerSharedAccountBooks.length > 0" class="account-book-group">
            <view 
              v-for="book in pickerSharedAccountBooks" 
              :key="book.id"
              class="account-book-item"
              :class="{ active: currentSharedBook?.id === book.id }"
              @click="selectSharedBook(book)"
            >
              <view class="book-info">
                <view class="book-name-row">
                  <text class="book-name">{{ book.name }}</text>
                  <text class="book-category" v-if="book.categoryName">{{ book.categoryName }}</text>
                </view>
                <text class="book-desc">{{ book.memberCount || 1 }}人共同记账</text>
              </view>
              <text v-if="currentSharedBook?.id === book.id" class="check-icon">✓</text>
            </view>
          </view>
          <view v-else class="empty-account-books">
            <text class="empty-text">还没有集体账本</text>
          </view>
          <view class="picker-body-pad" />
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate, formatAmount, getDateRange, calculateTotal } from '@/utils/util';
import { hideNativeTabBar } from '@/utils/tabBar';
import { pickLatestActiveSharedBook } from '@/utils/accountBook';
import { requireWechatLogin } from '@/utils/auth';
import { mapState, mapActions } from 'vuex';
import TransactionDetail from '@/components/transaction-detail/transaction-detail.vue';

export default {
  components: {
    TransactionDetail
  },
  data() {
    return {
      recentTransactions: [],
      monthExpense: 0,
      monthIncome: 0,
      loading: false,
      showAccountBookPicker: false,
      showSharedBookPicker: false, // 集体账本选择器
      allAccountBooks: [], // 所有账本（个人+集体）
      personalAccountBooks: [], // 个人账本
      sharedAccountBooks: [], // 集体账本
      showTransactionDetail: false, // 是否显示交易详情弹框
      selectedTransaction: null, // 选中的交易
      allTransactionsCount: 0, // 所有交易记录总数
      accountBookTab: 'personal', // 当前选项卡：'personal' 或 'shared'
      currentSharedBook: null, // 当前选中的集体账本
      sharedMonthExpense: 0, // 集体账本本月支出
      sharedMonthIncome: 0, // 集体账本本月收入
      sharedRecentTransactions: [], // 集体账本最近交易
      sharedTransactionsCount: 0, // 集体账本交易总数
      periodSummary: null // 昨日 / 今日 / 本周支出统计
    };
  },
  computed: {
    ...mapState(['currentAccountBook', 'userInfo', 'isGuestMode']),
    currentMonth() {
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月`;
    },
    balance() {
      return this.monthIncome - this.monthExpense;
    },
    sharedBalance() {
      return this.sharedMonthIncome - this.sharedMonthExpense;
    },
    budgetRemainingPersonal() {
      const budget = this.currentPersonalBook?.budget;
      if (budget == null || budget <= 0) return null;
      const expenseYuan = (this.monthExpense || 0) / 100;
      return Number((budget - expenseYuan).toFixed(2));
    },
    budgetRemainingShared() {
      const budget = this.currentSharedBook?.budget;
      if (budget == null || budget <= 0) return null;
      const expenseYuan = (this.sharedMonthExpense || 0) / 100;
      return Number((budget - expenseYuan).toFixed(2));
    },
    currentPersonalBook() {
      // 获取当前个人账本，优先从列表取（含 budget 等最新字段），避免用 store 里可能缺字段的缓存
      const list = this.personalAccountBooks || [];
      if (this.currentAccountBook?.type === 0 && this.currentAccountBook?.id) {
        const fromList = list.find(b => b.id === this.currentAccountBook.id);
        if (fromList) return fromList;
        return this.currentAccountBook;
      }
      return list[0] || null;
    },
    // 当前选项卡对应的账本（个人或集体）
    currentBook() {
      return this.accountBookTab === 'personal' ? this.currentPersonalBook : this.currentSharedBook;
    },
    // 当前选项卡的本月支出（分）
    currentMonthExpense() {
      return this.accountBookTab === 'personal' ? this.monthExpense : this.sharedMonthExpense;
    },
    // 当前选项卡的本月收入（分）
    currentMonthIncome() {
      return this.accountBookTab === 'personal' ? this.monthIncome : this.sharedMonthIncome;
    },
    // 当前选项卡的预算剩余（元）
    currentBudgetRemaining() {
      return this.accountBookTab === 'personal' ? this.budgetRemainingPersonal : this.budgetRemainingShared;
    },
    // 收支概况标题：集体账本有起止日期时显示日期范围，否则显示本月
    statsTitle() {
      if (this.accountBookTab === 'shared') {
        return `总收支概况`;
      }
      return '本月收支概况';
    },
    showPeriodSummary() {
      if (this.isGuestMode || !this.$store.state.token) return false;
      return !!this.currentBook;
    },
    periodSummaryItems() {
      const s = this.periodSummary || {};
      const yesterday = s.yesterday || {};
      const today = s.today || {};
      const thisWeek = s.thisWeek || {};
      return [
        { key: 'yesterday', label: '昨日', expenseAmount: Number(yesterday.expenseAmount) || 0 },
        { key: 'today', label: '今日', expenseAmount: Number(today.expenseAmount) || 0 },
        { key: 'week', label: '本周', expenseAmount: Number(thisWeek.expenseAmount) || 0 }
      ];
    },
    // 账本弹窗仅展示进行中的账本
    pickerPersonalAccountBooks() {
      return (this.personalAccountBooks || []).filter(b => b.status !== 1);
    },
    pickerSharedAccountBooks() {
      return (this.sharedAccountBooks || []).filter(b => b.status !== 1);
    },
    // 根据选项卡显示对应的交易记录
    displayTransactions() {
      if (this.accountBookTab === 'shared') {
        return this.sharedRecentTransactions;
      }
      return this.recentTransactions;
    },
    // 根据选项卡显示对应的交易总数
    displayTransactionsCount() {
      if (this.accountBookTab === 'shared') {
        return this.sharedTransactionsCount;
      }
      return this.allTransactionsCount;
    }
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    hideNativeTabBar();
    // 读取本地存储的选项卡状态
    const savedTab = uni.getStorageSync('accountBookTab');
    if (savedTab && (savedTab === 'personal' || savedTab === 'shared')) {
      this.accountBookTab = savedTab;
    }
    // 页面显示时刷新数据（从其他页面返回时）
    this.loadData().then(() => {
      // 如果是集体账本选项卡，加载集体账本数据
      if (this.accountBookTab === 'shared') {
        if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
          this.applyDefaultSharedBook(this.sharedAccountBooks);
        }
        this.loadSharedBookData();
      }
    });
  },
  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh();
    });
  },
  methods: {
    ...mapActions(['setCurrentAccountBook', 'updateAccountBooks', 'setCurrentSharedAccountBook']),
    
    formatDate,
    formatAmount,

    applyDefaultSharedBook(books) {
      const book = pickLatestActiveSharedBook(books);
      if (!book) {
        this.currentSharedBook = null;
        return;
      }
      this.setCurrentSharedBook(book);
    },

    setCurrentSharedBook(book) {
      this.currentSharedBook = book;
      if (book) {
        this.setCurrentSharedAccountBook({ ...book, type: 1 });
      }
    },
    
    async loadPeriodSummary(bookId) {
      if (!bookId || this.isGuestMode || !this.$store.state.token) {
        this.periodSummary = null;
        return;
      }
      try {
        const summary = await api.transactions.getPeriodSummary(bookId);
        if (this.currentBook?.id === bookId) {
          this.periodSummary = summary;
        }
      } catch (error) {
        console.error('加载周期统计失败', error);
        if (this.currentBook?.id === bookId) {
          this.periodSummary = {
            yesterday: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 },
            today: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 },
            thisWeek: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 }
          };
        }
      }
    },
    
    async loadData() {
      // 如果是体验模式，不加载数据
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.recentTransactions = [];
        this.allTransactionsCount = 0;
        this.monthExpense = 0;
        this.monthIncome = 0;
        this.periodSummary = null;
        return;
      }
      
      // 先加载账本列表
      await this.loadAccountBooks();
      
      if (!this.currentAccountBook) {
        return;
      }
      
      this.loading = true;
      
      try {
        // 获取本月交易记录
        const dateRange = getDateRange('month');
        const transactions = await api.transactions.getByDateRange(
          this.currentAccountBook.id,
          dateRange.startDate,
          dateRange.endDate
        );
        
        // 计算本月收支
        this.monthExpense = calculateTotal(transactions, 0) * 100; // 转为分
        this.monthIncome = calculateTotal(transactions, 1) * 100;
        
        // 获取所有交易记录，取最近10条展示
        const allTransactions = await api.transactions.getByAccountBook(this.currentAccountBook.id);
        this.allTransactionsCount = allTransactions.length;
        this.recentTransactions = allTransactions.slice(0, 8);
        await this.loadPeriodSummary(this.currentAccountBook.id);
        
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
    
    async loadAccountBooks() {
      // 如果是体验模式，不加载账本
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.allAccountBooks = [];
        this.personalAccountBooks = [];
        this.sharedAccountBooks = [];
        return;
      }
      
      try {
        // 加载个人账本
        const personalBooks = await api.accountBooks.getList();
        
        // 加载集体账本
        let sharedBooks = [];
        try {
          sharedBooks = await api.sharedAccountBooks.getList();
        } catch (error) {
          console.error('加载集体账本失败', error);
        }
        
        // 合并所有账本
        this.allAccountBooks = [...personalBooks, ...sharedBooks];
        this.personalAccountBooks = personalBooks;
        this.sharedAccountBooks = sharedBooks;
        
        // 如果没有当前账本，设置默认账本
        if (!this.currentAccountBook && this.allAccountBooks.length > 0) {
          const defaultBook = personalBooks.find(ab => ab.isDefault) || personalBooks[0] || sharedBooks[0];
          if (defaultBook) {
            this.setCurrentAccountBook(defaultBook);
          }
        }
        
        // 设置默认集体账本（最近一个进行中的）
        if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
          this.applyDefaultSharedBook(sharedBooks);
        }
      } catch (error) {
        console.error('加载账本失败', error);
      }
    },
    
    // 切换账本类型选项卡
    switchAccountBookTab(tab) {
      this.accountBookTab = tab;
      uni.setStorageSync('accountBookTab', tab);
      if (tab === 'shared') {
        if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
          this.applyDefaultSharedBook(this.sharedAccountBooks);
        }
        this.loadSharedBookData();
      } else if (this.currentPersonalBook?.id) {
        this.loadPeriodSummary(this.currentPersonalBook.id);
      }
    },
    
    openAccountBookPicker() {
      if (this.accountBookTab === 'personal') {
        this.showAccountBookPicker = true;
      } else {
        this.showSharedBookPicker = true;
      }
    },
    
    // 加载集体账本数据
    async loadSharedBookData() {
      if (!this.currentSharedBook) {
        this.sharedRecentTransactions = [];
        this.sharedTransactionsCount = 0;
        this.sharedMonthExpense = 0;
        this.sharedMonthIncome = 0;
        this.periodSummary = null;
        return;
      }
      let book = this.currentSharedBook;
      // 若列表中的书缺少 startDate/endDate，则拉取详情保证有起止日期
      const needDates = book.startDate == null || book.endDate == null;
      if (needDates) {
        try {
          const full = await api.sharedAccountBooks.getById(book.id);
          if (full) {
            book = full;
            this.currentSharedBook = full;
            const idx = this.sharedAccountBooks.findIndex(b => b.id === book.id);
            if (idx >= 0) this.sharedAccountBooks[idx] = full;
          }
        } catch (e) {
          console.warn('拉取集体账本详情失败', e);
        }
      }
      
      try {
        let startDate;
        let endDate;
        if (book.startDate != null && book.endDate != null) {
          // 有起止日期：按账本起止日期统计，截止日期取当天 23:59:59 以包含全天
          startDate = String(book.startDate).substring(0, 10);
          endDate = String(book.endDate).substring(0, 10) + 'T23:59:59';
        } else {
          // 无起止日期：按本月统计
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }
        
        // 获取该日期范围内的交易记录
        const monthTransactions = await api.transactions.getByDateRange(
          book.id,
          startDate,
          endDate
        );
        
        // 计算收支
        this.sharedMonthExpense = monthTransactions
          .filter(t => t.type === 0)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) * 100;
        this.sharedMonthIncome = monthTransactions
          .filter(t => t.type === 1)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) * 100;
        
        // 获取全部交易记录用于显示最近交易
        const allTransactions = await api.transactions.getByAccountBook(book.id);
        this.sharedTransactionsCount = allTransactions.length;
        this.sharedRecentTransactions = allTransactions.slice(0, 8);
        await this.loadPeriodSummary(book.id);
      } catch (error) {
        console.error('加载集体账本数据失败', error);
        this.sharedMonthExpense = 0;
        this.sharedMonthIncome = 0;
        this.sharedRecentTransactions = [];
        this.sharedTransactionsCount = 0;
        this.periodSummary = null;
      }
    },
    
    // 选择集体账本
    selectSharedBook(book) {
      this.setCurrentSharedBook(book);
      this.showSharedBookPicker = false;
      this.loadSharedBookData();
    },
    
    selectAccountBook(accountBook) {
      this.setCurrentAccountBook(accountBook);
      this.showAccountBookPicker = false;
      // 重新加载数据
      this.loadData();
    },
    
    getAccountBookTypeText(accountBook) {
      if (!accountBook) return '';
      return accountBook.type === 0 ? '个人' : '集体';
    },
    
    goToAccountBooks() {
      uni.navigateTo({
        url: '/pages/account-books/account-books'
      });
    },
    
    goToSharedAccountBooks() {
      // 已整合到账本页面
      uni.navigateTo({
        url: '/pages/account-books/account-books'
      });
    },
    
    goToSharedAccountBookDetail(book) {
      this.setCurrentSharedBook(book);
      uni.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}`
      });
    },
    
    goToPersonalAccountBookDetail() {
      if (!this.currentPersonalBook) {
        uni.showToast({
          title: '请先选择账本',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${this.currentPersonalBook.id}&type=0`
      });
    },
    /** 进入当前选项卡对应的账本详情（个人/集体统一入口） */
    goToCurrentBookDetail() {
      if (!this.currentBook) {
        uni.showToast({
          title: this.accountBookTab === 'shared' ? '请先选择集体账本' : '请先选择账本',
          icon: 'none'
        });
        return;
      }
      if (this.accountBookTab === 'shared') {
        this.goToSharedAccountBookDetail(this.currentBook);
      } else {
        this.goToPersonalAccountBookDetail();
      }
    },
    
    goToJoinAccountBook() {
      if (!requireWechatLogin()) {
        return;
      }
      uni.navigateTo({
        url: '/pages/join-account-book/join-account-book'
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
    
    goToAIRecord() {
      if (!requireWechatLogin()) {
        return;
      }
      // 设置切换到AI tab的标志
      this.$store.dispatch('setSwitchToAITab', true);
      uni.navigateTo({
        url: '/pages/add-transaction/add-transaction'
      });
    },
    
    goToStatistics() {
      uni.switchTab({
        url: '/pages/statistics/statistics'
      });
    },

    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    viewAllTransactions() {
      // 根据选项卡跳转到对应账本详情页
      if (this.accountBookTab === 'shared') {
        // 集体账本
        if (!this.currentSharedBook) {
          uni.showToast({
            title: '请先选择集体账本',
            icon: 'none'
          });
          return;
        }
        this.goToSharedAccountBookDetail(this.currentSharedBook);
      } else {
        // 个人账本
        if (!this.currentAccountBook) {
          uni.showToast({
            title: '请先选择账本',
            icon: 'none'
          });
          return;
        }
        uni.navigateTo({
          url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${this.currentAccountBook.id}&type=${this.currentAccountBook.type || 0}`
        });
      }
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
    }
  }
};
</script>

<style lang="scss" scoped>
.index-container {
  padding: 12rpx 24rpx calc(160rpx + env(safe-area-inset-bottom)) 24rpx;
  padding-top: 0;
  background: #F5F5F5;
  min-height: 100vh;
  box-sizing: border-box;
}

.guest-tip-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 20rpx 24rpx;
  background: #FFF5E8;
  border-radius: 16rpx;
  border: 1rpx solid #F5D9A8;

  .guest-tip-text {
    flex: 1;
    font-size: 24rpx;
    color: #8A5A14;
    line-height: 1.5;
  }

  .guest-tip-action {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #F5A623;
    font-weight: 600;
  }
}

/* 顶部区域：上 1/3，底部圆弧 */
.top-bg {
  height: 27vh;
  min-height: 240rpx;
  margin-left: -24rpx;
  margin-right: -24rpx;
  margin-bottom: 30rpx;
  background: #F5F5F5;
  padding: 24rpx 24rpx 0;
  border-radius: 0;
  box-sizing: border-box;
}

/* 账本类型 + 账本选择器（卡片外部上方，同一行） */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0rpx;
  margin-bottom: 60rpx;
}

/* 账本类型：类 switch 左右滑动拇指 */
.account-type-switch {
  flex-shrink: 0;
}

.switch-track {
  position: relative;
  width: 268rpx;
  height: 58rpx;
  padding: 3rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.32);
  border-radius: 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.38);
}

.switch-thumb {
  position: absolute;
  top: 3rpx;
  left: 3rpx;
  width: calc(50% - 3rpx);
  height: calc(100% - 6rpx);
  background: #F5A623;
  border-radius: 26rpx;
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.1);
  transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  pointer-events: none;
}

.switch-thumb--right {
  left: calc(50% + 0rpx);
}

.switch-labels {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  height: 100%;
}

.switch-label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 600;
  color: #666666;
  transition: color 0.2s ease;
}

.switch-label--active {
  color: #ffffff;
  font-size: 24rpx;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.header-row .account-book-selector {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  background: #ffffff;
  border-radius: 32rpx;
  
  .account-book-name {
    font-size: 28rpx;
    color: #333333;
    max-width: 240rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  
  .selector-arrow {
    font-size: 20rpx;
    color: #666666;
  }
}

.add-book-btn {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  
  &:active {
    opacity: 0.9;
  }
  
  .add-book-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translateY(-2rpx);
  }
}

.stats-card {
  position: relative;
  overflow: hidden;
  padding: 24rpx 12rpx;
  margin: -48rpx 0 -48rpx;
  width: 100%;
  border-radius: 24rpx;
  color: #333333;
  height: auto;
  box-sizing: border-box;
  background-image: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  background-color: #F5A623;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  box-shadow: 0 8rpx 24rpx rgba(245, 166, 35, 0.25);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-image: url("/static/moneypocket2.png");
    background-repeat: no-repeat;
    background-size: 36%;
    background-position: -40rpx 130rpx;
    opacity: 0.4;
    pointer-events: none;
    z-index: 0;
  }

  .stats-content-wrapper {
    position: relative;
    z-index: 1;
    .stats-book-link {
      margin-top: 36rpx;
      display: flex;
      justify-content: center;

      text {
        font-size: 24rpx;
        color: #888888;
        line-height: 1.4;
      }

      &:active {
        opacity: 0.7;
      }
    }
    
    .no-shared-book {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32rpx 0;
      
      .empty-icon {
        margin-bottom: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .empty-title {
        font-size: 32rpx;
        font-weight: 600;
        margin-bottom: 12rpx;
        color: #333333;
      }
      
      .empty-desc {
        font-size: 24rpx;
        color: #666666;
        margin-bottom: 32rpx;
        text-align: center;
      }
      
      .empty-btns {
        display: flex;
        gap: 24rpx;
        
        .empty-btn {
          padding: 16rpx 32rpx;
          border-radius: 32rpx;
          font-size: 26rpx;
          
          &.primary {
            background: #FFFFFF;
            color: #F5A623;
          }
          
          &.secondary {
            background: #F5F5F5;
            color: #F5A623;
          }
        }
      }
    }
  }
  
  .stats-header {
    margin-bottom: 24rpx;
    text-align: left;
    margin-left: 18rpx;
    .stats-title {
      font-size: 24rpx;
      color: #666666;
    }
  }
  
  .account-book-meta {
    display: flex;
    justify-content: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
    flex-wrap: wrap;
    
    .meta-tag {
      font-size: 22rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      background: rgba(255, 255, 255, 0.25);
      
      &.type-tag {
        background: rgba(255, 255, 255, 0.35);
        font-weight: 500;
        
        &.shared {
          background: rgba(245, 166, 35, 0.35);
        }
      }
      
      &.category-tag {
        background: rgba(255, 193, 7, 0.4);
      }
      
      &.members-tag {
        background: rgba(156, 39, 176, 0.4);
      }
    }
  }
  
  .stats-content {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    width: 100%;
    box-sizing: border-box;
    
    .stat-divider {
      width: 2rpx;
      height: 64rpx;
      background: rgba(0, 0, 0, 0.1);
      flex: 0 0 2rpx;
    }
    
    .stat-item {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      
      .stat-label {
        font-size: 20rpx;
        color: #000;
        margin-bottom: 12rpx;
        width: 100%;
        text-align: center;
      }

      &.stat-item--expense,
      &.stat-item--budget {
        .stat-label {
          font-size: 24rpx;
          color: #888888;
        }
      }
      
      .stat-value {
        font-size: 54rpx;
        font-weight: bold;
        color: #333333;
        width: 100%;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        
        &.expense {
          font-size: 64rpx;
          color: #000000;
        }
        
        &.budget {
          font-size: 64rpx;
          color: #000000;
        }

        &.income {
          color: #5CB85C;
        }
        .stat-value-symbol {
          font-size: 38rpx;
        }
      }

      &.stat-item--expense .stat-value .stat-value-symbol,
      &.stat-item--budget .stat-value .stat-value-symbol {
        font-size: 38rpx;
      }
    }
  }
  
  .balance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.3);
    
    .balance-label {
      font-size: 28rpx;
      opacity: 0.9;
    }
    
    .balance-value {
      font-size: 40rpx;
      font-weight: bold;
      
      &.positive {
        color: #FFE66D;
      }
      
      &.negative {
        color: #FFFFFF;
      }
    }
  }
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 16rpx;
  margin-bottom: 32rpx;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .action-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      margin-bottom: 12rpx;
      
      &.expense {
        background: linear-gradient(135deg, #E85D4B 0%, #F08A72 100%);
        color: #FFFFFF;
      }
      
      &.income {
        background: linear-gradient(135deg, #5CB85C 0%, #7BC87E 100%);
        color: #FFFFFF;
      }
      
      &.shared {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        color: #FFFFFF;
      }
      
      &.create {
        background: linear-gradient(135deg, #FFA500 0%, #FFB84D 100%);
        color: #FFFFFF;
      }
      
      &.join {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        color: #FFFFFF;
      }
    }
    
    .action-text {
      font-size: 22rpx;
      color: #333333;
    }
  }
}

.shared-books-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 32rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .section-icon {
        font-size: 36rpx;
      }
      
      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
    }
    
    .section-actions {
      display: flex;
      gap: 16rpx;
      
      .action-btn {
        padding: 10rpx 20rpx;
        border-radius: 24rpx;
        font-size: 24rpx;
        
        &.create-btn {
          background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
          color: #FFFFFF;
        }
        
        &.join-btn {
          background: #F5F5F5;
          color: #666666;
        }
      }
    }
  }
  
  .shared-books-list {
    .shared-book-card {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: linear-gradient(135deg, #FFFBF5 0%, #FFFFFF 100%);
      border-radius: 16rpx;
      margin-bottom: 16rpx;
      border: 2rpx solid #F5E8D0;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &:active {
        opacity: 0.8;
      }
      
      .book-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 16rpx;
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 36rpx;
        font-weight: bold;
        margin-right: 20rpx;
        flex-shrink: 0;
      }
      
      .book-content {
        flex: 1;
        min-width: 0;
        
        .book-name {
          display: block;
          font-size: 30rpx;
          font-weight: 600;
          color: #333333;
          margin-bottom: 6rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .book-members {
          display: block;
          font-size: 24rpx;
          color: #999999;
        }
      }
      
      .book-arrow {
        font-size: 32rpx;
        color: #CCCCCC;
        margin-left: 16rpx;
      }
    }
    
    .view-more {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20rpx;
      color: #F5A623;
      font-size: 26rpx;
      
      .more-arrow {
        margin-left: 8rpx;
      }
	 .more-arrow:after {
		 content:">" ;
	 }
    }
  }
  
  .empty-shared-books {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx 0;
    
    .empty-illustration {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }
    
    .empty-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333333;
      margin-bottom: 12rpx;
    }
    
    .empty-desc {
      font-size: 26rpx;
      color: #999999;
      margin-bottom: 32rpx;
    }
    
    .empty-actions {
      display: flex;
      gap: 24rpx;
      
      .empty-btn {
        padding: 20rpx 40rpx;
        border-radius: 40rpx;
        font-size: 28rpx;
        
        &.primary {
          background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
          color: #FFFFFF;
        }
        
        &.secondary {
          background: #F5F5F5;
          color: #666666;
        }
      }
    }
  }
}

.period-summary-strip {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0rpx;
  margin-bottom: 24rpx;
  padding: 24rpx 28rpx;
  background: #FFFFFF;
  border-radius: 18rpx;

  .strip-header {
    margin-bottom: 16rpx;
  }

  .strip-title-wrap {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .strip-title-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .strip-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .strip-items {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
  }

  .strip-item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    padding: 0 20rpx;
    box-sizing: border-box;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }

    &:not(:last-child) {
      border-right: 1rpx solid #E8E8E8;
    }

    .strip-name {
      font-size: 26rpx;
      color: #999999;
      text-align: center;
    }

    .strip-amount {
      font-size: 34rpx;
      color: #333333;
      font-weight: 600;
      white-space: nowrap;
      text-align: center;
    }
  }
}

.recent-transactions {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0;

  &.has-top-gap {
    margin-top: 56rpx;
  }
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }

    .section-title-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .section-more {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 24rpx;
      color: #999999;
      
      .more-arrow {
        font-size: 28rpx;
        color: #CCCCCC;
      }
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #999999;
      margin-bottom: 16rpx;
    }
    
    .empty-hint {
      font-size: 24rpx;
      color: #CCCCCC;
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
          
          .transaction-images {
            position: relative;
            
            .transaction-thumbnail {
              width: 60rpx;
              height: 60rpx;
              border-radius: 8rpx;
              border: 1rpx solid #F5F5F5;
            }
            
            .image-count {
              position: absolute;
              top: -6rpx;
              right: -6rpx;
              background: #F5A623;
              color: #FFFFFF;
              font-size: 18rpx;
              padding: 2rpx 6rpx;
              border-radius: 8rpx;
              min-width: 24rpx;
              text-align: center;
              line-height: 1.2;
              border: 2rpx solid #FFFFFF;
            }
          }
        }
      }
    }
  }
}

.account-book-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
  
  .picker-content {
    width: 100%;
    max-height: 75vh;
    background: #FFFFFF;
    border-radius: 32rpx 32rpx 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom);
    
    .picker-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 32rpx;
      border-bottom: 1rpx solid #F5F5F5;
      
      .picker-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }
      
      .picker-close {
        font-size: 48rpx;
        color: #999999;
        line-height: 1;
      }
    }
    
    .picker-body {
      flex: 1;
      min-height: 0;
      max-height: calc(75vh - 120rpx);
      box-sizing: border-box;
      padding: 24rpx;
      
      .picker-body-pad {
        height: 24rpx;
      }
      
      .account-book-group {
        margin-bottom: 32rpx;
        
        .group-title {
          font-size: 24rpx;
          color: #999999;
          margin-bottom: 16rpx;
          display: block;
        }
        
        .account-book-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24rpx;
          background: #F5F5F5;
          border-radius: 16rpx;
          margin-bottom: 16rpx;
          
          &.active {
            background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
            
            .book-name,
            .book-desc {
              color: #FFFFFF;
            }
            
            .check-icon {
              color: #FFFFFF;
            }
          }
          
          .book-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            
            .book-name-row {
              display: flex;
              align-items: center;
              gap: 12rpx;
              margin-bottom: 8rpx;
              
              .book-name {
                font-size: 28rpx;
                font-weight: bold;
                color: #333333;
              }
              
              .book-category {
                font-size: 20rpx;
                color: #FFFFFF;
                background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
                padding: 4rpx 12rpx;
                border-radius: 16rpx;
              }
            }
            
            .book-name {
              font-size: 28rpx;
              font-weight: bold;
              color: #333333;
              margin-bottom: 8rpx;
            }
            
            .book-desc {
              font-size: 24rpx;
              color: #999999;
            }
          }
          
          .check-icon {
            font-size: 32rpx;
            color: #F5A623;
            font-weight: bold;
          }
        }
      }
      
      .empty-account-books {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 80rpx 0;
        
        .empty-text {
          font-size: 28rpx;
          color: #999999;
          margin-bottom: 16rpx;
        }
        
        .empty-hint {
          font-size: 24rpx;
          color: #CCCCCC;
        }
      }
    }
  }
}

// 悬浮AI按钮
.ai-float-button {
  position: fixed;
  right: 32rpx;
  bottom: 200rpx; // 在底部导航栏上方
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, rgba(43, 184, 163, 0.85) 0%, rgba(42, 157, 138, 0.85) 100%);
  border-radius: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.2);
  z-index: 999;
  transition: all 0.3s;
  opacity: 0.7; // 默认透明度较低，不遮挡内容
  
  // 点击时颜色加深，不透明度提高
  &:active {
    opacity: 1;
    background: linear-gradient(135deg, #F5A623 0%, #E8940C 100%);
    transform: scale(0.95);
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
  }
  
  .ai-button-icon {
    font-size: 48rpx;
    margin-bottom: 4rpx;
  }
  
    .ai-button-text {
      font-size: 20rpx;
      color: #FFFFFF;
      font-weight: 500;
    }
  }

</style>

