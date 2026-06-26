"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const utils_auth = require("../../utils/auth.js");
const TransactionDetail = () => "../../components/transaction-detail/transaction-detail.js";
const _sfc_main = {
  components: {
    TransactionDetail
  },
  computed: {
    ...common_vendor.mapState(["userInfo"]),
    // 账本已结束（集体账本 status===1 时不可记账）
    isBookEnded() {
      var _a;
      return this.accountBookType === 1 && ((_a = this.accountBook) == null ? void 0 : _a.status) === 1;
    },
    // 集体账本且有起止日期时使用日期范围选择
    useDateRangePicker() {
      var _a, _b;
      return this.accountBookType === 1 && ((_a = this.accountBook) == null ? void 0 : _a.startDate) && ((_b = this.accountBook) == null ? void 0 : _b.endDate);
    },
    // 账本起止日期（YYYY-MM-DD）
    bookStartDate() {
      var _a;
      if (!((_a = this.accountBook) == null ? void 0 : _a.startDate))
        return "";
      return String(this.accountBook.startDate).substring(0, 10);
    },
    bookEndDate() {
      var _a;
      if (!((_a = this.accountBook) == null ? void 0 : _a.endDate))
        return "";
      return String(this.accountBook.endDate).substring(0, 10);
    },
    // 选中的月份文本
    selectedMonthText() {
      if (!this.selectedMonth)
        return "";
      const [year, month] = this.selectedMonth.split("-");
      return `${year}年${parseInt(month)}月`;
    },
    // 基础筛选后的交易记录（不包含“成员各自消费”卡片筛选）
    transactionsBeforeAllocationFilter() {
      let transactions = this.allTransactions || [];
      if (this.useDateRangePicker && this.selectedDateStart && this.selectedDateEnd) {
        const startDate = /* @__PURE__ */ new Date(this.selectedDateStart + "T00:00:00");
        const endDate = /* @__PURE__ */ new Date(this.selectedDateEnd + "T23:59:59");
        transactions = transactions.filter((t) => {
          const transDate = new Date(t.transactionDate);
          return transDate >= startDate && transDate <= endDate;
        });
      } else if (!this.useDateRangePicker && this.selectedMonth) {
        const [year, month] = this.selectedMonth.split("-");
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        transactions = transactions.filter((t) => {
          const transDate = new Date(t.transactionDate);
          return transDate >= startDate && transDate <= endDate;
        });
      }
      if (this.selectedType !== null) {
        transactions = transactions.filter((t) => t.type === this.selectedType);
      }
      if (this.selectedCategoryId !== null && this.selectedCategoryId !== void 0 && this.selectedCategoryId !== "") {
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
      if (this.accountBookType === 1 && this.selectedMemberId !== null) {
        transactions = transactions.filter((t) => t.userId === this.selectedMemberId);
      }
      return transactions;
    },
    // 筛选后的交易记录
    filteredTransactions() {
      let transactions = this.transactionsBeforeAllocationFilter || [];
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
      return this.filteredTransactions.filter((t) => t.type === 0).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    },
    // 当月收入合计
    monthIncome() {
      return this.filteredTransactions.filter((t) => t.type === 1).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    },
    // 结余 = 预算 - 支出（无预算时预算视为0）
    monthBalance() {
      var _a;
      const budget = ((_a = this.accountBook) == null ? void 0 : _a.budget) ?? 0;
      return budget - this.monthExpense;
    },
    // 分类选项：「全部」+ 各大类；记账落在小类 id，选大类时用 filterCategoryIds 包含其下全部小类 id
    categoryOptions() {
      const options = [{ id: null, name: "全部", filterCategoryIds: null }];
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
      if (this.selectedCategoryId == null || this.selectedCategoryId === "") {
        return 0;
      }
      const index = this.categoryOptions.findIndex(
        (c) => c.id != null && Number(c.id) === Number(this.selectedCategoryId)
      );
      return index >= 0 ? index : 0;
    },
    // 当前选中的分类名称
    selectedCategoryName() {
      if (this.selectedCategoryId == null || this.selectedCategoryId === "") {
        return "全部";
      }
      const category = this.categoryOptions.find(
        (c) => c.id != null && Number(c.id) === Number(this.selectedCategoryId)
      );
      return category ? category.name : "全部";
    },
    // 成员选项列表（包含"全部"选项）
    memberOptions() {
      if (this.accountBookType !== 1 || !this.accountBook || !this.accountBook.members) {
        return [{ id: null, name: "全部" }];
      }
      const options = [{ id: null, name: "全部" }];
      const creatorId = this.accountBook.creatorId || this.accountBook.userId;
      const creatorInMembers = this.accountBook.members.some((m) => m.userId === creatorId);
      if (!creatorInMembers && creatorId) {
        options.push({
          id: creatorId,
          name: this.accountBook.creatorName || "创建者"
        });
      }
      return options.concat(this.accountBook.members.map((m) => ({
        id: m.userId,
        name: m.userName || "未知用户"
      })));
    },
    // 当前选中的成员索引
    selectedMemberIndex() {
      const index = this.memberOptions.findIndex((m) => m.id === this.selectedMemberId);
      return index >= 0 ? index : 0;
    },
    // 当前选中的成员名称
    selectedMemberName() {
      const member = this.memberOptions.find((m) => m.id === this.selectedMemberId);
      return member ? member.name : "全部";
    },
    // 成员均摊费用汇总（不受“成员各自消费”卡片筛选影响，避免点击后排序跳动）
    memberAllocationSummary() {
      if (this.accountBookType !== 1 || !this.accountBook || !this.accountBook.members)
        return [];
      const expenseList = (this.transactionsBeforeAllocationFilter || []).filter((t) => t.type === 0);
      const byUserId = /* @__PURE__ */ new Map();
      this.accountBook.members.forEach((m) => {
        if (m.userId === null || m.userId === void 0 || m.userId === "")
          return;
        const k = String(m.userId);
        byUserId.set(k, {
          userId: k,
          userName: m.userName || "未知",
          userAvatar: m.userAvatar || null,
          totalAmount: 0
        });
      });
      expenseList.forEach((t) => {
        const allocations = t.allocations || [];
        if (allocations.length === 0)
          return;
        const amount = parseFloat(t.amount) || 0;
        allocations.forEach((a) => {
          if (a.userId === null || a.userId === void 0 || a.userId === "")
            return;
          const uid = String(a.userId);
          const share = a.amount != null && a.amount !== void 0 ? parseFloat(a.amount) : amount / allocations.length;
          if (byUserId.has(uid)) {
            byUserId.get(uid).totalAmount += share;
          } else {
            byUserId.set(uid, {
              userId: uid,
              userName: a.userName || "未知",
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
      if (this.selectedCategoryId == null || this.selectedCategoryId === "")
        return;
      const stillInList = this.categoryOptions.some(
        (o) => o.id != null && Number(o.id) === Number(this.selectedCategoryId)
      );
      if (!stillInList) {
        this.selectedCategoryId = null;
      }
    }
  },
  data() {
    const now = /* @__PURE__ */ new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      accountBookId: null,
      accountBookType: 1,
      // 0-个人账本，1-集体账本
      accountBook: null,
      allTransactions: [],
      // 所有交易记录
      selectedMonth: currentMonth,
      // 选中的月份 YYYY-MM
      selectedDateStart: "",
      // 日期范围：开始 YYYY-MM-DD（集体账本有起止日期时）
      selectedDateEnd: "",
      // 日期范围：结束 YYYY-MM-DD
      selectedType: null,
      // 选中的类型 null-全部, 0-支出, 1-收入
      selectedCategoryId: null,
      // 选中的分类ID
      allCategories: [],
      // 所有分类
      loading: false,
      showTransactionDetail: false,
      // 是否显示交易详情弹框
      selectedTransaction: null,
      // 选中的交易
      selectedMemberId: null,
      // 顶部筛选器-成员ID
      selectedAllocationMemberId: null
      // 成员各自消费卡片-成员ID（独立筛选）
    };
  },
  onLoad(options) {
    if (options.id) {
      const newAccountBookId = parseInt(options.id);
      const newAccountBookType = options.type ? parseInt(options.type) : 1;
      this.accountBook = null;
      this.allTransactions = [];
      this.selectedMemberId = null;
      this.selectedAllocationMemberId = null;
      this.selectedCategoryId = null;
      this.selectedType = null;
      this.selectedDateStart = "";
      this.selectedDateEnd = "";
      this.accountBookId = newAccountBookId;
      this.accountBookType = newAccountBookType;
      this.loadData();
    }
  },
  onShow() {
    let options = {};
    try {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        options = currentPage.options || {};
      }
    } catch (e) {
      common_vendor.index.__f__("warn", "at pages/shared-account-book-detail/shared-account-book-detail.vue:578", "获取页面参数失败", e);
    }
    if (options.id) {
      const newAccountBookId = parseInt(options.id);
      const newAccountBookType = options.type ? parseInt(options.type) : 1;
      if (this.accountBookId !== newAccountBookId || this.accountBookType !== newAccountBookType) {
        this.accountBookId = newAccountBookId;
        this.accountBookType = newAccountBookType;
        this.accountBook = null;
        this.allTransactions = [];
        this.selectedMemberId = null;
        this.selectedCategoryId = null;
        this.selectedType = null;
        this.selectedDateStart = "";
        this.selectedDateEnd = "";
        this.loadData();
      } else if (this.accountBookId) {
        this.loadData();
      }
    } else if (this.accountBookId) {
      this.loadData();
    }
  },
  // 微信小程序分享功能
  onShareAppMessage() {
    var _a;
    if (this.accountBookType === 1 && ((_a = this.accountBook) == null ? void 0 : _a.shareCode)) {
      return {
        title: `邀请你加入集体账本：${this.accountBook.name}`,
        path: `/pages/join-account-book/join-account-book?shareCode=${this.accountBook.shareCode}`,
        imageUrl: "/static/invite.jpg"
        // 可以设置分享图片URL
      };
    }
    return {
      title: "乌鸦记账",
      path: "/pages/index/index"
    };
  },
  methods: {
    ...common_vendor.mapActions(["setCurrentAccountBook"]),
    formatDate: utils_util.formatDate,
    async loadData() {
      var _a, _b;
      this.loading = true;
      try {
        if (this.accountBookType === 0) {
          this.accountBook = await utils_api.api.accountBooks.getById(this.accountBookId);
        } else {
          this.accountBook = await utils_api.api.sharedAccountBooks.getById(this.accountBookId);
        }
        const transactions = await utils_api.api.transactions.getByAccountBook(this.accountBookId);
        this.allTransactions = transactions.map((t) => ({
          ...t,
          accountBookType: this.accountBookType
        }));
        const [expenseCategories, incomeCategories] = await Promise.all([
          utils_api.api.categories.getList(0, this.accountBookId),
          utils_api.api.categories.getList(1, this.accountBookId)
        ]);
        this.allCategories = [...expenseCategories || [], ...incomeCategories || []];
        if (this.accountBookType === 1 && ((_a = this.accountBook) == null ? void 0 : _a.startDate) && ((_b = this.accountBook) == null ? void 0 : _b.endDate)) {
          this.selectedDateStart = String(this.accountBook.startDate).substring(0, 10);
          this.selectedDateEnd = String(this.accountBook.endDate).substring(0, 10);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-detail/shared-account-book-detail.vue:659", "加载数据失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    copyShareCode() {
      var _a;
      if (!((_a = this.accountBook) == null ? void 0 : _a.shareCode))
        return;
      common_vendor.index.setClipboardData({
        data: this.accountBook.shareCode,
        success: () => {
          common_vendor.index.showToast({
            title: "分享码已复制",
            icon: "success"
          });
        }
      });
    },
    async selectAsCurrent() {
      const accountBook = { ...this.accountBook, type: 0 };
      await this.setCurrentAccountBook(accountBook);
      common_vendor.index.showToast({
        title: "设置成功",
        icon: "success"
      });
    },
    goToAddTransaction() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      if (this.isBookEnded) {
        common_vendor.index.showToast({
          title: "已结束的账本不能继续记账",
          icon: "none"
        });
        return;
      }
      if (this.accountBookType === 0) {
        const accountBook = { ...this.accountBook, type: 0 };
        this.setCurrentAccountBook(accountBook);
      } else {
        this.$store.dispatch("setCurrentSharedAccountBook", {
          ...this.accountBook,
          id: this.accountBookId,
          type: 1
        });
      }
      common_vendor.index.navigateTo({
        url: `/pages/add-transaction/add-transaction?accountBookId=${this.accountBookId}&accountBookType=${this.accountBookType}`
      });
    },
    goToStatistics() {
      if (this.accountBookType === 0) {
        const accountBook = { ...this.accountBook, type: 0 };
        this.setCurrentAccountBook(accountBook);
        common_vendor.index.switchTab({
          url: "/pages/statistics/statistics"
        });
      } else {
        this.$store.dispatch("setCurrentSharedAccountBook", {
          ...this.accountBook,
          id: this.accountBookId,
          type: 1
        });
        common_vendor.index.navigateTo({
          url: `/pages/shared-account-book-statistics/shared-account-book-statistics?id=${this.accountBookId}`
        });
      }
    },
    goToMembers() {
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-members/shared-account-book-members?id=${this.accountBookId}`
      });
    },
    goToSettings() {
      common_vendor.index.navigateTo({
        url: `/pages/create-shared-account-book/create-shared-account-book?id=${this.accountBookId}&type=${this.accountBookType}`
      });
    },
    goToReport() {
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-report/shared-account-book-report?id=${this.accountBookId}`
      });
    },
    shareAccountBook() {
      var _a;
      if (!((_a = this.accountBook) == null ? void 0 : _a.shareCode)) {
        common_vendor.index.showToast({
          title: "分享码不存在",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "分享账本",
        content: `分享码：${this.accountBook.shareCode}

请点击右上角"..."按钮，选择"转发"分享给好友`,
        showCancel: false,
        confirmText: "知道了"
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
    },
    // 删除交易记录
    async deleteTransaction(item) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条交易记录吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_api.api.transactions.delete(item.id);
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              this.loadData();
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/shared-account-book-detail/shared-account-book-detail.vue:820", "删除失败", error);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none"
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
      if (this.selectedAllocationMemberId === null || this.selectedAllocationMemberId === void 0 || this.selectedAllocationMemberId === "") {
        return false;
      }
      return String(this.selectedAllocationMemberId) === String(member.userId);
    },
    // 点击“成员各自消费”项，切换成员筛选
    onMemberAllocationClick(member) {
      if (!member || member.userId === null || member.userId === void 0 || member.userId === "")
        return;
      const uid = String(member.userId);
      this.selectedAllocationMemberId = String(this.selectedAllocationMemberId) === uid ? null : uid;
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  const _easycom_transaction_detail2 = common_vendor.resolveComponent("transaction-detail");
  (_easycom_app_icon2 + _easycom_transaction_detail2)();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
const _easycom_transaction_detail = () => "../../components/transaction-detail/transaction-detail.js";
if (!Math) {
  (_easycom_app_icon + _easycom_transaction_detail)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
  return common_vendor.e({
    a: common_vendor.t((_a = $data.accountBook) == null ? void 0 : _a.name),
    b: $data.accountBookType === 1
  }, $data.accountBookType === 1 ? common_vendor.e({
    c: ((_b = $data.accountBook) == null ? void 0 : _b.status) === 1
  }, ((_c = $data.accountBook) == null ? void 0 : _c.status) === 1 ? {} : {}) : ((_d = $data.accountBook) == null ? void 0 : _d.isDefault) ? {} : {}, {
    d: (_e = $data.accountBook) == null ? void 0 : _e.isDefault,
    e: common_vendor.t($data.accountBookType === 0 ? "个人账本" : "集体账本"),
    f: (_f = $data.accountBook) == null ? void 0 : _f.categoryName
  }, ((_g = $data.accountBook) == null ? void 0 : _g.categoryName) ? {
    g: common_vendor.t($data.accountBook.categoryName)
  } : {}, {
    h: common_vendor.t(((_h = $data.accountBook) == null ? void 0 : _h.description) || "暂无描述"),
    i: $data.accountBookType === 1
  }, $data.accountBookType === 1 ? {
    j: common_vendor.t(((_i = $data.accountBook) == null ? void 0 : _i.memberCount) || 0)
  } : {}, {
    k: (_j = $data.accountBook) == null ? void 0 : _j.budget
  }, ((_k = $data.accountBook) == null ? void 0 : _k.budget) ? {
    l: common_vendor.t((_m = (_l = $data.accountBook) == null ? void 0 : _l.budget) == null ? void 0 : _m.toFixed(2))
  } : {}, {
    m: $data.accountBookType === 1 && ((_n = $data.accountBook) == null ? void 0 : _n.shareCode)
  }, $data.accountBookType === 1 && ((_o = $data.accountBook) == null ? void 0 : _o.shareCode) ? {
    n: common_vendor.t((_p = $data.accountBook) == null ? void 0 : _p.shareCode),
    o: common_vendor.o((...args) => $options.copyShareCode && $options.copyShareCode(...args), "ee"),
    p: common_vendor.o((...args) => $options.shareAccountBook && $options.shareAccountBook(...args), "31")
  } : {}, {
    q: common_vendor.p({
      name: "plusempty",
      size: 22,
      color: "#F5A623"
    }),
    r: $options.isBookEnded ? 1 : "",
    s: common_vendor.o((...args) => $options.goToAddTransaction && $options.goToAddTransaction(...args), "30"),
    t: common_vendor.p({
      name: "bars",
      size: 22,
      color: "#F5A623"
    }),
    v: common_vendor.o((...args) => $options.goToStatistics && $options.goToStatistics(...args), "51"),
    w: $data.accountBookType === 1
  }, $data.accountBookType === 1 ? {
    x: common_vendor.p({
      name: "staff",
      size: 22,
      color: "#F5A623"
    }),
    y: common_vendor.o((...args) => $options.goToMembers && $options.goToMembers(...args), "ad")
  } : {}, {
    z: common_vendor.p({
      name: "gear",
      size: 22,
      color: "#F5A623"
    }),
    A: common_vendor.o((...args) => $options.goToSettings && $options.goToSettings(...args), "69"),
    B: $data.accountBookType === 1
  }, $data.accountBookType === 1 ? {
    C: common_vendor.p({
      name: "list",
      size: 22,
      color: "#F5A623"
    }),
    D: common_vendor.o((...args) => $options.goToReport && $options.goToReport(...args), "eb")
  } : {}, {
    E: $data.accountBookType === 0
  }, $data.accountBookType === 0 ? {
    F: common_vendor.p({
      name: "checkmarkempty",
      size: 22,
      color: "#F5A623"
    }),
    G: common_vendor.o((...args) => $options.selectAsCurrent && $options.selectAsCurrent(...args), "33")
  } : {}, {
    H: $data.accountBookType === 0 ? 1 : "",
    I: $data.accountBookType === 1 ? 1 : "",
    J: $options.filteredTransactions.length > 0
  }, $options.filteredTransactions.length > 0 ? {
    K: common_vendor.t($options.filteredTransactions.length)
  } : {}, {
    L: $options.useDateRangePicker
  }, $options.useDateRangePicker ? {
    M: common_vendor.t($data.selectedDateStart || "开始"),
    N: $data.selectedDateStart,
    O: $options.bookStartDate,
    P: $data.selectedDateEnd || $options.bookEndDate,
    Q: common_vendor.o((...args) => $options.onDateRangeStartChange && $options.onDateRangeStartChange(...args), "b6"),
    R: common_vendor.t($data.selectedDateEnd || "结束"),
    S: $data.selectedDateEnd,
    T: $data.selectedDateStart || $options.bookStartDate,
    U: $options.bookEndDate,
    V: common_vendor.o((...args) => $options.onDateRangeEndChange && $options.onDateRangeEndChange(...args), "06")
  } : {
    W: common_vendor.t($options.selectedMonthText),
    X: $data.selectedMonth,
    Y: common_vendor.o((...args) => $options.onMonthChange && $options.onMonthChange(...args), "1d")
  }, {
    Z: $data.selectedType === null ? 1 : "",
    aa: common_vendor.o(($event) => $data.selectedType = null, "65"),
    ab: $data.selectedType === 0 ? 1 : "",
    ac: common_vendor.o(($event) => $data.selectedType = 0, "e7"),
    ad: $data.selectedType === 1 ? 1 : "",
    ae: common_vendor.o(($event) => $data.selectedType = 1, "99"),
    af: common_vendor.t($options.selectedCategoryName),
    ag: $options.categoryOptions,
    ah: $options.selectedCategoryIndex,
    ai: common_vendor.o((...args) => $options.onCategoryChange && $options.onCategoryChange(...args), "bc"),
    aj: $data.accountBookType === 1
  }, $data.accountBookType === 1 ? {
    ak: common_vendor.t($options.selectedMemberName),
    al: $options.memberOptions,
    am: $options.selectedMemberIndex,
    an: common_vendor.o((...args) => $options.onMemberChange && $options.onMemberChange(...args), "56")
  } : {}, {
    ao: $options.filteredTransactions.length > 0
  }, $options.filteredTransactions.length > 0 ? {
    ap: common_vendor.t($options.monthExpense.toFixed(2)),
    aq: common_vendor.t($options.monthIncome.toFixed(2)),
    ar: common_vendor.t($options.monthBalance.toFixed(2)),
    as: $options.monthBalance < 0 ? 1 : ""
  } : {}, {
    at: $data.accountBookType === 1 && $options.memberAllocationSummary.length > 0
  }, $data.accountBookType === 1 && $options.memberAllocationSummary.length > 0 ? {
    av: common_vendor.f($options.memberAllocationSummary, (m, k0, i0) => {
      return {
        a: common_vendor.t(m.userName || "未知"),
        b: common_vendor.t(m.totalAmount.toFixed(2)),
        c: `alloc-${String(m.userId)}`,
        d: $options.isAllocationMemberActive(m) ? 1 : "",
        e: common_vendor.o(($event) => $options.onMemberAllocationClick(m), `alloc-${String(m.userId)}`)
      };
    })
  } : {}, {
    aw: $options.filteredTransactions.length === 0
  }, $options.filteredTransactions.length === 0 ? {} : {
    ax: common_vendor.f($options.filteredTransactions, (item, k0, i0) => {
      return common_vendor.e({
        a: "5a8d8108-6-" + i0,
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
        h: $data.accountBookType === 1 && item.userName
      }, $data.accountBookType === 1 && item.userName ? {
        i: common_vendor.t(item.userName)
      } : {}, {
        j: common_vendor.t(item.type === 0 ? "-" : "+"),
        k: common_vendor.t(item.amount.toFixed(2)),
        l: common_vendor.n(item.type === 0 ? "expense" : "income"),
        m: $data.accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0
      }, $data.accountBookType === 1 && item.type === 0 && (item.allocations || []).length > 0 ? {
        n: common_vendor.f(item.allocations || [], (a, k1, i1) => {
          return {
            a: common_vendor.t((a.userName || "?").charAt(0)),
            b: a.userId
          };
        })
      } : {}, {
        o: item.id,
        p: common_vendor.o(($event) => $options.viewTransaction(item), item.id),
        q: common_vendor.o(($event) => $options.deleteTransaction(item), item.id)
      });
    })
  }, {
    ay: common_vendor.o($options.closeTransactionDetail, "7c"),
    az: common_vendor.p({
      visible: $data.showTransactionDetail,
      transaction: $data.selectedTransaction
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5a8d8108"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-book-detail/shared-account-book-detail.js.map
