/**
 * 工具函数
 */

/**
 * 格式化金额（分转元）
 */
export function formatAmount(fen) {
  const yuan = fen / 100;
  return yuan.toFixed(2);
}

/**
 * 金额转分（元转分）
 */
export function amountToFen(yuan) {
  return Math.round(yuan * 100);
}

/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  if (format === 'list-date') {
    const dateKey = formatDate(date, 'YYYY-MM-DD');
    const today = formatDate(new Date(), 'YYYY-MM-DD');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatDate(yesterdayDate, 'YYYY-MM-DD');
    if (dateKey === today) return '今天';
    if (dateKey === yesterday) return '昨天';
    return formatDate(date, 'MM-DD');
  }
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 获取日期范围（今天、本周、本月）
 */
export function getDateRange(type) {
  const now = new Date();
  let startDate, endDate;
  
  switch (type) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
      break;
    case 'month':
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

/**
 * 计算总金额
 */
export function calculateTotal(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
}

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 判断是否为微信/本地临时文件（需上传 OSS 后才能持久保存）
 */
export function isLocalTempFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  if (filePath.startsWith('/static/')) return false;

  const lower = filePath.toLowerCase();
  if (/^https?:\/\//i.test(filePath)) {
    return /^https?:\/\/(tmp|usr)/i.test(filePath);
  }

  return (
    lower.startsWith('wxfile://') ||
    lower.startsWith('file://') ||
    lower.includes('//tmp') ||
    lower.includes('/tmp/')
  );
}

/**
 * 节流函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}



