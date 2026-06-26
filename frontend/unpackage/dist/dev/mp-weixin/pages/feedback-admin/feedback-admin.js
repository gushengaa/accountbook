"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      feedbackList: [],
      loading: false,
      filterStatus: -1,
      statusTabs: [
        { value: -1, name: "全部" },
        { value: 0, name: "待处理" },
        { value: 1, name: "处理中" },
        { value: 2, name: "已完成" },
        { value: 3, name: "已关闭" }
      ],
      processStatuses: [
        { value: 0, name: "待处理" },
        { value: 1, name: "处理中" },
        { value: 2, name: "已完成" },
        { value: 3, name: "已关闭" }
      ],
      showDetailModal: false,
      selectedFeedback: null,
      processForm: {
        status: 0,
        adminReply: ""
      },
      processing: false
    };
  },
  onLoad() {
    this.checkAdmin();
  },
  methods: {
    formatDate: utils_util.formatDate,
    async checkAdmin() {
      try {
        const isAdmin = await utils_api.api.feedbacks.checkAdmin();
        if (!isAdmin) {
          common_vendor.index.showModal({
            title: "无权限",
            content: "您不是管理员，无法访问此页面",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateBack();
            }
          });
          return;
        }
        this.loadFeedbacks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/feedback-admin/feedback-admin.vue:175", "检查管理员权限失败:", error);
        common_vendor.index.navigateBack();
      }
    },
    async loadFeedbacks() {
      this.loading = true;
      try {
        const res = await utils_api.api.feedbacks.adminGetList(this.filterStatus);
        this.feedbackList = res || [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/feedback-admin/feedback-admin.vue:186", "加载反馈列表失败:", error);
      } finally {
        this.loading = false;
      }
    },
    showDetail(feedback) {
      this.selectedFeedback = feedback;
      this.processForm.status = feedback.status;
      this.processForm.adminReply = feedback.adminReply || "";
      this.showDetailModal = true;
    },
    async processFeedback() {
      this.processing = true;
      try {
        await utils_api.api.feedbacks.adminProcess(this.selectedFeedback.id, {
          status: this.processForm.status,
          adminReply: this.processForm.adminReply
        });
        common_vendor.index.showToast({
          title: "处理成功",
          icon: "success"
        });
        this.showDetailModal = false;
        this.loadFeedbacks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/feedback-admin/feedback-admin.vue:215", "处理反馈失败:", error);
        common_vendor.index.showToast({
          title: "处理失败",
          icon: "error"
        });
      } finally {
        this.processing = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  return common_vendor.e({
    a: common_vendor.f($data.statusTabs, (tab, k0, i0) => {
      return {
        a: common_vendor.t(tab.name),
        b: tab.value,
        c: $data.filterStatus === tab.value ? 1 : "",
        d: common_vendor.o(($event) => {
          $data.filterStatus = tab.value;
          $options.loadFeedbacks();
        }, tab.value)
      };
    }),
    b: $data.feedbackList.length > 0
  }, $data.feedbackList.length > 0 ? {
    c: common_vendor.f($data.feedbackList, (item, k0, i0) => {
      return common_vendor.e({
        a: item.userAvatar || "/static/default-avatar.png",
        b: common_vendor.t(item.userName || "匿名用户"),
        c: common_vendor.t(item.statusName),
        d: common_vendor.n("status-" + item.status),
        e: common_vendor.t(item.typeName),
        f: common_vendor.n("type-" + item.type),
        g: common_vendor.t($options.formatDate(item.createdAt)),
        h: common_vendor.t(item.title),
        i: common_vendor.t(item.content),
        j: item.contact
      }, item.contact ? {
        k: common_vendor.t(item.contact)
      } : {}, {
        l: item.id,
        m: common_vendor.o(($event) => $options.showDetail(item), item.id)
      });
    })
  } : !$data.loading ? {} : {}, {
    d: !$data.loading,
    e: $data.showDetailModal
  }, $data.showDetailModal ? common_vendor.e({
    f: common_vendor.o(($event) => $data.showDetailModal = false, "ed"),
    g: ((_a = $data.selectedFeedback) == null ? void 0 : _a.userAvatar) || "/static/default-avatar.png",
    h: common_vendor.t(((_b = $data.selectedFeedback) == null ? void 0 : _b.userName) || "匿名用户"),
    i: common_vendor.t($options.formatDate((_c = $data.selectedFeedback) == null ? void 0 : _c.createdAt)),
    j: common_vendor.t((_d = $data.selectedFeedback) == null ? void 0 : _d.typeName),
    k: common_vendor.n("type-" + ((_e = $data.selectedFeedback) == null ? void 0 : _e.type)),
    l: common_vendor.t((_f = $data.selectedFeedback) == null ? void 0 : _f.statusName),
    m: common_vendor.n("status-" + ((_g = $data.selectedFeedback) == null ? void 0 : _g.status)),
    n: common_vendor.t((_h = $data.selectedFeedback) == null ? void 0 : _h.title),
    o: common_vendor.t((_i = $data.selectedFeedback) == null ? void 0 : _i.content),
    p: (_j = $data.selectedFeedback) == null ? void 0 : _j.contact
  }, ((_k = $data.selectedFeedback) == null ? void 0 : _k.contact) ? {
    q: common_vendor.t($data.selectedFeedback.contact)
  } : {}, {
    r: common_vendor.f($data.processStatuses, (s, k0, i0) => {
      return {
        a: common_vendor.t(s.name),
        b: s.value,
        c: $data.processForm.status === s.value ? 1 : "",
        d: common_vendor.o(($event) => $data.processForm.status = s.value, s.value)
      };
    }),
    s: $data.processForm.adminReply,
    t: common_vendor.o(($event) => $data.processForm.adminReply = $event.detail.value, "91"),
    v: $data.processing,
    w: common_vendor.o((...args) => $options.processFeedback && $options.processFeedback(...args), "a8"),
    x: common_vendor.o(() => {
    }, "9c"),
    y: common_vendor.o(($event) => $data.showDetailModal = false, "46")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4399af9a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/feedback-admin/feedback-admin.js.map
