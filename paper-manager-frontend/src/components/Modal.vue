<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" ref="modalContent">
      <button class="modal-close" @click="$emit('close')" title="关闭">
        ✕
      </button>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['close']);

const modalContent = ref(null);

const handleOverlayClick = (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    emit('close');
  }
};

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
  document.body.style.overflow = 'hidden';

  // 聚焦到模态框内容，以便键盘导航
  if (modalContent.value) {
    modalContent.value.focus();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  document.body.style.overflow = '';
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
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: modalEnter 0.3s ease-out;
  outline: none;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-bg-soft);
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--color-text-soft);
  transition: all 0.2s;
  z-index: 1;
}

.modal-close:hover {
  background: var(--color-border);
  color: var(--color-text);
  transform: scale(1.1);
}

@keyframes modalEnter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
}
</style>
