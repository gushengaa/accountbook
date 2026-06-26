"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      purposes: [],
      currentPurpose: 0,
      currentType: 0,
      typeTabs: [
        { value: 0, label: "支出" },
        { value: 1, label: "收入" }
      ],
      expenseTree: [],
      incomeTree: [],
      selectedCategoryIds: [],
      loading: false,
      saving: false
    };
  },
  computed: {
    filteredParents() {
      return this.currentType === 0 ? this.expenseTree : this.incomeTree;
    }
  },
  onLoad() {
    this.checkAdminAndLoad();
  },
  methods: {
    async checkAdminAndLoad() {
      try {
        const isAdmin = await utils_api.api.feedbacks.checkAdmin();
        if (!isAdmin) {
          common_vendor.index.showModal({
            title: "无权限",
            content: "您不是管理员，无法访问此页面",
            showCancel: false,
            success: () => common_vendor.index.navigateBack()
          });
          return;
        }
        await this.init();
      } catch (e) {
        common_vendor.index.navigateBack();
      }
    },
    async init() {
      this.loading = true;
      try {
        const [purposes, exp, inc] = await Promise.all([
          utils_api.api.bookPurposeCategories.getPurposes(),
          utils_api.api.categories.getAdminList(0),
          utils_api.api.categories.getAdminList(1)
        ]);
        this.purposes = Array.isArray(purposes) ? purposes : [];
        this.expenseTree = Array.isArray(exp) ? exp : [];
        this.incomeTree = Array.isArray(inc) ? inc : [];
        if (this.purposes.length && !this.purposes.some((p) => p.purpose === this.currentPurpose)) {
          this.currentPurpose = this.purposes[0].purpose;
        }
        await this.loadSelectedForPurpose(this.currentPurpose);
      } catch (e) {
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    async switchPurpose(purpose) {
      if (purpose === this.currentPurpose)
        return;
      this.currentPurpose = purpose;
      await this.loadSelectedForPurpose(purpose);
    },
    async loadSelectedForPurpose(purpose) {
      try {
        const config = await utils_api.api.bookPurposeCategories.getAdminConfig(purpose);
        const list = config && Array.isArray(config.categories) ? config.categories : [];
        this.selectedCategoryIds = list.map((c) => c.id);
      } catch (e) {
        this.selectedCategoryIds = [];
      }
    },
    isSelected(id) {
      return this.selectedCategoryIds.indexOf(id) >= 0;
    },
    toggleCategory(id) {
      const i = this.selectedCategoryIds.indexOf(id);
      if (i >= 0) {
        this.selectedCategoryIds = this.selectedCategoryIds.filter((x) => x !== id);
      } else {
        this.selectedCategoryIds = [...this.selectedCategoryIds, id];
      }
    },
    async save() {
      if (this.saving)
        return;
      this.saving = true;
      try {
        await utils_api.api.bookPurposeCategories.saveAdminConfig(this.currentPurpose, {
          categoryIds: [...this.selectedCategoryIds]
        });
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "保存失败", icon: "none" });
      } finally {
        this.saving = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  _easycom_app_icon2();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
if (!Math) {
  _easycom_app_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.purposes, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: item.purpose,
        c: $data.currentPurpose === item.purpose ? 1 : "",
        d: common_vendor.o(($event) => $options.switchPurpose(item.purpose), item.purpose)
      };
    }),
    b: common_vendor.f($data.typeTabs, (t, k0, i0) => {
      return {
        a: common_vendor.t(t.label),
        b: t.value,
        c: $data.currentType === t.value ? 1 : "",
        d: common_vendor.o(($event) => $data.currentType = t.value, t.value)
      };
    }),
    c: $data.loading
  }, $data.loading ? {} : {
    d: common_vendor.f($options.filteredParents, (parent, k0, i0) => {
      return common_vendor.e({
        a: "45160d4f-0-" + i0,
        b: common_vendor.p({
          icon: parent.icon || "📁",
          ["category-name"]: parent.name,
          size: 18,
          color: "#F5A623"
        }),
        c: common_vendor.t(parent.name),
        d: common_vendor.f(parent.children || [], (child, k1, i1) => {
          return {
            a: "45160d4f-1-" + i0 + "-" + i1,
            b: common_vendor.p({
              icon: child.icon || "📝",
              ["category-name"]: child.name,
              size: 18,
              color: "#F5A623"
            }),
            c: common_vendor.t(child.name),
            d: common_vendor.t($options.isSelected(child.id) ? "✓" : ""),
            e: $options.isSelected(child.id) ? 1 : "",
            f: child.id,
            g: common_vendor.o(($event) => $options.toggleCategory(child.id), child.id)
          };
        }),
        e: !(parent.children && parent.children.length)
      }, !(parent.children && parent.children.length) ? {} : {}, {
        f: parent.id
      });
    }),
    e: common_vendor.t($data.selectedCategoryIds.length)
  }, {
    f: $data.saving,
    g: common_vendor.o((...args) => $options.save && $options.save(...args), "32")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-45160d4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/book-purpose-category-admin/book-purpose-category-admin.js.map
