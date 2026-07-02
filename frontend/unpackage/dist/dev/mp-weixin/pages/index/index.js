"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const utils_tabBar = require("../../utils/tabBar.js");
const utils_accountBook = require("../../utils/accountBook.js");
const utils_auth = require("../../utils/auth.js");
const utils_navigation = require("../../utils/navigation.js");
const utils_lastUsedAccountBook = require("../../utils/lastUsedAccountBook.js");
const TransactionDetail = () => "../../components/transaction-detail/transaction-detail.js";
const _sfc_main = {
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
      showSharedBookPicker: false,
      // 一起账本选择器
      allAccountBooks: [],
      // 所有账本（个人+一起）
      personalAccountBooks: [],
      // 个人账本
      sharedAccountBooks: [],
      // 一起账本
      showTransactionDetail: false,
      // 是否显示交易详情弹框
      selectedTransaction: null,
      // 选中的交易
      allTransactionsCount: 0,
      accountBookTab: "all",
      allMonthExpense: 0,
      allMonthIncome: 0,
      allRecentTransactions: [],
      currentSharedBook: null,
      // 当前选中的一起账本
      sharedMonthExpense: 0,
      // 一起账本本月支出
      sharedMonthIncome: 0,
      // 一起账本本月收入
      sharedRecentTransactions: [],
      // 一起账本最近交易
      sharedTransactionsCount: 0,
      // 一起账本交易总数
      periodSummary: null,
      // 昨日 / 今日 / 本周支出统计
      showStatsAmount: true
      // 是否显示统计金额
    };
  },
  computed: {
    ...common_vendor.mapState(["currentAccountBook", "userInfo", "isGuestMode"]),
    currentMonth() {
      const now = /* @__PURE__ */ new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月`;
    },
    balance() {
      return this.monthIncome - this.monthExpense;
    },
    sharedBalance() {
      return this.sharedMonthIncome - this.sharedMonthExpense;
    },
    budgetRemainingPersonal() {
      var _a;
      const budget = (_a = this.currentPersonalBook) == null ? void 0 : _a.budget;
      if (budget == null || budget <= 0)
        return null;
      const expenseYuan = (this.monthExpense || 0) / 100;
      return Number((budget - expenseYuan).toFixed(2));
    },
    budgetRemainingShared() {
      var _a;
      const budget = (_a = this.currentSharedBook) == null ? void 0 : _a.budget;
      if (budget == null || budget <= 0)
        return null;
      const expenseYuan = (this.sharedMonthExpense || 0) / 100;
      return Number((budget - expenseYuan).toFixed(2));
    },
    currentPersonalBook() {
      var _a, _b;
      const list = this.personalAccountBooks || [];
      if (((_a = this.currentAccountBook) == null ? void 0 : _a.type) === 0 && ((_b = this.currentAccountBook) == null ? void 0 : _b.id)) {
        const fromList = list.find((b) => b.id === this.currentAccountBook.id);
        if (fromList)
          return fromList;
        return this.currentAccountBook;
      }
      return list[0] || null;
    },
    // 当前选项卡对应的账本（个人或一起；全部视图为 null）
    currentBook() {
      if (this.accountBookTab === "all")
        return null;
      if (this.accountBookTab === "personal")
        return this.currentPersonalBook;
      return this.currentSharedBook;
    },
    showStatsIncomeRow() {
      if (this.accountBookTab === "all")
        return true;
      return !!this.currentBook;
    },
    // 当前选项卡的本月支出（分）
    currentMonthExpense() {
      if (this.accountBookTab === "all")
        return this.allMonthExpense;
      if (this.accountBookTab === "personal")
        return this.monthExpense;
      return this.sharedMonthExpense;
    },
    // 当前选项卡的本月收入（分）
    currentMonthIncome() {
      if (this.accountBookTab === "all")
        return this.allMonthIncome;
      if (this.accountBookTab === "personal")
        return this.monthIncome;
      return this.sharedMonthIncome;
    },
    // 当前选项卡的预算剩余（元）
    currentBudgetRemaining() {
      return this.accountBookTab === "personal" ? this.budgetRemainingPersonal : this.budgetRemainingShared;
    },
    showPeriodSummary() {
      if (this.isGuestMode || !this.$store.state.token)
        return false;
      if (this.accountBookTab === "all") {
        return this.pickerPersonalAccountBooks.length > 0 || this.pickerSharedAccountBooks.length > 0;
      }
      return !!this.currentBook;
    },
    periodSummaryItems() {
      const s = this.periodSummary || {};
      const yesterday = s.yesterday || {};
      const today = s.today || {};
      const thisWeek = s.thisWeek || {};
      return [
        { key: "yesterday", label: "昨日", expenseAmount: Number(yesterday.expenseAmount) || 0 },
        { key: "today", label: "今日", expenseAmount: Number(today.expenseAmount) || 0 },
        { key: "week", label: "本周", expenseAmount: Number(thisWeek.expenseAmount) || 0 }
      ];
    },
    // 账本弹窗仅展示进行中的账本
    pickerPersonalAccountBooks() {
      return (this.personalAccountBooks || []).filter((b) => b.status !== 1);
    },
    pickerSharedAccountBooks() {
      return (this.sharedAccountBooks || []).filter((b) => b.status !== 1);
    },
    // 根据选项卡显示对应的交易记录
    displayTransactions() {
      if (this.accountBookTab === "all") {
        return this.allRecentTransactions;
      }
      if (this.accountBookTab === "shared") {
        return this.sharedRecentTransactions;
      }
      return this.recentTransactions;
    },
    displayTransactionsCount() {
      if (this.accountBookTab === "all") {
        return this.allTransactionsCount;
      }
      if (this.accountBookTab === "shared") {
        return this.sharedTransactionsCount;
      }
      return this.allTransactionsCount;
    }
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    utils_tabBar.hideNativeTabBar();
    const savedTab = common_vendor.index.getStorageSync("accountBookTab");
    if (savedTab === "all" || savedTab === "personal" || savedTab === "shared") {
      this.accountBookTab = savedTab;
    }
    const savedStatsAmountVisible = common_vendor.index.getStorageSync("statsAmountVisible");
    if (savedStatsAmountVisible === false || savedStatsAmountVisible === "false") {
      this.showStatsAmount = false;
    } else if (savedStatsAmountVisible === true || savedStatsAmountVisible === "true") {
      this.showStatsAmount = true;
    }
    this.loadData().then(() => {
      if (this.accountBookTab === "shared") {
        if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
          this.applyDefaultSharedBook(this.sharedAccountBooks);
        }
      }
    });
  },
  onPullDownRefresh() {
    this.loadData().finally(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  methods: {
    ...common_vendor.mapActions(["setCurrentAccountBook", "updateAccountBooks", "setCurrentSharedAccountBook"]),
    toggleStatsAmountVisibility() {
      this.showStatsAmount = !this.showStatsAmount;
      common_vendor.index.setStorageSync("statsAmountVisible", this.showStatsAmount);
    },
    formatDate: utils_util.formatDate,
    formatAmount: utils_util.formatAmount,
    applyDefaultSharedBook(books) {
      const book = utils_accountBook.pickLatestActiveSharedBook(books);
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
      var _a, _b;
      if (!bookId || this.isGuestMode || !this.$store.state.token) {
        this.periodSummary = null;
        return;
      }
      try {
        const summary = await utils_api.api.transactions.getPeriodSummary(bookId);
        if (((_a = this.currentBook) == null ? void 0 : _a.id) === bookId) {
          this.periodSummary = summary;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:490", "加载周期统计失败", error);
        if (((_b = this.currentBook) == null ? void 0 : _b.id) === bookId) {
          this.periodSummary = {
            yesterday: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 },
            today: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 },
            thisWeek: { expenseAmount: 0, incomeAmount: 0, transactionCount: 0 }
          };
        }
      }
    },
    async loadData() {
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.recentTransactions = [];
        this.allRecentTransactions = [];
        this.allTransactionsCount = 0;
        this.monthExpense = 0;
        this.monthIncome = 0;
        this.allMonthExpense = 0;
        this.allMonthIncome = 0;
        this.periodSummary = null;
        return;
      }
      await this.loadAccountBooks();
      await this.reloadTabData();
    },
    async reloadTabData() {
      if (this.$store.state.isGuestMode || !this.$store.state.token)
        return;
      this.loading = true;
      try {
        if (this.accountBookTab === "all") {
          await this.loadAllBooksData();
        } else if (this.accountBookTab === "shared") {
          if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
            this.applyDefaultSharedBook(this.sharedAccountBooks);
          }
          await this.loadSharedBookData();
        } else {
          await this.loadPersonalBookData();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:534", "加载数据失败", error);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    async loadAllBooksData() {
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      try {
        const overview = await utils_api.api.transactions.getStatisticsOverview(year, month);
        this.allMonthExpense = Math.round(Number(overview.totalExpense || 0) * 100);
        this.allMonthIncome = Math.round(Number(overview.totalIncome || 0) * 100);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:551", "加载全账本统计失败", error);
        this.allMonthExpense = 0;
        this.allMonthIncome = 0;
      }
      const activePersonal = this.pickerPersonalAccountBooks;
      const activeShared = this.pickerSharedAccountBooks;
      const allBooks = [
        ...activePersonal.map((b) => ({ ...b, type: 0 })),
        ...activeShared.map((b) => ({ ...b, type: 1 }))
      ];
      if (allBooks.length === 0) {
        this.allRecentTransactions = [];
        this.allTransactionsCount = 0;
        this.periodSummary = null;
        return;
      }
      const results = await Promise.all(allBooks.map(async (book) => {
        try {
          const txs = await utils_api.api.transactions.getByAccountBook(book.id);
          return txs.map((t) => ({
            ...t,
            accountBookName: t.accountBookName || book.name,
            accountBookType: t.accountBookType ?? book.type
          }));
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:579", "加载账本交易失败", book.id, e);
          return [];
        }
      }));
      const merged = results.flat().sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
      this.allTransactionsCount = merged.length;
      this.allRecentTransactions = merged.slice(0, 8);
      await this.loadAllPeriodSummary(allBooks);
    },
    async loadAllPeriodSummary(books) {
      if (!books.length) {
        this.periodSummary = null;
        return;
      }
      try {
        const summaries = await Promise.all(
          books.map((b) => utils_api.api.transactions.getPeriodSummary(b.id).catch(() => null))
        );
        const sumExpense = (key) => summaries.reduce((acc, s) => {
          if (!s || !s[key])
            return acc;
          return acc + (Number(s[key].expenseAmount) || 0);
        }, 0);
        this.periodSummary = {
          yesterday: { expenseAmount: sumExpense("yesterday"), incomeAmount: 0, transactionCount: 0 },
          today: { expenseAmount: sumExpense("today"), incomeAmount: 0, transactionCount: 0 },
          thisWeek: { expenseAmount: sumExpense("thisWeek"), incomeAmount: 0, transactionCount: 0 }
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:612", "加载全账本周期统计失败", error);
        this.periodSummary = null;
      }
    },
    async loadPersonalBookData() {
      var _a;
      const book = this.currentPersonalBook;
      if (!book) {
        this.recentTransactions = [];
        this.allTransactionsCount = 0;
        this.monthExpense = 0;
        this.monthIncome = 0;
        this.periodSummary = null;
        return;
      }
      if (((_a = this.currentAccountBook) == null ? void 0 : _a.id) !== book.id) {
        this.setCurrentAccountBook(book);
      }
      const dateRange = utils_util.getDateRange("month");
      const transactions = await utils_api.api.transactions.getByDateRange(
        book.id,
        dateRange.startDate,
        dateRange.endDate
      );
      this.monthExpense = utils_util.calculateTotal(transactions, 0) * 100;
      this.monthIncome = utils_util.calculateTotal(transactions, 1) * 100;
      const allTransactions = await utils_api.api.transactions.getByAccountBook(book.id);
      this.allTransactionsCount = allTransactions.length;
      this.recentTransactions = allTransactions.slice(0, 8);
      await this.loadPeriodSummary(book.id);
    },
    async loadAccountBooks() {
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.allAccountBooks = [];
        this.personalAccountBooks = [];
        this.sharedAccountBooks = [];
        return;
      }
      try {
        const personalBooks = await utils_api.api.accountBooks.getList();
        let sharedBooks = [];
        try {
          sharedBooks = await utils_api.api.sharedAccountBooks.getList();
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:666", "加载一起账本失败", error);
        }
        this.allAccountBooks = [...personalBooks, ...sharedBooks];
        this.personalAccountBooks = personalBooks;
        this.sharedAccountBooks = sharedBooks;
        if (!this.currentAccountBook && this.allAccountBooks.length > 0) {
          const defaultBook = personalBooks.find((ab) => ab.isDefault) || personalBooks[0] || sharedBooks[0];
          if (defaultBook) {
            this.setCurrentAccountBook(defaultBook);
          }
        }
        if (!this.currentSharedBook || this.currentSharedBook.status === 1) {
          this.applyDefaultSharedBook(sharedBooks);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:687", "加载账本失败", error);
      }
    },
    // 切换账本类型选项卡
    switchAccountBookTab(tab) {
      this.accountBookTab = tab;
      common_vendor.index.setStorageSync("accountBookTab", tab);
      if (tab === "all") {
        utils_lastUsedAccountBook.clearHomeSelectedAccountBook();
      }
      this.reloadTabData();
    },
    openAccountBookPicker() {
      if (this.accountBookTab === "personal") {
        this.showAccountBookPicker = true;
      } else {
        this.showSharedBookPicker = true;
      }
    },
    // 加载一起账本数据
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
      const needDates = book.startDate == null || book.endDate == null;
      if (needDates) {
        try {
          const full = await utils_api.api.sharedAccountBooks.getById(book.id);
          if (full) {
            book = full;
            this.currentSharedBook = full;
            const idx = this.sharedAccountBooks.findIndex((b) => b.id === book.id);
            if (idx >= 0)
              this.sharedAccountBooks[idx] = full;
          }
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:732", "拉取一起账本详情失败", e);
        }
      }
      try {
        let startDate;
        let endDate;
        if (book.startDate != null && book.endDate != null) {
          startDate = String(book.startDate).substring(0, 10);
          endDate = String(book.endDate).substring(0, 10) + "T23:59:59";
        } else {
          const now = /* @__PURE__ */ new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        }
        const monthTransactions = await utils_api.api.transactions.getByDateRange(
          book.id,
          startDate,
          endDate
        );
        this.sharedMonthExpense = monthTransactions.filter((t) => t.type === 0).reduce((sum, t) => sum + parseFloat(t.amount), 0) * 100;
        this.sharedMonthIncome = monthTransactions.filter((t) => t.type === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0) * 100;
        const allTransactions = await utils_api.api.transactions.getByAccountBook(book.id);
        this.sharedTransactionsCount = allTransactions.length;
        this.sharedRecentTransactions = allTransactions.slice(0, 8);
        await this.loadPeriodSummary(book.id);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:771", "加载一起账本数据失败", error);
        this.sharedMonthExpense = 0;
        this.sharedMonthIncome = 0;
        this.sharedRecentTransactions = [];
        this.sharedTransactionsCount = 0;
        this.periodSummary = null;
      }
    },
    // 选择一起账本
    selectSharedBook(book) {
      utils_lastUsedAccountBook.recordHomeSelectedAccountBook({ ...book, type: 1 });
      this.setCurrentSharedBook(book);
      this.showSharedBookPicker = false;
      this.loadSharedBookData();
    },
    selectAccountBook(accountBook) {
      utils_lastUsedAccountBook.recordHomeSelectedAccountBook({ ...accountBook, type: 0 });
      this.setCurrentAccountBook(accountBook);
      this.showAccountBookPicker = false;
      this.reloadTabData();
    },
    getAccountBookTypeText(accountBook) {
      if (!accountBook)
        return "";
      return accountBook.type === 0 ? "个人" : "一起记";
    },
    goToAccountBooks() {
      common_vendor.index.navigateTo({
        url: "/pages/account-books/account-books"
      });
    },
    goToSharedAccountBooks() {
      common_vendor.index.navigateTo({
        url: "/pages/account-books/account-books"
      });
    },
    goToSharedAccountBookDetail(book) {
      this.setCurrentSharedBook(book);
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}`
      });
    },
    goToPersonalAccountBookDetail() {
      if (!this.currentPersonalBook) {
        common_vendor.index.showToast({
          title: "请先选择账本",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${this.currentPersonalBook.id}&type=0`
      });
    },
    /** 进入当前选项卡对应的账本详情（个人/一起统一入口） */
    goToCurrentBookDetail() {
      if (this.accountBookTab === "all") {
        this.goToStatistics();
        return;
      }
      if (!this.currentBook) {
        common_vendor.index.showToast({
          title: this.accountBookTab === "shared" ? "请先选择一起账本" : "请先选择账本",
          icon: "none"
        });
        return;
      }
      if (this.accountBookTab === "shared") {
        this.goToSharedAccountBookDetail(this.currentBook);
      } else {
        this.goToPersonalAccountBookDetail();
      }
    },
    goToJoinAccountBook() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/join-account-book/join-account-book"
      });
    },
    goToCreateAccountBook() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/create-shared-account-book/create-shared-account-book"
      });
    },
    goToAIRecord() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      this.$store.dispatch("setSwitchToAITab", true);
      utils_navigation.goToAddTransaction(0);
    },
    goToStatistics() {
      common_vendor.index.switchTab({
        url: "/pages/statistics/statistics"
      });
    },
    goToLogin() {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    },
    viewAllTransactions() {
      if (this.accountBookTab === "all") {
        this.goToStatistics();
        return;
      }
      if (this.accountBookTab === "shared") {
        if (!this.currentSharedBook) {
          common_vendor.index.showToast({
            title: "请先选择一起账本",
            icon: "none"
          });
          return;
        }
        this.goToSharedAccountBookDetail(this.currentSharedBook);
      } else {
        if (!this.currentAccountBook) {
          common_vendor.index.showToast({
            title: "请先选择账本",
            icon: "none"
          });
          return;
        }
        common_vendor.index.navigateTo({
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
        const imageUrls = transaction.images.map((img) => img.imageUrl);
        common_vendor.index.previewImage({
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
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  const _easycom_transaction_detail2 = common_vendor.resolveComponent("transaction-detail");
  const _easycom_app_tab_bar2 = common_vendor.resolveComponent("app-tab-bar");
  (_easycom_app_icon2 + _easycom_transaction_detail2 + _easycom_app_tab_bar2)();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
const _easycom_transaction_detail = () => "../../components/transaction-detail/transaction-detail.js";
const _easycom_app_tab_bar = () => "../../components/app-tab-bar/app-tab-bar.js";
if (!Math) {
  (_easycom_app_icon + _easycom_transaction_detail + _easycom_app_tab_bar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a;
  return common_vendor.e({
    a: $data.accountBookTab === "all" ? 1 : "",
    b: $data.accountBookTab === "personal" ? 1 : "",
    c: $data.accountBookTab === "shared" ? 1 : "",
    d: $data.accountBookTab === "all" ? 1 : "",
    e: common_vendor.o(($event) => $options.switchAccountBookTab("all"), "8a"),
    f: $data.accountBookTab === "personal" ? 1 : "",
    g: common_vendor.o(($event) => $options.switchAccountBookTab("personal"), "4e"),
    h: $data.accountBookTab === "shared" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchAccountBookTab("shared"), "04"),
    j: common_vendor.o(() => {
    }, "26"),
    k: $data.accountBookTab === "all"
  }, $data.accountBookTab === "all" ? {} : {
    l: common_vendor.t(((_a = $options.currentBook) == null ? void 0 : _a.name) || "选择账本"),
    m: common_vendor.o((...args) => $options.openAccountBookPicker && $options.openAccountBookPicker(...args), "85")
  }, {
    n: common_vendor.p({
      name: "plusempty",
      size: 18,
      color: "#FFFFFF"
    }),
    o: common_vendor.o((...args) => $options.goToCreateAccountBook && $options.goToCreateAccountBook(...args), "f9"),
    p: $data.accountBookTab === "shared" && !$data.currentSharedBook
  }, $data.accountBookTab === "shared" && !$data.currentSharedBook ? {
    q: common_vendor.p({
      name: "staff",
      size: 40,
      color: "#F5A623"
    }),
    r: common_vendor.o((...args) => $options.goToCreateAccountBook && $options.goToCreateAccountBook(...args), "45"),
    s: common_vendor.o((...args) => $options.goToJoinAccountBook && $options.goToJoinAccountBook(...args), "a8")
  } : common_vendor.e({
    t: common_vendor.t($data.accountBookTab === "all" ? "本月总支出" : "本月支出"),
    v: common_vendor.p({
      name: $data.showStatsAmount ? "eye" : "eye-off",
      size: 18,
      color: "#2b2b2b"
    }),
    w: common_vendor.o((...args) => $options.toggleStatsAmountVisibility && $options.toggleStatsAmountVisibility(...args), "06"),
    x: common_vendor.t($data.showStatsAmount ? `￥${$options.formatAmount($options.currentMonthExpense)}` : "￥****"),
    y: $options.showStatsIncomeRow
  }, $options.showStatsIncomeRow ? {
    z: common_vendor.t($data.showStatsAmount ? `￥${$options.formatAmount($options.currentMonthIncome)}` : "￥****")
  } : {}, {
    A: $options.currentBook && $options.currentBudgetRemaining != null
  }, $options.currentBook && $options.currentBudgetRemaining != null ? {
    B: common_vendor.t($data.showStatsAmount ? `￥${($options.currentBudgetRemaining ?? 0).toFixed(2)}` : "￥****")
  } : {}), {
    C: _ctx.isGuestMode
  }, _ctx.isGuestMode ? {
    D: common_vendor.o((...args) => $options.goToLogin && $options.goToLogin(...args), "b7")
  } : {}, {
    E: $options.showPeriodSummary
  }, $options.showPeriodSummary ? {
    F: common_vendor.p({
      name: "bars",
      size: 16,
      color: "#F5A623"
    }),
    G: common_vendor.f($options.periodSummaryItems, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.expenseAmount.toFixed(2)),
        b: common_vendor.t(item.label),
        c: item.key
      };
    }),
    H: common_vendor.o((...args) => $options.goToStatistics && $options.goToStatistics(...args), "ed")
  } : {}, {
    I: common_vendor.p({
      name: "list",
      size: 16,
      color: "#F5A623"
    }),
    J: common_vendor.t(">"),
    K: common_vendor.o((...args) => $options.viewAllTransactions && $options.viewAllTransactions(...args), "c8"),
    L: $options.displayTransactions.length === 0
  }, $options.displayTransactions.length === 0 ? {} : {
    M: common_vendor.f($options.displayTransactions, (item, k0, i0) => {
      return common_vendor.e({
        a: "1cf27b2a-5-" + i0,
        b: common_vendor.p({
          icon: item.categoryIcon,
          ["category-name"]: item.categoryName,
          size: 18,
          color: "#FFFFFF"
        }),
        c: item.categoryColor,
        d: common_vendor.t(item.categoryName),
        e: item.remark
      }, item.remark ? {
        f: common_vendor.t(item.remark)
      } : {}, {
        g: common_vendor.t($options.formatDate(item.transactionDate, "MM-DD")),
        h: $data.accountBookTab === "all" && item.accountBookName
      }, $data.accountBookTab === "all" && item.accountBookName ? {
        i: common_vendor.t(item.accountBookType === 1 ? "一起记" : "个人"),
        j: common_vendor.t(item.accountBookName)
      } : {}, {
        k: item.accountBookType === 1 && item.userName
      }, item.accountBookType === 1 && item.userName ? {
        l: common_vendor.t(item.userName)
      } : {}, {
        m: common_vendor.t(item.type === 0 ? "-" : "+"),
        n: common_vendor.t(item.amount.toFixed(2)),
        o: common_vendor.n(item.type === 0 ? "expense" : "income"),
        p: item.accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0
      }, item.accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0 ? {
        q: common_vendor.f(item.allocations || [], (a, k1, i1) => {
          return {
            a: common_vendor.t((a.userName || "?").charAt(0)),
            b: a.userId
          };
        })
      } : {}, {
        r: item.id,
        s: common_vendor.o(($event) => $options.viewTransaction(item), item.id)
      });
    })
  }, {
    N: !$options.showPeriodSummary ? 1 : "",
    O: common_vendor.o($options.closeTransactionDetail, "4f"),
    P: common_vendor.p({
      visible: $data.showTransactionDetail,
      transaction: $data.selectedTransaction
    }),
    Q: common_vendor.p({
      current: 0
    }),
    R: $data.showAccountBookPicker
  }, $data.showAccountBookPicker ? common_vendor.e({
    S: common_vendor.o(($event) => $data.showAccountBookPicker = false, "d3"),
    T: $options.pickerPersonalAccountBooks.length > 0
  }, $options.pickerPersonalAccountBooks.length > 0 ? {
    U: common_vendor.f($options.pickerPersonalAccountBooks, (book, k0, i0) => {
      var _a2, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.t(book.name),
        b: book.categoryName
      }, book.categoryName ? {
        c: common_vendor.t(book.categoryName)
      } : {}, {
        d: book.description
      }, book.description ? {
        e: common_vendor.t(book.description)
      } : {}, {
        f: ((_a2 = _ctx.currentAccountBook) == null ? void 0 : _a2.id) === book.id && ((_b = _ctx.currentAccountBook) == null ? void 0 : _b.type) === 0
      }, ((_c = _ctx.currentAccountBook) == null ? void 0 : _c.id) === book.id && ((_d = _ctx.currentAccountBook) == null ? void 0 : _d.type) === 0 ? {} : {}, {
        g: book.id,
        h: ((_e = _ctx.currentAccountBook) == null ? void 0 : _e.id) === book.id && ((_f = _ctx.currentAccountBook) == null ? void 0 : _f.type) === 0 ? 1 : "",
        i: common_vendor.o(($event) => $options.selectAccountBook(book), book.id)
      });
    })
  } : {}, {
    V: $options.pickerPersonalAccountBooks.length === 0
  }, $options.pickerPersonalAccountBooks.length === 0 ? {} : {}, {
    W: common_vendor.o(() => {
    }, "b9"),
    X: common_vendor.o(($event) => $data.showAccountBookPicker = false, "d6")
  }) : {}, {
    Y: $data.showSharedBookPicker
  }, $data.showSharedBookPicker ? common_vendor.e({
    Z: common_vendor.o(($event) => $data.showSharedBookPicker = false, "5a"),
    aa: $options.pickerSharedAccountBooks.length > 0
  }, $options.pickerSharedAccountBooks.length > 0 ? {
    ab: common_vendor.f($options.pickerSharedAccountBooks, (book, k0, i0) => {
      var _a2, _b, _c;
      return common_vendor.e({
        a: common_vendor.t(book.name),
        b: book.categoryName
      }, book.categoryName ? {
        c: common_vendor.t(book.categoryName)
      } : {}, {
        d: common_vendor.t(book.memberCount || 1),
        e: ((_a2 = $data.currentSharedBook) == null ? void 0 : _a2.id) === book.id
      }, ((_b = $data.currentSharedBook) == null ? void 0 : _b.id) === book.id ? {} : {}, {
        f: book.id,
        g: ((_c = $data.currentSharedBook) == null ? void 0 : _c.id) === book.id ? 1 : "",
        h: common_vendor.o(($event) => $options.selectSharedBook(book), book.id)
      });
    })
  } : {}, {
    ac: common_vendor.o(() => {
    }, "78"),
    ad: common_vendor.o(($event) => $data.showSharedBookPicker = false, "79")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
