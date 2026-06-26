"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const LOGIN_REQUIRED_MESSAGE = "需要授权微信登录后才能使用记账等完整功能";
function isGuestBrowsing() {
  const { token, isGuestMode } = store_index.store.state;
  return !token || isGuestMode;
}
function promptWechatLogin(options = {}) {
  const {
    title = "需要登录",
    content = LOGIN_REQUIRED_MESSAGE,
    confirmText = "去登录",
    cancelText = "取消"
  } = options;
  return new Promise((resolve) => {
    common_vendor.index.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm) {
          common_vendor.index.navigateTo({
            url: "/pages/login/login"
          });
        }
        resolve(!!res.confirm);
      },
      fail: () => resolve(false)
    });
  });
}
function requireWechatLogin(options = {}) {
  if (!isGuestBrowsing()) {
    return true;
  }
  promptWechatLogin(options);
  return false;
}
exports.isGuestBrowsing = isGuestBrowsing;
exports.requireWechatLogin = requireWechatLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth.js.map
