import store from '@/store';
import { api } from '@/utils/api';
import { pickLatestActiveSharedBook } from '@/utils/accountBook';
import { requireWechatLogin } from '@/utils/auth';
import { resolveAccountBookForAdd } from '@/utils/lastUsedAccountBook';

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
    console.error('加载一起账本失败', error);
  }

  return null;
}

async function loadBooksForResolve() {
  let personalAccountBooks = [];
  let sharedAccountBooks = [];
  try {
    personalAccountBooks = await api.accountBooks.getList();
  } catch (e) {
    console.error('加载个人账本失败', e);
  }
  try {
    sharedAccountBooks = await api.sharedAccountBooks.getList();
  } catch (e) {
    console.error('加载一起账本失败', e);
  }
  return { personalAccountBooks, sharedAccountBooks };
}

/**
 * 从底部导航或首页跳转到记账页
 */
export async function goToAddTransaction(type = 0) {
  if (!requireWechatLogin()) {
    return;
  }

  const accountBookTab = uni.getStorageSync('accountBookTab') || 'all';
  const { personalAccountBooks, sharedAccountBooks } = await loadBooksForResolve();

  let currentSharedAccountBook = store.state.currentSharedAccountBook;
  if (accountBookTab === 'shared' && (!currentSharedAccountBook || currentSharedAccountBook.status === 1)) {
    currentSharedAccountBook = await resolveSharedAccountBook();
  }

  const resolved = resolveAccountBookForAdd({
    accountBookTab,
    currentAccountBook: store.state.currentAccountBook,
    currentSharedAccountBook,
    personalAccountBooks,
    sharedAccountBooks
  });

  if (!resolved) {
    uni.showToast({
      title: accountBookTab === 'shared' ? '还没有进行中的一起账本' : '请先创建账本',
      icon: 'none'
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/add-transaction/add-transaction?type=${type}&accountBookId=${resolved.id}&accountBookType=${resolved.type}`
  });
}
