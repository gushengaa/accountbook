"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      form: {
        type: 0,
        title: "",
        content: "",
        contact: ""
      },
      feedbackTypes: [
        { value: 0, name: "功能建议", icon: "💡" },
        { value: 1, name: "问题反馈", icon: "🐛" },
        { value: 2, name: "投诉", icon: "😤" },
        { value: 99, name: "其他", icon: "📝" }
      ],
      feedbackList: [],
      submitting: false,
      loading: false
    };
  },
  onLoad() {
    this.loadFeedbackList();
  },
  methods: {
    formatDate: utils_util.formatDate,
    async loadFeedbackList() {
      this.loading = true;
      try {
        const res = await utils_api.api.feedbacks.getList();
        this.feedbackList = res || [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/feedback/feedback.vue:129", "加载反馈列表失败:", error);
      } finally {
        this.loading = false;
      }
    },
    async submitFeedback() {
      if (!this.form.title.trim()) {
        common_vendor.index.showToast({
          title: "请输入标题",
          icon: "none"
        });
        return;
      }
      if (!this.form.content.trim()) {
        common_vendor.index.showToast({
          title: "请输入详细内容",
          icon: "none"
        });
        return;
      }
      this.submitting = true;
      try {
        await utils_api.api.feedbacks.create({
          type: this.form.type,
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          contact: this.form.contact.trim() || null
        });
        common_vendor.index.showToast({
          title: "提交成功",
          icon: "success"
        });
        this.form.title = "";
        this.form.content = "";
        this.form.contact = "";
        this.loadFeedbackList();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/feedback/feedback.vue:175", "提交反馈失败:", error);
        common_vendor.index.showToast({
          title: "提交失败",
          icon: "error"
        });
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.feedbackTypes, (type, k0, i0) => {
      return {
        a: common_vendor.t(type.icon),
        b: common_vendor.t(type.name),
        c: type.value,
        d: $data.form.type === type.value ? 1 : "",
        e: common_vendor.o(($event) => $data.form.type = type.value, type.value)
      };
    }),
    b: $data.form.title,
    c: common_vendor.o(($event) => $data.form.title = $event.detail.value, "df"),
    d: $data.form.content,
    e: common_vendor.o(($event) => $data.form.content = $event.detail.value, "70"),
    f: common_vendor.t($data.form.content.length),
    g: $data.form.contact,
    h: common_vendor.o(($event) => $data.form.contact = $event.detail.value, "ca"),
    i: $data.submitting,
    j: common_vendor.o((...args) => $options.submitFeedback && $options.submitFeedback(...args), "63"),
    k: $data.feedbackList.length > 0
  }, $data.feedbackList.length > 0 ? {
    l: common_vendor.f($data.feedbackList, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.typeName),
        b: common_vendor.n("type-" + item.type),
        c: common_vendor.t(item.statusName),
        d: common_vendor.n("status-" + item.status),
        e: common_vendor.t(item.title),
        f: common_vendor.t(item.content),
        g: common_vendor.t($options.formatDate(item.createdAt)),
        h: item.adminReply
      }, item.adminReply ? {
        i: common_vendor.t(item.adminReply)
      } : {}, {
        j: item.id
      });
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a24b82f2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/feedback/feedback.js.map
