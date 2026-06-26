"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_tabBar = require("../../utils/tabBar.js");
const utils_auth = require("../../utils/auth.js");
const _sfc_main = {
  data() {
    return {
      isAdmin: false,
      showLoginSheet: false,
      loginLoading: false
    };
  },
  computed: {
    ...common_vendor.mapState(["userInfo", "isGuestMode"])
  },
  onShow() {
    utils_tabBar.hideNativeTabBar();
    this.checkAdmin();
  },
  // 微信分享功能
  onShareAppMessage() {
    return {
      title: "乌鸦爱记账 - 简单好用的记账工具",
      path: "/pages/index/index",
      imageUrl: "/static/share-image.png"
      // 可选：分享图片
    };
  },
  methods: {
    ...common_vendor.mapActions(["login", "logout"]),
    goToEdit() {
      if (!utils_auth.requireWechatLogin()) {
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/profile/edit"
      });
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
    goToStatistics() {
      common_vendor.index.switchTab({
        url: "/pages/statistics/statistics"
      });
    },
    goToCurrencySettings() {
      common_vendor.index.navigateTo({
        url: "/pages/currency-settings/currency-settings"
      });
    },
    goToCategoryAdmin() {
      common_vendor.index.navigateTo({
        url: "/pages/category-admin/category-admin"
      });
    },
    goToPaymentMethodAdmin() {
      common_vendor.index.navigateTo({
        url: "/pages/payment-method-admin/payment-method-admin"
      });
    },
    goToBookPurposeCategoryAdmin() {
      common_vendor.index.navigateTo({
        url: "/pages/book-purpose-category-admin/book-purpose-category-admin"
      });
    },
    goToFeedback() {
      common_vendor.index.navigateTo({
        url: "/pages/feedback/feedback"
      });
    },
    goToFeedbackAdmin() {
      common_vendor.index.navigateTo({
        url: "/pages/feedback-admin/feedback-admin"
      });
    },
    async checkAdmin() {
      if (this.isGuestMode || !this.$store.state.token) {
        this.isAdmin = false;
        return;
      }
      try {
        const result = await utils_api.api.feedbacks.checkAdmin();
        this.isAdmin = result === true;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:199", "检查管理员权限失败:", error);
        this.isAdmin = false;
      }
    },
    showAbout() {
      common_vendor.index.showModal({
        title: "关于我们",
        content: "乌鸦爱记账 v1.0.0\n\n一款简单易用的记账工具，帮助您记录生活的每一笔。",
        showCancel: false
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            this.logout();
          }
        }
      });
    },
    openLoginSheet() {
      this.showLoginSheet = true;
    },
    closeLoginSheet() {
      if (this.loginLoading)
        return;
      this.showLoginSheet = false;
    },
    async handleWeChatLogin() {
      if (this.loginLoading)
        return;
      this.loginLoading = true;
      try {
        const loginRes = await new Promise((resolve, reject) => {
          common_vendor.index.login({
            provider: "weixin",
            success: resolve,
            fail: reject
          });
        });
        if (!loginRes.code) {
          common_vendor.index.showToast({ title: "获取登录凭证失败", icon: "none" });
          return;
        }
        const result = await utils_api.api.auth.wechatLogin({
          code: loginRes.code,
          userInfo: null
        });
        await this.login({
          token: result.token,
          userInfo: result.userInfo
        });
        this.$store.dispatch("setGuestMode", false);
        this.showLoginSheet = false;
        await this.checkAdmin();
        common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:265", "登录失败", error);
        common_vendor.index.showToast({
          title: error.message || "登录失败，请重试",
          icon: "none"
        });
      } finally {
        this.loginLoading = false;
      }
    },
    goToLogin() {
      this.openLoginSheet();
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
  var _a, _b, _c, _d;
  return common_vendor.e({
    a: ((_a = _ctx.userInfo) == null ? void 0 : _a.avatarUrl) || "/static/default-avatar.png",
    b: common_vendor.t(((_b = _ctx.userInfo) == null ? void 0 : _b.nickName) || (_ctx.isGuestMode ? "访客" : "未设置昵称")),
    c: (_c = _ctx.userInfo) == null ? void 0 : _c.phoneNumber
  }, ((_d = _ctx.userInfo) == null ? void 0 : _d.phoneNumber) ? {
    d: common_vendor.t(_ctx.userInfo.phoneNumber)
  } : {}, {
    e: !_ctx.isGuestMode
  }, !_ctx.isGuestMode ? {
    f: common_vendor.p({
      name: "compose",
      size: 14,
      color: "rgba(255,255,255,0.95)"
    })
  } : {}, {
    g: common_vendor.o((...args) => $options.goToEdit && $options.goToEdit(...args), "e2"),
    h: $data.isAdmin
  }, $data.isAdmin ? {
    i: common_vendor.p({
      name: "wallet",
      size: 22,
      color: "#F5A623"
    }),
    j: common_vendor.o((...args) => $options.goToCurrencySettings && $options.goToCurrencySettings(...args), "36")
  } : {}, {
    k: $data.isAdmin
  }, $data.isAdmin ? {
    l: common_vendor.p({
      name: "list",
      size: 22,
      color: "#F5A623"
    }),
    m: common_vendor.o((...args) => $options.goToCategoryAdmin && $options.goToCategoryAdmin(...args), "7e")
  } : {}, {
    n: $data.isAdmin
  }, $data.isAdmin ? {
    o: common_vendor.p({
      name: "wallet",
      size: 22,
      color: "#F5A623"
    }),
    p: common_vendor.o((...args) => $options.goToPaymentMethodAdmin && $options.goToPaymentMethodAdmin(...args), "0f")
  } : {}, {
    q: $data.isAdmin
  }, $data.isAdmin ? {
    r: common_vendor.p({
      name: "link",
      size: 22,
      color: "#F5A623"
    }),
    s: common_vendor.o((...args) => $options.goToBookPurposeCategoryAdmin && $options.goToBookPurposeCategoryAdmin(...args), "7a")
  } : {}, {
    t: common_vendor.p({
      name: "chatbubble",
      size: 22,
      color: "#F5A623"
    }),
    v: common_vendor.o((...args) => $options.goToFeedback && $options.goToFeedback(...args), "81"),
    w: $data.isAdmin
  }, $data.isAdmin ? {
    x: common_vendor.p({
      name: "gear",
      size: 22,
      color: "#F5A623"
    }),
    y: common_vendor.o((...args) => $options.goToFeedbackAdmin && $options.goToFeedbackAdmin(...args), "2d")
  } : {}, {
    z: common_vendor.p({
      name: "info",
      size: 22,
      color: "#F5A623"
    }),
    A: common_vendor.o((...args) => $options.showAbout && $options.showAbout(...args), "ab"),
    B: common_vendor.p({
      name: "paperplane",
      size: 22,
      color: "#F5A623"
    }),
    C: !_ctx.isGuestMode
  }, !_ctx.isGuestMode ? {
    D: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args), "37")
  } : {
    E: common_vendor.o((...args) => $options.openLoginSheet && $options.openLoginSheet(...args), "6a")
  }, {
    F: common_vendor.p({
      current: 3
    }),
    G: $data.showLoginSheet
  }, $data.showLoginSheet ? {
    H: common_vendor.o((...args) => $options.closeLoginSheet && $options.closeLoginSheet(...args), "88"),
    I: $data.loginLoading,
    J: common_vendor.o((...args) => $options.handleWeChatLogin && $options.handleWeChatLogin(...args), "ec"),
    K: common_vendor.o(() => {
    }, "1f"),
    L: common_vendor.o((...args) => $options.closeLoginSheet && $options.closeLoginSheet(...args), "26")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dd383ca2"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
