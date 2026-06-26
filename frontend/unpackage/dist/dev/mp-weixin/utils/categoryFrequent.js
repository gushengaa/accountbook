"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_KEY = "frequentCategoryUsage";
const DEFAULT_LIMIT = 6;
function getScopeKey(transactionType, accountBookId) {
  const bookPart = accountBookId != null ? String(accountBookId) : "global";
  return `${bookPart}_${transactionType}`;
}
function readStore() {
  try {
    const raw = common_vendor.index.getStorageSync(STORAGE_KEY);
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}
function writeStore(store) {
  try {
    common_vendor.index.setStorageSync(STORAGE_KEY, store);
  } catch (e) {
    common_vendor.index.__f__("warn", "at utils/categoryFrequent.js:22", "保存常用分类失败", e);
  }
}
function getFrequentCategoryIds(transactionType, accountBookId, availableIds = [], limit = DEFAULT_LIMIT) {
  const idSet = new Set((availableIds || []).map((id) => Number(id)).filter((id) => !Number.isNaN(id)));
  if (!idSet.size)
    return [];
  const scopeKey = getScopeKey(transactionType, accountBookId);
  const scopeData = readStore()[scopeKey] || {};
  const sorted = Object.entries(scopeData).map(([id, count]) => ({ id: Number(id), count: Number(count) || 0 })).filter((item) => !Number.isNaN(item.id) && idSet.has(item.id)).sort((a, b) => b.count - a.count);
  return sorted.slice(0, limit).map((item) => item.id);
}
function recordCategoryUsage(transactionType, accountBookId, categoryId) {
  if (categoryId == null)
    return;
  const id = Number(categoryId);
  if (Number.isNaN(id))
    return;
  const scopeKey = getScopeKey(transactionType, accountBookId);
  const store = readStore();
  const scopeData = { ...store[scopeKey] || {} };
  scopeData[id] = (scopeData[id] || 0) + 1;
  store[scopeKey] = scopeData;
  writeStore(store);
}
const FREQUENT_CATEGORY_LIMIT = DEFAULT_LIMIT;
exports.FREQUENT_CATEGORY_LIMIT = FREQUENT_CATEGORY_LIMIT;
exports.getFrequentCategoryIds = getFrequentCategoryIds;
exports.recordCategoryUsage = recordCategoryUsage;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/categoryFrequent.js.map
