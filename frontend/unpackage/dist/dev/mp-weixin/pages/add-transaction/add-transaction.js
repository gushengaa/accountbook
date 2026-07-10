"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const utils_auth = require("../../utils/auth.js");
const utils_categoryFrequent = require("../../utils/categoryFrequent.js");
const utils_lastTransactionPrefs = require("../../utils/lastTransactionPrefs.js");
const utils_lastUsedAccountBook = require("../../utils/lastUsedAccountBook.js");
const _sfc_main = {
  computed: {
    ...common_vendor.mapState(["currentAccountBook", "addTransactionType", "addTransactionAccountBook", "currentSharedAccountBook", "switchToAITab", "accountBooks", "userInfo"]),
    // 当前账本是否已结束（已结束不可记账）
    isAccountBookEnded() {
      var _a;
      return ((_a = this.displayAccountBook) == null ? void 0 : _a.status) === 1;
    },
    // 获取当前显示的账本（优先从首页传递的账本，其次一起账本，最后个人账本）
    displayAccountBook() {
      if (this.selectedAccountBook) {
        return this.selectedAccountBook;
      }
      if (this.currentSharedAccountBook && this.currentSharedAccountBook.type === 1) {
        return this.currentSharedAccountBook;
      }
      if (this.sharedAccountBookId && this.currentSharedAccountBook) {
        return this.currentSharedAccountBook;
      }
      return this.currentAccountBook;
    },
    // 全部可选二级分类（含无子类时的一级）
    allSelectableCategories() {
      const result = [];
      for (const parent of this.categories || []) {
        if (parent.children && parent.children.length) {
          for (const child of parent.children) {
            result.push({ category: child, parent });
          }
        } else {
          result.push({ category: parent, parent });
        }
      }
      return result.sort((a, b) => {
        const aCustom = a.category.isUserCustom ? 0 : 1;
        const bCustom = b.category.isUserCustom ? 0 : 1;
        return aCustom - bCustom;
      });
    },
    // 常用分类（按历史频次，不足时用默认顺序补齐）
    displayedFrequentCategories() {
      const all = this.allSelectableCategories;
      const limit = utils_categoryFrequent.FREQUENT_CATEGORY_LIMIT;
      if (!all.length)
        return [];
      const book = this.displayAccountBook;
      const frequentIds = utils_categoryFrequent.getFrequentCategoryIds(
        this.transactionType,
        book && book.id != null ? book.id : null,
        all.map((item) => this.normalizeCategoryId(item.category.id)),
        limit
      );
      const items = [];
      const used = /* @__PURE__ */ new Set();
      const pushItem = (item) => {
        if (!item)
          return;
        const id = this.normalizeCategoryId(item.category.id);
        if (id == null || used.has(id) || items.length >= limit)
          return;
        used.add(id);
        items.push(item);
      };
      frequentIds.forEach((id) => {
        pushItem(all.find((item) => this.normalizeCategoryId(item.category.id) === id));
      });
      for (const item of all) {
        if (items.length >= limit)
          break;
        pushItem(item);
      }
      const selectedId = this.normalizeCategoryId(this.selectedCategoryId);
      if (selectedId != null) {
        const selectedItem = all.find((item) => this.normalizeCategoryId(item.category.id) === selectedId);
        if (selectedItem && !used.has(selectedId)) {
          if (items.length >= limit) {
            items[limit - 1] = selectedItem;
          } else {
            items.push(selectedItem);
          }
        }
      }
      return items;
    },
    // 一起账本成员列表（用于分摊对象选择）
    allocationMembers() {
      const book = this.displayAccountBook;
      if (!book || book.type !== 1 || !book.members || !Array.isArray(book.members))
        return [];
      return book.members.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        userAvatar: m.userAvatar
      }));
    },
    // 分类网格（最多10个常用分类）
    categoryGridItems() {
      const all = this.allSelectableCategories;
      const limit = 10;
      if (!all.length)
        return [];
      const book = this.displayAccountBook;
      const frequentIds = utils_categoryFrequent.getFrequentCategoryIds(
        this.transactionType,
        book && book.id != null ? book.id : null,
        all.map((item) => this.normalizeCategoryId(item.category.id)),
        limit
      );
      const items = [];
      const used = /* @__PURE__ */ new Set();
      const pushItem = (item) => {
        if (!item)
          return;
        const id = this.normalizeCategoryId(item.category.id);
        if (id == null || used.has(id) || items.length >= limit)
          return;
        used.add(id);
        items.push(item);
      };
      frequentIds.forEach((id) => {
        pushItem(all.find((item) => this.normalizeCategoryId(item.category.id) === id));
      });
      for (const item of all) {
        if (items.length >= limit)
          break;
        pushItem(item);
      }
      const selectedId = this.normalizeCategoryId(this.selectedCategoryId);
      if (selectedId != null) {
        const selectedItem = all.find((item) => this.normalizeCategoryId(item.category.id) === selectedId);
        if (selectedItem && !used.has(selectedId)) {
          if (items.length >= limit) {
            items[limit - 1] = selectedItem;
          } else {
            items.push(selectedItem);
          }
        }
      }
      return items;
    },
    dateKeypadLabel() {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (this.transactionDate === today)
        return "今天";
      const d = new Date(this.transactionDate);
      if (Number.isNaN(d.getTime()))
        return "今天";
      return `${d.getMonth() + 1}/${d.getDate()}`;
    },
    currentSpendingChannel() {
      return this.spendingChannels.find((c) => c.value === this.selectedSpendingChannel) || this.spendingChannels[0] || null;
    },
    isChannelUnset() {
      return !this.selectedSpendingChannel || this.selectedSpendingChannel === 0;
    },
    showAllocationBar() {
      const book = this.displayAccountBook;
      return book && book.type === 1 && this.transactionType === 0 && this.allocationMembers.length > 0;
    },
    selectedAllocationCount() {
      return this.allocationUserIds ? this.allocationUserIds.length : 0;
    },
    canManageBookCategories() {
      const book = this.displayAccountBook;
      if (!book || !this.userInfo)
        return false;
      return book.userId === this.userInfo.id;
    }
  },
  data() {
    const sysInfo = common_vendor.index.getSystemInfoSync();
    return {
      statusBarHeight: sysInfo.statusBarHeight || 20,
      activeTab: "manual",
      transactionType: 0,
      // 0-支出, 1-收入
      amount: "",
      amountExpression: "",
      selectedCategoryId: null,
      selectedParentId: null,
      // 当前选中的父分类ID
      selectedSpendingChannel: 0,
      remark: "",
      transactionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // 显示用的日期
      transactionDateTime: (/* @__PURE__ */ new Date()).toISOString(),
      // 完整的日期时间
      categories: [],
      saving: false,
      images: [],
      // { storageUrl, displayUrl }
      uploading: false,
      // 是否正在上传
      sharedAccountBookId: null,
      // 一起账本ID（从URL参数获取）
      selectedAccountBook: null,
      // 从首页选择的账本
      spendingChannels: [],
      // 币种列表（从API获取）
      currencies: [],
      selectedCurrency: 0,
      // 默认人民币
      // AI记账相关
      aiInputText: "",
      // AI输入文本
      aiRecognizing: false,
      // 是否正在识别
      showAiConfirmDialog: false,
      // 是否显示AI确认对话框
      aiRecognizedResult: null,
      // AI识别结果
      // 语音输入相关
      showVoiceDialog: false,
      // 是否显示语音输入弹窗
      // 备注弹窗相关
      showRemarkDialog: false,
      // 是否显示备注弹窗
      tempRemark: "",
      // 临时备注内容
      showChannelDialog: false,
      tempSpendingChannel: 0,
      isRecording: false,
      // 是否正在录音
      recordingManager: null,
      // 录音管理器
      allocationUserIds: [],
      // 分摊对象用户ID（仅一起账本支出）
      showCategoryDrawer: false,
      // 全部分类抽屉
      drawerSelectedCategoryId: null,
      // 抽屉内临时选中分类
      drawerSelectedParentId: null,
      showExtrasDrawer: false,
      showCustomCategoryDrawer: false,
      manageCategoryList: [],
      manageCategoryLoading: false,
      showCustomCategoryForm: false,
      customCategorySaving: false,
      customCategoryForm: {
        name: "",
        icon: "📝",
        color: "#F5A623"
      },
      showBookPicker: false,
      bookPickerOptions: []
    };
  },
  onLoad(options) {
    if (options.sharedAccountBookId) {
      this.sharedAccountBookId = parseInt(options.sharedAccountBookId);
    }
    if (options.type !== void 0) {
      this.transactionType = parseInt(options.type);
    } else if (this.addTransactionType !== null) {
      this.transactionType = this.addTransactionType;
      this.$store.dispatch("setAddTransactionType", null);
    }
    if (options.accountBookId) {
      const accountBookId = parseInt(options.accountBookId);
      const accountBookType = parseInt(options.accountBookType || "0");
      this.loadAccountBookById(accountBookId, accountBookType);
    } else {
      this.resolveDefaultAccountBookIfNeeded();
    }
    this.loadCurrencies();
    this.loadSpendingChannels();
  },
  onShow() {
    if (this.addTransactionType !== null) {
      this.transactionType = this.addTransactionType;
      this.$store.dispatch("setAddTransactionType", null);
    }
    if (this.addTransactionAccountBook) {
      this.loadAccountBookById(this.addTransactionAccountBook.id, this.addTransactionAccountBook.type);
      this.$store.dispatch("setAddTransactionAccountBook", null);
    } else {
      this.loadCategories();
    }
    this.loadSpendingChannels();
    if (this.switchToAITab) {
      this.activeTab = "ai";
      this.$store.dispatch("setSwitchToAITab", false);
    }
  },
  watch: {
    transactionType() {
      this.closeCategoryDrawer();
      this.loadCategories();
    },
    // 分摊对象默认全部选中
    allocationMembers: {
      handler(members) {
        if (members && members.length > 0) {
          this.allocationUserIds = members.map((m) => m.userId);
        }
      },
      immediate: true
    }
  },
  methods: {
    formatDate: utils_util.formatDate,
    cancelAdd() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
      } else {
        common_vendor.index.switchTab({ url: "/pages/index/index" });
      }
    },
    openExtrasDrawer() {
      this.showExtrasDrawer = true;
    },
    closeExtrasDrawer() {
      this.showExtrasDrawer = false;
    },
    openVoiceFromExtras() {
      this.closeExtrasDrawer();
      this.openVoiceDialog();
    },
    evaluateAmountExpression(expr) {
      if (!expr || !String(expr).trim())
        return 0;
      const sanitized = String(expr).replace(/\s/g, "");
      if (!/^[\d.+\-]+$/.test(sanitized))
        return NaN;
      const tokens = sanitized.match(/(\d+\.?\d*|[+\-])/g);
      if (!tokens || !tokens.length)
        return NaN;
      let result = parseFloat(tokens[0]);
      if (Number.isNaN(result))
        return NaN;
      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const num = parseFloat(tokens[i + 1]);
        if (op !== "+" && op !== "-" || Number.isNaN(num))
          return NaN;
        result = op === "+" ? result + num : result - num;
      }
      return Math.round(result * 100) / 100;
    },
    syncAmountFromExpression() {
      const value = this.evaluateAmountExpression(this.amountExpression);
      if (!Number.isNaN(value) && value > 0) {
        this.amount = String(value);
      } else if (!this.amountExpression) {
        this.amount = "";
      }
    },
    onKeypadPress(key) {
      if (key === "back") {
        this.amountExpression = this.amountExpression.slice(0, -1);
        this.syncAmountFromExpression();
        return;
      }
      if (key === "+" || key === "-") {
        const expr = this.amountExpression;
        if (!expr)
          return;
        const last = expr.slice(-1);
        if (last === "+" || last === "-") {
          this.amountExpression = expr.slice(0, -1) + key;
        } else {
          this.amountExpression = expr + key;
        }
        return;
      }
      if (key === ".") {
        const expr = this.amountExpression;
        const parts = expr.split(/[+\-]/);
        const lastPart = parts[parts.length - 1] || "";
        if (lastPart.includes("."))
          return;
        this.amountExpression = expr + (expr ? "." : "0.");
        this.syncAmountFromExpression();
        return;
      }
      if (/^\d$/.test(key)) {
        const expr = this.amountExpression;
        if (expr === "0" && key !== ".") {
          this.amountExpression = key;
        } else {
          this.amountExpression = expr + key;
        }
        this.syncAmountFromExpression();
      }
    },
    // 获取账本用途图标
    getCategoryIcon(category) {
      const icons = {
        0: "🏠",
        // 日常消费
        1: "✈️",
        // 旅行
        2: "🔧",
        // 装修
        3: "💒",
        // 结婚
        4: "👶",
        // 育儿
        5: "💼",
        // 生意
        6: "👨‍👩‍👧‍👦",
        // 家庭
        99: "📝"
        // 其他
      };
      return icons[category] || "🏠";
    },
    // 格式化日期范围
    formatDateRange(startDate, endDate) {
      const formatSimpleDate = (dateStr) => {
        if (!dateStr)
          return "";
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      };
      const start = formatSimpleDate(startDate);
      const end = formatSimpleDate(endDate);
      if (start && end) {
        return `${start} 至 ${end}`;
      } else if (start) {
        return `${start} 起`;
      } else if (end) {
        return `至 ${end}`;
      }
      return "";
    },
    // 清空表单
    clearForm() {
      this.amount = "";
      this.amountExpression = "";
      this.selectedCurrency = 0;
      const members = this.allocationMembers;
      this.allocationUserIds = members && members.length > 0 ? members.map((m) => m.userId) : [];
      this.remark = "";
      this.transactionDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      this.transactionDateTime = (/* @__PURE__ */ new Date()).toISOString();
      this.images = [];
      this.aiInputText = "";
      this.aiRecognizedResult = null;
      this.loadCategories();
    },
    // 检测文本中是否包含时间信息
    hasTimeInfo(text) {
      if (!text)
        return false;
      const timeKeywords = [
        "今天",
        "昨天",
        "前天",
        "明天",
        "后天",
        "今天早上",
        "今天中午",
        "今天下午",
        "今天晚上",
        "今晚",
        "昨天早上",
        "昨天中午",
        "昨天下午",
        "昨天晚上",
        "昨晚",
        "早上",
        "中午",
        "下午",
        "晚上",
        "凌晨",
        "月",
        "日",
        "号",
        "年",
        "周一",
        "周二",
        "周三",
        "周四",
        "周五",
        "周六",
        "周日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
        "星期日"
      ];
      const hasKeyword = timeKeywords.some((keyword) => text.includes(keyword));
      if (hasKeyword)
        return true;
      const datePatterns = [
        /\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
        // 2024-01-01 或 2024/01/01
        /\d{1,2}[-/]\d{1,2}/,
        // 1-1 或 1/1
        /\d{1,2}月\d{1,2}[日号]/,
        // 1月1日 或 1月1号
        /\d{4}年\d{1,2}月\d{1,2}[日号]/
        // 2024年1月1日
      ];
      return datePatterns.some((pattern) => pattern.test(text));
    },
    async loadCategories() {
      try {
        const book = this.displayAccountBook;
        const accountBookId = book && book.id != null ? book.id : void 0;
        this.categories = await utils_api.api.categories.getList(this.transactionType, accountBookId);
        this.applyLastTransactionDefaults();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1041", "加载分类失败", error);
        common_vendor.index.showToast({
          title: "加载分类失败",
          icon: "none"
        });
      }
    },
    async loadSpendingChannels() {
      try {
        const list = await utils_api.api.spendingChannelTypes.getList();
        if (Array.isArray(list) && list.length > 0) {
          this.spendingChannels = list.map((item) => ({
            value: item.value,
            name: item.name,
            icon: item.icon || "🛒",
            color: item.color || "#BFBFBF"
          }));
          this.applyLastTransactionDefaults();
        }
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/add-transaction/add-transaction.vue:1062", "加载消费渠道失败", error);
      }
    },
    applyLastTransactionDefaults() {
      const book = this.displayAccountBook;
      const accountBookId = book && book.id != null ? book.id : null;
      const lastCategoryId = utils_lastTransactionPrefs.getLastCategoryId(this.transactionType, accountBookId);
      if (lastCategoryId != null) {
        const item = this.allSelectableCategories.find(
          (entry) => this.normalizeCategoryId(entry.category.id) === this.normalizeCategoryId(lastCategoryId)
        );
        if (item) {
          this.selectCategory(item.category, item.parent);
        } else {
          this.selectedCategoryId = null;
          this.selectedParentId = null;
        }
      } else {
        this.selectedCategoryId = null;
        this.selectedParentId = null;
      }
      const lastChannel = utils_lastTransactionPrefs.getLastSpendingChannel(this.transactionType, accountBookId);
      if (lastChannel != null && lastChannel !== 0 && this.spendingChannels.some((c) => c.value === lastChannel)) {
        this.selectedSpendingChannel = lastChannel;
      } else {
        this.selectedSpendingChannel = 0;
      }
    },
    async resolveDefaultAccountBookIfNeeded() {
      const accountBookTab = common_vendor.index.getStorageSync("accountBookTab") || "all";
      let personalAccountBooks = [];
      let sharedAccountBooks = [];
      try {
        personalAccountBooks = await utils_api.api.accountBooks.getList();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1101", "加载个人账本失败", e);
      }
      try {
        sharedAccountBooks = await utils_api.api.sharedAccountBooks.getList();
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1106", "加载一起账本失败", e);
      }
      const resolved = utils_lastUsedAccountBook.resolveAccountBookForAdd({
        accountBookTab,
        currentAccountBook: this.currentAccountBook,
        currentSharedAccountBook: this.currentSharedAccountBook,
        personalAccountBooks,
        sharedAccountBooks
      });
      if (resolved) {
        await this.loadAccountBookById(resolved.id, resolved.type);
        return;
      }
      this.loadCategories();
    },
    saveLastTransactionPrefs(categoryId, spendingChannel, transactionType = this.transactionType) {
      const book = this.displayAccountBook;
      if (!book || book.id == null)
        return;
      utils_lastTransactionPrefs.recordLastTransactionPrefs(transactionType, book.id, {
        categoryId,
        spendingChannel
      });
      utils_lastUsedAccountBook.recordLastUsedAccountBook(book);
    },
    isSameBook(a, b) {
      if (!a || !b)
        return false;
      return a.id === b.id && (a.type ?? 0) === (b.type ?? 0);
    },
    async openBookPicker() {
      try {
        const personal = await utils_api.api.accountBooks.getList();
        let shared = [];
        try {
          shared = await utils_api.api.sharedAccountBooks.getList();
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/add-transaction/add-transaction.vue:1147", "加载一起账本失败", e);
        }
        this.bookPickerOptions = [
          ...personal.filter((b) => b.status !== 1).map((b) => ({ ...b, type: 0 })),
          ...shared.filter((b) => b.status !== 1).map((b) => ({ ...b, type: 1 }))
        ];
        if (!this.bookPickerOptions.length) {
          common_vendor.index.showToast({ title: "暂无可用账本", icon: "none" });
          return;
        }
        this.showBookPicker = true;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1159", "加载账本列表失败", error);
        common_vendor.index.showToast({ title: "加载账本失败", icon: "none" });
      }
    },
    async selectBookFromPicker(book) {
      this.showBookPicker = false;
      await this.loadAccountBookById(book.id, book.type ?? 0);
    },
    // 加载币种列表（优先使用当前账本的启用币种与默认币种）
    async loadCurrencies() {
      try {
        let rates = await utils_api.api.currencyRates.getEnabled();
        const book = this.displayAccountBook;
        if (book && Array.isArray(book.enabledCurrencyIds) && book.enabledCurrencyIds.length > 0) {
          const idSet = new Set(book.enabledCurrencyIds);
          rates = rates.filter((r) => idSet.has(r.currency));
        }
        this.currencies = rates.map((rate) => ({
          value: rate.currency,
          name: rate.currencyName,
          symbol: rate.currencySymbol
        }));
        if (this.currencies.length > 0) {
          const defaultVal = book && book.defaultCurrency != null && book.defaultCurrency !== void 0 ? book.defaultCurrency : this.currencies[0].value;
          const inList = this.currencies.some((c) => c.value === defaultVal);
          if (inList) {
            this.selectedCurrency = defaultVal;
          } else if (this.selectedCurrency === 0 || !this.currencies.some((c) => c.value === this.selectedCurrency)) {
            this.selectedCurrency = this.currencies[0].value;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1197", "加载币种列表失败", error);
        this.currencies = [
          { value: 0, name: "人民币", symbol: "¥" }
        ];
      }
    },
    // 根据账本ID加载账本信息
    async loadAccountBookById(accountBookId, accountBookType) {
      try {
        let accountBook = null;
        if (accountBookType === 1) {
          accountBook = await utils_api.api.sharedAccountBooks.getById(accountBookId);
        } else {
          accountBook = await utils_api.api.accountBooks.getById(accountBookId);
        }
        if (accountBook) {
          this.selectedAccountBook = accountBook;
          this.loadCurrencies();
          this.loadCategories();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1223", "加载账本信息失败", error);
        this.selectedAccountBook = null;
      }
    },
    normalizeCategoryId(id) {
      if (id == null || id === "")
        return null;
      const num = Number(id);
      return Number.isNaN(num) ? id : num;
    },
    isCategorySelected(categoryId) {
      const current = this.normalizeCategoryId(this.selectedCategoryId);
      const target = this.normalizeCategoryId(categoryId);
      return current != null && target != null && current === target;
    },
    isDrawerCategorySelected(categoryId) {
      const current = this.normalizeCategoryId(this.drawerSelectedCategoryId);
      const target = this.normalizeCategoryId(categoryId);
      return current != null && target != null && current === target;
    },
    isDrawerCategoryGroupActive(parent) {
      if (!this.drawerSelectedCategoryId)
        return false;
      const selectedId = this.normalizeCategoryId(this.drawerSelectedCategoryId);
      if (parent.children && parent.children.length > 0) {
        return parent.children.some((child) => this.normalizeCategoryId(child.id) === selectedId);
      }
      return this.normalizeCategoryId(parent.id) === selectedId;
    },
    selectCategory(category, parent) {
      this.selectedCategoryId = this.normalizeCategoryId(category.id);
      this.selectedParentId = parent ? this.normalizeCategoryId(parent.id) : null;
    },
    selectFrequentCategory(item) {
      if (!item || !item.category)
        return;
      this.selectCategory(item.category, item.parent);
    },
    onSelectCategoryItem(item, closeDrawer = false) {
      if (!item)
        return;
      this.selectCategory(item.category, item.parent);
      if (closeDrawer) {
        this.closeCategoryDrawer();
      }
    },
    selectDrawerCategory(item) {
      if (!item || !item.category)
        return;
      this.drawerSelectedCategoryId = this.normalizeCategoryId(item.category.id);
      this.drawerSelectedParentId = item.parent ? this.normalizeCategoryId(item.parent.id) : null;
    },
    async openCategoryDrawer() {
      await this.loadCategories();
      this.drawerSelectedCategoryId = this.normalizeCategoryId(this.selectedCategoryId);
      this.drawerSelectedParentId = this.normalizeCategoryId(this.selectedParentId);
      this.showCategoryDrawer = true;
    },
    closeCategoryDrawer() {
      this.showCategoryDrawer = false;
      this.drawerSelectedCategoryId = null;
      this.drawerSelectedParentId = null;
    },
    confirmDrawerCategory() {
      if (this.drawerSelectedCategoryId == null) {
        common_vendor.index.showToast({
          title: "请选择分类",
          icon: "none"
        });
        return;
      }
      this.selectedCategoryId = this.drawerSelectedCategoryId;
      this.selectedParentId = this.drawerSelectedParentId;
      this.closeCategoryDrawer();
    },
    async openCustomCategoryDrawer() {
      const book = this.displayAccountBook;
      if (!book || book.id == null) {
        common_vendor.index.showToast({ title: "请先选择账本", icon: "none" });
        return;
      }
      if (!this.canManageBookCategories) {
        common_vendor.index.showToast({ title: "无权限管理分类", icon: "none" });
        return;
      }
      this.showCustomCategoryDrawer = true;
      await this.loadManageCategories();
    },
    closeCustomCategoryDrawer() {
      this.showCustomCategoryDrawer = false;
      this.closeCustomCategoryForm();
    },
    async loadManageCategories() {
      const book = this.displayAccountBook;
      if (!book || book.id == null)
        return;
      this.manageCategoryLoading = true;
      try {
        const list = await utils_api.api.accountBookCategories.getManageList(book.id, this.transactionType);
        this.manageCategoryList = Array.isArray(list) ? list : [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1332", "加载分类管理列表失败", error);
        this.manageCategoryList = [];
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        this.manageCategoryLoading = false;
      }
    },
    async saveManageCategoryOrder() {
      const book = this.displayAccountBook;
      if (!book || book.id == null || !this.manageCategoryList.length)
        return;
      try {
        await utils_api.api.accountBookCategories.reorder(book.id, {
          type: this.transactionType,
          categoryIds: this.manageCategoryList.map((item) => item.id)
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1349", "保存分类排序失败", error);
        common_vendor.index.showToast({ title: "排序保存失败", icon: "none" });
      }
    },
    async moveManageCategory(index, delta) {
      const target = index + delta;
      if (target < 0 || target >= this.manageCategoryList.length)
        return;
      const list = [...this.manageCategoryList];
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      this.manageCategoryList = list;
      await this.saveManageCategoryOrder();
    },
    confirmDeleteManageCategory(item) {
      if (!item || item.isUsed)
        return;
      common_vendor.index.showModal({
        title: "确认删除",
        content: item.isUserCustom ? `确定删除自定义分类「${item.name}」吗？` : `确定从账本中移除「${item.name}」吗？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          const book = this.displayAccountBook;
          if (!book || book.id == null)
            return;
          try {
            await utils_api.api.accountBookCategories.removeFromBook(book.id, item.id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await this.loadManageCategories();
            await this.loadCategories();
          } catch (error) {
            common_vendor.index.showToast({
              title: error && error.message || "删除失败",
              icon: "none"
            });
          }
        }
      });
    },
    openCustomCategoryForm() {
      this.customCategoryForm = {
        name: "",
        icon: "📝",
        color: "#F5A623"
      };
      this.showCustomCategoryForm = true;
    },
    openCustomCategoryFromGrid() {
      const book = this.displayAccountBook;
      if (!book || book.id == null) {
        common_vendor.index.showToast({ title: "请先选择账本", icon: "none" });
        return;
      }
      if (!this.canManageBookCategories) {
        common_vendor.index.showToast({ title: "无权限添加自定义分类", icon: "none" });
        return;
      }
      this.openCustomCategoryForm();
    },
    closeCustomCategoryForm() {
      this.showCustomCategoryForm = false;
      this.customCategorySaving = false;
    },
    async submitCustomCategoryForm() {
      const name = (this.customCategoryForm.name || "").trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请输入分类名称", icon: "none" });
        return;
      }
      const book = this.displayAccountBook;
      if (!book || book.id == null)
        return;
      this.customCategorySaving = true;
      try {
        await utils_api.api.accountBookCategories.createCustom(book.id, {
          name,
          icon: (this.customCategoryForm.icon || "📝").trim(),
          color: (this.customCategoryForm.color || "#F5A623").trim(),
          type: this.transactionType
        });
        common_vendor.index.showToast({ title: "已添加", icon: "success" });
        this.closeCustomCategoryForm();
        await this.loadManageCategories();
        await this.loadCategories();
      } catch (error) {
        common_vendor.index.showToast({
          title: error && error.message || "添加失败",
          icon: "none"
        });
      } finally {
        this.customCategorySaving = false;
      }
    },
    recordCurrentCategoryUsage(categoryId, transactionType = this.transactionType) {
      const book = this.displayAccountBook;
      utils_categoryFrequent.recordCategoryUsage(
        transactionType,
        book && book.id != null ? book.id : null,
        categoryId
      );
    },
    selectSpendingChannel(value) {
      this.selectedSpendingChannel = value;
    },
    channelIconBg(channel) {
      const color = channel && channel.color || "#F5A623";
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return `${color}22`;
      }
      return "#FFF6E8";
    },
    getChannelPickerIconStyle(channel, selected) {
      const color = channel && channel.color || "#F5A623";
      if (selected) {
        return { backgroundColor: color };
      }
      return { backgroundColor: this.channelIconBg(channel) };
    },
    openChannelDialog() {
      this.tempSpendingChannel = this.selectedSpendingChannel;
      this.showChannelDialog = true;
    },
    closeChannelDialog() {
      this.showChannelDialog = false;
    },
    confirmSpendingChannel() {
      this.selectedSpendingChannel = this.tempSpendingChannel;
      const book = this.displayAccountBook;
      if (book && book.id != null) {
        utils_lastTransactionPrefs.recordLastTransactionPrefs(this.transactionType, book.id, {
          spendingChannel: this.selectedSpendingChannel
        });
      }
      this.closeChannelDialog();
    },
    selectCurrency(value) {
      this.selectedCurrency = value;
    },
    isAllocationSelected(userId) {
      return this.allocationUserIds && this.allocationUserIds.indexOf(userId) >= 0;
    },
    toggleAllocation(userId) {
      if (!this.allocationUserIds)
        this.allocationUserIds = [];
      const i = this.allocationUserIds.indexOf(userId);
      if (i >= 0) {
        this.allocationUserIds = this.allocationUserIds.filter((id) => id !== userId);
      } else {
        this.allocationUserIds = [...this.allocationUserIds, userId];
      }
    },
    onDateChange(e) {
      this.transactionDate = e.detail.value;
      const now = /* @__PURE__ */ new Date();
      const selectedDate = new Date(e.detail.value);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      this.transactionDateTime = selectedDate.toISOString();
    },
    // 选择图片
    chooseImage() {
      if (this.images.length >= 9) {
        common_vendor.index.showToast({
          title: "最多只能上传9张图片",
          icon: "none"
        });
        return;
      }
      common_vendor.index.chooseImage({
        count: 9 - this.images.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.uploadImages(res.tempFilePaths);
        }
      });
    },
    // 上传图片
    async uploadImages(filePaths) {
      this.uploading = true;
      try {
        for (const filePath of filePaths) {
          const result = await utils_api.api.images.upload(filePath, { contentCheck: true });
          if (result.imageUrl) {
            this.images.push({
              storageUrl: result.imageUrl,
              displayUrl: result.displayUrl || result.imageUrl
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1559", "上传图片失败", error);
        common_vendor.index.showToast({
          title: error.message || "上传图片失败",
          icon: "none",
          duration: 2500
        });
      } finally {
        this.uploading = false;
      }
    },
    // 预览图片
    previewImage(index) {
      common_vendor.index.previewImage({
        urls: this.images.map((img) => img.displayUrl),
        current: index
      });
    },
    // 删除图片
    removeImage(index) {
      this.images.splice(index, 1);
    },
    // AI识别交易
    async recognizeWithAi() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      if (!this.aiInputText.trim()) {
        common_vendor.index.showToast({
          title: "请输入记账内容",
          icon: "none"
        });
        return;
      }
      if (!this.hasTimeInfo(this.aiInputText.trim())) {
        common_vendor.index.showToast({
          title: "请输入时间信息，如：今天、昨天、1月1日等",
          icon: "none",
          duration: 3e3
        });
        return;
      }
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        common_vendor.index.showToast({
          title: "请先选择账本",
          icon: "none"
        });
        return;
      }
      this.aiRecognizing = true;
      try {
        const result = await utils_api.api.aiTransaction.recognize({
          text: this.aiInputText.trim(),
          accountBookId: targetAccountBook.id,
          transactionType: this.transactionType
        });
        this.aiRecognizedResult = result;
        this.showAiConfirmDialog = true;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1629", "AI识别失败", error);
        common_vendor.index.showToast({
          title: error.message || "识别失败，请重试",
          icon: "none"
        });
      } finally {
        this.aiRecognizing = false;
      }
    },
    // 确认AI识别结果并直接提交
    async confirmAiResult() {
      if (!this.aiRecognizedResult)
        return;
      if (this.isAccountBookEnded) {
        common_vendor.index.showToast({
          title: "已结束的账本不能继续记账",
          icon: "none"
        });
        return;
      }
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        common_vendor.index.showToast({
          title: "请先选择账本",
          icon: "none"
        });
        return;
      }
      if (!this.aiRecognizedResult.amount || this.aiRecognizedResult.amount <= 0) {
        common_vendor.index.showToast({
          title: "金额无效",
          icon: "none"
        });
        return;
      }
      if (!this.aiRecognizedResult.categoryId) {
        common_vendor.index.showToast({
          title: "分类无效",
          icon: "none"
        });
        return;
      }
      let transactionDateTime;
      if (this.aiRecognizedResult.transactionDate) {
        const aiDate = new Date(this.aiRecognizedResult.transactionDate);
        const now = /* @__PURE__ */ new Date();
        aiDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        transactionDateTime = aiDate.toISOString();
      } else {
        transactionDateTime = this.transactionDateTime;
      }
      this.showAiConfirmDialog = false;
      this.saving = true;
      try {
        await utils_api.api.transactions.create({
          accountBookId: targetAccountBook.id,
          categoryId: this.aiRecognizedResult.categoryId,
          amount: this.aiRecognizedResult.amount,
          type: this.aiRecognizedResult.type,
          remark: this.aiRecognizedResult.remark || "",
          paymentMethod: 99,
          spendingChannel: this.aiRecognizedResult.type === 0 ? this.selectedSpendingChannel : 0,
          currency: this.selectedCurrency,
          transactionDate: transactionDateTime,
          imageUrls: this.images.length > 0 ? this.images.map((img) => img.storageUrl) : null,
          allocationUserIds: targetAccountBook.type === 1 && this.aiRecognizedResult.type === 0 && this.allocationUserIds && this.allocationUserIds.length > 0 ? this.allocationUserIds : void 0
        });
        this.recordCurrentCategoryUsage(this.aiRecognizedResult.categoryId, this.aiRecognizedResult.type);
        this.saveLastTransactionPrefs(
          this.aiRecognizedResult.categoryId,
          this.aiRecognizedResult.type === 0 ? this.selectedSpendingChannel : 0,
          this.aiRecognizedResult.type
        );
        this.clearForm();
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            common_vendor.index.navigateBack();
          } else {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1743", "保存失败", error);
        if (error.message && error.message.includes("需要授权")) {
          common_vendor.index.showModal({
            title: "需要登录",
            content: "需要授权微信登录后才能使用记账功能",
            confirmText: "去登录",
            cancelText: "取消",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.reLaunch({
                  url: "/pages/login/login"
                });
              } else {
                this.showAiConfirmDialog = true;
              }
            }
          });
        } else {
          common_vendor.index.showToast({
            title: error.message || "保存失败",
            icon: "none"
          });
          this.showAiConfirmDialog = true;
        }
      } finally {
        this.saving = false;
      }
    },
    async saveTransaction() {
      if (this.isAccountBookEnded) {
        common_vendor.index.showToast({
          title: "已结束的账本不能继续记账",
          icon: "none"
        });
        return;
      }
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      this.syncAmountFromExpression();
      const evaluated = this.evaluateAmountExpression(this.amountExpression);
      if (this.amountExpression && !Number.isNaN(evaluated) && evaluated > 0) {
        this.amount = String(evaluated);
      }
      if (!this.amount || parseFloat(this.amount) <= 0) {
        common_vendor.index.showToast({
          title: "请输入金额",
          icon: "none"
        });
        return;
      }
      if (!this.selectedCategoryId) {
        common_vendor.index.showToast({
          title: "请选择分类",
          icon: "none"
        });
        return;
      }
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        common_vendor.index.showToast({
          title: "请先选择账本",
          icon: "none"
        });
        return;
      }
      this.saving = true;
      try {
        await utils_api.api.transactions.create({
          accountBookId: targetAccountBook.id,
          categoryId: this.selectedCategoryId,
          amount: parseFloat(this.amount),
          type: this.transactionType,
          remark: this.remark,
          paymentMethod: 99,
          spendingChannel: this.transactionType === 0 ? this.selectedSpendingChannel : 0,
          currency: this.selectedCurrency,
          transactionDate: this.transactionDateTime,
          imageUrls: this.images.length > 0 ? this.images.map((img) => img.storageUrl) : null,
          allocationUserIds: targetAccountBook.type === 1 && this.transactionType === 0 && this.allocationUserIds && this.allocationUserIds.length > 0 ? this.allocationUserIds : void 0
        });
        this.recordCurrentCategoryUsage(this.selectedCategoryId);
        this.saveLastTransactionPrefs(this.selectedCategoryId, this.selectedSpendingChannel);
        this.clearForm();
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            common_vendor.index.navigateBack();
          } else {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1864", "保存失败", error);
        if (error.message && error.message.includes("需要授权")) {
          common_vendor.index.showModal({
            title: "需要登录",
            content: "需要授权微信登录后才能使用记账功能",
            confirmText: "去登录",
            cancelText: "取消",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.reLaunch({
                  url: "/pages/login/login"
                });
              }
            }
          });
        } else {
          common_vendor.index.showToast({
            title: error.message || "保存失败",
            icon: "none"
          });
        }
      } finally {
        this.saving = false;
      }
    },
    // 打开语音输入弹窗
    openVoiceDialog() {
      this.showVoiceDialog = true;
      this.$nextTick(() => {
        this.startRecording();
      });
    },
    // 关闭语音输入弹窗
    closeVoiceDialog() {
      if (this.isRecording) {
        this.stopRecording();
      }
      this.showVoiceDialog = false;
    },
    // 打开备注弹窗
    openRemarkDialog() {
      this.tempRemark = this.remark;
      this.showRemarkDialog = true;
    },
    // 关闭备注弹窗
    closeRemarkDialog() {
      this.showRemarkDialog = false;
      this.tempRemark = "";
    },
    // 确认备注
    confirmRemark() {
      this.remark = this.tempRemark;
      this.closeRemarkDialog();
    },
    // 显示语音设置
    showVoiceSettings() {
      common_vendor.index.showToast({
        title: "语音设置功能开发中",
        icon: "none"
      });
    },
    // 显示语音帮助
    showVoiceHelp() {
      common_vendor.index.showToast({
        title: "点击下方按钮开始录音",
        icon: "none"
      });
    },
    // 开始录音
    startRecording() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      if (this.isRecording)
        return;
      this.isRecording = true;
      this.recordingManager = common_vendor.index.getRecorderManager();
      this.recordingManager.onStart(() => {
        common_vendor.index.__f__("log", "at pages/add-transaction/add-transaction.vue:1957", "录音开始");
      });
      this.recordingManager.onError((err) => {
        common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:1961", "录音错误", err);
        this.isRecording = false;
        common_vendor.index.showToast({
          title: "录音失败，请重试",
          icon: "none"
        });
      });
      this.recordingManager.start({
        duration: 6e4,
        // 最长录音60秒
        sampleRate: 16e3,
        // 采样率：16000Hz（百度推荐）
        numberOfChannels: 1,
        // 单声道
        encodeBitRate: 96e3,
        // 编码码率
        format: "pcm"
        // 格式：mp3（兼容性好）
      });
    },
    // 停止录音并识别
    async stopRecording() {
      if (!this.isRecording || !this.recordingManager) {
        this.closeVoiceDialog();
        return;
      }
      this.isRecording = false;
      this.recordingManager.stop();
      this.recordingManager.onStop(async (res) => {
        common_vendor.index.__f__("log", "at pages/add-transaction/add-transaction.vue:1994", "录音结束", res);
        if (res.duration < 1e3) {
          common_vendor.index.showToast({
            title: "录音时间太短，请重新录音",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        this.closeVoiceDialog();
        common_vendor.index.showToast({
          title: "正在识别语音...",
          icon: "loading",
          duration: 1e4
        });
        try {
          const fileSystemManager = common_vendor.index.getFileSystemManager();
          const fileInfo = await new Promise((resolve, reject) => {
            fileSystemManager.getFileInfo({
              filePath: res.tempFilePath,
              success: resolve,
              fail: reject
            });
          });
          if (fileInfo.size > 5 * 1024 * 1024) {
            common_vendor.index.hideToast();
            common_vendor.index.showToast({
              title: "录音文件过大，请重新录音",
              icon: "none",
              duration: 2e3
            });
            return;
          }
          const audioBase64 = await new Promise((resolve, reject) => {
            fileSystemManager.readFile({
              filePath: res.tempFilePath,
              encoding: "base64",
              success: (readRes) => {
                resolve(readRes.data);
              },
              fail: (err) => {
                common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:2047", "读取录音文件失败", err);
                reject(new Error("读取录音文件失败"));
              }
            });
          });
          const targetAccountBook = this.displayAccountBook;
          if (!targetAccountBook) {
            common_vendor.index.hideToast();
            common_vendor.index.showToast({
              title: "请先选择账本",
              icon: "none"
            });
            return;
          }
          const result = await utils_api.api.aiTransaction.recognizeVoice({
            audioBase64,
            format: "mp3",
            accountBookId: targetAccountBook.id,
            transactionType: this.transactionType
          });
          common_vendor.index.hideToast();
          if (result && result.transaction) {
            this.aiRecognizedResult = result.transaction;
            this.showAiConfirmDialog = true;
            common_vendor.index.showToast({
              title: "识别成功",
              icon: "success",
              duration: 1500
            });
          } else if (result && result.text) {
            this.aiInputText = result.text;
            common_vendor.index.showToast({
              title: "识别成功，请点击识别按钮",
              icon: "success",
              duration: 2e3
            });
          } else {
            common_vendor.index.showToast({
              title: "未能识别出有效内容，请重新录音",
              icon: "none",
              duration: 2e3
            });
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/add-transaction/add-transaction.vue:2099", "语音识别失败", error);
          common_vendor.index.hideToast();
          let errorMessage = "语音识别失败，请重试";
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          common_vendor.index.showToast({
            title: errorMessage,
            icon: "none",
            duration: 3e3
          });
        }
      });
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  _easycom_app_icon2();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
if (!Math) {
  _easycom_app_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.cancelAdd && $options.cancelAdd(...args), "eb"),
    b: $data.transactionType === 0 ? 1 : "",
    c: common_vendor.o(($event) => $data.transactionType = 0, "e4"),
    d: $data.transactionType === 1 ? 1 : "",
    e: common_vendor.o(($event) => $data.transactionType = 1, "39"),
    f: $data.statusBarHeight + "px",
    g: $options.displayAccountBook
  }, $options.displayAccountBook ? {
    h: common_vendor.p({
      icon: $options.getCategoryIcon($options.displayAccountBook.category),
      size: 16,
      color: "#666666"
    }),
    i: common_vendor.t($options.displayAccountBook.name),
    j: common_vendor.t($options.displayAccountBook.type === 1 ? "一起记" : "个人"),
    k: common_vendor.o((...args) => $options.openBookPicker && $options.openBookPicker(...args), "08")
  } : {}, {
    l: common_vendor.f($options.categoryGridItems, (item, k0, i0) => {
      return {
        a: "5dbf22a8-1-" + i0,
        b: common_vendor.p({
          icon: item.category.icon || "📝",
          ["category-name"]: item.category.name,
          size: 22,
          color: $options.isCategorySelected(item.category.id) ? "#333333" : "#666666"
        }),
        c: common_vendor.t(item.category.name),
        d: item.category.id,
        e: $options.isCategorySelected(item.category.id) ? 1 : "",
        f: common_vendor.o(($event) => $options.selectFrequentCategory(item), item.category.id)
      };
    }),
    m: common_vendor.p({
      name: "list",
      size: 22,
      color: "#666666"
    }),
    n: common_vendor.o((...args) => $options.openCategoryDrawer && $options.openCategoryDrawer(...args), "59"),
    o: $options.canManageBookCategories
  }, $options.canManageBookCategories ? {
    p: common_vendor.p({
      name: "plusempty",
      size: 22,
      color: "#F5A623"
    }),
    q: common_vendor.o((...args) => $options.openCustomCategoryFromGrid && $options.openCustomCategoryFromGrid(...args), "e3")
  } : {}, {
    r: $data.transactionType === 0
  }, $data.transactionType === 0 ? common_vendor.e({
    s: $options.currentSpendingChannel && !$options.isChannelUnset
  }, $options.currentSpendingChannel && !$options.isChannelUnset ? {
    t: common_vendor.t($options.currentSpendingChannel.icon),
    v: $options.channelIconBg($options.currentSpendingChannel)
  } : {
    w: common_vendor.p({
      name: "shop",
      size: 16,
      color: "#F5A623"
    })
  }, {
    x: $options.isChannelUnset
  }, $options.isChannelUnset ? {} : {
    y: common_vendor.t($options.currentSpendingChannel.name)
  }, {
    z: $options.isChannelUnset ? 1 : "",
    A: common_vendor.o((...args) => $options.openChannelDialog && $options.openChannelDialog(...args), "57")
  }) : {}, {
    B: common_vendor.t($data.amountExpression || "0"),
    C: common_vendor.p({
      name: "book",
      size: 18,
      color: "#999999"
    }),
    D: common_vendor.t($data.remark),
    E: common_vendor.t($data.remark ? "修改" : "添加备注"),
    F: common_vendor.o((...args) => $options.openRemarkDialog && $options.openRemarkDialog(...args), "2c"),
    G: $data.transactionType === 0
  }, $data.transactionType === 0 ? common_vendor.e({
    H: common_vendor.f($data.images, (image, index, i0) => {
      return {
        a: image.displayUrl,
        b: common_vendor.o(($event) => $options.previewImage(index), index),
        c: common_vendor.o(($event) => $options.removeImage(index), index),
        d: index
      };
    }),
    I: $data.images.length < 9
  }, $data.images.length < 9 ? {
    J: common_vendor.p({
      name: "image",
      size: 18,
      color: "#2064f5a8"
    }),
    K: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args), "e1")
  } : {}) : {}, {
    L: $options.showAllocationBar
  }, $options.showAllocationBar ? {
    M: common_vendor.p({
      name: "team",
      size: 18,
      color: "#999999"
    }),
    N: common_vendor.f($options.allocationMembers, (member, k0, i0) => {
      return common_vendor.e({
        a: member.userAvatar
      }, member.userAvatar ? {
        b: member.userAvatar
      } : {
        c: common_vendor.t((member.userName || "?").charAt(0))
      }, {
        d: common_vendor.t(member.userName || "成员"),
        e: member.userId,
        f: $options.isAllocationSelected(member.userId) ? 1 : "",
        g: common_vendor.o(($event) => $options.toggleAllocation(member.userId), member.userId)
      });
    }),
    O: common_vendor.t($options.selectedAllocationCount)
  } : {}, {
    P: common_vendor.o(($event) => $options.onKeypadPress("1"), "7c"),
    Q: common_vendor.o(($event) => $options.onKeypadPress("2"), "7c"),
    R: common_vendor.o(($event) => $options.onKeypadPress("3"), "29"),
    S: common_vendor.p({
      name: "calendar",
      size: 22,
      color: "#666666"
    }),
    T: common_vendor.t($options.dateKeypadLabel),
    U: $data.transactionDate,
    V: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args), "07"),
    W: common_vendor.o(($event) => $options.onKeypadPress("4"), "3a"),
    X: common_vendor.o(($event) => $options.onKeypadPress("5"), "ce"),
    Y: common_vendor.o(($event) => $options.onKeypadPress("6"), "54"),
    Z: common_vendor.o(($event) => $options.onKeypadPress("+"), "96"),
    aa: common_vendor.o(($event) => $options.onKeypadPress("7"), "b7"),
    ab: common_vendor.o(($event) => $options.onKeypadPress("8"), "a0"),
    ac: common_vendor.o(($event) => $options.onKeypadPress("9"), "65"),
    ad: common_vendor.o(($event) => $options.onKeypadPress("-"), "2c"),
    ae: common_vendor.o(($event) => $options.onKeypadPress("."), "b2"),
    af: common_vendor.o(($event) => $options.onKeypadPress("0"), "84"),
    ag: common_vendor.p({
      name: "delete-bin",
      size: 22,
      color: "#333333"
    }),
    ah: common_vendor.o(($event) => $options.onKeypadPress("back"), "2a"),
    ai: common_vendor.t($data.saving ? "..." : $options.isAccountBookEnded ? "已结束" : "保存"),
    aj: $options.isAccountBookEnded || $data.saving ? 1 : "",
    ak: common_vendor.o((...args) => $options.saveTransaction && $options.saveTransaction(...args), "32"),
    al: $data.showExtrasDrawer
  }, $data.showExtrasDrawer ? common_vendor.e({
    am: common_vendor.o((...args) => $options.closeExtrasDrawer && $options.closeExtrasDrawer(...args), "dc"),
    an: $data.currencies.length > 0
  }, $data.currencies.length > 0 ? {
    ao: common_vendor.f($data.currencies, (currency, k0, i0) => {
      return {
        a: common_vendor.t(currency.symbol),
        b: common_vendor.t(currency.name),
        c: currency.value,
        d: $data.selectedCurrency === currency.value ? 1 : "",
        e: common_vendor.o(($event) => $options.selectCurrency(currency.value), currency.value)
      };
    })
  } : {}, {
    ap: common_vendor.p({
      name: "mic",
      size: 20,
      color: "#F5A623"
    }),
    aq: common_vendor.o((...args) => $options.openVoiceFromExtras && $options.openVoiceFromExtras(...args), "c2"),
    ar: common_vendor.o(() => {
    }, "08"),
    as: common_vendor.o((...args) => $options.closeExtrasDrawer && $options.closeExtrasDrawer(...args), "30")
  }) : {}, {
    at: $data.showAiConfirmDialog
  }, $data.showAiConfirmDialog ? common_vendor.e({
    av: common_vendor.o(($event) => $data.showAiConfirmDialog = false, "25"),
    aw: common_vendor.t(((_a = $data.aiRecognizedResult) == null ? void 0 : _a.type) === 0 ? "支出" : "收入"),
    ax: common_vendor.t((_c = (_b = $data.aiRecognizedResult) == null ? void 0 : _b.amount) == null ? void 0 : _c.toFixed(2)),
    ay: common_vendor.p({
      icon: ((_d = $data.aiRecognizedResult) == null ? void 0 : _d.categoryIcon) || "📝",
      ["category-name"]: (_e = $data.aiRecognizedResult) == null ? void 0 : _e.categoryName,
      size: 16,
      color: "#FFFFFF"
    }),
    az: ((_f = $data.aiRecognizedResult) == null ? void 0 : _f.categoryColor) || "#AA96DA",
    aA: common_vendor.t((_g = $data.aiRecognizedResult) == null ? void 0 : _g.categoryName),
    aB: (_h = $data.aiRecognizedResult) == null ? void 0 : _h.remark
  }, ((_i = $data.aiRecognizedResult) == null ? void 0 : _i.remark) ? {
    aC: common_vendor.t($data.aiRecognizedResult.remark)
  } : {}, {
    aD: (_j = $data.aiRecognizedResult) == null ? void 0 : _j.transactionDate
  }, ((_k = $data.aiRecognizedResult) == null ? void 0 : _k.transactionDate) ? {
    aE: common_vendor.t($options.formatDate($data.aiRecognizedResult.transactionDate))
  } : {}, {
    aF: common_vendor.o(($event) => $data.showAiConfirmDialog = false, "0e"),
    aG: $data.saving,
    aH: common_vendor.t($data.saving ? "提交中..." : "确认"),
    aI: common_vendor.o((...args) => $options.confirmAiResult && $options.confirmAiResult(...args), "bb"),
    aJ: $data.saving,
    aK: $data.saving,
    aL: common_vendor.o(() => {
    }, "11"),
    aM: common_vendor.o(($event) => $data.showAiConfirmDialog = false, "bc")
  }) : {}, {
    aN: $data.showVoiceDialog
  }, $data.showVoiceDialog ? {
    aO: common_vendor.o($options.showVoiceSettings, "43"),
    aP: common_vendor.p({
      name: "gear",
      size: 20,
      color: "#666666"
    }),
    aQ: common_vendor.o($options.showVoiceHelp, "04"),
    aR: common_vendor.p({
      name: "help",
      size: 20,
      color: "#666666"
    }),
    aS: common_vendor.o((...args) => $options.closeVoiceDialog && $options.closeVoiceDialog(...args), "58"),
    aT: common_vendor.f(5, (n, k0, i0) => {
      return {
        a: n,
        b: (n - 1) * 0.15 + "s"
      };
    }),
    aU: common_vendor.o((...args) => $options.stopRecording && $options.stopRecording(...args), "61"),
    aV: common_vendor.o(() => {
    }, "69"),
    aW: common_vendor.o((...args) => $options.closeVoiceDialog && $options.closeVoiceDialog(...args), "71")
  } : {}, {
    aX: $data.showCategoryDrawer
  }, $data.showCategoryDrawer ? common_vendor.e({
    aY: common_vendor.f($data.categories, (parent, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(parent.name),
        b: parent.children && parent.children.length
      }, parent.children && parent.children.length ? {
        c: common_vendor.f(parent.children, (child, k1, i1) => {
          return {
            a: "5dbf22a8-14-" + i0 + "-" + i1,
            b: common_vendor.p({
              icon: child.icon || "📝",
              ["category-name"]: child.name,
              size: 22,
              color: $options.isDrawerCategorySelected(child.id) ? "#333333" : "#666666"
            }),
            c: common_vendor.t(child.name),
            d: child.id,
            e: $options.isDrawerCategorySelected(child.id) ? 1 : "",
            f: common_vendor.o(($event) => $options.selectDrawerCategory({
              category: child,
              parent
            }), child.id)
          };
        })
      } : {
        d: "5dbf22a8-15-" + i0,
        e: common_vendor.p({
          icon: parent.icon || "📝",
          ["category-name"]: parent.name,
          size: 22,
          color: $options.isDrawerCategorySelected(parent.id) ? "#333333" : "#666666"
        }),
        f: common_vendor.t(parent.name),
        g: $options.isDrawerCategorySelected(parent.id) ? 1 : "",
        h: common_vendor.o(($event) => $options.selectDrawerCategory({
          category: parent,
          parent
        }), parent.id)
      }, {
        i: parent.id
      });
    }),
    aZ: $options.canManageBookCategories
  }, $options.canManageBookCategories ? {
    ba: common_vendor.o((...args) => $options.openCustomCategoryDrawer && $options.openCustomCategoryDrawer(...args), "ec")
  } : {}, {
    bb: $data.drawerSelectedCategoryId != null ? 1 : "",
    bc: common_vendor.o((...args) => $options.confirmDrawerCategory && $options.confirmDrawerCategory(...args), "08"),
    bd: common_vendor.o(() => {
    }, "45"),
    be: common_vendor.o((...args) => $options.closeCategoryDrawer && $options.closeCategoryDrawer(...args), "af")
  }) : {}, {
    bf: $data.showCustomCategoryDrawer
  }, $data.showCustomCategoryDrawer ? common_vendor.e({
    bg: common_vendor.o((...args) => $options.closeCustomCategoryDrawer && $options.closeCustomCategoryDrawer(...args), "92"),
    bh: $data.manageCategoryLoading
  }, $data.manageCategoryLoading ? {} : {
    bi: common_vendor.f($data.manageCategoryList, (item, index, i0) => {
      return common_vendor.e({
        a: index === 0 ? 1 : "",
        b: common_vendor.o(($event) => $options.moveManageCategory(index, -1), item.id),
        c: index === $data.manageCategoryList.length - 1 ? 1 : "",
        d: common_vendor.o(($event) => $options.moveManageCategory(index, 1), item.id),
        e: "5dbf22a8-16-" + i0,
        f: common_vendor.p({
          icon: item.icon || "📝",
          ["category-name"]: item.name,
          size: 18,
          color: "#FFFFFF"
        }),
        g: item.color || "#F5F5F5",
        h: common_vendor.t(item.name),
        i: common_vendor.t(item.parentName || "分类"),
        j: common_vendor.t(item.isUserCustom ? " · 自定义" : ""),
        k: !item.isUsed
      }, !item.isUsed ? {
        l: common_vendor.o(($event) => $options.confirmDeleteManageCategory(item), item.id)
      } : {}, {
        m: item.id
      });
    })
  }, {
    bj: common_vendor.o((...args) => $options.openCustomCategoryForm && $options.openCustomCategoryForm(...args), "ea"),
    bk: common_vendor.o((...args) => $options.closeCustomCategoryDrawer && $options.closeCustomCategoryDrawer(...args), "a6"),
    bl: common_vendor.o(() => {
    }, "d8"),
    bm: common_vendor.o((...args) => $options.closeCustomCategoryDrawer && $options.closeCustomCategoryDrawer(...args), "31")
  }) : {}, {
    bn: $data.showCustomCategoryForm
  }, $data.showCustomCategoryForm ? {
    bo: common_vendor.o((...args) => $options.closeCustomCategoryForm && $options.closeCustomCategoryForm(...args), "05"),
    bp: $data.customCategoryForm.name,
    bq: common_vendor.o(($event) => $data.customCategoryForm.name = $event.detail.value, "c3"),
    br: $data.customCategoryForm.icon,
    bs: common_vendor.o(($event) => $data.customCategoryForm.icon = $event.detail.value, "c9"),
    bt: $data.customCategoryForm.color,
    bv: common_vendor.o(($event) => $data.customCategoryForm.color = $event.detail.value, "1a"),
    bw: common_vendor.o((...args) => $options.closeCustomCategoryForm && $options.closeCustomCategoryForm(...args), "39"),
    bx: common_vendor.o((...args) => $options.submitCustomCategoryForm && $options.submitCustomCategoryForm(...args), "d3"),
    by: $data.customCategorySaving,
    bz: common_vendor.o(() => {
    }, "aa"),
    bA: common_vendor.o((...args) => $options.closeCustomCategoryForm && $options.closeCustomCategoryForm(...args), "6b")
  } : {}, {
    bB: $data.showBookPicker
  }, $data.showBookPicker ? {
    bC: common_vendor.o(($event) => $data.showBookPicker = false, "24"),
    bD: common_vendor.f($data.bookPickerOptions, (book, k0, i0) => {
      return {
        a: common_vendor.t(book.name),
        b: common_vendor.t(book.type === 1 ? "一起记" : "个人"),
        c: `${book.type}-${book.id}`,
        d: $options.isSameBook($options.displayAccountBook, book) ? 1 : "",
        e: common_vendor.o(($event) => $options.selectBookFromPicker(book), `${book.type}-${book.id}`)
      };
    }),
    bE: common_vendor.o(() => {
    }, "e1"),
    bF: common_vendor.o(($event) => $data.showBookPicker = false, "e5")
  } : {}, {
    bG: $data.showChannelDialog
  }, $data.showChannelDialog ? {
    bH: common_vendor.f($data.spendingChannels, (channel, k0, i0) => {
      return {
        a: common_vendor.t(channel.icon),
        b: $data.tempSpendingChannel === channel.value ? 1 : "",
        c: common_vendor.s($options.getChannelPickerIconStyle(channel, $data.tempSpendingChannel === channel.value)),
        d: common_vendor.t(channel.name),
        e: channel.value,
        f: $data.tempSpendingChannel === channel.value ? 1 : "",
        g: common_vendor.o(($event) => $data.tempSpendingChannel = channel.value, channel.value)
      };
    }),
    bI: common_vendor.o((...args) => $options.confirmSpendingChannel && $options.confirmSpendingChannel(...args), "1a"),
    bJ: common_vendor.o(() => {
    }, "7e"),
    bK: common_vendor.o((...args) => $options.closeChannelDialog && $options.closeChannelDialog(...args), "3d")
  } : {}, {
    bL: $data.showRemarkDialog
  }, $data.showRemarkDialog ? {
    bM: common_vendor.o((...args) => $options.closeRemarkDialog && $options.closeRemarkDialog(...args), "5b"),
    bN: $data.tempRemark,
    bO: common_vendor.o(($event) => $data.tempRemark = $event.detail.value, "d2"),
    bP: common_vendor.o((...args) => $options.closeRemarkDialog && $options.closeRemarkDialog(...args), "57"),
    bQ: common_vendor.o((...args) => $options.confirmRemark && $options.confirmRemark(...args), "62"),
    bR: common_vendor.o(() => {
    }, "63"),
    bS: common_vendor.o((...args) => $options.closeRemarkDialog && $options.closeRemarkDialog(...args), "6b")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5dbf22a8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/add-transaction/add-transaction.js.map
