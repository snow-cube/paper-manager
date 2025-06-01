<template>
  <div class="literature-page">
    <div class="container">      <div class="page-header">
        <h1 class="page-title">
          <span class="page-icon">📚</span>
          文献管理
        </h1>
        <p class="page-description">
          {{ currentTeam ? `管理 "${currentTeam.name}" 团队的学术文献` : '请先选择一个团队' }}
        </p>
      </div>

      <div v-if="!currentTeam" class="no-team-warning">
        <div class="warning-icon">⚠️</div>
        <h3>请先选择团队</h3>
        <p>您需要先选择一个团队才能管理参考文献。团队中的所有文献将对团队成员共享。</p>
        <RouterLink to="/teams" class="btn btn-primary">
          转到团队管理
        </RouterLink>
      </div>

      <div v-else class="content-layout">
        <!-- 左侧分类树 -->
        <div class="sidebar">
          <div class="sidebar-header">
            <h3>研究分类</h3>
          </div>
          <CategoryTree
            :selectedCategoryId="selectedCategoryId"
            @select="handleCategorySelect"
            :paperType="'literature'"
          />
        </div>

        <!-- 右侧论文列表 -->
        <div class="main-content">
          <div class="content-header">
            <div class="search-bar">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文献标题、作者、关键词..."
                class="search-input"
                @input="handleSearch"
              />
              <span class="search-icon">🔍</span>
            </div>
            <button @click="showAddForm = true" class="btn btn-outline-purple">
              <span class="btn-icon">➕</span>
              添加文献
            </button>
          </div>

          <div class="papers-container">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>加载文献中...</p>
            </div>

            <div v-else-if="filteredPapers.length === 0" class="empty-state">
              <div class="empty-icon">📖</div>
              <h3>暂无文献</h3>
              <p>
                {{
                  searchQuery ? "没有找到匹配的文献" : "开始添加您的第一篇文献"
                }}
              </p>
              <button
                v-if="!searchQuery"
                @click="showAddForm = true"
                class="btn btn-outline-purple"
              >
                添加文献
              </button>
            </div>

            <div v-else class="papers-grid">
              <PaperCard
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
        :paperType="'literature'"
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
import { getReferences, deleteReference } from "../services/api";
import CategoryTree from "../components/CategoryTree.vue";
import PaperCard from "../components/PaperCard.vue";
import PaperForm from "../components/PaperForm.vue";
import PaperDetail from "../components/PaperDetail.vue";
import Modal from "../components/Modal.vue";
import { useToast } from "../composables/useToast";
import { useTeam } from "../composables/useTeam";
import { RouterLink } from "vue-router";

const { showToast } = useToast();
const { currentTeam } = useTeam();

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

// 辅助函数：处理作者数据
const getAuthorsText = (authors) => {
  if (!authors) return '';
  if (typeof authors === 'string') return authors;
  if (Array.isArray(authors)) {
    return authors.map(author => typeof author === 'string' ? author : author.name).join(', ');
  }
  return '';
};

// 辅助函数：处理关键词数据
const getKeywordsText = (keywords) => {
  if (!keywords) return '';
  if (typeof keywords === 'string') return keywords;
  if (Array.isArray(keywords)) {
    return keywords.map(keyword => typeof keyword === 'string' ? keyword : keyword.name).join(', ');
  }
  return '';
};

// 计算属性
const filteredPapers = computed(() => {
  // 如果没有选择团队，则不显示任何文献
  if (!currentTeam.value) return [];

  let filtered = papers.value.filter(paper =>
    paper.team_id === currentTeam.value.id
  );

  // 分类筛选
  if (selectedCategoryId.value) {
    filtered = filtered.filter(paper => {
      if (Array.isArray(paper.categories)) {
        return paper.categories.some(cat => cat.id === selectedCategoryId.value);
      }
      return paper.category_id === selectedCategoryId.value;
    });
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        getAuthorsText(paper.authors).toLowerCase().includes(query) ||
        getKeywordsText(paper.keywords).toLowerCase().includes(query) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(query))
    );
  }

  // 分页
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  // 如果没有选择团队，则不显示任何文献
  if (!currentTeam.value) return 0;

  // 由于使用getReferences API，返回的都是该团队的文献，无需过滤paper_type
  let filtered = papers.value.filter(paper =>
    paper.team_id === currentTeam.value.id
  );

  // 分类筛选
  if (selectedCategoryId.value) {
    filtered = filtered.filter(paper => {
      if (Array.isArray(paper.categories)) {
        return paper.categories.some(cat => cat.id === selectedCategoryId.value);
      }
      return paper.category_id === selectedCategoryId.value;
    });
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        getAuthorsText(paper.authors).toLowerCase().includes(query) ||
        getKeywordsText(paper.keywords).toLowerCase().includes(query) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(query))
    );
  }

  return Math.ceil(filtered.length / itemsPerPage);
});

// 方法
const loadPapers = async () => {
  if (!currentTeam.value) {
    papers.value = [];
    return;
  }

  loading.value = true;
  try {
    // 使用参考文献API获取数据，传递团队ID
    papers.value = await getReferences(currentTeam.value.id);
  } catch (error) {
    console.error("Failed to load papers:", error);
    showToast("加载文献失败", "error");
  } finally {
    loading.value = false;
  }
};

// 获取论文数据
const fetchPapers = async () => {
  if (!currentTeam.value) return; // 如果没有选择团队，不加载数据

  try {
    loading.value = true;
    const response = await getReferences(currentTeam.value.id);
    papers.value = response;
  } catch (error) {
    console.error("获取论文失败:", error);
    showToast("获取论文失败", "error");
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
  if (confirm(`确定要删除文献"${paper.title}"吗？`)) {
    try {
      await deleteReference(paper.id);
      await loadPapers();
      showToast("文献删除成功", "success");
    } catch (error) {
      console.error("Failed to delete paper:", error);
      showToast("删除文献失败", "error");
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

const handlePaperSaved = (savedPaper) => {
  // 为保存的论文添加当前团队ID
  if (currentTeam.value) {
    savedPaper.team_id = currentTeam.value.id;
  }

  closeForm();
  loadPapers();
  showToast(editingPaper.value ? "文献更新成功" : "文献添加成功", "success");
};

const closeForm = () => {
  showAddForm.value = false;
  editingPaper.value = null;
};

// 监听器
watch([selectedCategoryId, searchQuery], () => {
  currentPage.value = 1;
});

// 监听当前团队变化，重新加载数据
watch(() => currentTeam.value, () => {
  fetchPapers();
  currentPage.value = 1;
  selectedCategoryId.value = null;
});

// 生命周期
onMounted(() => {
  loadPapers();
});
</script>

<style scoped>
.literature-page {
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
  border: 1px solid var(--primary-200);
  background: var(--white);
  color: var(--primary-700);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.page-btn:hover {
  background: var(--primary-50);
  color: var(--primary-800);
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
  transform: translateY(-2px);
}

.page-btn.active {
  background: var(--primary-600);
  color: var(--white);
  border-color: var(--primary-600);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}

.no-team-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: var(--color-background-soft);
  border-radius: var(--border-radius-lg);
  text-align: center;
  margin: 2rem 0;
  border: 1px dashed var(--color-border);
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--color-warning);
}

.no-team-warning h3 {
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.no-team-warning p {
  max-width: 500px;
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
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
