/**
 * API 请求封装
 */

const BASE_URL = 'https://www.planor.cn/accountbook/api';
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

function getToken() {
  return uni.getStorageSync('token') || '';
}

function setToken(token) {
  uni.setStorageSync('token', token);
}

function clearToken() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(method, statusCode) {
  const m = (method || 'GET').toUpperCase();
  if (m !== 'GET' && m !== 'HEAD') return false;
  if (!statusCode) return true;
  return statusCode >= 500;
}

/**
 * 请求封装（GET 网络错误自动重试 1 次）
 */
function request(options, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const method = options.method || 'GET';

    uni.request({
      url: BASE_URL + options.url,
      method,
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: async (res) => {
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          resolve(res.data || null);
        } else if (res.statusCode === 401) {
          clearToken();
          uni.setStorageSync('isGuestMode', true);
          reject(new Error('登录已过期，请重新登录'));
        } else if (shouldRetry(method, res.statusCode) && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (retryCount + 1));
          try {
            resolve(await request(options, retryCount + 1));
          } catch (err) {
            reject(err);
          }
        } else {
          const errorMsg = res.data?.message || '请求失败';
          uni.showToast({ title: errorMsg, icon: 'none' });
          reject(new Error(errorMsg));
        }
      },
      fail: async (err) => {
        if (shouldRetry(method) && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (retryCount + 1));
          try {
            resolve(await request(options, retryCount + 1));
          } catch (retryErr) {
            uni.showToast({ title: '网络请求失败', icon: 'none' });
            reject(retryErr);
          }
        } else {
          uni.showToast({ title: '网络请求失败', icon: 'none' });
          reject(err);
        }
      }
    });
  });
}

/**
 * API 接口
 */
export const api = {
  // 认证
  auth: {
    // 微信登录
    wechatLogin(data) {
      return request({
        url: '/auth/wechat-login',
        method: 'POST',
        data
      });
    },
    // 创建体验用户
    guestLogin() {
      return request({
        url: '/auth/guest-login',
        method: 'POST'
      });
    },
    // 更新用户信息
    updateUserInfo(data) {
      return request({
        url: '/auth/user-info',
        method: 'PUT',
        data
      });
    }
  },

  // 账本
  accountBooks: {
    // 获取所有账本
    getList() {
      return request({
        url: '/accountbooks',
        method: 'GET'
      });
    },
    // 获取账本详情
    getById(id) {
      return request({
        url: `/accountbooks/${id}`,
        method: 'GET'
      });
    },
    // 创建账本
    create(data) {
      return request({
        url: '/accountbooks',
        method: 'POST',
        data
      });
    },
    // 更新账本
    update(id, data) {
      return request({
        url: `/accountbooks/${id}`,
        method: 'PUT',
        data
      });
    },
    // 删除账本
    delete(id) {
      return request({
        url: `/accountbooks/${id}`,
        method: 'DELETE'
      });
    },
    // 设置默认账本
    setDefault(id) {
      return request({
        url: `/accountbooks/${id}/set-default`,
        method: 'POST'
      });
    }
  },

  // 一起账本
  sharedAccountBooks: {
    // 创建一起账本
    create(data) {
      return request({
        url: '/sharedaccountbooks',
        method: 'POST',
        data
      });
    },
    // 获取所有一起账本
    getList() {
      return request({
        url: '/sharedaccountbooks',
        method: 'GET'
      });
    },
    // 获取一起账本详情
    getById(id) {
      return request({
        url: `/sharedaccountbooks/${id}`,
        method: 'GET'
      });
    },
    // 更新一起账本
    update(id, data) {
      return request({
        url: `/sharedaccountbooks/${id}`,
        method: 'PUT',
        data
      });
    },
    // 删除一起账本
    delete(id) {
      return request({
        url: `/sharedaccountbooks/${id}`,
        method: 'DELETE'
      });
    },
    // 加入一起账本
    join(data) {
      return request({
        url: '/sharedaccountbooks/join',
        method: 'POST',
        data
      });
    },
    // 退出一起账本
    leave(id) {
      return request({
        url: `/sharedaccountbooks/${id}/leave`,
        method: 'POST'
      });
    },
    // 移除成员
    removeMember(id, memberUserId) {
      return request({
        url: `/sharedaccountbooks/${id}/members/${memberUserId}`,
        method: 'DELETE'
      });
    },
    // 获取统计信息
    getStatistics(id) {
      return request({
        url: `/sharedaccountbooks/${id}/statistics`,
        method: 'GET'
      });
    },
    // 生成报告
    generateReport(id) {
      return request({
        url: `/sharedaccountbooks/${id}/report`,
        method: 'GET'
      });
    }
  },

  // 交易记录
  transactions: {
    // 获取账本的所有交易记录
    getByAccountBook(accountBookId) {
      return request({
        url: `/transactions/account-book/${accountBookId}`,
        method: 'GET'
      });
    },
    // 获取一起账本的所有交易记录（一起账本和个人账本使用相同的接口）
    getBySharedAccountBook(sharedAccountBookId) {
      return request({
        url: `/transactions/account-book/${sharedAccountBookId}`,
        method: 'GET'
      });
    },
    // 按日期范围获取交易记录
    getByDateRange(accountBookId, startDate, endDate) {
      return request({
        url: `/transactions/account-book/${accountBookId}/date-range`,
        method: 'GET',
        data: {
          startDate,
          endDate
        }
      });
    },
    // 昨日 / 今日 / 本周交易金额统计
    getPeriodSummary(accountBookId) {
      return request({
        url: `/transactions/account-book/${accountBookId}/period-summary`,
        method: 'GET'
      });
    },
    getStatisticsOverview(year, month) {
      return request({
        url: `/transactions/statistics/overview?year=${year}&month=${month}`,
        method: 'GET'
      });
    },
    getPersonalBudgetOverview(year, month, personalAccountBookId) {
      let url = `/transactions/statistics/personal-budget?year=${year}&month=${month}`;
      if (personalAccountBookId != null && personalAccountBookId !== '') {
        url += `&personalAccountBookId=${personalAccountBookId}`;
      }
      return request({
        url,
        method: 'GET'
      });
    },
    getCategoryStatisticsTransactions(rootCategoryId, year, month, type) {
      return request({
        url: `/transactions/statistics/category-transactions?rootCategoryId=${rootCategoryId}&year=${year}&month=${month}&type=${type}`,
        method: 'GET'
      });
    },
    // 获取交易记录详情
    getById(id) {
      return request({
        url: `/transactions/${id}`,
        method: 'GET'
      });
    },
    // 创建交易记录
    create(data) {
      return request({
        url: '/transactions',
        method: 'POST',
        data
      });
    },
    // 更新交易记录
    update(id, data) {
      return request({
        url: `/transactions/${id}`,
        method: 'PUT',
        data
      });
    },
    // 删除交易记录
    delete(id) {
      return request({
        url: `/transactions/${id}`,
        method: 'DELETE'
      });
    }
  },

  // 分类
  categories: {
    // 获取分类列表。type: 0-支出 1-收入；accountBookId: 可选，若账本有关联类别则仅返回关联类别
    getList(type, accountBookId) {
      let url = '/categories';
      const params = [];
      if (type !== undefined && type !== null) params.push(`type=${type}`);
      if (accountBookId !== undefined && accountBookId != null) params.push(`accountBookId=${accountBookId}`);
      if (params.length) url += '?' + params.join('&');
      return request({
        url,
        method: 'GET'
      });
    },
    // 获取分类详情
    getById(id) {
      return request({
        url: `/categories/${id}`,
        method: 'GET'
      });
    },
    // 创建分类
    create(data) {
      return request({
        url: '/categories',
        method: 'POST',
        data
      });
    },
    // 更新分类
    update(id, data) {
      return request({
        url: `/categories/${id}`,
        method: 'PUT',
        data
      });
    },
    // 删除分类
    delete(id) {
      return request({
        url: `/categories/${id}`,
        method: 'DELETE'
      });
    },
    // 管理员：获取系统默认分类
    getAdminList(type) {
      let url = '/categories/admin';
      if (type !== undefined && type !== null) url += `?type=${type}`;
      return request({
        url,
        method: 'GET'
      });
    },
    // 管理员：新增系统默认分类
    createAdmin(data) {
      return request({
        url: '/categories/admin',
        method: 'POST',
        data
      });
    },
    // 管理员：更新系统默认分类
    updateAdmin(id, data) {
      return request({
        url: `/categories/admin/${id}`,
        method: 'PUT',
        data
      });
    },
    // 管理员：删除系统默认分类
    deleteAdmin(id) {
      return request({
        url: `/categories/admin/${id}`,
        method: 'DELETE'
      });
    }
  },

  // 账本分类管理（用户自定义、排序）
  accountBookCategories: {
    canManage(bookId) {
      return request({
        url: `/account-books/${bookId}/categories/can-manage`,
        method: 'GET'
      });
    },
    getManageList(bookId, type) {
      return request({
        url: `/account-books/${bookId}/categories/manage?type=${type}`,
        method: 'GET'
      });
    },
    createCustom(bookId, data) {
      return request({
        url: `/account-books/${bookId}/categories/custom`,
        method: 'POST',
        data
      });
    },
    removeFromBook(bookId, categoryId) {
      return request({
        url: `/account-books/${bookId}/categories/${categoryId}`,
        method: 'DELETE'
      });
    },
    reorder(bookId, data) {
      return request({
        url: `/account-books/${bookId}/categories/reorder`,
        method: 'PUT',
        data
      });
    }
  },

  // 支付方式
  paymentMethodTypes: {
    getList() {
      return request({
        url: '/payment-method-types',
        method: 'GET'
      });
    },
    getAdminList() {
      return request({
        url: '/payment-method-types/admin',
        method: 'GET'
      });
    },
    createAdmin(data) {
      return request({
        url: '/payment-method-types/admin',
        method: 'POST',
        data
      });
    },
    updateAdmin(id, data) {
      return request({
        url: `/payment-method-types/admin/${id}`,
        method: 'PUT',
        data
      });
    },
    deleteAdmin(id) {
      return request({
        url: `/payment-method-types/admin/${id}`,
        method: 'DELETE'
      });
    },
    reorderAdmin(data) {
      return request({
        url: '/payment-method-types/admin/reorder',
        method: 'PUT',
        data
      });
    }
  },

  // 账本用途与交易分类关联
  bookPurposeCategories: {
    getPurposes() {
      return request({
        url: '/book-purpose-categories/purposes',
        method: 'GET'
      });
    },
    getByPurpose(purpose) {
      return request({
        url: `/book-purpose-categories/by-purpose/${purpose}`,
        method: 'GET'
      });
    },
    getAdminConfig(purpose) {
      return request({
        url: `/book-purpose-categories/admin/${purpose}`,
        method: 'GET'
      });
    },
    saveAdminConfig(purpose, data) {
      return request({
        url: `/book-purpose-categories/admin/${purpose}`,
        method: 'PUT',
        data
      });
    }
  },

  // 图片上传
  images: {
    // 上传图片；options.contentCheck=true 时启用微信内容安全检测（单据图片）
    upload(filePath, options = {}) {
      return new Promise((resolve, reject) => {
        const token = getToken();
        const query = [];
        if (token) query.push('access_token=' + encodeURIComponent(token));
        if (options.contentCheck) query.push('contentCheck=true');
        let url = BASE_URL + '/images/upload';
        if (query.length) url += '?' + query.join('&');
        uni.uploadFile({
          url: url,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          success: (res) => {
            if (res.statusCode === 401) {
              clearToken();
              uni.setStorageSync('isGuestMode', true);
              reject(new Error('登录已过期，请重新登录'));
              return;
            }
            if (!res.data) {
              reject(new Error(`上传失败(HTTP ${res.statusCode})`));
              return;
            }
            try {
              const data = JSON.parse(res.data);
              if (res.statusCode === 200) {
                resolve(data);
              } else {
                const errorMsg = data?.message || `上传失败(HTTP ${res.statusCode})`;
                reject(new Error(errorMsg));
              }
            } catch (e) {
              console.error('上传响应解析失败', res.statusCode, res.data);
              reject(new Error(`上传失败(HTTP ${res.statusCode})`));
            }
          },
          fail: (err) => {
            console.error('上传失败', err);
            reject(err);
          }
        });
      });
    }
  },

  // AI交易识别
  aiTransaction: {
    // AI识别交易记录
    recognize(data) {
      return request({
        url: '/aitransaction/recognize',
        method: 'POST',
        data
      });
    },
    // 语音识别并生成交易记录
    recognizeVoice(data) {
      return request({
        url: '/aitransaction/recognize-voice',
        method: 'POST',
        data
      });
    },
    submitVoiceRecognitionAsync(data) {
      return request({
        url: '/aitransaction/recognize-voice/async',
        method: 'POST',
        data
      });
    },
    getRecognitionTask(taskId) {
      return request({
        url: `/aitransaction/tasks/${taskId}`,
        method: 'GET'
      });
    }
  },

  // 用户反馈
  feedbacks: {
    // 创建反馈
    create(data) {
      return request({
        url: '/feedbacks',
        method: 'POST',
        data
      });
    },
    // 获取用户反馈列表
    getList() {
      return request({
        url: '/feedbacks',
        method: 'GET'
      });
    },
    // 获取反馈详情
    getById(id) {
      return request({
        url: `/feedbacks/${id}`,
        method: 'GET'
      });
    },
    // 检查是否是管理员
    checkAdmin() {
      return request({
        url: '/feedbacks/admin/check',
        method: 'GET'
      });
    },
    // 管理员获取所有反馈列表
    adminGetList(status) {
      const url = status !== undefined ? `/feedbacks/admin/list?status=${status}` : '/feedbacks/admin/list';
      return request({
        url,
        method: 'GET'
      });
    },
    // 管理员获取反馈详情
    adminGetById(id) {
      return request({
        url: `/feedbacks/admin/${id}`,
        method: 'GET'
      });
    },
    // 管理员处理反馈
    adminProcess(id, data) {
      return request({
        url: `/feedbacks/admin/${id}/process`,
        method: 'PUT',
        data
      });
    }
  },

  // 币种汇率设置
  currencyRates: {
    // 获取所有币种汇率
    getAll() {
      return request({
        url: '/currencyrates',
        method: 'GET'
      });
    },
    // 获取启用的币种汇率
    getEnabled() {
      return request({
        url: '/currencyrates/enabled',
        method: 'GET'
      });
    },
    // 更新单个币种汇率
    update(data) {
      return request({
        url: '/currencyrates',
        method: 'PUT',
        data
      });
    },
    // 批量更新币种汇率
    batchUpdate(data) {
      return request({
        url: '/currencyrates/batch',
        method: 'PUT',
        data
      });
    }
  }
};

export { getToken, setToken, clearToken };
