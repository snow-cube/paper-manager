<template>
  <div class="paper-card" @click="$emit('view', paper)">
    <!-- 卡片头部 -->
    <div class="paper-header">
      <div class="badge-section">
        <div :class="['paper-type-badge', paperTypeBadgeClass]">
          <span class="badge-icon">{{ isLiteratureType ? "📚" : "🎓" }}</span>
          {{ isLiteratureType ? "参考文献" : "发表论文" }}
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
          v-if="paper.file_url"
          @click="handleDownload"
          class="action-btn download-btn"
          title="下载文件"
          :disabled="downloading"
        >
          <span class="action-icon">{{ downloading ? "⏳" : "⬇️" }}</span>
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
          <div v-if="journalDisplay" class="meta-item journal">
            <span class="meta-icon">📖</span>
            <span class="meta-label">期刊</span>
            <span class="meta-value" :title="journalDisplay">{{
              journalDisplay
            }}</span>
          </div>

          <div class="meta-item year">
            <span class="meta-icon">📅</span>
            <span class="meta-label">年份</span>
            <span class="meta-value">{{ yearDisplay }}</span>
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
          <span v-if="paper.abstract.length > 150" class="read-more"
            >... 查看更多</span
          >
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
import { useCategories } from "../../../composables/useCategories";
import { useCategoryEvents } from "../../../composables/useCategoryEvents";
import { useTeam } from "../../../composables/useTeam";
import { useFileDownload } from "../../../composables/useFileDownload";
import { useToast } from "../../../composables/useToast";

const props = defineProps({
  paper: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "delete", "view"]);

const { getCategoryName, loadCategories } = useCategories();
const { onCategoryUpdate } = useCategoryEvents();
const { showToast } = useToast();
const { currentTeam } = useTeam();
const { downloading, downloadFile } = useFileDownload();

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

// 判断是否为文献类型
const isLiteratureType = computed(() => {
  // 根据不同的判断方式确定是否为文献
  if (props.paper.paper_type) {
    return props.paper.paper_type === "literature";
  }
  // 如果没有 paper_type 字段，可以根据其他字段判断
  // 比如参考文献通常有 publication_year 而不是 publication_date
  if (props.paper.publication_year && !props.paper.publication_date) {
    return true;
  }
  // 或者根据 URL 路径判断（如果从路由传递的话）
  if (
    typeof window !== "undefined" &&
    window.location.pathname.includes("literature")
  ) {
    return true;
  }
  return false;
});

// 论文类型徽章的CSS类
const paperTypeBadgeClass = computed(() => {
  return isLiteratureType.value ? "literature" : "published";
});

// 加载适当的分类数据
const loadAppropriateCategories = async () => {
  if (isLiteratureType.value) {
    // 文献使用参考文献分类（团队特定）
    await loadCategories("references", currentTeam.value?.id);
  } else {
    // 发表论文使用公共论文分类
    await loadCategories("papers");
  }
};

// Make sure categories are loaded
onMounted(() => {
  loadAppropriateCategories();
});

// 监听paper变化，重新加载分类
watch(
  () => isLiteratureType.value,
  () => {
    loadAppropriateCategories();
  }
);

// 监听分类更新事件，自动刷新分类数据
onCategoryUpdate(async () => {
  await loadAppropriateCategories();
});

const authorsDisplay = computed(() => {
  if (!props.paper.authors) return "未知作者";

  // 处理数组类型的作者信息
  if (Array.isArray(props.paper.authors)) {
    if (props.paper.authors.length === 0) return "未知作者";
    return props.paper.authors
      .map((author) => (typeof author === "object" ? author.name : author))
      .join(", ");
  }

  // 处理字符串类型的作者信息
  if (typeof props.paper.authors === "string") {
    return props.paper.authors;
  }

  // 其他类型转换为字符串
  return String(props.paper.authors);
});

// 期刊显示
const journalDisplay = computed(() => {
  // 优先使用 journal_name 字段（API返回的字段）
  if (props.paper.journal_name) {
    return props.paper.journal_name;
  }
  // 兼容旧的 journal 字段
  if (props.paper.journal) {
    return typeof props.paper.journal === "object"
      ? props.paper.journal.name
      : props.paper.journal;
  }
  return null;
});

// 年份显示
const yearDisplay = computed(() => {
  // 对于参考文献，使用 publication_year 字段
  if (props.paper.publication_year) {
    return props.paper.publication_year;
  }
  // 对于发表论文，从 publication_date 提取年份
  if (props.paper.publication_date) {
    return new Date(props.paper.publication_date).getFullYear();
  }
  // 兼容旧的 year 字段
  if (props.paper.year) {
    return props.paper.year;
  }
  // 如果没有发表年份信息，显示"未知年份"而不是创建时间
  return "未知年份";
});

const categoriesDisplay = computed(() => {
  if (!props.paper) return "未分类";

  // 优先使用 category_name 字段（API直接返回的分类名称）
  if (props.paper.category_name) {
    return props.paper.category_name;
  }

  // 处理 category 对象（参考文献可能返回完整的分类对象）
  if (props.paper.category && typeof props.paper.category === "object") {
    return props.paper.category.name || "未知分类";
  }

  // Handle single category_id
  if (props.paper.category_id) {
    return getCategoryName(props.paper.category_id);
  }

  // Handle array of categories
  if (props.paper.categories && Array.isArray(props.paper.categories)) {
    if (props.paper.categories.length === 0) return "未分类";

    return props.paper.categories
      .map((category) => {
        if (typeof category === "object" && category.name) {
          return category.name;
        } else if (
          typeof category === "number" ||
          typeof category === "string"
        ) {
          return getCategoryName(category);
        }
        return "未知分类";
      })
      .join(", ");
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
    return props.paper.keywords
      .map((keyword) => (typeof keyword === "object" ? keyword.name : keyword))
      .slice(0, 5);
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
const handleDownload = () => {
  downloadFile(props.paper, {
    paperType: isLiteratureType.value ? "literature" : "papers",
  });
};
</script>

<style scoped>
.paper-card {
  background: linear-gradient(145deg, var(--white), var(--primary-25));
  border: 2px solid var(--primary-200);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  transition: all var(--transition-bounce);
  position: relative;
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
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--primary-500),
    var(--secondary-500),
    var(--success-500)
  );
}

/* 头部区域 */
.paper-header {
  padding: var(--space-sm);
  background: linear-gradient(135deg, var(--white), var(--primary-50));
  border-bottom: 1px solid var(--primary-200);
  position: relative; /* 为浮动操作按钮提供定位基准 */
}

.badge-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap; /* 允许徽章换行 */
  /* padding-right: calc(var(--space-lg) + 140px); 为浮动按钮留出空间 */
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
  white-space: nowrap; /* 防止文字换行 */
}

.paper-type-badge.literature {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: var(--white);
}

.paper-type-badge.published {
  background: linear-gradient(135deg, #059669, #10b981);
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
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.05),
    rgba(249, 115, 22, 0.05)
  );
  color: #d97706; /* 更淡的橙色文字 */
  border: 2px solid rgba(249, 115, 22, 0.3); /* 更淡的边框 */
  box-shadow: var(--shadow-sm);
  max-width: 150px;
  flex-shrink: 1;
  min-width: 0; /* 确保能够收缩 */
  transition: all var(--transition-normal); /* 添加过渡效果 */
}

.team-icon {
  font-size: 0.9em;
  color: rgba(249, 115, 22, 0.7); /* 图标也使用更淡的橙色 */
}

.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 团队徽章悬停效果 */
.team-badge:hover {
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.1),
    rgba(249, 115, 22, 0.1)
  );
  border-color: rgba(249, 115, 22, 0.5);
  color: #ea580c;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.paper-actions {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transform: translateX(20px);
  transition: all var(--transition-bounce);
  z-index: 20; /* 确保浮动在其他内容之上 */
  background: rgba(255, 255, 255, 0.95); /* 半透明背景提供更好的可读性 */
  backdrop-filter: blur(8px); /* 背景模糊效果 */
  padding: var(--space-xs);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md); /* 添加阴影增强浮动效果 */
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.paper-card:hover .paper-actions {
  opacity: 1;
  transform: translateX(0);
}

/* 增强浮动效果的视觉提示 */
.paper-actions:hover {
  background: rgba(255, 255, 255, 1); /* 悬停时背景更不透明 */
  box-shadow: var(--shadow-lg); /* 增强阴影 */
  transform: translateY(-1px); /* 轻微上移 */
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
  position: relative; /* 为悬停效果提供定位基准 */
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
  background: linear-gradient(
    135deg,
    var(--secondary-100),
    var(--secondary-200)
  );
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
  background: linear-gradient(
    135deg,
    var(--secondary-200),
    var(--secondary-300)
  );
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
@media (max-width: 768px) {
  .badge-section {
    padding-right: calc(var(--space-md) + 120px); /* 中等屏幕调整右边距 */
  }

  .team-badge {
    max-width: 120px; /* 在中等屏幕上稍微缩小 */
  }

  .paper-actions {
    top: var(--space-xs); /* 调整浮动位置 */
    right: var(--space-xs);
    gap: 2px; /* 减小按钮间距 */
  }

  .action-btn {
    width: 28px; /* 缩小按钮尺寸 */
    height: 28px;
  }
}

@media (max-width: 480px) {
  .paper-card {
    min-height: 380px;
  }

  .paper-header {
    padding: var(--space-xs); /* 减少内边距 */
  }

  .badge-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
    flex-wrap: nowrap; /* 移动端使用垂直布局，不需要换行 */
    padding-right: 0; /* 移动端移除右边距 */
  }

  .paper-actions {
    position: static; /* 移动端恢复为正常文档流 */
    background: none;
    backdrop-filter: none;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
    align-self: flex-end;
    opacity: 1;
    transform: none;
    margin-top: var(--space-xs);
  }

  .action-btn {
    width: 32px; /* 移动端恢复正常尺寸 */
    height: 32px;
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
