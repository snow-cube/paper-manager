<template>
  <div class="standard-warning">
    <div class="warning-content">
      <div class="warning-icon">{{ icon }}</div>
      <h3 class="warning-title">{{ title }}</h3>
      <p class="warning-message">{{ message }}</p>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '⚠️'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // warning, error, info
    validator: (value) => ['warning', 'error', 'info'].includes(value)
  }
})
</script>

<style scoped>
.standard-warning {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--warning-200);
  overflow: hidden;
}

.warning-content {
  text-align: center;
  padding: var(--space-4xl) var(--space-2xl);
  background: linear-gradient(135deg, var(--warning-25), var(--color-background-soft));
}

.warning-icon {
  font-size: var(--space-4xl);
  margin-bottom: var(--space-lg);
  display: block;
}

.warning-title {
  color: var(--warning-700);
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-xl);
  font-weight: 600;
}

.warning-message {
  color: var(--color-text);
  margin: 0 0 var(--space-xl) 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .warning-content {
    padding: var(--space-2xl) var(--space-lg);
  }

  .warning-icon {
    font-size: var(--space-3xl);
  }

  .warning-title {
    font-size: var(--text-lg);
  }

  .warning-message {
    font-size: var(--text-sm);
  }
}
</style>
