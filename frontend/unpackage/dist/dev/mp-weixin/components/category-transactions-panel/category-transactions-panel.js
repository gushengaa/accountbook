"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const TransactionDetail = () => "../transaction-detail/transaction-detail.js";
const _sfc_main = {
  components: {
    TransactionDetail
  },
  props: {
    categoryId: {
      type: Number,
      default: null
    },
    categoryName: {
      type: String,
      default: ""
    },
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    transactionType: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      transactions: [],
      loading: false,
      showTransactionDetail: false,
      selectedTransaction: null
    };
  },
  computed: {
    typeLabel() {
      return this.transactionType === 0 ? "支出" : "收入";
    },
    periodLabel() {
      return `${this.year}年${this.month}月 · ${this.categoryName}`;
    },
    totalAmount() {
      const sum = this.transactions.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
      return sum.toFixed(2);
    },
    groupedTransactions() {
      const groups = [];
      const map = /* @__PURE__ */ new Map();
      (this.transactions || []).forEach((item) => {
        const dateKey = utils_util.formatDate(item.transactionDate, "YYYY-MM-DD");
        if (!map.has(dateKey)) {
          const group2 = {
            date: dateKey,
            dateLabel: this.formatGroupDate(dateKey),
            dayTotal: 0,
            items: []
          };
          map.set(dateKey, group2);
          groups.push(group2);
        }
        const group = map.get(dateKey);
        group.items.push(item);
        group.dayTotal += Number(item.amount) || 0;
      });
      return groups;
    }
  },
  watch: {
    categoryId: {
      immediate: true,
      handler() {
        this.loadTransactions();
      }
    }
  },
  methods: {
    formatDate: utils_util.formatDate,
    formatGroupDate(dateKey) {
      const today = utils_util.formatDate(/* @__PURE__ */ new Date(), "YYYY-MM-DD");
      const yesterday = utils_util.formatDate(new Date(Date.now() - 864e5), "YYYY-MM-DD");
      if (dateKey === today)
        return "今天";
      if (dateKey === yesterday)
        return "昨天";
      const [, month, day] = dateKey.split("-");
      return `${parseInt(month)}月${parseInt(day)}日`;
    },
    async loadTransactions() {
      if (!this.categoryId) {
        this.transactions = [];
        return;
      }
      this.loading = true;
      try {
        this.transactions = await utils_api.api.transactions.getCategoryStatisticsTransactions(
          this.categoryId,
          this.year,
          this.month,
          this.transactionType
        );
      } catch (error) {
        common_vendor.index.__f__("error", "at components/category-transactions-panel/category-transactions-panel.vue:175", "加载分类明细失败", error);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    viewTransaction(item) {
      this.selectedTransaction = item;
      this.showTransactionDetail = true;
    },
    closeTransactionDetail() {
      this.showTransactionDetail = false;
      this.selectedTransaction = null;
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  const _easycom_transaction_detail2 = common_vendor.resolveComponent("transaction-detail");
  (_easycom_app_icon2 + _easycom_transaction_detail2)();
}
const _easycom_app_icon = () => "../app-icon/app-icon.js";
const _easycom_transaction_detail = () => "../transaction-detail/transaction-detail.js";
if (!Math) {
  (_easycom_app_icon + _easycom_transaction_detail)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.periodLabel),
    b: common_vendor.t($options.typeLabel),
    c: common_vendor.t($options.totalAmount),
    d: common_vendor.t($data.transactions.length),
    e: $data.loading
  }, $data.loading ? {} : $data.transactions.length === 0 ? {} : {
    g: common_vendor.f($options.groupedTransactions, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.dateLabel),
        b: common_vendor.t(group.dayTotal.toFixed(2)),
        c: common_vendor.f(group.items, (item, k1, i1) => {
          return common_vendor.e({
            a: "dca75a46-0-" + i0 + "-" + i1,
            b: common_vendor.p({
              icon: item.categoryIcon,
              ["category-name"]: item.categoryName,
              size: 18,
              color: "#FFFFFF"
            }),
            c: item.categoryColor || "#F7B84D",
            d: common_vendor.t(item.categoryName),
            e: item.remark
          }, item.remark ? {
            f: common_vendor.t(item.remark)
          } : {}, {
            g: common_vendor.t($options.formatDate(item.transactionDate, "HH:mm")),
            h: item.accountBookName
          }, item.accountBookName ? {
            i: common_vendor.t(item.accountBookName)
          } : {}, {
            j: item.accountBookType === 1 && item.userName
          }, item.accountBookType === 1 && item.userName ? {
            k: common_vendor.t(item.userName)
          } : {}, {
            l: common_vendor.t(item.type === 0 ? "-" : "+"),
            m: common_vendor.t(item.amount.toFixed(2)),
            n: common_vendor.n(item.type === 0 ? "expense" : "income"),
            o: item.id,
            p: common_vendor.o(($event) => $options.viewTransaction(item), item.id)
          });
        }),
        d: group.date
      };
    }),
    h: common_vendor.t($options.typeLabel)
  }, {
    f: $data.transactions.length === 0,
    i: common_vendor.o($options.closeTransactionDetail, "c1"),
    j: common_vendor.p({
      visible: $data.showTransactionDetail,
      transaction: $data.selectedTransaction
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dca75a46"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/category-transactions-panel/category-transactions-panel.js.map
