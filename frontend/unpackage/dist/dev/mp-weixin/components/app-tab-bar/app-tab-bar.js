"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_navigation = require("../../utils/navigation.js");
const _sfc_main = {
  name: "AppTabBar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      leftTabs: [
        {
          index: 0,
          pagePath: "/pages/index/index",
          text: "首页",
          icon: "home"
        },
        {
          index: 1,
          pagePath: "/pages/account-books/account-books",
          text: "账本",
          icon: "wallet"
        }
      ],
      rightTabs: [
        {
          index: 2,
          pagePath: "/pages/statistics/statistics",
          text: "统计",
          icon: "bars"
        },
        {
          index: 3,
          pagePath: "/pages/profile/profile",
          text: "我的",
          icon: "person"
        }
      ]
    };
  },
  methods: {
    switchTab(item) {
      if (this.current === item.index)
        return;
      common_vendor.index.switchTab({
        url: item.pagePath
      });
    },
    handleAddTransaction() {
      utils_navigation.goToAddTransaction(0);
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
  return {
    a: common_vendor.f($data.leftTabs, (item, k0, i0) => {
      return {
        a: "496ed856-0-" + i0,
        b: common_vendor.p({
          name: item.icon,
          filled: $props.current === item.index,
          size: 22,
          color: $props.current === item.index ? "#F5A623" : "#999999"
        }),
        c: common_vendor.t(item.text),
        d: item.index,
        e: $props.current === item.index ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(item), item.index)
      };
    }),
    b: common_vendor.f($data.rightTabs, (item, k0, i0) => {
      return {
        a: "496ed856-1-" + i0,
        b: common_vendor.p({
          name: item.icon,
          filled: $props.current === item.index,
          size: 22,
          color: $props.current === item.index ? "#F5A623" : "#999999"
        }),
        c: common_vendor.t(item.text),
        d: item.index,
        e: $props.current === item.index ? 1 : "",
        f: common_vendor.o(($event) => $options.switchTab(item), item.index)
      };
    }),
    c: common_vendor.p({
      name: "compose",
      size: 30,
      color: "#FFFFFF"
    }),
    d: common_vendor.o((...args) => $options.handleAddTransaction && $options.handleAddTransaction(...args), "49")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-496ed856"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/app-tab-bar/app-tab-bar.js.map
