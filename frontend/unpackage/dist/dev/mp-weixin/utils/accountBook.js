"use strict";
function pickLatestActiveSharedBook(books) {
  const activeBooks = (books || []).filter((book) => book && book.status !== 1);
  if (activeBooks.length === 0) {
    return null;
  }
  return activeBooks.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  })[0];
}
exports.pickLatestActiveSharedBook = pickLatestActiveSharedBook;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/accountBook.js.map
