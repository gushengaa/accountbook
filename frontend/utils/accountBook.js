/**
 * 从一起账本列表中选取最近一个进行中的账本
 */
export function pickLatestActiveSharedBook(books) {
  const activeBooks = (books || []).filter(book => book && book.status !== 1);
  if (activeBooks.length === 0) {
    return null;
  }

  return activeBooks.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  })[0];
}
