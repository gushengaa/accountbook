"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      form: {
        type: 0,
        // 0-个人账本，1-集体账本
        name: "",
        description: "",
        category: 0,
        // 账本用途类型
        isDefault: false,
        // 个人账本专用
        startDate: "",
        // 集体账本专用
        endDate: "",
        // 集体账本专用
        budget: "",
        // 集体账本专用
        defaultCurrency: 0,
        // 默认人民币
        enabledCurrencyIds: [0],
        // 默认只勾选人民币
        linkedCategoryIds: []
        // 账本关联的交易类别ID，空表示记账时展示全部类别
      },
      currencyOptions: [],
      linkedCategoryOptions: [],
      // 平铺列表（兼容）
      linkedCategoryGroups: [],
      // 按类型+父子分组：[{ typeLabel, parents: [{ id, name, icon, children }] }]
      expandedParentId: null,
      // 当前展开子分类的父类 id，仅展示该父类的子类
      linkedCategoryExpandedByType: {},
      // 按类型（支出/收入）分别控制是否展开，如 { '支出': true, '收入': false }
      editId: null,
      // 编辑时传入的集体账本 id，有值时为编辑模式
      categoryOptions: [
        { value: 0, name: "日常消费", icon: "🏠" },
        { value: 1, name: "旅行", icon: "✈️" },
        { value: 2, name: "装修", icon: "🔧" },
        { value: 3, name: "结婚", icon: "💒" },
        { value: 4, name: "育儿", icon: "👶" },
        { value: 5, name: "生意", icon: "💼" },
        { value: 6, name: "家庭", icon: "👨‍👩‍👧‍👦" },
        { value: 7, name: "活动", icon: "🎉" },
        { value: 99, name: "其他", icon: "📝" }
      ],
      creating: false
    };
  },
  computed: {
    linkedCategoryRows() {
      const chunk = (arr, size) => {
        if (!arr || !arr.length)
          return [];
        const out = [];
        for (let i = 0; i < arr.length; i += size) {
          out.push(arr.slice(i, i + size));
        }
        return out;
      };
      return (this.linkedCategoryGroups || []).map((g) => ({
        typeLabel: g.typeLabel,
        rows: chunk(g.parents || [], 1)
      }));
    },
    // 默认只显示前 4 个父分类行，按类型（支出/收入）分别展开
    displayedLinkedCategoryRows() {
      const limit = 4;
      if (!this.linkedCategoryRows || !this.linkedCategoryRows.length)
        return [];
      return this.linkedCategoryRows.map((g) => {
        const expanded = !!this.linkedCategoryExpandedByType[g.typeLabel];
        const rows = g.rows || [];
        const showRows = rows.length > limit && !expanded ? rows.slice(0, limit) : rows;
        return { typeLabel: g.typeLabel, rows: showRows };
      });
    },
    // 某类型是否有更多可展开（用于显示该类型下的“展开更多”按钮）
    hasMoreForType() {
      return (typeLabel) => {
        const g = (this.linkedCategoryRows || []).find((r) => r.typeLabel === typeLabel);
        return g && g.rows && g.rows.length > 4;
      };
    },
    isExpandedForType() {
      return (typeLabel) => !!this.linkedCategoryExpandedByType[typeLabel];
    },
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
        return "不设置（使用全局默认）";
      const o = this.currencyOptions.find((o2) => o2.value === this.form.defaultCurrency);
      return o ? `${o.symbol} ${o.name}` : "";
    }
  },
  onLoad(options) {
    this.loadCurrencyOptions();
    this.loadLinkedCategoryOptions();
    if (options && options.id) {
      this.editId = parseInt(options.id, 10);
      const editType = options.type != null ? parseInt(options.type, 10) : 1;
      if (this.editId) {
        this.loadAccountBookForEdit(editType);
      }
    } else {
      this.applyPurposeDefaultCategories(this.form.category);
    }
  },
  methods: {
    onPurposeSelect(value) {
      this.form.category = value;
      if (!this.editId) {
        this.applyPurposeDefaultCategories(value);
      }
    },
    async applyPurposeDefaultCategories(purpose) {
      try {
        const res = await utils_api.api.bookPurposeCategories.getByPurpose(purpose);
        const ids = res && Array.isArray(res.categoryIds) ? res.categoryIds : [];
        this.form.linkedCategoryIds = ids.length > 0 ? [...ids] : [];
      } catch (e) {
        common_vendor.index.__f__("warn", "at pages/create-shared-account-book/create-shared-account-book.vue:351", "加载用途默认分类失败", e);
      }
    },
    async loadAccountBookForEdit(editType = 1) {
      if (!this.editId)
        return;
      try {
        const isPersonal = editType === 0;
        const book = isPersonal ? await utils_api.api.accountBooks.getById(this.editId) : await utils_api.api.sharedAccountBooks.getById(this.editId);
        this.form.type = isPersonal ? 0 : 1;
        this.form.name = book.name || "";
        this.form.description = book.description || "";
        this.form.category = book.category != null ? book.category : 0;
        this.form.isDefault = !!book.isDefault;
        this.form.startDate = book.startDate ? String(book.startDate).substring(0, 10) : "";
        this.form.endDate = book.endDate ? String(book.endDate).substring(0, 10) : "";
        this.form.budget = book.budget != null && book.budget !== "" ? String(book.budget) : "";
        this.form.defaultCurrency = book.defaultCurrency ?? null;
        this.form.enabledCurrencyIds = Array.isArray(book.enabledCurrencyIds) ? [...book.enabledCurrencyIds] : [];
        this.form.linkedCategoryIds = Array.isArray(book.linkedCategoryIds) ? [...book.linkedCategoryIds] : [];
        common_vendor.index.setNavigationBarTitle({ title: "编辑账本" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/create-shared-account-book/create-shared-account-book.vue:374", "加载账本失败", e);
        common_vendor.index.showToast({ title: "加载账本失败", icon: "none" });
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
            children: (p.children || []).map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color }))
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
    isParentFullSelected(parent) {
      if (!this.form.linkedCategoryIds)
        return false;
      if (!this.isLinkedCategorySelected(parent.id))
        return false;
      const children = parent.children || [];
      if (children.length === 0)
        return true;
      return children.every((c) => this.form.linkedCategoryIds.indexOf(c.id) >= 0);
    },
    isParentSemiSelected(parent) {
      if (!this.form.linkedCategoryIds)
        return false;
      if (this.isParentFullSelected(parent))
        return false;
      const children = parent.children || [];
      const parentIn = this.isLinkedCategorySelected(parent.id);
      const someChildrenIn = children.some((c) => this.form.linkedCategoryIds.indexOf(c.id) >= 0);
      return parentIn || someChildrenIn;
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
    toggleLinkedCategoryExpand(typeLabel) {
      const cur = !!this.linkedCategoryExpandedByType[typeLabel];
      this.linkedCategoryExpandedByType = { ...this.linkedCategoryExpandedByType, [typeLabel]: !cur };
    },
    // 点击父分类空白处（图标+名称）仅展开/收起子分类，不改变勾选
    toggleParentExpand(parent) {
      this.expandedParentId = this.expandedParentId === parent.id ? null : parent.id;
    },
    // 点击父分类的勾选区域：全选/取消全选该父及其子分类
    onParentClick(parent) {
      if (!this.form.linkedCategoryIds)
        this.form.linkedCategoryIds = [];
      const childIds = (parent.children || []).map((c) => c.id);
      if (this.isParentFullSelected(parent)) {
        this.form.linkedCategoryIds = this.form.linkedCategoryIds.filter((id) => id !== parent.id && childIds.indexOf(id) < 0);
        this.expandedParentId = null;
      } else {
        const toAdd = [parent.id, ...childIds].filter((id) => this.form.linkedCategoryIds.indexOf(id) < 0);
        this.form.linkedCategoryIds = [...this.form.linkedCategoryIds, ...toAdd];
        this.expandedParentId = parent.id;
      }
    },
    expandedParentForRow(row) {
      if (!this.expandedParentId || !row || !row.length)
        return null;
      return row.find((p) => p.id === this.expandedParentId) || null;
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
    onIsDefaultChange(e) {
      this.form.isDefault = e.detail.value.includes("default");
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
    async createAccountBook() {
      if (!this.form.name.trim()) {
        common_vendor.index.showToast({
          title: "请输入账本名称",
          icon: "none"
        });
        return;
      }
      if (this.form.type === 1) {
        if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
          common_vendor.index.showToast({
            title: "结束日期不能早于开始日期",
            icon: "none"
          });
          return;
        }
      }
      this.creating = true;
      try {
        if (this.editId) {
          if (this.form.type === 0) {
            await utils_api.api.accountBooks.update(this.editId, {
              name: this.form.name.trim(),
              description: this.form.description.trim() || null,
              category: this.form.category,
              budget: this.form.budget ? parseFloat(this.form.budget) : null,
              isDefault: this.form.isDefault,
              defaultCurrency: this.form.defaultCurrency ?? null,
              enabledCurrencyIds: this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0 ? this.form.enabledCurrencyIds : null,
              linkedCategoryIds: this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0 ? this.form.linkedCategoryIds : null
            });
          } else {
            await utils_api.api.sharedAccountBooks.update(this.editId, {
              name: this.form.name.trim(),
              description: this.form.description.trim() || null,
              category: this.form.category,
              startDate: this.form.startDate || null,
              endDate: this.form.endDate || null,
              budget: this.form.budget ? parseFloat(this.form.budget) : null,
              defaultCurrency: this.form.defaultCurrency ?? null,
              enabledCurrencyIds: this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0 ? this.form.enabledCurrencyIds : null,
              linkedCategoryIds: this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0 ? this.form.linkedCategoryIds : null
            });
          }
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 800);
          return;
        }
        const result = await utils_api.api.accountBooks.create({
          type: this.form.type,
          name: this.form.name.trim(),
          description: this.form.description.trim() || null,
          category: this.form.category,
          isDefault: this.form.type === 0 ? this.form.isDefault : void 0,
          startDate: this.form.type === 1 ? this.form.startDate || null : void 0,
          endDate: this.form.type === 1 ? this.form.endDate || null : void 0,
          budget: this.form.budget ? parseFloat(this.form.budget) : void 0,
          defaultCurrency: this.form.defaultCurrency ?? void 0,
          enabledCurrencyIds: this.form.enabledCurrencyIds && this.form.enabledCurrencyIds.length > 0 ? this.form.enabledCurrencyIds : void 0,
          linkedCategoryIds: this.form.linkedCategoryIds && this.form.linkedCategoryIds.length > 0 ? this.form.linkedCategoryIds : void 0
        });
        common_vendor.index.showToast({
          title: "创建成功",
          icon: "success"
        });
        if (this.form.type === 0) {
          setTimeout(() => {
            common_vendor.index.switchTab({ url: "/pages/index/index" });
          }, 1500);
        } else {
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${result.id}`
            });
          }, 1500);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/create-shared-account-book/create-shared-account-book.vue:621", this.editId ? "保存失败" : "创建失败", error);
        common_vendor.index.showToast({
          title: error.message || (this.editId ? "保存失败" : "创建失败"),
          icon: "none"
        });
      } finally {
        this.creating = false;
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
    a: !$data.editId
  }, !$data.editId ? {
    b: $data.form.type === 0 ? 1 : "",
    c: common_vendor.o(($event) => $data.form.type = 0, "83"),
    d: $data.form.type === 1 ? 1 : "",
    e: common_vendor.o(($event) => $data.form.type = 1, "a7")
  } : {}, {
    f: $data.form.type === 0 ? "例如：我的日常账本" : "例如：2024年春节旅游",
    g: $data.form.name,
    h: common_vendor.o(($event) => $data.form.name = $event.detail.value, "17"),
    i: $data.form.type === 0 ? "描述一下这个账本的用途（可选）" : "描述一下这个集体账本的用途（可选）",
    j: $data.form.description,
    k: common_vendor.o(($event) => $data.form.description = $event.detail.value, "19"),
    l: common_vendor.f($data.categoryOptions, (cat, k0, i0) => {
      return {
        a: "e0eb11c6-0-" + i0,
        b: common_vendor.p({
          icon: cat.icon,
          ["category-name"]: cat.name,
          size: 20,
          color: $data.form.category === cat.value ? "#F5A623" : "#666666"
        }),
        c: common_vendor.t(cat.name),
        d: cat.value,
        e: $data.form.category === cat.value ? 1 : "",
        f: common_vendor.o(($event) => $options.onPurposeSelect(cat.value), cat.value)
      };
    }),
    m: $data.form.type === 0
  }, $data.form.type === 0 ? {
    n: $data.form.budget,
    o: common_vendor.o(($event) => $data.form.budget = $event.detail.value, "a3")
  } : {}, {
    p: $data.form.type === 1
  }, $data.form.type === 1 ? {
    q: common_vendor.t($data.form.startDate || "请选择开始日期"),
    r: common_vendor.n($data.form.startDate ? "picker-text" : "picker-placeholder"),
    s: $data.form.startDate,
    t: common_vendor.o((...args) => $options.onStartDateChange && $options.onStartDateChange(...args), "a6"),
    v: common_vendor.t($data.form.endDate || "请选择结束日期"),
    w: common_vendor.n($data.form.endDate ? "picker-text" : "picker-placeholder"),
    x: $data.form.endDate,
    y: $data.form.startDate,
    z: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args), "07"),
    A: $data.form.budget,
    B: common_vendor.o(($event) => $data.form.budget = $event.detail.value, "d1")
  } : {}, {
    C: common_vendor.f($data.currencyOptions, (opt, k0, i0) => {
      return {
        a: common_vendor.t(opt.symbol),
        b: common_vendor.t(opt.name),
        c: common_vendor.t($options.isCurrencyEnabled(opt.value) ? "✓" : ""),
        d: $options.isCurrencyEnabled(opt.value) ? 1 : "",
        e: opt.value,
        f: common_vendor.o(($event) => $options.toggleEnabledCurrency(opt.value), opt.value)
      };
    }),
    D: common_vendor.f($options.displayedLinkedCategoryRows, (group, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(group.typeLabel),
        b: common_vendor.f(group.rows, (row, rowIndex, i1) => {
          return common_vendor.e({
            a: common_vendor.f(row, (parent, k2, i2) => {
              return {
                a: "e0eb11c6-1-" + i0 + "-" + i1 + "-" + i2,
                b: common_vendor.p({
                  icon: parent.icon || "📁",
                  ["category-name"]: parent.name,
                  size: 16,
                  color: "#FFFFFF"
                }),
                c: parent.color || "#AA96DA",
                d: common_vendor.t(parent.name),
                e: common_vendor.o(($event) => $options.toggleParentExpand(parent), parent.id),
                f: common_vendor.t($options.isParentFullSelected(parent) ? "✓" : $options.isParentSemiSelected(parent) ? "－" : ""),
                g: $options.isParentFullSelected(parent) ? 1 : "",
                h: $options.isParentSemiSelected(parent) ? 1 : "",
                i: common_vendor.o(($event) => $options.onParentClick(parent), parent.id),
                j: $options.isParentFullSelected(parent) ? 1 : "",
                k: $options.isParentSemiSelected(parent) ? 1 : "",
                l: parent.id
              };
            }),
            b: $options.expandedParentForRow(row)
          }, $options.expandedParentForRow(row) ? {
            c: common_vendor.f($options.expandedParentForRow(row).children || [], (child, k2, i2) => {
              return {
                a: "e0eb11c6-2-" + i0 + "-" + i1 + "-" + i2,
                b: common_vendor.p({
                  icon: child.icon || "📝",
                  ["category-name"]: child.name,
                  size: 14,
                  color: "#FFFFFF"
                }),
                c: child.color || "#AA96DA",
                d: common_vendor.t(child.name),
                e: common_vendor.t($options.isLinkedCategorySelected(child.id) ? "✓" : ""),
                f: $options.isLinkedCategorySelected(child.id) ? 1 : "",
                g: child.id,
                h: $options.isLinkedCategorySelected(child.id) ? 1 : "",
                i: common_vendor.o(($event) => $options.toggleLinkedCategory(child.id), child.id)
              };
            })
          } : {}, {
            d: rowIndex
          });
        }),
        c: $options.hasMoreForType(group.typeLabel)
      }, $options.hasMoreForType(group.typeLabel) ? {
        d: common_vendor.t($options.isExpandedForType(group.typeLabel) ? "收起" : "展开更多"),
        e: common_vendor.o(($event) => $options.toggleLinkedCategoryExpand(group.typeLabel), group.typeLabel)
      } : {}, {
        f: group.typeLabel
      });
    }),
    E: $data.form.type === 0
  }, $data.form.type === 0 ? {
    F: $data.form.isDefault,
    G: common_vendor.o((...args) => $options.onIsDefaultChange && $options.onIsDefaultChange(...args), "17")
  } : {}, {
    H: common_vendor.t($data.editId ? "保存" : $data.form.type === 0 ? "创建个人账本" : "创建集体账本"),
    I: common_vendor.o((...args) => $options.createAccountBook && $options.createAccountBook(...args), "b1"),
    J: $data.creating
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e0eb11c6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/create-shared-account-book/create-shared-account-book.js.map
