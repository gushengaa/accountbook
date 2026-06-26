"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      loading: false,
      agreed: false
    };
  },
  methods: {
    ...common_vendor.mapActions(["login"]),
    async handleWeChatLogin() {
      if (this.loading)
        return;
      if (!this.agreed) {
        common_vendor.index.showToast({
          title: "请先同意用户协议和隐私政策",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      this.loading = true;
      try {
        const loginRes = await new Promise((resolve, reject) => {
          common_vendor.index.login({
            provider: "weixin",
            success: resolve,
            fail: reject
          });
        });
        if (!loginRes.code) {
          common_vendor.index.showToast({
            title: "获取登录凭证失败",
            icon: "none"
          });
          return;
        }
        let userInfo = null;
        const result = await utils_api.api.auth.wechatLogin({
          code: loginRes.code,
          userInfo
        });
        common_vendor.index.__f__("log", "at pages/login/login.vue:94", "登录", result);
        await this.login({
          token: result.token,
          userInfo: result.userInfo
        });
        this.$store.dispatch("setGuestMode", false);
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:110", "登录失败", error);
        common_vendor.index.showToast({
          title: error.message || "登录失败，请重试",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    toggleAgreement() {
      this.agreed = !this.agreed;
    },
    openUserAgreement() {
      common_vendor.index.navigateTo({
        url: "/pages/user-agreement/user-agreement"
      });
    },
    openPrivacyPolicy() {
      common_vendor.index.navigateTo({
        url: "/pages/privacy-policy/privacy-policy"
      });
    },
    async enterGuestMode() {
      this.$store.dispatch("setGuestMode", true);
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: $data.loading,
    c: common_vendor.o((...args) => $options.handleWeChatLogin && $options.handleWeChatLogin(...args), "84"),
    d: common_vendor.o((...args) => $options.enterGuestMode && $options.enterGuestMode(...args), "9c"),
    e: $data.agreed
  }, $data.agreed ? {} : {}, {
    f: $data.agreed ? 1 : "",
    g: common_vendor.o((...args) => $options.openUserAgreement && $options.openUserAgreement(...args), "57"),
    h: common_vendor.o((...args) => $options.openPrivacyPolicy && $options.openPrivacyPolicy(...args), "6c"),
    i: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "3d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
