"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const utils_api = require("./api.js");
const utils_accountBook = require("./accountBook.js");
const utils_auth = require("./auth.js");
function normalizeSharedBook(book) {
  return {
    ...book,
    type: 1
  };
}
async function resolveSharedAccountBook() {
  const currentBook = store_index.store.state.currentSharedAccountBook;
  if (currentBook && currentBook.status !== 1) {
    return currentBook;
  }
  try {
    const books = await utils_api.api.sharedAccountBooks.getList();
    const book = utils_accountBook.pickLatestActiveSharedBook(books);
    if (book) {
      const normalizedBook = normalizeSharedBook(book);
      store_index.store.commit("SET_CURRENT_SHARED_ACCOUNT_BOOK", normalizedBook);
      return normalizedBook;
    }
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/navigation.js:28", "加载集体账本失败", error);
  }
  return null;
}
async function goToAddTransaction(type = 0) {
  if (!utils_auth.requireWechatLogin()) {
    return;
  }
  const accountBookTab = common_vendor.index.getStorageSync("accountBookTab") || "personal";
  let accountBookId = null;
  let accountBookType = 0;
  if (accountBookTab === "shared") {
    const book = await resolveSharedAccountBook();
    if (!book) {
      common_vendor.index.showToast({
        title: "还没有进行中的集体账本",
        icon: "none"
      });
      return;
    }
    accountBookId = book.id;
    accountBookType = 1;
  } else {
    const book = store_index.store.state.currentAccountBook;
    if (!book) {
      common_vendor.index.showToast({
        title: "请先选择账本",
        icon: "none"
      });
      return;
    }
    accountBookId = book.id;
    accountBookType = book.type || 0;
  }
  common_vendor.index.navigateTo({
    url: `/pages/add-transaction/add-transaction?type=${type}&accountBookId=${accountBookId}&accountBookType=${accountBookType}`
  });
}
exports.goToAddTransaction = goToAddTransaction;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/navigation.js.map
