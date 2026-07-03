const STORAGE_KEY = 'lastUsedAccountBook';
const HOME_SELECTED_KEY = 'homeSelectedAccountBook';

export function recordLastUsedAccountBook(book) {
  if (!book || book.id == null) return;
  try {
    uni.setStorageSync(STORAGE_KEY, {
      id: book.id,
      type: book.type ?? 0,
      name: book.name || ''
    });
  } catch (e) {
    console.warn('保存上次记账账本失败', e);
  }
}

export function getLastUsedAccountBook() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (!raw || raw.id == null) return null;
    return {
      id: Number(raw.id),
      type: Number(raw.type ?? 0),
      name: raw.name || ''
    };
  } catch (e) {
    return null;
  }
}

/** 用户在首页账本选择器里显式选中的账本 */
export function recordHomeSelectedAccountBook(book) {
  if (!book || book.id == null) return;
  try {
    uni.setStorageSync(HOME_SELECTED_KEY, {
      id: book.id,
      type: book.type ?? 0,
      name: book.name || ''
    });
  } catch (e) {
    console.warn('保存首页选中账本失败', e);
  }
}

export function clearHomeSelectedAccountBook() {
  try {
    uni.removeStorageSync(HOME_SELECTED_KEY);
  } catch (e) {
    console.warn('清除首页选中账本失败', e);
  }
}

export function getHomeSelectedAccountBook() {
  try {
    const raw = uni.getStorageSync(HOME_SELECTED_KEY);
    if (!raw || raw.id == null) return null;
    return {
      id: Number(raw.id),
      type: Number(raw.type ?? 0),
      name: raw.name || ''
    };
  } catch (e) {
    return null;
  }
}

function resolveLastUsedActiveBook(activePersonal, activeShared) {
  const last = getLastUsedAccountBook();
  if (!last) return null;
  const lastInActive = last.type === 1
    ? activeShared.some(b => b.id === last.id)
    : activePersonal.some(b => b.id === last.id);
  return lastInActive ? { id: last.id, type: last.type } : null;
}

function hasHomeBookSelection(accountBookTab, activePersonal, activeShared) {
  if (accountBookTab === 'all') return false;
  const homeSelected = getHomeSelectedAccountBook();
  if (!homeSelected) return false;
  if (accountBookTab === 'personal') {
    return homeSelected.type === 0 && activePersonal.some(b => b.id === homeSelected.id);
  }
  if (accountBookTab === 'shared') {
    return homeSelected.type === 1 && activeShared.some(b => b.id === homeSelected.id);
  }
  return false;
}

/**
 * 解析「记一笔」默认账本
 * @param {'all'|'personal'|'shared'} accountBookTab
 */
export function resolveAccountBookForAdd({
  accountBookTab,
  currentAccountBook,
  currentSharedAccountBook,
  personalAccountBooks,
  sharedAccountBooks
}) {
  const activePersonal = (personalAccountBooks || []).filter(b => b.status !== 1);
  const activeShared = (sharedAccountBooks || []).filter(b => b.status !== 1);

  if (hasHomeBookSelection(accountBookTab, activePersonal, activeShared)) {
    const homeSelected = getHomeSelectedAccountBook();
    return { id: homeSelected.id, type: homeSelected.type };
  }

  const fromLast = resolveLastUsedActiveBook(activePersonal, activeShared);
  if (fromLast) return fromLast;

  if (accountBookTab === 'personal') {
    const book = currentAccountBook?.type === 0
      ? currentAccountBook
      : activePersonal.find(b => b.isDefault) || activePersonal[0];
    if (book) return { id: book.id, type: 0 };
  }

  if (accountBookTab === 'shared') {
    const book = currentSharedAccountBook?.status !== 1
      ? currentSharedAccountBook
      : activeShared[0];
    if (book) return { id: book.id, type: 1 };
  }

  const defaultPersonal = activePersonal.find(b => b.isDefault) || activePersonal[0];
  if (defaultPersonal) return { id: defaultPersonal.id, type: 0 };
  if (activeShared[0]) return { id: activeShared[0].id, type: 1 };

  return null;
}
