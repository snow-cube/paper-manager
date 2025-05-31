<template>
  <div class="papers-page">
    <div class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">📄 论文管理</h1>
        <p class="page-subtitle">管理您的学术研究论文</p>
      </div>
      <!-- 添加论文按钮 -->
      <div class="page-actions">
        <button
          class="btn btn-outline-purple"
          :class="{ 'is-active': showAddForm }"
          @click="showAddForm = !showAddForm"
        >
          <span class="btn-icon">{{ showAddForm ? "✕" : "+" }}</span>
          {{ showAddForm ? "收起表单" : "添加论文" }}
        </button>
      </div>
    </div>

    <!-- 添加论文表单（可收起） -->
    <div v-if="showAddForm" class="add-form-section">
      <div class="card">
        <div class="card-header">
          <h2>📝 添加新论文</h2>
        </div>
        <div class="card-body">
          <PaperForm @submitted="handlePaperSubmitted" />
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧分类树 -->
      <div class="sidebar">
        <CategoryTree
          ref="categoryTreeRef"
          @category-selected="handleCategorySelected"
        />
      </div>

      <!-- 右侧论文列表 -->
      <div class="content-area">
        <div class="content-header">
          <div class="content-title">
            <h2>{{ currentCategoryName }}</h2>
            <span class="paper-count"
              >共 {{ filteredPapers.length }} 篇论文</span
            >
          </div>
          <!-- 搜索和筛选 -->
          <div class="content-actions">
            <div class="search-box">
              <input
                v-model="searchQuery"
                class="form-input"
                placeholder="搜索论文标题、作者、关键词..."
                @input="handleSearch"
              />
              <span class="search-icon">🔍</span>
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="clear-search-btn"
                title="清空搜索"
              >
                ✕
              </button>
            </div>
            <button
              @click="refresh"
              class="btn btn-secondary refresh-btn"
              :disabled="loading"
              title="刷新列表"
            >
              <span class="btn-icon" :class="{ rotating: loading }">🔄</span>
              刷新
            </button>
          </div>
        </div>

        <div class="papers-container">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <LoadingSpinner size="large" message="正在加载论文数据..." />
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>{{ error }}</p>
            <button class="btn btn-primary" @click="refresh">
              <span class="btn-icon">🔄</span>
              重新加载
            </button>
          </div>

          <!-- 空状态 -->
          <div v-else-if="filteredPapers.length === 0" class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>{{ searchQuery ? "未找到匹配的论文" : "暂无论文" }}</h3>
            <p>
              {{
                searchQuery
                  ? "试试调整搜索关键词或选择其他分类"
                  : selectedCategoryId
                  ? "此分类下暂无论文，您可以添加新论文"
                  : "开始添加您的第一篇论文吧"
              }}
            </p>
            <button
              v-if="!showAddForm"
              class="btn btn-outline-purple"
              @click="showAddForm = true"
            >
              <span class="btn-icon">+</span>
              添加论文
            </button>
          </div>

          <!-- 论文列表 -->
          <div v-else class="papers-list">
            <PaperList
              :papers="filteredPapers"
              @paper-updated="refresh"
              @paper-deleted="refresh"
              @view-paper="handleViewPaper"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 论文详情模态框 -->
    <Modal v-if="viewingPaper" @close="closeViewPaper">
      <PaperDetail
        :paper="viewingPaper"
        @edit="handleEditPaper"
        @close="closeViewPaper"
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import PaperList from "../components/PaperList.vue";
import PaperForm from "../components/PaperForm.vue";
import CategoryTree from "../components/CategoryTree.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import Modal from "../components/Modal.vue";
import PaperDetail from "../components/PaperDetail.vue";
import { getPapers } from "../services/api";
import { useToast } from "../composables/useToast";

const papers = ref([]);
const loading = ref(true);
const error = ref(null);
const showAddForm = ref(false);
const selectedCategoryId = ref(null);
const searchQuery = ref("");
const categoryTreeRef = ref(null);
const viewingPaper = ref(null);

const { showToast } = useToast();

// 当前分类名称
const currentCategoryName = computed(() => {
  if (selectedCategoryId.value === null) {
    return "📚 全部论文";
  }

  // 递归查找分类名称
  const findCategoryName = (categories, targetId) => {
    for (const category of categories) {
      if (category.id === targetId) {
        return category.name;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryName(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const categoryName = findCategoryName(
    categoryTreeRef.value?.categoryTree || [],
    selectedCategoryId.value
  );
  return categoryName ? `📁 ${categoryName}` : "📁 已选择分类";
});

// 过滤后的论文列表
const filteredPapers = computed(() => {
  let result = papers.value;

  // 按分类筛选
  if (selectedCategoryId.value !== null) {
    result = result.filter((paper) => {
      // 支持单分类字段
      if (paper.category_id === selectedCategoryId.value) {
        return true;
      }
      // 支持多分类数组
      if (paper.categories && Array.isArray(paper.categories)) {
        return paper.categories.some(
          (cat) =>
            cat.id === selectedCategoryId.value ||
            cat === selectedCategoryId.value
        );
      }
      return false;
    });
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (paper) =>
        paper.title?.toLowerCase().includes(query) ||
        paper.authors?.toLowerCase().includes(query) ||
        paper.abstract?.toLowerCase().includes(query) ||
        paper.keywords?.toLowerCase().includes(query)
    );
  }

  return result;
});

// 处理分类选择
const handleCategorySelected = (categoryId) => {
  selectedCategoryId.value = categoryId;
  console.log("Selected category:", categoryId);
};

// 刷新论文列表 - 改进版本
const refresh = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await getPapers();
    papers.value = data || [];

    // 如果是首次加载且有数据，显示成功消息
    if (data && data.length > 0) {
      showToast(`成功加载 ${data.length} 篇论文`, "success");
    }
  } catch (err) {
    console.error("加载论文失败:", err);
    error.value = err.message || "加载论文失败，请重试";
    papers.value = [];
    showToast("加载论文数据失败，请检查网络连接", "error");
  } finally {
    loading.value = false;
  }
};

// 处理论文提交 - 添加临时加载状态
const handlePaperSubmitted = async () => {
  showAddForm.value = false;

  // 显示成功反馈
  showToast("正在更新论文列表...", "info");

  // 不显示全局loading，因为这是增量更新
  try {
    await refresh();

    // 刷新分类树（更新论文数量）
    if (categoryTreeRef.value) {
      categoryTreeRef.value.loadCategories();
    }

    showToast("论文列表更新成功", "success");
  } catch (error) {
    console.error("刷新数据失败:", error);
    showToast("更新论文列表失败，请手动刷新页面", "error");
  }
};

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
  if (searchQuery.value.trim()) {
    showToast(`找到 ${filteredPapers.value.length} 个搜索结果`, "info", 2000);
  }
};

// 清空搜索
const clearSearch = () => {
  searchQuery.value = "";
  showToast("已清空搜索条件", "info", 2000);
};

// 查看论文详情
const handleViewPaper = (paper) => {
  viewingPaper.value = paper;
};

// 关闭论文详情
const closeViewPaper = () => {
  viewingPaper.value = null;
};

// 编辑论文
const handleEditPaper = (paper) => {
  closeViewPaper();
  // 这里可以添加编辑论文的逻辑
  showToast("编辑功能将在后续版本中实现", "info");
};

onMounted(() => {
  refresh();
});
</script>

<style scoped>
.papers-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    var(--primary-50),
    var(--color-background-soft)
  );
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
}

.page-header-content {
  flex: 1;
}

.page-title {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--color-heading);
  margin: 0;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text);
  margin: 0.5rem 0 0 0;
}

.page-actions {
  flex-shrink: 0;
}

.add-form-section {
  margin-bottom: 2rem;
}

.add-form-section .card {
  box-shadow: var(--shadow);
  border: 1px solid var(--primary-100);
}

.add-form-section .card-header {
  background: linear-gradient(135deg, var(--white), var(--primary-50));
  border-bottom: 1px solid var(--primary-100);
}

.main-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
  min-height: 600px;
}

.sidebar {
  position: sticky;
  top: 2rem;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.content-area {
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.content-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.content-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.paper-count {
  font-size: 0.875rem;
  color: var(--color-primary);
  background: var(--white);
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-weight: 600;
  border: 1px solid var(--primary-200);
  box-shadow: var(--shadow-sm);
}

.content-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-box {
  position: relative;
  width: 250px;
}

.search-box .form-input {
  padding-right: 2.5rem;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
  pointer-events: none;
}

.clear-search-btn {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.papers-container {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
  min-height: 300px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--error-600);
  min-height: 300px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--error-700);
  margin: 0 0 0.5rem 0;
}

.error-state p {
  font-size: 1rem;
  color: var(--error-600);
  max-width: 400px;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-text);
  max-width: 400px;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.papers-list {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 300px 1fr;
  }

  .search-box {
    width: 200px;
  }
}

@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .sidebar {
    position: static;
    height: auto;
    min-height: auto;
    order: 2;
  }

  .content-area {
    order: 1;
  }
}

@media (max-width: 768px) {
  .papers-page {
    padding: 1rem 0.5rem;
  }

  .page-header {
    padding: 1.5rem 1rem;
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .content-title {
    justify-content: center;
    text-align: center;
  }

  .search-box {
    width: 100%;
  }

  .main-content {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .content-header {
    padding: 0.75rem;
  }

  .papers-container {
    padding: 1rem;
  }

  .content-title {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
