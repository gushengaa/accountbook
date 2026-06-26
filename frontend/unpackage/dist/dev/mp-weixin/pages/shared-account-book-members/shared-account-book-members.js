"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      sharedAccountBookId: null,
      sharedAccountBook: null,
      members: [],
      currentUserId: null
    };
  },
  computed: {
    ...common_vendor.mapState(["userInfo"]),
    canManage() {
      if (!this.sharedAccountBook || !this.userInfo)
        return false;
      const currentMember = this.members.find((m) => m.userId === this.userInfo.id);
      return this.sharedAccountBook.creatorId === this.userInfo.id || (currentMember == null ? void 0 : currentMember.role) === 1;
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
      var _a;
      try {
        this.sharedAccountBook = await utils_api.api.sharedAccountBooks.getById(this.sharedAccountBookId);
        this.members = this.sharedAccountBook.members || [];
        this.currentUserId = (_a = this.userInfo) == null ? void 0 : _a.id;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-members/shared-account-book-members.vue:69", "加载成员失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    async removeMember(member) {
      common_vendor.index.showModal({
        title: "确认移除",
        content: `确定要移除成员 ${member.userName} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_api.api.sharedAccountBooks.removeMember(this.sharedAccountBookId, member.userId);
              common_vendor.index.showToast({
                title: "移除成功",
                icon: "success"
              });
              await this.loadData();
            } catch (error) {
              common_vendor.index.showToast({
                title: error.message || "移除失败",
                icon: "none"
              });
            }
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.members, (member, k0, i0) => {
      return common_vendor.e({
        a: member.userAvatar || "/static/default-avatar.png",
        b: common_vendor.t(member.userName),
        c: common_vendor.t(member.role === 1 ? "管理员" : "成员")
      }, $options.canManage ? common_vendor.e({
        d: member.userId !== $data.currentUserId && member.role === 0
      }, member.userId !== $data.currentUserId && member.role === 0 ? {
        e: common_vendor.o(($event) => $options.removeMember(member), member.id)
      } : {}) : {}, {
        f: member.id
      });
    }),
    b: $options.canManage
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dbe7d85f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-book-members/shared-account-book-members.js.map
