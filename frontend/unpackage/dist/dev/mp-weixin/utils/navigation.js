"use strict";
const common_vendor = require("../common/vendor.js");
const store_index = require("../store/index.js");
const utils_api = require("./api.js");
const utils_accountBook = require("./accountBook.js");
const utils_auth = require("./auth.js");
const utils_lastUsedAccountBook = require("./lastUsedAccountBook.js");
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
    common_vendor.index.__f__("error", "at utils/navigation.js:29", "加载一起账本失败", error);
  }
  return null;
}
async function loadBooksForResolve() {
  let personalAccountBooks = [];
  let sharedAccountBooks = [];
  try {
    personalAccountBooks = await utils_api.api.accountBooks.getList();
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/navigation.js:41", "加载个人账本失败", e);
  }
  try {
    sharedAccountBooks = await utils_api.api.sharedAccountBooks.getList();
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/navigation.js:46", "加载一起账本失败", e);
  }
  return { personalAccountBooks, sharedAccountBooks };
}
async function goToAddTransaction(type = 0) {
  if (!utils_auth.requireWechatLogin()) {
    return;
  }
  const accountBookTab = common_vendor.index.getStorageSync("accountBookTab") || "all";
  const { personalAccountBooks, sharedAccountBooks } = await loadBooksForResolve();
  let currentSharedAccountBook = store_index.store.state.currentSharedAccountBook;
  if (accountBookTab === "shared" && (!currentSharedAccountBook || currentSharedAccountBook.status === 1)) {
    currentSharedAccountBook = await resolveSharedAccountBook();
  }
  const resolved = utils_lastUsedAccountBook.resolveAccountBookForAdd({
    accountBookTab,
    currentAccountBook: store_index.store.state.currentAccountBook,
    currentSharedAccountBook,
    personalAccountBooks,
    sharedAccountBooks
  });
  if (!resolved) {
    common_vendor.index.showToast({
      title: accountBookTab === "shared" ? "还没有进行中的一起账本" : "请先创建账本",
      icon: "none"
    });
    return;
  }
  common_vendor.index.navigateTo({
    url: `/pages/add-transaction/add-transaction?type=${type}&accountBookId=${resolved.id}&accountBookType=${resolved.type}`
  });
}
exports.goToAddTransaction = goToAddTransaction;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/navigation.js.map
