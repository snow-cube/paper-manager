<template>
  <div class="category-node" :style="{ '--current-level': level }">
    <div
      class="node-content"
      :class="{ 'node-active': selectedId === category.id }"
      :style="{ paddingLeft: `${level * 1.5 + 0.8}rem` }"
      @click="$emit('select', category.id)"
    >
      <!-- 展开/收起按钮 -->
      <button
        v-if="hasChildren"
        class="node-toggle"
        @click.stop="toggleExpanded"
      >
        <span :class="expanded ? 'rotate-90' : ''">▶</span>
      </button>
      <span v-else class="node-spacer"></span>
      <!-- 分类图标和名称 -->
      <span class="node-icon">📁</span>
      <span class="node-label">{{ category.name }}</span>

      <!-- 论文数量 -->
      <span class="node-count" v-if="category.paper_count !== undefined">{{
        category.paper_count
      }}</span>

      <!-- 操作按钮 - 重新定位至右侧 -->
      <div class="node-actions" @click.stop>
        <button
          class="action-btn btn-outline-purple"
          @click="$emit('add-child', category.id)"
          title="添加子分类"
        >
          <span>➕</span>
        </button>
        <button
          class="action-btn"
          @click="$emit('edit', category)"
          title="编辑分类"
        >
          <span>✏️</span>
        </button>
        <button
          class="action-btn action-btn-danger"
          @click="$emit('delete', category.id)"
          title="删除分类"
        >
          <span>🗑️</span>
        </button>
      </div>
    </div>
    <!-- 子分类 -->
    <div
      v-if="hasChildren && expanded"
      class="node-children"
      :style="{ '--parent-level': level }"
    >
      <CategoryNode
        v-for="(child, index) in category.children"
        :key="child.id"
        :category="child"
        :selected-id="selectedId"
        :level="level + 1"
        :is-last="index === category.children.length - 1"
        @select="$emit('select', $event)"
        @add-child="$emit('add-child', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["select", "add-child", "edit", "delete"]);

const expanded = ref(true);

const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0;
});

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};
</script>

<style scoped>
.category-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  border-radius: var(--border-radius);
  margin: var(--space-xs) 0;
  position: relative;
  overflow: visible; /* 允许操作按钮溢出容器 */
}

.node-content:hover {
  background: var(--color-background-soft);
}

.node-content:hover .node-actions {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.node-active {
  background: var(--primary-50);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.node-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  color: var(--color-text-light);
  transition: transform 0.2s ease;
  width: var(--space-md);
  height: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.node-toggle:hover {
  background: var(--color-border);
}

.node-toggle span {
  font-size: var(--text-xs);
  transition: transform 0.2s ease;
}

.rotate-90 {
  transform: rotate(90deg);
}

.node-spacer {
  width: var(--space-md);
  height: var(--space-md);
}

.node-icon {
  font-size: var(--text-sm);
  width: var(--space-md);
  text-align: center;
}

.node-label {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  min-width: 0; /* 允许文本收缩 */
}

.node-active .node-label {
  color: var(--color-primary);
  font-weight: 600;
}

.node-count {
  font-size: var(--text-xs);
  background: var(--color-background-mute);
  color: var(--color-text-light);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 50px;
  font-weight: 500;
  min-width: var(--space-lg);
  text-align: center;
  margin-left: auto; /* 推到最右侧 */
  z-index: 5; /* 确保在悬停时仍然可见，但低于操作按钮 */
  position: relative; /* 需要z-index生效 */
}

.node-active .node-count {
  background: var(--white);
  color: var(--color-primary);
}

.node-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
  position: absolute;
  right: 3rem; /* 更靠右的位置，靠近论文数量但不重叠 */
  background: rgba(255, 255, 255, 0.95); /* 半透明背景 */
  padding: var(--space-xs);
  border-radius: var(--border-radius);
  z-index: 10;
  box-shadow: var(--shadow-sm);
  transform: translateX(10px); /* 初始状态稍微偏右 */
}

.action-btn {
  background: var(--white);
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-lg);
  height: var(--space-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.action-btn.btn-outline-purple {
  background: var(--white);
  color: var(--primary-700);
  border: 1px solid var(--primary-600);
  box-shadow: var(--shadow-sm);
}

.action-btn.btn-outline-purple:hover {
  background: var(--primary-50);
  color: var(--primary-800);
  border-color: var(--primary-700);
  box-shadow: var(--shadow-hover);
}

.action-btn:hover {
  background: var(--color-border);
}

.action-btn-danger:hover {
  background: var(--error-50);
  color: var(--error-600);
}

.action-btn span {
  font-size: var(--text-xs);
}

.node-children {
  position: relative;
}

/* 垂直连接线 - 从父节点的切换按钮位置向下 */
.node-children::before {
  content: "";
  position: absolute;
  left: calc(
    var(--parent-level, 0) * 1.5rem + 0.5rem + 0.75rem
  ); /* 与调整后的父节点缩进公式匹配 + 切换按钮中心 */
  top: -0.75rem; /* 从父节点中心开始 */
  bottom: 0.75rem; /* 延伸到最后一个子节点 */
  width: 1px;
  background: var(--color-border);
  z-index: 1;
}

/* 每个子节点的水平连接线 */
.node-children .category-node .node-content::before {
  content: "";
  position: absolute;
  left: calc(
    var(--parent-level, 0) * 1.5rem + 0.5rem + 0.75rem
  ); /* 从父级垂直线位置开始 */
  top: 50%;
  width: 1.125rem; /* 延伸到图标位置 */
  height: 1px;
  background: var(--color-border);
  z-index: 1;
}

/* 最后一个子节点的垂直线处理 */
.node-children .category-node:last-child::after {
  content: "";
  position: absolute;
  left: calc(var(--parent-level, 0) * 1.5rem + 0.5rem + 0.75rem);
  top: 50%;
  height: 0.75rem; /* 覆盖从节点中心到底部的垂直线 */
  width: 1px;
  background: var(--white);
  z-index: 2;
}
</style>
