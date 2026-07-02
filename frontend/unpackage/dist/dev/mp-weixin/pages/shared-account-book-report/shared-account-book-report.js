"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_util = require("../../utils/util.js");
const _sfc_main = {
  data() {
    return {
      accountBookId: null,
      report: null,
      loading: true,
      viewType: "all",
      // 'all', 'expense', 'income'
      expenseChartCtx: null,
      incomeChartCtx: null,
      memberChartCtx: null
    };
  },
  computed: {
    // 根据viewType过滤交易记录
    filteredTransactions() {
      var _a;
      if (!((_a = this.report) == null ? void 0 : _a.allTransactions))
        return [];
      if (this.viewType === "all")
        return this.report.allTransactions;
      if (this.viewType === "expense")
        return this.report.allTransactions.filter((t) => t.type === 0);
      if (this.viewType === "income")
        return this.report.allTransactions.filter((t) => t.type === 1);
      return this.report.allTransactions;
    },
    // 各成员结算：根据实际支出与分摊后支出算出需支付/应收
    memberSettlements() {
      var _a;
      const list = ((_a = this.report) == null ? void 0 : _a.memberStatistics) || [];
      return list.map((m) => {
        const actualExpense = m.totalExpense != null ? m.totalExpense : 0;
        const allocatedExpense = m.allocatedExpense != null ? m.allocatedExpense : 0;
        const amount = allocatedExpense - actualExpense;
        let type = "balanced";
        if (amount > 0)
          type = "pay";
        if (amount < 0)
          type = "receive";
        return {
          userId: m.userId,
          userName: m.userName || "未知",
          actualExpense,
          allocatedExpense,
          settlementAmount: Math.abs(amount),
          settlementType: type
        };
      });
    },
    // 需支付成员向应收成员各自支付多少钱（贪心匹配，笔数尽量少）
    settlementTransfers() {
      const payers = this.memberSettlements.filter((s) => s.settlementType === "pay" && s.settlementAmount > 0).map((p) => ({ ...p, remaining: p.settlementAmount }));
      const receivers = this.memberSettlements.filter((s) => s.settlementType === "receive" && s.settlementAmount > 0).map((r) => ({ ...r, remaining: r.settlementAmount }));
      const transfers = [];
      let pi = 0;
      let ri = 0;
      const epsilon = 5e-3;
      while (pi < payers.length && ri < receivers.length) {
        if (payers[pi].remaining < epsilon) {
          pi++;
          continue;
        }
        if (receivers[ri].remaining < epsilon) {
          ri++;
          continue;
        }
        const amount = Math.min(payers[pi].remaining, receivers[ri].remaining);
        if (amount < epsilon)
          break;
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
    var _a;
    if ((_a = this.report) == null ? void 0 : _a.accountBook) {
      return {
        title: `${this.report.accountBook.name} - 一起账本报告`,
        path: `/pages/shared-account-book-report/shared-account-book-report?id=${this.accountBookId}`,
        imageUrl: "/static/share-report.jpg"
        // 可以设置分享图片URL
      };
    }
    return {
      title: "一起账本报告",
      path: "/pages/index/index"
    };
  },
  methods: {
    formatDate: utils_util.formatDate,
    // 格式化金额（报告数据已经是元，不需要再除以100）
    formatAmount(yuan) {
      if (yuan == null || yuan === void 0)
        return "0.00";
      return parseFloat(yuan).toFixed(2);
    },
    // 切换视图类型
    switchViewType(type) {
      this.viewType = type;
      this.$nextTick(() => {
        this.initCharts();
      });
    },
    async loadReport() {
      if (!this.accountBookId)
        return;
      this.loading = true;
      try {
        this.report = await utils_api.api.sharedAccountBooks.generateReport(this.accountBookId);
        this.$nextTick(() => {
          this.initCharts();
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/shared-account-book-report/shared-account-book-report.vue:477", "加载报告失败", error);
        common_vendor.index.showToast({
          title: error.message || "加载报告失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    initCharts() {
      setTimeout(() => {
        var _a, _b, _c, _d, _e, _f;
        if (((_b = (_a = this.report) == null ? void 0 : _a.expenseCategoryStatistics) == null ? void 0 : _b.length) > 0) {
          this.drawExpensePieChart();
        }
        if (((_d = (_c = this.report) == null ? void 0 : _c.incomeCategoryStatistics) == null ? void 0 : _d.length) > 0) {
          this.drawIncomePieChart();
        }
        if (((_f = (_e = this.report) == null ? void 0 : _e.memberStatistics) == null ? void 0 : _f.length) > 0) {
          this.drawMemberBarChart();
        }
      }, 300);
    },
    drawExpensePieChart() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#expensePieChart").boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawExpensePieChart(), 100);
          return;
        }
        const ctx = common_vendor.index.createCanvasContext("expensePieChart", this);
        const data = this.report.expenseCategoryStatistics;
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        if (total === 0) {
          ctx.draw();
          return;
        }
        const centerX = res.width / 2;
        const centerY = res.height / 2;
        const radius = Math.min(res.width, res.height) * 0.25;
        let startAngle = -Math.PI / 2;
        data.forEach((item, index) => {
          const angle = item.amount / total * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const midAngle = (startAngle + endAngle) / 2;
          const color = item.categoryColor || this.getColor(index);
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.setFillStyle(color);
          ctx.fill();
          const lineStartX = centerX + radius * Math.cos(midAngle);
          const lineStartY = centerY + radius * Math.sin(midAngle);
          const lineLength = Math.min(res.width, res.height) * 0.15;
          const lineEndX = centerX + (radius + lineLength) * Math.cos(midAngle);
          const lineEndY = centerY + (radius + lineLength) * Math.sin(midAngle);
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineStartY);
          ctx.lineTo(lineEndX, lineEndY);
          ctx.setStrokeStyle("#E0E0E0");
          ctx.setLineWidth(1);
          ctx.stroke();
          const labelOffset = 15;
          let labelX, labelY;
          if (Math.cos(midAngle) > 0) {
            labelX = Math.min(lineEndX + labelOffset, res.width - 10);
            labelY = lineEndY;
            ctx.setTextAlign("left");
          } else {
            labelX = Math.max(lineEndX - labelOffset, 10);
            labelY = lineEndY;
            ctx.setTextAlign("right");
          }
          labelY = Math.max(20, Math.min(labelY, res.height - 20));
          ctx.setTextBaseline("middle");
          ctx.setFontSize(13);
          ctx.setFillStyle("#333");
          const name = item.categoryName.length > 8 ? item.categoryName.substring(0, 8) + "..." : item.categoryName;
          ctx.fillText(name, labelX, labelY - 8);
          ctx.setFontSize(12);
          ctx.setFillStyle("#999");
          ctx.fillText(`${item.percentage.toFixed(1)}%`, labelX, labelY + 8);
          startAngle = endAngle;
        });
        ctx.draw();
      }).exec();
    },
    drawIncomePieChart() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#incomePieChart").boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawIncomePieChart(), 100);
          return;
        }
        const ctx = common_vendor.index.createCanvasContext("incomePieChart", this);
        const data = this.report.incomeCategoryStatistics;
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        if (total === 0) {
          ctx.draw();
          return;
        }
        const centerX = res.width / 2;
        const centerY = res.height / 2;
        const radius = Math.min(res.width, res.height) * 0.25;
        let startAngle = -Math.PI / 2;
        data.forEach((item, index) => {
          const angle = item.amount / total * 2 * Math.PI;
          const endAngle = startAngle + angle;
          const midAngle = (startAngle + endAngle) / 2;
          const color = item.categoryColor || this.getColor(index);
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.setFillStyle(color);
          ctx.fill();
          const lineStartX = centerX + radius * Math.cos(midAngle);
          const lineStartY = centerY + radius * Math.sin(midAngle);
          const lineLength = Math.min(res.width, res.height) * 0.15;
          const lineEndX = centerX + (radius + lineLength) * Math.cos(midAngle);
          const lineEndY = centerY + (radius + lineLength) * Math.sin(midAngle);
          ctx.beginPath();
          ctx.moveTo(lineStartX, lineStartY);
          ctx.lineTo(lineEndX, lineEndY);
          ctx.setStrokeStyle("#E0E0E0");
          ctx.setLineWidth(1);
          ctx.stroke();
          const labelOffset = 15;
          let labelX, labelY;
          if (Math.cos(midAngle) > 0) {
            labelX = Math.min(lineEndX + labelOffset, res.width - 10);
            labelY = lineEndY;
            ctx.setTextAlign("left");
          } else {
            labelX = Math.max(lineEndX - labelOffset, 10);
            labelY = lineEndY;
            ctx.setTextAlign("right");
          }
          labelY = Math.max(20, Math.min(labelY, res.height - 20));
          ctx.setTextBaseline("middle");
          ctx.setFontSize(13);
          ctx.setFillStyle("#333");
          const name = item.categoryName.length > 8 ? item.categoryName.substring(0, 8) + "..." : item.categoryName;
          ctx.fillText(name, labelX, labelY - 8);
          ctx.setFontSize(12);
          ctx.setFillStyle("#999");
          ctx.fillText(`${item.percentage.toFixed(1)}%`, labelX, labelY + 8);
          startAngle = endAngle;
        });
        ctx.draw();
      }).exec();
    },
    drawMemberBarChart() {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select("#memberBarChart").boundingClientRect((res) => {
        if (!res) {
          setTimeout(() => this.drawMemberBarChart(), 100);
          return;
        }
        const ctx = common_vendor.index.createCanvasContext("memberBarChart", this);
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
        const expenseVal = (m) => m.allocatedExpense != null ? m.allocatedExpense : m.totalExpense;
        let maxAmount;
        if (this.viewType === "expense") {
          maxAmount = Math.max(...data.map((m) => expenseVal(m)), 0);
        } else if (this.viewType === "income") {
          maxAmount = Math.max(...data.map((m) => m.totalIncome), 0);
        } else {
          maxAmount = Math.max(...data.map((m) => expenseVal(m) + m.totalIncome), 0);
        }
        if (maxAmount === 0) {
          ctx.draw();
          return;
        }
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length;
        ctx.setStrokeStyle("#E0E0E0");
        ctx.setLineWidth(1);
        ctx.beginPath();
        ctx.moveTo(padding, canvasHeight - padding);
        ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.stroke();
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
          const y = padding + chartHeight / gridLines * i;
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(canvasWidth - padding, y);
          ctx.setStrokeStyle("#F5F5F5");
          ctx.stroke();
          const value = maxAmount * (1 - i / gridLines);
          ctx.setFontSize(10);
          ctx.setFillStyle("#999");
          ctx.setTextAlign("right");
          ctx.setTextBaseline("middle");
          ctx.fillText(value.toFixed(0), padding - 8, y);
        }
        data.forEach((member, index) => {
          const x = padding + barSpacing * index + barSpacing * 0.2;
          if (this.viewType === "all") {
            const exp = expenseVal(member);
            const expenseHeight = exp / maxAmount * chartHeight;
            const incomeHeight = member.totalIncome / maxAmount * chartHeight;
            if (exp > 0) {
              ctx.setFillStyle("#E85D4B");
              ctx.fillRect(x, canvasHeight - padding - expenseHeight, barWidth, expenseHeight);
            }
            if (member.totalIncome > 0) {
              ctx.setFillStyle("#5CB85C");
              ctx.fillRect(x, canvasHeight - padding - expenseHeight - incomeHeight, barWidth, incomeHeight);
            }
          } else if (this.viewType === "expense") {
            const exp = expenseVal(member);
            const expenseHeight = exp / maxAmount * chartHeight;
            if (exp > 0) {
              ctx.setFillStyle("#E85D4B");
              ctx.fillRect(x, canvasHeight - padding - expenseHeight, barWidth, expenseHeight);
            }
          } else if (this.viewType === "income") {
            const incomeHeight = member.totalIncome / maxAmount * chartHeight;
            if (member.totalIncome > 0) {
              ctx.setFillStyle("#5CB85C");
              ctx.fillRect(x, canvasHeight - padding - incomeHeight, barWidth, incomeHeight);
            }
          }
          ctx.setFontSize(10);
          ctx.setFillStyle("#333");
          ctx.setTextAlign("center");
          ctx.setTextBaseline("top");
          const name = member.userName.length > 3 ? member.userName.substring(0, 3) + "..." : member.userName;
          ctx.fillText(name, x + barWidth / 2, canvasHeight - padding + 5);
        });
        ctx.draw();
      }).exec();
    },
    getColor(index) {
      const colors = ["#F5A623", "#F7B84D", "#FFD080", "#F38181", "#AA96DA", "#FCBAD3", "#FFD93D", "#E8940C"];
      return colors[index % colors.length];
    },
    // 根据viewType获取成员交易数
    getMemberTransactionCount(member) {
      var _a;
      if (!((_a = this.report) == null ? void 0 : _a.allTransactions))
        return member.transactionCount;
      if (this.viewType === "all")
        return member.transactionCount;
      const memberTransactions = this.report.allTransactions.filter((t) => t.userId === member.userId);
      if (this.viewType === "expense") {
        return memberTransactions.filter((t) => t.type === 0).length;
      }
      if (this.viewType === "income") {
        return memberTransactions.filter((t) => t.type === 1).length;
      }
      return member.transactionCount;
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa, _ba;
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : common_vendor.e({
    b: common_vendor.t(((_b = (_a = $data.report) == null ? void 0 : _a.accountBook) == null ? void 0 : _b.name) || "一起账本报告"),
    c: common_vendor.t($options.formatDate((_c = $data.report) == null ? void 0 : _c.generatedAt)),
    d: $data.viewType === "all" ? 1 : "",
    e: common_vendor.o(($event) => $options.switchViewType("all"), "af"),
    f: $data.viewType === "expense" ? 1 : "",
    g: common_vendor.o(($event) => $options.switchViewType("expense"), "ed"),
    h: $data.viewType === "income" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchViewType("income"), "17"),
    j: common_vendor.t((_e = (_d = $data.report) == null ? void 0 : _d.accountBook) == null ? void 0 : _e.name),
    k: (_g = (_f = $data.report) == null ? void 0 : _f.accountBook) == null ? void 0 : _g.description
  }, ((_i = (_h = $data.report) == null ? void 0 : _h.accountBook) == null ? void 0 : _i.description) ? {
    l: common_vendor.t((_k = (_j = $data.report) == null ? void 0 : _j.accountBook) == null ? void 0 : _k.description)
  } : {}, {
    m: common_vendor.t((_m = (_l = $data.report) == null ? void 0 : _l.accountBook) == null ? void 0 : _m.memberCount),
    n: (_o = (_n = $data.report) == null ? void 0 : _n.accountBook) == null ? void 0 : _o.budget
  }, ((_q = (_p = $data.report) == null ? void 0 : _p.accountBook) == null ? void 0 : _q.budget) ? {
    o: common_vendor.t((_t = (_s = (_r = $data.report) == null ? void 0 : _r.accountBook) == null ? void 0 : _s.budget) == null ? void 0 : _t.toFixed(2))
  } : {}, {
    p: (_v = (_u = $data.report) == null ? void 0 : _u.accountBook) == null ? void 0 : _v.startDate
  }, ((_x = (_w = $data.report) == null ? void 0 : _w.accountBook) == null ? void 0 : _x.startDate) ? {
    q: common_vendor.t($options.formatDate((_z = (_y = $data.report) == null ? void 0 : _y.accountBook) == null ? void 0 : _z.startDate))
  } : {}, {
    r: (_B = (_A = $data.report) == null ? void 0 : _A.accountBook) == null ? void 0 : _B.endDate
  }, ((_D = (_C = $data.report) == null ? void 0 : _C.accountBook) == null ? void 0 : _D.endDate) ? {
    s: common_vendor.t($options.formatDate((_F = (_E = $data.report) == null ? void 0 : _E.accountBook) == null ? void 0 : _F.endDate))
  } : {}, {
    t: $data.viewType === "all" || $data.viewType === "expense"
  }, $data.viewType === "all" || $data.viewType === "expense" ? {
    v: common_vendor.t($options.formatAmount(((_G = $data.report) == null ? void 0 : _G.totalExpense) || 0))
  } : {}, {
    w: $data.viewType === "all" || $data.viewType === "income"
  }, $data.viewType === "all" || $data.viewType === "income" ? {
    x: common_vendor.t($options.formatAmount(((_H = $data.report) == null ? void 0 : _H.totalIncome) || 0))
  } : {}, {
    y: $data.viewType === "all"
  }, $data.viewType === "all" ? {
    z: common_vendor.t($options.formatAmount(((_I = $data.report) == null ? void 0 : _I.balance) || 0)),
    A: (((_J = $data.report) == null ? void 0 : _J.balance) || 0) < 0 ? 1 : ""
  } : {}, {
    B: $data.viewType !== "all" ? 1 : "",
    C: $data.viewType === "all" || $data.viewType === "expense"
  }, $data.viewType === "all" || $data.viewType === "expense" ? {
    D: common_vendor.t($options.formatAmount(((_K = $data.report) == null ? void 0 : _K.averageExpensePerPerson) || 0))
  } : {}, {
    E: $data.viewType === "all" || $data.viewType === "income"
  }, $data.viewType === "all" || $data.viewType === "income" ? {
    F: common_vendor.t($options.formatAmount(((_L = $data.report) == null ? void 0 : _L.averageIncomePerPerson) || 0))
  } : {}, {
    G: $data.viewType !== "all" ? 1 : "",
    H: ((_N = (_M = $data.report) == null ? void 0 : _M.memberStatistics) == null ? void 0 : _N.length) > 0
  }, ((_P = (_O = $data.report) == null ? void 0 : _O.memberStatistics) == null ? void 0 : _P.length) > 0 ? common_vendor.e({
    I: $data.viewType === "all" || $data.viewType === "expense"
  }, $data.viewType === "all" || $data.viewType === "expense" ? {} : {}, {
    J: $data.viewType === "all" || $data.viewType === "income"
  }, $data.viewType === "all" || $data.viewType === "income" ? {} : {}, {
    K: common_vendor.t($data.viewType === "all" ? "收支" : $data.viewType === "expense" ? "支出" : "收入")
  }) : {}, {
    L: ($data.viewType === "all" || $data.viewType === "expense") && ((_R = (_Q = $data.report) == null ? void 0 : _Q.memberStatistics) == null ? void 0 : _R.length) > 0
  }, ($data.viewType === "all" || $data.viewType === "expense") && ((_T = (_S = $data.report) == null ? void 0 : _S.memberStatistics) == null ? void 0 : _T.length) > 0 ? {
    M: common_vendor.f($data.report.memberStatistics, (member, k0, i0) => {
      return {
        a: common_vendor.t(member.userName || "未知"),
        b: common_vendor.t($options.formatAmount(member.allocatedExpense != null ? member.allocatedExpense : 0)),
        c: member.userId
      };
    })
  } : {}, {
    N: ($data.viewType === "all" || $data.viewType === "expense") && $options.memberSettlements.length > 0
  }, ($data.viewType === "all" || $data.viewType === "expense") && $options.memberSettlements.length > 0 ? {
    O: common_vendor.f($options.memberSettlements, (s, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t((s.userName || "?").charAt(0)),
        b: common_vendor.t(s.userName),
        c: common_vendor.t($options.formatAmount(s.actualExpense)),
        d: common_vendor.t($options.formatAmount(s.allocatedExpense)),
        e: s.settlementType === "pay"
      }, s.settlementType === "pay" ? {} : s.settlementType === "receive" ? {} : {}, {
        f: s.settlementType === "receive",
        g: s.settlementType === "pay"
      }, s.settlementType === "pay" ? {
        h: common_vendor.t($options.formatAmount(s.settlementAmount))
      } : s.settlementType === "receive" ? {
        j: common_vendor.t($options.formatAmount(s.settlementAmount))
      } : {}, {
        i: s.settlementType === "receive",
        k: common_vendor.n(s.settlementType),
        l: s.userId
      });
    })
  } : {}, {
    P: ($data.viewType === "all" || $data.viewType === "expense") && $options.settlementTransfers.length > 0
  }, ($data.viewType === "all" || $data.viewType === "expense") && $options.settlementTransfers.length > 0 ? {
    Q: common_vendor.f($options.settlementTransfers, (t, index, i0) => {
      return {
        a: common_vendor.t(t.fromUserName),
        b: common_vendor.t(t.toUserName),
        c: common_vendor.t($options.formatAmount(t.amount)),
        d: index
      };
    })
  } : {}, {
    R: ($data.viewType === "all" || $data.viewType === "expense") && ((_V = (_U = $data.report) == null ? void 0 : _U.expenseCategoryStatistics) == null ? void 0 : _V.length) > 0
  }, ($data.viewType === "all" || $data.viewType === "expense") && ((_X = (_W = $data.report) == null ? void 0 : _W.expenseCategoryStatistics) == null ? void 0 : _X.length) > 0 ? {
    S: common_vendor.f($data.report.expenseCategoryStatistics, (item, index, i0) => {
      return {
        a: "bcfb8c69-0-" + i0,
        b: common_vendor.p({
          icon: item.categoryIcon,
          ["category-name"]: item.categoryName,
          size: 16,
          color: "#FFFFFF"
        }),
        c: item.categoryColor || "#AA96DA",
        d: common_vendor.t(item.categoryName),
        e: common_vendor.t(item.percentage.toFixed(1)),
        f: common_vendor.t($options.formatAmount(item.amount)),
        g: item.categoryId
      };
    })
  } : {}, {
    T: ($data.viewType === "all" || $data.viewType === "income") && ((_Z = (_Y = $data.report) == null ? void 0 : _Y.incomeCategoryStatistics) == null ? void 0 : _Z.length) > 0
  }, ($data.viewType === "all" || $data.viewType === "income") && ((_$ = (__ = $data.report) == null ? void 0 : __.incomeCategoryStatistics) == null ? void 0 : _$.length) > 0 ? {
    U: common_vendor.f($data.report.incomeCategoryStatistics, (item, index, i0) => {
      return {
        a: "bcfb8c69-1-" + i0,
        b: common_vendor.p({
          icon: item.categoryIcon,
          ["category-name"]: item.categoryName,
          size: 16,
          color: "#FFFFFF"
        }),
        c: item.categoryColor || "#AA96DA",
        d: common_vendor.t(item.categoryName),
        e: common_vendor.t(item.percentage.toFixed(1)),
        f: common_vendor.t($options.formatAmount(item.amount)),
        g: item.categoryId
      };
    })
  } : {}, {
    V: ((_aa = $options.filteredTransactions) == null ? void 0 : _aa.length) > 0
  }, ((_ba = $options.filteredTransactions) == null ? void 0 : _ba.length) > 0 ? {
    W: common_vendor.t($data.viewType === "all" ? "全部" : $data.viewType === "expense" ? "支出" : "收入"),
    X: common_vendor.t($options.filteredTransactions.length),
    Y: common_vendor.f($options.filteredTransactions, (transaction, k0, i0) => {
      return common_vendor.e({
        a: "bcfb8c69-2-" + i0,
        b: common_vendor.p({
          icon: transaction.categoryIcon,
          ["category-name"]: transaction.categoryName,
          size: 16,
          color: "#FFFFFF"
        }),
        c: transaction.categoryColor || "#AA96DA",
        d: common_vendor.t(transaction.categoryName),
        e: transaction.remark
      }, transaction.remark ? {
        f: common_vendor.t(transaction.remark)
      } : {}, {
        g: common_vendor.t($options.formatDate(transaction.transactionDate, "MM-DD")),
        h: transaction.userName
      }, transaction.userName ? {
        i: common_vendor.t(transaction.userName)
      } : {}, {
        j: common_vendor.t(transaction.type === 0 ? "-" : "+"),
        k: common_vendor.t($options.formatAmount(transaction.amount)),
        l: common_vendor.n(transaction.type === 0 ? "expense" : "income"),
        m: transaction.type === 0 && (transaction.allocations || []).length > 0
      }, transaction.type === 0 && (transaction.allocations || []).length > 0 ? {
        n: common_vendor.f(transaction.allocations || [], (a, k1, i1) => {
          return {
            a: common_vendor.t((a.userName || "?").charAt(0)),
            b: a.userId
          };
        })
      } : {}, {
        o: transaction.id
      });
    })
  } : {}));
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bcfb8c69"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shared-account-book-report/shared-account-book-report.js.map
