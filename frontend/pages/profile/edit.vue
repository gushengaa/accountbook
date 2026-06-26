<template>
	<view class="edit-profile-page">

		<!-- 编辑表单 -->
		<view class="edit-form">
			<!-- 头像编辑 -->
			<view class="avatar-section">
				<button 
					class="avatar-edit-btn" 
					open-type="chooseAvatar" 
					@chooseavatar="onChooseAvatar"
					@click="checkAvatarPrivacy"
				>
					<image class="avatar-preview" :src="editUserInfo.avatar" mode="aspectFill" />
				</button>
				<text class="avatar-tip">点击更换头像</text>
			</view>
			
			<!-- 昵称编辑 -->
			<view class="input-section">
				<view class="nickname-row">
					<input 
						class="simple-input nickname-input" 
						type="nickname"
						v-model="editUserInfo.nickname" 
						placeholder="请输入昵称"
						maxlength="20"
						@input="onNicknameInput"
						@confirm="onNicknameConfirm"
						@blur="onNicknameBlur"
					/>				
				</view>
			</view>
		</view>
		
		<!-- 保存按钮 -->
		<view class="save-section">
			<button class="save-btn" @tap="saveProfile">保存资料</button>
		</view>
	</view>
</template>

<script>
import { api } from '@/utils/api';
import { mapState, mapActions } from 'vuex';

export default {
	computed: {
		...mapState(['userInfo'])
	},
	data() {
		return {
			statusBarHeight: 0,
			editUserInfo: {
				nickname: '',
				avatar: '',
				signature: ''
			}
		}
	},
	
	created() {
		const info = uni.getSystemInfoSync()
		this.statusBarHeight = info.statusBarHeight || 20
		
		this.loadUserInfo()
	},
	
	onShow() {
		console.log('编辑资料页面显示，重新加载数据')
		this.loadUserInfo()
	},
	
	methods: {
		// 检查头像隐私授权
		checkAvatarPrivacy() {
			console.log('检查头像隐私授权状态')
			
			// 延迟检查，避免与点击事件冲突
			setTimeout(() => {
				if (typeof wx !== 'undefined' && wx.getPrivacySetting) {
					wx.getPrivacySetting({
						success: (res) => {
							console.log('隐私设置检查结果:', res)
							if (res.needAuthorization) {
								console.log('需要用户授权，主动唤起隐私确认弹窗')
								if (wx.requirePrivacyAuthorize) {
									wx.requirePrivacyAuthorize({
										success: () => {
											console.log('用户同意隐私授权')
										},
										fail: (err) => {
											console.log('用户拒绝隐私授权:', err)
										}
									})
								}
							} else {
								console.log('用户已授权或无需授权')
							}
						},
						fail: (err) => {
							console.log('获取隐私设置失败:', err)
						}
					})
				} else {
					console.log('当前环境不支持隐私设置API')
				}
			}, 500)
		},

		// 加载用户信息
		loadUserInfo() {
			if (this.userInfo) {
				this.editUserInfo = {
					nickname: this.userInfo.nickName || '',
					avatar: this.userInfo.avatarUrl || '/static/default-avatar.png',
					signature: ''
				}
			} else {
				this.editUserInfo = {
					nickname: '',
					avatar: '/static/default-avatar.png',
					signature: ''
				}
			}
		},

		// 选择头像
		onChooseAvatar(e) {
			console.log('头像选择事件触发:', e)
			
			if (e && e.detail && e.detail.avatarUrl) {
				const tempFilePath = e.detail.avatarUrl
				console.log('获取到头像路径:', tempFilePath)
				
				// 直接使用用户选择的头像
				this.editUserInfo.avatar = tempFilePath
				

			
				// uni.showToast({
				// 	title: '头像已选择',
				// 	icon: 'success'
				// })
								
				
			} else {
				console.log('头像选择事件数据异常:', e)
				// 不显示错误提示，用户可能取消了选择
			}
		},


		// 昵称输入事件
		onNicknameInput(e) {
			const value = e.detail ? e.detail.value : e.target.value
			this.editUserInfo.nickname = value
		},

		// 昵称确认事件（回车键）
		onNicknameConfirm(e) {
			const value = e.detail ? e.detail.value : e.target.value
			if (value && value.trim()) {
				this.editUserInfo.nickname = value.trim()
			}
		},

		// 昵称失焦事件
		onNicknameBlur(e) {
			const value = e.detail ? e.detail.value : e.target.value
			if (value && value.trim()) {
				this.editUserInfo.nickname = value.trim()
			}
		},

		// 获取微信昵称
		getWeChatNickname() {
			console.log('点击获取微信昵称')
			
			// 尝试使用微信小程序的新API获取昵称
			if (typeof uni.getUserNickname === 'function') {
				console.log('尝试使用 getUserNickname')
				uni.getUserNickname({
					success: (res) => {
						console.log('getUserNickname 成功:', res)
						if (res.nickName) {
							this.userInfo.nickname = res.nickName
							uni.showToast({
								title: '获取微信昵称成功',
								icon: 'success'
							})
						}
					},
					fail: (err) => {
						console.log('getUserNickname 失败:', err)
						this.showNicknameInputModal()
					}
				})
			} else {
				console.log('getUserNickname 不可用，使用备选方案')
				this.showNicknameInputModal()
			}
		},

		// 显示昵称输入弹窗1
		showNicknameInputModal() {
			uni.showModal({
				title: '设置昵称',
				editable: true,
				placeholderText: '请输入您的昵称',
				confirmText: '保存',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm && res.content && res.content.trim()) {
						this.userInfo.nickname = res.content.trim()
						uni.showToast({
							title: '昵称设置成功',
							icon: 'success'
						})
					}
				}
			})
		},

		// 返回上一页
		goBack() {
			uni.navigateBack()
		},

		// 保存资料
		async saveProfile() {
			try {
				uni.showLoading({
					title: '保存中...'
				})
				
				// 检查头像是否是临时文件路径
				const avatarUrl = this.editUserInfo.avatar
				let finalAvatarUrl = avatarUrl
				
				// 如果是临时文件路径，需要先上传				
				if (avatarUrl && (avatarUrl.indexOf('//tmp') > 0 || avatarUrl.indexOf('http://tmp') >= 0)) {
					try {
						finalAvatarUrl = await this.uploadAvatarFile(avatarUrl)
					} catch (uploadError) {
						console.error('头像上传失败:', uploadError)
						// 检查是否是登录过期错误
						if (uploadError.message && uploadError.message.includes('登录已过期')) {
							uni.hideLoading()
							// 不显示错误提示，因为api.js已经跳转到登录页了
							return
						}
						throw new Error('头像上传失败: ' + uploadError.message)
					}
				}
				
				// 准备保存的数据
				const saveData = {
					nickName: this.editUserInfo.nickname,
					avatarUrl: finalAvatarUrl
				}
				
				// 调用 API 更新用户信息
				let updatedUser
				try {
					updatedUser = await api.auth.updateUserInfo(saveData)
				} catch (updateError) {
					console.error('更新用户信息失败:', updateError)
					// 检查是否是登录过期错误
					if (updateError.message && updateError.message.includes('登录已过期')) {
						uni.hideLoading()
						// 不显示错误提示，因为api.js已经跳转到登录页了
						return
					}
					throw updateError
				}
				
				// 更新 Vuex 中的用户信息（只更新用户信息，不更新token）
				this.$store.commit('SET_USER_INFO', {
					id: updatedUser.id,
					nickName: updatedUser.nickName,
					avatarUrl: updatedUser.avatarUrl,
					phoneNumber: updatedUser.phoneNumber
				})
				
				uni.hideLoading()
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				})
				
				// 延迟跳转，确保用户看到成功提示
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				console.error('保存失败:', error)
				uni.hideLoading()
				// 如果是登录过期错误，不显示错误提示，因为api.js已经跳转到登录页了
				if (error.message && error.message.includes('登录已过期')) {
					return
				}
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none',
					duration: 3000
				})
			}
		},

		// 上传头像文件到服务器
		async uploadAvatarFile(filePath) {
			try {
				const result = await api.images.upload(filePath, { contentCheck: true })
				return result.imageUrl
			} catch (error) {
				console.error('头像上传失败:', error)
				throw error
			}
		}
	}
}
</script>

<style scoped>
.edit-profile-page {
	min-height: 100vh;
	background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
	background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
	position: sticky;
	top: 0;
	z-index: 100;
}

.navbar-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 32rpx;
}

.nav-left, .nav-right {
	width: 120rpx;
	display: flex;
	justify-content: center;
}

.nav-icon {
	font-size: 36rpx;
	color: #fff;
	font-weight: bold;
}

.nav-title {
	font-size: 32rpx;
	color: #fff;
	font-weight: 600;
}


/* 编辑表单 */
.edit-form {
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40rpx;
}

/* 头像编辑 */
.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.avatar-edit-btn {
	background: transparent;
	border: none;
	padding: 0;
	margin: 0;
}

.avatar-preview {
	width: 160rpx;
	height: 160rpx;
	border-radius: 80rpx;
	border: 4rpx solid #f0f0f0;
}

.avatar-tip {
	font-size: 26rpx;
	color: #666;
	margin-top: 20rpx;
}

/* 输入区域 */
.input-section {
	width: 100%;
}

.simple-input {
	width: 100%;
	height: 88rpx;
	border: none;
	border-bottom: 2rpx solid #e0e0e0;
	padding: 0 20rpx;
	font-size: 30rpx;
	color: #333;
	background: transparent;
}

.simple-input:focus {
	border-bottom-color: #4CAF50;
}

/* 昵称行布局 */
.nickname-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.nickname-input {
	flex: 1;
}

.get-wechat-nickname-btn {
	background: rgba(102, 126, 234, 0.1);
	border: 2rpx solid rgba(102, 126, 234, 0.3);
	border-radius: 8rpx;
	color: #F5A623;
	font-size: 24rpx;
	padding: 12rpx 20rpx;
	white-space: nowrap;
	transition: all 0.3s ease;
}

.get-wechat-nickname-btn:active {
	background: rgba(102, 126, 234, 0.2);
	transform: scale(0.95);
}

/* 保存按钮区域 */
.save-section {
	padding: 40rpx;
	display: flex;
	justify-content: center;
}

.save-btn {
	width: 100%;
	height: 88rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
	color: #fff;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	border-radius: 44rpx;
	box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
}

.save-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 8rpx rgba(102, 126, 234, 0.4);
}
</style>
