<template>
  <view class="report-container">
    <view v-if="loading" class="loading-container">
      <text class="loading-text">正在生成报告...</text>
    </view>
    
    <scroll-view v-else class="report-content" scroll-y>
      <!-- 报告头部 -->
      <view class="report-header">
        <text class="report-title">{{ report?.accountBook?.name || '一起账本报告' }}</text>
        <text class="report-subtitle">生成时间：{{ formatDate(report?.generatedAt) }}</text>
        <!-- 筛选选项 -->
        <view class="filter-tabs">
          <view 
            class="filter-tab" 
            :class="{ active: viewType === 'all' }"
            @click="switchViewType('all')"
          >
            <text>全部</text>
          </view>
          <view 
            class="filter-tab" 
            :class="{ active: viewType === 'expense' }"
            @click="switchViewType('expense')"
          >
            <text>支出</text>
          </view>
          <view 
            class="filter-tab" 
            :class="{ active: viewType === 'income' }"
            @click="switchViewType('income')"
          >
            <text>收入</text>
          </view>
        </view>
      </view>
      
      <!-- 账本基本信息 -->
      <view class="section-card">
        <text class="section-title">账本信息</text>
        <view class="info-item">
          <text class="info-label">账本名称：</text>
          <text class="info-value">{{ report?.accountBook?.name }}</text>
        </view>
        <view class="info-item" v-if="report?.accountBook?.description">
          <text class="info-label">账本描述：</text>
          <text class="info-value">{{ report?.accountBook?.description }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">成员数量：</text>
          <text class="info-value">{{ report?.accountBook?.memberCount }}人</text>
        </view>
        <view class="info-item" v-if="report?.accountBook?.budget">
          <text class="info-label">预算金额：</text>
          <text class="info-value">¥{{ report?.accountBook?.budget?.toFixed(2) }}</text>
        </view>
        <view class="info-item" v-if="report?.accountBook?.startDate">
          <text class="info-label">开始日期：</text>
          <text class="info-value">{{ formatDate(report?.accountBook?.startDate) }}</text>
        </view>
        <view class="info-item" v-if="report?.accountBook?.endDate">
          <text class="info-label">结束日期：</text>
          <text class="info-value">{{ formatDate(report?.accountBook?.endDate) }}</text>
        </view>
      </view>
      
      <!-- 总览统计 -->
      <view class="section-card summary-section">
        <text class="section-title">📊 总览</text>
        <view class="summary-grid" :class="{ 'single-column': viewType !== 'all' }">
          <view class="summary-item expense" v-if="viewType === 'all' || viewType === 'expense'">
            <view class="summary-icon">💰</view>
            <text class="summary-label">总支出</text>
            <text class="summary-value">¥{{ formatAmount(report?.totalExpense || 0) }}</text>
          </view>
          <view class="summary-item income" v-if="viewType === 'all' || viewType === 'income'">
            <view class="summary-icon">💵</view>
            <text class="summary-label">总收入</text>
            <text class="summary-value">¥{{ formatAmount(report?.totalIncome || 0) }}</text>
          </view>
          <view class="summary-item balance" :class="{ negative: (report?.balance || 0) < 0 }" v-if="viewType === 'all'">
            <view class="summary-icon">💎</view>
            <text class="summary-label">结余</text>
            <text class="summary-value">¥{{ formatAmount(report?.balance || 0) }}</text>
          </view>
        </view>
        <view class="average-section" :class="{ 'single-column': viewType !== 'all' }">
          <view class="average-item" v-if="viewType === 'all' || viewType === 'expense'">
            <view class="average-icon">👤</view>
            <text class="average-label">人均支出</text>
            <text class="average-value">¥{{ formatAmount(report?.averageExpensePerPerson || 0) }}</text>
          </view>
          <view class="average-item" v-if="viewType === 'all' || viewType === 'income'">
            <view class="average-icon">👥</view>
            <text class="average-label">人均收入</text>
            <text class="average-value">¥{{ formatAmount(report?.averageIncomePerPerson || 0) }}</text>
          </view>
        </view>
      </view>
      <!-- 成员统计 -->
            <view class="section-card" v-if="report?.memberStatistics?.length > 0">
              <text class="section-title">成员统计</text>
              <!-- 成员支出对比柱状图 -->
              <view class="chart-wrapper">
                <view class="chart-container">
                  <canvas 
                    canvas-id="memberBarChart"
                    class="bar-chart-canvas"
                    id="memberBarChart"
                  ></canvas>
                </view>
                <view class="chart-legend">
                  <view class="legend-item" v-if="viewType === 'all' || viewType === 'expense'">
                    <view class="legend-color expense"></view>
                    <text class="legend-text">分摊后支出</text>
                  </view>
                  <view class="legend-item" v-if="viewType === 'all' || viewType === 'income'">
                    <view class="legend-color income"></view>
                    <text class="legend-text">收入</text>
                  </view>
                </view>
                <text class="chart-title">成员{{ viewType === 'all' ? '收支' : (viewType === 'expense' ? '支出' : '收入') }}对比</text>
              </view>
      <!--        <view class="member-list">
                <view 
                  v-for="member in report.memberStatistics" 
                  :key="member.userId"
                  class="member-item"
                >
                  <view class="member-header">
                    <view class="member-avatar">
                      <text>{{ member.userName?.charAt(0) || '?' }}</text>
                    </view>
                    <text class="member-name">{{ member.userName }}</text>
                  </view>
                  <view class="member-stats" :class="{ 'two-columns': viewType !== 'all' }">
                    <view class="member-stat-item" v-if="viewType === 'all' || viewType === 'expense'">
                      <text class="member-stat-label">分摊后支出</text>
                      <text class="member-stat-value expense">¥{{ formatAmount(member.allocatedExpense != null ? member.allocatedExpense : member.totalExpense) }}</text>
                    </view>
                    <view class="member-stat-item" v-if="viewType === 'all' || viewType === 'income'">
                      <text class="member-stat-label">收入</text>
                      <text class="member-stat-value income">¥{{ formatAmount(member.totalIncome) }}</text>
                    </view>
                    <view class="member-stat-item" v-if="viewType === 'all'">
                      <text class="member-stat-label">结余</text>
                      <text class="member-stat-value" :class="{ negative: member.balance < 0 }">
                        ¥{{ formatAmount(member.balance) }}
                      </text>
                    </view>
                    <view class="member-stat-item">
                      <text class="member-stat-label">交易数</text>
                      <text class="member-stat-value">{{ getMemberTransactionCount(member) }}笔</text>
                    </view>
                  </view>
                </view>
              </view> -->
            </view>
      <!-- 分摊后各成员支出（按交易分摊表统计） -->
      <view class="section-card allocation-by-member-section" v-if="(viewType === 'all' || viewType === 'expense') && report?.memberStatistics?.length > 0">
        <text class="section-title">分摊后各成员支出</text>
        <text class="section-desc">按交易分摊统计</text>
        <view class="allocation-by-member-list">
          <view 
            v-for="member in report.memberStatistics" 
            :key="member.userId"
            class="allocation-by-member-item"
          >
            <text class="allocation-member-name">{{ member.userName || '未知' }}</text>
            <text class="allocation-member-amount">¥{{ formatAmount(member.allocatedExpense != null ? member.allocatedExpense : 0) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 各成员结算（需支付/应收） -->
      <view class="section-card settlement-section" v-if="(viewType === 'all' || viewType === 'expense') && memberSettlements.length > 0">
        <text class="section-title">各成员结算</text>
        <text class="section-desc">根据实际支出与分摊后支出计算，需支付者补差，应收者收回多付部分</text>
        <view class="settlement-list">
          <view 
            v-for="s in memberSettlements" 
            :key="s.userId"
            class="settlement-item"
          >
            <view class="settlement-member">
              <view class="settlement-avatar">
                <text>{{ (s.userName || '?').charAt(0) }}</text>
              </view>
              <text class="settlement-name">{{ s.userName }}</text>
            </view>
            <view class="settlement-figures">
              <view class="settlement-figure">
                <text class="settlement-label">实际支出</text>
                <text class="settlement-value">¥{{ formatAmount(s.actualExpense) }}</text>
              </view>
              <view class="settlement-figure">
                <text class="settlement-label">分摊后支出</text>
                <text class="settlement-value">¥{{ formatAmount(s.allocatedExpense) }}</text>
              </view>
              <view class="settlement-result" :class="s.settlementType">
                <text class="settlement-label" v-if="s.settlementType === 'pay'">需支付</text>
                <text class="settlement-label" v-else-if="s.settlementType === 'receive'">应收</text>
                <text class="settlement-label" v-else>持平</text>
                <text class="settlement-amount" v-if="s.settlementType === 'pay'">¥{{ formatAmount(s.settlementAmount) }}</text>
                <text class="settlement-amount" v-else-if="s.settlementType === 'receive'">¥{{ formatAmount(s.settlementAmount) }}</text>
                <text class="settlement-amount" v-else>—</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 支付方案：需支付者向应收者各自支付多少 -->
      <view class="section-card transfer-section" v-if="(viewType === 'all' || viewType === 'expense') && settlementTransfers.length > 0">
        <text class="section-title">支付方案</text>
        <text class="section-desc">需支付的成员向应收的成员各自支付金额</text>
        <view class="transfer-list">
          <view 
            v-for="(t, index) in settlementTransfers" 
            :key="index"
            class="transfer-item"
          >
            <text class="transfer-from">{{ t.fromUserName }}</text>
            <text class="transfer-arrow">→</text>
            <text class="transfer-to">{{ t.toUserName }}</text>
            <text class="transfer-amount">¥{{ formatAmount(t.amount) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 支出分类汇总 -->
      <view class="section-card" v-if="(viewType === 'all' || viewType === 'expense') && report?.expenseCategoryStatistics?.length > 0">
        <text class="section-title">支出分类汇总</text>
        <!-- 支出分类饼图 -->
        <view class="chart-wrapper">
          <view class="chart-container">
            <canvas 
              canvas-id="expensePieChart"
              class="pie-chart-canvas"
              id="expensePieChart"
            ></canvas>
          </view>
          <text class="chart-title">支出分类占比</text>
        </view>
        <view class="category-list">
          <view 
            v-for="(item, index) in report.expenseCategoryStatistics" 
            :key="item.categoryId"
            class="category-item"
          >
            <view class="category-left">
              <view class="category-icon" :style="{ backgroundColor: item.categoryColor || '#AA96DA' }">
                <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="16" color="#FFFFFF" />
              </view>
              <view class="category-info">
                <text class="category-name">{{ item.categoryName }}</text>
                <text class="category-percentage">{{ item.percentage.toFixed(1) }}%</text>
              </view>
            </view>
            <text class="category-amount">¥{{ formatAmount(item.amount) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 收入分类汇总 -->
      <view class="section-card" v-if="(viewType === 'all' || viewType === 'income') && report?.incomeCategoryStatistics?.length > 0">
        <text class="section-title">收入分类汇总</text>
        <!-- 收入分类饼图 -->
        <view class="chart-wrapper">
          <view class="chart-container">
            <canvas 
              canvas-id="incomePieChart"
              class="pie-chart-canvas"
              id="incomePieChart"
            ></canvas>
          </view>
          <text class="chart-title">收入分类占比</text>
        </view>
        <view class="category-list">
          <view 
            v-for="(item, index) in report.incomeCategoryStatistics" 
            :key="item.categoryId"
            class="category-item"
          >
            <view class="category-left">
              <view class="category-icon" :style="{ backgroundColor: item.categoryColor || '#AA96DA' }">
                <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="16" color="#FFFFFF" />
              </view>
              <view class="category-info">
                <text class="category-name">{{ item.categoryName }}</text>
                <text class="category-percentage">{{ item.percentage.toFixed(1) }}%</text>
              </view>
            </view>
            <text class="category-amount">¥{{ formatAmount(item.amount) }}</text>
          </view>
        </view>
      </view>
      

      
      <!-- 全部交易记录 -->
      <view class="section-card" v-if="filteredTransactions?.length > 0">
        <text class="section-title">{{ viewType === 'all' ? '全部' : (viewType === 'expense' ? '支出' : '收入') }}交易记录（{{ filteredTransactions.length }}笔）</text>
        <view class="transaction-list">
          <view 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <view class="transaction-left">
              <view class="category-icon" :style="{ backgroundColor: transaction.categoryColor || '#AA96DA' }">
                <app-icon :icon="transaction.categoryIcon" :category-name="transaction.categoryName" :size="16" color="#FFFFFF" />
              </view>
              <view class="transaction-info">
                <text class="category-name">{{ transaction.categoryName }}</text>
                <text v-if="transaction.remark" class="transaction-remark">{{ transaction.remark }}</text>
                <view class="transaction-meta">
                  <text class="transaction-date">{{ formatDate(transaction.transactionDate, 'MM-DD') }}</text>
                  <text v-if="transaction.userName" class="transaction-creator">{{ transaction.userName }}</text>
                </view>
              </view>
            </view>
            <view class="transaction-right">
              <view class="transaction-amount-wrapper">
                <text 
                  class="transaction-amount" 
                  :class="transaction.type === 0 ? 'expense' : 'income'"
                >
                  {{ transaction.type === 0 ? '-' : '+' }}¥{{ formatAmount(transaction.amount) }}
                </text>
                <view v-if="transaction.type === 0 && (transaction.allocations || []).length > 0" class="allocation-avatars">
                  <view v-for="a in (transaction.allocations || [])" :key="a.userId" class="allocation-avatar-circle">
                    <text>{{ (a.userName || '?').charAt(0) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 分享按钮 -->
      <view class="share-section">
        <button class="share-btn" open-type="share">
          <text class="share-icon">📤</text>
          <text class="share-text">分享总结给好友</text>
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { api } from '@/utils/api';
import { formatDate } from '@/utils/util';

export default {
  data() {
    return {
      accountBookId: null,
      report: null,
      loading: true,
      viewType: 'all', // 'all', 'expense', 'income'
      expenseChartCtx: null,
      incomeChartCtx: null,
      memberChartCtx: null
    };
  },
  computed: {
    // 根据viewType过滤交易记录
    filteredTransactions() {
      if (!this.report?.allTransactions) return [];
      if (this.viewType === 'all') return this.report.allTransactions;
      if (this.viewType === 'expense') return this.report.allTransactions.filter(t => t.type === 0);
      if (this.viewType === 'income') return this.report.allTransactions.filter(t => t.type === 1);
      return this.report.allTransactions;
    },
    // 各成员结算：根据实际支出与分摊后支出算出需支付/应收
    memberSettlements() {
      const list = this.report?.memberStatistics || [];
      return list.map(m => {
        const actualExpense = m.totalExpense != null ? m.totalExpense : 0;
        const allocatedExpense = m.allocatedExpense != null ? m.allocatedExpense : 0;
        const amount = allocatedExpense - actualExpense;
        let type = 'balanced'; // 持平
        if (amount > 0) type = 'pay';   // 需支付
        if (amount < 0) type = 'receive'; // 应收
        return {
          userId: m.userId,
          userName: m.userName || '未知',
          actualExpense,
          allocatedExpense,
          settlementAmount: Math.abs(amount),
          settlementType: type
        };
      });
    },
    // 需支付成员向应收成员各自支付多少钱（贪心匹配，笔数尽量少）
    settlementTransfers() {
      const payers = this.memberSettlements
        .filter(s => s.settlementType === 'pay' && s.settlementAmount > 0)
        .map(p => ({ ...p, remaining: p.settlementAmount }));
      const receivers = this.memberSettlements
        .filter(s => s.settlementType === 'receive' && s.settlementAmount > 0)
        .map(r => ({ ...r, remaining: r.settlementAmount }));
      const transfers = [];
      let pi = 0;
      let ri = 0;
      const epsilon = 0.005;
      while (pi < payers.length && ri < receivers.length) {
        if (payers[pi].remaining < epsilon) { pi++; continue; }
        if (receivers[ri].remaining < epsilon) { ri++; continue; }
        const amount = Math.min(payers[pi].remaining, receivers[ri].remaining);
        if (amount < epsilon) break;
        const amountRounded = Math.round(amount * 100) / 100;
        transfers.push({
          fromUserId: payers[pi].userId,
          fromUserName: payers[pi].userName,
          toUserId: receivers[ri].userId,
          toUserName: receivers[ri].userName,
          amount: amountRounded
        });
        payers[pi].remaining -= amountRounded;
        receivers[ri].remaining -= amountRounded;
      }
      return transfers;
    }
  },
  onLoad(options) {
    if (options.id) {
      this.accountBookId = parseInt(options.id);
      this.loadReport();
    }
  },
  // 微信分享功能
  onShareAppMessage() {
    if (this.report?.accountBook) {
      return {
        title: `${this.report.accountBook.name} - 一起账本报告`,
        path: `/pages/shared-account-book-report/shared-account-book-report?id=${this.accountBookId}`,
        imageUrl: '/static/share-report.jpg' // 可以设置分享图片URL
      };
    }
    return {
      title: '一起账本报告',
      path: '/pages/index/index'
    };
  },
  methods: {
    formatDate,
    // 格式化金额（报告数据已经是元，不需要再除以100）
    formatAmount(yuan) {
      if (yuan == null || yuan === undefined) return '0.00';
      return parseFloat(yuan).toFixed(2);
    },
    
    // 切换视图类型
    switchViewType(type) {
      this.viewType = type;
      // 重新绘制图表
      this.$nextTick(() => {
        this.initCharts();
      });
    },
    
    async loadReport() {
      if (!this.accountBookId) return;
      
      this.loading = true;
      try {
        this.report = await api.sharedAccountBooks.generateReport(this.accountBookId);
        // 等待DOM更新后绘制图表
        this.$nextTick(() => {
          this.initCharts();
        });
      } catch (error) {
        console.error('加载报告失败', error);
        uni.showToast({
          title: error.message || '加载报告失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    initCharts() {
      // 延迟绘制，确保canvas已渲染
      setTimeout(() => {
        // 初始化支出分类饼图
        if (this.report?.expenseCategoryStatistics?.length > 0) {
          this.drawExpensePieChart();
        }
        // 初始化收入分类饼图
        if (this.report?.incomeCategoryStatistics?.length > 0) {
          this.drawIncomePieChart();
        }
        // 初始化成员支出对比柱状图
        if (this.report?.memberStatistics?.length > 0) {
          this.drawMemberBarChart();
        }
      }, 300);
    },
    
    drawExpensePieChart() {
      const query = uni.createSelectorQuery().in(this);
      query.select('#expensePieChart').boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawExpensePieChart(), 100);
          return;
        }
        
        const ctx = uni.createCanvasContext('expensePieChart', this);
        const data = this.report.expenseCategoryStatistics;
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        
        if (total === 0) {
          ctx.draw();
          return;
        }
        
        const centerX = res.width / 2;
        const centerY = res.height / 2;
        // 增大饼图半径，留出更多空间给标签
        const radius = Math.min(res.width, res.height) * 0.25;
        let startAngle = -Math.PI / 2;
        
        data.forEach((item, index) => {
          const angle = (item.amount / total) * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const midAngle = (startAngle + endAngle) / 2;
          
          const color = item.categoryColor || this.getColor(index);
          
          // 绘制扇形
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.setFillStyle(color);
          ctx.fill();
          
          // 绘制引导线和标签
          const lineStartX = centerX + radius * Math.cos(midAngle);
          const lineStartY = centerY + radius * Math.sin(midAngle);
          // 增加引导线长度，确保标签在canvas范围内
          const lineLength = Math.min(res.width, res.height) * 0.15;
          const lineEndX = centerX + (radius + lineLength) * Math.cos(midAngle);
          const lineEndY = centerY + (radius + lineLength) * Math.sin(midAngle);
          
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineStartY);
          ctx.lineTo(lineEndX, lineEndY);
          ctx.setStrokeStyle('#E0E0E0');
          ctx.setLineWidth(1);
          ctx.stroke();
          
          // 标签位置，确保在canvas范围内
          const labelOffset = 15;
          let labelX, labelY;
          
          // 根据象限调整标签位置
          if (Math.cos(midAngle) > 0) {
            // 右侧
            labelX = Math.min(lineEndX + labelOffset, res.width - 10);
            labelY = lineEndY;
            ctx.setTextAlign('left');
          } else {
            // 左侧
            labelX = Math.max(lineEndX - labelOffset, 10);
            labelY = lineEndY;
            ctx.setTextAlign('right');
          }
          
          // 确保标签Y坐标在范围内
          labelY = Math.max(20, Math.min(labelY, res.height - 20));
          
          ctx.setTextBaseline('middle');
          ctx.setFontSize(13);
          ctx.setFillStyle('#333');
          const name = item.categoryName.length > 8 ? item.categoryName.substring(0, 8) + '...' : item.categoryName;
          ctx.fillText(name, labelX, labelY - 8);
          ctx.setFontSize(12);
          ctx.setFillStyle('#999');
          ctx.fillText(`${item.percentage.toFixed(1)}%`, labelX, labelY + 8);
          
          startAngle = endAngle;
        });
        
        ctx.draw();
      }).exec();
    },
    
    drawIncomePieChart() {
      const query = uni.createSelectorQuery().in(this);
      query.select('#incomePieChart').boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawIncomePieChart(), 100);
          return;
        }
        
        const ctx = uni.createCanvasContext('incomePieChart', this);
        const data = this.report.incomeCategoryStatistics;
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        
        if (total === 0) {
          ctx.draw();
          return;
        }
        
        const centerX = res.width / 2;
        const centerY = res.height / 2;
        // 增大饼图半径，留出更多空间给标签
        const radius = Math.min(res.width, res.height) * 0.25;
        let startAngle = -Math.PI / 2;
        
        data.forEach((item, index) => {
          const angle = (item.amount / total) * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const midAngle = (startAngle + endAngle) / 2;
          
          const color = item.categoryColor || this.getColor(index);
          
          // 绘制扇形
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.setFillStyle(color);
          ctx.fill();
          
          // 绘制引导线和标签
          const lineStartX = centerX + radius * Math.cos(midAngle);
          const lineStartY = centerY + radius * Math.sin(midAngle);
          // 增加引导线长度，确保标签在canvas范围内
          const lineLength = Math.min(res.width, res.height) * 0.15;
          const lineEndX = centerX + (radius + lineLength) * Math.cos(midAngle);
          const lineEndY = centerY + (radius + lineLength) * Math.sin(midAngle);
          
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineStartY);
          ctx.lineTo(lineEndX, lineEndY);
          ctx.setStrokeStyle('#E0E0E0');
          ctx.setLineWidth(1);
          ctx.stroke();
          
          // 标签位置，确保在canvas范围内
          const labelOffset = 15;
          let labelX, labelY;
          
          // 根据象限调整标签位置
          if (Math.cos(midAngle) > 0) {
            // 右侧
            labelX = Math.min(lineEndX + labelOffset, res.width - 10);
            labelY = lineEndY;
            ctx.setTextAlign('left');
          } else {
            // 左侧
            labelX = Math.max(lineEndX - labelOffset, 10);
            labelY = lineEndY;
            ctx.setTextAlign('right');
          }
          
          // 确保标签Y坐标在范围内
          labelY = Math.max(20, Math.min(labelY, res.height - 20));
          
          ctx.setTextBaseline('middle');
          ctx.setFontSize(13);
          ctx.setFillStyle('#333');
          const name = item.categoryName.length > 8 ? item.categoryName.substring(0, 8) + '...' : item.categoryName;
          ctx.fillText(name, labelX, labelY - 8);
          ctx.setFontSize(12);
          ctx.setFillStyle('#999');
          ctx.fillText(`${item.percentage.toFixed(1)}%`, labelX, labelY + 8);
          
          startAngle = endAngle;
        });
        
        ctx.draw();
      }).exec();
    },
    
    drawMemberBarChart() {
      const query = uni.createSelectorQuery().in(this);
      query.select('#memberBarChart').boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawMemberBarChart(), 100);
          return;
        }
        
        const ctx = uni.createCanvasContext('memberBarChart', this);
        const data = this.report.memberStatistics;
        
        if (!data || data.length === 0) {
          ctx.draw();
          return;
        }
        
        const canvasWidth = res.width;
        const canvasHeight = res.height;
        const padding = 40;
        const chartWidth = canvasWidth - padding * 2;
        const chartHeight = canvasHeight - padding * 2;
        
        // 根据viewType计算最大值（支出用分摊后支出）
        const expenseVal = m => (m.allocatedExpense != null ? m.allocatedExpense : m.totalExpense);
        let maxAmount;
        if (this.viewType === 'expense') {
          maxAmount = Math.max(...data.map(m => expenseVal(m)), 0);
        } else if (this.viewType === 'income') {
          maxAmount = Math.max(...data.map(m => m.totalIncome), 0);
        } else {
          maxAmount = Math.max(...data.map(m => expenseVal(m) + m.totalIncome), 0);
        }
        
        if (maxAmount === 0) {
          ctx.draw();
          return;
        }
        
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length;
        
        // 绘制坐标轴
        ctx.setStrokeStyle('#E0E0E0');
        ctx.setLineWidth(1);
        // X轴
        ctx.beginPath();
        ctx.moveTo(padding, canvasHeight - padding);
        ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
        ctx.stroke();
        // Y轴
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.stroke();
        
        // 绘制网格线
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
          const y = padding + (chartHeight / gridLines) * i;
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(canvasWidth - padding, y);
          ctx.setStrokeStyle('#F5F5F5');
          ctx.stroke();
          
          // Y轴标签
          const value = maxAmount * (1 - i / gridLines);
          ctx.setFontSize(10);
          ctx.setFillStyle('#999');
          ctx.setTextAlign('right');
          ctx.setTextBaseline('middle');
          ctx.fillText(value.toFixed(0), padding - 8, y);
        }
        
        // 绘制柱状图
        data.forEach((member, index) => {
          const x = padding + barSpacing * index + barSpacing * 0.2;
          
          if (this.viewType === 'all') {
            // 全部模式：堆叠显示（支出用分摊后支出）
            const exp = expenseVal(member);
            const expenseHeight = (exp / maxAmount) * chartHeight;
            const incomeHeight = (member.totalIncome / maxAmount) * chartHeight;
            
            // 绘制支出柱（红色）
            if (exp > 0) {
              ctx.setFillStyle('#E85D4B');
              ctx.fillRect(x, canvasHeight - padding - expenseHeight, barWidth, expenseHeight);
            }
            
            // 绘制收入柱（绿色，叠加在支出柱上方）
            if (member.totalIncome > 0) {
              ctx.setFillStyle('#5CB85C');
              ctx.fillRect(x, canvasHeight - padding - expenseHeight - incomeHeight, barWidth, incomeHeight);
            }
          } else if (this.viewType === 'expense') {
            // 仅支出模式（分摊后支出）
            const exp = expenseVal(member);
            const expenseHeight = (exp / maxAmount) * chartHeight;
            if (exp > 0) {
              ctx.setFillStyle('#E85D4B');
              ctx.fillRect(x, canvasHeight - padding - expenseHeight, barWidth, expenseHeight);
            }
          } else if (this.viewType === 'income') {
            // 仅收入模式
            const incomeHeight = (member.totalIncome / maxAmount) * chartHeight;
            if (member.totalIncome > 0) {
              ctx.setFillStyle('#5CB85C');
              ctx.fillRect(x, canvasHeight - padding - incomeHeight, barWidth, incomeHeight);
            }
          }
          
          // 绘制成员名称
          ctx.setFontSize(10);
          ctx.setFillStyle('#333');
          ctx.setTextAlign('center');
          ctx.setTextBaseline('top');
          const name = member.userName.length > 3 ? member.userName.substring(0, 3) + '...' : member.userName;
          ctx.fillText(name, x + barWidth / 2, canvasHeight - padding + 5);
        });
        
        ctx.draw();
      }).exec();
    },
    
    getColor(index) {
      const colors = ['#F5A623', '#F7B84D', '#FFD080', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D', '#E8940C'];
      return colors[index % colors.length];
    },
    
    // 根据viewType获取成员交易数
    getMemberTransactionCount(member) {
      if (!this.report?.allTransactions) return member.transactionCount;
      if (this.viewType === 'all') return member.transactionCount;
      
      const memberTransactions = this.report.allTransactions.filter(t => t.userId === member.userId);
      if (this.viewType === 'expense') {
        return memberTransactions.filter(t => t.type === 0).length;
      }
      if (this.viewType === 'income') {
        return memberTransactions.filter(t => t.type === 1).length;
      }
      return member.transactionCount;
    }
  }
};
</script>

<style lang="scss" scoped>
.report-container {
  min-height: 100vh;
  background: #F5F5F5;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  
  .loading-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.report-content {
  padding: 24rpx;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

.report-header {
  background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  
  .report-title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
    word-break: break-word;
  }
  
  .filter-tabs {
    display: flex;
    justify-content: center;
    gap: 16rpx;
    margin-top: 24rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 48rpx;
    padding: 8rpx;
    
    .filter-tab {
      padding: 16rpx 40rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s;
      cursor: pointer;
      
      &.active {
        background: #FFFFFF;
        color: #F5A623;
        font-weight: 600;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
      }
      
      &:not(.active):active {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
  
  .report-subtitle {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    word-break: break-word;
  }
}

.section-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  width: 100%;
  box-sizing: border-box;
  
  .section-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #F5F5F5;
    word-break: break-word;
  }
}

.allocation-by-member-section {
  .section-desc {
    display: block;
    font-size: 24rpx;
    color: #999999;
    margin-top: -12rpx;
    margin-bottom: 20rpx;
  }
  
  .allocation-by-member-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24rpx;
    width: 100%;
    box-sizing: border-box;
  }
  
  .allocation-by-member-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20rpx 12rpx;
    background: #F8F9FA;
    border-radius: 12rpx;
    min-width: 0;
    box-sizing: border-box;
  }
  
  .allocation-member-name {
    font-size: 26rpx;
    color: #333333;
    margin-bottom: 8rpx;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  
  .allocation-member-amount {
    font-size: 28rpx;
    font-weight: bold;
    color: #F5A623;
  }
}

.settlement-section {
  .section-desc {
    display: block;
    font-size: 24rpx;
    color: #999999;
    margin-top: -12rpx;
    margin-bottom: 20rpx;
  }
  
  .settlement-list {
    width: 100%;
    box-sizing: border-box;
  }
  
  .settlement-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
    width: 100%;
    box-sizing: border-box;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .settlement-member {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-right: 24rpx;
    min-width: 0;
    
    .settlement-avatar {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #AA96DA 0%, #C5B4E3 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 26rpx;
      font-weight: bold;
      margin-right: 16rpx;
    }
    
    .settlement-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      word-break: break-word;
    }
  }
  
  .settlement-figures {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: 1;
    min-width: 0;
  }
  
  .settlement-figure {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 8rpx;
    
    .settlement-label {
      font-size: 24rpx;
      color: #999999;
      margin-right: 12rpx;
    }
    
    .settlement-value {
      font-size: 26rpx;
      color: #333333;
      font-weight: 500;
    }
  }
  
  .settlement-result {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 4rpx;
    
    .settlement-label {
      font-size: 24rpx;
      margin-right: 12rpx;
    }
    
    .settlement-amount {
      font-size: 28rpx;
      font-weight: bold;
    }
    
    &.pay {
      .settlement-label { color: #E85D4B; }
      .settlement-amount { color: #E85D4B; }
    }
    
    &.receive {
      .settlement-label { color: #5CB85C; }
      .settlement-amount { color: #5CB85C; }
    }
    
    &.balanced {
      .settlement-label { color: #999999; }
      .settlement-amount { color: #999999; }
    }
  }
}

.transfer-section {
  .section-desc {
    display: block;
    font-size: 24rpx;
    color: #999999;
    margin-top: -12rpx;
    margin-bottom: 20rpx;
  }
  
  .transfer-list {
    width: 100%;
    box-sizing: border-box;
  }
  
  .transfer-item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
    width: 100%;
    box-sizing: border-box;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .transfer-from {
    font-size: 28rpx;
    font-weight: bold;
    color: #F5A623;
    margin-right: 12rpx;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .transfer-arrow {
    font-size: 24rpx;
    color: #999999;
    margin-right: 12rpx;
  }
  
  .transfer-to {
    font-size: 28rpx;
    font-weight: bold;
    color: #5CB85C;
    margin-right: 16rpx;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .transfer-amount {
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-left: auto;
  }
}

.info-item {
  display: flex;
  margin-bottom: 16rpx;
  width: 100%;
  box-sizing: border-box;
  
  .info-label {
    font-size: 28rpx;
    color: #666666;
    min-width: 140rpx;
    flex-shrink: 0;
  }
  
  .info-value {
    font-size: 28rpx;
    color: #333333;
    flex: 1;
    word-break: break-word;
    min-width: 0;
  }
}

.summary-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  
  .section-title {
    font-size: 36rpx;
    color: #333333;
    border-bottom: 3rpx solid #F5A623;
    padding-bottom: 20rpx;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 32rpx;
  width: 100%;
  box-sizing: border-box;
  
  &.single-column {
    grid-template-columns: 1fr;
    
    .summary-item {
      max-width: 100%;
    }
  }
  
  .summary-item {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 32rpx 24rpx;
    text-align: center;
    min-width: 0;
    box-sizing: border-box;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6rpx;
      background: transparent;
    }
    
    &.expense {
      background: linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%);
      border: 2rpx solid #FFE5E5;
      
      &::before {
        background: linear-gradient(90deg, #F5A623 0%, #F7B84D 100%);
      }
      
      .summary-icon {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      }
      
      .summary-value {
        color: #F5A623;
      }
    }
    
    &.income {
      background: linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%);
      border: 2rpx solid #E5FFE5;
      
      &::before {
        background: linear-gradient(90deg, #5CB85C 0%, #7BC87E 100%);
      }
      
      .summary-icon {
        background: linear-gradient(135deg, #5CB85C 0%, #7BC87E 100%);
      }
      
      .summary-value {
        color: #5CB85C;
      }
    }
    
    &.balance {
      background: linear-gradient(135deg, #FFF8EB 0%, #FFFFFF 100%);
      border: 2rpx solid #F5E8D0;
      
      &::before {
        background: linear-gradient(90deg, #F5A623 0%, #F7B84D 100%);
      }
      
      .summary-icon {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      }
      
      .summary-value {
        color: #F7B84D;
      }
      
      &.negative {
        background: linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%);
        border: 2rpx solid #FFE5E5;
        
        &::before {
          background: linear-gradient(90deg, #F5A623 0%, #F7B84D 100%);
        }
        
        .summary-icon {
          background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        }
        
        .summary-value {
          color: #E85D4B;
        }
      }
    }
    
    .summary-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      margin: 0 auto 16rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
    }
    
    .summary-label {
      display: block;
      font-size: 26rpx;
      color: #666666;
      margin-bottom: 12rpx;
      font-weight: 500;
    }
    
    .summary-value {
      display: block;
      font-size: 40rpx;
      font-weight: 800;
      word-break: break-word;
      overflow-wrap: break-word;
      line-height: 1.2;
    }
  }
}

.average-section {
  display: flex;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
  
  &.single-column {
    flex-direction: column;
    
    .average-item {
      width: 100%;
    }
  }
  
  .average-item {
    flex: 1;
    background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
    border-radius: 16rpx;
    padding: 28rpx 24rpx;
    text-align: center;
    min-width: 0;
    box-sizing: border-box;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    border: 2rpx solid #FFF4D6;
    position: relative;
    
    .average-icon {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD93D 0%, #FFE66D 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      margin: 0 auto 12rpx;
      box-shadow: 0 4rpx 12rpx rgba(255, 217, 61, 0.3);
    }
    
    .average-label {
      display: block;
      font-size: 24rpx;
      color: #666666;
      margin-bottom: 10rpx;
      font-weight: 500;
    }
    
    .average-value {
      display: block;
      font-size: 32rpx;
      font-weight: 800;
      color: #FF8C00;
      line-height: 1.2;
    }
  }
}

.chart-wrapper {
  width: 100%;
  margin-bottom: 32rpx;
  box-sizing: border-box;
  
  .chart-container {
    width: 100%;
    box-sizing: border-box;
    background: #FAFAFA;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    
    .pie-chart-canvas {
      width: 100%;
      height: 500rpx;
    }
    
    .bar-chart-canvas {
      width: 100%;
      height: 300rpx;
    }
  }
  
  .chart-title {
    display: block;
    text-align: center;
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 8rpx;
  }
  
  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 32rpx;
    margin-bottom: 8rpx;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      .legend-color {
        width: 24rpx;
        height: 24rpx;
        border-radius: 4rpx;
        
        &.expense {
          background: #E85D4B;
        }
        
        &.income {
          background: #5CB85C;
        }
      }
      
      .legend-text {
        font-size: 22rpx;
        color: #666666;
      }
    }
  }
}

.category-list {
  width: 100%;
  box-sizing: border-box;
  
  .category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    width: 100%;
    box-sizing: border-box;
    
    &:last-child {
      border-bottom: none;
    }
    
    .category-left {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      
      .category-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        margin-right: 16rpx;
      }
      
      .category-info {
        flex: 1;
        min-width: 0;
        
        .category-name {
          display: block;
          font-size: 28rpx;
          color: #333333;
          margin-bottom: 4rpx;
          word-break: break-word;
        }
        
        .category-percentage {
          font-size: 24rpx;
          color: #999999;
        }
      }
    }
    
    .category-amount {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      flex-shrink: 0;
      margin-left: 16rpx;
      white-space: nowrap;
    }
  }
}

.member-list {
  width: 100%;
  box-sizing: border-box;
  
  .member-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F5F5F5;
    width: 100%;
    box-sizing: border-box;
    
    &:last-child {
      border-bottom: none;
    }
    
    .member-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      width: 100%;
      
      .member-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 28rpx;
        font-weight: bold;
        margin-right: 16rpx;
      }
      
      .member-name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333333;
        flex: 1;
        min-width: 0;
        word-break: break-word;
      }
    }
    
    .member-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16rpx;
      width: 100%;
      box-sizing: border-box;
      
      .member-stat-item {
        text-align: center;
        min-width: 0;
        box-sizing: border-box;
        
        .member-stat-label {
          display: block;
          font-size: 22rpx;
          color: #999999;
          margin-bottom: 8rpx;
          word-break: break-word;
        }
        
        .member-stat-value {
          display: block;
          font-size: 24rpx;
          font-weight: bold;
          color: #333333;
          word-break: break-word;
          overflow-wrap: break-word;
          
          &.expense {
            color: #E85D4B;
          }
          
          &.income {
            color: #5CB85C;
          }
          
          &.negative {
            color: #E85D4B;
          }
        }
      }
    }
  }
}

.transaction-list {
  width: 100%;
  box-sizing: border-box;
  
  .transaction-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
    width: 100%;
    box-sizing: border-box;
    
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
        font-size: 36rpx;
        margin-right: 20rpx;
      }
      
      .transaction-info {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        
        .category-name {
          font-size: 27rpx;
          color: #333333;
          margin-bottom: 6rpx;
        }
        
        .transaction-remark {
          font-size: 23rpx;
          color: #999999;
          margin-bottom: 5rpx;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        
        .transaction-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8rpx;
          margin-top: 4rpx;
        }
        
        .transaction-date {
          font-size: 23rpx;
          color: #999999;
        }
        
        .transaction-creator {
          font-size: 23rpx;
          color: #999999;
        }
      }
    }
    
    .transaction-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: 16rpx;
    }
    
    .transaction-amount-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5rpx;
      
      .allocation-avatars {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6rpx;
        margin-bottom: 4rpx;
      }
      
      .allocation-avatar-circle {
        width: 36rpx;
        height: 36rpx;
        border-radius: 50%;
        background: #CCCCCC;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 20rpx;
        font-weight: bold;
      }
      
      .transaction-amount {
        font-size: 30rpx;
        font-weight: bold;
        white-space: nowrap;
        
        &.expense {
          color: #E85D4B;
        }
        
        &.income {
          color: #5CB85C;
        }
      }
    }
  }
}

.share-section {
  padding: 32rpx 0 48rpx;
  width: 100%;
  box-sizing: border-box;
  
  .share-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
    color: #FFFFFF;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    
    .share-icon {
      font-size: 32rpx;
      margin-right: 8rpx;
    }
    
    .share-text {
      font-size: 32rpx;
    }
  }
}
</style>
