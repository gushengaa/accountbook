const STORAGE_KEY = 'lastTransactionPrefs';

function getScopeKey(transactionType, accountBookId) {
  const bookPart = accountBookId != null ? String(accountBookId) : 'global';
  return `${bookPart}_${transactionType}`;
}

function readStore() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function writeStore(store) {
  try {
    uni.setStorageSync(STORAGE_KEY, store);
  } catch (e) {
    console.warn('保存上一笔记账偏好失败', e);
  }
}

export function getLastCategoryId(transactionType, accountBookId) {
  const prefs = readStore()[getScopeKey(transactionType, accountBookId)];
  if (!prefs || prefs.categoryId == null) return null;
  const id = Number(prefs.categoryId);
  return Number.isNaN(id) ? null : id;
}

export function getLastSpendingChannel(transactionType, accountBookId) {
  const prefs = readStore()[getScopeKey(transactionType, accountBookId)];
  if (!prefs || prefs.spendingChannel == null) return null;
  const value = Number(prefs.spendingChannel);
  return Number.isNaN(value) ? null : value;
}

/** @deprecated 记一笔页已改用消费渠道 */
export function getLastPaymentMethod(transactionType, accountBookId) {
  const prefs = readStore()[getScopeKey(transactionType, accountBookId)];
  if (!prefs || prefs.paymentMethod == null) return null;
  const value = Number(prefs.paymentMethod);
  return Number.isNaN(value) ? null : value;
}

export function recordLastTransactionPrefs(
  transactionType,
  accountBookId,
  { categoryId, spendingChannel, paymentMethod } = {}
) {
  const scopeKey = getScopeKey(transactionType, accountBookId);
  const store = readStore();
  const next = { ...(store[scopeKey] || {}) };

  if (categoryId != null) {
    const id = Number(categoryId);
    if (!Number.isNaN(id)) next.categoryId = id;
  }
  if (spendingChannel != null) {
    const value = Number(spendingChannel);
    if (!Number.isNaN(value)) next.spendingChannel = value;
  }
  if (paymentMethod != null) {
    const value = Number(paymentMethod);
    if (!Number.isNaN(value)) next.paymentMethod = value;
  }

  store[scopeKey] = next;
  writeStore(store);
}
