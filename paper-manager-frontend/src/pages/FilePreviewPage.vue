<template>
  <div class="file-preview-page">
    <!-- 调试信息 -->
    <div
      v-if="false"
      class="debug-info"
      style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        z-index: 9999;
        font-size: 12px;
      "
    >
      <div>路由: {{ route.path }}</div>
      <div>查询参数: {{ JSON.stringify(route.query) }}</div>
      <div>加载中: {{ loading }}</div>
      <div>错误: {{ error }}</div>
      <div>文件URL: {{ fileUrl }}</div>
      <div>文件名: {{ fileName }}</div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载文件预览...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="btn btn-primary">重试</button>
    </div>

    <div v-else class="preview-container">
      <FilePreview
        :file-url="fileUrl"
        :file-name="fileName"
        :file-size="fileSize"
        :last-modified="lastModified"
        @close="closeWindow"
        @download="handleDownload"
        @load="handleLoad"
        @error="handleError"
        class="standalone-preview"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { FilePreview } from "@/components/content/paper";

const route = useRoute();

// 状态管理
const loading = ref(true);
const error = ref(null);

// 文件信息
const fileUrl = ref("");
const fileName = ref("");
const fileSize = ref(null);
const lastModified = ref(null);

// 初始化
const initializePreview = async () => {
  try {
    console.log("FilePreviewPage - 开始初始化预览");
    console.log("FilePreviewPage - 当前路由:", route.fullPath);
    console.log("FilePreviewPage - 查询参数:", route.query);

    // 从URL参数获取文件信息
    const params = route.query;

    if (!params.fileUrl) {
      throw new Error("缺少文件URL参数");
    }

    fileUrl.value = params.fileUrl;
    fileName.value = params.fileName || "未知文件";
    fileSize.value = params.fileSize ? Number(params.fileSize) : null;
    lastModified.value = params.lastModified || null;
    console.log("FilePreviewPage - 文件信息:", {
      fileUrl: fileUrl.value,
      fileName: fileName.value,
      fileSize: fileSize.value,
      lastModified: lastModified.value,
    });

    console.log("FilePreviewPage - 文件扩展名分析:", {
      fileName: fileName.value,
      extension: fileName.value.split(".").pop()?.toLowerCase(),
      isPdf: fileName.value.toLowerCase().endsWith(".pdf"),
    });

    loading.value = false;

    // 设置窗口标题
    document.title = `文件预览 - ${fileName.value}`;
    console.log("FilePreviewPage - 初始化完成");
  } catch (err) {
    console.error("FilePreviewPage - 初始化预览失败:", err);
    error.value = err.message;
    loading.value = false;
  }
};

// 事件处理
const closeWindow = () => {
  window.close();
};

const handleDownload = (data) => {
  console.log("文件下载:", data);
  // 可以在这里添加下载跟踪或通知
};

const handleLoad = (data) => {
  console.log("预览加载完成:", data);
};

const handleError = (errorData) => {
  console.error("预览错误:", errorData);
  if (errorData.type === "popup-blocked") {
    // 在独立窗口中不需要处理弹窗被阻止的情况
    return;
  }
  error.value = errorData.message || "预览时发生未知错误";
};

const retry = () => {
  error.value = null;
  loading.value = true;
  setTimeout(initializePreview, 100);
};

// 生命周期
onMounted(() => {
  // 添加特殊类名到 body，使样式仅在此页面生效
  document.body.classList.add("file-preview-page-active");

  initializePreview();
  // 监听窗口关闭事件
  window.addEventListener("beforeunload", () => {
    // 清理类名
    document.body.classList.remove("file-preview-page-active");
  });

  // 键盘快捷键
  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      closeWindow();
    }
  };

  document.addEventListener("keydown", handleKeydown); // 清理
  return () => {
    document.removeEventListener("keydown", handleKeydown);
    // 确保在组件卸载时移除类名
    document.body.classList.remove("file-preview-page-active");
  };
});

// 组件卸载时的清理
onUnmounted(() => {
  document.body.classList.remove("file-preview-page-active");
});
</script>

<style>
/* 仅在独立预览页面中应用的全局样式 */
.file-preview-page-active body {
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.file-preview-page-active html {
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.file-preview-page-active #app {
  margin: 0 !important;
  padding: 0 !important;
}
</style>

<style scoped>
/* 重置全局样式以确保完全控制 */
.file-preview-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gray-50, #f9fafb);
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.loading-container,
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.error-container h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1.5rem;
}

.error-container p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  max-width: 400px;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 确保flex子项可以收缩 */
}

.standalone-preview {
  flex: 1;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  min-height: 0; /* 确保flex子项可以收缩 */
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-container,
  .error-container {
    padding: 1rem;
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-container h3 {
    font-size: 1.25rem;
  }
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 全屏样式优化 */
:deep(.file-preview) {
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
  background: #f9fafb;
}

:deep(.preview-header) {
  border-radius: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(248, 250, 252, 0.9)
  );
  border-bottom: 1px solid #e5e7eb;
}

:deep(.preview-content) {
  flex: 1;
  overflow: hidden;
}

:deep(.preview-actions) {
  gap: 0.75rem;
}

/* 隐藏新标签页按钮在独立窗口中 */
:deep(.new-window-btn) {
  display: none;
}

/* 确保PDF查看器和其他内容正确适应全屏 */
:deep(.pdf-viewer),
:deep(.image-preview-container),
:deep(.text-preview-container),
:deep(.office-preview-container) {
  height: 100%;
  flex: 1;
}

/* 图片查看器在全屏模式下的调整 */
:deep(.image-viewer) {
  height: 100%;
  overflow: auto;
}

/* 文本查看器在全屏模式下的调整 */
:deep(.text-viewer) {
  height: 100%;
  overflow: auto;
}

:deep(.text-content) {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}
</style>
