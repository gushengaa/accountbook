"use strict";
const common_vendor = require("../common/vendor.js");
function hideNativeTabBar() {
  common_vendor.index.hideTabBar({
    animation: false,
    fail: () => {
    }
  });
}
exports.hideNativeTabBar = hideNativeTabBar;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/tabBar.js.map
