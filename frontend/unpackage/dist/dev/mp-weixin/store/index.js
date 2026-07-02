"use strict";
const common_vendor = require("../common/vendor.js");
const utils_api = require("../utils/api.js");
const store = common_vendor.createStore({
  state: {
    token: utils_api.getToken(),
    userInfo: common_vendor.index.getStorageSync("userInfo") || null,
    currentAccountBook: common_vendor.index.getStorageSync("currentAccountBook") || null,
    accountBooks: [],
    addTransactionType: null,
    // 记账类型：0-支出，1-收入
    addTransactionAccountBook: null,
    // 记账时指定的账本信息 { id, type }
    currentSharedAccountBook: null,
    // 当前一起账本
    switchToAITab: false,
    // 是否切换到AI记账tab
    isGuestMode: utils_api.getToken() ? common_vendor.index.getStorageSync("isGuestMode") || false : true
    // 未登录默认体验浏览模式
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
      utils_api.setToken(token);
    },
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo;
      common_vendor.index.setStorageSync("userInfo", userInfo);
    },
    SET_CURRENT_ACCOUNT_BOOK(state, accountBook) {
      state.currentAccountBook = accountBook;
      common_vendor.index.setStorageSync("currentAccountBook", accountBook);
    },
    SET_ACCOUNT_BOOKS(state, accountBooks) {
      state.accountBooks = accountBooks;
      if (!state.currentAccountBook && accountBooks.length > 0) {
        const defaultBook = accountBooks.find((ab) => ab.isDefault) || accountBooks[0];
        state.currentAccountBook = defaultBook;
        common_vendor.index.setStorageSync("currentAccountBook", defaultBook);
      }
    },
    CLEAR_AUTH(state) {
      state.token = "";
      state.userInfo = null;
      state.isGuestMode = true;
      utils_api.clearToken();
      common_vendor.index.setStorageSync("isGuestMode", true);
    },
    SET_GUEST_MODE(state, isGuest) {
      state.isGuestMode = isGuest;
      common_vendor.index.setStorageSync("isGuestMode", isGuest);
    },
    SET_ADD_TRANSACTION_TYPE(state, type) {
      state.addTransactionType = type;
    },
    SET_ADD_TRANSACTION_ACCOUNT_BOOK(state, accountBook) {
      state.addTransactionAccountBook = accountBook;
    },
    SET_CURRENT_SHARED_ACCOUNT_BOOK(state, sharedAccountBook) {
      state.currentSharedAccountBook = sharedAccountBook;
    },
    SET_SWITCH_TO_AI_TAB(state, value) {
      state.switchToAITab = value;
    }
  },
  actions: {
    // 登录
    async login({ commit }, { token, userInfo }) {
      commit("SET_TOKEN", token);
      commit("SET_USER_INFO", userInfo);
    },
    // 登出
    logout({ commit }) {
      commit("CLEAR_AUTH");
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    },
    // 设置当前账本
    setCurrentAccountBook({ commit }, accountBook) {
      commit("SET_CURRENT_ACCOUNT_BOOK", accountBook);
    },
    // 更新账本列表
    updateAccountBooks({ commit }, accountBooks) {
      commit("SET_ACCOUNT_BOOKS", accountBooks);
    },
    // 设置记账类型
    setAddTransactionType({ commit }, type) {
      commit("SET_ADD_TRANSACTION_TYPE", type);
    },
    // 设置记账时指定的账本
    setAddTransactionAccountBook({ commit }, accountBook) {
      commit("SET_ADD_TRANSACTION_ACCOUNT_BOOK", accountBook);
    },
    // 设置当前一起账本
    setCurrentSharedAccountBook({ commit }, sharedAccountBook) {
      commit("SET_CURRENT_SHARED_ACCOUNT_BOOK", sharedAccountBook);
    },
    // 设置切换到AI tab
    setSwitchToAITab({ commit }, value) {
      commit("SET_SWITCH_TO_AI_TAB", value);
    },
    // 设置体验模式
    setGuestMode({ commit }, isGuest) {
      commit("SET_GUEST_MODE", isGuest);
    }
  }
});
exports.store = store;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/index.js.map
