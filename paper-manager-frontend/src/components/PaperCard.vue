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
import { computed, onMounted, ref, watch } from "vue";
import { useCategories } from "../composables/useCategories";
import { useTeam } from "../composables/useTeam";
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
const { currentTeam } = useTeam();

// 下载状态
const downloading = ref(false);

// 加载适当的分类数据
const loadAppropriateCategories = async () => {
  if (props.paper?.paper_type === 'literature') {
    // 文献使用参考文献分类（团队特定）
    await loadCategories('references', currentTeam.value?.id);
  } else {
    // 发表论文使用公共论文分类
    await loadCategories('papers');
  }
};

// Make sure categories are loaded
onMounted(() => {
  loadAppropriateCategories();
});

// 监听paper变化，重新加载分类
watch(() => props.paper?.paper_type, () => {
  loadAppropriateCategories();
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
  /* 使用卡片变体模板 */
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--card-border-radius);
  overflow: hidden;
  transition: all var(--transition-bounce);
  position: relative;
  box-shadow: var(--shadow-card);
}

.paper-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-300);
}

.paper-header {
  padding: var(--space-md) var(--space-lg) var(--space-sm);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.paper-type-badge {
  /* 使用徽章基础模板 */
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) 0.8rem;
  border-radius: 20px;
  font-size: var(--text-xs);
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
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.paper-card:hover .paper-actions {
  opacity: 1;
}

.action-btn {
  /* 使用操作按钮基础模板 */
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: 6px;
  padding: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  min-width: 32px;
  height: 32px;
  box-shadow: var(--shadow-card);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.view-btn:hover {
  background: var(--primary-100);
  color: var(--primary-700);
  border-color: var(--primary-300);
}

.download-btn:hover {
  background: rgba(34, 197, 94, 0.08);
  border-color: #22c55e;
  color: #16a34a;
}

.edit-btn:hover {
  background: var(--primary-100);
  color: var(--primary-700);
  border-color: var(--primary-300);
}

.delete-btn:hover {
  background: var(--error-50);
  color: var(--error-600);
  border-color: #dc3545;
}

.paper-content {
  padding: 0 var(--space-lg) var(--space-md);
  cursor: pointer;
}

.paper-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-md) 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  max-height: calc(1.4em * 2);
}

.paper-meta {
  margin-bottom: var(--space-md);
}

.meta-item {
  display: flex;
  margin-bottom: 0.4rem;
  font-size: var(--text-sm);
}

.meta-label {
  color: var(--color-text-light);
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
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.paper-abstract {
  font-size: var(--text-sm);
  color: var(--color-text-light);
  line-height: 1.5;
  margin-bottom: var(--space-md);
}

.read-more {
  color: var(--primary-600);
  font-weight: 600;
}

.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.keyword-tag {
  /* 使用主要徽章变体 */
  background: var(--primary-100);
  color: var(--primary-700);
  padding: var(--space-xs) 0.7rem;
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  transition: all var(--transition-normal);
  border: 1px solid var(--primary-200);
  box-shadow: var(--shadow-card);
}

.keyword-tag:hover {
  background: var(--primary-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.paper-footer {
  padding: 0.85rem var(--space-lg);
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
  font-size: var(--text-xs);
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
  font-size: var(--text-base);
  color: var(--primary-500);
}

@media (max-width: 480px) {
  .paper-card {
    margin-bottom: var(--space-md);
  }

  .paper-header {
    padding: var(--space-md) var(--space-md) var(--space-sm);
  }

  .paper-content {
    padding: 0 var(--space-md) var(--space-md);
  }

  .paper-footer {
    padding: 0.75rem var(--space-md);
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .paper-actions {
    opacity: 1;
  }
}
</style>
