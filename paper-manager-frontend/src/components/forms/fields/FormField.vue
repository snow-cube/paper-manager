<template>
  <div class="form-group" :class="{ 'has-error': error }">
    <label v-if="label" class="form-label" :for="id">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>
    <!-- 文本输入 -->
    <input
      v-if="
        type === 'text' || type === 'email' || type === 'url' || type === 'date'
      "
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="form-input"
      @input="
        $emit('update:modelValue', $event.target.value);
        $emit('input', $event.target.value);
      "
      @blur="$emit('blur', $event)"
    />

    <!-- 数字输入 -->
    <input
      v-else-if="type === 'number'"
      :id="id"
      :value="modelValue"
      type="number"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"
      class="form-input"
      @input="
        $emit('update:modelValue', parseFloat($event.target.value) || 0);
        $emit('input', parseFloat($event.target.value) || 0);
      "
      @blur="$emit('blur', $event)"
    />

    <!-- 文本域 -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      class="form-textarea"
      @input="
        $emit('update:modelValue', $event.target.value);
        $emit('input', $event.target.value);
      "
      @blur="$emit('blur', $event)"
    ></textarea>    <!-- 选择框 -->
    <select
      v-else-if="type === 'select'"
      :id="id"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :multiple="multiple"
      class="form-select"
      @change="
        $emit(
          'update:modelValue',
          multiple
            ? Array.from(
                $event.target.selectedOptions,
                (option) => option.value
              )
            : $event.target.value
        );
        $emit('change', $event);
      "
      @blur="$emit('blur', $event)"
    >
      <slot>
        <option v-if="!multiple && placeholder" value="">
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>

    <!-- 搜索选择框 -->
    <div
      v-else-if="type === 'search-select'"
      class="search-select-wrapper"
      ref="searchSelectWrapper"
    >
      <div class="search-input-container">
        <input
          :id="id"
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="form-input search-select-input"
          :placeholder="placeholder"
          :required="required"
          :disabled="disabled"
          @input="handleSearchInput"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @keydown="handleSearchKeydown"
          autocomplete="off"
        />

        <!-- 清除按钮 -->
        <button
          v-if="selectedItem || searchQuery"
          type="button"
          class="search-clear-btn"
          @click="clearSearchSelection"
          title="清除"
        >
          ✕
        </button>

        <!-- 搜索图标或加载指示器 -->
        <div class="search-indicator">
          <span v-if="searchLoading" class="search-loading-spinner">⟳</span>
          <span v-else class="search-icon">🔍</span>
        </div>
      </div>      <!-- 搜索结果下拉框 -->
      <Teleport to="body">
        <div
          v-if="showSearchResults"
          ref="resultsDropdown"
          class="search-results-container"
          :style="floatingStyles"
        >
          <!-- 搜索结果列表 -->
          <div v-if="searchResults.length > 0" class="search-results-dropdown">
            <div
              v-for="(item, index) in searchResults"
              :key="getItemKey(item)"
              class="search-result-item"
              :class="{ active: index === activeSearchIndex }"
              @click="selectSearchItem(item)"
              @mouseenter="activeSearchIndex = index"
            >
              <slot name="search-item" :item="item" :index="index">
                <div class="search-item-content">
                  <div class="search-item-main">{{ getItemLabel(item) }}</div>
                  <div v-if="getItemMeta(item)" class="search-item-meta">
                    {{ getItemMeta(item) }}
                  </div>
                </div>
              </slot>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-else-if="searchLoading" class="search-loading">
            <span class="loading-spinner">⟳</span>
            <span class="loading-text">{{ loadingText || '搜索中...' }}</span>
          </div>

          <!-- 无结果提示 -->
          <div
            v-else-if="searchQuery && searchResults.length === 0 && !searchLoading"
            class="search-no-results"
          >
            <div class="no-results-text">{{ noResultsText || '未找到匹配结果' }}</div>
            <slot name="no-results" :query="searchQuery">
              <div v-if="allowCreate" class="create-hint">
                <button
                  type="button"
                  class="create-item-btn"
                  @click="handleCreateNew"
                >
                  {{ createText || `创建 "${searchQuery}"` }}
                </button>
              </div>
            </slot>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- 已选项显示 -->
    <div
      v-if="type === 'search-select' && selectedItem && !showSearchResults"
      class="selected-item-display"
    >
      <slot name="selected-item" :item="selectedItem">
        <div class="selected-item-content">
          <span class="selected-item-icon">{{ selectedItemIcon || '📄' }}</span>
          <div class="selected-item-details">
            <div class="selected-item-label">{{ getItemLabel(selectedItem) }}</div>
            <div v-if="getItemMeta(selectedItem)" class="selected-item-meta">
              {{ getItemMeta(selectedItem) }}
            </div>
          </div>
        </div>
      </slot>
    </div>

    <small v-if="hint" class="form-hint">{{ hint }}</small>
    <div v-if="error" class="form-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useFloating, autoUpdate, offset, flip, shift, size, arrow } from '@floating-ui/vue';

const props = defineProps({
  id: String,
  label: String,
  type: {
    type: String,
    default: "text",
  },
  modelValue: [String, Number, Array, Object],
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  hint: String,
  error: String,
  rows: {
    type: Number,
    default: 3,
  },
  step: String,
  min: [String, Number],
  max: [String, Number],
  multiple: Boolean,
  options: {
    type: Array,
    default: () => [],
  },
  // 搜索选择框相关属性
  searchFunction: {
    type: Function,
    default: null,
  },
  searchResults: {
    type: Array,
    default: () => [],
  },
  searchLoading: {
    type: Boolean,
    default: false,
  },
  allowCreate: {
    type: Boolean,
    default: false,
  },
  createText: String,
  noResultsText: String,
  loadingText: String,
  selectedItemIcon: String,
  itemLabelKey: {
    type: String,
    default: "label",
  },
  itemValueKey: {
    type: String,
    default: "value",
  },
  itemMetaKey: {
    type: String,
    default: "meta",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "input",
  "blur",
  "change",
  "search",
  "create-new",
]);

// 搜索选择框相关状态
const searchQuery = ref("");
const selectedItem = ref(null);
const showSearchResults = ref(false);
const activeSearchIndex = ref(-1);
const searchSelectWrapper = ref(null);
const searchInput = ref(null);
const resultsDropdown = ref(null);

// 搜索防抖定时器
let searchTimeout = null;

// 使用 floating-ui 管理下拉框位置
const { floatingStyles, isPositioned, update } = useFloating(searchSelectWrapper, resultsDropdown, {
  placement: 'bottom-start',
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(4),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          maxHeight: `${Math.min(availableHeight, 300)}px`,
        });
      },
    }),
  ],
});

// 获取项目的显示标签
const getItemLabel = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item[props.itemLabelKey] || item.name || item.label || item.title || "";
};

// 获取项目的值
const getItemValue = (item) => {
  if (!item) return null;
  if (typeof item === "string" || typeof item === "number") return item;
  return item[props.itemValueKey] || item.id || item.value || item;
};

// 获取项目的元信息
const getItemMeta = (item) => {
  if (!item || typeof item === "string") return "";
  return item[props.itemMetaKey] || item.meta || item.description || "";
};

// 获取项目的唯一键
const getItemKey = (item) => {
  return getItemValue(item) || Math.random().toString(36).substr(2, 9);
};

// 处理搜索输入
const handleSearchInput = () => {
  clearTimeout(searchTimeout);

  if (searchQuery.value.trim().length < 2) {
    showSearchResults.value = false;
    return;
  }

  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
};

// 执行搜索
const performSearch = () => {
  if (!searchQuery.value.trim()) return;

  showSearchResults.value = true;
  activeSearchIndex.value = -1;
  emit("search", searchQuery.value.trim());
};

// 处理焦点
const handleSearchFocus = () => {
  if (props.searchResults.length > 0 && searchQuery.value.trim()) {
    showSearchResults.value = true;
  }
};

const handleSearchBlur = (event) => {
  // 延迟隐藏结果，以便处理点击选择
  setTimeout(() => {
    if (!searchSelectWrapper.value?.contains(event.relatedTarget)) {
      showSearchResults.value = false;
      emit("blur", event);
    }
  }, 150);
};

// 键盘导航
const handleSearchKeydown = (event) => {
  if (!showSearchResults.value || props.searchResults.length === 0) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      activeSearchIndex.value = Math.min(
        activeSearchIndex.value + 1,
        props.searchResults.length - 1
      );
      scrollToActiveItem();
      break;
    case "ArrowUp":
      event.preventDefault();
      activeSearchIndex.value = Math.max(activeSearchIndex.value - 1, -1);
      scrollToActiveItem();
      break;
    case "Enter":
      event.preventDefault();
      if (activeSearchIndex.value >= 0) {
        selectSearchItem(props.searchResults[activeSearchIndex.value]);
      }
      break;
    case "Escape":
      showSearchResults.value = false;
      searchInput.value?.blur();
      break;
  }
};

// 滚动到活动项
const scrollToActiveItem = async () => {
  await nextTick();
  if (resultsDropdown.value && activeSearchIndex.value >= 0) {
    const dropdownContent = resultsDropdown.value.querySelector('.search-results-dropdown');
    if (dropdownContent) {
      const activeItem = dropdownContent.children[activeSearchIndex.value];
      if (activeItem) {
        activeItem.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }
};

// 选择搜索项
const selectSearchItem = (item) => {
  selectedItem.value = item;
  searchQuery.value = getItemLabel(item);
  showSearchResults.value = false;

  // 发出事件
  emit("update:modelValue", getItemValue(item));
  emit("change", item);
};

// 清除选择
const clearSearchSelection = () => {
  selectedItem.value = null;
  searchQuery.value = "";
  showSearchResults.value = false;
  emit("update:modelValue", null);
  emit("change", null);
  searchInput.value?.focus();
};

// 处理创建新项
const handleCreateNew = () => {
  emit("create-new", searchQuery.value.trim());
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (props.type === "search-select") {
      if (newValue && typeof newValue === "object") {
        // 如果传入的是对象
        selectedItem.value = newValue;
        searchQuery.value = getItemLabel(newValue);
      } else if (newValue) {
        // 如果传入的是 ID 或值，需要在 searchResults 中查找
        const foundItem = props.searchResults.find(
          (item) => getItemValue(item) === newValue
        );
        if (foundItem) {
          selectedItem.value = foundItem;
          searchQuery.value = getItemLabel(foundItem);
        }
      } else if (!newValue) {
        // 清空
        selectedItem.value = null;
        searchQuery.value = "";
      }
    }
  },
  { immediate: true }
);

// 点击外部隐藏结果
const handleClickOutside = (event) => {
  if (!searchSelectWrapper.value?.contains(event.target)) {
    showSearchResults.value = false;
  }
};

onMounted(() => {
  if (props.type === "search-select") {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  clearTimeout(searchTimeout);
});
</script>

<style scoped>
.form-label {
  min-height: 1.5em;
  display: inline-block;
  line-height: 1.5;
}

.required-indicator {
  color: var(--error-600);
}

.form-error {
  color: var(--error-600);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
}

/* 搜索选择框样式 */
.search-select-wrapper {
  position: relative;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-select-input {
  width: 100%;
  padding-right: calc(var(--space-md) + 60px); /* 为清除按钮和搜索图标留空间 */
  height: var(--form-input-height); /* 使用标准表单输入框高度 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
}

.search-clear-btn {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--gray-100);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--gray-500);
  transition: all 0.2s ease;
}

.search-clear-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.search-indicator {
  position: absolute;
  right: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.search-icon {
  color: var(--gray-400);
  font-size: var(--text-sm);
}

.search-loading-spinner {
  color: var(--primary-500);
  font-size: var(--text-sm);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.search-results-container {
  z-index: 99999;
  min-width: 200px;
}

.search-results-dropdown {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
}

.search-result-item {
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-bottom: 1px solid var(--gray-100);
  transition: background-color 0.2s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.active {
  background-color: var(--primary-50);
}

.search-item-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.search-item-main {
  font-weight: 600;
  color: var(--gray-900);
}

.search-item-meta {
  font-size: var(--text-xs);
  color: var(--gray-600);
}

.search-no-results {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-md);
  text-align: center;
  color: var(--gray-500);
}

.no-results-text {
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
}

.create-item-btn {
  background: var(--primary-100);
  border: 1px solid var(--primary-300);
  color: var(--primary-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-item-btn:hover {
  background: var(--primary-200);
  border-color: var(--primary-400);
}

.search-loading {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-md);
  text-align: center;
  color: var(--gray-500);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.selected-item-display {
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-25);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
}

.selected-item-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.selected-item-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.selected-item-details {
  flex: 1;
}

.selected-item-label {
  font-weight: 600;
  color: var(--primary-700);
  margin-bottom: 2px;
}

.selected-item-meta {
  font-size: var(--text-xs);
  color: var(--primary-600);
}
</style>
