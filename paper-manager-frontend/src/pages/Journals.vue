<template>  <StandardPageLayout
    title="期刊管理"
    icon="📚"
    description="管理学术期刊信息，支持搜索和分类浏览"
  >
    <!-- 搜索和筛选区域 -->
    <div class="filters-section">
      <div class="filter-row">
        <!-- 搜索框 -->
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索期刊名称..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- 筛选下拉框 -->
        <select
          v-model="selectedGrade"
          @change="handleFilterChange"
          class="filter-select"
        >
          <option value="">所有等级</option>
          <option
            v-for="grade in journalGrades"
            :key="grade.value"
            :value="grade.value"
          >
            {{ grade.label }}
          </option>
        </select>

        <!-- 添加按钮 -->
        <button
          v-if="isAdmin"
          @click="showCreateModal = true"
          class="btn btn-primary add-journal-btn"
        >
          <span class="btn-icon">➕</span>
          添加期刊
        </button>
      </div>

      <!-- 结果信息 -->
      <div class="results-info">共找到 {{ totalJournals }} 个期刊</div>
    </div>

    <!-- 期刊列表 -->
    <div class="journals-grid" v-if="!loading && journals.length > 0">
      <div
        v-for="journal in journals"
        :key="journal.id"
        class="journal-card"
        @click="viewJournal(journal)"
      >
        <div class="journal-header">
          <h3 class="journal-name">{{ journal.name }}</h3>
          <div
            class="journal-grade"
            :class="`grade-${journal.grade.toLowerCase()}`"
          >
            {{ getGradeLabel(journal.grade) }}
          </div>
        </div>

        <div v-if="journal.description" class="journal-description">
          {{ journal.description }}
        </div>

        <div class="journal-meta">
          <span class="meta-item">
            <span class="meta-icon">📅</span>
            创建于 {{ formatDate(journal.created_at) }}
          </span>
          <span
            v-if="journal.updated_at !== journal.created_at"
            class="meta-item"
          >
            <span class="meta-icon">🔄</span>
            更新于 {{ formatDate(journal.updated_at) }}
          </span>
        </div>

        <div v-if="isAdmin" class="journal-actions" @click.stop>
          <button
            @click="editJournal(journal)"
            class="action-btn edit-btn"
            title="编辑期刊"
          >
            ✏️
          </button>
          <button
            @click="confirmDeleteJournal(journal)"
            class="action-btn delete-btn"
            title="删除期刊"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && journals.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3 class="empty-title">
        {{ searchQuery ? "未找到匹配的期刊" : "暂无期刊" }}
      </h3>
      <p class="empty-description">
        {{ searchQuery ? "请尝试其他关键词" : "还没有任何期刊信息" }}
      </p>
      <button
        v-if="isAdmin && !searchQuery"
        @click="showCreateModal = true"
        class="btn btn-primary"
      >
        <span class="btn-icon">➕</span>
        添加第一个期刊
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <LoadingSpinner size="large" />
      <p>正在加载期刊列表...</p>
    </div>

    <!-- 分页 -->
    <div v-if="paginationInfo.totalPages > 1" class="pagination">
      <button
        @click="goToPage(paginationInfo.current - 1)"
        :disabled="paginationInfo.current <= 1"
        class="pagination-btn"
      >
        ‹ 上一页
      </button>

      <div class="pagination-info">
        第 {{ paginationInfo.current }} 页，共
        {{ paginationInfo.totalPages }} 页
      </div>

      <button
        @click="goToPage(paginationInfo.current + 1)"
        :disabled="paginationInfo.current >= paginationInfo.totalPages"
        class="pagination-btn"
      >
        下一页 ›
      </button>
    </div>

    <!-- 创建/编辑期刊模态框 -->
    <Modal
      v-if="showCreateModal || editingJournal"
      @close="closeModal"
      :title="editingJournal ? '编辑期刊' : '创建期刊'"
      size="medium"
    >
      <JournalForm
        :journal="editingJournal"
        @saved="handleJournalSaved"
        @cancel="closeModal"
      />
    </Modal>    <!-- 期刊详情模态框 -->
    <Modal
      v-if="viewingJournal"
      @close="viewingJournal = null"
      :title="viewingJournal.name"
      size="medium"
    >
      <JournalDetail :journal="viewingJournal" />
    </Modal>

    <!-- 确认删除对话框 -->
    <ConfirmDialog
      :visible="dialogState.visible"
      :title="dialogState.title"
      :message="dialogState.message"
      :confirm-text="dialogState.confirmText"
      :cancel-text="dialogState.cancelText"
      :loading="dialogState.loading"
      @confirm="confirmDialog"
      @cancel="cancelDialog"
    />
  </StandardPageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { StandardPageLayout } from "../components/layout";
import { Modal, LoadingSpinner, ConfirmDialog } from "../components/base";
import { useJournals } from "../composables/useJournals";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useToast } from "../composables/useToast";
import JournalForm from "../components/forms/JournalForm.vue";
import JournalDetail from "../components/content/journal/JournalDetail.vue";

// 组合式函数
const {
  journals,
  loading,
  totalJournals,
  isAdmin,
  paginationInfo,
  fetchJournals,
  deleteJournal,
  fetchJournalGrades,
} = useJournals();

const {
  dialogState,
  confirmDelete,
  confirmDialog,
  cancelDialog,
} = useConfirmDialog();
const { showToast } = useToast();

// 响应式数据
const searchQuery = ref("");
const selectedGrade = ref("");
const showCreateModal = ref(false);
const editingJournal = ref(null);
const viewingJournal = ref(null);
const journalGrades = ref([]);

// 搜索防抖
let searchTimeout = null;

// 获取等级标签
const getGradeLabel = (grade) => {
  const gradeOption = journalGrades.value.find(g => g.value === grade);
  return gradeOption ? gradeOption.label : grade;
};

// 加载期刊等级列表
const loadJournalGrades = async () => {
  try {
    const response = await fetchJournalGrades();
    journalGrades.value = response.grades || [];
  } catch (error) {
    console.error("加载期刊等级失败:", error);
    showToast("加载期刊等级失败", "error");
  }
};

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 处理搜索
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadJournals();
  }, 300);
};

// 处理筛选变化
const handleFilterChange = () => {
  loadJournals();
};

// 加载期刊列表
const loadJournals = async (page = 1) => {
  const params = {
    page,
    name: searchQuery.value || undefined,
    grade: selectedGrade.value || undefined,
  };

  try {
    await fetchJournals(params);
  } catch (error) {
    showToast("加载期刊列表失败", "error");
  }
};

// 分页跳转
const goToPage = (page) => {
  if (page >= 1 && page <= paginationInfo.value.totalPages) {
    loadJournals(page);
  }
};

// 查看期刊详情
const viewJournal = (journal) => {
  viewingJournal.value = journal;
};

// 编辑期刊
const editJournal = (journal) => {
  editingJournal.value = journal;
};

// 确认删除期刊
const confirmDeleteJournal = async (journal) => {
  try {
    await confirmDelete(`期刊"${journal.name}"`);
    // 如果用户确认删除，执行删除操作
    await deleteJournal(journal.id);
    showToast("期刊删除成功", "success");
  } catch (error) {
    // 用户取消删除或删除失败
    if (error !== false) {
      // 如果不是用户取消，而是实际的错误
      console.error("删除期刊失败:", error);
      showToast("删除期刊失败", "error");
    }
  }
};

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false;
  editingJournal.value = null;
};

// 处理期刊保存
const handleJournalSaved = () => {
  closeModal();
  loadJournals();
};

// 初始化
onMounted(async () => {
  await loadJournalGrades();
  loadJournals();
});
</script>

<style scoped>
.filters-section {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  padding-right: calc(var(--space-md) + 24px);
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
}

.search-icon {
  position: absolute;
  right: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  pointer-events: none;
}

.filter-select {
  padding: var(--space-sm) var(--space-md);
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  background: var(--white);
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-500);
}

.add-journal-btn {
  white-space: nowrap;
  flex-shrink: 0;
}

.results-info {
  color: var(--gray-600);
  font-size: var(--text-sm);
  font-weight: 500;
}

.journals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.journal-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
}

.journal-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-200);
  transform: translateY(-2px);
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.journal-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
  flex: 1;
  margin-right: var(--space-sm);
}

.journal-grade {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.grade-sci,
.grade-sci_q1,
.grade-sci_q2,
.grade-sci_q3,
.grade-sci_q4 {
  background: var(--red-100);
  color: var(--red-700);
}

.grade-ei {
  background: var(--blue-100);
  color: var(--blue-700);
}

.grade-core {
  background: var(--green-100);
  color: var(--green-700);
}

.grade-cssci {
  background: var(--purple-100);
  color: var(--purple-700);
}

.grade-other {
  background: var(--gray-100);
  color: var(--gray-700);
}

.journal-description {
  color: var(--gray-600);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.journal-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--gray-500);
  font-size: var(--text-xs);
}

.meta-icon {
  font-size: var(--text-sm);
}

.journal-actions {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  visibility: hidden;
  transform: translateX(15px) scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: 10;
}

.journal-card:hover .journal-actions {
  opacity: 1;
  visibility: visible;
  transform: translateX(0) scale(1);
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.edit-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.edit-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.empty-state {
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-md);
}

.empty-title {
  color: var(--gray-700);
  margin-bottom: var(--space-sm);
}

.empty-description {
  color: var(--gray-500);
  margin-bottom: var(--space-lg);
}

.loading-state {
  text-align: center;
  padding: var(--space-xl);
}

.loading-state p {
  color: var(--gray-600);
  margin-top: var(--space-md);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--gray-300);
  background: var(--white);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary-300);
  background: var(--primary-50);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--gray-600);
  font-size: var(--text-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .search-input-wrapper {
    min-width: unset;
  }

  .filter-select {
    min-width: unset;
  }

  .add-journal-btn {
    width: 100%;
    justify-content: center;
  }

  .journals-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .filters-section {
    padding: var(--space-md);
  }

  .filter-row {
    gap: var(--space-xs);
  }

  .search-input,
  .filter-select {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
  }
}
</style>
