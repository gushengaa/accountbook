/**
 * 微信小程序加载 iconfont（内嵌 base64，避免本地 ttf 路径被拦截）
 */
import { ICONFONT_BASE64 } from './iconfontBase64';

let loadingPromise = null;

function markIconFontReady() {
  try {
    const app = getApp();
    if (app) {
      app.globalData = app.globalData || {};
      app.globalData.iconFontReady = true;
    }
  } catch (e) {
    /* ignore */
  }
  uni.$emit('iconfont-loaded');
}

function applyFontFace(base64) {
  return new Promise((resolve, reject) => {
    const source = `url("data:font/ttf;charset=utf-8;base64,${base64}")`;
    const options = {
      family: 'iconfont',
      source,
      global: true,
      scopes: ['webview', 'native'],
      desc: {
        style: 'normal',
        weight: 'normal',
        variant: 'normal'
      },
      success: () => {
        markIconFontReady();
        resolve(true);
      },
      fail: (err) => reject(err)
    };

    if (typeof uni.loadFontFace === 'function') {
      uni.loadFontFace(options);
      return;
    }
    if (typeof wx !== 'undefined' && wx.loadFontFace) {
      wx.loadFontFace(options);
      return;
    }
    reject(new Error('当前环境不支持 loadFontFace'));
  });
}

export function loadIconFont() {
  if (loadingPromise) return loadingPromise;

  if (typeof wx === 'undefined') {
    loadingPromise = Promise.resolve(true);
    return loadingPromise;
  }

  loadingPromise = applyFontFace(ICONFONT_BASE64).catch((err) => {
    console.error('iconfont load failed', err);
    loadingPromise = null;
    throw err;
  });

  return loadingPromise;
}

export function isIconFontReady() {
  try {
    const app = getApp();
    return !!(app && app.globalData && app.globalData.iconFontReady);
  } catch (e) {
    return false;
  }
}
