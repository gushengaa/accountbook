"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  name: "TransactionDetail",
  props: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      default: false
    },
    // 交易数据
    transaction: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...common_vendor.mapState(["userInfo"]),
    // 判断是否是本人的交易记录
    isMyTransaction() {
      if (!this.userInfo || !this.transaction || !this.transaction.userId) {
        return false;
      }
      return this.userInfo.id === this.transaction.userId;
    }
  },
  methods: {
    formatDate: utils_util.formatDate,
    handleClose() {
      this.$emit("close");
    },
    previewImages(index) {
      if (this.transaction && this.transaction.images && this.transaction.images.length > 0) {
        const imageUrls = this.transaction.images.map((img) => img.imageUrl);
        common_vendor.index.previewImage({
          urls: imageUrls,
          current: index
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  _easycom_app_icon2();
}
const _easycom_app_icon = () => "../app-icon/app-icon.js";
if (!Math) {
  _easycom_app_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a;
  return common_vendor.e({
    a: $props.visible
  }, $props.visible ? common_vendor.e({
    b: common_vendor.o((...args) => $options.handleClose && $options.handleClose(...args), "e9"),
    c: $props.transaction
  }, $props.transaction ? common_vendor.e({
    d: common_vendor.t($props.transaction.type === 0 ? "支出" : "收入"),
    e: common_vendor.n($props.transaction.type === 0 ? "expense" : "income"),
    f: common_vendor.t($props.transaction.type === 0 ? "-" : "+"),
    g: common_vendor.t($props.transaction.amount.toFixed(2)),
    h: common_vendor.n($props.transaction.type === 0 ? "expense" : "income"),
    i: common_vendor.p({
      icon: $props.transaction.categoryIcon,
      ["category-name"]: $props.transaction.categoryName,
      size: 16,
      color: "#FFFFFF"
    }),
    j: $props.transaction.categoryColor,
    k: common_vendor.t($props.transaction.categoryName),
    l: common_vendor.t($options.formatDate($props.transaction.transactionDate, "YYYY-MM-DD HH:mm")),
    m: $props.transaction.accountBookType === 1 && ($props.transaction.userName || $props.transaction.userId)
  }, $props.transaction.accountBookType === 1 && ($props.transaction.userName || $props.transaction.userId) ? common_vendor.e({
    n: $options.isMyTransaction
  }, $options.isMyTransaction ? {} : common_vendor.e({
    o: $props.transaction.userAvatar
  }, $props.transaction.userAvatar ? {
    p: $props.transaction.userAvatar
  } : {
    q: common_vendor.t(((_a = $props.transaction.userName) == null ? void 0 : _a.charAt(0)) || "?")
  }, {
    r: common_vendor.t($props.transaction.userName || "未知用户")
  })) : {}, {
    s: $props.transaction.remark
  }, $props.transaction.remark ? {
    t: common_vendor.t($props.transaction.remark)
  } : {}, {
    v: $props.transaction.type === 0 && $props.transaction.spendingChannel > 0
  }, $props.transaction.type === 0 && $props.transaction.spendingChannel > 0 ? {
    w: common_vendor.t($props.transaction.spendingChannelName || "未指定")
  } : {}, {
    x: $props.transaction.images && $props.transaction.images.length > 0
  }, $props.transaction.images && $props.transaction.images.length > 0 ? {
    y: common_vendor.f($props.transaction.images, (img, index, i0) => {
      return {
        a: img.imageUrl,
        b: img.id || index,
        c: common_vendor.o(($event) => $options.previewImages(index), img.id || index)
      };
    })
  } : {}) : {}, {
    z: common_vendor.o(() => {
    }, "e7"),
    A: common_vendor.o((...args) => $options.handleClose && $options.handleClose(...args), "d4")
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-39dda92e"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/transaction-detail/transaction-detail.js.map
