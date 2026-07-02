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
      showEndConfirmDialog: false,
      showDeleteConfirmDialog: false,
      shareCode: "",
      joining: false,
      ending: false,
      deleting: false,
      endTargetBook: null,
      deleteTargetBook: null,
      deleteBookType: 0,
      // 0-个人账本，1-一起账本
      currentShareBook: null
      // 当前要分享的账本
    };
  },
  computed: {
    ...common_vendor.mapState(["currentAccountBook", "userInfo"]),
    // 按状态筛选后的个人账本：全部/进行中/已结束
    displayedPersonalBooks() {
      const list = this.personalAccountBooks || [];
      if (this.statusTab === "all")
        return list;
      if (this.statusTab === "active")
        return list.filter((b) => b.status !== 1);
      return list.filter((b) => b.status === 1);
    },
    // 按状态筛选后的一起账本
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
        title: `邀请你加入一起账本：${this.currentShareBook.name}`,
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
    ...common_vendor.mapActions(["setCurrentAccountBook", "updateAccountBooks", "setCurrentSharedAccountBook"]),
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
          common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:339", "加载一起账本失败", error);
        }
        this.sharedAccountBooks = sharedBooks;
        this.updateAccountBooks(personalBooks);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:346", "加载账本失败", error);
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
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:447", "加入失败", error);
        common_vendor.index.showToast({
          title: error.message || "加入失败",
          icon: "none"
        });
      } finally {
        this.joining = false;
      }
    },
    getSharedBookCreatorId(book) {
      if (!book)
        return null;
      return book.creatorId ?? book.userId ?? null;
    },
    isSharedBookCreator(book) {
      var _a;
      const creatorId = this.getSharedBookCreatorId(book);
      const userId = (_a = this.userInfo) == null ? void 0 : _a.id;
      if (creatorId == null || userId == null)
        return false;
      return String(creatorId) === String(userId);
    },
    canEndSharedBook(book) {
      return !!(book && book.status !== 1 && this.isSharedBookCreator(book));
    },
    showEndDialog(book) {
      if (!this.canEndSharedBook(book)) {
        common_vendor.index.showToast({
          title: "仅创建者可结束账本",
          icon: "none"
        });
        return;
      }
      this.endTargetBook = book;
      this.showEndConfirmDialog = true;
    },
    async confirmEndBook() {
      var _a, _b, _c;
      if (!this.endTargetBook)
        return;
      if (!this.canEndSharedBook(this.endTargetBook)) {
        common_vendor.index.showToast({
          title: "仅创建者可结束账本",
          icon: "none"
        });
        this.showEndConfirmDialog = false;
        this.endTargetBook = null;
        return;
      }
      this.ending = true;
      try {
        const book = this.endTargetBook;
        await utils_api.api.sharedAccountBooks.update(book.id, {
          name: book.name,
          description: book.description || null,
          budget: book.budget ?? null,
          startDate: book.startDate || null,
          endDate: book.endDate || null,
          status: 1
        });
        if (((_a = this.currentAccountBook) == null ? void 0 : _a.id) === book.id && ((_b = this.currentAccountBook) == null ? void 0 : _b.type) === 1) {
          await this.setCurrentAccountBook(null);
        }
        if (((_c = this.$store.state.currentSharedAccountBook) == null ? void 0 : _c.id) === book.id) {
          this.setCurrentSharedAccountBook(null);
        }
        common_vendor.index.showToast({
          title: "账本已结束",
          icon: "success"
        });
        this.showEndConfirmDialog = false;
        this.endTargetBook = null;
        await this.loadAccountBooks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:526", "结束账本失败", error);
        common_vendor.index.showToast({
          title: error.message || "结束失败",
          icon: "none"
        });
      } finally {
        this.ending = false;
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
        common_vendor.index.__f__("error", "at pages/account-books/account-books.vue:573", "删除失败", error);
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
  var _a, _b;
  return common_vendor.e({
    a: $data.accountBookTab === "personal" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchAccountBookTab("personal"), "5e"),
    c: $data.accountBookTab === "shared" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchAccountBookTab("shared"), "b4"),
    e: $data.statusTab === "all" ? 1 : "",
    f: common_vendor.o(($event) => $data.statusTab = "all", "02"),
    g: $data.statusTab === "active" ? 1 : "",
    h: common_vendor.o(($event) => $data.statusTab = "active", "d9"),
    i: $data.statusTab === "ended" ? 1 : "",
    j: common_vendor.o(($event) => $data.statusTab = "ended", "06"),
    k: $data.accountBookTab === "personal"
  }, $data.accountBookTab === "personal" ? common_vendor.e({
    l: $options.displayedPersonalBooks.length > 0
  }, $options.displayedPersonalBooks.length > 0 ? {
    m: common_vendor.f($options.displayedPersonalBooks, (book, k0, i0) => {
      var _a2, _b2, _c, _d, _e, _f;
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
        g: ((_a2 = _ctx.currentAccountBook) == null ? void 0 : _a2.id) === book.id && ((_b2 = _ctx.currentAccountBook) == null ? void 0 : _b2.type) === 0
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
    n: common_vendor.t($data.statusTab === "all" ? "还没有个人账本" : $data.statusTab === "active" ? "还没有进行中的个人账本" : "还没有已结束的个人账本"),
    o: common_vendor.t($data.statusTab === "all" || $data.statusTab === "active" ? "点击上方「创建账本」开始使用" : "已结束的账本将显示在此")
  }) : {}, {
    p: $data.accountBookTab === "shared"
  }, $data.accountBookTab === "shared" ? common_vendor.e({
    q: $options.displayedSharedBooks.length > 0
  }, $options.displayedSharedBooks.length > 0 ? {
    r: common_vendor.f($options.displayedSharedBooks, (book, k0, i0) => {
      var _a2, _b2, _c, _d, _e, _f;
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
        g: ((_a2 = _ctx.currentAccountBook) == null ? void 0 : _a2.id) === book.id && ((_b2 = _ctx.currentAccountBook) == null ? void 0 : _b2.type) === 1
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
        o: book.status !== 1 && $options.canEndSharedBook(book)
      }, book.status !== 1 && $options.canEndSharedBook(book) ? {
        p: common_vendor.o(($event) => $options.showEndDialog(book), book.id)
      } : {}, {
        q: common_vendor.o(($event) => $options.showDeleteDialog(book, 1), book.id),
        r: common_vendor.o(($event) => $options.copyShareCode(book), book.id),
        s: book,
        t: common_vendor.o(($event) => $options.setShareBook(book), book.id),
        v: book.id,
        w: ((_e = _ctx.currentAccountBook) == null ? void 0 : _e.id) === book.id && ((_f = _ctx.currentAccountBook) == null ? void 0 : _f.type) === 1 ? 1 : "",
        x: common_vendor.s($options.getBookCardTintStyle(book.category)),
        y: common_vendor.o(($event) => $options.viewSharedAccountBook(book), book.id)
      });
    })
  } : {
    s: common_vendor.t($data.statusTab === "all" ? "还没有一起账本" : $data.statusTab === "active" ? "还没有进行中的一起账本" : "还没有已结束的一起账本"),
    t: common_vendor.t($data.statusTab === "all" || $data.statusTab === "active" ? "点击上方「创建账本」或「加入账本」" : "已结束的一起账本将显示在此")
  }) : {}, {
    v: $data.showEndConfirmDialog
  }, $data.showEndConfirmDialog ? {
    w: common_vendor.o(($event) => $data.showEndConfirmDialog = false, "0c"),
    x: common_vendor.t((_a = $data.endTargetBook) == null ? void 0 : _a.name),
    y: common_vendor.o(($event) => $data.showEndConfirmDialog = false, "5a"),
    z: common_vendor.o((...args) => $options.confirmEndBook && $options.confirmEndBook(...args), "49"),
    A: $data.ending,
    B: common_vendor.o(() => {
    }, "2c"),
    C: common_vendor.o(($event) => $data.showEndConfirmDialog = false, "f1")
  } : {}, {
    D: $data.showDeleteConfirmDialog
  }, $data.showDeleteConfirmDialog ? {
    E: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "bf"),
    F: common_vendor.t((_b = $data.deleteTargetBook) == null ? void 0 : _b.name),
    G: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "6c"),
    H: common_vendor.o((...args) => $options.confirmDelete && $options.confirmDelete(...args), "8f"),
    I: $data.deleting,
    J: common_vendor.o(() => {
    }, "21"),
    K: common_vendor.o(($event) => $data.showDeleteConfirmDialog = false, "ec")
  } : {}, {
    L: $data.showJoinDialog
  }, $data.showJoinDialog ? {
    M: common_vendor.o(($event) => $data.showJoinDialog = false, "51"),
    N: $data.shareCode,
    O: common_vendor.o(($event) => $data.shareCode = $event.detail.value, "8b"),
    P: common_vendor.o(($event) => $data.showJoinDialog = false, "f1"),
    Q: common_vendor.o((...args) => $options.joinSharedAccountBook && $options.joinSharedAccountBook(...args), "57"),
    R: $data.joining,
    S: common_vendor.o(() => {
    }, "c6"),
    T: common_vendor.o(($event) => $data.showJoinDialog = false, "1f")
  } : {}, {
    U: common_vendor.o((...args) => $options.goToCreateAccountBook && $options.goToCreateAccountBook(...args), "48"),
    V: common_vendor.p({
      current: 1
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a90a7920"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/account-books/account-books.js.map
