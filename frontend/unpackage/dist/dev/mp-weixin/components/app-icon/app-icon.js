"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_iconMap = require("../../utils/iconMap.js");
const utils_iconUnicode = require("../../utils/iconUnicode.js");
const utils_loadIconFont = require("../../utils/loadIconFont.js");
const FALLBACK_CLASS = "ri-file-text-line";
const _sfc_main = {
  name: "AppIcon",
  emits: ["click"],
  props: {
    name: {
      type: String,
      default: ""
    },
    icon: {
      type: String,
      default: ""
    },
    categoryName: {
      type: String,
      default: ""
    },
    size: {
      type: [Number, String],
      default: 22
    },
    color: {
      type: String,
      default: ""
    },
    filled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fontTick: 0
    };
  },
  computed: {
    iconClass() {
      return utils_iconMap.resolveIconClass({
        name: this.name,
        icon: this.icon,
        categoryName: this.categoryName,
        filled: this.filled
      });
    },
    iconChar() {
      void this.fontTick;
      return utils_iconUnicode.ICON_UNICODE[this.iconClass] || utils_iconUnicode.ICON_UNICODE[FALLBACK_CLASS] || "";
    },
    iconStyle() {
      const sizeValue = typeof this.size === "number" ? `${this.size}px` : this.size;
      const styles = [
        `font-size:${sizeValue}`,
        "line-height:1"
      ];
      if (this.color) {
        styles.push(`color:${this.color}`);
      }
      return styles.join(";");
    }
  },
  mounted() {
    if (utils_loadIconFont.isIconFontReady()) {
      this.fontTick += 1;
      return;
    }
    this._onIconFontLoaded = () => {
      this.fontTick += 1;
    };
    common_vendor.index.$on("iconfont-loaded", this._onIconFontLoaded);
    utils_loadIconFont.loadIconFont().catch(() => {
    });
  },
  beforeUnmount() {
    if (this._onIconFontLoaded) {
      common_vendor.index.$off("iconfont-loaded", this._onIconFontLoaded);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($options.iconChar),
    b: common_vendor.s($options.iconStyle),
    c: common_vendor.o(($event) => _ctx.$emit("click", $event), "8f")
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-83672da0"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/app-icon/app-icon.js.map
