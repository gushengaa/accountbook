const STORAGE_KEY = 'frequentCategoryUsage';
const DEFAULT_LIMIT = 6;

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
    console.warn('保存常用分类失败', e);
  }
}

/**
 * 按使用频次返回分类 ID（仅包含当前可用 ID）
 */
export function getFrequentCategoryIds(transactionType, accountBookId, availableIds = [], limit = DEFAULT_LIMIT) {
  const idSet = new Set((availableIds || []).map(id => Number(id)).filter(id => !Number.isNaN(id)));
  if (!idSet.size) return [];

  const scopeKey = getScopeKey(transactionType, accountBookId);
  const scopeData = readStore()[scopeKey] || {};
  const sorted = Object.entries(scopeData)
    .map(([id, count]) => ({ id: Number(id), count: Number(count) || 0 }))
    .filter(item => !Number.isNaN(item.id) && idSet.has(item.id))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, limit).map(item => item.id);
}

export function recordCategoryUsage(transactionType, accountBookId, categoryId) {
  if (categoryId == null) return;
  const id = Number(categoryId);
  if (Number.isNaN(id)) return;
  const scopeKey = getScopeKey(transactionType, accountBookId);
  const store = readStore();
  const scopeData = { ...(store[scopeKey] || {}) };
  scopeData[id] = (scopeData[id] || 0) + 1;
  store[scopeKey] = scopeData;
  writeStore(store);
}

export const FREQUENT_CATEGORY_LIMIT = DEFAULT_LIMIT;
