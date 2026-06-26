<template>
  <view class="statistics-container">
    <view class="header-section">
      <view class="type-switch-row">
        <view class="type-switch">
          <view
            class="switch-btn"
            :class="{ active: viewType === 'expense' }"
            @click="handleViewTypeChange('expense')"
          >支出</view>
          <view
            class="switch-btn"
            :class="{ active: viewType === 'income' }"
            @click="handleViewTypeChange('income')"
          >入账</view>
        </view>
      </view>

      <view class="date-row">
        <picker mode="selector" :range="yearOptions" :value="yearPickerIndex" @change="onYearChange">
          <view class="year-picker">
            <text>{{ selectedYear }}年</text>
            <text class="year-arrow">▾</text>
          </view>
        </picker>
        <scroll-view scroll-x class="month-tabs" :show-scrollbar="false">
          <view class="month-tabs-inner">
            <view
              v-for="tab in monthTabs"
              :key="tab.value"
              class="month-tab"
              :class="{ active: selectedMonth === tab.value }"
              @click="selectMonthTab(tab)"
            >
              {{ tab.label }}
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="total-amount-section">
        <text class="total-label">共{{ viewType === 'expense' ? '支出' : '入账' }}</text>
        <text class="total-amount">¥{{ displayTotalAmount }}</text>
      </view>
    </view>

    <view class="category-statistics">
      <text class="section-title">{{ viewType === 'expense' ? '支出构成' : '收入构成' }}</text>
      <view class="pie-chart-container" v-if="categoryStatistics.length > 0">
        <canvas
          canvas-id="pieCanvas"
          class="pie-chart-canvas"
          @touchstart="handleCanvasTouch"
          @touchmove="handleCanvasTouch"
          @touchend="handleCanvasTouchEnd"
        ></canvas>
      </view>
      <view v-else class="empty-chart">
        <text class="empty-text">暂无{{ viewType === 'expense' ? '支出' : '收入' }}数据</text>
      </view>

      <view class="category-list">
        <view
          v-for="item in categoryStatistics"
          :key="item.categoryId"
          class="category-stat-item"
          @click="goToCategoryDetail(item)"
        >
          <view class="category-info">
            <view class="category-icon" :style="{ backgroundColor: item.categoryColor || '#F7B84D' }">
              <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="16" color="#FFFFFF" />
            </view>
            <text class="category-name">{{ item.categoryName }}</text>
          </view>
          <view class="category-right">
            <view class="category-progress">
              <view
                class="progress-bar-item"
                :style="{ width: `${item.percentage}%`, backgroundColor: item.categoryColor || '#F7B84D' }"
              ></view>
            </view>
            <view class="category-amount">
              <text class="amount">¥{{ item.amount.toFixed(2) }}</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="chart-section">
      <text class="section-title">每日{{ viewType === 'expense' ? '支出' : '收入' }}</text>
      <view class="bar-chart-container">
        <canvas
          v-if="!dailyBarImage"
          canvas-id="dailyBarCanvas"
          id="dailyBarCanvas"
          class="bar-chart-canvas daily-bar-canvas"
        ></canvas>
        <image
          v-else
          :src="dailyBarImage"
          class="bar-chart-canvas daily-bar-canvas bar-chart-image"
          mode="widthFix"
        />
      </view>
    </view>

    <view class="chart-section">
      <text class="section-title">月收支对比</text>
      <view class="chart-legend">
        <view class="legend-item"><view class="legend-dot expense"></view><text>支出</text></view>
        <view class="legend-item"><view class="legend-dot income"></view><text>收入</text></view>
      </view>
      <view class="bar-chart-container">
        <canvas
          v-if="!monthlyBarImage"
          canvas-id="monthlyBarCanvas"
          id="monthlyBarCanvas"
          class="bar-chart-canvas monthly-bar-canvas"
        ></canvas>
        <image
          v-else
          :src="monthlyBarImage"
          class="bar-chart-canvas monthly-bar-canvas bar-chart-image"
          mode="widthFix"
        />
      </view>
    </view>

    <app-tab-bar :current="2" />
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { hideNativeTabBar } from '@/utils/tabBar';
import { isGuestBrowsing } from '@/utils/auth';

export default {
  data() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return {
      selectedYear: currentYear,
      selectedMonth: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      viewType: 'expense',
      overview: null,
      loading: false,
      hoveredIndex: -1,
      pieChartCenterX: 150,
      pieChartCenterY: 150,
      pieChartRadius: 70,
      dailyBarImage: '',
      monthlyBarImage: ''
    };
  },
  computed: {
    yearOptions() {
      const now = new Date().getFullYear();
      const years = [];
      for (let y = now; y >= now - 5; y--) {
        years.push(`${y}年`);
      }
      return years;
    },
    yearPickerIndex() {
      const idx = this.yearOptions.findIndex(y => parseInt(y, 10) === this.selectedYear);
      return idx >= 0 ? idx : 0;
    },
    monthTabs() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const endMonth = this.selectedYear === currentYear ? currentMonth : 12;
      const startMonth = Math.max(1, endMonth - 5);
      const tabs = [];
      for (let m = startMonth; m <= endMonth; m++) {
        tabs.push({
          year: this.selectedYear,
          month: m,
          label: `${m}月`,
          value: `${this.selectedYear}-${String(m).padStart(2, '0')}`
        });
      }
      return tabs;
    },
    categoryStatistics() {
      if (!this.overview) return [];
      const list = this.viewType === 'expense'
        ? (this.overview.expenseCategoryStatistics || [])
        : (this.overview.incomeCategoryStatistics || []);
      return list.map(item => ({
        ...item,
        amount: Number(item.amount) || 0,
        percentage: Number(item.percentage) || 0
      }));
    },
    displayTotalAmount() {
      if (!this.overview) return '0.00';
      const val = this.viewType === 'expense'
        ? this.overview.totalExpense
        : this.overview.totalIncome;
      return (Number(val) || 0).toFixed(2);
    }
  },
  watch: {
    viewType() {
      this.$nextTick(() => {
        this.drawPieChart();
        this.drawDailyBarChart();
      });
    },
    categoryStatistics: {
      handler() {
        this.$nextTick(() => this.drawPieChart());
      },
      deep: true
    }
  },
  onLoad() {
    this.ensureSelectedMonthInTabs();
    this.loadData();
  },
  onShow() {
    hideNativeTabBar();
    this.loadData();
  },
  onReady() {
    this.$nextTick(() => {
      this.drawPieChart();
      this.drawDailyBarChart();
      this.drawMonthlyBarChart();
    });
  },
  methods: {
    ensureSelectedMonthInTabs() {
      const tabs = this.monthTabs;
      if (!tabs.length) return;
      const exists = tabs.some(t => t.value === this.selectedMonth);
      if (!exists) {
        this.selectedMonth = tabs[tabs.length - 1].value;
      }
    },

    onYearChange(e) {
      const idx = Number(e.detail.value);
      const yearStr = this.yearOptions[idx] || '';
      this.selectedYear = parseInt(yearStr, 10) || new Date().getFullYear();
      this.ensureSelectedMonthInTabs();
      this.loadData();
    },

    selectMonthTab(tab) {
      this.selectedMonth = tab.value;
      this.loadData();
    },

    handleViewTypeChange(type) {
      this.viewType = type;
    },

    goToCategoryDetail(item) {
      const { year, month } = this.getSelectedYearMonth();
      const type = this.viewType === 'expense' ? 0 : 1;
      uni.navigateTo({
        url: `/pages/statistics-category-detail/statistics-category-detail?categoryId=${item.categoryId}&categoryName=${encodeURIComponent(item.categoryName || '')}&year=${year}&month=${month}&type=${type}`
      });
    },

    getSelectedYearMonth() {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      return { year, month };
    },

    async loadData() {
      if (isGuestBrowsing()) {
        this.overview = null;
        this.$nextTick(() => {
          this.drawPieChart();
          this.drawDailyBarChart();
          this.drawMonthlyBarChart();
        });
        return;
      }

      const { year, month } = this.getSelectedYearMonth();
      this.loading = true;
      try {
        this.overview = await api.transactions.getStatisticsOverview(year, month);
        this.$nextTick(() => {
          this.drawPieChart();
          this.drawDailyBarChart();
          this.drawMonthlyBarChart();
        });
      } catch (error) {
        console.error('加载统计失败', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    getColor(index) {
      const colors = ['#F7B84D', '#E8940C', '#F5A623', '#FFD080', '#FFE0A8', '#F7C96B'];
      return colors[index % colors.length];
    },

    darkenColor(color, percent) {
      const num = parseInt(String(color).replace('#', ''), 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const newR = Math.max(0, Math.floor(r * (1 - percent)));
      const newG = Math.max(0, Math.floor(g * (1 - percent)));
      const newB = Math.max(0, Math.floor(b * (1 - percent)));
      return '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
    },

    handleCanvasTouch(e) {
      const touch = e.touches[0];
      if (!touch) return;
      const query = uni.createSelectorQuery().in(this);
      query.select('.pie-chart-canvas').boundingClientRect((rect) => {
        if (!rect) return;
        const touchX = touch.clientX || touch.x || touch.pageX || 0;
        const touchY = touch.clientY || touch.y || touch.pageY || 0;
        const x = touchX - rect.left;
        const y = touchY - rect.top;
        const hoveredIndex = this.getSectorAtPoint(x, y);
        if (hoveredIndex !== this.hoveredIndex) {
          this.hoveredIndex = hoveredIndex;
          this.drawPieChart();
        }
      }).exec();
    },

    handleCanvasTouchEnd() {
      this.hoveredIndex = -1;
      this.drawPieChart();
    },

    getSectorAtPoint(x, y) {
      if (!this.categoryStatistics.length) return -1;
      const centerX = this.pieChartCenterX;
      const centerY = this.pieChartCenterY;
      const radius = this.pieChartRadius;
      const dx = x - centerX;
      const dy = y - centerY;
      if (Math.sqrt(dx * dx + dy * dy) > radius) return -1;
      let angle = (Math.atan2(dy, dx) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
      const total = this.categoryStatistics.reduce((sum, item) => sum + item.amount, 0);
      if (total === 0) return -1;
      let currentAngle = 0;
      for (let i = 0; i < this.categoryStatistics.length; i++) {
        const sectorAngle = (this.categoryStatistics[i].amount / total) * 2 * Math.PI;
        if (angle >= currentAngle && angle < currentAngle + sectorAngle) return i;
        currentAngle += sectorAngle;
      }
      return -1;
    },

    truncatePieLabel(ctx, name, maxWidth, fontSize) {
      if (!name) return '';
      ctx.setFontSize(fontSize);
      const ellipsis = '…';
      let text = String(name);
      const measure = (value) => {
        try {
          return ctx.measureText(value).width || value.length * fontSize * 0.6;
        } catch (e) {
          return value.length * fontSize * 0.6;
        }
      };
      if (measure(text) <= maxWidth) return text;
      while (text.length > 1 && measure(text + ellipsis) > maxWidth) {
        text = text.slice(0, -1);
      }
      return text + ellipsis;
    },

    drawPieChart() {
      if (!this.categoryStatistics.length) return;
      const query = uni.createSelectorQuery().in(this);
      query.select('.pie-chart-canvas').boundingClientRect((rect) => {
        if (!rect) {
          this.drawPieChartWithSize(150, 150, 300, 300);
          return;
        }
        this.drawPieChartWithSize(rect.width / 2, rect.height / 2, rect.width, rect.height);
      }).exec();
    },

    drawPieChartWithSize(centerX, centerY, canvasWidth = 300, canvasHeight = 300) {
      const ctx = uni.createCanvasContext('pieCanvas', this);
      this.pieChartCenterX = centerX;
      this.pieChartCenterY = centerY;
      const padding = 12;
      const labelReserve = 26;
      const maxRadiusFromHeight = canvasHeight / 2 - labelReserve;
      const maxRadiusFromWidth = canvasWidth / 2 - 30;
      this.pieChartRadius = Math.min(
        canvasWidth * 0.22,
        maxRadiusFromHeight,
        maxRadiusFromWidth
      );
      const radius = this.pieChartRadius;
      const total = this.categoryStatistics.reduce((sum, item) => sum + item.amount, 0);
      if (total === 0) {
        ctx.draw();
        return;
      }
      let startAngle = -Math.PI / 2;
      this.categoryStatistics.forEach((item, index) => {
        const angle = (item.amount / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;
        const midAngle = (startAngle + endAngle) / 2;
        let color = item.categoryColor || this.getColor(index);
        const isHovered = this.hoveredIndex === index;
        if (isHovered) color = this.darkenColor(color, 0.2);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.setFillStyle(color);
        ctx.fill();

        if (angle < 0.08) {
          startAngle = endAngle;
          return;
        }

        const cos = Math.cos(midAngle);
        const sin = Math.sin(midAngle);
        const absCos = Math.abs(cos);
        const absSin = Math.abs(sin);
        const lineStartX = centerX + radius * cos;
        const lineStartY = centerY + radius * sin;
        const lineLength = Math.min(radius * 0.45, 24);
        const lineEndX = centerX + (radius + lineLength) * cos;
        let lineEndY = centerY + (radius + lineLength) * sin;
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.setStrokeStyle(isHovered ? this.darkenColor('#E0E0E0', 0.3) : '#E0E0E0');
        ctx.setLineWidth(isHovered ? 1.5 : 1);
        ctx.stroke();

        const labelOffset = 6;
        const nameFontSize = 11;
        const pctFontSize = 10;
        let labelX;
        let textAlign;
        if (absCos >= absSin) {
          const isRight = cos >= 0;
          textAlign = isRight ? 'left' : 'right';
          labelX = isRight ? lineEndX + labelOffset : lineEndX - labelOffset;
        } else {
          textAlign = 'center';
          labelX = lineEndX;
        }
        let labelY = lineEndY;
        labelY = Math.max(padding + 10, Math.min(canvasHeight - padding - 10, labelY));
        labelX = Math.max(padding + 4, Math.min(canvasWidth - padding - 4, labelX));

        let maxTextWidth;
        if (textAlign === 'left') {
          maxTextWidth = canvasWidth - padding - labelX;
        } else if (textAlign === 'right') {
          maxTextWidth = labelX - padding;
        } else {
          maxTextWidth = Math.min(labelX - padding, canvasWidth - padding - labelX) * 2;
        }
        const displayName = this.truncatePieLabel(
          ctx,
          item.categoryName,
          Math.max(36, maxTextWidth),
          nameFontSize
        );

        ctx.setTextAlign(textAlign);
        ctx.setTextBaseline('middle');
        ctx.setFontSize(nameFontSize);
        ctx.setFillStyle(isHovered ? '#000' : '#333');
        ctx.fillText(displayName, labelX, labelY - 7);
        ctx.setFontSize(pctFontSize);
        ctx.setFillStyle(isHovered ? '#666' : '#999');
        ctx.fillText(`${item.percentage.toFixed(1)}%`, labelX, labelY + 7);
        startAngle = endAngle;
      });
      ctx.draw();
    },

    formatChartAmount(val) {
      const n = Number(val) || 0;
      if (n <= 0) return '';
      if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万`;
      if (n >= 1000) return n.toFixed(0);
      if (n >= 100) return n.toFixed(0);
      return n.toFixed(2);
    },

    drawBarAmountLabel(ctx, text, x, labelY) {
      if (!text) return;
      ctx.setFillStyle('#666666');
      ctx.setFontSize(8);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('bottom');
      ctx.fillText(text, x, labelY);
    },

    canvasToImage(canvasId, field) {
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId,
          success: (res) => {
            this[field] = res.tempFilePath;
          },
          fail: (err) => {
            console.error('导出图表图片失败', canvasId, err);
          }
        }, this);
      }, 80);
    },

    drawDailyBarChart(retry = 0) {
      const draw = () => {
        const query = uni.createSelectorQuery().in(this);
        query.select('#dailyBarCanvas').boundingClientRect((rect) => {
          if (!rect || !rect.width || !rect.height) {
            if (retry < 5) {
              setTimeout(() => this.drawDailyBarChart(retry + 1), 100);
            }
            return;
          }
          this.renderDailyBarChart(rect.width, rect.height);
        }).exec();
      };
      if (this.dailyBarImage) {
        this.dailyBarImage = '';
        this.$nextTick(draw);
      } else {
        draw();
      }
    },

    renderDailyBarChart(width, height) {
      const ctx = uni.createCanvasContext('dailyBarCanvas', this);
      ctx.clearRect(0, 0, width, height);
      const daily = (this.overview && this.overview.dailyStatistics) || [];
      const padding = { left: 28, right: 12, top: 20, bottom: 28 };
      const plotTop = padding.top;
      const chartW = width - padding.left - padding.right;
      const chartH = height - plotTop - padding.bottom;
      const values = daily.map(d => this.viewType === 'expense' ? Number(d.expenseAmount) : Number(d.incomeAmount));
      const maxVal = Math.max(...values, 1);
      const barCount = daily.length || 1;
      const gap = 2;
      const barW = Math.max(2, (chartW - gap * (barCount - 1)) / barCount);
      ctx.setStrokeStyle('#EEEEEE');
      ctx.setLineWidth(1);
      ctx.beginPath();
      ctx.moveTo(padding.left, plotTop);
      ctx.lineTo(padding.left, plotTop + chartH);
      ctx.lineTo(padding.left + chartW, plotTop + chartH);
      ctx.stroke();
      daily.forEach((item, index) => {
        const val = values[index];
        const barH = (val / maxVal) * chartH;
        const x = padding.left + index * (barW + gap);
        const y = plotTop + chartH - barH;
        ctx.setFillStyle(this.viewType === 'expense' ? '#F7B84D' : '#5CB85C');
        ctx.fillRect(x, y, barW, barH);
        if (val > 0) {
          this.drawBarAmountLabel(ctx, this.formatChartAmount(val), x + barW / 2, y - 3);
        }
        if (barCount <= 31 && (item.day === 1 || item.day % 5 === 0 || item.day === barCount)) {
          ctx.setFillStyle('#999999');
          ctx.setFontSize(9);
          ctx.setTextAlign('center');
          ctx.setTextBaseline('alphabetic');
          ctx.fillText(String(item.day), x + barW / 2, plotTop + chartH + 14);
        }
      });
      ctx.draw(false, () => {
        this.canvasToImage('dailyBarCanvas', 'dailyBarImage');
      });
    },

    drawMonthlyBarChart(retry = 0) {
      const draw = () => {
        const query = uni.createSelectorQuery().in(this);
        query.select('#monthlyBarCanvas').boundingClientRect((rect) => {
          if (!rect || !rect.width || !rect.height) {
            if (retry < 5) {
              setTimeout(() => this.drawMonthlyBarChart(retry + 1), 100);
            }
            return;
          }
          this.renderMonthlyBarChart(rect.width, rect.height);
        }).exec();
      };
      if (this.monthlyBarImage) {
        this.monthlyBarImage = '';
        this.$nextTick(draw);
      } else {
        draw();
      }
    },

    renderMonthlyBarChart(width, height) {
      const ctx = uni.createCanvasContext('monthlyBarCanvas', this);
      ctx.clearRect(0, 0, width, height);
      const monthly = (this.overview && this.overview.monthlyComparison) || [];
      const padding = { left: 36, right: 12, top: 20, bottom: 32 };
      const plotTop = padding.top;
      const chartW = width - padding.left - padding.right;
      const chartH = height - plotTop - padding.bottom;
      const maxVal = Math.max(
        ...monthly.map(m => Math.max(Number(m.expenseAmount), Number(m.incomeAmount))),
        1
      );
      const groupCount = monthly.length || 1;
      const groupW = chartW / groupCount;
      const barW = Math.min(18, groupW * 0.28);
      ctx.setStrokeStyle('#EEEEEE');
      ctx.setLineWidth(1);
      ctx.beginPath();
      ctx.moveTo(padding.left, plotTop);
      ctx.lineTo(padding.left, plotTop + chartH);
      ctx.lineTo(padding.left + chartW, plotTop + chartH);
      ctx.stroke();
      monthly.forEach((item, index) => {
        const centerX = padding.left + groupW * index + groupW / 2;
        const expenseVal = Number(item.expenseAmount);
        const incomeVal = Number(item.incomeAmount);
        const expenseH = (expenseVal / maxVal) * chartH;
        const incomeH = (incomeVal / maxVal) * chartH;
        const expenseX = centerX - barW / 2 - 2;
        const incomeX = centerX + barW / 2 + 2;
        const expenseTop = plotTop + chartH - expenseH;
        const incomeTop = plotTop + chartH - incomeH;
        ctx.setFillStyle('#F7B84D');
        ctx.fillRect(centerX - barW - 2, expenseTop, barW, expenseH);
        ctx.setFillStyle('#5CB85C');
        ctx.fillRect(centerX + 2, incomeTop, barW, incomeH);
        if (expenseVal > 0) {
          this.drawBarAmountLabel(ctx, this.formatChartAmount(expenseVal), expenseX, expenseTop - 3);
        }
        if (incomeVal > 0) {
          this.drawBarAmountLabel(ctx, this.formatChartAmount(incomeVal), incomeX, incomeTop - 3);
        }
        ctx.setFillStyle('#666666');
        ctx.setFontSize(10);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('alphabetic');
        ctx.fillText(item.label || `${item.month}月`, centerX, plotTop + chartH + 18);
      });
      ctx.draw(false, () => {
        this.canvasToImage('monthlyBarCanvas', 'monthlyBarImage');
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.statistics-container {
  padding: 0;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  min-height: 100vh;
  box-sizing: border-box;
}

.header-section {
  background: #F7B84D;
  padding: 40rpx 32rpx 48rpx;
  color: #FFFFFF;

  .type-switch-row {
    display: flex;
    justify-content: center;
    margin-bottom: 24rpx;
  }

  .date-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 28rpx;
    min-height: 72rpx;
  }

  .year-picker {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #FFFFFF;

    .year-arrow {
      font-size: 28rpx;
      opacity: 0.85;
    }
  }

  .type-switch {
    display: inline-flex;
    gap: 6rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 24rpx;
    padding: 4rpx;

    .switch-btn {
      padding: 10rpx 28rpx;
      border-radius: 20rpx;
      font-size: 26rpx;
      color: #FFFFFF;

      &.active {
        background: #FFFFFF;
        color: #F7B84D;
        font-weight: 600;
      }
    }
  }

  .month-tabs {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  .month-tabs-inner {
    display: inline-flex;
    gap: 4rpx;
    padding-right: 8rpx;
  }

  .month-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 52rpx;
    padding: 12rpx 8rpx;
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.55);

    &.active {
      color: #FFFFFF;
      font-weight: 600;
    }
  }

  .total-amount-section {
    display: flex;
    flex-direction: column;

    .total-label {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 12rpx;
    }

    .total-amount {
      font-size: 64rpx;
      font-weight: bold;
      color: #FFFFFF;
      line-height: 1.2;
    }
  }
}

.category-statistics,
.chart-section {
  padding: 32rpx;
  border-bottom: 16rpx solid #F5F5F5;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
}

.category-statistics > .section-title {
  margin-bottom: 12rpx;
}

.pie-chart-container,
.bar-chart-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.pie-chart-container {
  margin-top: -8rpx;
  margin-bottom: -16rpx;
}

.pie-chart-canvas {
  width: 680rpx;
  height: 540rpx;
}

.bar-chart-canvas {
  width: 100%;
  height: 320rpx;
  display: block;
}

.monthly-bar-canvas {
  height: 360rpx;
}

.bar-chart-image {
  height: auto;
}

.empty-chart {
  padding: 80rpx 0;
  text-align: center;

  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.category-list {
  margin-top: 24rpx;

  .category-stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;

    &:active {
      opacity: 0.7;
    }

    &:last-child {
      border-bottom: none;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      min-width: 0;

      .category-icon {
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        box-sizing: border-box;

        :deep(.app-icon) {
          display: block;
          line-height: 1;
        }
      }

      .category-name {
        font-size: 28rpx;
        color: #333333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .category-right {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex-shrink: 0;
      width: 240rpx;

      .category-progress {
        flex: 1;
        height: 8rpx;
        background: #F0F0F0;
        border-radius: 4rpx;
        overflow: hidden;

        .progress-bar-item {
          height: 100%;
          border-radius: 4rpx;
        }
      }

      .category-amount {
        display: flex;
        align-items: center;
        gap: 4rpx;

        .amount {
          font-size: 26rpx;
          color: #333333;
        }

        .arrow {
          font-size: 28rpx;
          color: #CCCCCC;
        }
      }
    }
  }
}

.chart-legend {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: #666666;
  }

  .legend-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 4rpx;

    &.expense {
      background: #F7B84D;
    }

    &.income {
      background: #5CB85C;
    }
  }
}
</style>
