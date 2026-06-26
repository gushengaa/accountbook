<template>
  <view class="page-container">
    <category-transactions-panel
      :category-id="categoryId"
      :category-name="categoryName"
      :year="year"
      :month="month"
      :transaction-type="transactionType"
    />
  </view>
</template>

<script>
import CategoryTransactionsPanel from '@/components/category-transactions-panel/category-transactions-panel.vue';

export default {
  components: {
    CategoryTransactionsPanel
  },
  data() {
    return {
      categoryId: null,
      categoryName: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      transactionType: 0
    };
  },
  onLoad(options) {
    this.categoryId = Number(options.categoryId) || null;
    this.categoryName = decodeURIComponent(options.categoryName || '');
    this.year = Number(options.year) || new Date().getFullYear();
    this.month = Number(options.month) || (new Date().getMonth() + 1);
    this.transactionType = Number(options.type) === 1 ? 1 : 0;
    uni.setNavigationBarTitle({
      title: this.categoryName ? `${this.categoryName}明细` : '分类明细'
    });
  }
};
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
}
</style>
