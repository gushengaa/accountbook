"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_index = require("./store/index.js");
const utils_loadIconFont = require("./utils/loadIconFont.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/add-transaction/add-transaction.js";
  "./pages/statistics/statistics.js";
  "./pages/statistics-category-detail/statistics-category-detail.js";
  "./pages/account-books/account-books.js";
  "./pages/profile/profile.js";
  "./pages/profile/edit.js";
  "./pages/currency-settings/currency-settings.js";
  "./pages/category-admin/category-admin.js";
  "./pages/payment-method-admin/payment-method-admin.js";
  "./pages/book-purpose-category-admin/book-purpose-category-admin.js";
  "./pages/feedback/feedback.js";
  "./pages/feedback-admin/feedback-admin.js";
  "./pages/login/login.js";
  "./pages/shared-account-books/shared-account-books.js";
  "./pages/create-shared-account-book/create-shared-account-book.js";
  "./pages/shared-account-book-detail/shared-account-book-detail.js";
  "./pages/shared-account-book-statistics/shared-account-book-statistics.js";
  "./pages/shared-account-book-members/shared-account-book-members.js";
  "./pages/shared-account-book-settings/shared-account-book-settings.js";
  "./pages/shared-account-book-report/shared-account-book-report.js";
  "./pages/user-agreement/user-agreement.js";
  "./pages/privacy-policy/privacy-policy.js";
  "./pages/join-account-book/join-account-book.js";
}
const _sfc_main = {
  globalData: {
    iconFontReady: false
  },
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:10", "App Launch");
    utils_loadIconFont.loadIconFont().then(() => common_vendor.index.__f__("log", "at App.vue:12", "iconfont loaded")).catch((err) => common_vendor.index.__f__("error", "at App.vue:13", "iconfont load failed", err));
    common_vendor.index.hideTabBar({ animation: false, fail: () => {
    } });
    const token = common_vendor.index.getStorageSync("token");
    if (!token) {
      store_index.store.dispatch("setGuestMode", true);
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:25", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:28", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(store_index.store);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
