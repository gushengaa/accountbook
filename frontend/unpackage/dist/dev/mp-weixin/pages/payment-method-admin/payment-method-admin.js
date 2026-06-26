"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      list: [],
      loading: false,
      showForm: false,
      formMode: "add",
      saving: false,
      form: {
        id: null,
        name: "",
        value: "",
        icon: "💳",
        color: "#1677FF",
        sortOrder: "0",
        isVisible: true,
        isUsed: false
      }
    };
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
        await this.load();
      } catch (e) {
        common_vendor.index.navigateBack();
      }
    },
    async load() {
      this.loading = true;
      try {
        const res = await utils_api.api.paymentMethodTypes.getAdminList();
        this.list = Array.isArray(res) ? res : [];
      } catch (e) {
        this.list = [];
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    buildPayload() {
      const sort = parseInt(String(this.form.sortOrder), 10);
      const valueRaw = String(this.form.value ?? "").trim();
      const payload = {
        name: (this.form.name || "").trim(),
        icon: this.form.icon || null,
        color: this.form.color || null,
        sortOrder: Number.isFinite(sort) ? sort : 0,
        isVisible: !!this.form.isVisible
      };
      if (valueRaw !== "") {
        payload.value = parseInt(valueRaw, 10);
      }
      return payload;
    },
    async onVisibleChange(item, e) {
      const next = e.detail.value;
      const payload = {
        name: item.name,
        icon: item.icon,
        color: item.color,
        value: item.value,
        sortOrder: item.sortOrder ?? 0,
        isVisible: next
      };
      try {
        await utils_api.api.paymentMethodTypes.updateAdmin(item.id, payload);
        item.isVisible = next;
        common_vendor.index.showToast({ title: "已更新", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "失败", icon: "none" });
        item.isVisible = !next;
      }
    },
    openAdd() {
      this.formMode = "add";
      this.form = {
        id: null,
        name: "",
        value: "",
        icon: "💳",
        color: "#1677FF",
        sortOrder: String(this.list.length),
        isVisible: true,
        isUsed: false
      };
      this.showForm = true;
    },
    openEdit(item) {
      this.formMode = "edit";
      this.form = {
        id: item.id,
        name: item.name,
        value: String(item.value),
        icon: item.icon || "",
        color: item.color || "#1677FF",
        sortOrder: String(item.sortOrder ?? 0),
        isVisible: item.isVisible !== false,
        isUsed: !!item.isUsed
      };
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    async submitForm() {
      if (this.saving)
        return;
      const payload = this.buildPayload();
      if (!payload.name) {
        common_vendor.index.showToast({ title: "请输入名称", icon: "none" });
        return;
      }
      this.saving = true;
      try {
        if (this.formMode === "add") {
          await utils_api.api.paymentMethodTypes.createAdmin(payload);
        } else {
          await utils_api.api.paymentMethodTypes.updateAdmin(this.form.id, payload);
        }
        this.closeForm();
        await this.load();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "保存失败", icon: "none" });
      } finally {
        this.saving = false;
      }
    },
    confirmDelete(item) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定删除「${item.name}」吗？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await utils_api.api.paymentMethodTypes.deleteAdmin(item.id);
            await this.load();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (err) {
            common_vendor.index.showToast({ title: err.message || "删除失败", icon: "none" });
          }
        }
      });
    },
    async persistOrder() {
      await utils_api.api.paymentMethodTypes.reorderAdmin({
        orderedIds: this.list.map((item) => item.id)
      });
    },
    async moveUp(index) {
      if (index <= 0)
        return;
      const next = [...this.list];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      this.list = next;
      try {
        await this.persistOrder();
        await this.load();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "排序失败", icon: "none" });
        await this.load();
      }
    },
    async moveDown(index) {
      if (index >= this.list.length - 1)
        return;
      const next = [...this.list];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      this.list = next;
      try {
        await this.persistOrder();
        await this.load();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "排序失败", icon: "none" });
        await this.load();
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
    a: $data.loading
  }, $data.loading ? {} : {
    b: common_vendor.f($data.list, (item, index, i0) => {
      return common_vendor.e({
        a: index === 0 ? 1 : "",
        b: common_vendor.o(($event) => $options.moveUp(index), item.id),
        c: index === $data.list.length - 1 ? 1 : "",
        d: common_vendor.o(($event) => $options.moveDown(index), item.id),
        e: "d293a13f-0-" + i0,
        f: common_vendor.p({
          icon: item.icon || "💳",
          ["category-name"]: item.name,
          size: 18,
          color: "#FFFFFF"
        }),
        g: item.color || "#F5F5F5",
        h: common_vendor.t(item.name),
        i: common_vendor.t(item.value),
        j: item.isUsed
      }, item.isUsed ? {} : {}, {
        k: item.isVisible,
        l: common_vendor.o(($event) => $options.onVisibleChange(item, $event), item.id),
        m: common_vendor.o(($event) => $options.openEdit(item), item.id),
        n: !item.isUsed
      }, !item.isUsed ? {
        o: common_vendor.o(($event) => $options.confirmDelete(item), item.id)
      } : {}, {
        p: item.id
      });
    })
  }, {
    c: common_vendor.o((...args) => $options.openAdd && $options.openAdd(...args), "bd"),
    d: $data.showForm
  }, $data.showForm ? {
    e: common_vendor.t($data.formMode === "add" ? "新增支付方式" : "编辑支付方式"),
    f: common_vendor.o((...args) => $options.closeForm && $options.closeForm(...args), "d3"),
    g: $data.form.isUsed,
    h: $data.form.name,
    i: common_vendor.o(($event) => $data.form.name = $event.detail.value, "36"),
    j: $data.formMode === "edit" && $data.form.isUsed,
    k: $data.form.value,
    l: common_vendor.o(($event) => $data.form.value = $event.detail.value, "8c"),
    m: $data.form.isUsed,
    n: $data.form.icon,
    o: common_vendor.o(($event) => $data.form.icon = $event.detail.value, "7e"),
    p: $data.form.isUsed,
    q: $data.form.color,
    r: common_vendor.o(($event) => $data.form.color = $event.detail.value, "25"),
    s: $data.form.sortOrder,
    t: common_vendor.o(($event) => $data.form.sortOrder = $event.detail.value, "9a"),
    v: $data.form.isVisible,
    w: common_vendor.o((e) => $data.form.isVisible = e.detail.value, "4f"),
    x: common_vendor.t($data.saving ? "保存中..." : "保存"),
    y: $data.saving ? 1 : "",
    z: common_vendor.o((...args) => $options.submitForm && $options.submitForm(...args), "0f"),
    A: common_vendor.o(() => {
    }, "73"),
    B: common_vendor.o(() => {
    }, "0b"),
    C: common_vendor.o((...args) => $options.closeForm && $options.closeForm(...args), "b4")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d293a13f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/payment-method-admin/payment-method-admin.js.map
