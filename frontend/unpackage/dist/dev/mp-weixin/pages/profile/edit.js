"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  computed: {
    ...common_vendor.mapState(["userInfo"])
  },
  data() {
    return {
      statusBarHeight: 0,
      editUserInfo: {
        nickname: "",
        avatar: "",
        signature: ""
      }
    };
  },
  created() {
    const info = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = info.statusBarHeight || 20;
    this.loadUserInfo();
  },
  onShow() {
    common_vendor.index.__f__("log", "at pages/profile/edit.vue:70", "编辑资料页面显示，重新加载数据");
    this.loadUserInfo();
  },
  methods: {
    // 检查头像隐私授权
    checkAvatarPrivacy() {
      common_vendor.index.__f__("log", "at pages/profile/edit.vue:77", "检查头像隐私授权状态");
      setTimeout(() => {
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.getPrivacySetting) {
          common_vendor.wx$1.getPrivacySetting({
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/profile/edit.vue:84", "隐私设置检查结果:", res);
              if (res.needAuthorization) {
                common_vendor.index.__f__("log", "at pages/profile/edit.vue:86", "需要用户授权，主动唤起隐私确认弹窗");
                if (common_vendor.wx$1.requirePrivacyAuthorize) {
                  common_vendor.wx$1.requirePrivacyAuthorize({
                    success: () => {
                      common_vendor.index.__f__("log", "at pages/profile/edit.vue:90", "用户同意隐私授权");
                    },
                    fail: (err) => {
                      common_vendor.index.__f__("log", "at pages/profile/edit.vue:93", "用户拒绝隐私授权:", err);
                    }
                  });
                }
              } else {
                common_vendor.index.__f__("log", "at pages/profile/edit.vue:98", "用户已授权或无需授权");
              }
            },
            fail: (err) => {
              common_vendor.index.__f__("log", "at pages/profile/edit.vue:102", "获取隐私设置失败:", err);
            }
          });
        } else {
          common_vendor.index.__f__("log", "at pages/profile/edit.vue:106", "当前环境不支持隐私设置API");
        }
      }, 500);
    },
    // 加载用户信息
    loadUserInfo() {
      if (this.userInfo) {
        this.editUserInfo = {
          nickname: this.userInfo.nickName || "",
          avatar: this.userInfo.avatarUrl || "/static/default-avatar.png",
          signature: ""
        };
      } else {
        this.editUserInfo = {
          nickname: "",
          avatar: "/static/default-avatar.png",
          signature: ""
        };
      }
    },
    // 选择头像
    onChooseAvatar(e) {
      common_vendor.index.__f__("log", "at pages/profile/edit.vue:130", "头像选择事件触发:", e);
      if (e && e.detail && e.detail.avatarUrl) {
        const tempFilePath = e.detail.avatarUrl;
        common_vendor.index.__f__("log", "at pages/profile/edit.vue:134", "获取到头像路径:", tempFilePath);
        this.editUserInfo.avatar = tempFilePath;
      } else {
        common_vendor.index.__f__("log", "at pages/profile/edit.vue:148", "头像选择事件数据异常:", e);
      }
    },
    // 昵称输入事件
    onNicknameInput(e) {
      const value = e.detail ? e.detail.value : e.target.value;
      this.editUserInfo.nickname = value;
    },
    // 昵称确认事件（回车键）
    onNicknameConfirm(e) {
      const value = e.detail ? e.detail.value : e.target.value;
      if (value && value.trim()) {
        this.editUserInfo.nickname = value.trim();
      }
    },
    // 昵称失焦事件
    onNicknameBlur(e) {
      const value = e.detail ? e.detail.value : e.target.value;
      if (value && value.trim()) {
        this.editUserInfo.nickname = value.trim();
      }
    },
    // 获取微信昵称
    getWeChatNickname() {
      common_vendor.index.__f__("log", "at pages/profile/edit.vue:178", "点击获取微信昵称");
      if (typeof common_vendor.index.getUserNickname === "function") {
        common_vendor.index.__f__("log", "at pages/profile/edit.vue:182", "尝试使用 getUserNickname");
        common_vendor.index.getUserNickname({
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/profile/edit.vue:185", "getUserNickname 成功:", res);
            if (res.nickName) {
              this.userInfo.nickname = res.nickName;
              common_vendor.index.showToast({
                title: "获取微信昵称成功",
                icon: "success"
              });
            }
          },
          fail: (err) => {
            common_vendor.index.__f__("log", "at pages/profile/edit.vue:195", "getUserNickname 失败:", err);
            this.showNicknameInputModal();
          }
        });
      } else {
        common_vendor.index.__f__("log", "at pages/profile/edit.vue:200", "getUserNickname 不可用，使用备选方案");
        this.showNicknameInputModal();
      }
    },
    // 显示昵称输入弹窗1
    showNicknameInputModal() {
      common_vendor.index.showModal({
        title: "设置昵称",
        editable: true,
        placeholderText: "请输入您的昵称",
        confirmText: "保存",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm && res.content && res.content.trim()) {
            this.userInfo.nickname = res.content.trim();
            common_vendor.index.showToast({
              title: "昵称设置成功",
              icon: "success"
            });
          }
        }
      });
    },
    // 返回上一页
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 保存资料
    async saveProfile() {
      try {
        common_vendor.index.showLoading({
          title: "保存中..."
        });
        const avatarUrl = this.editUserInfo.avatar;
        let finalAvatarUrl = avatarUrl;
        if (avatarUrl && (avatarUrl.indexOf("//tmp") > 0 || avatarUrl.indexOf("http://tmp") >= 0)) {
          try {
            finalAvatarUrl = await this.uploadAvatarFile(avatarUrl);
          } catch (uploadError) {
            common_vendor.index.__f__("error", "at pages/profile/edit.vue:246", "头像上传失败:", uploadError);
            if (uploadError.message && uploadError.message.includes("登录已过期")) {
              common_vendor.index.hideLoading();
              return;
            }
            throw new Error("头像上传失败: " + uploadError.message);
          }
        }
        const saveData = {
          nickName: this.editUserInfo.nickname,
          avatarUrl: finalAvatarUrl
        };
        let updatedUser;
        try {
          updatedUser = await utils_api.api.auth.updateUserInfo(saveData);
        } catch (updateError) {
          common_vendor.index.__f__("error", "at pages/profile/edit.vue:268", "更新用户信息失败:", updateError);
          if (updateError.message && updateError.message.includes("登录已过期")) {
            common_vendor.index.hideLoading();
            return;
          }
          throw updateError;
        }
        this.$store.commit("SET_USER_INFO", {
          id: updatedUser.id,
          nickName: updatedUser.nickName,
          avatarUrl: updatedUser.avatarUrl,
          phoneNumber: updatedUser.phoneNumber
        });
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/edit.vue:298", "保存失败:", error);
        common_vendor.index.hideLoading();
        if (error.message && error.message.includes("登录已过期")) {
          return;
        }
        common_vendor.index.showToast({
          title: error.message || "保存失败",
          icon: "none",
          duration: 3e3
        });
      }
    },
    // 上传头像文件到服务器
    async uploadAvatarFile(filePath) {
      try {
        const result = await utils_api.api.images.upload(filePath, { contentCheck: true });
        return result.imageUrl;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/edit.vue:318", "头像上传失败:", error);
        throw error;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.editUserInfo.avatar,
    b: common_vendor.o((...args) => $options.onChooseAvatar && $options.onChooseAvatar(...args), "46"),
    c: common_vendor.o((...args) => $options.checkAvatarPrivacy && $options.checkAvatarPrivacy(...args), "74"),
    d: common_vendor.o([($event) => $data.editUserInfo.nickname = $event.detail.value, (...args) => $options.onNicknameInput && $options.onNicknameInput(...args)], "c0"),
    e: common_vendor.o((...args) => $options.onNicknameConfirm && $options.onNicknameConfirm(...args), "79"),
    f: common_vendor.o((...args) => $options.onNicknameBlur && $options.onNicknameBlur(...args), "ad"),
    g: $data.editUserInfo.nickname,
    h: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args), "ab")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ead3e541"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/edit.js.map
