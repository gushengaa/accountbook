"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      shareCode: "",
      joining: false
    };
  },
  onLoad(options) {
    if (options.shareCode) {
      this.shareCode = options.shareCode;
    }
  },
  methods: {
    async joinAccountBook() {
      if (!this.shareCode || this.shareCode.length !== 6) {
        common_vendor.index.showToast({
          title: "请输入6位分享码",
          icon: "none"
        });
        return;
      }
      this.joining = true;
      try {
        const result = await utils_api.api.sharedAccountBooks.join({
          shareCode: this.shareCode
        });
        common_vendor.index.showToast({
          title: "加入成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.redirectTo({
            url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${result.id}&type=1`
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/join-account-book/join-account-book.vue:83", "加入账本失败", error);
        common_vendor.index.showToast({
          title: error.message || "加入失败，请检查分享码是否正确",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.joining = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.shareCode,
    b: common_vendor.o(($event) => $data.shareCode = $event.detail.value, "c1"),
    c: common_vendor.t($data.joining ? "加入中..." : "加入账本"),
    d: common_vendor.o((...args) => $options.joinAccountBook && $options.joinAccountBook(...args), "20"),
    e: $data.joining,
    f: !$data.shareCode || $data.shareCode.length !== 6
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-24f0d2db"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/join-account-book/join-account-book.js.map
