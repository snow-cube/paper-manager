<template>
  <div class="paper-manager">
    <!-- 主内容区域 -->
    <div v-if="!config.requireTeam || currentTeam" class="content-layout">
      <!-- 左侧分类树 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>分类</h3>
        </div>
        <CategoryTree
          :paperType="config.paperType"
          :categoryType="
            config.categoryType ||
            (config.paperType === 'literature' ? 'references' : 'papers')
          "
          :teamId="config.requireTeam ? currentTeam?.id : null"
          :selectedCategoryId="selectedCategoryId"
          @select="handleCategorySelect"
        />
      </div>
      <!-- 右侧内容 -->
      <div class="main-content">
        <!-- 搜索和筛选区域 -->
        <div class="search-filter-section">
          <PaperSearchFilter
            :paper-type="config.paperType"
            :require-team="config.requireTeam || false"
            :categories="categories"
            :teams="teams"
            :journals="journals"
            :search-stats="searchStats"
            @search="handleSearch"
            @clear="clearSearch"
            ref="searchFilterRef"
          />
        </div>
        <!-- 内容头部 -->
        <div class="content-header">
          <div class="header-left">
            <!-- 分类路径显示 -->
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
                    class="breadcrumb-arrow"
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
          </div>
          <div class="header-right">
            <div class="papers-count">
              共 {{ totalItems }} 篇{{
                config.paperType === "literature" ? "文献" : "论文"
              }}
            </div>
            <button @click="$emit('add-new')" class="btn btn-primary add-btn">
              <span class="btn-icon">✨</span>
              {{ config.addButtonText }}
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="papers-container">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载数据...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>{{ error }}</p>
            <button @click="loadPapers" class="btn btn-primary">
              重新加载
            </button>
          </div>
          <!-- 空状态 -->
          <div v-else-if="filteredPapers.length === 0" class="empty-state">
            <div class="empty-icon">{{ config.emptyIcon }}</div>
            <h3>
              {{
                searchParams.keyword ||
                Object.keys(searchParams).some((key) => searchParams[key])
                  ? "未找到匹配的结果"
                  : config.emptyTitle
              }}
            </h3>
            <p>
              {{
                searchParams.keyword ||
                Object.keys(searchParams).some((key) => searchParams[key])
                  ? "试试调整搜索关键词或选择其他分类"
                  : config.emptyDescription
              }}
            </p>
            <button
              v-if="
                !searchParams.keyword &&
                !Object.keys(searchParams).some((key) => searchParams[key])
              "
              @click="$emit('add-new')"
              class="btn btn-outline-purple"
            >
              <span class="btn-icon">+</span>
              {{ config.addButtonText }}
            </button>
          </div>
          <!-- 论文列表 -->
          <div v-else class="papers-grid">
            <PaperCard
              v-for="paper in filteredPapers"
              :key="paper.id"
              :paper="paper"
              :paper-type="config.paperType"
              @edit="$emit('edit', paper)"
              @delete="handleDeleteWithConfirm"
              @view="$emit('view', paper)"
            />
          </div>
        </div>
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            :class="['page-btn', 'nav-btn']"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            ←
          </button>

          <template v-if="totalPages <= 7">
            <button
              v-for="page in totalPages"
              :key="page"
              :class="['page-btn', { active: currentPage === page }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </template>

          <template v-else>
            <button
              v-if="currentPage > 3"
              :class="['page-btn']"
              @click="changePage(1)"
            >
              1
            </button>
            <span v-if="currentPage > 4" class="page-ellipsis">...</span>

            <button
              v-for="page in getVisiblePages()"
              :key="page"
              :class="['page-btn', { active: currentPage === page }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>

            <span v-if="currentPage < totalPages - 3" class="page-ellipsis"
              >...</span
            >
            <button
              v-if="currentPage < totalPages - 2"
              :class="['page-btn']"
              @click="changePage(totalPages)"
            >
              {{ totalPages }}
            </button>
          </template>

          <button
            :class="['page-btn', 'nav-btn']"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            →
          </button>
        </div>

        <!-- 分页信息 -->
        <div v-if="totalPages > 0" class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页，总计
          {{ totalItems }} 条记录
        </div>
      </div>
    </div>

    <!-- 确认删除对话框 -->
    <ConfirmDialog
      :visible="dialogState.visible"
      :title="dialogState.title"
      :message="dialogState.message"
      :confirmText="dialogState.confirmText"
      :cancelText="dialogState.cancelText"
      :loading="dialogState.loading"
      @confirm="confirmDialog"
      @cancel="cancelDialog"
      @close="cancelDialog"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, watch, ref } from "vue";
import { RouterLink } from "vue-router";
import { CategoryTree } from "../category";
import { PaperCard, PaperSearchFilter } from ".";
import { ConfirmDialog } from "../../base";
import { usePapersAdvanced } from "../../../composables/usePapersAdvanced";
import { useTeam } from "../../../composables/useTeam";
import { useCategories } from "../../../composables/useCategories";
import { useCategoryFiltering } from "../../../composables/useCategoryFiltering";
import { useCategoryEvents } from "../../../composables/useCategoryEvents";
import { usePaperEvents } from "../../../composables/usePaperEvents";
import { useJournals } from "../../../composables/useJournals";
import { useConfirmDialog } from "../../../composables/useConfirmDialog";

const props = defineProps({
  config: {
    type: Object,
    required: true,
    validator: (config) => {
      const required = ["title", "icon", "paperType"];
      return required.every((key) => key in config);
    },
  },
});

const emit = defineEmits(["add-new", "edit", "view"]);

const { currentTeam, teams } = useTeam();

// Get categories for the search filter
const { categories, loadCategories, refreshCategories } = useCategories();

// 监听分类更新事件
const { onCategoryUpdate } = useCategoryEvents();

// 监听论文更新事件
const { onPaperUpdate } = usePaperEvents();

// Enhanced category filtering with server-side support
const {
  categoryTree: enhancedCategoryTree,
  selectedCategory: enhancedSelectedCategory,
  selectCategory: handleEnhancedCategorySelect,
  getFilteredItems,
  loading: categoryLoading,
} = useCategoryFiltering({
  categoryType: computed(
    () =>
      props.config.categoryType ||
      (props.config.paperType === "literature" ? "references" : "papers")
  ),
  paperType: computed(() => props.config.paperType),
  teamId: computed(() =>
    props.config.requireTeam ? currentTeam.value?.id : null
  ),
});

// Get journals for the search filter (needed for literature search)
const { journals, fetchJournals } = useJournals();

// Function to load journals based on team requirements
const loadJournalsForSearch = async () => {
  try {
    if (props.config.requireTeam && currentTeam.value?.id) {
      // For team-based searches, we might want to filter journals by team
      // However, based on the API, journals don't seem to be team-specific
      // So we load all journals regardless
      await fetchJournals();
    } else if (!props.config.requireTeam) {
      // Load all journals for non-team searches
      await fetchJournals();
    }
  } catch (error) {
    console.error("Failed to load journals:", error);
  }
};

// Load categories when component mounts or when relevant props change
const categoryType = computed(
  () =>
    props.config.categoryType ||
    (props.config.paperType === "literature" ? "references" : "papers")
);

const teamId = computed(() =>
  props.config.requireTeam ? currentTeam.value?.id : null
);

// Load categories when needed
watch(
  [categoryType, teamId],
  () => {
    loadCategories(categoryType.value, teamId.value);
  },
  { immediate: true }
);

// 监听分类更新事件，自动刷新分类数据
onCategoryUpdate(async () => {
  await refreshCategories(categoryType.value, teamId.value);
});

// 监听论文更新事件，自动刷新论文数据
onPaperUpdate(async () => {
  await loadPapers();
});

// Load journals when needed (especially for literature search)
watch(
  [teamId],
  () => {
    loadJournalsForSearch();
  },
  { immediate: true }
);

// 使用高级的论文管理逻辑
const {
  papers,
  loading,
  error,
  searchParams,
  selectedCategoryId,
  currentPage,
  totalItems,
  totalPages,
  filteredPapers,
  searchStats,
  loadPapers,
  handleDelete,
  handleCategorySelect: handlePapersAdvancedCategorySelect,
  handleSearch,
  clearSearch,
  changePage,
} = usePapersAdvanced({
  type: props.config.type || "papers",
  requireTeam: computed(() => props.config.requireTeam || false),
  loadData: props.config.loadData,
  deleteData: props.config.deleteData,
});

// Reference to the search filter component
const searchFilterRef = ref(null);

// 确认删除对话框
const { dialogState, confirmDialog, cancelDialog, confirmDelete } =
  useConfirmDialog();

// 包装删除函数以使用确认对话框
const handleDeleteWithConfirm = async (paper) => {
  await handleDelete(paper, confirmDelete);
};

// Handle category selection - integrate both old and new systems
const handleCategorySelect = (categoryId) => {
  // Update the enhanced category filtering
  handleEnhancedCategorySelect(categoryId);

  // Update the papers advanced filtering
  handlePapersAdvancedCategorySelect(categoryId);
};

// Get selected category for display - use enhanced category info when available
const selectedCategory = computed(() => {
  // Prefer enhanced category info as it has better server-side support
  if (enhancedSelectedCategory.value) {
    return enhancedSelectedCategory.value;
  }

  // Fallback to original logic
  if (!selectedCategoryId.value || !categories.value) return null;
  return categories.value.find((cat) => cat.id === selectedCategoryId.value);
});

// 构建分类映射用于查找父分类
const categoryMap = computed(() => {
  const map = new Map();
  if (categories.value) {
    const addToMap = (cats) => {
      cats.forEach((category) => {
        map.set(category.id, category);
        if (category.children && category.children.length > 0) {
          addToMap(category.children);
        }
      });
    };
    addToMap(categories.value);
  }
  return map;
});

// 计算分类路径（面包屑导航）
const categoryPath = computed(() => {
  if (!selectedCategory.value) return [];

  // 如果使用增强的分类选择，且有完整的路径信息
  if (enhancedSelectedCategory.value && enhancedSelectedCategory.value.path) {
    return enhancedSelectedCategory.value.path.map((pathItem) => ({
      id: pathItem.id,
      name: pathItem.name || pathItem.category_name,
    }));
  }

  // 构建从根到当前分类的路径
  const path = [];
  let current = selectedCategory.value;

  while (current) {
    path.unshift({
      id: current.id,
      name: current.name || current.category_name,
    });

    // 查找父分类
    if (current.parent_id) {
      current = categoryMap.value.get(current.parent_id);
    } else {
      current = null;
    }
  }

  return path;
});

// 动态描述
const description = computed(() => {
  if (props.config.requireTeam && currentTeam.value) {
    return props.config.description.replace(
      "{teamName}",
      currentTeam.value.name
    );
  }
  return props.config.description;
});

// 获取可见的页码范围（用于复杂分页显示）
const getVisiblePages = () => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
};

// 生命周期
onMounted(() => {
  loadPapers();

  // Load journals for search functionality
  loadJournalsForSearch();
});

// 暴露给父组件的方法
defineExpose({
  loadPapers,
  papers,
  loading,
});
</script>

<style scoped>
.paper-manager {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.content-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: var(--space-md);
  align-items: start;
}

.sidebar {
  background: linear-gradient(145deg, var(--white), var(--primary-25));
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  position: sticky;
  top: var(--space-md);
  max-height: calc(100vh - 160px);
  border: 1px solid var(--primary-100);
  backdrop-filter: blur(10px);
}

.sidebar-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--primary-200);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  text-align: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.sidebar-header h3::before {
  content: "🏷️";
  font-size: 1.2em;
}

.main-content {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--primary-100);
  backdrop-filter: blur(10px);
}

.search-filter-section {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--primary-100);
  background: linear-gradient(135deg, var(--white), var(--primary-25));
}

.selected-category {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--primary-100);
  color: var(--primary-700);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  border: 1px solid var(--primary-200);
}

.selected-category::before {
  content: "📁";
  font-size: 1.1em;
}

/* 面包屑导航样式 */
.category-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.breadcrumb-text {
  color: var(--primary-700);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: color var(--transition-normal);
}

.breadcrumb-text:hover {
  color: var(--primary-800);
}

.breadcrumb-arrow {
  display: flex;
  align-items: center;
  color: var(--primary-500);
  opacity: 0.7;
  transition: opacity var(--transition-normal);
}

.breadcrumb-arrow:hover {
  opacity: 1;
}

.breadcrumb-arrow svg {
  fill: none;
  stroke: currentColor;
}

.content-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--primary-100);
  background: linear-gradient(135deg, var(--white), var(--primary-25));
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
  min-width: 300px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--white);
  border: 2px solid var(--primary-200);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.search-icon {
  padding: var(--space-md);
  color: var(--primary-500);
  font-size: 1.1em;
  background: var(--primary-50);
}

.search-input {
  flex: 1;
  padding: var(--space-md);
  border: none;
  font-size: var(--text-base);
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

.clear-search-btn {
  padding: var(--space-sm);
  background: var(--danger-100);
  border: none;
  color: var(--danger-600);
  cursor: pointer;
  border-radius: 50%;
  transition: all var(--transition-normal);
  margin-right: var(--space-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  background: var(--danger-200);
  transform: scale(1.1);
}

.search-stats {
  font-size: var(--text-sm);
  color: var(--primary-600);
  font-weight: 500;
  background: var(--primary-50);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius);
  display: inline-block;
}

.papers-count {
  font-size: var(--text-sm);
  color: var(--color-text-soft);
  background: var(--primary-50);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-weight: 500;
  border: 1px solid var(--primary-200);
}

.add-btn {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--border-radius-xl);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-bounce);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-base);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
}

.add-btn .btn-icon {
  font-size: 1.1em;
}

.papers-container {
  min-height: 500px;
  padding: var(--space-lg);
  background: linear-gradient(145deg, var(--white), var(--primary-25));
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem var(--space-xl);
  text-align: center;
  background: linear-gradient(145deg, var(--white), var(--primary-25));
  border-radius: var(--border-radius-xl);
  margin: var(--space-lg);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--primary-200);
  border-top: 4px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

.loading-state p {
  color: var(--primary-600);
  font-weight: 500;
  font-size: var(--text-lg);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state,
.empty-state {
  text-align: center;
  padding: 6rem var(--space-2xl);
  background: linear-gradient(145deg, var(--white), var(--gray-50));
  border-radius: var(--border-radius-xl);
  margin: var(--space-lg);
  border: 2px dashed var(--gray-300);
}

.error-icon,
.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--space-lg);
  display: block;
}

.error-state h3,
.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-xl);
  font-weight: 700;
}

.error-state p,
.empty-state p {
  color: var(--color-text-soft);
  margin: 0 0 var(--space-2xl) 0;
  font-size: var(--text-lg);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.papers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--primary-200);
  background: linear-gradient(135deg, var(--white), var(--primary-25));
}

.page-btn {
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--primary-300);
  background: var(--white);
  color: var(--primary-600);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-bounce);
  font-weight: 600;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: var(--primary-100);
  color: var(--primary-700);
  border-color: var(--primary-400);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.page-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  border-color: var(--primary-600);
  box-shadow: var(--shadow-lg);
}

.page-btn.nav-btn {
  font-size: var(--text-lg);
  font-weight: 700;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-100);
  color: var(--gray-400);
  border-color: var(--gray-300);
  transform: none;
}

.page-btn:disabled:hover {
  background: var(--gray-100);
  color: var(--gray-400);
  border-color: var(--gray-300);
  transform: none;
  box-shadow: none;
}

.page-ellipsis {
  padding: var(--space-sm);
  color: var(--gray-500);
  font-weight: 600;
}

.pagination-info {
  text-align: center;
  padding: var(--space-md);
  color: var(--gray-600);
  font-size: var(--text-sm);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
  margin-top: var(--space-md);
}

@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .sidebar {
    position: static;
    max-height: none;
    order: 2;
  }

  .main-content {
    order: 1;
  }
  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar {
    max-width: none;
  }
  .papers-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-md);
    padding: var(--space-xs);
  }

  .papers-container {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .papers-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
    padding: 0;
  }

  .content-header {
    padding: var(--space-sm);
  }

  .papers-container {
    padding: var(--space-sm);
  }
}
</style>
