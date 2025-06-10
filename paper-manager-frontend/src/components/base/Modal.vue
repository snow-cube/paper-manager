<template>  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" :class="`modal-${size}`" ref="modalContent">
      <!-- 可选的进度条 - 固定在modal顶部 -->
      <div v-if="showProgress" class="modal-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progress + '%' }"
            :class="{
              'progress-low': progress < 50,
              'progress-medium': progress >= 50 && progress < 80,
              'progress-high': progress >= 80
            }"
          ></div>
        </div>
      </div>

      <button class="modal-close" @click="$emit('close')" title="关闭">
        ✕
      </button>

      <div class="modal-slot-wrapper" :class="{ 'has-progress': showProgress }">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  size: {
    type: String,
    default: "large",
    validator: (value) => ["small", "medium", "large"].includes(value)
  }
});

const emit = defineEmits(["close"]);

const modalContent = ref(null);

const handleOverlayClick = (event) => {
  if (event.target.classList.contains("modal-overlay")) {
    emit("close");
  }
};

const handleEscapeKey = (event) => {
  if (event.key === "Escape") {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
  document.body.style.overflow = "hidden";

  // 聚焦到模态框内容，以便键盘导航
  if (modalContent.value) {
    modalContent.value.focus();
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
  document.body.style.overflow = "";
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
  backdrop-filter: blur(8px);
  animation: fadeIn var(--transition-normal);
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  position: relative;
  width: 1200px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: modalEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

/* 模态框尺寸变体 */
.modal-small {
  width: 400px;
  max-width: 85vw;
}

.modal-medium {
  width: 600px;
  max-width: 85vw;
}

.modal-large {
  width: 1200px;
  max-width: 90vw;
}

.modal-progress {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 4px;
  z-index: 12;
  background: var(--white);
  backdrop-filter: blur(8px);
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
  box-shadow: 0 12px 40px rgba(125, 108, 192, 0.2);
  margin-bottom: 0;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--white);
  overflow: hidden;
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.progress-fill {
  height: 100%;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-low {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.progress-medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-high {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.modal-slot-wrapper {
  position: relative;
}

.modal-slot-wrapper.has-progress {
  margin-top: -4px; /* 让内容紧贴进度条 */
}

.modal-close {
  position: sticky;
  top: var(--space-lg);
  right: var(--space-lg);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--primary-200);
  width: var(--space-2xl);
  height: var(--space-2xl);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--text-lg);
  color: var(--primary-600);
  transition: all var(--transition-normal);
  z-index: 13;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  float: right;
  margin-right: var(--space-lg);
  margin-top: var(--space-lg);
  margin-bottom: calc(-1 * var(--space-2xl) - var(--space-lg));
}

.modal-close:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--primary-800);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

@keyframes modalEnter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-sm);
  }

  .modal-content,
  .modal-small,
  .modal-medium,
  .modal-large {
    width: auto;
    max-width: 95vw;
    max-height: 95vh;
  }.modal-close {
    top: var(--space-md);
    margin-right: var(--space-md);
    margin-top: var(--space-md);
    width: var(--space-xl);
    height: var(--space-xl);
    font-size: var(--text-base);
    margin-bottom: calc(-1 * var(--space-xl) - var(--space-md));
  }
}

@media (max-width: 480px) {
  .modal-close {
    top: var(--space-sm);
    margin-right: var(--space-sm);
    margin-top: var(--space-sm);
    width: 3rem;
    height: 3rem;
    font-size: var(--text-lg);
    margin-bottom: calc(-3rem - var(--space-sm));
  }
}
</style>
