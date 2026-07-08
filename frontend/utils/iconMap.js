/**
 * 图标解析：将 Emoji / 分类名 / 业务 key 映射为 iconfont 类名（ri-*-line）
 */

const DEFAULT_ICON = 'file-text';

/** 业务入口图标（Tab、菜单等） */
export const APP_ICONS = {
  home: 'home',
  'home-filled': 'home',
  wallet: 'wallet',
  'wallet-filled': 'wallet',
  shop: 'store-2',
  bars: 'bar-chart',
  person: 'user',
  'person-filled': 'user',
  compose: 'edit',
  plusempty: 'add',
  plus: 'add',
  staff: 'team',
  gear: 'settings',
  list: 'file-list',
  checkmarkempty: 'check',
  chatbubble: 'chat-1',
  info: 'information',
  paperplane: 'send-plane',
  mic: 'mic',
  help: 'question',
  link: 'links',
  folder: 'folder',
  file: 'file-text'
};

/** 一起账本用途 category 编号 */
export const BOOK_CATEGORY_ICONS = {
  0: 'home',
  1: 'flight-takeoff',
  2: 'tools',
  3: 'heart',
  4: 'bear-smile',
  5: 'briefcase',
  6: 'group',
  7: 'calendar-event',
  99: 'file-text'
};

/** 账本用途主色（暖色系，与小程序琥珀主色 #F5A623 协调） */
export const BOOK_CATEGORY_COLORS = {
  0: '#F5A623',
  1: '#E8940C',
  2: '#E67E22',
  3: '#E85D8A',
  4: '#C9926E',
  5: '#D4820A',
  6: '#8FAD6E',
  7: '#E85D4B',
  99: '#A8A29E'
};

/** 账本用途 Emoji（与创建页 categoryOptions 一致） */
export const BOOK_CATEGORY_EMOJI = {
  0: '🏠',
  1: '✈️',
  2: '🔧',
  3: '💒',
  4: '👶',
  5: '💼',
  6: '👨‍👩‍👧‍👦',
  7: '🎉',
  99: '📝'
};

function hexToRgba(hex, alpha) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return `rgba(149, 165, 166, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getBookCategoryColor(category) {
  const key = category != null ? Number(category) : 99;
  return BOOK_CATEGORY_COLORS[key] ?? BOOK_CATEGORY_COLORS[99];
}

export function getBookCategoryEmoji(category) {
  const key = category != null ? Number(category) : 99;
  return BOOK_CATEGORY_EMOJI[key] ?? BOOK_CATEGORY_EMOJI[99];
}

export function getBookCategoryBadgeStyle(category) {
  const color = getBookCategoryColor(category);
  return {
    color,
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.28)
  };
}

export function getBookCardTintStyle(category) {
  const color = getBookCategoryColor(category);
  return {
    '--book-accent': color,
    '--book-tint': hexToRgba(color, 0.08),
    '--book-tint-border': hexToRgba(color, 0.22)
  };
}

/** Emoji -> iconfont 基础名 */
const EMOJI_ICON_MAP = {
  '🍔': 'restaurant',
  '🚗': 'car',
  '🛒': 'shopping-cart',
  '🏠': 'home',
  '🎬': 'movie',
  '🏥': 'hospital',
  '📚': 'book',
  '🧧': 'gift',
  '💳': 'bank-card',
  '📝': 'file-text',
  '🥣': 'bowl',
  '🍱': 'restaurant',
  '🍲': 'restaurant',
  '🍜': 'restaurant',
  '🍎': 'apple',
  '🧋': 'cup',
  '🚇': 'subway',
  '🚕': 'taxi',
  '🚲': 'bike',
  '⛽': 'gas-station',
  '🅿️': 'parking',
  '✈️': 'flight-takeoff',
  '🛣️': 'road-map',
  '🚥': 'traffic-light',
  '🧴': 'drop',
  '👕': 't-shirt',
  '📱': 'smartphone',
  '💄': 'palette',
  '🛋️': 'sofa',
  '🛍': 'shopping-bag',
  '💡': 'lightbulb',
  '🏢': 'building',
  '📶': 'wifi',
  '🧹': 'brush',
  '🎮': 'gamepad',
  '🏃': 'run',
  '🏖️': 'sun',
  '🎤': 'mic',
  '💊': 'capsule',
  '🩺': 'stethoscope',
  '📖': 'book-open',
  '🎓': 'graduation-cap',
  '🏫': 'school',
  '🎁': 'gift',
  '💒': 'heart',
  '💸': 'exchange',
  '🛡️': 'shield',
  '🐱': 'emotion-happy',
  '🚬': 'fire',
  '💼': 'briefcase',
  '📈': 'line-chart',
  '💰': 'money-cny-circle',
  '🏆': 'trophy',
  '🏦': 'bank',
  '💵': 'money-cny-box',
  '📁': 'folder',
  '👥': 'team',
  '👶': 'bear-smile',
  '👨‍👩‍👧‍👦': 'group',
  '🎉': 'calendar-event',
  '🔧': 'tools',
  '💬': 'chat-1',
  '🛠️': 'tools',
  'ℹ️': 'information',
  '📤': 'share',
  '📊': 'bar-chart',
  '📄': 'file-list',
  '⚙️': 'settings',
  '✏️': 'edit',
  '❓': 'question',
  '🔗': 'links',
  '➕': 'add',
  '🤖': 'robot',
  '🔵': 'alipay',
  '🟢': 'wechat',
  '🔴': 'bank-card',
  '✓': 'check',
  '▼': 'arrow-down-s'
};

/** 分类名称 -> iconfont 基础名 */
const NAME_ICON_MAP = {
  '餐饮美食': 'restaurant',
  '交通出行': 'car',
  '购物消费': 'shopping-cart',
  '居家生活': 'home',
  '娱乐休闲': 'movie',
  '医疗健康': 'hospital',
  '学习教育': 'book',
  '人情往来': 'gift',
  '金融理财': 'bank-card',
  '其他支出': 'file-text',
  '工作收入': 'briefcase',
  '投资理财': 'line-chart',
  '其他收入': 'file-text',
  '早餐': 'bowl',
  '午餐': 'restaurant',
  '晚餐': 'restaurant',
  '夜宵': 'restaurant',
  '水果零食': 'apple',
  '饮料奶茶': 'cup',
  '公交地铁': 'subway',
  '打车租车': 'taxi',
  '共享单车': 'bike',
  '加油费': 'gas-station',
  '停车费': 'parking',
  '火车机票': 'flight-takeoff',
  '高速通行费': 'road-map',
  '交通违章': 'traffic-light',
  '生活日用': 'drop',
  '衣服鞋帽': 't-shirt',
  '数码电子': 'smartphone',
  '化妆护肤': 'palette',
  '家居用品': 'sofa',
  '旅游纪念': 'shopping-bag',
  '房租房贷': 'home',
  '水电燃气': 'lightbulb',
  '物业费': 'building',
  '宽带网费': 'wifi',
  '家政保洁': 'brush',
  '电影演出': 'movie',
  '游戏充值': 'gamepad',
  '运动健身': 'run',
  '旅游度假': 'sun',
  'KTV唱歌': 'mic',
  '看病挂号': 'hospital',
  '买药': 'capsule',
  '体检': 'stethoscope',
  '书籍资料': 'book-open',
  '培训课程': 'graduation-cap',
  '学费': 'school',
  '红包礼金': 'gift',
  '请客送礼': 'gift',
  '份子钱': 'heart',
  '转账': 'exchange',
  '还款': 'bank-card',
  '保险': 'shield',
  '宠物': 'emotion-happy',
  '烟酒': 'fire',
  '其他': 'file-text',
  '工资薪水': 'money-cny-circle',
  '奖金提成': 'trophy',
  '兼职收入': 'briefcase',
  '投资收益': 'line-chart',
  '租金收入': 'home',
  '利息收入': 'bank',
  '红包收入': 'gift',
  '报销退款': 'money-cny-box',
  '日常消费': 'home',
  '旅行': 'flight-takeoff',
  '装修': 'tools',
  '结婚': 'heart',
  '育儿': 'bear-smile',
  '生意': 'briefcase',
  '家庭': 'group',
  '活动': 'calendar-event'
};

function normalizeEmoji(icon) {
  if (!icon) return '';
  return String(icon).trim();
}

function isIconClass(value) {
  if (!value) return false;
  return /^(ri-|icon-)/.test(value) || APP_ICONS[value] !== undefined;
}

/**
 * 解析为完整 iconfont 类名，如 ri-home-line
 */
export function resolveIconClass({ name, icon, categoryName, filled = false } = {}) {
  let base = '';

  if (name) {
    base = APP_ICONS[name] || name;
  } else if (icon && isIconClass(icon) && !EMOJI_ICON_MAP[icon]) {
    base = icon.replace(/^ri-/, '').replace(/-line$|-fill$/, '');
    if (APP_ICONS[base]) base = APP_ICONS[base];
  } else if (categoryName && NAME_ICON_MAP[categoryName]) {
    base = NAME_ICON_MAP[categoryName];
  } else if (icon) {
    const normalized = normalizeEmoji(icon);
    base = EMOJI_ICON_MAP[normalized] || DEFAULT_ICON;
  } else {
    base = DEFAULT_ICON;
  }

  const suffix = filled ? 'fill' : 'line';
  if (base.startsWith('ri-')) {
    return base.endsWith('-line') || base.endsWith('-fill') ? base : `${base}-${suffix}`;
  }
  return `ri-${base}-${suffix}`;
}

export function resolveBookCategoryIcon(category) {
  const base = BOOK_CATEGORY_ICONS[category] || BOOK_CATEGORY_ICONS[0];
  return `ri-${base}-line`;
}
