"use strict";
const common_vendor = require("../common/vendor.js");
const utils_iconfontBase64 = require("./iconfontBase64.js");
let loadingPromise = null;
function markIconFontReady() {
  try {
    const app = getApp();
    if (app) {
      app.globalData = app.globalData || {};
      app.globalData.iconFontReady = true;
    }
  } catch (e) {
  }
  common_vendor.index.$emit("iconfont-loaded");
}
function applyFontFace(base64) {
  return new Promise((resolve, reject) => {
    const source = `url("data:font/ttf;charset=utf-8;base64,${base64}")`;
    const options = {
      family: "iconfont",
      source,
      global: true,
      scopes: ["webview", "native"],
      desc: {
        style: "normal",
        weight: "normal",
        variant: "normal"
      },
      success: () => {
        markIconFontReady();
        resolve(true);
      },
      fail: (err) => reject(err)
    };
    if (typeof common_vendor.index.loadFontFace === "function") {
      common_vendor.index.loadFontFace(options);
      return;
    }
    if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.loadFontFace) {
      common_vendor.wx$1.loadFontFace(options);
      return;
    }
    reject(new Error("当前环境不支持 loadFontFace"));
  });
}
function loadIconFont() {
  if (loadingPromise)
    return loadingPromise;
  if (typeof common_vendor.wx$1 === "undefined") {
    loadingPromise = Promise.resolve(true);
    return loadingPromise;
  }
  loadingPromise = applyFontFace(utils_iconfontBase64.ICONFONT_BASE64).catch((err) => {
    common_vendor.index.__f__("error", "at utils/loadIconFont.js:62", "iconfont load failed", err);
    loadingPromise = null;
    throw err;
  });
  return loadingPromise;
}
function isIconFontReady() {
  try {
    const app = getApp();
    return !!(app && app.globalData && app.globalData.iconFontReady);
  } catch (e) {
    return false;
  }
}
exports.isIconFontReady = isIconFontReady;
exports.loadIconFont = loadIconFont;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/loadIconFont.js.map
