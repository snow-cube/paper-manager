<template>
  <div class="category-select">
    <div class="form-group" :class="{ 'has-error': error }">
      <label v-if="label" class="form-label" :for="id">
        {{ label }}
        <span v-if="required" class="required-indicator">*</span>
      </label>
      <!-- 分类选择器主容器 -->
      <div
        ref="categorySelector"
        class="category-selector"
        :class="{
          'category-selector-focused': isOpen,
          'category-selector-disabled': disabled,
        }"
        @click="toggleDropdown"
        tabindex="0"
        @keydown="handleKeydown"
        @blur="handleBlur"
      >
        <!-- 选择框显示区 -->
        <div class="category-display">
          <!-- 显示选中的分类路径 -->
          <div v-if="selectedCategory" class="selected-category">
            <div class="category-breadcrumb">
              <span
                v-for="(pathItem, index) in categoryPath"
                :key="pathItem.id"
                class="breadcrumb-item"
              >
                <span class="breadcrumb-text">{{ pathItem.name }}</span>
                <span
                  v-if="index < categoryPath.length - 1"
                  class="breadcrumb-separator"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path
                      d="M4.5 2l4 4-4 4"
                      stroke="currentColor"
                      stroke-width="1.5"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </div>
          </div>

          <!-- 占位符 -->
          <div v-else class="category-placeholder">
            {{ placeholder || "请选择分类" }}
          </div>

          <!-- 清除按钮 -->
          <button
            v-if="selectedCategory && !disabled"
            type="button"
            class="clear-button"
            @click.stop="clearSelection"
            title="清除选择"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- 下拉箭头 -->
          <div class="dropdown-arrow" :class="{ 'arrow-up': isOpen }">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- 下拉选项面板 -->
      <Teleport to="body">
        <div
          v-if="isOpen"
          ref="dropdownPanel"
          class="category-dropdown"
          :style="dropdownStyles"
        >
          <!-- 搜索框 -->
          <div class="category-search">
            <div class="search-input-container">
              <svg
                class="search-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <circle
                  cx="6.5"
                  cy="6.5"
                  r="5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <path
                  d="m11 11 2.5 2.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="搜索分类..."
                @input="handleSearch"
                @keydown.stop
              />
              <button
                v-if="searchQuery"
                type="button"
                class="search-clear"
                @click="clearSearch"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                >
                  <path
                    d="M10 4L4 10M4 4l6 6"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- 分类树结构 -->
          <div class="category-tree-container">
            <!-- 无分类选项 -->
            <div
              class="category-item category-item-none"
              :class="{ 'category-item-selected': !modelValue }"
              @click="selectCategory(null)"
            >
              <div class="category-content">
                <span class="category-icon">🚫</span>
                <span class="category-name">无分类</span>
              </div>
            </div>

            <!-- 分类列表 -->
            <div v-if="filteredCategories.length > 0" class="category-list">
              <CategorySelectNode
                v-for="category in filteredCategories"
                :key="category.id"
                :category="category"
                :selected-id="modelValue"
                :expanded-ids="expandedIds"
                :search-query="searchQuery"
                @select="selectCategory"
                @toggle="toggleExpanded"
              />
            </div>

            <!-- 无结果提示 -->
            <div
              v-else-if="searchQuery && categories.length > 0"
              class="no-results"
            >
              <div class="no-results-icon">🔍</div>
              <div class="no-results-text">未找到匹配的分类</div>
              <div class="no-results-hint">尝试使用不同的关键词搜索</div>
            </div>

            <!-- 无分类数据 -->
            <div v-else-if="categories.length === 0" class="no-categories">
              <div class="no-categories-icon">📁</div>
              <div class="no-categories-text">暂无可用分类</div>
            </div>
          </div>
        </div>
      </Teleport>

      <small v-if="hint" class="form-hint">{{ hint }}</small>
      <div v-if="error" class="form-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
} from "@floating-ui/vue";
import CategorySelectNode from "./CategorySelectNode.vue";

const props = defineProps({
  id: String,
  label: String,
  modelValue: [String, Number],
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  hint: String,
  error: String,
  categories: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "change", "blur"]);

// 组件状态
const isOpen = ref(false);
const searchQuery = ref("");
const expandedIds = ref(new Set());
const dropdownPanel = ref(null);
const searchInput = ref(null);
const categorySelector = ref(null);

// 浮动定位
const { floatingStyles } = useFloating(categorySelector, dropdownPanel, {
  placement: "bottom-start",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(4),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          maxHeight: `${Math.min(availableHeight - 20, 400)}px`,
          minWidth: `${elements.reference.getBoundingClientRect().width}px`,
        });
      },
    }),
  ],
});

// 样式计算
const dropdownStyles = computed(() => ({
  ...floatingStyles.value,
  zIndex: 9999,
}));

// 构建分类映射
const categoryMap = computed(() => {
  const map = new Map();

  const addToMap = (categories) => {
    categories.forEach((category) => {
      map.set(category.id, category);
      if (category.children && category.children.length > 0) {
        addToMap(category.children);
      }
    });
  };

  addToMap(props.categories);
  return map;
});

// 获取选中的分类
const selectedCategory = computed(() => {
  if (!props.modelValue) return null;
  return categoryMap.value.get(props.modelValue);
});

// 获取分类路径
const categoryPath = computed(() => {
  if (!selectedCategory.value) return [];

  const path = [];
  let current = selectedCategory.value;

  while (current) {
    path.unshift(current);
    current = current.parent_id
      ? categoryMap.value.get(current.parent_id)
      : null;
  }

  return path;
});

// 过滤分类
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.categories;
  }

  const query = searchQuery.value.toLowerCase();

  const filterCategories = (categories) => {
    const filtered = [];
    categories.forEach((category) => {
      const matchesName = category.name.toLowerCase().includes(query);
      const hasMatchingChildren =
        category.children && filterCategories(category.children).length > 0;

      if (matchesName || hasMatchingChildren) {
        const filteredCategory = {
          ...category,
          children: category.children
            ? filterCategories(category.children)
            : [],
        };
        filtered.push(filteredCategory);

        // 自动展开包含搜索结果的节点
        if (hasMatchingChildren) {
          expandedIds.value.add(category.id);
        }
      }
    });

    return filtered;
  };

  return filterCategories(props.categories);
});

// 切换下拉框
const toggleDropdown = () => {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });
  }
};

// 选择分类
const selectCategory = (categoryId) => {
  emit("update:modelValue", categoryId);
  emit("change", categoryId);
  isOpen.value = false;
  searchQuery.value = "";
};

// 清除选择
const clearSelection = () => {
  emit("update:modelValue", null);
  emit("change", null);
};

// 切换节点展开状态
const toggleExpanded = (categoryId) => {
  if (expandedIds.value.has(categoryId)) {
    expandedIds.value.delete(categoryId);
  } else {
    expandedIds.value.add(categoryId);
  }
};

// 搜索处理
const handleSearch = () => {
  // 搜索时自动展开包含结果的节点（在computed中处理）
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = "";
  if (searchInput.value) {
    searchInput.value.focus();
  }
};

// 键盘事件处理
const handleKeydown = (event) => {
  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      toggleDropdown();
      break;
    case "Escape":
      if (isOpen.value) {
        isOpen.value = false;
        event.preventDefault();
      }
      break;
    case "ArrowDown":
      if (!isOpen.value) {
        event.preventDefault();
        toggleDropdown();
      }
      break;
  }
};

// 失焦处理
const handleBlur = (event) => {
  // 延迟处理，确保点击下拉选项时不会立即关闭
  setTimeout(() => {
    if (!dropdownPanel.value?.contains(event.relatedTarget)) {
      isOpen.value = false;
      emit("blur", event);
    }
  }, 150);
};

// 点击外部关闭
const handleClickOutside = (event) => {
  if (
    !categorySelector.value?.contains(event.target) &&
    !dropdownPanel.value?.contains(event.target)
  ) {
    isOpen.value = false;
  }
};

// 初始化默认展开状态
const initializeExpanded = () => {
  // 如果有选中的分类，展开其路径
  if (selectedCategory.value) {
    let current = selectedCategory.value;
    while (current && current.parent_id) {
      expandedIds.value.add(current.parent_id);
      current = categoryMap.value.get(current.parent_id);
    }
  }

  // 默认展开根分类
  props.categories.forEach((category) => {
    if (category.children && category.children.length > 0) {
      expandedIds.value.add(category.id);
    }
  });
};

// 监听分类数据变化
watch(
  () => props.categories,
  () => {
    initializeExpanded();
  },
  { immediate: true, deep: true }
);

// 监听modelValue变化
watch(
  () => props.modelValue,
  () => {
    if (selectedCategory.value) {
      // 确保选中分类的路径都是展开的
      let current = selectedCategory.value;
      while (current && current.parent_id) {
        expandedIds.value.add(current.parent_id);
        current = categoryMap.value.get(current.parent_id);
      }
    }
  }
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  initializeExpanded();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.category-select {
  position: relative;
}

.form-label {
  min-height: 1.5em;
  display: inline-block;
  line-height: 1.5;
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--primary-700);
}

.required-indicator {
  color: var(--error-600);
  margin-left: 2px;
}

/* 分类选择器主容器 */
.category-selector {
  position: relative;
  min-height: var(--form-input-height);
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  background: var(--white);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.category-selector:hover:not(.category-selector-disabled) {
  border-color: var(--primary-300);
  box-shadow: 0 4px 8px rgba(125, 108, 192, 0.08);
  transform: translateY(-1px);
}

.category-selector-focused {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(125, 108, 192, 0.1),
    0 8px 16px rgba(125, 108, 192, 0.15);
  transform: translateY(-2px);
}

.category-selector-disabled {
  background: var(--gray-100);
  border-color: var(--gray-200);
  cursor: not-allowed;
  opacity: 0.6;
}

/* 选择框显示区 */
.category-display {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  min-height: calc(var(--form-input-height) - 4px);
  gap: var(--space-sm);
}

/* 选中分类显示 */
.selected-category {
  flex: 1;
  min-width: 0;
}

.category-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.breadcrumb-text {
  font-weight: 600;
  color: var(--primary-700);
  font-size: var(--text-sm);
}

.breadcrumb-separator {
  color: var(--gray-400);
  display: flex;
  align-items: center;
}

/* 占位符 */
.category-placeholder {
  flex: 1;
  color: var(--gray-400);
  font-style: italic;
  font-size: var(--text-sm);
}

/* 清除按钮 */
.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--gray-100);
  border-radius: 50%;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-button:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

/* 下拉箭头 */
.dropdown-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.arrow-up {
  transform: rotate(180deg);
}

/* 下拉面板 */
.category-dropdown {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

/* 搜索框 */
.category-search {
  padding: var(--space-md);
  border-bottom: 1px solid var(--gray-100);
  background: var(--gray-25);
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-sm);
  color: var(--gray-400);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-xl) var(--space-sm)
    calc(var(--space-xl) + var(--space-xs));
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  background: var(--white);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(125, 108, 192, 0.1);
}

.search-clear {
  position: absolute;
  right: var(--space-sm);
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.search-clear:hover {
  color: var(--gray-600);
  background: var(--gray-100);
}

/* 分类树容器 */
.category-tree-container {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-xs);
}

/* 分类列表 */
.category-list {
  padding: var(--space-xs) 0;
}

/* 无分类选项 */
.category-item-none {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: var(--space-xs);
  border: 1px solid var(--gray-200);
}

.category-item-none:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

.category-item-none.category-item-selected {
  background: var(--primary-50);
  border-color: var(--primary-300);
  color: var(--primary-700);
}

.category-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.category-icon {
  font-size: var(--text-base);
  flex-shrink: 0;
}

.category-name {
  font-weight: 500;
  font-size: var(--text-sm);
}

/* 无结果状态 */
.no-results,
.no-categories {
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  color: var(--gray-500);
}

.no-results-icon,
.no-categories-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
  opacity: 0.5;
}

.no-results-text,
.no-categories-text {
  font-weight: 500;
  margin-bottom: var(--space-xs);
}

.no-results-hint {
  font-size: var(--text-xs);
  opacity: 0.8;
}

/* 错误状态 */
.form-group.has-error .category-selector {
  border-color: var(--error-400);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  color: var(--error-600);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-hint {
  color: var(--gray-500);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* 自定义滚动条 */
.category-tree-container::-webkit-scrollbar {
  width: 6px;
}

.category-tree-container::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 3px;
}

.category-tree-container::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 3px;
}

.category-tree-container::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-dropdown {
    max-height: 50vh;
  }

  .category-search {
    padding: var(--space-sm);
  }

  .breadcrumb-text {
    font-size: var(--text-xs);
  }
}
</style>
