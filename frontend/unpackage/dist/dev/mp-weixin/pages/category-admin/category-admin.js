"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      currentType: 0,
      typeTabs: [
        { value: 0, label: "支出" },
        { value: 1, label: "收入" }
      ],
      tree: [],
      loading: false,
      showForm: false,
      formMode: "add",
      formIsParent: true,
      form: {
        id: null,
        name: "",
        icon: "",
        color: "#F5A623",
        type: 0,
        parentId: null,
        sortOrder: 0,
        isVisible: true,
        isUsed: false
      },
      parentPickerIndex: 0,
      saving: false
    };
  },
  computed: {
    parentPickerLabels() {
      return this.tree.map((p) => p.name);
    }
  },
  onLoad() {
    this.load();
  },
  methods: {
    onTypeChange(val) {
      this.currentType = val;
      this.load();
    },
    async load() {
      this.loading = true;
      try {
        const res = await utils_api.api.categories.getAdminList(this.currentType);
        this.tree = Array.isArray(res) ? res : [];
      } catch (e) {
        this.tree = [];
      } finally {
        this.loading = false;
      }
    },
    async onVisibleChange(cat, e) {
      const next = e.detail.value;
      const payload = {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        parentId: cat.parentId != null ? cat.parentId : null,
        sortOrder: cat.sortOrder != null ? cat.sortOrder : 0,
        isVisible: next
      };
      try {
        await utils_api.api.categories.updateAdmin(cat.id, payload);
        cat.isVisible = next;
        common_vendor.index.showToast({ title: "已更新", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "失败", icon: "none" });
        cat.isVisible = !next;
      }
    },
    openEdit(cat, isParent) {
      this.formMode = "edit";
      this.formIsParent = isParent;
      this.form = {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || "",
        color: cat.color || "#F5A623",
        type: cat.type,
        parentId: cat.parentId,
        sortOrder: String(cat.sortOrder ?? 0),
        isVisible: cat.isVisible !== false,
        isUsed: !!cat.isUsed
      };
      if (!isParent) {
        const idx = this.tree.findIndex((p) => p.id === cat.parentId);
        this.parentPickerIndex = idx >= 0 ? idx : 0;
      }
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    onAddTap() {
      common_vendor.index.showActionSheet({
        itemList: ["一级分类（分组）", "二级分类（记账）"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.startAdd(true);
          } else if (res.tapIndex === 1) {
            if (!this.tree.length) {
              common_vendor.index.showToast({ title: "请先添加一级分类", icon: "none" });
              return;
            }
            this.startAdd(false);
          }
        }
      });
    },
    startAdd(isParent) {
      var _a;
      this.formMode = "add";
      this.formIsParent = isParent;
      this.form = {
        id: null,
        name: "",
        icon: isParent ? "📁" : "📝",
        color: "#F5A623",
        type: this.currentType,
        parentId: isParent ? null : ((_a = this.tree[0]) == null ? void 0 : _a.id) ?? null,
        sortOrder: "0",
        isVisible: true,
        isUsed: false
      };
      this.parentPickerIndex = 0;
      this.showForm = true;
    },
    onParentPick(e) {
      this.parentPickerIndex = Number(e.detail.value);
      const p = this.tree[this.parentPickerIndex];
      if (p)
        this.form.parentId = p.id;
    },
    buildPayload() {
      const sort = parseInt(String(this.form.sortOrder), 10);
      let parentId = null;
      if (!this.formIsParent) {
        const p = this.tree[this.parentPickerIndex];
        parentId = p ? p.id : this.form.parentId;
      }
      return {
        name: (this.form.name || "").trim(),
        icon: this.form.icon || null,
        color: this.form.color || null,
        type: this.form.type,
        parentId,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        isVisible: !!this.form.isVisible
      };
    },
    async submitForm() {
      if (this.saving)
        return;
      const payload = this.buildPayload();
      if (!payload.name) {
        common_vendor.index.showToast({ title: "请填写名称", icon: "none" });
        return;
      }
      if (!this.formIsParent && (payload.parentId === null || payload.parentId === void 0)) {
        common_vendor.index.showToast({ title: "请选择所属一级", icon: "none" });
        return;
      }
      if (this.formMode === "edit" && (this.form.id === null || this.form.id === void 0 || this.form.id === "")) {
        common_vendor.index.showToast({ title: "数据异常，请关闭后重试", icon: "none" });
        return;
      }
      this.saving = true;
      try {
        if (this.formMode === "add") {
          await utils_api.api.categories.createAdmin(payload);
          common_vendor.index.showToast({ title: "已添加", icon: "success" });
        } else {
          await utils_api.api.categories.updateAdmin(Number(this.form.id), payload);
          common_vendor.index.showToast({ title: "已保存", icon: "success" });
        }
        this.closeForm();
        await this.load();
      } catch (e) {
        const msg = e && e.message ? e.message : "保存失败";
        common_vendor.index.showToast({ title: msg, icon: "none", duration: 2500 });
      } finally {
        this.saving = false;
      }
    },
    confirmDelete(cat) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定删除「${cat.name}」吗？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await utils_api.api.categories.deleteAdmin(cat.id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await this.load();
          } catch (e) {
            common_vendor.index.showToast({ title: e && e.message || "删除失败", icon: "none" });
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
    a: common_vendor.f($data.typeTabs, (t, k0, i0) => {
      return {
        a: common_vendor.t(t.label),
        b: t.value,
        c: $data.currentType === t.value ? 1 : "",
        d: common_vendor.o(($event) => $options.onTypeChange(t.value), t.value)
      };
    }),
    b: $data.loading
  }, $data.loading ? {} : {
    c: common_vendor.f($data.tree, (parent, k0, i0) => {
      return common_vendor.e({
        a: "7bb9fc60-0-" + i0,
        b: common_vendor.p({
          icon: parent.icon || "📁",
          ["category-name"]: parent.name,
          size: 18,
          color: "#F5A623"
        }),
        c: common_vendor.t(parent.name),
        d: parent.isUsed
      }, parent.isUsed ? {} : {}, {
        e: parent.isVisible,
        f: common_vendor.o(($event) => $options.onVisibleChange(parent, $event), parent.id),
        g: common_vendor.o(($event) => $options.openEdit(parent, true), parent.id),
        h: !parent.isUsed
      }, !parent.isUsed ? {
        i: common_vendor.o(($event) => $options.confirmDelete(parent), parent.id)
      } : {}, {
        j: common_vendor.f(parent.children || [], (child, k1, i1) => {
          return common_vendor.e({
            a: "7bb9fc60-1-" + i0 + "-" + i1,
            b: common_vendor.p({
              icon: child.icon || "📝",
              ["category-name"]: child.name,
              size: 18,
              color: "#F5A623"
            }),
            c: common_vendor.t(child.name),
            d: child.isUsed
          }, child.isUsed ? {} : {}, {
            e: child.isVisible,
            f: common_vendor.o(($event) => $options.onVisibleChange(child, $event), child.id),
            g: common_vendor.o(($event) => $options.openEdit(child, false), child.id),
            h: !child.isUsed
          }, !child.isUsed ? {
            i: common_vendor.o(($event) => $options.confirmDelete(child), child.id)
          } : {}, {
            j: child.id
          });
        }),
        k: parent.id
      });
    })
  }, {
    d: common_vendor.o((...args) => $options.onAddTap && $options.onAddTap(...args), "4e"),
    e: $data.showForm
  }, $data.showForm ? common_vendor.e({
    f: common_vendor.t($data.formMode === "add" ? "新增分类" : "编辑分类"),
    g: common_vendor.o((...args) => $options.closeForm && $options.closeForm(...args), "77"),
    h: $data.formMode === "add"
  }, $data.formMode === "add" ? {
    i: common_vendor.t($data.formIsParent ? "一级（分组）" : "二级（记账类别）")
  } : {}, {
    j: !$data.formIsParent
  }, !$data.formIsParent ? common_vendor.e({
    k: !$data.form.isUsed
  }, !$data.form.isUsed ? {
    l: common_vendor.t($options.parentPickerLabels[$data.parentPickerIndex] || "请选择"),
    m: $options.parentPickerLabels,
    n: $data.parentPickerIndex,
    o: common_vendor.o((...args) => $options.onParentPick && $options.onParentPick(...args), "47")
  } : {
    p: common_vendor.t($options.parentPickerLabels[$data.parentPickerIndex] || "—")
  }) : {}, {
    q: $data.form.isUsed,
    r: $data.form.name,
    s: common_vendor.o(($event) => $data.form.name = $event.detail.value, "a1"),
    t: $data.form.isUsed,
    v: $data.form.icon,
    w: common_vendor.o(($event) => $data.form.icon = $event.detail.value, "f6"),
    x: $data.form.isUsed,
    y: $data.form.color,
    z: common_vendor.o(($event) => $data.form.color = $event.detail.value, "33"),
    A: $data.form.isUsed,
    B: $data.form.sortOrder,
    C: common_vendor.o(($event) => $data.form.sortOrder = $event.detail.value, "ee"),
    D: $data.form.isVisible,
    E: common_vendor.o((e) => $data.form.isVisible = e.detail.value, "4e"),
    F: common_vendor.t($data.saving ? "保存中..." : "保存"),
    G: $data.saving ? 1 : "",
    H: common_vendor.o((...args) => $options.submitForm && $options.submitForm(...args), "ac"),
    I: common_vendor.o(() => {
    }, "bd"),
    J: common_vendor.o(() => {
    }, "42"),
    K: common_vendor.o((...args) => $options.closeForm && $options.closeForm(...args), "39")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7bb9fc60"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/category-admin/category-admin.js.map
