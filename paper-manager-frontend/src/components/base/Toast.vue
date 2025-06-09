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
      <button class="toast-close" @click="close" aria-label="关闭">×</button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["success", "error", "warning", "info"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 4000,
  },
  closable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close"]);

const visible = ref(true);
const show = ref(false);
let timer = null;

const close = () => {
  show.value = false;
  setTimeout(() => {
    visible.value = false;
    emit("close");
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
  top: var(--space-xl);
  right: var(--space-xl);
  max-width: 400px;
  min-width: 300px;
  padding: var(--space-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  cursor: pointer;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid;
  backdrop-filter: blur(8px);
}

.toast-show {
  transform: translateX(0);
  opacity: 1;
}

.toast-success {
  background: linear-gradient(to right, var(--success-50), var(--white));
  border-color: var(--success-200);
  color: var(--success-800);
}

.toast-error {
  background: linear-gradient(to right, var(--error-50), var(--white));
  border-color: var(--error-200);
  color: var(--error-800);
}

.toast-warning {
  background: linear-gradient(to right, var(--warning-50), var(--white));
  border-color: var(--warning-200);
  color: var(--warning-800);
}

.toast-info {
  background: linear-gradient(to right, var(--primary-50), var(--white));
  border-color: var(--primary-200);
  color: var(--primary-800);
}

.toast-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
  margin-top: var(--space-xs);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: var(--text-sm);
  font-weight: 600;
  margin: 0 0 var(--space-xs) 0;
  line-height: 1.4;
}

.toast-message {
  font-size: var(--text-sm);
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(125, 108, 192, 0.08);
  font-size: var(--text-xl);
  font-weight: bold;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: all var(--transition-normal);
  padding: 0;
  width: var(--space-lg);
  height: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.toast-close:hover {
  opacity: 1;
  background: rgba(125, 108, 192, 0.08);
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .toast {
    top: var(--space-md);
    right: var(--space-md);
    left: var(--space-md);
    max-width: none;
    min-width: auto;
  }
}
</style>
