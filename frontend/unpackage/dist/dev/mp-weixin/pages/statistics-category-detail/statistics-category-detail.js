"use strict";
const common_vendor = require("../../common/vendor.js");
const CategoryTransactionsPanel = () => "../../components/category-transactions-panel/category-transactions-panel.js";
const _sfc_main = {
  components: {
    CategoryTransactionsPanel
  },
  data() {
    return {
      categoryId: null,
      categoryName: "",
      year: (/* @__PURE__ */ new Date()).getFullYear(),
      month: (/* @__PURE__ */ new Date()).getMonth() + 1,
      transactionType: 0
    };
  },
  onLoad(options) {
    this.categoryId = Number(options.categoryId) || null;
    this.categoryName = decodeURIComponent(options.categoryName || "");
    this.year = Number(options.year) || (/* @__PURE__ */ new Date()).getFullYear();
    this.month = Number(options.month) || (/* @__PURE__ */ new Date()).getMonth() + 1;
    this.transactionType = Number(options.type) === 1 ? 1 : 0;
    common_vendor.index.setNavigationBarTitle({
      title: this.categoryName ? `${this.categoryName}明细` : "分类明细"
    });
  }
};
if (!Array) {
  const _easycom_category_transactions_panel2 = common_vendor.resolveComponent("category-transactions-panel");
  _easycom_category_transactions_panel2();
}
const _easycom_category_transactions_panel = () => "../../components/category-transactions-panel/category-transactions-panel.js";
if (!Math) {
  _easycom_category_transactions_panel();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      ["category-id"]: $data.categoryId,
      ["category-name"]: $data.categoryName,
      year: $data.year,
      month: $data.month,
      ["transaction-type"]: $data.transactionType
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f6b34106"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/statistics-category-detail/statistics-category-detail.js.map
