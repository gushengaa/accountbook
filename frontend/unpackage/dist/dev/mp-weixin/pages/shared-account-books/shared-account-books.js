"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      sharedAccountBooks: [],
      showJoinDialog: false,
      shareCode: "",
      joining: false,
      loading: false
    };
  },
  onLoad() {
    this.loadSharedAccountBooks();
  },
  onShow() {
    this.loadSharedAccountBooks();
  },
  methods: {
    formatDate: utils_util.formatDate,
    async loadSharedAccountBooks() {
      this.loading = true;
      try {
        this.sharedAccountBooks = await utils_api.api.sharedAccountBooks.getList();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-books/shared-account-books.vue:99", "加载集体账本失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    goToCreate() {
      common_vendor.index.navigateTo({
        url: "/pages/create-shared-account-book/create-shared-account-book"
      });
    },
    async joinSharedAccountBook() {
      if (!this.shareCode.trim()) {
        common_vendor.index.showToast({
          title: "请输入分享码",
          icon: "none"
        });
        return;
      }
      this.joining = true;
      try {
        await utils_api.api.sharedAccountBooks.join({
          shareCode: this.shareCode.trim().toUpperCase()
        });
        common_vendor.index.showToast({
          title: "加入成功",
          icon: "success"
        });
        this.showJoinDialog = false;
        this.shareCode = "";
        await this.loadSharedAccountBooks();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-books/shared-account-books.vue:141", "加入失败", error);
        common_vendor.index.showToast({
          title: error.message || "加入失败",
          icon: "none"
        });
      } finally {
        this.joining = false;
      }
    },
    viewSharedAccountBook(book) {
      common_vendor.index.navigateTo({
        url: `/pages/shared-account-book-detail/shared-account-book-detail?id=${book.id}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goToCreate && $options.goToCreate(...args), "21"),
    b: common_vendor.o(($event) => $data.showJoinDialog = true, "51"),
    c: common_vendor.f($data.sharedAccountBooks, (book, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(book.name),
        b: book.status === 1
      }, book.status === 1 ? {} : {}, {
        c: common_vendor.t(book.description || "暂无描述"),
        d: common_vendor.t(book.creatorName),
        e: common_vendor.t(book.memberCount),
        f: book.budget
      }, book.budget ? {
        g: common_vendor.t(book.budget.toFixed(2))
      } : {}, {
        h: common_vendor.t(book.shareCode),
        i: common_vendor.t($options.formatDate(book.createdAt)),
        j: book.id,
        k: common_vendor.o(($event) => $options.viewSharedAccountBook(book), book.id)
      });
    }),
    d: $data.sharedAccountBooks.length === 0
  }, $data.sharedAccountBooks.length === 0 ? {} : {}, {
    e: $data.showJoinDialog
  }, $data.showJoinDialog ? {
    f: common_vendor.o(($event) => $data.showJoinDialog = false, "4f"),
    g: $data.shareCode,
    h: common_vendor.o(($event) => $data.shareCode = $event.detail.value, "63"),
    i: common_vendor.o(($event) => $data.showJoinDialog = false, "36"),
    j: common_vendor.o((...args) => $options.joinSharedAccountBook && $options.joinSharedAccountBook(...args), "f8"),
    k: $data.joining,
    l: common_vendor.o(() => {
    }, "5c"),
    m: common_vendor.o(($event) => $data.showJoinDialog = false, "b3")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bb8953bd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-books/shared-account-books.js.map
