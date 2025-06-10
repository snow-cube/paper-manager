<template>
  <div class="standard-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="page-icon">{{ icon }}</span>
          {{ title }}
        </h1>
        <p v-if="description" class="page-description">
          {{ description }}
        </p>
      </div>

      <!-- 页面控制器（可选） -->
      <div v-if="$slots.controls" class="page-controls">
        <slot name="controls"></slot>
      </div>
    </div>

    <!-- 警告信息（可选） -->
    <div v-if="$slots.warning" class="page-warning">
      <slot name="warning"></slot>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.standard-page {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.page-header {
  background: linear-gradient(135deg, var(--white), var(--primary-25));
  border-bottom: 1px solid var(--primary-100);
  padding: var(--space-xl) var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  text-align: center;
  margin-bottom: var(--space-md);
}

.page-title {
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 var(--space-sm) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-icon {
  font-size: 1.2em;
  filter: none;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: var(--text-lg);
  color: var(--color-text);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.page-controls {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  padding: var(--space-md);
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

.page-warning {
  max-width: 1600px;
  margin: 0 auto var(--space-lg) auto;
  padding: 0 var(--space-lg);
}

.page-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--space-lg) var(--space-xl) var(--space-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: var(--space-lg) var(--space-md);
  }

  .page-title {
    font-size: var(--text-xl);
    flex-direction: column;
    gap: var(--space-sm);
  }

  .page-description {
    font-size: var(--text-base);
  }

  .page-controls {
    padding: var(--space-sm);
    margin: 0 var(--space-md);
  }

  .page-content {
    padding: 0 var(--space-md) var(--space-lg) var(--space-md);
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: var(--space-md) var(--space-sm);
  }

  .page-content {
    padding: 0 var(--space-sm) var(--space-md) var(--space-sm);
  }
}
</style>
