<template>
  <div class="published-paper-card">
    <div class="paper-header">
      <div class="paper-type-badge published">
        <span class="badge-icon">🎓</span>
        发表论文
      </div>
      <div class="paper-actions">
        <button
          @click="$emit('view', paper)"
          class="action-btn view-btn"
          title="查看详情"
        >
          👁️
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
      <h3 class="paper-title">{{ paper.title }}</h3>

      <div class="paper-meta">
        <div class="meta-item">
          <span class="meta-label">作者:</span>
          <span class="meta-value">{{ paper.authors }}</span>
        </div>

        <div v-if="paper.journal" class="meta-item">
          <span class="meta-label">期刊:</span>
          <span class="meta-value journal">{{ paper.journal }}</span>
        </div>

        <div v-if="paper.volume || paper.pages" class="meta-item">
          <span class="meta-label">卷页:</span>
          <span class="meta-value">
            <template v-if="paper.volume">Vol. {{ paper.volume }}</template>
            <template v-if="paper.volume && paper.pages">, </template>
            <template v-if="paper.pages">pp. {{ paper.pages }}</template>
          </span>
        </div>

        <div class="meta-item">
          <span class="meta-label">发表年份:</span>
          <span class="meta-value year">{{ paper.year }}</span>
        </div>

        <div v-if="paper.impact_factor" class="meta-item">
          <span class="meta-label">影响因子:</span>
          <span class="meta-value impact-factor">{{
            paper.impact_factor
          }}</span>
        </div>
      </div>

      <div v-if="paper.abstract" class="paper-abstract">
        {{ truncatedAbstract }}
        <span v-if="paper.abstract.length > 150" class="read-more"
          >... 查看更多</span
        >
      </div>

      <div v-if="paper.keywords" class="paper-keywords">
        <span v-for="keyword in keywordList" :key="keyword" class="keyword-tag">
          {{ keyword }}
        </span>
      </div>
    </div>

    <div class="paper-footer">
      <div class="paper-category">
        <span class="category-icon">🏷️</span>
        {{ getCategoryName(paper.category_id) }}
      </div>
      <div class="paper-date">
        <span class="date-icon">📅</span>
        {{ formatDate(paper.created_at) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useCategories } from "../composables/useCategories";

const props = defineProps({
  paper: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "delete", "view"]);

const { getCategoryName } = useCategories();

const truncatedAbstract = computed(() => {
  if (!props.paper.abstract) return "";
  return props.paper.abstract.length > 150
    ? props.paper.abstract.substring(0, 150)
    : props.paper.abstract;
});

const keywordList = computed(() => {
  if (!props.paper.keywords) return [];
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
</script>

<style scoped>
.published-paper-card {
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 6px rgba(125, 108, 192, 0.04);
}

.published-paper-card:hover {
  transform: translateY(-3px);
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

.paper-type-badge.published {
  background: linear-gradient(
    135deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  color: var(--white);
  box-shadow: 0 3px 8px rgba(125, 108, 192, 0.15);
}

.badge-icon {
  font-size: 0.8rem;
}

.paper-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.published-paper-card:hover .paper-actions {
  opacity: 1;
}

.view-btn:hover {
  background: rgba(125, 108, 192, 0.08);
}

.edit-btn:hover {
  background: rgba(125, 108, 192, 0.06);
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.08);
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.08);
}

.paper-content {
  padding: 0 var(--space-lg) var(--space-md);
  cursor: pointer;
}

.paper-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);  margin: 0 0 var(--space-md) 0;
  line-height: 1.4;
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 2;
  -moz-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  /* Fallback for browsers that don't support line-clamp */
  max-height: calc(1.4em * 2); /* line-height * number of lines */
}

.paper-meta {
  margin-bottom: var(--space-md);
}

.meta-item {
  display: flex;
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
}

.meta-label {
  color: var(--color-text-soft);
  min-width: 70px;
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

.meta-value.impact-factor {
  font-weight: 600;
  color: #e67e22;
}

.paper-abstract {
  font-size: var(--text-sm);
  color: var(--color-text-soft);
  line-height: 1.5;
  margin-bottom: var(--space-md);
}

.read-more {
  color: var(--color-primary);
  font-weight: 500;
}

.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.keyword-tag {
  background: var(--primary-50);
  color: var(--primary-700);
  padding: var(--space-xs) var(--space-md);
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid var(--primary-200);
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.08);
}

.keyword-tag:hover {
  background: var(--primary-100);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(125, 108, 192, 0.12);
}

.paper-footer {
  padding: var(--space-md) var(--space-lg);
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
  font-size: var(--text-sm);
  backdrop-filter: blur(4px);
}

.paper-category,
.paper-date {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-soft);
}

.category-icon,
.date-icon {
  font-size: var(--text-sm);
}

@media (max-width: 480px) {
  .published-paper-card {
    margin-bottom: var(--space-md);
  }

  .paper-header {
    padding: var(--space-md) var(--space-md) var(--space-sm);
  }

  .paper-content {
    padding: 0 var(--space-md) var(--space-md);
  }

  .paper-footer {
    padding: var(--space-md) var(--space-md);
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .paper-actions {
    opacity: 1;
  }
}
</style>
