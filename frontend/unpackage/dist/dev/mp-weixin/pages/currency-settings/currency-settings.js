"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      currencyRates: [],
      loading: false,
      saving: false,
      debugInfo: ""
    };
  },
  onLoad() {
    this.loadCurrencyRates();
  },
  methods: {
    async loadCurrencyRates() {
      this.loading = true;
      this.debugInfo = "开始加载...";
      try {
        const res = await utils_api.api.currencyRates.getAll();
        this.debugInfo = `响应类型: ${typeof res}, 是数组: ${Array.isArray(res)}, 内容: ${JSON.stringify(res).substring(0, 200)}`;
        if (Array.isArray(res)) {
          this.currencyRates = res;
        } else if (res && Array.isArray(res.data)) {
          this.currencyRates = res.data;
        } else if (res && typeof res === "object") {
          this.currencyRates = Object.values(res);
        } else {
          this.currencyRates = [];
        }
        if (this.currencyRates.length === 0) {
          this.debugInfo += " | 数组为空";
        }
      } catch (error) {
        this.debugInfo = `错误: ${error.message || error}`;
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "error"
        });
      } finally {
        this.loading = false;
      }
    },
    onRateChange(rate, event) {
      const newRate = parseFloat(event.detail.value);
      if (!isNaN(newRate) && newRate > 0) {
        rate.rate = newRate;
      }
    },
    onToggleChange(rate, event) {
      rate.isEnabled = event.detail.value;
    },
    async saveSettings() {
      this.saving = true;
      try {
        const rates = this.currencyRates.map((r) => ({
          currency: r.currency,
          rate: r.rate,
          isEnabled: r.isEnabled,
          sortOrder: r.sortOrder
        }));
        await utils_api.api.currencyRates.batchUpdate({ rates });
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "error"
        });
      } finally {
        this.saving = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : $data.currencyRates.length > 0 ? {
    c: common_vendor.f($data.currencyRates, (rate, k0, i0) => {
      return {
        a: common_vendor.t(rate.currencySymbol),
        b: common_vendor.t(rate.currencyName),
        c: common_vendor.t(rate.currencyCode),
        d: common_vendor.t(rate.currencyCode),
        e: rate.rate,
        f: rate.currency === 0,
        g: common_vendor.o(($event) => $options.onRateChange(rate, $event), rate.currency),
        h: rate.isEnabled,
        i: rate.currency === 0,
        j: common_vendor.o(($event) => $options.onToggleChange(rate, $event), rate.currency),
        k: rate.currency,
        l: !rate.isEnabled ? 1 : ""
      };
    })
  } : {}, {
    b: $data.currencyRates.length > 0,
    d: $data.saving,
    e: common_vendor.o((...args) => $options.saveSettings && $options.saveSettings(...args), "db")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4db0c842"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/currency-settings/currency-settings.js.map
