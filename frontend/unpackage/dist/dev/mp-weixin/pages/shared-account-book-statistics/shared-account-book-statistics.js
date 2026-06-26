"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
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
    "statistics.categoryStatistics": {
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
    this.$nextTick(() => {
      this.initChart();
    });
  },
  onUnload() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
  methods: {
    async loadStatistics() {
      this.loading = true;
      try {
        this.statistics = await utils_api.api.sharedAccountBooks.getStatistics(this.sharedAccountBookId);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-statistics/shared-account-book-statistics.vue:132", "加载统计失败", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
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
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select("#pieChart").fields({ node: true, size: true }).exec((res) => {
          if (!res[0] || !res[0].node) {
            common_vendor.index.__f__("warn", "at pages/shared-account-book-statistics/shared-account-book-statistics.vue:154", "未找到 canvas 节点，尝试使用 canvas-id 方式");
            this.initChartWithCanvasId();
            return;
          }
          const canvas = res[0].node;
          const ctx = canvas.getContext("2d");
          const dpr = common_vendor.index.getSystemInfoSync().pixelRatio;
          const width = res[0].width;
          const height = res[0].height;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          this.drawPieChart(ctx, width, height);
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-statistics/shared-account-book-statistics.vue:175", "初始化图表失败", error);
        this.initChartWithCanvasId();
      }
    },
    initChartWithCanvasId() {
      const ctx = common_vendor.index.createCanvasContext("pieChart", this);
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#pieChart").boundingClientRect((res) => {
        if (res) {
          this.drawPieChart(ctx, res.width, res.height);
          ctx.draw();
        }
      }).exec();
    },
    drawPieChart(ctx, width, height) {
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = Math.min(width, height) * 0.12;
      const outerRadius = Math.min(width, height) * 0.25;
      const lineExtensionLength = 35;
      height / (this.statistics.categoryStatistics.length + 1);
      const total = this.statistics.categoryStatistics.reduce((sum, item) => sum + item.amount, 0);
      let currentAngle = -Math.PI / 2;
      this.statistics.categoryStatistics.forEach((item, index) => {
        const angle = item.amount / total * 2 * Math.PI;
        const color = item.categoryColor || this.getColor(index);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + angle, false);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, innerRadius, currentAngle, currentAngle + angle, false);
        ctx.closePath();
        ctx.fillStyle = "#fff";
        ctx.fill();
        currentAngle += angle;
      });
      const segments = [];
      currentAngle = -Math.PI / 2;
      this.statistics.categoryStatistics.forEach((item, index) => {
        const angle = item.amount / total * 2 * Math.PI;
        const labelAngle = currentAngle + angle / 2;
        const lineStartX = centerX + Math.cos(labelAngle) * outerRadius;
        const lineStartY = centerY + Math.sin(labelAngle) * outerRadius;
        let position;
        if (lineStartX < centerX - 10) {
          position = "left";
        } else if (lineStartX > centerX + 10) {
          position = "right";
        } else if (lineStartY < centerY - 10) {
          position = "top";
        } else {
          position = "bottom";
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
      const leftSegments = segments.filter((s) => s.position === "left").sort((a, b) => a.lineStartY - b.lineStartY);
      const rightSegments = segments.filter((s) => s.position === "right").sort((a, b) => a.lineStartY - b.lineStartY);
      const topSegments = segments.filter((s) => s.position === "top").sort((a, b) => a.lineStartX - b.lineStartX);
      const bottomSegments = segments.filter((s) => s.position === "bottom").sort((a, b) => a.lineStartX - b.lineStartX);
      segments.forEach((segment) => {
        const { item, lineStartX, lineStartY, color, position } = segment;
        let labelEndX, labelEndY;
        let lineMiddleX, lineMiddleY, lineEndX, lineEndY;
        let textAlign, textX, textY;
        if (position === "left") {
          const index = leftSegments.indexOf(segment);
          const spacing = leftSegments.length > 1 ? height * 0.8 / (leftSegments.length - 1) : 0;
          labelEndY = height * 0.1 + spacing * index;
          labelEndX = width * 0.05;
          lineMiddleX = lineStartX - lineExtensionLength;
          lineMiddleY = lineStartY;
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          textAlign = "left";
          textX = labelEndX + 8;
          textY = labelEndY;
        } else if (position === "right") {
          const index = rightSegments.indexOf(segment);
          const spacing = rightSegments.length > 1 ? height * 0.8 / (rightSegments.length - 1) : 0;
          labelEndY = height * 0.1 + spacing * index;
          labelEndX = width * 0.95;
          lineMiddleX = lineStartX + lineExtensionLength;
          lineMiddleY = lineStartY;
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          textAlign = "right";
          textX = labelEndX - 8;
          textY = labelEndY;
        } else if (position === "top") {
          const index = topSegments.indexOf(segment);
          const spacing = topSegments.length > 1 ? width * 0.8 / (topSegments.length - 1) : 0;
          labelEndX = width * 0.1 + spacing * index;
          labelEndY = height * 0.05;
          lineMiddleX = lineStartX;
          lineMiddleY = lineStartY - lineExtensionLength;
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          textAlign = "center";
          textX = labelEndX;
          textY = labelEndY - 30;
        } else {
          const index = bottomSegments.indexOf(segment);
          const spacing = bottomSegments.length > 1 ? width * 0.8 / (bottomSegments.length - 1) : 0;
          labelEndX = width * 0.1 + spacing * index;
          labelEndY = height * 0.95;
          lineMiddleX = lineStartX;
          lineMiddleY = lineStartY + lineExtensionLength;
          lineEndX = labelEndX;
          lineEndY = labelEndY;
          textAlign = "center";
          textX = labelEndX;
          textY = labelEndY + 30;
        }
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineMiddleX, lineMiddleY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(lineStartX, lineStartY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.save();
        ctx.fillStyle = "#333";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = textAlign;
        ctx.textBaseline = position === "top" ? "bottom" : position === "bottom" ? "top" : "middle";
        ctx.fillText(item.categoryName, textX, textY - (position === "top" || position === "bottom" ? 0 : 12));
        ctx.font = "11px Arial";
        ctx.fillStyle = "#666";
        ctx.fillText(`¥${item.amount.toFixed(2)}`, textX, textY + (position === "top" || position === "bottom" ? 0 : 2));
        ctx.font = "10px Arial";
        ctx.fillStyle = "#999";
        ctx.fillText(`${item.percentage.toFixed(1)}%`, textX, textY + (position === "top" || position === "bottom" ? 0 : 16));
        ctx.restore();
      });
      if (ctx.draw) {
        ctx.draw();
      }
    },
    getColor(index) {
      const colors = [
        "#F5A623",
        "#F7B84D",
        "#FFD080",
        "#F38181",
        "#AA96DA",
        "#FFE66D",
        "#F7B84D",
        "#FFD080",
        "#E8940C",
        "#FFA07A"
      ];
      return colors[index % colors.length];
    }
  }
};
if (!Array) {
  const _easycom_app_icon2 = common_vendor.resolveComponent("app-icon");
  _easycom_app_icon2();
}
const _easycom_app_icon = () => "../../components/app-icon/app-icon.js";
if (!Math) {
  _easycom_app_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.statistics.totalExpense.toFixed(2)),
    b: $data.statistics.budget
  }, $data.statistics.budget ? {
    c: common_vendor.t($data.statistics.budget.toFixed(2))
  } : {}, {
    d: common_vendor.t($data.statistics.averagePerPerson.toFixed(2)),
    e: $data.statistics.budget
  }, $data.statistics.budget ? {
    f: common_vendor.t($data.statistics.budgetRemaining >= 0 ? "剩余" : "超支"),
    g: common_vendor.t(Math.abs($data.statistics.budgetRemaining || 0).toFixed(2)),
    h: `${Math.min(100, $data.statistics.totalExpense / $data.statistics.budget * 100)}%`,
    i: $data.statistics.budgetRemaining < 0 ? 1 : ""
  } : {}, {
    j: $data.statistics.categoryStatistics.length > 0
  }, $data.statistics.categoryStatistics.length > 0 ? {} : {}, {
    k: common_vendor.f($data.statistics.categoryStatistics, (item, k0, i0) => {
      return {
        a: "ede4542f-0-" + i0,
        b: common_vendor.p({
          icon: item.categoryIcon,
          ["category-name"]: item.categoryName,
          size: 16,
          color: "#FFFFFF"
        }),
        c: item.categoryColor,
        d: common_vendor.t(item.categoryName),
        e: common_vendor.t(item.amount.toFixed(2)),
        f: common_vendor.t(item.percentage.toFixed(1)),
        g: item.categoryId
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-ede4542f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-book-statistics/shared-account-book-statistics.js.map
