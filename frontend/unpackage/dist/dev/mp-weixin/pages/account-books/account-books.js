"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const utils_tabBar = require("../../utils/tabBar.js");
const utils_auth = require("../../utils/auth.js");
const utils_iconMap = require("../../utils/iconMap.js");
const _sfc_main = {
  data() {
    return {
      accountBookTab: "personal",
      // 'personal' | 'shared' 选项卡
      statusTab: "active",
      // 'all' 全部 | 'active' 进行中 | 'ended' 已结束，默认进行中
      personalAccountBooks: [],
      sharedAccountBooks: [],
      showJoinDialog: false,
      showDeleteConfirmDialog: false,
      shareCode: "",
      joining: false,
      deleting: false,
      deleteTargetBook: null,
      deleteBookType: 0,
      // 0-个人账本，1-集体账本
      currentShareBook: null
      // 当前要分享的账本
    };
  },
  computed: {
    ...common_vendor.mapState(["currentAccountBook"]),
    // 按状态筛选后的个人账本：全部/进行中/已结束
    displayedPersonalBooks() {
      const list = this.personalAccountBooks || [];
      if (this.statusTab === "all")
        return list;
      if (this.statusTab === "active")
        return list.filter((b) => b.status !== 1);
      return list.filter((b) => b.status === 1);
    },
    // 按状态筛选后的集体账本
    displayedSharedBooks() {
      const list = this.sharedAccountBooks || [];
      if (this.statusTab === "all")
        return list;
      if (this.statusTab === "active")
        return list.filter((b) => b.status !== 1);
      return list.filter((b) => b.status === 1);
    }
  },
  onLoad() {
    const savedTab = common_vendor.index.getStorageSync("accountBookTab");
    if (savedTab === "personal" || savedTab === "shared") {
      this.accountBookTab = savedTab;
    }
    this.loadAccountBooks();
  },
  onShow() {
    utils_tabBar.hideNativeTabBar();
    this.loadAccountBooks();
  },
  // 微信小程序分享功能
  onShareAppMessage() {
    var _a;
    if ((_a = this.currentShareBook) == null ? void 0 : _a.shareCode) {
      return {
        title: `邀请你加入集体账本：${this.currentShareBook.name}`,
        path: `/pages/join-account-book/join-account-book?shareCode=${this.currentShareBook.shareCode}`,
        imageUrl: "/static/invite.jpg"
      };
    }
    return {
      title: "乌鸦记账 - 简单好用的记账工具",
      path: "/pages/index/index"
    };
  },
  methods: {
    ...common_vendor.mapActions(["setCurrentAccountBook", "updateAccountBooks"]),
    formatDate: utils_util.formatDate,
    getBookCategoryEmoji: utils_iconMap.getBookCategoryEmoji,
    getBookCategoryBadgeStyle: utils_iconMap.getBookCategoryBadgeStyle,
    getBookCardTintStyle: utils_iconMap.getBookCardTintStyle,
    switchAccountBookTab(tab) {
      this.accountBookTab = tab;
      common_vendor.index.setStorageSync("accountBookTab", tab);
    },
    async loadAccountBooks() {
      if (this.$store.state.isGuestMode || !this.$store.state.token) {
        this.personalAccountBooks = [];
        this.sharedAccountBooks = [];
        return;
      }
      try {
        const personalBooks = await utils_api.api.accountBooks.getList();
        this.personalAccountBooks = personalBooks;
        let sharedBooks = [];
        try {
          sharedBooks = await utils_api.api.sharedAccountBooks.getList();
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:315", "加载集体账本失败", error);
        }
        this.sharedAccountBooks = sharedBooks;
        this.updateAccountBooks(personalBooks);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:322", "加载账本失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    async selectAccountBook(book) {
      const accountBook = { ...book, type: 0 };
      await this.setCurrentAccountBook(accountBook);
      common_vendor.index.showToast({
        title: "切换成功",
        icon: "success"
      });
      setTimeout(() => {
        common_vendor.index.switchTab({
          url: "/pages/index/index"
        });
      }, 500);
    },
    viewAccountBook(book, type) {
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}&type=${type}`
      });
    },
    viewSharedAccountBook(book) {
      this.viewAccountBook(book, 1);
    },
    // 设置要分享的账本
    setShareBook(book) {
      this.currentShareBook = book;
    },
    // 复制分享码
    copyShareCode(book) {
      if (!book.shareCode) {
        common_vendor.index.showToast({
          title: "分享码不存在",
          icon: "none"
        });
        return;
      }
      common_vendor.index.setClipboardData({
        data: book.shareCode,
        success: () => {
          common_vendor.index.showToast({
            title: "分享码已复制",
            icon: "success"
          });
        }
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
    async joinSharedAccountBook() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      if (!this.shareCode.trim()) {
        common_vendor.index.showToast({
          title: "请输入分享码",
          icon: "none"
        });
        return;
      }
      this.joining = true;
      try {
        await utils_api.api.sharedAccountBooks.join({
          shareCode: this.shareCode.trim().toUpperCase()
        });
        common_vendor.index.showToast({
          title: "加入成功",
          icon: "success"
        });
        this.showJoinDialog = false;
        this.shareCode = "";
        await this.loadAccountBooks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:423", "加入失败", error);
        common_vendor.index.showToast({
          title: error.message || "加入失败",
          icon: "none"
        });
      } finally {
        this.joining = false;
      }
    },
    showDeleteDialog(book, type) {
      this.deleteTargetBook = book;
      this.deleteBookType = type;
      this.showDeleteConfirmDialog = true;
    },
    async confirmDelete() {
      var _a;
      if (!this.deleteTargetBook)
        return;
      this.deleting = true;
      try {
        if (this.deleteBookType === 0) {
          await utils_api.api.accountBooks.delete(this.deleteTargetBook.id);
        } else {
          await utils_api.api.sharedAccountBooks.delete(this.deleteTargetBook.id);
        }
        if (((_a = this.currentAccountBook) == null ? void 0 : _a.id) === this.deleteTargetBook.id) {
          await this.setCurrentAccountBook(null);
        }
        common_vendor.index.showToast({
          title: "删除成功",
          icon: "success"
        });
        this.showDeleteConfirmDialog = false;
        this.deleteTargetBook = null;
        await this.loadAccountBooks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:470", "删除失败", error);
        common_vendor.index.showToast({
          title: error.message || "删除失败",
          icon: "none"
        });
      } finally {
        this.deleting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  const _easycom_app_tab_bar2 = common_vendor.resolveComponent("app-tab-bar");
  (_easycom_app_icon2 + _easycom_app_tab_bar2)();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
const _easycom_app_tab_bar = () => "../../components/app-tab-bar/app-tab-bar.js";
if (!Math) {
  (_easycom_app_icon + _easycom_app_tab_bar)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a;
  return common_vendor.e({
    a: $data.accountBookTab === "personal" ? 1 : "",
    b: $data.accountBookTab === "personal" ? 1 : "",
    c: common_vendor.o(($event) => $options.switchAccountBookTab("personal"), "b8"),
    d: $data.accountBookTab === "shared" ? 1 : "",
    e: $data.accountBookTab === "shared" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchAccountBookTab("shared"), "15"),
    g: $data.statusTab === "all" ? 1 : "",
    h: $data.statusTab === "all" ? 1 : "",
    i: common_vendor.o(($event) => $data.statusTab = "all", "5c"),
    j: $data.statusTab === "active" ? 1 : "",
    k: $data.statusTab === "active" ? 1 : "",
    l: common_vendor.o(($event) => $data.statusTab = "active", "81"),
    m: $data.statusTab === "ended" ? 1 : "",
    n: $data.statusTab === "ended" ? 1 : "",
    o: common_vendor.o(($event) => $data.statusTab = "ended", "cf"),
    p: $data.accountBookTab === "personal"
  }, $data.accountBookTab === "personal" ? common_vendor.e({
    q: $options.displayedPersonalBooks.length > 0
  }, $options.displayedPersonalBooks.length > 0 ? {
    r: common_vendor.f($options.displayedPersonalBooks, (book, k0, i0) => {
      var _a2, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: "a90a7920-0-" + i0,
        b: common_vendor.p({
          icon: $options.getBookCategoryEmoji(book.category),
          ["category-name"]: book.categoryName,
          size: "22rpx",
          color: "#FFFFFF"
        }),
        c: common_vendor.t(book.name),
        d: common_vendor.t(book.categoryName || "日常消费"),
        e: common_vendor.s($options.getBookCategoryBadgeStyle(book.category)),
        f: book.isDefault
      }, book.isDefault ? {} : {}, {
        g: ((_a2 = _ctx.currentAccountBook) == null ? void 0 : _a2.id) === book.id && ((_b = _ctx.currentAccountBook) == null ? void 0 : _b.type) === 0
      }, ((_c = _ctx.currentAccountBook) == null ? void 0 : _c.id) === book.id && ((_d = _ctx.currentAccountBook) == null ? void 0 : _d.type) === 0 ? {} : {}, {
        h: common_vendor.t(book.description || "暂无描述"),
        i: common_vendor.t($options.formatDate(book.createdAt)),
        j: common_vendor.o(($event) => $options.showDeleteDialog(book, 0), book.id),
        k: book.id,
        l: ((_e = _ctx.currentAccountBook) == null ? void 0 : _e.id) === book.id && ((_f = _ctx.currentAccountBook) == null ? void 0 : _f.type) === 0 ? 1 : "",
        m: common_vendor.s($options.getBookCardTintStyle(book.category)),
        n: common_vendor.o(($event) => $options.viewAccountBook(book, 0), book.id)
      });
    })
  } : {
    s: common_vendor.t($data.statusTab === "all" ? "还没有个人账本" : $data.statusTab === "active" ? "还没有进行中的个人账本" : "还没有已结束的个人账本"),
    t: common_vendor.t($data.statusTab === "all" || $data.statusTab === "active" ? "点击上方「创建账本」开始使用" : "已结束的账本将显示在此")
  }) : {}, {
    v: $data.accountBookTab === "shared"
  }, $data.accountBookTab === "shared" ? common_vendor.e({
    w: $options.displayedSharedBooks.length > 0
  }, $options.displayedSharedBooks.length > 0 ? {
    x: common_vendor.f($options.displayedSharedBooks, (book, k0, i0) => {
      var _a2, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: "a90a7920-1-" + i0,
        b: common_vendor.p({
          icon: $options.getBookCategoryEmoji(book.category),
          ["category-name"]: book.categoryName,
          size: "22rpx",
          color: "#FFFFFF"
        }),
        c: common_vendor.t(book.name),
        d: common_vendor.t(book.categoryName || "日常消费"),
        e: common_vendor.s($options.getBookCategoryBadgeStyle(book.category)),
        f: book.status === 1
      }, book.status === 1 ? {} : {}, {
        g: ((_a2 = _ctx.currentAccountBook) == null ? void 0 : _a2.id) === book.id && ((_b = _ctx.currentAccountBook) == null ? void 0 : _b.type) === 1
      }, ((_c = _ctx.currentAccountBook) == null ? void 0 : _c.id) === book.id && ((_d = _ctx.currentAccountBook) == null ? void 0 : _d.type) === 1 ? {} : {}, {
        h: common_vendor.t(book.description || "暂无描述"),
        i: common_vendor.t(book.creatorName),
        j: common_vendor.t(book.memberCount),
        k: book.budget
      }, book.budget ? {
        l: common_vendor.t(book.budget.toFixed(2))
      } : {}, {
        m: common_vendor.t(book.shareCode),
        n: common_vendor.t($options.formatDate(book.createdAt)),
        o: common_vendor.o(($event) => $options.showDeleteDialog(book, 1), book.id),
        p: common_vendor.o(($event) => $options.copyShareCode(book), book.id),
        q: book,
        r: common_vendor.o(($event) => $options.setShareBook(book), book.id),
        s: book.id,
        t: ((_e = _ctx.currentAccountBook) == null ? void 0 : _e.id) === book.id && ((_f = _ctx.currentAccountBook) == null ? void 0 : _f.type) === 1 ? 1 : "",
        v: common_vendor.s($options.getBookCardTintStyle(book.category)),
        w: common_vendor.o(($event) => $options.viewSharedAccountBook(book), book.id)
      });
    })
  } : {
    y: common_vendor.t($data.statusTab === "all" ? "还没有集体账本" : $data.statusTab === "active" ? "还没有进行中的集体账本" : "还没有已结束的集体账本"),
    z: common_vendor.t($data.statusTab === "all" || $data.statusTab === "active" ? "点击上方「创建账本」或「加入账本」" : "已结束的集体账本将显示在此")
  }) : {}, {
    A: $data.showDeleteConfirmDialog
  }, $data.showDeleteConfirmDialog ? {
    B: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "0a"),
    C: common_vendor.t((_a = $data.deleteTargetBook) == null ? void 0 : _a.name),
    D: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "45"),
    E: common_vendor.o((...args) => $options.confirmDelete && $options.confirmDelete(...args), "6d"),
    F: $data.deleting,
    G: common_vendor.o(() => {
    }, "d6"),
    H: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "fc")
  } : {}, {
    I: $data.showJoinDialog
  }, $data.showJoinDialog ? {
    J: common_vendor.o(($event) => $data.showJoinDialog = false, "b3"),
    K: $data.shareCode,
    L: common_vendor.o(($event) => $data.shareCode = $event.detail.value, "d8"),
    M: common_vendor.o(($event) => $data.showJoinDialog = false, "74"),
    N: common_vendor.o((...args) => $options.joinSharedAccountBook && $options.joinSharedAccountBook(...args), "e5"),
    O: $data.joining,
    P: common_vendor.o(() => {
    }, "0f"),
    Q: common_vendor.o(($event) => $data.showJoinDialog = false, "b0")
  } : {}, {
    R: common_vendor.o((...args) => $options.goToCreateAccountBook && $options.goToCreateAccountBook(...args), "4e"),
    S: common_vendor.p({
      current: 1
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a90a7920"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/account-books/account-books.js.map
