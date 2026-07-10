"use strict";
function formatAmount(fen) {
  const yuan = fen / 100;
  return yuan.toFixed(2);
}
function formatDate(date, format = "YYYY-MM-DD") {
  if (!date)
    return "";
  if (format === "list-date") {
    const dateKey = formatDate(date, "YYYY-MM-DD");
    const today = formatDate(/* @__PURE__ */ new Date(), "YYYY-MM-DD");
    const yesterdayDate = /* @__PURE__ */ new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatDate(yesterdayDate, "YYYY-MM-DD");
    if (dateKey === today)
      return "今天";
    if (dateKey === yesterday)
      return "昨天";
    return formatDate(date, "MM-DD");
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  const second = String(d.getSeconds()).padStart(2, "0");
  return format.replace("YYYY", year).replace("MM", month).replace("DD", day).replace("HH", hour).replace("mm", minute).replace("ss", second);
}
function getDateRange(type) {
  const now = /* @__PURE__ */ new Date();
  let startDate, endDate;
  switch (type) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "week":
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}
function calculateTotal(transactions, type) {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + parseFloat(t.amount), 0);
}
function isLocalTempFile(filePath) {
  if (!filePath || typeof filePath !== "string")
    return false;
  if (filePath.startsWith("/static/"))
    return false;
  const lower = filePath.toLowerCase();
  if (/^https?:\/\//i.test(filePath)) {
    return /^https?:\/\/(tmp|usr)/i.test(filePath);
  }
  return lower.startsWith("wxfile://") || lower.startsWith("file://") || lower.includes("//tmp") || lower.includes("/tmp/");
}
exports.calculateTotal = calculateTotal;
exports.formatAmount = formatAmount;
exports.formatDate = formatDate;
exports.getDateRange = getDateRange;
exports.isLocalTempFile = isLocalTempFile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/util.js.map
