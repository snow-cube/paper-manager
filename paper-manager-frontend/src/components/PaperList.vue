<template>
  <div class="paper-list">
    <div
      v-for="paper in papers"
      :key="paper.id"
      class="paper-card"
    >
      <div class="paper-header">
        <h3 class="paper-title">{{ paper.title }}</h3>
        <div class="paper-actions">
          <button
            v-if="paper.file_url"
            class="action-btn"
            @click="downloadPaper(paper)"
            title="下载论文"
          >
            📄
          </button>
          <button
            class="action-btn"
            @click="editPaper(paper)"
            title="编辑论文"
          >
            ✏️
          </button>
          <button
            class="action-btn action-btn-danger"
            @click="deletePaper(paper)"
            title="删除论文"
          >
            🗑️
          </button>
        </div>
      </div>

      <div class="paper-meta">
        <div class="meta-item" v-if="paper.journal">
          <span class="meta-label">期刊:</span>
          <span class="meta-value">{{ paper.journal }}</span>
        </div>
        <div class="meta-item" v-if="paper.year">
          <span class="meta-label">年份:</span>
          <span class="meta-value">{{ paper.year }}</span>
        </div>
        <div class="meta-item" v-if="paper.authors">
          <span class="meta-label">作者:</span>
          <span class="meta-value">{{ paper.authors }}</span>
        </div>
      </div>

      <div v-if="paper.abstract" class="paper-abstract">
        <p>{{ truncateText(paper.abstract, 200) }}</p>
      </div>

      <div v-if="paper.keywords" class="paper-keywords">
        <span
          v-for="keyword in getKeywords(paper.keywords)"
          :key="keyword"
          class="keyword-tag"
        >
          {{ keyword }}
        </span>
      </div>

      <div class="paper-footer">
        <div class="paper-category" v-if="paper.category_name">
          📁 {{ paper.category_name }}
        </div>
        <div class="paper-date" v-if="paper.created_at">
          添加于 {{ formatDate(paper.created_at) }}
        </div>
      </div>
    </div>    <div v-if="papers.length === 0" class="empty-message">
      <p>暂无论文数据</p>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :visible="dialogState.visible"
      :title="dialogState.title"
      :message="dialogState.message"
      :confirm-text="dialogState.confirmText"
      :cancel-text="dialogState.cancelText"
      :loading="dialogState.loading"
      @confirm="confirmDialog"
      @cancel="cancelDialog"
      @close="closeDialog"
    />
  </div>
</template>

<script setup>
import { deletePaper as deletePaperAPI, downloadPaper as downloadPaperAPI } from '../services/api';
import { useToast } from '../composables/useToast';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps({
  papers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['paper-updated', 'paper-deleted']);

const { showToast } = useToast();
const {
  dialogState,
  confirmDialog,
  cancelDialog,
  closeDialog,
  confirmDelete,
  setLoading
} = useConfirmDialog();

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 获取关键词数组
const getKeywords = (keywords) => {
  if (!keywords) return [];
  return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 下载论文
const downloadPaper = async (paper) => {
  if (!paper.file_url) {
    showToast('该论文没有可下载的文件', 'warning');
    return;
  }

  try {
    showToast('正在准备下载论文...', 'info');

    const response = await downloadPaperAPI(paper.id);

    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title}.pdf` || 'paper.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast('论文下载成功', 'success');
  } catch (error) {
    console.error('下载论文失败:', error);
    showToast('下载论文失败，请重试', 'error');
  }
};

// 编辑论文
const editPaper = (paper) => {
  // TODO: 实现编辑功能
  console.log('Edit paper:', paper);
  showToast('编辑功能将在后续版本中实现', 'info');
};

// 删除论文
const deletePaper = async (paper) => {
  try {
    await confirmDelete(`论文《${paper.title}》`);

    setLoading(true);
    await deletePaperAPI(paper.id);

    emit('paper-deleted', paper.id);
    showToast('论文删除成功', 'success');
    closeDialog();
  } catch (error) {
    if (error !== false) { // 用户没有取消操作
      console.error('删除论文失败:', error);
      showToast('删除论文失败，请重试', 'error');
    }
    setLoading(false);
  }
};
</script>

<style scoped>
.paper-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.paper-card {
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.paper-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.paper-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.paper-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: var(--color-background-soft);
}

.action-btn-danger:hover {
  background: var(--error-50);
  color: var(--error-600);
}

.paper-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  gap: 0.25rem;
}

.meta-label {
  color: var(--color-text-light);
  font-weight: 500;
}

.meta-value {
  color: var(--color-text);
}

.paper-abstract {
  margin-bottom: 1rem;
}

.paper-abstract p {
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
  font-size: 0.875rem;
}

.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.keyword-tag {
  background: var(--primary-50);
  color: var(--primary-700);
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--primary-200);
}

.paper-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.paper-category {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}

.paper-date {
  font-style: italic;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}

.empty-message p {
  margin: 0;
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .paper-card {
    padding: 1rem;
  }

  .paper-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .paper-actions {
    justify-content: flex-end;
  }

  .paper-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .paper-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
