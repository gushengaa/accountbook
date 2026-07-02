"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      sharedAccountBookId: null,
      sharedAccountBook: null,
      form: {
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        budget: "",
        status: 0,
        defaultCurrency: null,
        enabledCurrencyIds: [],
        linkedCategoryIds: []
      },
      currencyOptions: [],
      linkedCategoryOptions: [],
      linkedCategoryGroups: [],
      statusOptions: ["进行中", "已结束"],
      statusIndex: 0,
      updating: false
    };
  },
  computed: {
    ...common_vendor.mapState(["userInfo"]),
    defaultCurrencyPickerOptions() {
      return [{ value: null, name: "", symbol: "", label: "不设置（使用全局默认）" }, ...this.currencyOptions];
    },
    defaultCurrencyIndex() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === void 0)
        return 0;
      const i = this.defaultCurrencyPickerOptions.findIndex((o) => o.value === this.form.defaultCurrency);
      return i >= 0 ? i : 0;
    },
    defaultCurrencyLabel() {
      if (this.form.defaultCurrency === null || this.form.defaultCurrency === void 0)
        return "";
      const o = this.currencyOptions.find((o2) => o2.value === this.form.defaultCurrency);
      return o ? `${o.symbol} ${o.name}` : "";
    },
    isCreator() {
      return this.sharedAccountBook && this.userInfo && this.sharedAccountBook.creatorId === this.userInfo.id;
    }
  },
  onLoad(options) {
    if (options.id) {
      this.sharedAccountBookId = parseInt(options.id);
      this.loadData();
    }
  },
  methods: {
    async loadData() {
      try {
        await this.loadCurrencyOptions();
        await this.loadLinkedCategoryOptions();
        this.sharedAccountBook = await utils_api.api.sharedAccountBooks.getById(this.sharedAccountBookId);
        this.form.name = this.sharedAccountBook.name;
        this.form.description = this.sharedAccountBook.description || "";
        this.form.startDate = this.sharedAccountBook.startDate ? this.formatDate(this.sharedAccountBook.startDate) : "";
        this.form.endDate = this.sharedAccountBook.endDate ? this.formatDate(this.sharedAccountBook.endDate) : "";
        this.form.budget = this.sharedAccountBook.budget ? this.sharedAccountBook.budget.toString() : "";
        this.form.status = this.sharedAccountBook.status;
        this.statusIndex = this.sharedAccountBook.status;
        this.form.defaultCurrency = this.sharedAccountBook.defaultCurrency ?? null;
        this.form.enabledCurrencyIds = Array.isArray(this.sharedAccountBook.enabledCurrencyIds) ? [...this.sharedAccountBook.enabledCurrencyIds] : [];
        this.form.linkedCategoryIds = Array.isArray(this.sharedAccountBook.linkedCategoryIds) ? [...this.sharedAccountBook.linkedCategoryIds] : [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-settings/shared-account-book-settings.vue:225", "加载数据失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    formatDate(dateString) {
      if (!dateString)
        return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    onStartDateChange(e) {
      this.form.startDate = e.detail.value;
      if (this.form.endDate && this.form.endDate < this.form.startDate) {
        this.form.endDate = "";
      }
    },
    onEndDateChange(e) {
      this.form.endDate = e.detail.value;
      if (this.form.startDate && this.form.endDate < this.form.startDate) {
        common_vendor.index.showToast({
          title: "结束日期不能早于开始日期",
          icon: "none"
        });
        this.form.endDate = "";
        return;
      }
    },
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.form.status = this.statusIndex;
    },
    async loadCurrencyOptions() {
      try {
        const rates = await utils_api.api.currencyRates.getEnabled();
        this.currencyOptions = rates.map((r) => ({
          value: r.currency,
          name: r.currencyName,
          symbol: r.currencySymbol,
          label: `${r.currencySymbol} ${r.currencyName}`
        }));
        if (this.currencyOptions.length === 0) {
          this.currencyOptions = [{ value: 0, name: "人民币", symbol: "¥", label: "¥ 人民币" }];
        }
      } catch (e) {
        this.currencyOptions = [{ value: 0, name: "人民币", symbol: "¥", label: "¥ 人民币" }];
      }
    },
    onDefaultCurrencyChange(e) {
      const idx = parseInt(e.detail.value, 10);
      const opts = this.defaultCurrencyPickerOptions;
      if (opts[idx]) {
        this.form.defaultCurrency = opts[idx].value;
      }
    },
    isCurrencyEnabled(value) {
      if (!this.form.enabledCurrencyIds || this.form.enabledCurrencyIds.length === 0)
        return true;
      return this.form.enabledCurrencyIds.includes(value);
    },
    toggleEnabledCurrency(value) {
      if (!this.form.enabledCurrencyIds)
        this.form.enabledCurrencyIds = [];
      const allIds = this.currencyOptions.map((o) => o.value);
      if (this.form.enabledCurrencyIds.length === 0) {
        this.form.enabledCurrencyIds = allIds.filter((id) => id !== value);
      } else {
        const i = this.form.enabledCurrencyIds.indexOf(value);
        if (i >= 0) {
          this.form.enabledCurrencyIds = this.form.enabledCurrencyIds.filter((id) => id !== value);
        } else {
          this.form.enabledCurrencyIds = [...this.form.enabledCurrencyIds, value];
        }
      }
    },
    async loadLinkedCategoryOptions() {
      try {
        const [exp, inc] = await Promise.all([
          utils_api.api.categories.getList(0),
          utils_api.api.categories.getList(1)
        ]);
        const flat = (arr, typeLabel) => {
          const out = [];
          for (const p of arr || []) {
            out.push({ id: p.id, name: p.name, type: p.type, typeLabel });
            for (const c of p.children || []) {
              out.push({ id: c.id, name: c.name, type: c.type, typeLabel });
            }
          }
          return out;
        };
        this.linkedCategoryOptions = [...flat(exp, "支出"), ...flat(inc, "收入")];
        const toGroup = (arr, typeLabel) => ({
          typeLabel,
          parents: (arr || []).map((p) => ({
            id: p.id,
            name: p.name,
            icon: p.icon,
            color: p.color,
            children: (p.children || []).map((c) => ({ id: c.id, name: c.name, type: c.type }))
          }))
        });
        this.linkedCategoryGroups = [
          ...exp && exp.length ? [toGroup(exp, "支出")] : [],
          ...inc && inc.length ? [toGroup(inc, "收入")] : []
        ];
      } catch (e) {
        this.linkedCategoryOptions = [];
        this.linkedCategoryGroups = [];
      }
    },
    isLinkedCategorySelected(id) {
      return this.form.linkedCategoryIds && this.form.linkedCategoryIds.indexOf(id) >= 0;
    },
    toggleLinkedCategory(id) {
      if (!this.form.linkedCategoryIds)
        this.form.linkedCategoryIds = [];
      const i = this.form.linkedCategoryIds.indexOf(id);
      if (i >= 0) {
        this.form.linkedCategoryIds = this.form.linkedCategoryIds.filter((x) => x !== id);
      } else {
        this.form.linkedCategoryIds = [...this.form.linkedCategoryIds, id];
      }
    },
    async updateSharedAccountBook() {
      if (!this.form.name.trim()) {
        common_vendor.index.showToast({
          title: "请输入账本名称",
          icon: "none"
        });
        return;
      }
      this.updating = true;
      try {
        if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
          common_vendor.index.showToast({
            title: "结束日期不能早于开始日期",
            icon: "none"
          });
          return;
        }
        await utils_api.api.sharedAccountBooks.update(this.sharedAccountBookId, {
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          startDate: this.form.startDate || null,
          endDate: this.form.endDate || null,
          budget: this.form.budget ? parseFloat(this.form.budget) : null,
          status: this.form.status,
          defaultCurrency: this.form.defaultCurrency ?? void 0,
          enabledCurrencyIds: this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0 ? this.form.enabledCurrencyIds : void 0,
          linkedCategoryIds: this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0 ? this.form.linkedCategoryIds : void 0
        });
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-settings/shared-account-book-settings.vue:402", "更新失败", error);
        common_vendor.index.showToast({
          title: error.message || "更新失败",
          icon: "none"
        });
      } finally {
        this.updating = false;
      }
    },
    async deleteSharedAccountBook() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除一起账本将同时删除所有相关数据，此操作不可恢复！",
        confirmColor: "#F5A623",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_api.api.sharedAccountBooks.delete(this.sharedAccountBookId);
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              setTimeout(() => {
                common_vendor.index.navigateBack();
              }, 1500);
            } catch (error) {
              common_vendor.index.showToast({
                title: error.message || "删除失败",
                icon: "none"
              });
            }
          }
        }
      });
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
    a: $data.form.name,
    b: common_vendor.o(($event) => $data.form.name = $event.detail.value, "ba"),
    c: $data.form.description,
    d: common_vendor.o(($event) => $data.form.description = $event.detail.value, "7d"),
    e: common_vendor.t($data.form.startDate || "请选择开始日期"),
    f: common_vendor.n($data.form.startDate ? "picker-text" : "picker-placeholder"),
    g: $data.form.startDate,
    h: common_vendor.o((...args) => $options.onStartDateChange && $options.onStartDateChange(...args), "47"),
    i: common_vendor.t($data.form.endDate || "请选择结束日期"),
    j: common_vendor.n($data.form.endDate ? "picker-text" : "picker-placeholder"),
    k: $data.form.endDate,
    l: $data.form.startDate,
    m: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args), "fb"),
    n: $data.form.budget,
    o: common_vendor.o(($event) => $data.form.budget = $event.detail.value, "e0"),
    p: common_vendor.t($data.statusOptions[$data.statusIndex]),
    q: $data.statusOptions,
    r: $data.statusIndex,
    s: common_vendor.o((...args) => $options.onStatusChange && $options.onStatusChange(...args), "d7"),
    t: common_vendor.t($options.defaultCurrencyLabel || "不设置（使用全局默认）"),
    v: common_vendor.n($data.form.defaultCurrency !== null && $data.form.defaultCurrency !== void 0 ? "picker-text" : "picker-placeholder"),
    w: $options.defaultCurrencyPickerOptions,
    x: $options.defaultCurrencyIndex,
    y: common_vendor.o((...args) => $options.onDefaultCurrencyChange && $options.onDefaultCurrencyChange(...args), "8a"),
    z: common_vendor.f($data.currencyOptions, (opt, k0, i0) => {
      return {
        a: common_vendor.t(opt.symbol),
        b: common_vendor.t(opt.name),
        c: common_vendor.t($options.isCurrencyEnabled(opt.value) ? "✓" : ""),
        d: $options.isCurrencyEnabled(opt.value) ? 1 : "",
        e: opt.value,
        f: common_vendor.o(($event) => $options.toggleEnabledCurrency(opt.value), opt.value)
      };
    }),
    A: common_vendor.f($data.linkedCategoryGroups, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.typeLabel),
        b: common_vendor.f(group.parents, (parent, k1, i1) => {
          return common_vendor.e({
            a: parent.icon || parent.name
          }, parent.icon || parent.name ? {
            b: "c141a7f7-0-" + i0 + "-" + i1,
            c: common_vendor.p({
              icon: parent.icon,
              ["category-name"]: parent.name,
              size: 16,
              color: "#F5A623"
            })
          } : {}, {
            d: common_vendor.t(parent.name),
            e: common_vendor.t($options.isLinkedCategorySelected(parent.id) ? "✓" : ""),
            f: $options.isLinkedCategorySelected(parent.id) ? 1 : "",
            g: common_vendor.o(($event) => $options.toggleLinkedCategory(parent.id), parent.id),
            h: common_vendor.f(parent.children || [], (child, k2, i2) => {
              return {
                a: common_vendor.t(child.name),
                b: common_vendor.t($options.isLinkedCategorySelected(child.id) ? "✓" : ""),
                c: $options.isLinkedCategorySelected(child.id) ? 1 : "",
                d: common_vendor.o(($event) => $options.toggleLinkedCategory(child.id), child.id),
                e: child.id
              };
            }),
            i: parent.id
          });
        }),
        c: group.typeLabel
      };
    }),
    B: common_vendor.o((...args) => $options.updateSharedAccountBook && $options.updateSharedAccountBook(...args), "e3"),
    C: $data.updating,
    D: $options.isCreator
  }, $options.isCreator ? {
    E: common_vendor.o((...args) => $options.deleteSharedAccountBook && $options.deleteSharedAccountBook(...args), "a4")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c141a7f7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-book-settings/shared-account-book-settings.js.map
