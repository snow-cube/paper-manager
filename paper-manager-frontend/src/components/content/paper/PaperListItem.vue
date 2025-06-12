<template>
  <div class="paper-list-item" @click="$emit('view', paper)">
    <!-- 左侧主要信息 -->
    <div class="item-main">
      <!-- 第一行：标题、类型 -->
      <div class="item-row-1">
        <div :class="['paper-type-indicator', paperTypeBadgeClass]">
          {{ isLiteratureType ? "📚" : "🎓" }}
        </div>
        <h4 class="item-title">{{ paper.title }}</h4>
      </div>
      <!-- 第二行：核心信息 -->
      <div class="item-row-2">
        <div class="meta-info">
          <span class="meta-item">
            <span class="meta-icon">👨‍💼</span>
            {{ authorsDisplay }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">📅</span>
            {{ yearDisplay }}
          </span>
          <span v-if="journalDisplay" class="meta-item">
            <span class="meta-icon">📖</span>
            {{ truncateText(journalDisplay, 25) }}
          </span>
          <span class="meta-item category">
            <span class="meta-icon">📂</span>
            {{ truncateText(categoriesDisplay, 20) }}
          </span>
          <!-- 可选的额外信息（在空间允许时显示） -->
          <span v-if="keywordList.length > 0" class="meta-item keywords">
            <span class="meta-icon">🏷️</span>
            {{ keywordList.slice(0, 2).join(", ")
            }}{{ keywordList.length > 2 ? "..." : "" }}
          </span>
          <span v-if="paper.doi" class="meta-item doi">
            <span class="meta-icon">🔗</span>
            {{ truncateText(paper.doi, 15) }}
          </span>
        </div>
      </div>
    </div>
    <!-- 右侧操作和状态 -->
    <div class="item-actions" @click.stop>
      <div class="date-team-row">
        <div v-if="paper.team_name || teamName" class="team-indicator">
          👥 {{ paper.team_name || teamName }}
        </div>
        <div class="item-date">
          <span class="date-text">{{ formatDate(paper.created_at) }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button
          @click="$emit('view', paper)"
          class="action-btn view-btn"
          title="查看详情"
        >
          👁️
        </button>
        <button
          v-if="paper.file_path"
          @click="handleDownload"
          class="action-btn download-btn"
          title="下载文件"
          :disabled="downloading"
        >
          {{ downloading ? "⏳" : "⬇️" }}
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useCategories } from "../../../composables/useCategories";
import { useCategoryEvents } from "../../../composables/useCategoryEvents";
import { useTeam } from "../../../composables/useTeam";
import {
  downloadItem,
  getDownloadFileName,
  triggerDownload,
} from "../../../services/downloadService";
import { useToast } from "../../../composables/useToast";

const props = defineProps({
  paper: { type: Object, required: true },
  paperType: { type: String, default: "papers" },
});

const emit = defineEmits(["view", "edit", "delete"]);

const { currentTeam } = useTeam();
const { getCategoryName, loadCategories } = useCategories();
const { onCategoryUpdate } = useCategoryEvents();
const { showToast } = useToast();

const downloading = ref(false);

// 计算属性
const isLiteratureType = computed(() => props.paperType === "literature");

const paperTypeBadgeClass = computed(() => ({
  literature: isLiteratureType.value,
  publication: !isLiteratureType.value,
}));

const teamName = computed(() => currentTeam.value?.name);

const authorsDisplay = computed(() => {
  if (!props.paper.authors) return "未知作者";

  // 处理字符串类型的作者信息
  if (typeof props.paper.authors === "string") {
    return props.paper.authors.length > 50
      ? props.paper.authors.substring(0, 50) + "..."
      : props.paper.authors;
  }

  // 处理数组类型的作者信息
  if (Array.isArray(props.paper.authors)) {
    if (props.paper.authors.length === 0) return "未知作者";
    if (props.paper.authors.length <= 2) {
      return props.paper.authors.join(", ");
    }
    return `${props.paper.authors[0]} 等 ${props.paper.authors.length} 人`;
  }

  // 其他类型转换为字符串
  return String(props.paper.authors);
});

const journalDisplay = computed(() => {
  const journal = props.paper.journal_name || props.paper.journal;
  if (!journal || journal === "未知期刊") return null;
  return journal;
});

const yearDisplay = computed(() => {
  if (props.paper.publication_year) {
    return props.paper.publication_year;
  }
  if (props.paper.publication_date) {
    return new Date(props.paper.publication_date).getFullYear();
  }
  return "未知年份";
});

const keywordList = computed(() => {
  if (!props.paper.keywords) return [];
  if (Array.isArray(props.paper.keywords)) {
    return props.paper.keywords;
  }
  if (typeof props.paper.keywords === "string") {
    return props.paper.keywords
      .split(/[,，;；\s]+/)
      .filter((k) => k.trim())
      .map((k) => k.trim());
  }
  return [];
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

    const categoryNames = props.paper.categories
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
      .filter((name) => name && name !== "未知分类");

    if (categoryNames.length === 0) return "未分类";
    if (categoryNames.length <= 2) {
      return categoryNames.join(", ");
    }
    return `${categoryNames[0]} 等 ${categoryNames.length} 个分类`;
  }

  return "未分类";
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "未知日期";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 文本截断工具函数
const truncateText = (text, maxLength) => {
  if (!text) return "";
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

// 下载处理
const handleDownload = async () => {
  if (!props.paper.file_path || downloading.value) return;

  downloading.value = true;
  try {
    const fileName = getDownloadFileName(props.paper);
    await downloadItem(props.paper.file_path, fileName);
    showToast("文件下载完成", "success");
  } catch (error) {
    console.error("下载失败:", error);
    showToast("文件下载失败，请稍后重试", "error");
  } finally {
    downloading.value = false;
  }
};

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

// 生命周期
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
</script>

<style scoped>
.paper-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-bottom: var(--space-sm);
  min-height: 80px; /* 确保两行高度 */
}

.paper-list-item:hover {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  background: linear-gradient(135deg, var(--white), var(--primary-25));
}

.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* 第一行：标题、类型 */
.item-row-1 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: nowrap;
  overflow: hidden;
}

.paper-type-indicator {
  flex-shrink: 0;
  font-size: 1em;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-100);
}

.paper-type-indicator.literature {
  background: var(--info-100);
}

.paper-type-indicator.publication {
  background: var(--success-100);
}

.item-title {
  flex: 1;
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* 日期和团队信息行 */
.date-team-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
  min-height: 20px;
}

.item-date {
  font-size: var(--text-xs);
  color: var(--color-text-soft);
  line-height: 1.2;
  min-width: 80px; /* 统一日期宽度 */
  text-align: right; /* 日期右对齐 */
}

.team-indicator {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--primary-200);
  white-space: nowrap;
}

/* 第二行：元信息 */
.item-row-2 {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
  overflow: hidden;
  max-height: 24px; /* 限制第二行高度 */
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--color-text-soft);
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.meta-item.category {
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--primary-200);
  flex-shrink: 0;
}

.meta-item.doi,
.meta-item.keywords {
  font-family: var(--font-mono);
  background: var(--gray-50);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius-sm);
  flex-shrink: 2; /* 这些项目可以更容易被压缩 */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 在空间不足时隐藏不重要的项目 */
@media (max-width: 1200px) {
  .meta-item.doi {
    display: none;
  }
}

@media (max-width: 900px) {
  .meta-item.keywords {
    display: none;
  }
}

.meta-icon {
  font-size: 0.85em;
  opacity: 0.8;
  flex-shrink: 0;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  flex-shrink: 0;
  justify-content: center;
  height: 100%;
  min-width: 120px; /* 确保操作区域有足够宽度 */
}

.action-buttons {
  display: flex;
  gap: 2px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
}

.view-btn {
  background: var(--info-100);
  color: var(--info-600);
}

.view-btn:hover {
  background: var(--info-200);
  transform: scale(1.05);
}

.download-btn {
  background: var(--success-100);
  color: var(--success-600);
}

.download-btn:hover:not(:disabled) {
  background: var(--success-200);
  transform: scale(1.05);
}

.edit-btn {
  background: var(--warning-100);
  color: var(--warning-600);
}

.edit-btn:hover {
  background: var(--warning-200);
  transform: scale(1.05);
}

.delete-btn {
  background: var(--danger-100);
  color: var(--danger-600);
}

.delete-btn:hover {
  background: var(--danger-200);
  transform: scale(1.05);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .paper-list-item {
    padding: var(--space-sm) var(--space-md);
    min-height: auto;
  }

  .item-row-1 {
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .item-title {
    font-size: var(--text-sm);
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    line-height: 1.4;
    word-break: break-word;
  }

  .meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .meta-item {
    font-size: 11px;
  }

  .item-actions {
    position: relative;
    align-items: center;
    min-width: 100px;
  }

  .date-team-row {
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .item-date {
    min-width: auto;
    text-align: right;
  }

  .action-buttons {
    gap: var(--space-xs);
  }

  .action-btn {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .paper-list-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
    padding: var(--space-sm);
  }

  .item-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-width: auto;
  }

  .date-team-row {
    flex-direction: row;
    justify-content: flex-start;
    flex: 1;
  }

  .action-buttons {
    gap: var(--space-sm);
  }
}
</style>
