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
import { useToast } from "../../composables/useToast.js";

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-md);
  right: var(--space-md);
  z-index: 1000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  max-width: 400px;
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
  pointer-events: auto;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  color: inherit;
}

.toast-message {
  font-size: var(--text-sm);
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
  font-size: var(--text-xl);
  padding: 0;
  width: var(--space-lg);
  height: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color var(--transition-normal);
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
  transition: all var(--transition-normal);
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
  transition: transform var(--transition-normal);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toast-container {
    top: var(--space-sm);
    right: var(--space-sm);
    left: var(--space-sm);
  }

  .toast {
    max-width: none;
    margin-bottom: var(--space-sm);
  }
}
</style>
