<template>
  <view class="app-tab-bar">
    <view class="tab-bar-panel">
      <view class="tab-side tab-side-left">
        <view
          v-for="item in leftTabs"
          :key="item.index"
          class="tab-item"
          :class="{ active: current === item.index }"
          @click="switchTab(item)"
        >
          <app-icon
            class="tab-icon"
            :name="item.icon"
            :filled="current === item.index"
            :size="22"
            :color="current === item.index ? '#F5A623' : '#999999'"
          />
          <text class="tab-text">{{ item.text }}</text>
        </view>
      </view>

      <view class="tab-center-gap" />

      <view class="tab-side tab-side-right">
        <view
          v-for="item in rightTabs"
          :key="item.index"
          class="tab-item"
          :class="{ active: current === item.index }"
          @click="switchTab(item)"
        >
          <app-icon
            class="tab-icon"
            :name="item.icon"
            :filled="current === item.index"
            :size="22"
            :color="current === item.index ? '#F5A623' : '#999999'"
          />
          <text class="tab-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="center-btn" @click.stop="handleAddTransaction">
      <app-icon class="center-icon" name="compose" :size="30" color="#FFFFFF" />
      <text class="center-text">记一笔</text>
    </view>
  </view>
</template>

<script>
import { goToAddTransaction } from '@/utils/navigation';

export default {
  name: 'AppTabBar',
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      leftTabs: [
        {
          index: 0,
          pagePath: '/pages/index/index',
          text: '首页',
          icon: 'home'
        },
        {
          index: 1,
          pagePath: '/pages/account-books/account-books',
          text: '账本',
          icon: 'wallet'
        }
      ],
      rightTabs: [
        {
          index: 2,
          pagePath: '/pages/statistics/statistics',
          text: '统计',
          icon: 'bars'
        },
        {
          index: 3,
          pagePath: '/pages/profile/profile',
          text: '我的',
          icon: 'person'
        }
      ]
    };
  },
  methods: {
    switchTab(item) {
      if (this.current === item.index) return;
      uni.switchTab({
        url: item.pagePath
      });
    },
    handleAddTransaction() {
      goToAddTransaction(0);
    }
  }
};
</script>

<style lang="scss" scoped>
.app-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #ffffff;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.06);
}

.tab-bar-panel {
  display: flex;
  align-items: flex-end;
  height: 110rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.tab-side {
  flex: 1;
  display: flex;
  align-items: flex-end;
  min-width: 0;
  padding-bottom: 22rpx;
  box-sizing: border-box;
}

.tab-side-left {
  justify-content: space-evenly;
}

.tab-side-right {
  justify-content: space-evenly;
}

.tab-center-gap {
  width: 220rpx;
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 88rpx;

  .tab-icon {
    line-height: 1;
    margin-bottom: 6rpx;
  }

  .tab-text {
    font-size: 22rpx;
    color: #999999;
    line-height: 1.2;
  }

  &.active {
    .tab-text {
      color: #F5A623;
      font-weight: 600;
    }
  }
}

.center-btn {
  position: absolute;
  left: 50%;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #F7B84D 0%, #F5A623 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 36rpx rgba(245, 166, 35, 0.38);
  border: 10rpx solid #ffffff;
  box-sizing: border-box;
  z-index: 2;

  &:active {
    transform: translateX(-50%) translateY(2rpx) scale(0.96);
  }

  .center-icon {
    line-height: 1;
  }

  .center-text {
    margin-top: 6rpx;
    font-size: 36rpx;
    color: #ffffff;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>
