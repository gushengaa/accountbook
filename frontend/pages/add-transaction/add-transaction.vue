<template>
  <view class="add-transaction-container">
    <!-- 顶部：支出/收入 -->
    <view class="page-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-side header-side-left">
        <view class="header-back-btn" @click="cancelAdd">
          <text class="header-back-icon">‹</text>
        </view>
      </view>
      <view class="header-tabs">
        <view
          class="header-tab"
          :class="{ active: transactionType === 0 }"
          @click="transactionType = 0"
        >
          <text class="header-tab-text">支出</text>
        </view>
        <view
          class="header-tab"
          :class="{ active: transactionType === 1 }"
          @click="transactionType = 1"
        >
          <text class="header-tab-text">收入</text>
        </view>
      </view>
      <view class="header-side header-side-right"></view>
    </view>

    <!-- 账本简要信息 -->
    <view class="book-strip" v-if="displayAccountBook" @click="openBookPicker">
      <app-icon :icon="getCategoryIcon(displayAccountBook.category)" :size="16" color="#666666" />
      <text class="book-strip-name">{{ displayAccountBook.name }}</text>
      <text class="book-strip-tag">{{ displayAccountBook.type === 1 ? '一起记' : '个人' }}</text>
      <text class="book-strip-change">切换</text>
    </view>

    <!-- 分类网格（4列圆形图标） -->
    <scroll-view scroll-y class="category-scroll" :show-scrollbar="false">
      <view class="category-grid">
        <view
          v-for="item in categoryGridItems"
          :key="item.category.id"
          class="grid-category-item"
          :class="{ selected: isCategorySelected(item.category.id) }"
          @tap.stop="selectFrequentCategory(item)"
        >
          <view class="grid-icon-circle">
            <app-icon
              :icon="item.category.icon || '📝'"
              :category-name="item.category.name"
              :size="22"
              :color="isCategorySelected(item.category.id) ? '#333333' : '#666666'"
            />
          </view>
          <text class="grid-category-name">{{ item.category.name }}</text>
        </view>
        <view class="grid-category-item grid-more-item" @tap.stop="openCategoryDrawer">
          <view class="grid-icon-circle">
            <app-icon name="list" :size="22" color="#666666" />
          </view>
          <text class="grid-category-name">更多</text>
        </view>
        <view
          v-if="canManageBookCategories"
          class="grid-category-item grid-more-item"
          @tap.stop="openCustomCategoryFromGrid"
        >
          <view class="grid-icon-circle">
            <app-icon name="plusempty" :size="22" color="#F5A623" />
          </view>
          <text class="grid-category-name">添加分类</text>
        </view>
      </view>
    </scroll-view>

    <!-- 支付+金额 / 备注+单据 -->
    <view class="input-panel">
      <view class="input-bar input-bar-top">
        <view v-if="transactionType === 0" class="input-bar-payment">
          <app-icon name="shop" :size="18" color="#999999" />
          <text v-if="currentSpendingChannel" class="input-bar-meta-text">{{ currentSpendingChannel.name }}</text>
          <text class="input-bar-meta-btn" @click="openChannelDialog">修改</text>
        </view>
        <view class="input-bar-amount">
          <text class="amount-expression">{{ amountExpression || '0' }}</text>
          <view class="amount-cursor"></view>
        </view>
      </view>

      <view class="input-bar input-bar-bottom">
        <view class="input-bar-remark">
          <app-icon name="book" :size="18" color="#999999" />
          <text class="input-bar-meta-text">{{ remark }}</text>
          <text class="input-bar-meta-btn" @click="openRemarkDialog">{{ remark ? '修改' : '添加备注' }}</text>
        </view>
        <scroll-view
          v-if="transactionType === 0"
          scroll-x
          class="input-meta-scroll input-meta-scroll-receipt"
          :show-scrollbar="false"
        >
          <view class="receipt-inline-list">
            <view v-for="(image, index) in images" :key="index" class="receipt-inline-item">
              <image :src="image.displayUrl" mode="aspectFill" class="receipt-inline-image" @click="previewImage(index)" />
              <view class="receipt-inline-delete" @click.stop="removeImage(index)"><text>×</text></view>
            </view>
            <view v-if="images.length < 9" class="receipt-inline-upload" @click="chooseImage">
              <app-icon name="image" :size="18" color="#2064f5a8" />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 分摊对象（一起账本支出，键盘上方） -->
    <view v-if="showAllocationBar" class="keypad-allocation-bar">
      <view class="keypad-allocation-label">
        <app-icon name="team" :size="18" color="#999999" />
        <!-- <text>分摊</text> -->
      </view>
      <scroll-view scroll-x class="keypad-allocation-scroll" :show-scrollbar="false">
        <view class="keypad-allocation-list">
          <view
            v-for="member in allocationMembers"
            :key="member.userId"
            class="keypad-allocation-item"
            :class="{ selected: isAllocationSelected(member.userId) }"
            @click="toggleAllocation(member.userId)"
          >
            <image
              v-if="member.userAvatar"
              class="keypad-allocation-avatar"
              :src="member.userAvatar"
              mode="aspectFill"
            />
            <view v-else class="keypad-allocation-avatar placeholder">
              {{ (member.userName || '?').charAt(0) }}
            </view>
            <text class="keypad-allocation-name">{{ member.userName || '成员' }}</text>
            <!-- <view v-if="isAllocationSelected(member.userId)" class="keypad-allocation-check">
              <app-icon name="checkmarkempty" :size="10" color="#F5A623" />
            </view> -->
          </view>
        </view>
      </scroll-view>
      <text class="keypad-allocation-summary">{{ selectedAllocationCount }}人分摊</text>
    </view>

    <!-- 自定义数字键盘 -->
    <view class="keypad">
      <view class="keypad-row">
        <view class="keypad-key" @click="onKeypadPress('1')"><text>1</text></view>
        <view class="keypad-key" @click="onKeypadPress('2')"><text>2</text></view>
        <view class="keypad-key" @click="onKeypadPress('3')"><text>3</text></view>
        <view class="keypad-key keypad-key-op keypad-key-date">
          <view class="keypad-date-inner">
            <app-icon name="calendar" :size="22" color="#666666" />
            <text>{{ dateKeypadLabel }}</text>
          </view>
          <picker mode="date" class="keypad-date-picker" :value="transactionDate" @change="onDateChange">
            <view class="keypad-date-picker-hit"></view>
          </picker>
        </view>
      </view>
      <view class="keypad-row">
        <view class="keypad-key" @click="onKeypadPress('4')"><text>4</text></view>
        <view class="keypad-key" @click="onKeypadPress('5')"><text>5</text></view>
        <view class="keypad-key" @click="onKeypadPress('6')"><text>6</text></view>
        <view class="keypad-key keypad-key-op" @click="onKeypadPress('+')"><text>+</text></view>
      </view>
      <view class="keypad-row">
        <view class="keypad-key" @click="onKeypadPress('7')"><text>7</text></view>
        <view class="keypad-key" @click="onKeypadPress('8')"><text>8</text></view>
        <view class="keypad-key" @click="onKeypadPress('9')"><text>9</text></view>
        <view class="keypad-key keypad-key-op" @click="onKeypadPress('-')"><text>-</text></view>
      </view>
      <view class="keypad-row">
        <view class="keypad-key" @click="onKeypadPress('.')"><text>.</text></view>
        <view class="keypad-key" @click="onKeypadPress('0')"><text>0</text></view>
        <view class="keypad-key" @click="onKeypadPress('back')">
          <app-icon name="delete-bin" :size="22" color="#333333" />
        </view>
        <view
          class="keypad-key keypad-key-save"
          :class="{ disabled: isAccountBookEnded || saving }"
          @click="saveTransaction"
        >
          <text>{{ saving ? '...' : (isAccountBookEnded ? '已结束' : '保存') }}</text>
        </view>
      </view>
    </view>

    <!-- 更多选项抽屉（支付/票据/分摊/语音） -->
    <view v-if="showExtrasDrawer" class="extras-drawer-mask" @click="closeExtrasDrawer">
      <view class="extras-drawer-panel" @click.stop>
        <view class="extras-drawer-header">
          <text class="extras-drawer-title">更多选项</text>
          <text class="extras-drawer-close" @click="closeExtrasDrawer">×</text>
        </view>
        <scroll-view scroll-y class="extras-drawer-body" :show-scrollbar="false">
          <view class="currency-inline-bar" v-if="currencies.length > 0">
            <text class="section-title">币种</text>
            <scroll-view class="currency-inline-scroll" scroll-x :show-scrollbar="false">
              <view class="currency-inline-list">
                <view
                  v-for="currency in currencies"
                  :key="currency.value"
                  class="currency-chip"
                  :class="{ selected: selectedCurrency === currency.value }"
                  @click="selectCurrency(currency.value)"
                >
                  <text class="currency-chip-symbol">{{ currency.symbol }}</text>
                  <text class="currency-chip-name">{{ currency.name }}</text>
                </view>
              </view>
            </scroll-view>
          </view>

          <view class="extras-voice-row" @click="openVoiceFromExtras">
            <app-icon name="mic" :size="20" color="#F5A623" />
            <text>语音记账</text>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <!-- AI识别结果确认对话框 -->
    <view v-if="showAiConfirmDialog" class="dialog-mask" @click="showAiConfirmDialog = false">
      <view class="dialog-content ai-confirm-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">确认交易信息</text>
          <text class="dialog-close" @click="showAiConfirmDialog = false">×</text>
        </view>
        <view class="dialog-body">
          <view class="ai-result-item">
            <text class="ai-result-label">类型：</text>
            <text class="ai-result-value">{{ aiRecognizedResult?.type === 0 ? '支出' : '收入' }}</text>
          </view>
          <view class="ai-result-item">
            <text class="ai-result-label">金额：</text>
            <text class="ai-result-value amount">¥{{ aiRecognizedResult?.amount?.toFixed(2) }}</text>
          </view>
          <view class="ai-result-item">
            <text class="ai-result-label">分类：</text>
            <view class="ai-result-category">
              <view class="category-icon-small" :style="{ backgroundColor: aiRecognizedResult?.categoryColor || '#AA96DA' }">
                <app-icon :icon="aiRecognizedResult?.categoryIcon || '📝'" :category-name="aiRecognizedResult?.categoryName" :size="16" color="#FFFFFF" />
              </view>
              <text class="ai-result-value">{{ aiRecognizedResult?.categoryName }}</text>
            </view>
          </view>
          <view v-if="aiRecognizedResult?.remark" class="ai-result-item">
            <text class="ai-result-label">备注：</text>
            <text class="ai-result-value">{{ aiRecognizedResult.remark }}</text>
          </view>
          <view v-if="aiRecognizedResult?.transactionDate" class="ai-result-item">
            <text class="ai-result-label">日期：</text>
            <text class="ai-result-value">{{ formatDate(aiRecognizedResult.transactionDate) }}</text>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn cancel" @click="showAiConfirmDialog = false" :plain="true" :disabled="saving">取消</button>
          <button class="dialog-btn confirm" @click="confirmAiResult" :plain="true" :loading="saving" :disabled="saving">{{ saving ? '提交中...' : '确认' }}</button>
        </view>
      </view>
    </view>
    
    <!-- 语音输入弹窗 -->
    <view v-if="showVoiceDialog" class="voice-dialog-mask" @click="closeVoiceDialog">
      <view class="voice-dialog-content" @click.stop>
        <view class="voice-dialog-header">
          <view class="voice-dialog-icons">
            <app-icon class="voice-dialog-icon" name="gear" :size="20" color="#666666" @click="showVoiceSettings" />
            <app-icon class="voice-dialog-icon" name="help" :size="20" color="#666666" @click="showVoiceHelp" />
          </view>
          <text class="voice-dialog-close" @click="closeVoiceDialog">×</text>
        </view>
        
        <view class="voice-dialog-body">
          <view class="voice-suggestions">
            <text class="voice-suggestion-text">可以试试对我说</text>
            <view class="voice-suggestion-tags">
              <view class="voice-tag">今天早餐花费20元</view>
              <view class="voice-tag">昨天打车花了35.5元</view>
              <view class="voice-tag">收到工资5000元</view>
            </view>
          </view>
          
          <view class="voice-input-area">
            <view class="voice-status-text recording">
              正在录音...
            </view>
            <text class="voice-hint-text">点击下方按钮结束录音</text>
            
            <view 
              class="voice-record-btn recording"
              @click="stopRecording"
            >
              <view class="voice-waves">
                <view class="voice-wave" v-for="n in 5" :key="n" :style="{ animationDelay: (n - 1) * 0.15 + 's' }"></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 全部分类抽屉（左侧滑出） -->
    <view v-if="showCategoryDrawer" class="category-drawer-mask" @click="closeCategoryDrawer">
      <view class="category-drawer-panel" @click.stop>
        <scroll-view scroll-y class="category-drawer-scroll" :show-scrollbar="false">
          <view
            v-for="parent in categories"
            :key="parent.id"
            class="category-group"
          >
            <view class="category-group-header">
              <text class="group-header-name">{{ parent.name }}</text>
            </view>
            <view class="category-group-children">
              <template v-if="parent.children && parent.children.length">
                <view
                  v-for="child in parent.children"
                  :key="child.id"
                  class="grid-category-item"
                  :class="{ selected: isDrawerCategorySelected(child.id) }"
                  @tap.stop="selectDrawerCategory({ category: child, parent })"
                >
                  <view class="grid-icon-circle">
                    <app-icon
                      :icon="child.icon || '📝'"
                      :category-name="child.name"
                      :size="22"
                      :color="isDrawerCategorySelected(child.id) ? '#333333' : '#666666'"
                    />
                  </view>
                  <text class="grid-category-name">{{ child.name }}</text>
                </view>
              </template>
              <view
                v-else
                class="grid-category-item"
                :class="{ selected: isDrawerCategorySelected(parent.id) }"
                @tap.stop="selectDrawerCategory({ category: parent, parent })"
              >
                <view class="grid-icon-circle">
                  <app-icon
                    :icon="parent.icon || '📝'"
                    :category-name="parent.name"
                    :size="22"
                    :color="isDrawerCategorySelected(parent.id) ? '#333333' : '#666666'"
                  />
                </view>
                <text class="grid-category-name">{{ parent.name }}</text>
              </view>
            </view>
          </view>
          <view class="category-drawer-scroll-pad"></view>
        </scroll-view>
        <view class="category-drawer-footer category-drawer-footer-dual">
          <button
            v-if="canManageBookCategories"
            class="category-drawer-manage-btn"
            @click="openCustomCategoryDrawer"
          >管理分类</button>
          <button
            class="category-drawer-confirm-btn"
            :class="{ active: drawerSelectedCategoryId != null }"
            @click="confirmDrawerCategory"
          >确认</button>
        </view>
      </view>
    </view>

    <!-- 自定义分类管理抽屉 -->
    <view v-if="showCustomCategoryDrawer" class="category-drawer-mask" @click="closeCustomCategoryDrawer">
      <view class="category-drawer-panel custom-category-panel" @click.stop>
        <view class="custom-category-header">
          <text class="custom-category-title">管理分类</text>
          <text class="custom-category-close" @click="closeCustomCategoryDrawer">×</text>
        </view>
        <view v-if="manageCategoryLoading" class="custom-category-loading">
          <text>加载中...</text>
        </view>
        <scroll-view v-else scroll-y class="custom-category-scroll" :show-scrollbar="false">
          <view
            v-for="(item, index) in manageCategoryList"
            :key="item.id"
            class="custom-category-row"
          >
            <view class="custom-category-sort">
              <text class="sort-btn" :class="{ disabled: index === 0 }" @click="moveManageCategory(index, -1)">↑</text>
              <text class="sort-btn" :class="{ disabled: index === manageCategoryList.length - 1 }" @click="moveManageCategory(index, 1)">↓</text>
            </view>
            <view class="custom-category-icon" :style="{ backgroundColor: item.color || '#F5F5F5' }">
              <app-icon :icon="item.icon || '📝'" :category-name="item.name" :size="18" color="#FFFFFF" />
            </view>
            <view class="custom-category-info">
              <text class="custom-category-name">{{ item.name }}</text>
              <text class="custom-category-meta">{{ item.parentName || '分类' }}{{ item.isUserCustom ? ' · 自定义' : '' }}</text>
            </view>
            <text
              v-if="!item.isUsed"
              class="custom-category-delete"
              @click="confirmDeleteManageCategory(item)"
            >删除</text>
            <text v-else class="custom-category-used">已使用</text>
          </view>
          <view class="custom-category-scroll-pad"></view>
        </scroll-view>
        <view class="category-drawer-footer custom-category-footer">
          <button class="custom-category-add-btn" @click="openCustomCategoryForm">+ 添加自定义分类</button>
          <button class="category-drawer-confirm-btn active" @click="closeCustomCategoryDrawer">完成</button>
        </view>
      </view>
    </view>

    <!-- 添加自定义分类弹窗 -->
    <view v-if="showCustomCategoryForm" class="dialog-mask custom-category-form-mask" @click="closeCustomCategoryForm">
      <view class="dialog-content remark-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">添加自定义分类</text>
          <text class="dialog-close" @click="closeCustomCategoryForm">×</text>
        </view>
        <view class="dialog-body">
          <view class="custom-form-field">
            <text class="custom-form-label">名称</text>
            <input class="custom-form-input" v-model="customCategoryForm.name" placeholder="请输入分类名称" maxlength="20" />
          </view>
          <view class="custom-form-field">
            <text class="custom-form-label">图标</text>
            <input class="custom-form-input" v-model="customCategoryForm.icon" placeholder="emoji，如 🍜" maxlength="10" />
          </view>
          <view class="custom-form-field">
            <text class="custom-form-label">颜色</text>
            <input class="custom-form-input" v-model="customCategoryForm.color" placeholder="#F5A623" maxlength="20" />
          </view>
          <text class="custom-form-tip">将归入「我的分类」分组，仅当前账本可见</text>
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn cancel" @click="closeCustomCategoryForm" :plain="true">取消</button>
          <button class="dialog-btn confirm" @click="submitCustomCategoryForm" :plain="true" :loading="customCategorySaving">确认</button>
        </view>
      </view>
    </view>

    <!-- 账本选择弹窗（底部弹出） -->
    <view v-if="showBookPicker" class="book-picker-mask" @click="showBookPicker = false">
      <view class="book-picker-sheet" @click.stop>
        <view class="picker-header-inline">
          <text class="picker-title-inline">选择记账账本</text>
          <text class="picker-close-inline" @click="showBookPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="book-picker-scroll" :show-scrollbar="false">
          <view
            v-for="book in bookPickerOptions"
            :key="`${book.type}-${book.id}`"
            class="book-picker-item"
            :class="{ active: isSameBook(displayAccountBook, book) }"
            @click="selectBookFromPicker(book)"
          >
            <text class="book-picker-name">{{ book.name }}</text>
            <text class="book-picker-tag">{{ book.type === 1 ? '一起记' : '个人' }}</text>
          </view>
          <view class="book-picker-scroll-pad" />
        </scroll-view>
      </view>
    </view>

    <!-- 消费渠道选择抽屉 -->
    <view v-if="showChannelDialog" class="category-drawer-mask" @click="closeChannelDialog">
      <view class="category-drawer-panel" @click.stop>
        <scroll-view scroll-y class="category-drawer-scroll" :show-scrollbar="false">
          <view class="category-group">
            <view class="category-group-header">
              <text class="group-header-name">选择消费渠道</text>
            </view>
            <view class="category-group-children">
              <view
                v-for="channel in spendingChannels"
                :key="channel.value"
                class="grid-category-item"
                :class="{ selected: tempSpendingChannel === channel.value }"
                @tap.stop="tempSpendingChannel = channel.value"
              >
                <view class="grid-icon-circle">
                  <app-icon
                    :icon="channel.icon"
                    :category-name="channel.name"
                    :size="22"
                    :color="tempSpendingChannel === channel.value ? '#333333' : channel.color"
                  />
                </view>
                <text class="grid-category-name">{{ channel.name }}</text>
              </view>
            </view>
          </view>
          <view class="category-drawer-scroll-pad"></view>
        </scroll-view>
        <view class="category-drawer-footer">
          <button
            class="category-drawer-confirm-btn active"
            @click="confirmSpendingChannel"
          >确认</button>
        </view>
      </view>
    </view>

    <!-- 备注输入弹窗 -->
    <view v-if="showRemarkDialog" class="dialog-mask" @click="closeRemarkDialog">
      <view class="dialog-content remark-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">添加备注</text>
          <text class="dialog-close" @click="closeRemarkDialog">×</text>
        </view>
        <view class="dialog-body">
          <textarea 
            class="remark-dialog-input" 
            v-model="tempRemark"
            placeholder="请输入备注内容（可选）"
            maxlength="100"
            auto-height
          />
        </view>
        <view class="dialog-footer">
          <button class="dialog-btn cancel" @click="closeRemarkDialog" :plain="true">取消</button>
          <button class="dialog-btn confirm" @click="confirmRemark" :plain="true">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate, amountToFen } from '@/utils/util';
import { requireWechatLogin } from '@/utils/auth';
import {
  FREQUENT_CATEGORY_LIMIT,
  getFrequentCategoryIds,
  recordCategoryUsage
} from '@/utils/categoryFrequent';
import {
  getLastCategoryId,
  getLastSpendingChannel,
  recordLastTransactionPrefs
} from '@/utils/lastTransactionPrefs';
import { recordLastUsedAccountBook, resolveAccountBookForAdd } from '@/utils/lastUsedAccountBook';
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['currentAccountBook', 'addTransactionType', 'addTransactionAccountBook', 'currentSharedAccountBook', 'switchToAITab', 'accountBooks', 'userInfo']),
    // 当前账本是否已结束（已结束不可记账）
    isAccountBookEnded() {
      return this.displayAccountBook?.status === 1;
    },
    // 获取当前显示的账本（优先从首页传递的账本，其次一起账本，最后个人账本）
    displayAccountBook() {
      // 优先使用从首页传递过来的账本信息
      if (this.selectedAccountBook) {
        return this.selectedAccountBook;
      }
      // 其次从 Vuex 中获取一起账本（从详情页跳转过来）
      if (this.currentSharedAccountBook && this.currentSharedAccountBook.type === 1) {
        return this.currentSharedAccountBook;
      }
      // 如果有一起账本ID参数，使用一起账本（兼容旧方式）
      if (this.sharedAccountBookId && this.currentSharedAccountBook) {
        return this.currentSharedAccountBook;
      }
      // 否则使用当前个人账本
      return this.currentAccountBook;
    },
    // 全部可选二级分类（含无子类时的一级）
    allSelectableCategories() {
      const result = [];
      for (const parent of this.categories || []) {
        if (parent.children && parent.children.length) {
          for (const child of parent.children) {
            result.push({ category: child, parent });
          }
        } else {
          result.push({ category: parent, parent });
        }
      }
      return result.sort((a, b) => {
        const aCustom = a.category.isUserCustom ? 0 : 1;
        const bCustom = b.category.isUserCustom ? 0 : 1;
        return aCustom - bCustom;
      });
    },
    // 常用分类（按历史频次，不足时用默认顺序补齐）
    displayedFrequentCategories() {
      const all = this.allSelectableCategories;
      const limit = FREQUENT_CATEGORY_LIMIT;
      if (!all.length) return [];

      const book = this.displayAccountBook;
      const frequentIds = getFrequentCategoryIds(
        this.transactionType,
        book && book.id != null ? book.id : null,
        all.map(item => this.normalizeCategoryId(item.category.id)),
        limit
      );

      const items = [];
      const used = new Set();
      const pushItem = (item) => {
        if (!item) return;
        const id = this.normalizeCategoryId(item.category.id);
        if (id == null || used.has(id) || items.length >= limit) return;
        used.add(id);
        items.push(item);
      };

      frequentIds.forEach(id => {
        pushItem(all.find(item => this.normalizeCategoryId(item.category.id) === id));
      });
      for (const item of all) {
        if (items.length >= limit) break;
        pushItem(item);
      }

      const selectedId = this.normalizeCategoryId(this.selectedCategoryId);
      if (selectedId != null) {
        const selectedItem = all.find(item => this.normalizeCategoryId(item.category.id) === selectedId);
        if (selectedItem && !used.has(selectedId)) {
          if (items.length >= limit) {
            items[limit - 1] = selectedItem;
          } else {
            items.push(selectedItem);
          }
        }
      }

      return items;
    },
    // 一起账本成员列表（用于分摊对象选择）
    allocationMembers() {
      const book = this.displayAccountBook;
      if (!book || book.type !== 1 || !book.members || !Array.isArray(book.members)) return [];
      return book.members.map(m => ({
        userId: m.userId,
        userName: m.userName,
        userAvatar: m.userAvatar
      }));
    },
    // 分类网格（最多10个常用分类）
    categoryGridItems() {
      const all = this.allSelectableCategories;
      const limit = 10;
      if (!all.length) return [];

      const book = this.displayAccountBook;
      const frequentIds = getFrequentCategoryIds(
        this.transactionType,
        book && book.id != null ? book.id : null,
        all.map(item => this.normalizeCategoryId(item.category.id)),
        limit
      );

      const items = [];
      const used = new Set();
      const pushItem = (item) => {
        if (!item) return;
        const id = this.normalizeCategoryId(item.category.id);
        if (id == null || used.has(id) || items.length >= limit) return;
        used.add(id);
        items.push(item);
      };

      frequentIds.forEach(id => {
        pushItem(all.find(item => this.normalizeCategoryId(item.category.id) === id));
      });
      for (const item of all) {
        if (items.length >= limit) break;
        pushItem(item);
      }

      const selectedId = this.normalizeCategoryId(this.selectedCategoryId);
      if (selectedId != null) {
        const selectedItem = all.find(item => this.normalizeCategoryId(item.category.id) === selectedId);
        if (selectedItem && !used.has(selectedId)) {
          if (items.length >= limit) {
            items[limit - 1] = selectedItem;
          } else {
            items.push(selectedItem);
          }
        }
      }

      return items;
    },
    dateKeypadLabel() {
      const today = new Date().toISOString().split('T')[0];
      if (this.transactionDate === today) return '今天';
      const d = new Date(this.transactionDate);
      if (Number.isNaN(d.getTime())) return '今天';
      return `${d.getMonth() + 1}/${d.getDate()}`;
    },
    currentSpendingChannel() {
      return this.spendingChannels.find(c => c.value === this.selectedSpendingChannel) || this.spendingChannels[0] || null;
    },
    showAllocationBar() {
      const book = this.displayAccountBook;
      return book && book.type === 1 && this.transactionType === 0 && this.allocationMembers.length > 0;
    },
    selectedAllocationCount() {
      return this.allocationUserIds ? this.allocationUserIds.length : 0;
    },
    canManageBookCategories() {
      const book = this.displayAccountBook;
      if (!book || !this.userInfo) return false;
      return book.userId === this.userInfo.id;
    }
  },
  data() {
    const sysInfo = uni.getSystemInfoSync();
    return {
      statusBarHeight: sysInfo.statusBarHeight || 20,
      activeTab: 'manual',
      transactionType: 0, // 0-支出, 1-收入
      amount: '',
      amountExpression: '',
      selectedCategoryId: null,
      selectedParentId: null, // 当前选中的父分类ID
      selectedSpendingChannel: 0,
      remark: '',
      transactionDate: new Date().toISOString().split('T')[0], // 显示用的日期
      transactionDateTime: new Date().toISOString(), // 完整的日期时间
      categories: [],
      saving: false,
      images: [], // { storageUrl, displayUrl }
      uploading: false, // 是否正在上传
      sharedAccountBookId: null, // 一起账本ID（从URL参数获取）
      selectedAccountBook: null, // 从首页选择的账本
      spendingChannels: [],
      // 币种列表（从API获取）
      currencies: [],
      selectedCurrency: 0, // 默认人民币
      // AI记账相关
      aiInputText: '', // AI输入文本
      aiRecognizing: false, // 是否正在识别
      showAiConfirmDialog: false, // 是否显示AI确认对话框
      aiRecognizedResult: null, // AI识别结果
      // 语音输入相关
      showVoiceDialog: false, // 是否显示语音输入弹窗
      // 备注弹窗相关
      showRemarkDialog: false, // 是否显示备注弹窗
      tempRemark: '', // 临时备注内容
      showChannelDialog: false,
      tempSpendingChannel: 0,
      isRecording: false, // 是否正在录音
      recordingManager: null, // 录音管理器
      allocationUserIds: [], // 分摊对象用户ID（仅一起账本支出）
      showCategoryDrawer: false, // 全部分类抽屉
      drawerSelectedCategoryId: null, // 抽屉内临时选中分类
      drawerSelectedParentId: null,
      showExtrasDrawer: false,
      showCustomCategoryDrawer: false,
      manageCategoryList: [],
      manageCategoryLoading: false,
      showCustomCategoryForm: false,
      customCategorySaving: false,
      customCategoryForm: {
        name: '',
        icon: '📝',
        color: '#F5A623'
      },
      showBookPicker: false,
      bookPickerOptions: []
    };
  },
  onLoad(options) {
    // 获取一起账本ID（如果有，兼容旧方式）
    if (options.sharedAccountBookId) {
      this.sharedAccountBookId = parseInt(options.sharedAccountBookId);
    }
    
    // 获取交易类型
    if (options.type !== undefined) {
      this.transactionType = parseInt(options.type);
    } else if (this.addTransactionType !== null) {
      // 兼容 Vuex 方式
      this.transactionType = this.addTransactionType;
      this.$store.dispatch('setAddTransactionType', null);
    }
    
    // 获取账本ID和类型（从URL参数）
    if (options.accountBookId) {
      const accountBookId = parseInt(options.accountBookId);
      const accountBookType = parseInt(options.accountBookType || '0');
      this.loadAccountBookById(accountBookId, accountBookType);
      // 分类在 loadAccountBookById 内加载，确保使用该账本的关联类别
    } else {
      this.resolveDefaultAccountBookIfNeeded();
    }
    this.loadCurrencies();
    this.loadSpendingChannels();
  },
  onShow() {
    // 每次显示页面时，检查是否有新的记账类型
    if (this.addTransactionType !== null) {
      this.transactionType = this.addTransactionType;
      this.$store.dispatch('setAddTransactionType', null);
    }
    
    // 检查是否有从首页传递过来的账本信息
    if (this.addTransactionAccountBook) {
      this.loadAccountBookById(this.addTransactionAccountBook.id, this.addTransactionAccountBook.type);
      // 使用后清空
      this.$store.dispatch('setAddTransactionAccountBook', null);
    } else {
      // 每次进入页面刷新分类（管理员新增分类等场景）
      this.loadCategories();
    }
    this.loadSpendingChannels();
    
    // 检查是否需要切换到AI tab
    if (this.switchToAITab) {
      this.activeTab = 'ai';
      this.$store.dispatch('setSwitchToAITab', false);
    }
  },
  watch: {
    transactionType() {
      this.closeCategoryDrawer();
      this.loadCategories();
    },
    // 分摊对象默认全部选中
    allocationMembers: {
      handler(members) {
        if (members && members.length > 0) {
          this.allocationUserIds = members.map(m => m.userId);
        }
      },
      immediate: true
    }
  },
  methods: {
    formatDate,

    cancelAdd() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: '/pages/index/index' });
      }
    },

    openExtrasDrawer() {
      this.showExtrasDrawer = true;
    },

    closeExtrasDrawer() {
      this.showExtrasDrawer = false;
    },

    openVoiceFromExtras() {
      this.closeExtrasDrawer();
      this.openVoiceDialog();
    },

    evaluateAmountExpression(expr) {
      if (!expr || !String(expr).trim()) return 0;
      const sanitized = String(expr).replace(/\s/g, '');
      if (!/^[\d.+\-]+$/.test(sanitized)) return NaN;
      const tokens = sanitized.match(/(\d+\.?\d*|[+\-])/g);
      if (!tokens || !tokens.length) return NaN;
      let result = parseFloat(tokens[0]);
      if (Number.isNaN(result)) return NaN;
      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const num = parseFloat(tokens[i + 1]);
        if (op !== '+' && op !== '-' || Number.isNaN(num)) return NaN;
        result = op === '+' ? result + num : result - num;
      }
      return Math.round(result * 100) / 100;
    },

    syncAmountFromExpression() {
      const value = this.evaluateAmountExpression(this.amountExpression);
      if (!Number.isNaN(value) && value > 0) {
        this.amount = String(value);
      } else if (!this.amountExpression) {
        this.amount = '';
      }
    },

    onKeypadPress(key) {
      if (key === 'back') {
        this.amountExpression = this.amountExpression.slice(0, -1);
        this.syncAmountFromExpression();
        return;
      }
      if (key === '+' || key === '-') {
        const expr = this.amountExpression;
        if (!expr) return;
        const last = expr.slice(-1);
        if (last === '+' || last === '-') {
          this.amountExpression = expr.slice(0, -1) + key;
        } else {
          this.amountExpression = expr + key;
        }
        return;
      }
      if (key === '.') {
        const expr = this.amountExpression;
        const parts = expr.split(/[+\-]/);
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart.includes('.')) return;
        this.amountExpression = expr + (expr ? '.' : '0.');
        this.syncAmountFromExpression();
        return;
      }
      if (/^\d$/.test(key)) {
        const expr = this.amountExpression;
        if (expr === '0' && key !== '.') {
          this.amountExpression = key;
        } else {
          this.amountExpression = expr + key;
        }
        this.syncAmountFromExpression();
      }
    },
    
    // 获取账本用途图标
    getCategoryIcon(category) {
      const icons = {
        0: '🏠', // 日常消费
        1: '✈️', // 旅行
        2: '🔧', // 装修
        3: '💒', // 结婚
        4: '👶', // 育儿
        5: '💼', // 生意
        6: '👨‍👩‍👧‍👦', // 家庭
        99: '📝' // 其他
      };
      return icons[category] || '🏠';
    },
    
    // 格式化日期范围
    formatDateRange(startDate, endDate) {
      const formatSimpleDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      const start = formatSimpleDate(startDate);
      const end = formatSimpleDate(endDate);
      
      if (start && end) {
        return `${start} 至 ${end}`;
      } else if (start) {
        return `${start} 起`;
      } else if (end) {
        return `至 ${end}`;
      }
      return '';
    },
    
    // 清空表单
    clearForm() {
      this.amount = '';
      this.amountExpression = '';
      this.selectedCurrency = 0; // 重置币种为人民币
      // 分摊对象默认全部选中（一起账本支出时）
      const members = this.allocationMembers;
      this.allocationUserIds = members && members.length > 0 ? members.map(m => m.userId) : [];
      this.remark = '';
      this.transactionDate = new Date().toISOString().split('T')[0];
      this.transactionDateTime = new Date().toISOString(); // 重置完整日期时间
      this.images = [];
      // AI记账相关
      this.aiInputText = '';
      this.aiRecognizedResult = null;
      // 重新加载分类并恢复上一笔的类别与消费渠道
      this.loadCategories();
    },
    
    // 检测文本中是否包含时间信息
    hasTimeInfo(text) {
      if (!text) return false;
      
      const timeKeywords = [
        '今天', '昨天', '前天', '明天', '后天',
        '今天早上', '今天中午', '今天下午', '今天晚上', '今晚',
        '昨天早上', '昨天中午', '昨天下午', '昨天晚上', '昨晚',
        '早上', '中午', '下午', '晚上', '凌晨',
        '月', '日', '号', '年',
        '周一', '周二', '周三', '周四', '周五', '周六', '周日',
        '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'
      ];
      
      // 检查是否包含时间关键词
      const hasKeyword = timeKeywords.some(keyword => text.includes(keyword));
      if (hasKeyword) return true;
      
      // 检查是否包含日期格式（如：2024-01-01, 1/1, 1-1等）
      const datePatterns = [
        /\d{4}[-/]\d{1,2}[-/]\d{1,2}/,  // 2024-01-01 或 2024/01/01
        /\d{1,2}[-/]\d{1,2}/,            // 1-1 或 1/1
        /\d{1,2}月\d{1,2}[日号]/,        // 1月1日 或 1月1号
        /\d{4}年\d{1,2}月\d{1,2}[日号]/  // 2024年1月1日
      ];
      
      return datePatterns.some(pattern => pattern.test(text));
    },
    
    async loadCategories() {
      try {
        const book = this.displayAccountBook;
        const accountBookId = book && book.id != null ? book.id : undefined;
        this.categories = await api.categories.getList(this.transactionType, accountBookId);
        this.applyLastTransactionDefaults();
      } catch (error) {
        console.error('加载分类失败', error);
        uni.showToast({
          title: '加载分类失败',
          icon: 'none'
        });
      }
    },

    async loadSpendingChannels() {
      try {
        const list = await api.spendingChannelTypes.getList();
        if (Array.isArray(list) && list.length > 0) {
          this.spendingChannels = list.map(item => ({
            value: item.value,
            name: item.name,
            icon: item.icon || '🛒',
            color: item.color || '#BFBFBF'
          }));
          this.applyLastTransactionDefaults();
        }
      } catch (error) {
        console.warn('加载消费渠道失败', error);
      }
    },

    applyLastTransactionDefaults() {
      const book = this.displayAccountBook;
      const accountBookId = book && book.id != null ? book.id : null;
      const lastCategoryId = getLastCategoryId(this.transactionType, accountBookId);

      if (lastCategoryId != null) {
        const item = this.allSelectableCategories.find(
          entry => this.normalizeCategoryId(entry.category.id) === this.normalizeCategoryId(lastCategoryId)
        );
        if (item) {
          this.selectCategory(item.category, item.parent);
        } else {
          this.selectedCategoryId = null;
          this.selectedParentId = null;
        }
      } else {
        this.selectedCategoryId = null;
        this.selectedParentId = null;
      }

      const lastChannel = getLastSpendingChannel(this.transactionType, accountBookId);
      if (lastChannel != null && this.spendingChannels.some(c => c.value === lastChannel)) {
        this.selectedSpendingChannel = lastChannel;
      } else if (this.spendingChannels.length > 0) {
        this.selectedSpendingChannel = this.spendingChannels[0].value;
      } else {
        this.selectedSpendingChannel = 0;
      }
    },

    async resolveDefaultAccountBookIfNeeded() {
      const accountBookTab = uni.getStorageSync('accountBookTab') || 'all';
      let personalAccountBooks = [];
      let sharedAccountBooks = [];
      try {
        personalAccountBooks = await api.accountBooks.getList();
      } catch (e) {
        console.error('加载个人账本失败', e);
      }
      try {
        sharedAccountBooks = await api.sharedAccountBooks.getList();
      } catch (e) {
        console.error('加载一起账本失败', e);
      }

      const resolved = resolveAccountBookForAdd({
        accountBookTab,
        currentAccountBook: this.currentAccountBook,
        currentSharedAccountBook: this.currentSharedAccountBook,
        personalAccountBooks,
        sharedAccountBooks
      });

      if (resolved) {
        await this.loadAccountBookById(resolved.id, resolved.type);
        return;
      }

      this.loadCategories();
    },

    saveLastTransactionPrefs(categoryId, spendingChannel, transactionType = this.transactionType) {
      const book = this.displayAccountBook;
      if (!book || book.id == null) return;
      recordLastTransactionPrefs(transactionType, book.id, {
        categoryId,
        spendingChannel
      });
      recordLastUsedAccountBook(book);
    },

    isSameBook(a, b) {
      if (!a || !b) return false;
      return a.id === b.id && (a.type ?? 0) === (b.type ?? 0);
    },

    async openBookPicker() {
      try {
        const personal = await api.accountBooks.getList();
        let shared = [];
        try {
          shared = await api.sharedAccountBooks.getList();
        } catch (e) {
          console.warn('加载一起账本失败', e);
        }
        this.bookPickerOptions = [
          ...personal.filter(b => b.status !== 1).map(b => ({ ...b, type: 0 })),
          ...shared.filter(b => b.status !== 1).map(b => ({ ...b, type: 1 }))
        ];
        if (!this.bookPickerOptions.length) {
          uni.showToast({ title: '暂无可用账本', icon: 'none' });
          return;
        }
        this.showBookPicker = true;
      } catch (error) {
        console.error('加载账本列表失败', error);
        uni.showToast({ title: '加载账本失败', icon: 'none' });
      }
    },

    async selectBookFromPicker(book) {
      this.showBookPicker = false;
      await this.loadAccountBookById(book.id, book.type ?? 0);
    },
    
    // 加载币种列表（优先使用当前账本的启用币种与默认币种）
    async loadCurrencies() {
      try {
        let rates = await api.currencyRates.getEnabled();
        const book = this.displayAccountBook;
        // 若当前账本设置了启用币种，则只显示这些币种（且必须在用户全局启用列表中）
        if (book && Array.isArray(book.enabledCurrencyIds) && book.enabledCurrencyIds.length > 0) {
          const idSet = new Set(book.enabledCurrencyIds);
          rates = rates.filter(r => idSet.has(r.currency));
        }
        this.currencies = rates.map(rate => ({
          value: rate.currency,
          name: rate.currencyName,
          symbol: rate.currencySymbol
        }));
        // 默认选中：账本默认币种 > 第一个币种 > 保持当前
        if (this.currencies.length > 0) {
          const defaultVal = (book && book.defaultCurrency != null && book.defaultCurrency !== undefined)
            ? book.defaultCurrency
            : this.currencies[0].value;
          const inList = this.currencies.some(c => c.value === defaultVal);
          if (inList) {
            this.selectedCurrency = defaultVal;
          } else if (this.selectedCurrency === 0 || !this.currencies.some(c => c.value === this.selectedCurrency)) {
            this.selectedCurrency = this.currencies[0].value;
          }
        }
      } catch (error) {
        console.error('加载币种列表失败', error);
        this.currencies = [
          { value: 0, name: '人民币', symbol: '¥' }
        ];
      }
    },
    
    // 根据账本ID加载账本信息
    async loadAccountBookById(accountBookId, accountBookType) {
      try {
        let accountBook = null;
        
        if (accountBookType === 1) {
          // 一起账本
          accountBook = await api.sharedAccountBooks.getById(accountBookId);
        } else {
          // 个人账本
          accountBook = await api.accountBooks.getById(accountBookId);
        }
        
        if (accountBook) {
          this.selectedAccountBook = accountBook;
          this.loadCurrencies();
          this.loadCategories();
        }
      } catch (error) {
        console.error('加载账本信息失败', error);
        this.selectedAccountBook = null;
      }
    },
    
    normalizeCategoryId(id) {
      if (id == null || id === '') return null;
      const num = Number(id);
      return Number.isNaN(num) ? id : num;
    },

    isCategorySelected(categoryId) {
      const current = this.normalizeCategoryId(this.selectedCategoryId);
      const target = this.normalizeCategoryId(categoryId);
      return current != null && target != null && current === target;
    },

    isDrawerCategorySelected(categoryId) {
      const current = this.normalizeCategoryId(this.drawerSelectedCategoryId);
      const target = this.normalizeCategoryId(categoryId);
      return current != null && target != null && current === target;
    },

    isDrawerCategoryGroupActive(parent) {
      if (!this.drawerSelectedCategoryId) return false;
      const selectedId = this.normalizeCategoryId(this.drawerSelectedCategoryId);
      if (parent.children && parent.children.length > 0) {
        return parent.children.some(child => this.normalizeCategoryId(child.id) === selectedId);
      }
      return this.normalizeCategoryId(parent.id) === selectedId;
    },

    selectCategory(category, parent) {
      this.selectedCategoryId = this.normalizeCategoryId(category.id);
      this.selectedParentId = parent ? this.normalizeCategoryId(parent.id) : null;
    },

    selectFrequentCategory(item) {
      if (!item || !item.category) return;
      this.selectCategory(item.category, item.parent);
    },

    onSelectCategoryItem(item, closeDrawer = false) {
      if (!item) return;
      this.selectCategory(item.category, item.parent);
      if (closeDrawer) {
        this.closeCategoryDrawer();
      }
    },

    selectDrawerCategory(item) {
      if (!item || !item.category) return;
      this.drawerSelectedCategoryId = this.normalizeCategoryId(item.category.id);
      this.drawerSelectedParentId = item.parent ? this.normalizeCategoryId(item.parent.id) : null;
    },

    async openCategoryDrawer() {
      await this.loadCategories();
      this.drawerSelectedCategoryId = this.normalizeCategoryId(this.selectedCategoryId);
      this.drawerSelectedParentId = this.normalizeCategoryId(this.selectedParentId);
      this.showCategoryDrawer = true;
    },

    closeCategoryDrawer() {
      this.showCategoryDrawer = false;
      this.drawerSelectedCategoryId = null;
      this.drawerSelectedParentId = null;
    },

    confirmDrawerCategory() {
      if (this.drawerSelectedCategoryId == null) {
        uni.showToast({
          title: '请选择分类',
          icon: 'none'
        });
        return;
      }
      this.selectedCategoryId = this.drawerSelectedCategoryId;
      this.selectedParentId = this.drawerSelectedParentId;
      this.closeCategoryDrawer();
    },

    async openCustomCategoryDrawer() {
      const book = this.displayAccountBook;
      if (!book || book.id == null) {
        uni.showToast({ title: '请先选择账本', icon: 'none' });
        return;
      }
      if (!this.canManageBookCategories) {
        uni.showToast({ title: '无权限管理分类', icon: 'none' });
        return;
      }
      this.showCustomCategoryDrawer = true;
      await this.loadManageCategories();
    },

    closeCustomCategoryDrawer() {
      this.showCustomCategoryDrawer = false;
      this.closeCustomCategoryForm();
    },

    async loadManageCategories() {
      const book = this.displayAccountBook;
      if (!book || book.id == null) return;
      this.manageCategoryLoading = true;
      try {
        const list = await api.accountBookCategories.getManageList(book.id, this.transactionType);
        this.manageCategoryList = Array.isArray(list) ? list : [];
      } catch (error) {
        console.error('加载分类管理列表失败', error);
        this.manageCategoryList = [];
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.manageCategoryLoading = false;
      }
    },

    async saveManageCategoryOrder() {
      const book = this.displayAccountBook;
      if (!book || book.id == null || !this.manageCategoryList.length) return;
      try {
        await api.accountBookCategories.reorder(book.id, {
          type: this.transactionType,
          categoryIds: this.manageCategoryList.map(item => item.id)
        });
      } catch (error) {
        console.error('保存分类排序失败', error);
        uni.showToast({ title: '排序保存失败', icon: 'none' });
      }
    },

    async moveManageCategory(index, delta) {
      const target = index + delta;
      if (target < 0 || target >= this.manageCategoryList.length) return;
      const list = [...this.manageCategoryList];
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      this.manageCategoryList = list;
      await this.saveManageCategoryOrder();
    },

    confirmDeleteManageCategory(item) {
      if (!item || item.isUsed) return;
      uni.showModal({
        title: '确认删除',
        content: item.isUserCustom
          ? `确定删除自定义分类「${item.name}」吗？`
          : `确定从账本中移除「${item.name}」吗？`,
        success: async (res) => {
          if (!res.confirm) return;
          const book = this.displayAccountBook;
          if (!book || book.id == null) return;
          try {
            await api.accountBookCategories.removeFromBook(book.id, item.id);
            uni.showToast({ title: '已删除', icon: 'success' });
            await this.loadManageCategories();
            await this.loadCategories();
          } catch (error) {
            uni.showToast({
              title: (error && error.message) || '删除失败',
              icon: 'none'
            });
          }
        }
      });
    },

    openCustomCategoryForm() {
      this.customCategoryForm = {
        name: '',
        icon: '📝',
        color: '#F5A623'
      };
      this.showCustomCategoryForm = true;
    },

    openCustomCategoryFromGrid() {
      const book = this.displayAccountBook;
      if (!book || book.id == null) {
        uni.showToast({ title: '请先选择账本', icon: 'none' });
        return;
      }
      if (!this.canManageBookCategories) {
        uni.showToast({ title: '无权限添加自定义分类', icon: 'none' });
        return;
      }
      this.openCustomCategoryForm();
    },

    closeCustomCategoryForm() {
      this.showCustomCategoryForm = false;
      this.customCategorySaving = false;
    },

    async submitCustomCategoryForm() {
      const name = (this.customCategoryForm.name || '').trim();
      if (!name) {
        uni.showToast({ title: '请输入分类名称', icon: 'none' });
        return;
      }
      const book = this.displayAccountBook;
      if (!book || book.id == null) return;
      this.customCategorySaving = true;
      try {
        await api.accountBookCategories.createCustom(book.id, {
          name,
          icon: (this.customCategoryForm.icon || '📝').trim(),
          color: (this.customCategoryForm.color || '#F5A623').trim(),
          type: this.transactionType
        });
        uni.showToast({ title: '已添加', icon: 'success' });
        this.closeCustomCategoryForm();
        await this.loadManageCategories();
        await this.loadCategories();
      } catch (error) {
        uni.showToast({
          title: (error && error.message) || '添加失败',
          icon: 'none'
        });
      } finally {
        this.customCategorySaving = false;
      }
    },

    recordCurrentCategoryUsage(categoryId, transactionType = this.transactionType) {
      const book = this.displayAccountBook;
      recordCategoryUsage(
        transactionType,
        book && book.id != null ? book.id : null,
        categoryId
      );
    },
    
    selectSpendingChannel(value) {
      this.selectedSpendingChannel = value;
    },

    openChannelDialog() {
      this.tempSpendingChannel = this.selectedSpendingChannel;
      this.showChannelDialog = true;
    },

    closeChannelDialog() {
      this.showChannelDialog = false;
    },

    confirmSpendingChannel() {
      this.selectedSpendingChannel = this.tempSpendingChannel;
      this.closeChannelDialog();
    },
    
    selectCurrency(value) {
      this.selectedCurrency = value;
    },
    
    isAllocationSelected(userId) {
      return this.allocationUserIds && this.allocationUserIds.indexOf(userId) >= 0;
    },
    toggleAllocation(userId) {
      if (!this.allocationUserIds) this.allocationUserIds = [];
      const i = this.allocationUserIds.indexOf(userId);
      if (i >= 0) {
        this.allocationUserIds = this.allocationUserIds.filter(id => id !== userId);
      } else {
        this.allocationUserIds = [...this.allocationUserIds, userId];
      }
    },
    
    onDateChange(e) {
      this.transactionDate = e.detail.value;
      // 更新完整日期时间，保持当前时间
      const now = new Date();
      const selectedDate = new Date(e.detail.value);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      this.transactionDateTime = selectedDate.toISOString();
    },
    
    // 选择图片
    chooseImage() {
      if (this.images.length >= 9) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: 9 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 上传图片
          this.uploadImages(res.tempFilePaths);
        }
      });
    },
    
    // 上传图片
    async uploadImages(filePaths) {
      this.uploading = true;
      
      try {
        for (const filePath of filePaths) {
          const result = await api.images.upload(filePath, { contentCheck: true });
          if (result.imageUrl) {
            this.images.push({
              storageUrl: result.imageUrl,
              displayUrl: result.displayUrl || result.imageUrl
            });
          }
        }
      } catch (error) {
        console.error('上传图片失败', error);
        uni.showToast({
          title: error.message || '上传图片失败',
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.uploading = false;
      }
    },
    
    // 预览图片
    previewImage(index) {
      uni.previewImage({
        urls: this.images.map(img => img.displayUrl),
        current: index
      });
    },
    
    // 删除图片
    removeImage(index) {
      this.images.splice(index, 1);
    },
    
    // AI识别交易
    async recognizeWithAi() {
      if (!requireWechatLogin()) {
        return;
      }

      if (!this.aiInputText.trim()) {
        uni.showToast({
          title: '请输入记账内容',
          icon: 'none'
        });
        return;
      }
      
      // 检查是否包含时间信息
      if (!this.hasTimeInfo(this.aiInputText.trim())) {
        uni.showToast({
          title: '请输入时间信息，如：今天、昨天、1月1日等',
          icon: 'none',
          duration: 3000
        });
        return;
      }
      
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        uni.showToast({
          title: '请先选择账本',
          icon: 'none'
        });
        return;
      }
      
      this.aiRecognizing = true;
      
      try {
        const result = await api.aiTransaction.recognize({
          text: this.aiInputText.trim(),
          accountBookId: targetAccountBook.id,
          transactionType: this.transactionType
        });
        
        this.aiRecognizedResult = result;
        this.showAiConfirmDialog = true;
        
      } catch (error) {
        console.error('AI识别失败', error);
        uni.showToast({
          title: error.message || '识别失败，请重试',
          icon: 'none'
        });
      } finally {
        this.aiRecognizing = false;
      }
    },
    
    // 确认AI识别结果并直接提交
    async confirmAiResult() {
      if (!this.aiRecognizedResult) return;
      if (this.isAccountBookEnded) {
        uni.showToast({
          title: '已结束的账本不能继续记账',
          icon: 'none'
        });
        return;
      }
      // 检查是否为体验模式
      if (!requireWechatLogin()) {
        return;
      }
      
      // 验证账本
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        uni.showToast({
          title: '请先选择账本',
          icon: 'none'
        });
        return;
      }
      
      // 验证识别结果
      if (!this.aiRecognizedResult.amount || this.aiRecognizedResult.amount <= 0) {
        uni.showToast({
          title: '金额无效',
          icon: 'none'
        });
        return;
      }
      
      if (!this.aiRecognizedResult.categoryId) {
        uni.showToast({
          title: '分类无效',
          icon: 'none'
        });
        return;
      }
      
      // 准备提交数据 - 使用完整的日期时间
      let transactionDateTime;
      if (this.aiRecognizedResult.transactionDate) {
        // AI识别出了日期，使用当前时间
        const aiDate = new Date(this.aiRecognizedResult.transactionDate);
        const now = new Date();
        aiDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        transactionDateTime = aiDate.toISOString();
      } else {
        transactionDateTime = this.transactionDateTime;
      }
      
      // 关闭对话框
      this.showAiConfirmDialog = false;
      this.saving = true;
      
      try {
        // 直接提交交易记录
        await api.transactions.create({
          accountBookId: targetAccountBook.id,
          categoryId: this.aiRecognizedResult.categoryId,
          amount: this.aiRecognizedResult.amount,
          type: this.aiRecognizedResult.type,
          remark: this.aiRecognizedResult.remark || '',
          paymentMethod: 99,
          spendingChannel: this.aiRecognizedResult.type === 0 ? this.selectedSpendingChannel : 0,
          currency: this.selectedCurrency,
          transactionDate: transactionDateTime,
          imageUrls: this.images.length > 0 ? this.images.map(img => img.storageUrl) : null,
          allocationUserIds: (targetAccountBook.type === 1 && this.aiRecognizedResult.type === 0 && this.allocationUserIds && this.allocationUserIds.length > 0) ? this.allocationUserIds : undefined
        });
        
        this.recordCurrentCategoryUsage(this.aiRecognizedResult.categoryId, this.aiRecognizedResult.type);
        this.saveLastTransactionPrefs(
          this.aiRecognizedResult.categoryId,
          this.aiRecognizedResult.type === 0 ? this.selectedSpendingChannel : 0,
          this.aiRecognizedResult.type
        );
        
        // 清空表单
        this.clearForm();
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          // 检查页面栈，如果有上一页则返回，否则跳转到首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            // 如果没有上一页，跳转到首页（tabBar页面）
            uni.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 1500);
        
      } catch (error) {
        console.error('保存失败', error);
        
        // 如果是需要授权的错误，显示授权提示
        if (error.message && error.message.includes('需要授权')) {
          uni.showModal({
            title: '需要登录',
            content: '需要授权微信登录后才能使用记账功能',
            confirmText: '去登录',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              } else {
                // 取消时重新显示对话框
                this.showAiConfirmDialog = true;
              }
            }
          });
        } else {
          uni.showToast({
            title: error.message || '保存失败',
            icon: 'none'
          });
          // 保存失败时重新显示对话框
          this.showAiConfirmDialog = true;
        }
      } finally {
        this.saving = false;
      }
    },
    
    async saveTransaction() {
      if (this.isAccountBookEnded) {
        uni.showToast({
          title: '已结束的账本不能继续记账',
          icon: 'none'
        });
        return;
      }
      // 检查是否为体验模式
      if (!requireWechatLogin()) {
        return;
      }
      
      // 验证
      this.syncAmountFromExpression();
      const evaluated = this.evaluateAmountExpression(this.amountExpression);
      if (this.amountExpression && !Number.isNaN(evaluated) && evaluated > 0) {
        this.amount = String(evaluated);
      }
      if (!this.amount || parseFloat(this.amount) <= 0) {
        uni.showToast({
          title: '请输入金额',
          icon: 'none'
        });
        return;
      }
      
      if (!this.selectedCategoryId) {
        uni.showToast({
          title: '请选择分类',
          icon: 'none'
        });
        return;
      }
      
      // 验证账本
      const targetAccountBook = this.displayAccountBook;
      if (!targetAccountBook) {
        uni.showToast({
          title: '请先选择账本',
          icon: 'none'
        });
        return;
      }
      
      this.saving = true;
      
      try {
        await api.transactions.create({
          accountBookId: targetAccountBook.id,
          categoryId: this.selectedCategoryId,
          amount: parseFloat(this.amount),
          type: this.transactionType,
          remark: this.remark,
          paymentMethod: 99,
          spendingChannel: this.transactionType === 0 ? this.selectedSpendingChannel : 0,
          currency: this.selectedCurrency,
          transactionDate: this.transactionDateTime,
          imageUrls: this.images.length > 0 ? this.images.map(img => img.storageUrl) : null,
          allocationUserIds: (targetAccountBook.type === 1 && this.transactionType === 0 && this.allocationUserIds && this.allocationUserIds.length > 0) ? this.allocationUserIds : undefined
        });
        
        this.recordCurrentCategoryUsage(this.selectedCategoryId);
        this.saveLastTransactionPrefs(this.selectedCategoryId, this.selectedSpendingChannel);
        
        // 清空表单
        this.clearForm();
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          // 检查页面栈，如果有上一页则返回，否则跳转到首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            // 如果没有上一页，跳转到首页（tabBar页面）
            uni.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 1500);
        
      } catch (error) {
        console.error('保存失败', error);
        
        // 如果是需要授权的错误，显示授权提示
        if (error.message && error.message.includes('需要授权')) {
          uni.showModal({
            title: '需要登录',
            content: '需要授权微信登录后才能使用记账功能',
            confirmText: '去登录',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }
            }
          });
        } else {
          uni.showToast({
            title: error.message || '保存失败',
            icon: 'none'
          });
        }
      } finally {
        this.saving = false;
      }
    },
    
    // 打开语音输入弹窗
    openVoiceDialog() {
      this.showVoiceDialog = true;
      // 打开弹窗后自动开始录音
      this.$nextTick(() => {
        this.startRecording();
      });
    },
    
    // 关闭语音输入弹窗
    closeVoiceDialog() {
      if (this.isRecording) {
        this.stopRecording();
      }
      this.showVoiceDialog = false;
    },
    
    // 打开备注弹窗
    openRemarkDialog() {
      this.tempRemark = this.remark;
      this.showRemarkDialog = true;
    },
    
    // 关闭备注弹窗
    closeRemarkDialog() {
      this.showRemarkDialog = false;
      this.tempRemark = '';
    },
    
    // 确认备注
    confirmRemark() {
      this.remark = this.tempRemark;
      this.closeRemarkDialog();
    },
    
    // 显示语音设置
    showVoiceSettings() {
      uni.showToast({
        title: '语音设置功能开发中',
        icon: 'none'
      });
    },
    
    // 显示语音帮助
    showVoiceHelp() {
      uni.showToast({
        title: '点击下方按钮开始录音',
        icon: 'none'
      });
    },
    
    // 开始录音
    startRecording() {
      if (!requireWechatLogin()) {
        return;
      }

      if (this.isRecording) return;
      
      this.isRecording = true;
      
      // 创建录音管理器
      this.recordingManager = uni.getRecorderManager();
      
      this.recordingManager.onStart(() => {
        console.log('录音开始');
      });
      
      this.recordingManager.onError((err) => {
        console.error('录音错误', err);
        this.isRecording = false;
        uni.showToast({
          title: '录音失败，请重试',
          icon: 'none'
        });
      });
      
      // 开始录音
      // 注意：微信小程序录音格式支持：mp3, aac, wav, pcm
      // 百度语音识别API支持：pcm, wav, amr, m4a, mp3
      this.recordingManager.start({
        duration: 60000, // 最长录音60秒
        sampleRate: 16000, // 采样率：16000Hz（百度推荐）
        numberOfChannels: 1, // 单声道
        encodeBitRate: 96000, // 编码码率
        format: 'pcm' // 格式：mp3（兼容性好）
      });
    },
    
    // 停止录音并识别
    async stopRecording() {
      if (!this.isRecording || !this.recordingManager) {
        // 如果没有在录音，直接关闭弹窗
        this.closeVoiceDialog();
        return;
      }
      
      this.isRecording = false;
      
      this.recordingManager.stop();
      
      this.recordingManager.onStop(async (res) => {
        console.log('录音结束', res);
        
        // 检查录音时长（至少1秒）
        if (res.duration < 1000) {
          uni.showToast({
            title: '录音时间太短，请重新录音',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        // 关闭弹窗
        this.closeVoiceDialog();
        
        // 显示识别中提示
        uni.showToast({
          title: '正在识别语音...',
          icon: 'loading',
          duration: 10000
        });
        
        try {
          // 读取录音文件并转换为Base64
          const fileSystemManager = uni.getFileSystemManager();
          const fileInfo = await new Promise((resolve, reject) => {
            fileSystemManager.getFileInfo({
              filePath: res.tempFilePath,
              success: resolve,
              fail: reject
            });
          });
          
          // 检查文件大小（最大5MB）
          if (fileInfo.size > 5 * 1024 * 1024) {
            uni.hideToast();
            uni.showToast({
              title: '录音文件过大，请重新录音',
              icon: 'none',
              duration: 2000
            });
            return;
          }
          
          // 读取文件内容
          const audioBase64 = await new Promise((resolve, reject) => {
            fileSystemManager.readFile({
              filePath: res.tempFilePath,
              encoding: 'base64',
              success: (readRes) => {
                resolve(readRes.data);
              },
              fail: (err) => {
                console.error('读取录音文件失败', err);
                reject(new Error('读取录音文件失败'));
              }
            });
          });
          
          // 获取账本信息
          const targetAccountBook = this.displayAccountBook;
          if (!targetAccountBook) {
            uni.hideToast();
            uni.showToast({
              title: '请先选择账本',
              icon: 'none'
            });
            return;
          }
          
          // 调用语音识别API
          const result = await api.aiTransaction.recognizeVoice({
            audioBase64: audioBase64,
            format: 'mp3',
            accountBookId: targetAccountBook.id,
            transactionType: this.transactionType
          });
          
          uni.hideToast();
          
          // 如果识别成功，直接显示确认对话框
          if (result && result.transaction) {
            this.aiRecognizedResult = result.transaction;
            this.showAiConfirmDialog = true;
            uni.showToast({
              title: '识别成功',
              icon: 'success',
              duration: 1500
            });
          } else if (result && result.text) {
            // 如果只识别出文本，填入输入框
            this.aiInputText = result.text;
            uni.showToast({
              title: '识别成功，请点击识别按钮',
              icon: 'success',
              duration: 2000
            });
          } else {
            uni.showToast({
              title: '未能识别出有效内容，请重新录音',
              icon: 'none',
              duration: 2000
            });
          }
        } catch (error) {
          console.error('语音识别失败', error);
          uni.hideToast();
          
          // 解析错误信息
          let errorMessage = '语音识别失败，请重试';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          uni.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 3000
          });
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.add-transaction-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #FFFFFF;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F5A623;
  padding: 12rpx 24rpx 16rpx;
  flex-shrink: 0;
  box-sizing: border-box;

  .header-side {
    width: 120rpx;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-side-left {
    justify-content: flex-start;
  }

  .header-side-right {
    justify-content: flex-end;
  }

  .header-back-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-back-icon {
    font-size: 52rpx;
    color: #333333;
    line-height: 1;
    font-weight: 300;
    margin-top: -4rpx;
  }

  .header-tabs {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48rpx;
  }

  .header-tab {
    position: relative;
    padding: 12rpx 8rpx 16rpx;

    .header-tab-text {
      font-size: 32rpx;
      color: rgba(51, 51, 51, 0.55);
      font-weight: 500;
    }

    &.active {
      .header-tab-text {
        color: #333333;
        font-weight: 600;
      }

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 48rpx;
        height: 6rpx;
        background: #333333;
        border-radius: 3rpx;
      }
    }
  }
}

.book-strip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 28rpx;
  background: #FFF8EB;
  flex-shrink: 0;

  .book-strip-name {
    font-size: 24rpx;
    color: #666666;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-strip-tag {
    font-size: 20rpx;
    color: #F5A623;
    background: rgba(245, 166, 35, 0.15);
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
  }

  .book-strip-change {
    font-size: 20rpx;
    color: #999999;
    flex-shrink: 0;
  }
}

.book-picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.book-picker-sheet {
  width: 100%;
  max-height: 70vh;
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  animation: book-picker-slide-up 0.28s ease-out;
}

.book-picker-scroll {
  flex: 1;
  min-height: 0;
  max-height: calc(70vh - 100rpx);
  box-sizing: border-box;
  padding-top: 24rpx;
}

.book-picker-scroll-pad {
  height: 24rpx;
}

@keyframes book-picker-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.picker-header-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 32rpx 28rpx 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.picker-title-inline {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.picker-close-inline {
  font-size: 40rpx;
  color: #999999;
  line-height: 1;
}

.book-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 24rpx 16rpx;
  padding: 24rpx 28rpx;
  background: #F5F5F5;
  border-radius: 16rpx;

  &.active {
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);

    .book-picker-name {
      color: #FFFFFF;
    }

    .book-picker-tag {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.book-picker-name {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
  margin-right: 16rpx;
}

.book-picker-tag {
  font-size: 22rpx;
  color: #F5A623;
  background: rgba(245, 166, 35, 0.12);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.category-scroll {
  flex: 1;
  min-height: 0;
  background: #FFFFFF;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx 16rpx 8rpx;
  box-sizing: border-box;
}

.grid-category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 20rpx;
  box-sizing: border-box;

  .grid-icon-circle {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: #F0F0F0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .grid-category-name {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #666666;
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 8rpx;
    box-sizing: border-box;
  }

  &.selected {
    .grid-icon-circle {
      background: #F5A623;
    }

    .grid-category-name {
      color: #333333;
      font-weight: 600;
    }
  }
}

.input-panel {
  flex-shrink: 0;
  //background: #F5F5F5;
  border-top: 1rpx solid #EBEBEB;
  box-sizing: border-box;
}

.input-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 36rpx;
  min-height: 88rpx;
  box-sizing: border-box;

  .input-bar-payment,
  .input-bar-remark {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 45%;
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .input-bar-meta-text {
    font-size: 28rpx;
    color: #333333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 0 1 auto;
    min-width: 0;
  }

  .input-bar-meta-btn {
    font-size: 28rpx;
    color: #2064f5a8;
    flex-shrink: 0;
    white-space: nowrap;
    line-height: 1;
  }

  &.input-bar-bottom {
    border-top: 1rpx solid #EBEBEB;
    min-height: 72rpx;
    padding-top: 16rpx;
    padding-bottom: 16rpx;

    .input-meta-scroll-receipt {
      margin-left: auto;
      flex-shrink: 0;
      max-width: 55%;
    }
  }

  .input-bar-amount {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    max-width: 55%;

    .amount-expression {
      font-size: 48rpx;
      font-weight: 600;
      color: #333333;
      line-height: 1.2;
    }

    .amount-cursor {
      width: 4rpx;
      height: 44rpx;
      background: #F5A623;
      margin-left: 4rpx;
      animation: cursor-blink 1s step-end infinite;
    }
  }

  .input-meta-scroll {
    flex-shrink: 0;
    flex:0.3;
    white-space: nowrap;
  }
}

.input-meta-scroll-receipt {
  min-width: 0;
}

.receipt-inline-list {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  min-width: 100%;
  box-sizing: border-box;
}

.receipt-inline-item {
  position: relative;
  width: 56rpx;
  height: 56rpx;
  border-radius: 8rpx;
  overflow: visible;
  flex-shrink: 0;

  .receipt-inline-image {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  .receipt-inline-delete {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 32rpx;
    height: 32rpx;
    background: #F5A623;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 22rpx;
    line-height: 1;
    z-index: 1;
  }
}

.receipt-inline-upload {
  width: 56rpx;
  height: 56rpx;
  border: 0rpx solid #CCCCCC;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  // background: #FFFFFF;
  flex-shrink: 0;
  box-sizing: border-box;

  text {
    font-size: 18rpx;
    color: #999999;
    line-height: 1;
  }
}

.payment-current-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.payment-change-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
  padding: 8rpx 0;

  text {
    font-size: 28rpx;
    color: #2064f5a8;
    line-height: 1;
  }
}

.payment-inline-list {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding-right: 8rpx;
}

.payment-inline-chip {
  display: inline-flex;
  align-items: center;
  height: 56rpx;
  padding: 0 16rpx 0 8rpx;
  border-radius: 28rpx;
  //background: #FFFFFF;
  border: 0rpx solid transparent;
  flex-shrink: 0;
  box-sizing: border-box;

  &.selected {
    //background: rgba(245, 166, 35, 0.12);
    //border-color: #F5A623;

    text {
      //color: #F5A623;
      //font-weight: 600;
    }
  }

  .payment-inline-icon {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    margin-right: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  text {
    font-size: 32rpx;
    color: #666666;
    white-space: nowrap;
    line-height: 1;
  }
}

@keyframes cursor-blink {
  50% { opacity: 0; }
}

.keypad-allocation-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 12rpx 36rpx;
  background: #FFF;
  border-top: 1rpx solid #EBEBEB;
  box-sizing: border-box;

  .keypad-allocation-label {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding-right: 12rpx;

    text {
      font-size: 24rpx;
      color: #999999;
      line-height: 1;
    }
  }

  .keypad-allocation-scroll {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  .keypad-allocation-summary {
    flex-shrink: 0;
    margin-left: 12rpx;
    font-size: 24rpx;
    color: #999999;
    line-height: 1;
    white-space: nowrap;
  }

  .keypad-allocation-list {
    display: inline-flex;
    align-items: center;
    gap: 12rpx;
    padding: 8rpx 8rpx 0 0;
  }

  .keypad-allocation-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 8rpx 16rpx 8rpx 8rpx;
    background: #F3F3F3;
    border-radius: 0;
    border: 2rpx solid transparent;
    flex-shrink: 0;
    font-size: 28rpx;
    &.selected {
      //background: rgba(245, 166, 35);
      border-color: #F5A623;

      .keypad-allocation-name {
        //color: #fff;
        //font-weight: 600;
      }
    }
  }

  .keypad-allocation-check {
    position: absolute;
    top: -6rpx;
    right: -6rpx;
    width: 22rpx;
    height: 22rpx;
    //border-radius: 50%;
    //background: #FFFFFF;
    //border: 2rpx solid #F5A623;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .keypad-allocation-avatar {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    margin-right: 8rpx;
    flex-shrink: 0;

    &.placeholder {
      background: #F5A623;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22rpx;
      line-height: 1;
    }
  }

  .keypad-allocation-name {
    font-size: 24rpx;
    color: #666666;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1;
  }
}

.keypad {
  flex-shrink: 0;
  background: #F0F0F0;
  border-top: 1rpx solid #E0E0E0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .keypad-row {
    display: flex;
    align-items: stretch;
    height: 108rpx;
    border-bottom: 1rpx solid #E0E0E0;

    &:last-child {
      border-bottom: none;
    }
  }

  .keypad-key {
    flex: 1;
    min-width: 0;
    height: 108rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    border-right: 1rpx solid #E0E0E0;
    box-sizing: border-box;
    overflow: hidden;

    &:last-child {
      border-right: none;
    }

    &:active {
      background: #F5F5F5;
    }

    text {
      font-size: 40rpx;
      color: #333333;
      font-weight: 500;
      line-height: 1;
    }
  }

  .keypad-key-op {
    background: #FAFAFA;

    text {
      font-size: 48rpx;
      font-weight: 400;
      color: #333333;
    }
  }

  .keypad-key-date {
    position: relative;

    .keypad-date-inner {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 6rpx;
      pointer-events: none;
    }

    text {
      font-size: 28rpx;
      font-weight: 500;
      color: #666666;
      line-height: 1;
    }

    .keypad-date-picker {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 108rpx;
      z-index: 1;
    }

    .keypad-date-picker-hit {
      width: 100%;
      height: 108rpx;
      opacity: 0;
    }
  }

  .keypad-key-save {
    background: #F5A623;

    text {
      font-size: 32rpx;
      color: #FFFFFF;
      font-weight: 600;
    }

    &.disabled {
      opacity: 0.5;
    }

    &:active {
      background: #E8940C;
    }
  }
}

.extras-drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 998;
  display: flex;
  align-items: flex-end;
}

.extras-drawer-panel {
  width: 100%;
  max-height: 75vh;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.extras-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
  flex-shrink: 0;

  .extras-drawer-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }

  .extras-drawer-close {
    font-size: 44rpx;
    color: #999999;
    line-height: 1;
  }
}

.extras-drawer-body {
  flex: 1;
  min-height: 0;
  padding: 16rpx 24rpx 32rpx;
  box-sizing: border-box;
}

.extras-voice-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 16rpx;
  margin-top: 8rpx;
  background: #FFF8EB;
  border-radius: 12rpx;

  text {
    font-size: 28rpx;
    color: #333333;
  }
}

.tab-container {
  display: flex;
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 0 16rpx;
  margin-bottom: 0rpx;
  box-sizing: border-box;
  width: 100%;
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20rpx 0;
    position: relative;
    box-sizing: border-box;
    
    &.active {
      .tab-text {
        color: #F5A623;
        font-weight: bold;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background: #F5A623;
        border-radius: 2rpx;
      }
    }
    
    .tab-icon {
      font-size: 32rpx;
      margin-bottom: 8rpx;
    }
    
    .tab-text {
      font-size: 26rpx;
      color: #666666;
      transition: all 0.3s;
    }
  }
}

.tab-content {
  width: 100%;
  box-sizing: border-box;
}

.account-book-banner {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  
  .account-book-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .account-book-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      min-width: 0;
      
      .account-book-icon-wrapper {
        width: 52rpx;
        height: 52rpx;
        border-radius: 12rpx;
        background: #F5F5F5;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        &.shared {
          background: #F5F5F5;
        }
        
        .account-book-icon {
          font-size: 32rpx;
        }
      }
      
      .account-book-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;
        min-width: 0;
        
        .account-book-name {
          font-size: 32rpx;
          font-weight: 500;
          color: #333333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .account-book-meta {
          display: flex;
          align-items: center;
          gap: 10rpx;
          flex-wrap: nowrap;
          min-width: 0;
          
          .account-book-type {
            font-size: 24rpx;
            color: #999999;
            flex-shrink: 0;
          }
          
          .account-book-category-tag {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 40rpx;
            padding: 0 12rpx;
            box-sizing: border-box;
            font-size: 20rpx;
            line-height: 1;
            background: #F7B84D;
            color: #FFFFFF;
            border-radius: 12rpx;
            border: 2rpx solid #F7B84D;
            flex-shrink: 0;
          }
          
          .currency-inline-scroll {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
          }
        }
      }
    }
    
    .type-switch {
      display: flex;
      gap: 10rpx;
      background: rgba(255, 107, 107, 0.1);
      border-radius: 28rpx;
      padding: 6rpx;
      flex-shrink: 0;
      
      .switch-btn {
        padding: 14rpx 28rpx;
        border-radius: 22rpx;
        font-size: 28rpx;
        color: #F5A623;
        transition: all 0.3s;
        
        &.active {
          background: #F5A623;
          color: #FFFFFF;
          font-weight: 600;
        }
      }
    }
  }
  
  .account-book-details {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #F0F0F0;
    
    .detail-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .detail-label {
        font-size: 24rpx;
        color: #999999;
        width: 80rpx;
        flex-shrink: 0;
      }
      
      .detail-value {
        font-size: 24rpx;
        color: #666666;
        flex: 1;
        
        &.status-ended {
          color: #999999;
        }
      }
    }
  }
}

.type-selector {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .type-item {
    flex: 1;
    background: #FFFFFF;
    border-radius: 12rpx;
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2rpx solid transparent;
    box-sizing: border-box;
    min-width: 0;
    
    &.active {
      border-color: #F5A623;
      background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      color: #FFFFFF;
    }
    
    .type-icon {
      font-size: 40rpx;
      font-weight: bold;
      margin-bottom: 6rpx;
    }
    
    .type-text {
      font-size: 22rpx;
    }
  }
}

.amount-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  
  .amount-label {
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .amount-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }
  
  .amount-currency {
    font-size: 52rpx;
    font-weight: bold;
    color: #333333;
    line-height: 1.3;
  }
  
  .amount-input {
    flex: 1;
    font-size: 52rpx;
    font-weight: bold;
    color: #333333;
    border: none;
    min-height: 56rpx;
    line-height: 1.3;
    box-sizing: border-box;
  }
  
  .manual-microphone-btn {
    width: 56rpx;
    height: 56rpx;
    background: linear-gradient(135deg, #F5A623 0%, #E8940C 100%);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
    transition: all 0.3s;
    flex-shrink: 0;
    
    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
    
    .microphone-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.category-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  
  .category-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 0;
    display: block;
  }

  .category-more-btn {
    font-size: 26rpx;
    color: #F7B84D;
    font-weight: 500;
    padding: 4rpx 8rpx;
  }

  .frequent-category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;

    .category-item {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 16rpx 20rpx;
      background: #F5F5F5;
      border-radius: 8rpx;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      box-sizing: border-box;
      width: auto;
      max-width: 100%;

      &.selected {
        background: rgba(245, 166, 35, 0.1);
        border-color: #F7B84D;

        .category-name {
          color: #F7B84D;
          font-weight: bold;
        }
      }

      .category-icon-wrapper {
        margin-right: 4rpx;
        flex-shrink: 0;

        .category-icon {
          width: 32rpx;
          height: 32rpx;
          border-radius: 8rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;

          :deep(.app-icon) {
            display: block;
            line-height: 1;
          }
        }
      }

      .category-name {
        font-size: 24rpx;
        color: #666666;
        white-space: nowrap;
        line-height: 1.2;
      }
    }
  }
}

.category-drawer-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
}

.category-drawer-panel {
  display: flex;
  flex-direction: column;
  width: 78vw;
  max-width: 620rpx;
  height: 100vh;
  background: #FFFFFF;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 8rpx 0 32rpx rgba(0, 0, 0, 0.12);
  animation: category-drawer-slide-in 0.24s ease-out;

  .category-group {
    margin-bottom: 8rpx;
    padding: 0 8rpx;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .category-group-header {
    padding: 16rpx 8rpx 8rpx;

    .group-header-name {
      font-size: 26rpx;
      color: #999999;
      font-weight: 500;
      line-height: 1.2;
    }
  }

  .category-group-children {
    display: flex;
    flex-wrap: wrap;
    box-sizing: border-box;
  }
}

.category-drawer-scroll {
  flex: 1;
  min-height: 0;
  padding: calc(24rpx + env(safe-area-inset-top)) 20rpx 0;
  box-sizing: border-box;
}

.category-drawer-scroll-pad {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

.category-drawer-footer {
  flex-shrink: 0;
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.category-drawer-confirm-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  border-radius: 44rpx;
  background: #E8E8E8;
  color: #AAAAAA;
  font-size: 32rpx;
  font-weight: bold;
  margin: 0;
  padding: 0;
  transition: background 0.2s, color 0.2s;

  &::after {
    border: none;
  }

  &.active {
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
  }

  &.active:active {
    opacity: 0.9;
  }
}

.category-drawer-footer-dual {
  display: flex;
  gap: 16rpx;
  align-items: center;

  .category-drawer-manage-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border: none;
    border-radius: 44rpx;
    background: #FFFFFF;
    color: #666666;
    font-size: 28rpx;
    margin: 0;
    padding: 0;
    border: 1rpx solid #E0E0E0;

    &::after {
      border: none;
    }
  }

  .category-drawer-confirm-btn {
    flex: 1.2;
    width: auto;
  }
}

.custom-category-panel {
  display: flex;
  flex-direction: column;
}

.custom-category-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx 16rpx;
  border-bottom: 1rpx solid #F0F0F0;

  .custom-category-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }

  .custom-category-close {
    font-size: 44rpx;
    color: #999999;
    line-height: 1;
    padding: 0 8rpx;
  }
}

.custom-category-loading {
  padding: 48rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

.custom-category-scroll {
  flex: 1;
  min-height: 0;
  height: 60vh;
}

.custom-category-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
  gap: 12rpx;
}

.custom-category-sort {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex-shrink: 0;

  .sort-btn {
    width: 44rpx;
    height: 36rpx;
    line-height: 36rpx;
    text-align: center;
    font-size: 24rpx;
    color: #666666;
    background: #F5F5F5;
    border-radius: 8rpx;

    &.disabled {
      opacity: 0.3;
    }
  }
}

.custom-category-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-category-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;

  .custom-category-name {
    font-size: 28rpx;
    color: #333333;
  }

  .custom-category-meta {
    font-size: 22rpx;
    color: #999999;
  }
}

.custom-category-delete {
  flex-shrink: 0;
  font-size: 26rpx;
  color: #E74C3C;
  padding: 8rpx;
}

.custom-category-used {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #BBBBBB;
}

.custom-category-scroll-pad {
  height: calc(180rpx + env(safe-area-inset-bottom));
}

.custom-category-footer {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  .custom-category-add-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    border: 1rpx dashed #F5A623;
    border-radius: 40rpx;
    background: #FFFBF2;
    color: #F5A623;
    font-size: 28rpx;
    margin: 0;
    padding: 0;

    &::after {
      border: none;
    }
  }
}

.custom-form-field {
  margin-bottom: 24rpx;

  .custom-form-label {
    display: block;
    font-size: 26rpx;
    color: #666666;
    margin-bottom: 12rpx;
  }

  .custom-form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background: #F5F5F5;
    border-radius: 12rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
}

.custom-form-tip {
  display: block;
  font-size: 24rpx;
  color: #999999;
  line-height: 1.5;
}

@keyframes category-drawer-slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.allocation-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 8rpx;
    display: block;
  }
  
  .allocation-hint {
    font-size: 22rpx;
    color: #999999;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .allocation-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
  }
  
  .allocation-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8rpx 12rpx;
    background: #F5F5F5;
    border-radius: 8rpx;
    border: 2rpx solid transparent;
    min-width: 0;
    max-width: 100%;
    
    &.selected {
      background: rgba(245, 166, 35, 0.1);
      border-color: #F7B84D;
      
      .allocation-name {
        color: #F7B84D;
        font-weight: 600;
      }
    }
    
    .allocation-avatar {
      width: 40rpx;
      height: 40rpx;
      border-radius: 50%;
      margin-right: 8rpx;
      flex-shrink: 0;
      
      &.placeholder {
        background: #F7B84D;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22rpx;
      }
    }
    
    .allocation-name {
      font-size: 20rpx;
      color: #666666;
      max-width: 160rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.2;
    }
  }
}

.remark-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .remark-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
    cursor: pointer;
    
    .remark-label {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      margin-right: 16rpx;
    }
    
    .remark-content {
      flex: 1;
      font-size: 26rpx;
      color: #333333;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .remark-placeholder {
      flex: 1;
      font-size: 26rpx;
      color: #999999;
      text-align: right;
    }
  }
}

.date-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .date-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
    
    .date-label {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      margin-right: 16rpx;
    }
    
    .date-content {
      flex: 1;
      font-size: 26rpx;
      color: #333333;
      text-align: right;
    }
  }
}

.payment-method-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .payment-method-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8rpx;
    
    .payment-method-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 10rpx 8rpx;
      border-radius: 8rpx;
      background: #F5F5F5;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      min-width: 0;
      
      &.selected {
        background: rgba(245, 166, 35, 0.1);
        border-color: #F7B84D;
        
        .payment-method-name {
          color: #F7B84D;
          font-weight: bold;
        }
      }
      
      .payment-method-icon {
        width: 32rpx;
        height: 32rpx;
        border-radius: 8rpx;
        margin-right: 4rpx;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-sizing: border-box;

        :deep(.app-icon) {
          display: block;
          line-height: 1;
        }
      }
      
      .payment-method-name {
        font-size: 24rpx;
        color: #666666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.currency-inline-bar {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
}

.currency-inline-scroll {
  width: 100%;
  white-space: nowrap;
}

.currency-inline-list {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding-right: 8rpx;
}

.currency-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40rpx;
  padding: 0 12rpx;
  box-sizing: border-box;
  border-radius: 12rpx;
  background: #F5F5F5;
  border: 2rpx solid transparent;
  flex-shrink: 0;
  
  &.selected {
    background: rgba(245, 166, 35, 0.15);
    border-color: #F7B84D;
    
    .currency-chip-symbol,
    .currency-chip-name {
      color: #F7B84D;
      font-weight: 600;
    }
  }
  
  .currency-chip-symbol {
    font-size: 20rpx;
    line-height: 1;
    color: #F5A623;
    margin-right: 4rpx;
    font-weight: bold;
  }
  
  .currency-chip-name {
    font-size: 20rpx;
    line-height: 1;
    color: #666666;
    white-space: nowrap;
  }
}

.image-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    box-sizing: border-box;
    width: 100%;
    
    .image-item {
      position: relative;
      width: 120rpx;
      height: 120rpx;
      border-radius: 10rpx;
      overflow: hidden;
      box-sizing: border-box;
      
      .uploaded-image {
        width: 100%;
        height: 100%;
      }
      
      .image-delete {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        width: 48rpx;
        height: 48rpx;
        background: #F5A623;
        border-radius: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 32rpx;
        font-weight: bold;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
      }
    }
    
    .image-upload-btn {
      width: 120rpx;
      height: 120rpx;
      border: 2rpx dashed #CCCCCC;
      border-radius: 10rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fff;
      box-sizing: border-box;
      
      .upload-icon {
        font-size: 28rpx;
        color: #999999;
        margin-bottom: 4rpx;
      }
      
      .upload-text {
        font-size: 20rpx;
        color: #999999;
      }
    }
  }
}

.save-section {
  padding: 16rpx 0;
  margin-bottom: 20rpx;
  box-sizing: border-box;
  width: 100%;
  
  .save-btn {
    width: 100%;
    height: 80rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    border-radius: 40rpx;
    font-size: 30rpx;
    font-weight: bold;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    
    &.disabled {
      opacity: 0.6;
      background: #CCCCCC;
    }
  }
}

.ai-form-section {
  margin-top: 16rpx;
  
  .ai-form-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #F5A623;
    margin-bottom: 16rpx;
    padding: 0 4rpx;
  }
}

.ai-tip-section {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 40rpx 24rpx;
  margin-top: 16rpx;
  text-align: center;
  box-sizing: border-box;
  width: 100%;
  
  .ai-tip-text {
    font-size: 26rpx;
    color: #666666;
    line-height: 1.6;
    display: block;
    margin-bottom: 24rpx;
  }
  
  .ai-tip-examples {
    font-size: 24rpx;
    color: #999999;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .ai-tip-examples-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    align-items: flex-start;
    padding: 0 20rpx;
    
    .ai-tip-example {
      font-size: 24rpx;
      color: #999999;
      text-align: left;
    }
  }
}

.ai-input-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  
  .ai-input-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
    
    .ai-icon {
      font-size: 32rpx;
    }
    
    .ai-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
    }
  }
  
  .ai-input-wrapper-border {
    position: relative;
    border-radius: 12rpx;
    padding: 3rpx;
    background: linear-gradient(90deg, #FF6B35, #F7931E, #FF6B35, #9B59B6, #8E44AD, #9B59B6);
    background-size: 300% 100%;
    animation: borderFlow 3s linear infinite;
    box-sizing: border-box;
    
    .ai-input-wrapper {
      position: relative;
      background: #FFFFFF;
      border-radius: 10rpx;
      padding: 0;
      box-sizing: border-box;
      min-height: 200rpx;
      
      .ai-input {
        width: 100%;
        background: transparent;
        border-radius: 10rpx;
        padding: 20rpx 200rpx 20rpx 20rpx;
        font-size: 26rpx;
        color: #333333;
        border: none;
        box-sizing: border-box;
        min-height: 200rpx;
        height: 200rpx;
        line-height: 1.6;
        vertical-align: top;
        text-align: left;
        resize: none;
      }
      
      .ai-input-actions {
        position: absolute;
        bottom: 12rpx;
        right: 12rpx;
        display: flex;
        align-items: center;
        gap: 12rpx;
        z-index: 10;
      }
      
      .ai-microphone-btn {
        width: 56rpx;
        height: 56rpx;
        background: linear-gradient(135deg, #F5A623 0%, #E8940C 100%);
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
        transition: all 0.3s;
        
        &:active {
          transform: scale(0.95);
          opacity: 0.8;
        }
        
        .microphone-icon {
          font-size: 32rpx;
        }
      }
      
      .ai-recognize-btn {
        background: linear-gradient(135deg, #FF6B35 0%, #9B59B6 100%);
        color: #FFFFFF;
        border: none;
        border-radius: 8rpx;
        padding: 12rpx 24rpx;
        font-size: 24rpx;
        font-weight: bold;
        min-width: 100rpx;
        box-sizing: border-box;
        height: 56rpx;
        line-height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &::after {
          border: none;
        }
        
        &[disabled] {
          opacity: 0.5;
        }
      }
    }
  }
}

@keyframes borderFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.custom-category-form-mask {
  z-index: 1100;
}

.dialog-content {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  
  &.ai-confirm-dialog {
    max-width: 90%;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .dialog-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .dialog-close {
      font-size: 48rpx;
      color: #999999;
      line-height: 1;
    }
  }
  
  .dialog-body {
    padding: 32rpx;
    box-sizing: border-box;
    
    .ai-result-item {
      display: flex;
      align-items: center;
      margin-bottom: 24rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .ai-result-label {
        font-size: 26rpx;
        color: #666666;
        min-width: 120rpx;
      }
      
      .ai-result-value {
        font-size: 28rpx;
        color: #333333;
        font-weight: 500;
        flex: 1;
        
        &.amount {
          color: #F5A623;
          font-weight: bold;
          font-size: 32rpx;
        }
      }
      
      .ai-result-category {
        display: flex;
        align-items: center;
        gap: 12rpx;
        flex: 1;
        
        .category-icon-small {
          width: 48rpx;
          height: 48rpx;
          border-radius: 8rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24rpx;
        }
      }
    }
    
    .remark-dialog-input {
      width: 100%;
      min-height: 200rpx;
      background: #F5F5F5;
      border-radius: 12rpx;
      padding: 16rpx;
      font-size: 28rpx;
      line-height: 1.5;
      border: none;
      box-sizing: border-box;
    }
  }
  
  &.remark-dialog {
    max-width: 90%;
  }
  
  .dialog-footer {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx 32rpx;
    border-top: 1rpx solid #F5F5F5;
    box-sizing: border-box;
    
    .dialog-btn {
      flex: 1;
      height: 88rpx;
      border-radius: 44rpx;
      border: none !important;
      outline: none;
      font-size: 32rpx;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      margin: 0;
      padding: 0;
      line-height: 88rpx;
      
      &::after {
        border: none !important;
        border-radius: 44rpx;
      }
      
      &.cancel {
        background: #F5F5F5 !important;
        color: #666666;
      }
      
      &.confirm {
        background: linear-gradient(135deg, #F5A623 0%, #E8940C 100%) !important;
        color: #FFFFFF;
        box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
      }
    }
  }
}

// 语音输入弹窗样式
.voice-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.voice-dialog-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .voice-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid #F5F5F5;
    
    .voice-dialog-icons {
      display: flex;
      gap: 24rpx;
      
      .voice-dialog-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        &:active {
          opacity: 0.6;
        }
      }
    }
    
    .voice-dialog-close {
      font-size: 48rpx;
      color: #999999;
      line-height: 1;
      cursor: pointer;
      
      &:active {
        opacity: 0.6;
      }
    }
  }
  
  .voice-dialog-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 40rpx 32rpx 60rpx;
    overflow-y: auto;
    
    .voice-suggestions {
      margin-bottom: 60rpx;
      text-align: center;
      
      .voice-suggestion-text {
        font-size: 24rpx;
        color: #999999;
        margin-bottom: 24rpx;
        display: block;
      }
      
      .voice-suggestion-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;
        justify-content: center;
        
        .voice-tag {
          padding: 12rpx 24rpx;
          background: #F5F5F5;
          border-radius: 20rpx;
          font-size: 24rpx;
          color: #666666;
          white-space: nowrap;
        }
      }
    }
    
    .voice-input-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40rpx;
      padding-bottom: 80rpx;
      
      .voice-status-text {
        font-size: 36rpx;
        font-weight: bold;
        color: #F5A623;
        text-align: center;
        
        &.recording {
          color: #F5A623;
          animation: pulse 1.5s ease-in-out infinite;
        }
      }
      
      .voice-hint-text {
        font-size: 24rpx;
        color: #999999;
        text-align: center;
      }
      
      .voice-record-btn {
        width: 600rpx;
        height: 120rpx;
        border-radius: 60rpx;
        background: linear-gradient(135deg, #F5A623 0%, #E8940C 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
        
        &.recording {
          background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
          box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);
        }
        
        &:active {
          transform: scale(0.98);
        }
        
        .voice-record-icon {
          font-size: 60rpx;
          z-index: 2;
          position: relative;
        }
        
        .voice-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10rpx;
          z-index: 1;
          
          .voice-wave {
            width: 8rpx;
            height: 60rpx;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 4rpx;
            animation: waveAnimation 1.2s ease-in-out infinite;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes waveAnimation {
  0%, 100% {
    transform: scaleY(0.3);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>

