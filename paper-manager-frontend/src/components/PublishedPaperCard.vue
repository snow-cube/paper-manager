<template>
  <div class="published-paper-card">
    <div class="paper-header">
      <div class="paper-type-badge published">
        <span class="badge-icon">🎓</span>
        发表论文
      </div>
      <div class="paper-actions">
        <button @click="$emit('view', paper)" class="action-btn view-btn" title="查看详情">
          👁️
        </button>
        <button @click="$emit('edit', paper)" class="action-btn edit-btn" title="编辑">
          ✏️
        </button>
        <button @click="$emit('delete', paper)" class="action-btn delete-btn" title="删除">
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
          <span class="meta-value impact-factor">{{ paper.impact_factor }}</span>
        </div>
      </div>

      <div v-if="paper.abstract" class="paper-abstract">
        {{ truncatedAbstract }}
        <span v-if="paper.abstract.length > 150" class="read-more">... 查看更多</span>
      </div>

      <div v-if="paper.keywords" class="paper-keywords">
        <span
          v-for="keyword in keywordList"
          :key="keyword"
          class="keyword-tag"
        >
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
import { computed } from 'vue';
import { useCategories } from '../composables/useCategories';

const props = defineProps({
  paper: {
    type: Object,
    required: true
  }
});

defineEmits(['edit', 'delete', 'view']);

const { getCategoryName } = useCategories();

const truncatedAbstract = computed(() => {
  if (!props.paper.abstract) return '';
  return props.paper.abstract.length > 150
    ? props.paper.abstract.substring(0, 150)
    : props.paper.abstract;
});

const keywordList = computed(() => {
  if (!props.paper.keywords) return [];
  return props.paper.keywords.split(',').map(k => k.trim()).slice(0, 5);
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.published-paper-card {
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.published-paper-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--white);
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

.action-btn {
  background: transparent;
  border: none;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-bg-soft);
  transform: scale(1.1);
}

.view-btn:hover {
  background: rgba(45, 91, 255, 0.1);
}

.edit-btn:hover {
  background: rgba(255, 193, 7, 0.1);
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
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
  overflow: hidden;
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
  font-size: 0.85rem;
  color: var(--color-text-soft);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.read-more {
  color: var(--color-primary);
  font-weight: 500;
}

.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.keyword-tag {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.paper-footer {
  padding: 0.75rem 1.5rem;
  background: var(--color-bg-soft);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.paper-category,
.paper-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-soft);
}

.category-icon,
.date-icon {
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .published-paper-card {
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
