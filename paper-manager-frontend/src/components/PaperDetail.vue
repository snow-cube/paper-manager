<template>
  <div class="paper-detail">
    <div class="detail-header">
      <div class="paper-type-badge" :class="paper.paper_type">
        <span class="badge-icon">{{ paper.paper_type === 'published' ? '🎓' : '📚' }}</span>
        {{ paper.paper_type === 'published' ? '发表论文' : '文献' }}
      </div>
      <h1 class="paper-title">{{ paper.title }}</h1>
    </div>

    <div class="detail-content">
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>作者：</label>
            <span>{{ paper.authors }}</span>
          </div>

          <div v-if="paper.journal" class="info-item">
            <label>期刊：</label>
            <span class="journal">{{ paper.journal }}</span>
          </div>

          <div class="info-item">
            <label>发表年份：</label>
            <span>{{ paper.year }}</span>
          </div>

          <div v-if="paper.volume" class="info-item">
            <label>卷号：</label>
            <span>{{ paper.volume }}</span>
          </div>

          <div v-if="paper.pages" class="info-item">
            <label>页码：</label>
            <span>{{ paper.pages }}</span>
          </div>

          <div v-if="paper.doi" class="info-item">
            <label>DOI：</label>
            <span class="doi">{{ paper.doi }}</span>
          </div>

          <div v-if="paper.impact_factor" class="info-item">
            <label>影响因子：</label>
            <span class="impact-factor">{{ paper.impact_factor }}</span>
          </div>

          <div class="info-item">
            <label>分类：</label>
            <span class="category">{{ getCategoryName(paper.category_id) }}</span>
          </div>
        </div>
      </div>

      <div v-if="paper.abstract" class="detail-section">
        <h3 class="section-title">摘要</h3>
        <div class="abstract-content">
          {{ paper.abstract }}
        </div>
      </div>

      <div v-if="paper.keywords" class="detail-section">
        <h3 class="section-title">关键词</h3>
        <div class="keywords-container">
          <span
            v-for="keyword in keywordList"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <div v-if="paper.notes" class="detail-section">
        <h3 class="section-title">笔记</h3>
        <div class="notes-content">
          {{ paper.notes }}
        </div>
      </div>

      <div v-if="paper.url" class="detail-section">
        <h3 class="section-title">链接</h3>
        <div class="url-container">
          <a :href="paper.url" target="_blank" class="paper-url">
            {{ paper.url }}
            <span class="external-icon">🔗</span>
          </a>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">元数据</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <label>创建时间：</label>
            <span>{{ formatDate(paper.created_at) }}</span>
          </div>
          <div v-if="paper.updated_at" class="metadata-item">
            <label>更新时间：</label>
            <span>{{ formatDate(paper.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-actions">
      <button @click="$emit('edit', paper)" class="btn btn-primary">
        ✏️ 编辑
      </button>
      <button @click="$emit('close')" class="btn btn-secondary">
        关闭
      </button>
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

defineEmits(['edit', 'close']);

const { getCategoryName } = useCategories();

const keywordList = computed(() => {
  if (!props.paper.keywords) return [];
  return props.paper.keywords.split(',').map(k => k.trim());
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.paper-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.paper-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.paper-type-badge.published {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--white);
}

.paper-type-badge.literature {
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  color: var(--white);
}

.badge-icon {
  font-size: 1rem;
}

.paper-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.detail-content {
  margin-bottom: 2rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 600;
  color: var(--color-text-soft);
  min-width: 80px;
  flex-shrink: 0;
}

.info-item span {
  color: var(--color-text);
  word-break: break-word;
}

.journal {
  font-weight: 600;
  color: var(--color-primary);
}

.doi {
  font-family: monospace;
  font-size: 0.9rem;
  background: var(--color-bg-soft);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.impact-factor {
  font-weight: 600;
  color: #e67e22;
}

.category {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.abstract-content {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg-soft);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--color-primary);
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
}

.notes-content {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
  background: #fff9e6;
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border-left: 4px solid #f39c12;
}

.url-container {
  padding: 1rem;
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
}

.paper-url {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  word-break: break-all;
}

.paper-url:hover {
  text-decoration: underline;
}

.external-icon {
  font-size: 0.9rem;
  opacity: 0.7;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.metadata-item label {
  font-weight: 600;
  color: var(--color-text-soft);
  min-width: 80px;
}

.metadata-item span {
  color: var(--color-text);
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--color-bg-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

@media (max-width: 768px) {
  .paper-detail {
    padding: 1rem;
  }

  .paper-title {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
