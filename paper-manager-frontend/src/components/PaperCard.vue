<template>
  <div class="paper-card">    <div class="paper-header">
      <div :class="['paper-type-badge', paper.paper_type]">
        <span class="badge-icon">{{ paper.paper_type === 'published' ? '🎓' : '📚' }}</span>
        {{ paper.paper_type === 'published' ? '发表论文' : '文献' }}
      </div>      <div class="paper-actions">
        <button
          @click="$emit('view', paper)"
          class="action-btn view-btn"
          title="查看详情"
        >
          👁️
        </button>
        <button
          v-if="paper.file_path"
          @click.stop="handleDownload"
          class="action-btn download-btn"
          title="下载文件"
          :disabled="downloading"
        >
          {{ downloading ? '⏳' : '⬇️' }}
        </button>
        <button
          @click="$emit('edit', paper)"
          class="action-btn edit-btn"
          title="编辑"
        >
          ✏️
        </button>
        <button
          @click="$emit('delete', paper)"
          class="action-btn delete-btn"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>

    <div class="paper-content" @click="$emit('view', paper)">
      <h3 class="paper-title">{{ paper.title }}</h3>      <div class="paper-meta">
        <div class="meta-item">
          <span class="meta-label">作者:</span>
          <span class="meta-value">{{ authorsDisplay }}</span>
        </div>

        <div v-if="paper.journal" class="meta-item">
          <span class="meta-label">期刊:</span>
          <span class="meta-value journal">{{ paper.journal }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-label">年份:</span>
          <span class="meta-value year">{{ paper.year }}</span>
        </div>

        <div v-if="paper.doi" class="meta-item">
          <span class="meta-label">DOI:</span>
          <span class="meta-value doi">{{ paper.doi }}</span>
        </div>
      </div>

      <div v-if="paper.abstract" class="paper-abstract">
        {{ truncatedAbstract }}
        <span v-if="paper.abstract.length > 150" class="read-more"
          >... 查看更多</span
        >
      </div>

      <div v-if="keywordList.length > 0" class="paper-keywords">
        <span v-for="keyword in keywordList" :key="keyword" class="keyword-tag">
          {{ keyword }}
        </span>
      </div>
    </div>

    <div class="paper-footer">
      <div class="paper-category">
        <span class="category-icon">🏷️</span>
        {{ categoriesDisplay }}
      </div>
      <div class="paper-date">
        <span class="date-icon">📅</span>
        {{ formatDate(paper.created_at) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useCategories } from "../composables/useCategories";
import { downloadItem, getDownloadFileName, triggerDownload } from "../services/downloadService";
import { useToast } from "../composables/useToast";

const props = defineProps({
  paper: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "delete", "view"]);

const { getCategoryName, loadCategories } = useCategories();
const { showToast } = useToast();

// 下载状态
const downloading = ref(false);

// Make sure categories are loaded
onMounted(() => {
  loadCategories();
});

const authorsDisplay = computed(() => {
  if (!props.paper.authors) return "未知作者";
  if (Array.isArray(props.paper.authors)) {
    return props.paper.authors.map(author =>
      typeof author === 'object' ? author.name : author
    ).join(', ');
  }
  return props.paper.authors;
});

const categoriesDisplay = computed(() => {
  if (!props.paper) return "未分类";

  // Handle single category_id
  if (props.paper.category_id) {
    return getCategoryName(props.paper.category_id);
  }

  // Handle array of categories
  if (props.paper.categories && Array.isArray(props.paper.categories)) {
    if (props.paper.categories.length === 0) return "未分类";

    return props.paper.categories.map(category => {
      if (typeof category === 'object' && category.name) {
        return category.name;
      } else if (typeof category === 'number' || typeof category === 'string') {
        return getCategoryName(category);
      }
      return "未知分类";
    }).join(', ');
  }

  return "未分类";
});

const truncatedAbstract = computed(() => {
  if (!props.paper.abstract) return "";
  return props.paper.abstract.length > 150
    ? props.paper.abstract.substring(0, 150)
    : props.paper.abstract;
});

const keywordList = computed(() => {
  if (!props.paper.keywords) return [];

  if (Array.isArray(props.paper.keywords)) {
    return props.paper.keywords.map(keyword =>
      typeof keyword === 'object' ? keyword.name : keyword
    ).slice(0, 5);
  }

  // 兼容字符串格式的关键词
  return props.paper.keywords
    .split(",")
    .map((k) => k.trim())
    .slice(0, 5);
});

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// 处理下载
const handleDownload = async () => {
  if (!props.paper.file_path) {
    showToast("没有可下载的文件", "warning");
    return;
  }

  downloading.value = true;

  try {
    showToast("正在准备下载文件...", "info");

    // 使用统一的下载服务
    const response = await downloadItem(props.paper);

    // 获取文件名
    const fileName = getDownloadFileName(props.paper, response);

    // 确定内容类型
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // 触发下载
    triggerDownload(response.data, fileName, contentType);

    showToast("文件下载成功", "success");
  } catch (error) {
    console.error("下载文件失败:", error);
    showToast(error.message || "下载文件失败，请重试", "error");
  } finally {
    downloading.value = false;
  }
};
</script>

<style scoped>
.paper-card {
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 4px 6px rgba(125, 108, 192, 0.04);
}

.paper-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(125, 108, 192, 0.12);
  border-color: var(--primary-300);
}

.paper-header {
  padding: 1rem 1.5rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.paper-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.paper-type-badge.literature {
  background: linear-gradient(
    135deg,
    var(--primary-600) 0%,
    var(--primary-700) 100%
  );
  color: var(--white);
  box-shadow: 0 3px 8px rgba(125, 108, 192, 0.15);
}

.paper-type-badge.published {
  background: linear-gradient(
    135deg,
    #059669 0%,
    #047857 100%
  );
  color: var(--white);
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.15);
}

.badge-icon {
  font-size: 0.9rem;
}

.paper-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.paper-card:hover .paper-actions {
  opacity: 1;
}

.action-btn {
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  min-width: 32px;
  height: 32px;
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.08);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(125, 108, 192, 0.12);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.view-btn:hover {
  background: rgba(125, 108, 192, 0.08);
  border-color: var(--primary-300);
}

.download-btn:hover {
  background: rgba(34, 197, 94, 0.08);
  border-color: #22c55e;
  color: #16a34a;
}

.edit-btn:hover {
  background: rgba(125, 108, 192, 0.06);
  border-color: var(--primary-300);
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.08);
  border-color: #dc3545;
  color: #dc3545;
}

.paper-content {
  padding: 0 1.5rem 1rem;
  cursor: pointer;
}

.paper-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  /* Fallback for browsers that don't support -webkit-line-clamp */
  max-height: calc(1.4em * 2); /* line-height * number of lines */
}

.paper-meta {
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.meta-label {
  color: var(--color-text-soft);
  min-width: 60px;
  font-weight: 500;
}

.meta-value {
  color: var(--color-text);
  flex: 1;
}

.meta-value.journal {
  font-weight: 600;
  color: var(--color-primary);
}

.meta-value.year {
  font-weight: 600;
}

.meta-value.doi {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.paper-abstract {
  font-size: 0.85rem;
  color: var(--color-text-soft);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.read-more {
  color: var(--primary-600);
  font-weight: 600;
}

.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.keyword-tag {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.25rem 0.7rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid var(--primary-200);
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.08);
}

.keyword-tag:hover {
  background: var(--primary-200);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(125, 108, 192, 0.12);
}

.paper-footer {
  padding: 0.85rem 1.5rem;
  background: linear-gradient(
    to right,
    var(--primary-50),
    var(--white),
    var(--primary-50)
  );
  border-top: 1px solid var(--primary-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  backdrop-filter: blur(5px);
}

.paper-category,
.paper-date {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--primary-700);
  font-weight: 500;
}

.category-icon,
.date-icon {
  font-size: 1rem;
  color: var(--primary-500);
}

@media (max-width: 480px) {
  .paper-card {
    margin-bottom: 1rem;
  }

  .paper-header {
    padding: 1rem 1rem 0.5rem;
  }

  .paper-content {
    padding: 0 1rem 1rem;
  }

  .paper-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .paper-actions {
    opacity: 1;
  }
}
</style>
