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
import { ref, onMounted, onUnmounted } from "vue";

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
  background: rgba(125, 108, 192, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 12px 40px rgba(125, 108, 192, 0.2);
  position: relative;
  width: 900px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  animation: modalEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  border: 1px solid var(--primary-200);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--primary-600);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.08);
}

.modal-close:hover {
  background: var(--primary-100);
  color: var(--primary-800);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(125, 108, 192, 0.15);
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
    padding: 0.5rem;
  }
  .modal-content {
    width: auto;
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
