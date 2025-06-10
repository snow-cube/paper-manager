<template>
  <div class="paper-search-filter">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="quickSearchValue"
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          @keyup.enter="handleQuickSearch"
          @input="handleQuickSearchInput"
        />
        <button
          v-if="hasActiveFilters"
          @click="clearAllFilters"
          class="clear-all-btn"
          title="清空所有筛选条件"
        >
          ✕
        </button>
      </div>
      <!-- 快速搜索提示 -->
      <div v-if="!showAdvanced && quickSearchValue" class="quick-search-hints">
        <small class="hint-text">
          💡 提示: 输入
          <template v-if="isLiterature">
            "category:AI", "title:深度学习", "journal:Nature", "year:2024"
            等进行精确搜索
          </template>
          <template v-else>
            "category:AI", "title:深度学习", "author:xxx", "journal:Nature"
            等进行精确搜索
          </template>
        </small>
      </div>

      <button
        @click="toggleAdvancedSearch"
        class="advanced-toggle-btn"
        :class="{ active: showAdvanced }"
      >
        <span class="toggle-icon">{{ showAdvanced ? "▲" : "▼" }}</span>
        高级筛选
      </button>
    </div>
    <!-- 高级搜索面板 -->
    <div v-if="showAdvanced" class="advanced-search-panel">
      <div class="filter-grid">
        <!-- 关键词搜索 -->
        <div class="filter-group">
          <label class="filter-label">关键词</label>
          <input
            v-model="searchParams.keyword"
            type="text"
            class="filter-input"
            placeholder="搜索关键词..."
          />
        </div>
        <!-- 标题搜索 -->
        <div class="filter-group">
          <label class="filter-label">标题</label>
          <input
            v-model="searchParams.title"
            type="text"
            class="filter-input"
            :placeholder="
              isLiterature ? '搜索参考文献标题...' : '搜索论文标题...'
            "
          />
        </div>

        <!-- 作者搜索 (仅论文) -->
        <div class="filter-group" v-if="!isLiterature">
          <label class="filter-label">作者</label>
          <input
            v-model="searchParams.author_name"
            type="text"
            class="filter-input"
            placeholder="搜索作者姓名..."
          />
        </div>

        <!-- 分类筛选 -->
        <div class="filter-group">
          <label class="filter-label">分类</label>
          <select v-model="searchParams.category_id" class="filter-select">
            <option value="">所有分类</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        <!-- 期刊筛选 (论文和参考文献都支持) -->
        <div v-if="journals.length > 0" class="filter-group">
          <label class="filter-label">期刊</label>
          <select v-model="searchParams.journal_id" class="filter-select">
            <option value="">所有期刊</option>
            <option
              v-for="journal in journals"
              :key="journal.id"
              :value="journal.id"
            >
              {{ journal.name }}
            </option>
          </select>
        </div>

        <!-- 发表年份 (仅参考文献) -->
        <div v-if="isLiterature" class="filter-group">
          <label class="filter-label">发表年份</label>
          <input
            v-model="searchParams.publication_year"
            type="number"
            class="filter-input"
            placeholder="例: 2024"
            min="1900"
            :max="new Date().getFullYear()"
          />
        </div>

        <!-- 日期范围筛选 (仅论文) -->
        <div v-if="!isLiterature" class="filter-group date-range">
          <label class="filter-label">发表日期</label>
          <div class="date-inputs">
            <input
              v-model="searchParams.start_date"
              type="date"
              class="filter-input date-input"
              title="开始日期"
            />
            <span class="date-separator">至</span>
            <input
              v-model="searchParams.end_date"
              type="date"
              class="filter-input date-input"
              title="结束日期"
            />
          </div>
        </div>

        <!-- 团队筛选 (当需要团队时隐藏，因为已自动应用) -->
        <div v-if="!requireTeam && teams.length > 0" class="filter-group">
          <label class="filter-label">团队</label>
          <select v-model="searchParams.team_id" class="filter-select">
            <option value="">所有团队</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="filter-actions">
        <button @click="performSearch" class="btn btn-primary search-btn">
          <span class="btn-icon">🔍</span>
          搜索
        </button>
        <button @click="clearAllFilters" class="btn btn-outline clear-btn">
          <span class="btn-icon">🗑️</span>
          清空筛选
        </button>
      </div>
    </div>

    <!-- 当前筛选条件标签 -->
    <div v-if="activeFilterTags.length > 0" class="filter-tags">
      <span class="filter-tags-label">当前筛选：</span>
      <div class="tags-container">
        <span v-for="tag in activeFilterTags" :key="tag.key" class="filter-tag">
          {{ tag.label }}
          <button
            @click="removeFilter(tag.key)"
            class="tag-remove-btn"
            title="移除此筛选条件"
          >
            ✕
          </button>
        </span>
      </div>
    </div>

    <!-- 搜索统计 -->
    <div v-if="searchStats" class="search-stats">
      <span class="stats-text">
        {{
          searchStats.hasQuery
            ? `找到 ${searchStats.total} 个结果`
            : `共 ${searchStats.total} 条记录`
        }}
      </span>
      <span v-if="searchStats.timeMs" class="search-time">
        ({{ searchStats.timeMs }}ms)
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps({
  // 搜索类型
  paperType: {
    type: String,
    default: "papers", // 'papers' | 'literature'
  },
  // 是否需要团队
  requireTeam: {
    type: Boolean,
    default: false,
  },
  // 可用分类列表
  categories: {
    type: Array,
    default: () => [],
  },
  // 可用团队列表
  teams: {
    type: Array,
    default: () => [],
  },
  // 可用期刊列表
  journals: {
    type: Array,
    default: () => [],
  },
  // 搜索统计信息
  searchStats: {
    type: Object,
    default: null,
  },
  // 初始搜索参数
  initialParams: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["search", "clear"]);

// 响应式数据
const showAdvanced = ref(false);
const quickSearchValue = ref("");
const searchParams = ref({
  keyword: "",
  title: "",
  author_name: "",
  category_id: "",
  start_date: "",
  end_date: "",
  team_id: "",
  // 参考文献特有的搜索参数（基于 OpenAPI 规范）
  journal_id: "",
  publication_year: "",
});

// 计算属性
const isLiterature = computed(() => props.paperType === "literature");

const searchPlaceholder = computed(() => {
  if (showAdvanced.value) {
    return '快速搜索: 直接输入或使用 "字段:值" 格式';
  }
  if (isLiterature.value) {
    return "搜索文献... (支持: title:xxx, category:xxx, journal:xxx, year:xxx)";
  }
  return "搜索论文... (支持: title:xxx, author:xxx, category:xxx, journal:xxx)";
});

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return Object.values(searchParams.value).some(
    (value) => value && value.toString().trim()
  );
});

// 活跃筛选条件标签
const activeFilterTags = computed(() => {
  const tags = [];

  if (searchParams.value.keyword) {
    tags.push({
      key: "keyword",
      label: `关键词: ${searchParams.value.keyword}`,
    });
  }
  if (searchParams.value.title) {
    tags.push({
      key: "title",
      label: `标题: ${searchParams.value.title}`,
    });
  }
  // 作者搜索 - 仅论文支持 author_name 字段
  if (searchParams.value.author_name && !isLiterature.value) {
    tags.push({
      key: "author_name",
      label: `作者: ${searchParams.value.author_name}`,
    });
  }

  if (searchParams.value.category_id) {
    const category = props.categories.find(
      (c) => c.id === parseInt(searchParams.value.category_id)
    );
    if (category) {
      tags.push({
        key: "category_id",
        label: `分类: ${category.name}`,
      });
    }
  }
  // 期刊筛选 (论文和参考文献都支持)
  if (searchParams.value.journal_id) {
    const journal = props.journals.find(
      (j) => j.id === parseInt(searchParams.value.journal_id)
    );
    if (journal) {
      tags.push({
        key: "journal_id",
        label: `期刊: ${journal.name}`,
      });
    }
  }

  // 发表年份 (仅参考文献)
  if (searchParams.value.publication_year) {
    tags.push({
      key: "publication_year",
      label: `年份: ${searchParams.value.publication_year}`,
    });
  }

  if (searchParams.value.start_date || searchParams.value.end_date) {
    let dateLabel = "日期: ";
    if (searchParams.value.start_date && searchParams.value.end_date) {
      dateLabel += `${searchParams.value.start_date} 至 ${searchParams.value.end_date}`;
    } else if (searchParams.value.start_date) {
      dateLabel += `从 ${searchParams.value.start_date}`;
    } else {
      dateLabel += `到 ${searchParams.value.end_date}`;
    }
    tags.push({
      key: "date_range",
      label: dateLabel,
    });
  }

  if (searchParams.value.team_id) {
    const team = props.teams.find(
      (t) => t.id === parseInt(searchParams.value.team_id)
    );
    if (team) {
      tags.push({
        key: "team_id",
        label: `团队: ${team.name}`,
      });
    }
  }
  return tags;
});

// 解析快速搜索输入
const parseQuickSearch = (value) => {
  if (!value) return {};

  const trimmedValue = value.trim();

  // 检查是否使用了 "字段:值" 格式，支持中英文字段名
  const colonMatch = trimmedValue.match(
    /^(title|category|keyword|journal|year|author|标题|分类|关键词|期刊|年份|作者):(.+)$/
  );

  if (colonMatch) {
    const [, field, searchValue] = colonMatch;
    const cleanValue = searchValue.trim();

    switch (field) {
      case "title":
      case "标题":
        return { title: cleanValue };
      case "category":
      case "分类":
        // 查找分类ID
        const category = props.categories.find((c) =>
          c.name.toLowerCase().includes(cleanValue.toLowerCase())
        );
        return category
          ? { category_id: category.id }
          : { keyword: cleanValue };
      case "keyword":
      case "关键词":
        return { keyword: cleanValue };
      case "journal":
      case "期刊":
        // 查找期刊ID（论文和参考文献都支持）
        const journal = props.journals.find((j) =>
          j.name.toLowerCase().includes(cleanValue.toLowerCase())
        );
        return journal ? { journal_id: journal.id } : { keyword: cleanValue };
      case "year":
      case "年份":
        return { publication_year: parseInt(cleanValue) };
      case "author":
      case "作者":
        // 仅在论文模式下支持作者搜索
        return !isLiterature.value
          ? { author_name: cleanValue }
          : { keyword: cleanValue };
      default:
        return { keyword: cleanValue };
    }
  }

  // 默认作为标题搜索（而不是关键词搜索）
  return { title: trimmedValue };
};

// 更新快速搜索框的值
const updateQuickSearchValue = () => {
  const params = searchParams.value;
  if (params.title) {
    quickSearchValue.value = `title:${params.title}`;
  } else if (params.author_name && !isLiterature.value) {
    quickSearchValue.value = `author:${params.author_name}`;
  } else if (params.keyword) {
    quickSearchValue.value = params.keyword;
  } else if (params.category_id) {
    const category = props.categories.find((c) => c.id == params.category_id);
    if (category) {
      quickSearchValue.value = `category:${category.name}`;
    }
  } else if (params.journal_id) {
    const journal = props.journals.find((j) => j.id == params.journal_id);
    if (journal) {
      quickSearchValue.value = `journal:${journal.name}`;
    }
  } else if (params.publication_year && isLiterature.value) {
    quickSearchValue.value = `year:${params.publication_year}`;
  } else {
    quickSearchValue.value = "";
  }
};

// 方法
const toggleAdvancedSearch = () => {
  showAdvanced.value = !showAdvanced.value;
};

const handleQuickSearch = () => {
  const parsed = parseQuickSearch(quickSearchValue.value);
  // 清空之前的搜索参数，应用新的
  Object.keys(searchParams.value).forEach((key) => {
    searchParams.value[key] = "";
  });
  Object.assign(searchParams.value, parsed);
  performSearch();
};

const handleQuickSearchInput = () => {
  // 实时解析并预览搜索参数（可选）
  if (!showAdvanced.value) {
    const parsed = parseQuickSearch(quickSearchValue.value);
    // 这里可以添加实时预览逻辑
  }
};

const performSearch = () => {
  // 构建搜索参数对象
  const params = {};

  // 只包含非空值
  Object.entries(searchParams.value).forEach(([key, value]) => {
    if (value && value.toString().trim()) {
      params[key] = value.toString().trim();
    }
  });

  emit("search", params);
};

const clearAllFilters = () => {
  // 重置所有搜索参数
  Object.keys(searchParams.value).forEach((key) => {
    searchParams.value[key] = "";
  });

  emit("clear");
};

const removeFilter = (filterKey) => {
  if (filterKey === "date_range") {
    // 清除日期范围
    searchParams.value.start_date = "";
    searchParams.value.end_date = "";
  } else {
    // 清除单个筛选条件
    searchParams.value[filterKey] = "";
  }

  // 立即执行搜索
  performSearch();
};

// 监听搜索参数变化（关键词实时搜索）
let searchDebounceTimer = null;
watch(
  () => searchParams.value.keyword,
  () => {
    // 清除之前的定时器
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // 设置新的防抖定时器
    searchDebounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
  }
);

// 监听其他筛选条件变化
watch(
  [
    () => searchParams.value.category_id,
    () => searchParams.value.team_id,
    () => searchParams.value.title,
    () => searchParams.value.author_name,
    () => searchParams.value.start_date,
    () => searchParams.value.end_date,
    () => searchParams.value.journal_id,
    () => searchParams.value.publication_year,
  ],
  () => {
    if (showAdvanced.value) {
      performSearch();
    }
  },
  { deep: true }
);

// 初始化
onMounted(() => {
  // 设置初始参数
  if (props.initialParams) {
    Object.assign(searchParams.value, props.initialParams);
  }
});

// 暴露方法给父组件
defineExpose({
  getSearchParams: () => searchParams.value,
  clearFilters: clearAllFilters,
  setParams: (params) => {
    Object.assign(searchParams.value, params);
  },
});
</script>

<style scoped>
.paper-search-filter {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  margin-bottom: var(--space-md);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--white);
  border: 2px solid var(--primary-200);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  height: 40px;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.search-icon {
  padding: var(--space-sm) var(--space-md);
  color: var(--primary-500);
  font-size: 1.1em;
  background: var(--primary-50);
}

.search-input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border: none;
  font-size: var(--text-sm);
  background: transparent;
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-soft);
  font-style: italic;
}

.clear-all-btn {
  padding: var(--space-xs);
  background: var(--danger-100);
  border: none;
  color: var(--danger-600);
  cursor: pointer;
  border-radius: 50%;
  transition: all var(--transition-normal);
  margin-right: var(--space-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-all-btn:hover {
  background: var(--danger-200);
  transform: scale(1.1);
}

.advanced-toggle-btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-50);
  border: 2px solid var(--primary-200);
  color: var(--primary-700);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-weight: 500;
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: 40px;
}

.advanced-toggle-btn:hover {
  background: var(--primary-100);
  border-color: var(--primary-300);
}

.advanced-toggle-btn.active {
  background: var(--primary-500);
  border-color: var(--primary-500);
  color: var(--white);
}

.toggle-icon {
  font-size: 0.8em;
  transition: transform var(--transition-normal);
}

/* 高级搜索面板 */
.advanced-search-panel {
  background: linear-gradient(145deg, var(--primary-25), var(--white));
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  border: 1px solid var(--primary-100);
  margin-bottom: var(--space-md);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.filter-group.date-range {
  grid-column: span 2;
}

.filter-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--text-xs);
}

.filter-input,
.filter-select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  background: var(--white);
  transition: all var(--transition-normal);
  height: 38px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.date-input {
  flex: 1;
}

.date-separator {
  color: var(--color-text-soft);
  font-weight: 500;
}

/* 操作按钮 */
.filter-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: all var(--transition-normal);
  border: none;
  height: 38px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-outline {
  background: var(--white);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-outline:hover {
  background: var(--color-bg-soft);
  border-color: var(--primary-300);
  color: var(--color-text);
}

.btn-icon {
  font-size: 1em;
}

/* 筛选条件标签 */
.filter-tags {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.filter-tags-label {
  font-weight: 600;
  color: var(--color-text-soft);
  font-size: var(--text-sm);
}

.tags-container {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.filter-tag {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.tag-remove-btn {
  background: var(--primary-200);
  border: none;
  color: var(--primary-600);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all var(--transition-normal);
}

.tag-remove-btn:hover {
  background: var(--danger-200);
  color: var(--danger-600);
}

/* 搜索统计 */
.search-stats {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--primary-600);
  background: var(--primary-50);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
}

.stats-text {
  font-weight: 500;
}

.search-time {
  color: var(--color-text-soft);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-group.date-range {
    grid-column: span 1;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .filter-tags {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
