<template>
  <view class="panel-container">
    <view class="summary-bar">
      <text class="summary-period">{{ periodLabel }}</text>
      <text class="summary-amount">共{{ typeLabel }} ¥{{ totalAmount }}</text>
      <text class="summary-count">{{ transactions.length }}笔</text>
    </view>

    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else-if="transactions.length === 0" class="empty-state">
      <text class="empty-text">暂无交易记录</text>
    </view>

    <scroll-view v-else scroll-y class="transaction-scroll" :show-scrollbar="false">
      <view
        v-for="group in groupedTransactions"
        :key="group.date"
        class="date-group"
      >
        <view class="date-header">
          <text class="date-label">{{ group.dateLabel }}</text>
          <text class="date-total">{{ typeLabel }} ¥{{ group.dayTotal.toFixed(2) }}</text>
        </view>
        <view class="transaction-list">
          <view
            v-for="item in group.items"
            :key="item.id"
            class="transaction-item"
            @click="viewTransaction(item)"
          >
            <view class="transaction-left">
              <view class="category-icon" :style="{ backgroundColor: item.categoryColor || '#F7B84D' }">
                <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="18" color="#FFFFFF" />
              </view>
              <view class="transaction-info">
                <text class="category-name">{{ item.categoryName }}</text>
                <text v-if="item.remark" class="transaction-remark">{{ item.remark }}</text>
                <view class="transaction-meta">
                  <text class="transaction-time">{{ formatDate(item.transactionDate, 'HH:mm') }}</text>
                  <text v-if="item.accountBookName" class="transaction-book">{{ item.accountBookName }}</text>
                  <text v-if="item.accountBookType === 1 && item.userName" class="transaction-creator">{{ item.userName }}</text>
                </view>
              </view>
            </view>
            <view class="transaction-right">
              <text
                class="transaction-amount"
                :class="item.type === 0 ? 'expense' : 'income'"
              >
                {{ item.type === 0 ? '-' : '+' }}¥{{ item.amount.toFixed(2) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <transaction-detail
      :visible="showTransactionDetail"
      :transaction="selectedTransaction"
      @close="closeTransactionDetail"
    />
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate } from '@/utils/util';
import TransactionDetail from '@/components/transaction-detail/transaction-detail.vue';

export default {
  components: {
    TransactionDetail
  },
  props: {
    categoryId: {
      type: Number,
      default: null
    },
    categoryName: {
      type: String,
      default: ''
    },
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    transactionType: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      transactions: [],
      loading: false,
      showTransactionDetail: false,
      selectedTransaction: null
    };
  },
  computed: {
    typeLabel() {
      return this.transactionType === 0 ? '支出' : '收入';
    },
    periodLabel() {
      return `${this.year}年${this.month}月 · ${this.categoryName}`;
    },
    totalAmount() {
      const sum = this.transactions.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
      return sum.toFixed(2);
    },
    groupedTransactions() {
      const groups = [];
      const map = new Map();
      (this.transactions || []).forEach((item) => {
        const dateKey = formatDate(item.transactionDate, 'YYYY-MM-DD');
        if (!map.has(dateKey)) {
          const group = {
            date: dateKey,
            dateLabel: this.formatGroupDate(dateKey),
            dayTotal: 0,
            items: []
          };
          map.set(dateKey, group);
          groups.push(group);
        }
        const group = map.get(dateKey);
        group.items.push(item);
        group.dayTotal += Number(item.amount) || 0;
      });
      return groups;
    }
  },
  watch: {
    categoryId: {
      immediate: true,
      handler() {
        this.loadTransactions();
      }
    }
  },
  methods: {
    formatDate,

    formatGroupDate(dateKey) {
      const today = formatDate(new Date(), 'YYYY-MM-DD');
      const yesterday = formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
      if (dateKey === today) return '今天';
      if (dateKey === yesterday) return '昨天';
      const [, month, day] = dateKey.split('-');
      return `${parseInt(month)}月${parseInt(day)}日`;
    },

    async loadTransactions() {
      if (!this.categoryId) {
        this.transactions = [];
        return;
      }
      this.loading = true;
      try {
        this.transactions = await api.transactions.getCategoryStatisticsTransactions(
          this.categoryId,
          this.year,
          this.month,
          this.transactionType
        );
      } catch (error) {
        console.error('加载分类明细失败', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    viewTransaction(item) {
      this.selectedTransaction = item;
      this.showTransactionDetail = true;
    },

    closeTransactionDetail() {
      this.showTransactionDetail = false;
      this.selectedTransaction = null;
    }
  }
};
</script>

<style lang="scss" scoped>
.panel-container {
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
}

.summary-bar {
  background: #FFFFFF;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex-shrink: 0;

  .summary-period {
    font-size: 28rpx;
    color: #666666;
  }

  .summary-amount {
    font-size: 36rpx;
    font-weight: 600;
    color: #333333;
  }

  .summary-count {
    font-size: 24rpx;
    color: #999999;
  }
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.transaction-scroll {
  flex: 1;
  min-height: 0;
}

.date-group {
  margin-bottom: 16rpx;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx 12rpx;

  .date-label {
    font-size: 26rpx;
    color: #666666;
    font-weight: 500;
  }

  .date-total {
    font-size: 24rpx;
    color: #999999;
  }
}

.transaction-list {
  background: #FFFFFF;
  padding: 0 32rpx;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F0F0F0;

  &:last-child {
    border-bottom: none;
  }

  .transaction-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;

    .category-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      flex-shrink: 0;
      overflow: hidden;
      box-sizing: border-box;

      :deep(.app-icon) {
        display: block;
        line-height: 1;
      }
    }

    .transaction-info {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .category-name {
        font-size: 28rpx;
        color: #333333;
        margin-bottom: 6rpx;
      }

      .transaction-remark {
        font-size: 24rpx;
        color: #999999;
        margin-bottom: 4rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .transaction-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12rpx;
      }

      .transaction-time,
      .transaction-book,
      .transaction-creator {
        font-size: 22rpx;
        color: #BBBBBB;
      }
    }
  }

  .transaction-right {
    flex-shrink: 0;
    margin-left: 16rpx;

    .transaction-amount {
      font-size: 30rpx;
      font-weight: 600;

      &.expense {
        color: #333333;
      }

      &.income {
        color: #5CB85C;
      }
    }
  }
}
</style>
