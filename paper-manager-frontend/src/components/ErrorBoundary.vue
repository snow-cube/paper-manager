<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">出现了一个错误</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="btn btn-primary" :disabled="retrying">
          <span v-if="retrying" class="loading-spinner"></span>
          重试
        </button>
        <button @click="reload" class="btn btn-secondary">刷新页面</button>
      </div>
      <details v-if="errorDetails" class="error-details">
        <summary>错误详情</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from "vue";
import { useToast } from "../composables/useToast";

const props = defineProps({
  fallbackMessage: {
    type: String,
    default: "应用程序遇到了意外错误",
  },
  showDetails: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["error", "retry"]);

const { showToast } = useToast();

const hasError = ref(false);
const errorMessage = ref("");
const errorDetails = ref("");
const retrying = ref(false);

const handleError = (error, instance, info) => {
  hasError.value = true;
  errorMessage.value = error.message || props.fallbackMessage;

  if (props.showDetails) {
    errorDetails.value = `${error.stack}\n\nComponent Info: ${info}`;
  }

  // 发送错误事件
  emit("error", { error, instance, info });

  // 显示错误通知
  showToast("应用程序出现错误", "error");

  console.error("Error Boundary caught an error:", error, info);

  return false; // 阻止错误继续传播
};

const retry = async () => {
  retrying.value = true;

  try {
    // 触发重试事件
    emit("retry");

    // 模拟一个短暂的延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 重置错误状态
    hasError.value = false;
    errorMessage.value = "";
    errorDetails.value = "";

    showToast("重试成功", "success");
  } catch (error) {
    console.error("Retry failed:", error);
    showToast("重试失败，请稍后再试", "error");
  } finally {
    retrying.value = false;
  }
};

const reload = () => {
  window.location.reload();
};

// 捕获错误
onErrorCaptured(handleError);

// 全局错误处理
const setupGlobalErrorHandler = () => {
  window.addEventListener("error", (event) => {
    handleError(event.error, null, "Global error handler");
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleError(event.reason, null, "Unhandled promise rejection");
  });
};

// 在组件挂载时设置全局错误处理
setupGlobalErrorHandler();
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
}

.error-container {
  max-width: 500px;
  text-align: center;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #fee;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.error-message {
  color: #666;
  margin-bottom: var(--space-lg);
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.btn {
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  color: var(--white);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--gray-600);
  color: var(--white);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--gray-700);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-details {
  text-align: left;
  margin-top: var(--space-md);
}

.error-details summary {
  cursor: pointer;
  color: #007bff;
  font-weight: 500;
  margin-bottom: var(--space-sm);
}

.error-details pre {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: var(--space-md);
  font-size: var(--text-xs);
  color: #495057;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .error-boundary {
    padding: var(--space-md);
  }

  .error-container {
    padding: var(--space-lg);
  }

  .error-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
