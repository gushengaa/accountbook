import store from '@/store';
import { api } from '@/utils/api';
import { pickLatestActiveSharedBook } from '@/utils/accountBook';
import { requireWechatLogin } from '@/utils/auth';

function normalizeSharedBook(book) {
  return {
    ...book,
    type: 1
  };
}

async function resolveSharedAccountBook() {
  const currentBook = store.state.currentSharedAccountBook;
  if (currentBook && currentBook.status !== 1) {
    return currentBook;
  }

  try {
    const books = await api.sharedAccountBooks.getList();
    const book = pickLatestActiveSharedBook(books);
    if (book) {
      const normalizedBook = normalizeSharedBook(book);
      store.commit('SET_CURRENT_SHARED_ACCOUNT_BOOK', normalizedBook);
      return normalizedBook;
    }
  } catch (error) {
    console.error('加载集体账本失败', error);
  }

  return null;
}

/**
 * 从底部导航或首页跳转到记账页
 */
export async function goToAddTransaction(type = 0) {
  if (!requireWechatLogin()) {
    return;
  }

  const accountBookTab = uni.getStorageSync('accountBookTab') || 'personal';
  let accountBookId = null;
  let accountBookType = 0;

  if (accountBookTab === 'shared') {
    const book = await resolveSharedAccountBook();
    if (!book) {
      uni.showToast({
        title: '还没有进行中的集体账本',
        icon: 'none'
      });
      return;
    }
    accountBookId = book.id;
    accountBookType = 1;
  } else {
    const book = store.state.currentAccountBook;
    if (!book) {
      uni.showToast({
        title: '请先选择账本',
        icon: 'none'
      });
      return;
    }
    accountBookId = book.id;
    accountBookType = book.type || 0;
  }

  uni.navigateTo({
    url: `/pages/add-transaction/add-transaction?type=${type}&accountBookId=${accountBookId}&accountBookType=${accountBookType}`
  });
}
