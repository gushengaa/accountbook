<template>
  <view class="statistics-container">
    <!-- 统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card">
        <text class="stat-label">总支出</text>
        <text class="stat-value">¥{{ statistics.totalExpense.toFixed(2) }}</text>
      </view>
      <view class="stat-card" v-if="statistics.budget">
        <text class="stat-label">预算</text>
        <text class="stat-value">¥{{ statistics.budget.toFixed(2) }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">人均消费</text>
        <text class="stat-value">¥{{ statistics.averagePerPerson.toFixed(2) }}</text>
      </view>
    </view>
    
    <!-- 预算进度 -->
    <view v-if="statistics.budget" class="budget-progress">
      <view class="progress-header">
        <text class="progress-label">预算进度</text>
        <text class="progress-text">
          {{ statistics.budgetRemaining >= 0 ? '剩余' : '超支' }} ¥{{ Math.abs(statistics.budgetRemaining || 0).toFixed(2) }}
        </text>
      </view>
      <view class="progress-bar">
        <view 
          class="progress-fill" 
          :style="{ width: `${Math.min(100, (statistics.totalExpense / statistics.budget) * 100)}%` }"
          :class="{ over: statistics.budgetRemaining < 0 }"
        ></view>
      </view>
    </view>
    
    <!-- 分类统计饼图 -->
    <view class="category-statistics">
      <text class="section-title">支出分类统计</text>
      
      <!-- ECharts 饼图 -->
      <view class="pie-chart-container" v-if="statistics.categoryStatistics.length > 0">
        <canvas 
          type="2d" 
          id="pieChart" 
          canvas-id="pieChart"
          class="pie-chart-canvas"
        ></canvas>
      </view>
      <view v-else class="empty-chart">
        <text class="empty-text">暂无支出数据</text>
      </view>
      
      <!-- 分类列表 -->
      <view class="category-list">
        <view 
          v-for="item in statistics.categoryStatistics" 
          :key="item.categoryId"
          class="category-stat-item"
        >
          <view class="category-info">
            <view class="category-icon" :style="{ backgroundColor: item.categoryColor }">
              <app-icon :icon="item.categoryIcon" :category-name="item.categoryName" :size="16" color="#FFFFFF" />
            </view>
            <text class="category-name">{{ item.categoryName }}</text>
          </view>
          <view class="category-amount">
            <text class="amount">¥{{ item.amount.toFixed(2) }}</text>
            <text class="percentage">{{ item.percentage.toFixed(1) }}%</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/utils/api';

export default {
  data() {
    return {
      sharedAccountBookId: null,
      statistics: {
        totalExpense: 0,
        totalIncome: 0,
        balance: 0,
        budget: null,
        budgetRemaining: null,
        averagePerPerson: 0,
        memberCount: 0,
        categoryStatistics: []
      },
      loading: false,
      chartInstance: null
    };
  },
  watch: {
    'statistics.categoryStatistics': {
      handler() {
        this.$nextTick(() => {
          this.initChart();
        });
      },
      deep: true
    }
  },
  onLoad(options) {
    if (options.id) {
      this.sharedAccountBookId = parseInt(options.id);
      this.loadStatistics();
    }
  },
  onReady() {
    // 页面渲染完成后初始化图表
    this.$nextTick(() => {
      this.initChart();
    });
  },
  onUnload() {
    // 页面卸载时销毁图表实例
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
  methods: {
    async loadStatistics() {
      this.loading = true;
      try {
        this.statistics = await api.sharedAccountBooks.getStatistics(this.sharedAccountBookId);
      } catch (error) {
        console.error('加载统计失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    async initChart() {
      if (!this.statistics.categoryStatistics || this.statistics.categoryStatistics.length === 0) {
        return;
      }
      
      try {
        // 使用 uni.createSelectorQuery 获取 canvas 节点
        const query = uni.createSelectorQuery().in(this);
        query.select('#pieChart')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0] || !res[0].node) {
              console.warn('未找到 canvas 节点，尝试使用 canvas-id 方式');
              // 如果 node 方式失败，使用 canvas-id 方式
              this.initChartWithCanvasId();
              return;
            }
            
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = uni.getSystemInfoSync().pixelRatio;
            const width = res[0].width;
            const height = res[0].height;
            
            // 设置 canvas 尺寸
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            
            // 绘制饼图
            this.drawPieChart(ctx, width, height);
          });
      } catch (error) {
        console.error('初始化图表失败', error);
        // 如果 canvas 2d 失败，尝试使用 canvas-id 方式
        this.initChartWithCanvasId();
      }
    },
    
    initChartWithCanvasId() {
      // 使用 canvas-id 方式（兼容旧版本）
      const ctx = uni.createCanvasContext('pieChart', this);
      const query = uni.createSelectorQuery().in(this);
      query.select('#pieChart')
        .boundingClientRect((res) => {
          if (res) {
            this.drawPieChart(ctx, res.width, res.height);
            ctx.draw();
          }
        })
        .exec();
    },
    
    drawPieChart(ctx, width, height) {
      // 饼图居中
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = Math.min(width, height) * 0.12;
      const outerRadius = Math.min(width, height) * 0.25;
      
      // 统一的引导线延伸长度（从扇形边缘到转折点的距离）
      const lineExtensionLength = 35;
      
      // 标签区域在右侧
      const labelStartX = width * 0.58;
      const labelSpacing = height / (this.statistics.categoryStatistics.length + 1);
      
      const total = this.statistics.categoryStatistics.reduce((sum, item) => sum + item.amount, 0);
      let currentAngle = -Math.PI / 2; // 从顶部开始
      
      // 先绘制所有扇形
      this.statistics.categoryStatistics.forEach((item, index) => {
        const angle = (item.amount / total) * 2 * Math.PI;
        const color = item.categoryColor || this.getColor(index);
        
        // 绘制外圆扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + angle, false);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制内圆（形成环形）
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, innerRadius, currentAngle, currentAngle + angle, false);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        currentAngle += angle;
      });
      
      // 先收集所有扇形的角度信息
      const segments = [];
      currentAngle = -Math.PI / 2; // 重置角度
      this.statistics.categoryStatistics.forEach((item, index) => {
        const angle = (item.amount / total) * 2 * Math.PI;
        const labelAngle = currentAngle + angle / 2;
        const lineStartX = centerX + Math.cos(labelAngle) * outerRadius;
        const lineStartY = centerY + Math.sin(labelAngle) * outerRadius;
        
        // 判断扇形位置
        let position; // 'left', 'right', 'top', 'bottom'
        if (lineStartX < centerX - 10) {
          position = 'left';
        } else if (lineStartX > centerX + 10) {
          position = 'right';
        } else if (lineStartY < centerY - 10) {
          position = 'top';
        } else {
          position = 'bottom';
        }
        
        segments.push({
          item,
          index,
          labelAngle,
          lineStartX,
          lineStartY,
          color: item.categoryColor || this.getColor(index),
          position
        });
        currentAngle += angle;
      });
      
      // 按位置分组，同一位置的标签需要排序避免重叠
      const leftSegments = segments.filter(s => s.position === 'left').sort((a, b) => a.lineStartY - b.lineStartY);
      const rightSegments = segments.filter(s => s.position === 'right').sort((a, b) => a.lineStartY - b.lineStartY);
      const topSegments = segments.filter(s => s.position === 'top').sort((a, b) => a.lineStartX - b.lineStartX);
      const bottomSegments = segments.filter(s => s.position === 'bottom').sort((a, b) => a.lineStartX - b.lineStartX);
      
      // 绘制引导线和标签
      segments.forEach((segment) => {
        const { item, lineStartX, lineStartY, color, position } = segment;
        
        let labelEndX, labelEndY;
        let lineMiddleX, lineMiddleY, lineEndX, lineEndY;
        let textAlign, textX, textY;
        
        if (position === 'left') {
          // 左侧：引导线向左延伸
          const index = leftSegments.indexOf(segment);
          const spacing = leftSegments.length > 1 ? (height * 0.8) / (leftSegments.length - 1) : 0;
          labelEndY = height * 0.1 + spacing * index;
          labelEndX = width * 0.05;
          
          // 第一段：从扇形边缘向左延伸固定长度
          lineMiddleX = lineStartX - lineExtensionLength;
          lineMiddleY = lineStartY;
          // 第二段：垂直连接到标签
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          
          textAlign = 'left';
          textX = labelEndX + 8;
          textY = labelEndY;
        } else if (position === 'right') {
          // 右侧：引导线向右延伸
          const index = rightSegments.indexOf(segment);
          const spacing = rightSegments.length > 1 ? (height * 0.8) / (rightSegments.length - 1) : 0;
          labelEndY = height * 0.1 + spacing * index;
          labelEndX = width * 0.95;
          
          // 第一段：从扇形边缘向右延伸固定长度
          lineMiddleX = lineStartX + lineExtensionLength;
          lineMiddleY = lineStartY;
          // 第二段：垂直连接到标签
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          
          textAlign = 'right';
          textX = labelEndX - 8;
          textY = labelEndY;
        } else if (position === 'top') {
          // 上方：引导线向上延伸
          const index = topSegments.indexOf(segment);
          const spacing = topSegments.length > 1 ? (width * 0.8) / (topSegments.length - 1) : 0;
          labelEndX = width * 0.1 + spacing * index;
          labelEndY = height * 0.05;
          
          // 第一段：从扇形边缘向上延伸固定长度
          lineMiddleX = lineStartX;
          lineMiddleY = lineStartY - lineExtensionLength;
          // 第二段：水平连接到标签
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          
          textAlign = 'center';
          textX = labelEndX;
          textY = labelEndY - 30;
        } else {
          // 下方：引导线向下延伸
          const index = bottomSegments.indexOf(segment);
          const spacing = bottomSegments.length > 1 ? (width * 0.8) / (bottomSegments.length - 1) : 0;
          labelEndX = width * 0.1 + spacing * index;
          labelEndY = height * 0.95;
          
          // 第一段：从扇形边缘向下延伸固定长度
          lineMiddleX = lineStartX;
          lineMiddleY = lineStartY + lineExtensionLength;
          // 第二段：水平连接到标签
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          
          textAlign = 'center';
          textX = labelEndX;
          textY = labelEndY + 30;
        }
        
        // 绘制引导线
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineMiddleX, lineMiddleY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制标签起点的小圆点（颜色与扇形一致）
        ctx.beginPath();
        ctx.arc(lineStartX, lineStartY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制标签文本
        ctx.save();
        
        // 分类名称
        ctx.fillStyle = '#333';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = textAlign;
        ctx.textBaseline = position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : 'middle';
        ctx.fillText(item.categoryName, textX, textY - (position === 'top' || position === 'bottom' ? 0 : 12));
        
        // 金额
        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`¥${item.amount.toFixed(2)}`, textX, textY + (position === 'top' || position === 'bottom' ? 0 : 2));
        
        // 百分比
        ctx.font = '10px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText(`${item.percentage.toFixed(1)}%`, textX, textY + (position === 'top' || position === 'bottom' ? 0 : 16));
        
        ctx.restore();
      });
      
      // 如果使用 canvas 2d，需要手动触发绘制
      if (ctx.draw) {
        ctx.draw();
      }
    },
    
    getColor(index) {
      const colors = [
        '#F5A623', '#F7B84D', '#FFD080', '#F38181', '#AA96DA',
        '#FFE66D', '#F7B84D', '#FFD080', '#E8940C', '#FFA07A'
      ];
      return colors[index % colors.length];
    }
  }
};
</script>

<style lang="scss" scoped>
.statistics-container {
  padding: 24rpx;
  background: #F5F5F5;
  min-height: 100vh;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 32rpx;
  
  .stat-card {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-label {
      font-size: 24rpx;
      color: #999999;
      margin-bottom: 16rpx;
    }
    
    .stat-value {
      font-size: 36rpx;
      font-weight: bold;
      color: #333333;
    }
  }
}

.budget-progress {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .progress-label {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
    }
    
    .progress-text {
      font-size: 24rpx;
      color: #666666;
    }
  }
  
  .progress-bar {
    height: 16rpx;
    background: #F5F5F5;
    border-radius: 8rpx;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #5CB85C 0%, #7BC87E 100%);
      transition: width 0.3s;
      
      &.over {
        background: linear-gradient(135deg, #F5A623 0%, #F7B84D 100%);
      }
    }
  }
}

.category-statistics {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .pie-chart-container {
    height: 500rpx;
    margin-bottom: 32rpx;
    width: 100%;
    
    .pie-chart-canvas {
      width: 100%;
      height: 100%;
    }
  }
  
  .empty-chart {
    height: 400rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    
    .empty-text {
      font-size: 28rpx;
      color: #999999;
    }
  }
  
  .category-list {
    .category-stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #F5F5F5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .category-info {
        display: flex;
        align-items: center;
        flex: 1;
        
        .category-icon {
          width: 64rpx;
          height: 64rpx;
          border-radius: 12rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rpx;
          margin-right: 24rpx;
        }
        
        .category-name {
          font-size: 28rpx;
          color: #333333;
        }
      }
      
      .category-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        
        .amount {
          font-size: 28rpx;
          font-weight: bold;
          color: #333333;
          margin-bottom: 8rpx;
        }
        
        .percentage {
          font-size: 24rpx;
          color: #999999;
        }
      }
    }
  }
}
</style>

