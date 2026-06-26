import store from '@/store';

export const LOGIN_REQUIRED_MESSAGE = '需要授权微信登录后才能使用记账等完整功能';

export function isGuestBrowsing() {
  const { token, isGuestMode } = store.state;
  return !token || isGuestMode;
}

export function promptWechatLogin(options = {}) {
  const {
    title = '需要登录',
    content = LOGIN_REQUIRED_MESSAGE,
    confirmText = '去登录',
    cancelText = '取消'
  } = options;

  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
        resolve(!!res.confirm);
      },
      fail: () => resolve(false)
    });
  });
}

export function requireWechatLogin(options = {}) {
  if (!isGuestBrowsing()) {
    return true;
  }
  promptWechatLogin(options);
  return false;
}
