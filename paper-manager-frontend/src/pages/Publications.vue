<template>
  <div class="publications-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">
          <span class="page-icon">🎓</span>
          发表论文管理
        </h1>
        <p class="page-description">管理您发表和投稿的学术论文</p>
      </div>

      <div class="content-layout">
        <!-- 左侧分类树 -->
        <div class="sidebar">
          <div class="sidebar-header">
            <h3>研究分类</h3>
          </div>
          <CategoryTree
            :selectedCategoryId="selectedCategoryId"
            @select="handleCategorySelect"
            :paperType="'published'"
          />
        </div>

        <!-- 右侧论文列表 -->
        <div class="main-content">
          <div class="content-header">
            <div class="search-bar">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索发表论文标题、期刊、关键词..."
                class="search-input"
                @input="handleSearch"
              />
              <span class="search-icon">🔍</span>
            </div>
            <button @click="showAddForm = true" class="btn btn-outline-purple">
              <span class="btn-icon">➕</span>
              发表论文
            </button>
          </div>

          <div class="papers-container">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>加载发表论文中...</p>
            </div>

            <div v-else-if="filteredPapers.length === 0" class="empty-state">
              <div class="empty-icon">🎓</div>
              <h3>暂无发表论文</h3>
              <p>
                {{
                  searchQuery
                    ? "没有找到匹配的论文"
                    : "开始记录您的第一篇发表论文"
                }}
              </p>
              <button
                v-if="!searchQuery"
                @click="showAddForm = true"
                class="btn btn-outline-purple"
              >
                发表论文
              </button>
            </div>

            <div v-else class="papers-grid">
              <PublishedPaperCard
                v-for="paper in filteredPapers"
                :key="paper.id"
                :paper="paper"
                @edit="handleEdit"
                @delete="handleDelete"
                @view="handleView"
              />
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="['page-btn', { active: currentPage === page }]"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑表单模态框 -->
    <Modal v-if="showAddForm || editingPaper" @close="closeForm">
      <PaperForm
        :paper="editingPaper"
        :paperType="'published'"
        @saved="handlePaperSaved"
        @cancel="closeForm"
      />
    </Modal>
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
import { getPapersByType, deletePaper } from "../services/api";
import CategoryTree from "../components/CategoryTree.vue";
import PublishedPaperCard from "../components/PublishedPaperCard.vue";
import PaperForm from "../components/PaperForm.vue";
import PaperDetail from "../components/PaperDetail.vue";
import Modal from "../components/Modal.vue";
import { useToast } from "../composables/useToast";

const { showToast } = useToast();

// 响应式数据
const papers = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedCategoryId = ref(null);
const showAddForm = ref(false);
const editingPaper = ref(null);
const viewingPaper = ref(null);
const currentPage = ref(1);
const itemsPerPage = 12;

// 计算属性
const filteredPapers = computed(() => {
  let filtered = papers.value;

  // 分类筛选
  if (selectedCategoryId.value) {
    filtered = filtered.filter(
      (paper) => paper.category_id === selectedCategoryId.value
    );
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        paper.authors.toLowerCase().includes(query) ||
        paper.keywords.toLowerCase().includes(query) ||
        paper.abstract.toLowerCase().includes(query) ||
        (paper.journal && paper.journal.toLowerCase().includes(query))
    );
  }

  // 分页
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  let filtered = papers.value;

  if (selectedCategoryId.value) {
    filtered = filtered.filter(
      (paper) => paper.category_id === selectedCategoryId.value
    );
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        paper.authors.toLowerCase().includes(query) ||
        paper.keywords.toLowerCase().includes(query) ||
        paper.abstract.toLowerCase().includes(query) ||
        (paper.journal && paper.journal.toLowerCase().includes(query))
    );
  }

  return Math.ceil(filtered.length / itemsPerPage);
});

// 方法
const loadPapers = async () => {
  loading.value = true;
  try {
    papers.value = await getPapersByType("published");
  } catch (error) {
    console.error("Failed to load publications:", error);
    showToast("加载发表论文失败", "error");
  } finally {
    loading.value = false;
  }
};

const handleCategorySelect = (categoryId) => {
  selectedCategoryId.value = categoryId;
  currentPage.value = 1;
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleEdit = (paper) => {
  editingPaper.value = paper;
  showAddForm.value = false;
};

const handleDelete = async (paper) => {
  if (confirm(`确定要删除发表论文"${paper.title}"吗？`)) {
    try {
      await deletePaper(paper.id);
      await loadPapers();
      showToast("论文删除成功", "success");
    } catch (error) {
      console.error("Failed to delete paper:", error);
      showToast("删除论文失败", "error");
    }
  }
};

const handleView = (paper) => {
  viewingPaper.value = paper;
};

// 关闭论文详情
const closeViewPaper = () => {
  viewingPaper.value = null;
};

// 编辑论文
const handleEditPaper = (paper) => {
  closeViewPaper();
  editingPaper.value = paper;
  showAddForm.value = true;
};

const handlePaperSaved = () => {
  closeForm();
  loadPapers();
  showToast(editingPaper.value ? "论文更新成功" : "论文添加成功", "success");
};

const closeForm = () => {
  showAddForm.value = false;
  editingPaper.value = null;
};

// 监听器
watch([selectedCategoryId, searchQuery], () => {
  currentPage.value = 1;
});

// 生命周期
onMounted(() => {
  loadPapers();
});
</script>

<style scoped>
.publications-page {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.page-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--white);
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.page-icon {
  font-size: 2rem;
}

.page-description {
  color: var(--color-text-soft);
  font-size: 1.1rem;
  margin: 0;
}

.content-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
}

.sidebar {
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 200px);
}

.sidebar-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.main-content {
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.content-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 91, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-soft);
}

.papers-container {
  min-height: 400px;
  padding: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-text-soft);
  margin: 0 0 2rem 0;
}

.papers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--white);
  color: var(--color-text);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.page-btn.active {
  background: var(--color-primary);
  color: var(--white);
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sidebar {
    position: static;
    max-height: none;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar {
    max-width: none;
  }

  .papers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
