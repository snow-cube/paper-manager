<template>
  <div class="category-node">
    <!-- 分类项目 -->
    <div
      class="category-item"
      :class="{
        'category-item-selected': selectedId === category.id,
        'category-item-highlighted': isHighlighted,
        'category-item-expanded': isExpanded,
        'category-item-has-children': hasChildren
      }"
      :style="{ paddingLeft: `${level * 1.2 + 0.5}rem` }"
      @click="handleSelect"
    >
      <!-- 展开/收起按钮 -->
      <button
        v-if="hasChildren"
        class="expand-button"
        @click.stop="handleToggle"
        :aria-label="isExpanded ? '收起' : '展开'"
      >
        <svg
          class="expand-icon"
          :class="{ 'expand-icon-rotated': isExpanded }"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M4.5 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-else class="expand-spacer"></div>

      <!-- 分类内容 -->
      <div class="category-content">
        <!-- 分类图标 -->
        <span class="category-icon">
          {{ getCategoryIcon(category) }}
        </span>

        <!-- 分类信息 -->
        <div class="category-info">
          <div class="category-name">
            <span v-html="highlightedName"></span>
            <!-- 论文数量徽章 -->
            <span
              v-if="typeof category.paper_count === 'number'"
              class="paper-count-badge"
              :title="`包含 ${category.paper_count} 篇论文`"
            >              {{ category.paper_count }}
            </span>
          </div>
        </div>
      </div>

      <!-- 选中状态指示器 -->
      <div v-if="selectedId === category.id" class="selected-indicator">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </div>
    </div>

    <!-- 子分类 -->
    <Transition name="category-children" mode="out-in">
      <div v-if="hasChildren && isExpanded" class="category-children">
        <CategorySelectNode
          v-for="child in category.children"
          :key="child.id"
          :category="child"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          :search-query="searchQuery"
          :level="level + 1"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  selectedId: {
    type: [String, Number],
    default: null,
  },
  expandedIds: {
    type: Set,
    default: () => new Set(),
  },
  searchQuery: {
    type: String,
    default: '',
  },
  level: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['select', 'toggle']);

// 计算属性
const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0;
});

const isExpanded = computed(() => {
  return props.expandedIds.has(props.category.id);
});

const isHighlighted = computed(() => {
  if (!props.searchQuery.trim()) return false;

  const query = props.searchQuery.toLowerCase();
  const name = props.category.name?.toLowerCase() || '';

  return name.includes(query);
});

// 高亮搜索结果
const highlightedName = computed(() => {
  return highlightText(props.category.name || '', props.searchQuery);
});

// 获取分类图标
const getCategoryIcon = (category) => {
  // 根据分类层级和类型返回不同图标
  if (props.level === 0) {
    return '📁'; // 根分类
  } else if (hasChildren.value) {
    return '📂'; // 有子分类的分类
  } else {
    return '📄'; // 叶子分类
  }
};

// 高亮文本函数
const highlightText = (text, query) => {
  if (!text || !query?.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

// 转义正则表达式特殊字符
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 事件处理
const handleSelect = () => {
  emit('select', props.category.id);
};

const handleToggle = () => {
  emit('toggle', props.category.id);
};
</script>

<style scoped>
.category-node {
  position: relative;
}

/* 分类项目 */
.category-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1px;
  position: relative;
  border: 1px solid transparent;
  gap: var(--space-xs);
}

.category-item:hover {
  background: var(--primary-25);
  border-color: var(--primary-200);
  transform: translateX(2px);
}

.category-item-selected {
  background: var(--primary-100);
  border-color: var(--primary-300);
  color: var(--primary-800);
  font-weight: 600;
}

.category-item-selected:hover {
  background: var(--primary-150);
  border-color: var(--primary-400);
}

.category-item-highlighted {
  background: var(--warning-50);
  border-color: var(--warning-200);
}

.category-item-highlighted:hover {
  background: var(--warning-100);
  border-color: var(--warning-300);
}

.category-item-has-children {
  position: relative;
}

.category-item-has-children::before {
  content: '';
  position: absolute;
  left: calc(var(--space-xs) + 6px);
  top: 100%;
  bottom: -1px;
  width: 1px;
  background: var(--gray-200);
  z-index: 1;
}

.category-item-expanded::before {
  background: var(--primary-300);
}

/* 展开按钮 */
.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--gray-100);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  color: var(--gray-600);
}

.expand-button:hover {
  background: var(--primary-100);
  color: var(--primary-600);
  transform: scale(1.1);
}

.expand-spacer {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon-rotated {
  transform: rotate(90deg);
}

/* 分类内容 */
.category-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}

.category-icon {
  font-size: var(--text-base);
  flex-shrink: 0;
  filter: grayscale(0.3);
  transition: filter 0.2s ease;
}

.category-item:hover .category-icon,
.category-item-selected .category-icon {
  filter: grayscale(0);
}

/* 分类信息 */
.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-800);
  line-height: 1.4;
}

.category-item-selected .category-name {
  color: var(--primary-800);
  font-weight: 600;
}

/* 论文数量徽章 */
.paper-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 var(--space-xs);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--gray-200);
  color: var(--gray-700);
  border-radius: 9px;
  flex-shrink: 0;
}

.category-item:hover .paper-count-badge {
  background: var(--primary-200);
  color: var(--primary-800);
}

.category-item-selected .paper-count-badge {
  background: var(--primary-300);
  color: var(--primary-900);
}

/* 选中状态指示器 */
.selected-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--primary-600);
  flex-shrink: 0;
}

/* 搜索高亮 */
:deep(.search-highlight) {
  background: var(--warning-200);
  color: var(--warning-900);
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 600;
}

/* 子分类容器 */
.category-children {
  position: relative;
  margin-left: var(--space-sm);
  border-left: 1px solid var(--gray-200);
  padding-left: var(--space-xs);
  margin-top: 2px;
}

.category-item-expanded + .category-children {
  border-left-color: var(--primary-300);
}

/* 过渡动画 */
.category-children-enter-active,
.category-children-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.category-children-enter-from,
.category-children-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.category-children-enter-to,
.category-children-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}

/* 层级缩进指示线 */
.category-item::after {
  content: '';
  position: absolute;
  left: calc(var(--space-xs) + 6px);
  top: 50%;
  width: 12px;
  height: 1px;
  background: var(--gray-200);
  z-index: 2;
}

.category-item:first-child::after {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-item {
    padding: var(--space-xs) var(--space-sm);
  }

  .category-name {
    font-size: var(--text-xs);
  }

  .category-icon {
    font-size: var(--text-sm);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .category-item {
    color: var(--gray-100);
  }

  .category-item:hover {
    background: var(--primary-900);
  }
  .category-item-selected {
    background: var(--primary-800);
    color: var(--primary-100);
  }

  .expand-button {
    background: var(--gray-700);
    color: var(--gray-300);
  }

  .expand-button:hover {
    background: var(--primary-700);
    color: var(--primary-200);
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .category-item,
  .expand-button,
  .expand-icon,
  .category-children-enter-active,
  .category-children-leave-active {
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .category-item {
    border: 2px solid;
  }

  .category-item:hover {
    border-color: var(--primary-600);
  }

  .category-item-selected {
    border-color: var(--primary-700);
    background: var(--primary-200);
  }
}
</style>
