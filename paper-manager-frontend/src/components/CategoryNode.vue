<template>
  <div class="category-node">
    <div
      class="node-content"
      :class="{ 'node-active': selectedId === category.id }"
      :style="{ paddingLeft: `${level * 1.5 + 0.75}rem` }"
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
    <div v-if="hasChildren && expanded" class="node-children">
      <CategoryNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :selected-id="selectedId"
        :level="level + 1"
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
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--border-radius);
  margin: 0.125rem 0;
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
  padding: 0.125rem;
  color: var(--color-text-light);
  transition: transform 0.2s ease;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.node-toggle:hover {
  background: var(--color-border);
}

.node-toggle span {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.rotate-90 {
  transform: rotate(90deg);
}

.node-spacer {
  width: 1rem;
  height: 1rem;
}

.node-icon {
  font-size: 0.875rem;
  width: 1rem;
  text-align: center;
}

.node-label {
  flex: 1;
  font-size: 0.875rem;
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
  font-size: 0.75rem;
  background: var(--color-background-mute);
  color: var(--color-text-light);
  padding: 0.125rem 0.375rem;
  border-radius: 50px;
  font-weight: 500;
  min-width: 1.5rem;
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
  gap: 0.25rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  position: absolute;
  right: 2.5rem; /* 更靠右的位置，靠近论文数量但不重叠 */
  background: rgba(255, 255, 255, 0.95); /* 半透明背景 */
  padding: 0.125rem;
  border-radius: var(--border-radius);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.12);
  transform: translateX(10px); /* 初始状态稍微偏右 */
}

.action-btn {
  background: var(--white);
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(125, 108, 192, 0.08);
}

.action-btn.btn-outline-purple {
  background: var(--white);
  color: var(--primary-700);
  border: 1px solid var(--primary-600);
  box-shadow: 0 1px 3px rgba(125, 108, 192, 0.08);
}

.action-btn.btn-outline-purple:hover {
  background: var(--primary-50);
  color: var(--primary-800);
  border-color: var(--primary-700);
  box-shadow: 0 2px 5px rgba(125, 108, 192, 0.12);
}

.action-btn:hover {
  background: var(--color-border);
}

.action-btn-danger:hover {
  background: var(--error-50);
  color: var(--error-600);
}

.action-btn span {
  font-size: 0.75rem;
}

.node-children {
  margin-left: 0.5rem;
  border-left: 1px solid var(--color-border);
  padding-left: 0.5rem;
}

/* 深层级的缩进样式 */
.node-content[style*="padding-left"] {
  position: relative;
}

.node-content[style*="padding-left"]::before {
  content: "";
  position: absolute;
  left: calc(var(--level, 0) * 1.5rem + 0.375rem);
  top: 50%;
  width: 0.75rem;
  height: 1px;
  background: var(--color-border);
}
</style>
