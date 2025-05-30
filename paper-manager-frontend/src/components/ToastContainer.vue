<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✅</span>
            <span v-else-if="toast.type === 'error'">❌</span>
            <span v-else-if="toast.type === 'warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="toast-content">
            <h4 v-if="toast.title" class="toast-title">{{ toast.title }}</h4>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button
            class="toast-close"
            @click.stop="removeToast(toast.id)"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 400px;
  margin-bottom: 0.75rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.toast-success {
  background: rgba(34, 197, 94, 0.95);
  border: 1px solid var(--success-200);
  color: var(--white);
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  border: 1px solid var(--error-200);
  color: var(--white);
}

.toast-warning {
  background: rgba(245, 158, 11, 0.95);
  border: 1px solid var(--warning-200);
  color: var(--white);
}

.toast-info {
  background: rgba(59, 130, 246, 0.95);
  border: 1px solid var(--primary-200);
  color: var(--white);
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
  color: inherit;
}

.toast-message {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
  color: inherit;
  opacity: 0.95;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  opacity: 0.8;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.2);
  opacity: 1;
}

/* 动画效果 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }

  .toast {
    max-width: none;
    margin-bottom: 0.5rem;
  }
}
</style>
