<template>
  <div v-if="visible" class="confirm-dialog-overlay" @click="handleOverlayClick">
    <div class="confirm-dialog" @click.stop>
      <div class="confirm-dialog-header">
        <h3>{{ title }}</h3>
      </div>
      <div class="confirm-dialog-body">
        <p>{{ message }}</p>
      </div>
      <div class="confirm-dialog-footer">
        <button
          class="btn btn-secondary"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn btn-danger"
          @click="handleConfirm"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};

const handleOverlayClick = () => {
  if (!props.loading) {
    emit('close');
  }
};

// 处理ESC键关闭对话框
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible && !props.loading) {
    emit('close');
  }
};

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.2s ease-out;
}

.confirm-dialog-header {
  padding: 20px 20px 0;
  border-bottom: 1px solid #eee;
}

.confirm-dialog-header h3 {
  margin: 0 0 15px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.confirm-dialog-body {
  padding: 20px;
}

.confirm-dialog-body p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.confirm-dialog-footer {
  padding: 0 20px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #ebebeb;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .confirm-dialog {
    width: 95%;
    margin: 20px;
  }

  .confirm-dialog-header,
  .confirm-dialog-body,
  .confirm-dialog-footer {
    padding: 15px;
  }

  .confirm-dialog-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
