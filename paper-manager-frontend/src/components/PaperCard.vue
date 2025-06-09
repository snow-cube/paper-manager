<template>
  <div class="paper-card" @click="$emit('view', paper)">    <!-- 卡片头部 -->
    <div class="paper-header">
      <div class="badge-section">
        <div :class="['paper-type-badge', paper.paper_type]">
          <span class="badge-icon">{{ paper.paper_type === 'published' ? '🎓' : '📚' }}</span>
          {{ paper.paper_type === 'published' ? '发表论文' : '参考文献' }}
        </div>
        <div v-if="paper.team_name || teamName" class="team-badge">
          <span class="team-icon">👥</span>
          <span class="team-name">{{ paper.team_name || teamName }}</span>
        </div>
      </div>

      <div class="paper-actions" @click.stop>
        <button
          @click="$emit('view', paper)"
          class="action-btn view-btn"
          title="查看详情"
        >
          <span class="action-icon">👁️</span>
        </button>
        <button
          v-if="paper.file_path"
          @click="handleDownload"
          class="action-btn download-btn"
          title="下载文件"
          :disabled="downloading"
        >
          <span class="action-icon">{{ downloading ? '⏳' : '⬇️' }}</span>
        </button>
        <button
          @click="$emit('edit', paper)"
          class="action-btn edit-btn"
          title="编辑"
        >
          <span class="action-icon">✏️</span>
        </button>
        <button
          @click="$emit('delete', paper)"
          class="action-btn delete-btn"
          title="删除"
        >
          <span class="action-icon">🗑️</span>
        </button>
      </div>
    </div>

    <!-- 卡片主体内容 -->
    <div class="paper-content">
      <h3 class="paper-title">{{ paper.title }}</h3>

      <!-- 论文元数据 -->
      <div class="paper-meta">
        <div class="meta-row primary">
          <div class="meta-item author">
            <span class="meta-icon">👨‍💼</span>
            <span class="meta-label">作者</span>
            <span class="meta-value">{{ authorsDisplay }}</span>
          </div>
        </div>

        <div class="meta-row secondary">
          <div v-if="paper.journal" class="meta-item journal">
            <span class="meta-icon">📖</span>
            <span class="meta-label">期刊</span>
            <span class="meta-value">{{ paper.journal }}</span>
          </div>

          <div class="meta-item year">
            <span class="meta-icon">📅</span>
            <span class="meta-label">年份</span>
            <span class="meta-value">{{ paper.year }}</span>
          </div>
        </div>

        <div v-if="paper.doi" class="meta-row tertiary">
          <div class="meta-item doi">
            <span class="meta-icon">🔗</span>
            <span class="meta-label">DOI</span>
            <span class="meta-value">{{ paper.doi }}</span>
          </div>
        </div>
      </div>

      <!-- 摘要 -->
      <div v-if="paper.abstract" class="paper-abstract">
        <div class="abstract-header">
          <span class="abstract-icon">📝</span>
          <span class="abstract-label">摘要</span>
        </div>
        <p class="abstract-content">
          {{ truncatedAbstract }}
          <span v-if="paper.abstract.length > 150" class="read-more">... 查看更多</span>
        </p>
      </div>

      <!-- 关键词 -->
      <div v-if="keywordList.length > 0" class="paper-keywords">
        <div class="keywords-header">
          <span class="keywords-icon">🏷️</span>
          <span class="keywords-label">关键词</span>
        </div>
        <div class="keywords-list">
          <span
            v-for="keyword in keywordList"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="paper-footer">
      <div class="footer-left">
        <div class="paper-category">
          <span class="category-icon">📂</span>
          <span class="category-text">{{ categoriesDisplay }}</span>
        </div>
      </div>

      <div class="footer-right">
        <div class="paper-date">
          <span class="date-icon">🕒</span>
          <span class="date-text">{{ formatDate(paper.created_at) }}</span>
        </div>
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

// 计算团队名称
const teamName = computed(() => {
  // 如果论文数据中有团队信息，优先使用
  if (props.paper.team_name) {
    return props.paper.team_name;
  }
  // 如果论文属于当前团队，显示当前团队名称
  if (props.paper.team_id && currentTeam.value?.id === props.paper.team_id) {
    return currentTeam.value.name;
  }
  return null;
});

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
  background: linear-gradient(145deg, var(--white), var(--primary-25));
  border: 2px solid var(--primary-200);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  transition: all var(--transition-bounce);  position: relative;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  backdrop-filter: blur(10px);
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.paper-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-2xl);
  border-color: var(--primary-400);
}

.paper-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500), var(--success-500));
}

/* 头部区域 */
.paper-header {
  padding: var(--space-sm);
  background: linear-gradient(135deg, var(--white), var(--primary-50));
  border-bottom: 1px solid var(--primary-200);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-sm);
}

.badge-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  overflow: hidden;
}

.paper-type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-xl);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.paper-type-badge.literature {
  background: linear-gradient(135deg, #8B5CF6, #A855F7);
  color: var(--white);
}

.paper-type-badge.published {
  background: linear-gradient(135deg, #059669, #10B981);
  color: var(--white);
}

.badge-icon {
  font-size: 1.1em;
}

.team-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-xs);
  font-weight: 600;
  background: linear-gradient(135deg, #F59E0B, #F97316);
  color: var(--white);
  box-shadow: var(--shadow-sm);
  max-width: 150px;
  flex-shrink: 1;
}

.team-icon {
  font-size: 0.9em;
}

.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transform: translateX(20px);
  transition: all var(--transition-bounce);
  z-index: 10;
  position: relative;
}

.paper-card:hover .paper-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  background: var(--white);
  border: 2px solid var(--primary-300);
  border-radius: var(--border-radius);
  padding: var(--space-xs);
  cursor: pointer;
  transition: all var(--transition-bounce);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  box-shadow: var(--shadow-sm);
}

.action-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: var(--shadow-lg);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-icon {
  font-size: 1.1em;
}

.view-btn:hover {
  background: var(--primary-100);
  border-color: var(--primary-400);
}

.download-btn:hover {
  background: var(--success-100);
  border-color: var(--success-400);
}

.edit-btn:hover {
  background: var(--warning-100);
  border-color: var(--warning-400);
}

.delete-btn:hover {
  background: var(--danger-100);
  border-color: var(--danger-400);
}

/* 内容区域 */
.paper-content {
  flex: 1;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.paper-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-heading);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* 标准属性支持 */
  line-clamp: 2;
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.paper-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--white);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
  font-size: var(--text-sm);
  box-shadow: var(--shadow-sm);
  flex: 1;
  min-width: 0;
}

.meta-item.author {
  flex: 1 1 100%;
}

.meta-item.journal,
.meta-item.year {
  flex: 1 1 calc(50% - var(--space-xs));
}

.meta-item.doi {
  flex: 1 1 100%;
}

.meta-icon {
  font-size: 1em;
  color: var(--primary-500);
  flex-shrink: 0;
}

.meta-label {
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

.meta-value {
  color: var(--color-text-soft);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.paper-abstract {
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
  padding: var(--space-sm);
}

.abstract-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.abstract-icon {
  color: var(--primary-500);
}

.abstract-label {
  font-weight: 700;
  color: var(--primary-700);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.abstract-content {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.read-more {
  color: var(--primary-600);
  font-weight: 600;
  cursor: pointer;
  transition: color var(--transition-normal);
}

.read-more:hover {
  color: var(--primary-700);
}

.paper-keywords {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.keywords-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.keywords-icon {
  color: var(--secondary-500);
}

.keywords-label {
  font-weight: 700;
  color: var(--secondary-700);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.keyword-tag {
  background: linear-gradient(135deg, var(--secondary-100), var(--secondary-200));
  color: var(--secondary-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--text-xs);
  font-weight: 600;
  border: 1px solid var(--secondary-300);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.keyword-tag:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, var(--secondary-200), var(--secondary-300));
  box-shadow: var(--shadow-sm);
}

/* 底部区域 */
.paper-footer {
  background: linear-gradient(135deg, var(--primary-50), var(--white));
  border-top: 1px solid var(--primary-200);
  padding: var(--space-sm) var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.paper-category {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--success-100);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--success-300);
}

.category-icon {
  color: var(--success-600);
}

.category-text {
  color: var(--success-700);
  font-weight: 600;
  font-size: var(--text-xs);
}

.paper-date {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--gray-100);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-300);
}

.date-icon {
  color: var(--gray-600);
}

.date-text {
  color: var(--gray-700);
  font-weight: 500;
  font-size: var(--text-xs);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .paper-card {
    min-height: 380px;
  }
  .paper-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .badge-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .paper-actions {
    align-self: flex-end;
    opacity: 1;
    transform: none;
  }

  .meta-row {
    flex-direction: column;
  }

  .meta-item {
    flex: 1 1 auto;
  }

  .paper-footer {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .footer-left,
  .footer-right {
    justify-content: center;
  }
}
</style>
