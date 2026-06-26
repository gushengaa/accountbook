<template>
  <text class="app-icon" :style="iconStyle" @click="$emit('click', $event)">{{ iconChar }}</text>
</template>

<script>
import { resolveIconClass } from '@/utils/iconMap';
import { ICON_UNICODE } from '@/utils/iconUnicode';
import { isIconFontReady, loadIconFont } from '@/utils/loadIconFont';

const FALLBACK_CLASS = 'ri-file-text-line';

export default {
  name: 'AppIcon',
  emits: ['click'],
  props: {
    name: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    categoryName: {
      type: String,
      default: ''
    },
    size: {
      type: [Number, String],
      default: 22
    },
    color: {
      type: String,
      default: ''
    },
    filled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fontTick: 0
    };
  },
  computed: {
    iconClass() {
      return resolveIconClass({
        name: this.name,
        icon: this.icon,
        categoryName: this.categoryName,
        filled: this.filled
      });
    },
    iconChar() {
      // fontTick 用于字体加载完成后触发重绘
      void this.fontTick;
      return ICON_UNICODE[this.iconClass] || ICON_UNICODE[FALLBACK_CLASS] || '';
    },
    iconStyle() {
      const sizeValue = typeof this.size === 'number' ? `${this.size}px` : this.size;
      const styles = [
        `font-size:${sizeValue}`,
        'line-height:1'
      ];
      if (this.color) {
        styles.push(`color:${this.color}`);
      }
      return styles.join(';');
    }
  },
  mounted() {
    // #ifdef MP-WEIXIN
    if (isIconFontReady()) {
      this.fontTick += 1;
      return;
    }
    this._onIconFontLoaded = () => {
      this.fontTick += 1;
    };
    uni.$on('iconfont-loaded', this._onIconFontLoaded);
    loadIconFont().catch(() => {});
    // #endif
  },
  beforeUnmount() {
    // #ifdef MP-WEIXIN
    if (this._onIconFontLoaded) {
      uni.$off('iconfont-loaded', this._onIconFontLoaded);
    }
    // #endif
  }
};
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
  font-family: iconfont !important;
  font-style: normal;
  font-weight: normal;
  -webkit-font-smoothing: antialiased;
}
</style>
