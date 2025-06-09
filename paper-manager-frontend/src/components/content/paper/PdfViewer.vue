<template>
  <div class="pdf-viewer">
    <div v-if="loading" class="pdf-loading">
      <div class="loading-spinner"></div>
      <p>正在加载PDF文件...</p>
    </div>
    <div v-else-if="error" class="pdf-error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="tryAgain" class="btn btn-primary">
        <span class="btn-icon">🔄</span>
        重试
      </button>
    </div>
    <iframe v-else :src="pdfUrl" class="pdf-frame" allowfullscreen></iframe>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const loading = ref(true);
const error = ref(null);
const pdfUrl = ref("");

const loadPdf = async () => {
  if (!props.url) {
    error.value = "未提供PDF文件地址";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // 实际应用中，这里可能需要处理跨域问题或通过后端API获取文件
    // 如果是直接显示PDF，可以使用PDF.js等库进行渲染
    // 这里简单地将URL传递给iframe
    pdfUrl.value = props.url;

    loading.value = false;
  } catch (err) {
    console.error("加载PDF失败:", err);
    error.value = "加载PDF失败，请重试";
    loading.value = false;
  }
};

const tryAgain = () => {
  loadPdf();
};

onMounted(() => {
  loadPdf();
});

watch(
  () => props.url,
  (newUrl) => {
    if (newUrl !== pdfUrl.value) {
      loadPdf();
    }
  }
);
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  display: block;
}

.pdf-loading,
.pdf-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.pdf-error p {
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
