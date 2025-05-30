<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="toast"
      :class="[`toast-${type}`, { 'toast-show': show }]"
      @click="close"
    >
      <div class="toast-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-else-if="type === 'error'">❌</span>
        <span v-else-if="type === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="toast-content">
        <h4 v-if="title" class="toast-title">{{ title }}</h4>
        <p class="toast-message">{{ message }}</p>
      </div>
      <button class="toast-close" @click="close" aria-label="关闭">
        ×
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 4000
  },
  closable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const visible = ref(true);
const show = ref(false);
let timer = null;

const close = () => {
  show.value = false;
  setTimeout(() => {
    visible.value = false;
    emit('close');
  }, 300);
};

onMounted(() => {
  // 触发显示动画
  setTimeout(() => {
    show.value = true;
  }, 10);

  // 自动关闭
  if (props.duration > 0) {
    timer = setTimeout(close, props.duration);
  }
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  max-width: 400px;
  min-width: 300px;
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s ease;
  border: 1px solid;
}

.toast-show {
  transform: translateX(0);
  opacity: 1;
}

.toast-success {
  background: var(--success-50);
  border-color: var(--success-200);
  color: var(--success-800);
}

.toast-error {
  background: var(--error-50);
  border-color: var(--error-200);
  color: var(--error-800);
}

.toast-warning {
  background: var(--warning-50);
  border-color: var(--warning-200);
  color: var(--warning-800);
}

.toast-info {
  background: var(--primary-50);
  border-color: var(--primary-200);
  color: var(--primary-800);
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
}

.toast-message {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
    min-width: auto;
  }
}
</style>
