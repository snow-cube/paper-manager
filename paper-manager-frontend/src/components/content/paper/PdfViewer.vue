<template>
  <div class="pdf-viewer">
    <!-- 控制栏 -->
    <div v-if="!loading && !error" class="pdf-controls">
      <div class="control-group">
        <button
          @click="previousPage"
          :disabled="currentPage <= 1"
          class="control-btn"
        >
          <span class="btn-icon">⬅️</span>
          上一页
        </button>
        <span class="page-info">
          第
          <input
            v-model.number="currentPage"
            @keyup.enter="goToPage"
            @blur="goToPage"
            type="number"
            min="1"
            :max="totalPages"
            class="page-input"
          />
          页 / 共 {{ totalPages }} 页
        </span>
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="control-btn"
        >
          <span class="btn-icon">➡️</span>
          下一页
        </button>
      </div>

      <div class="control-group">
        <button @click="zoomOut" :disabled="scale <= 0.5" class="control-btn">
          <span class="btn-icon">🔍-</span>
          缩小
        </button>
        <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" :disabled="scale >= 3" class="control-btn">
          <span class="btn-icon">🔍+</span>
          放大
        </button>
        <button @click="resetZoom" class="control-btn">
          <span class="btn-icon">↻</span>
          重置
        </button>
      </div>

      <div class="control-group">
        <button @click="rotateLeft" class="control-btn">
          <span class="btn-icon">↶</span>
          逆转
        </button>
        <button @click="rotateRight" class="control-btn">
          <span class="btn-icon">↷</span>
          顺转
        </button>
        <button @click="toggleFullscreen" class="control-btn">
          <span class="btn-icon">{{ isFullscreen ? "⛶" : "⛶" }}</span>
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="pdf-loading">
      <div class="loading-spinner"></div>
      <div class="loading-content">
        <p>正在加载PDF文件...</p>
        <div class="loading-progress">
          <div
            class="progress-bar"
            :style="{ width: loadingProgress + '%' }"
          ></div>
        </div>
        <p class="loading-detail">{{ loadingDetail }}</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="pdf-error">
      <div class="error-icon">⚠️</div>
      <h3>PDF加载失败</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="tryAgain" class="btn btn-primary">
          <span class="btn-icon">🔄</span>
          重新加载
        </button>
        <button @click="downloadFallback" class="btn btn-secondary">
          <span class="btn-icon">⬇️</span>
          下载文件
        </button>
      </div>
    </div>
    <!-- PDF容器 -->
    <div
      v-show="!loading && !error"
      ref="pdfContainer"
      class="pdf-container"
      :class="{ fullscreen: isFullscreen }"
    >
      <canvas
        ref="pdfCanvas"
        class="pdf-canvas"
        :style="{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'top left',
        }"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch, nextTick, onUnmounted } from "vue";
import * as pdfjsLib from "pdfjs-dist";

// 设置PDF.js worker - 使用本地worker文件
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  initialPage: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["load", "error", "pageChange"]);

// 基础状态
const loading = ref(true);
const error = ref(null);
const loadingProgress = ref(0);
const loadingDetail = ref("");

// PDF相关状态 - 使用shallowRef避免深度响应式跟踪
const pdfDocument = shallowRef(null);
const currentPage = ref(props.initialPage);
const totalPages = ref(0);
const scale = ref(1.0);
const rotation = ref(0);
const isFullscreen = ref(false);

// DOM引用
const pdfContainer = ref(null);
const pdfCanvas = ref(null);

// 当前页面渲染 - 也使用shallowRef
const currentPageObj = shallowRef(null);

// 验证PDF文档是否有效
const isDocumentValid = () => {
  return (
    pdfDocument.value &&
    typeof pdfDocument.value.numPages === "number" &&
    pdfDocument.value.numPages > 0 &&
    typeof pdfDocument.value.getPage === "function"
  );
};

// 安全地获取页面
const getPageSafely = async (pageNum) => {
  if (!isDocumentValid()) {
    throw new Error("PDF文档无效或未加载");
  }

  if (pageNum < 1 || pageNum > pdfDocument.value.numPages) {
    throw new Error(
      `页码超出范围: ${pageNum}, 总页数: ${pdfDocument.value.numPages}`
    );
  }

  try {
    return await pdfDocument.value.getPage(pageNum);
  } catch (error) {
    console.error("获取页面失败:", error);
    throw new Error(`无法获取第 ${pageNum} 页: ${error.message}`);
  }
};

const loadPdfDocument = async () => {
  if (!props.url) {
    error.value = "未提供PDF文件地址";
    loading.value = false;
    return;
  }

  // 清理之前的文档
  cleanup();

  try {
    loading.value = true;
    error.value = null;
    loadingProgress.value = 0;
    loadingDetail.value = "正在连接服务器...";

    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      url: props.url,
      // 移除CDN的cMapUrl，使用默认配置
      // cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      // cMapPacked: true,
    });

    // 监听加载进度
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        loadingProgress.value = Math.round(
          (progress.loaded / progress.total) * 100
        );
        loadingDetail.value = `已加载 ${Math.round(
          progress.loaded / 1024
        )}KB / ${Math.round(progress.total / 1024)}KB`;
      }
    };

    const document = await loadingTask.promise;

    // 验证文档是否有效
    if (
      !document ||
      typeof document.numPages !== "number" ||
      document.numPages <= 0
    ) {
      throw new Error("PDF文档格式无效或为空");
    }

    pdfDocument.value = document;
    totalPages.value = document.numPages;

    loadingDetail.value = "正在准备渲染...";

    // 等待一小段时间让PDF.js完全初始化
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 现在尝试渲染页面
    await renderPageWhenReady(currentPage.value);
  } catch (err) {
    console.error("加载PDF失败:", err);
    error.value = getErrorMessage(err);
    loading.value = false;
    cleanup(); // 清理失败的状态
    emit("error", err);
  }
};

const renderPageWhenReady = async (pageNum) => {
  // 等待canvas可用
  const waitForCanvas = async (maxWait = 5000) => {
    const startTime = Date.now();
    while (!pdfCanvas.value && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return !!pdfCanvas.value;
  };

  loadingDetail.value = "等待渲染组件准备...";

  if (!(await waitForCanvas())) {
    error.value = "渲染组件初始化超时";
    loading.value = false;
    return;
  }

  // 现在可以安全地渲染
  await renderPage(pageNum);

  loading.value = false;
  emit("load", {
    totalPages: totalPages.value,
    currentPage: currentPage.value,
  });
};

const getErrorMessage = (err) => {
  if (err.name === "PasswordException") {
    return "PDF文件需要密码才能打开";
  } else if (err.name === "InvalidPDFException") {
    return "PDF文件格式无效或已损坏";
  } else if (err.name === "MissingPDFException") {
    return "找不到PDF文件";
  } else if (err.name === "UnexpectedResponseException") {
    return "服务器响应异常，请检查网络连接";
  } else if (err.message && err.message.includes("Failed to fetch")) {
    return "无法获取PDF文件，请检查文件路径和网络连接";
  } else {
    return `加载PDF失败: ${err.message || "未知错误"}`;
  }
};

const renderPage = async (pageNum) => {
  if (!pdfCanvas.value) {
    console.error("Canvas not available for rendering");
    error.value = "渲染组件未准备就绪";
    return;
  }

  try {
    loadingDetail.value = `正在渲染第 ${pageNum} 页...`;

    // 使用安全的页面获取方法
    const page = await getPageSafely(pageNum);
    currentPageObj.value = page;

    // 获取页面视口
    const viewport = page.getViewport({
      scale: scale.value,
      rotation: rotation.value,
    });

    // 设置canvas尺寸
    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");

    // 设备像素比适配
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = viewport.width * devicePixelRatio;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";

    context.scale(devicePixelRatio, devicePixelRatio);

    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;

    emit("pageChange", {
      currentPage: pageNum,
      totalPages: totalPages.value,
    });
  } catch (err) {
    console.error("渲染页面失败:", err);
    error.value = `渲染第 ${pageNum} 页失败: ${err.message}`;
  }
};

// 导航控制
const nextPage = () => {
  if (
    currentPage.value < totalPages.value &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    currentPage.value++;
    renderPage(currentPage.value);
  }
};

const previousPage = () => {
  if (
    currentPage.value > 1 &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    currentPage.value--;
    renderPage(currentPage.value);
  }
};

const goToPage = () => {
  if (!isDocumentValid() || loading.value || error.value) {
    return;
  }

  const page = Math.max(1, Math.min(currentPage.value, totalPages.value));
  if (page !== currentPage.value) {
    currentPage.value = page;
  }
  renderPage(currentPage.value);
};

// 缩放控制
const zoomIn = () => {
  if (scale.value < 3 && isDocumentValid() && !loading.value && !error.value) {
    scale.value = Math.min(3, scale.value + 0.25);
    renderPage(currentPage.value);
  }
};

const zoomOut = () => {
  if (
    scale.value > 0.5 &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    scale.value = Math.max(0.5, scale.value - 0.25);
    renderPage(currentPage.value);
  }
};

const resetZoom = () => {
  if (isDocumentValid() && !loading.value && !error.value) {
    scale.value = 1.0;
    rotation.value = 0;
    renderPage(currentPage.value);
  }
};

// 旋转控制
const rotateLeft = () => {
  rotation.value = (rotation.value - 90) % 360;
  renderPage(currentPage.value);
};

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360;
  renderPage(currentPage.value);
};

// 全屏控制
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    pdfContainer.value?.requestFullscreen?.();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen?.();
    isFullscreen.value = false;
  }
};

// 键盘快捷键
const handleKeydown = (event) => {
  if (loading.value || error.value) return;

  switch (event.key) {
    case "ArrowLeft":
    case "PageUp":
      event.preventDefault();
      previousPage();
      break;
    case "ArrowRight":
    case "PageDown":
    case " ":
      event.preventDefault();
      nextPage();
      break;
    case "Home":
      event.preventDefault();
      currentPage.value = 1;
      renderPage(currentPage.value);
      break;
    case "End":
      event.preventDefault();
      currentPage.value = totalPages.value;
      renderPage(currentPage.value);
      break;
    case "+":
    case "=":
      event.preventDefault();
      zoomIn();
      break;
    case "-":
      event.preventDefault();
      zoomOut();
      break;
    case "0":
      event.preventDefault();
      resetZoom();
      break;
    case "F11":
      event.preventDefault();
      toggleFullscreen();
      break;
  }
};

const tryAgain = () => {
  loadPdfDocument();
};

const downloadFallback = () => {
  const link = document.createElement("a");
  link.href = props.url;
  link.download = props.url.split("/").pop() || "document.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 清理资源
const cleanup = () => {
  if (pdfDocument.value) {
    try {
      pdfDocument.value.destroy();
    } catch (error) {
      console.warn("Error destroying PDF document:", error);
    }
    pdfDocument.value = null;
  }
  currentPageObj.value = null;
  totalPages.value = 0;
  currentPage.value = 1;
  scale.value = 1.0;
  rotation.value = 0;
  error.value = null;
  loading.value = false;
};

// 全屏状态监听
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(async () => {
  // 立即开始加载PDF，但不依赖canvas
  loadPdfDocument();

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  cleanup(); // 清理资源
});

watch(
  () => props.url,
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
      currentPage.value = props.initialPage;
      cleanup(); // 清理旧文档
      loadPdfDocument();
    }
  }
);

watch(
  () => props.initialPage,
  (newPage) => {
    if (newPage && newPage !== currentPage.value) {
      currentPage.value = newPage;
      if (pdfDocument.value) {
        renderPage(currentPage.value);
      }
    }
  }
);
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 500px;
  position: relative;
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 控制栏样式 */
.pdf-controls {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(248, 250, 252, 0.9)
  );
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
  position: sticky;
  top: 0;
  z-index: 10;
}

.control-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(255, 255, 255, 0.8);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
}

.control-btn {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: white;
  color: var(--gray-700);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: auto;
}

.control-btn:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--primary-300);
  color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-100);
}

.btn-icon {
  font-size: var(--text-sm);
}

.page-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-700);
}

.page-input {
  width: 50px;
  padding: var(--space-xs);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  text-align: center;
  font-size: var(--text-sm);
  background: white;
}

.page-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.zoom-info {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--gray-700);
  min-width: 40px;
  text-align: center;
}

/* PDF容器 */
.pdf-container {
  flex: 1;
  padding: var(--space-lg);
  background: var(--gray-100);
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
}

.pdf-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--gray-900);
  padding: var(--space-xl);
}

.pdf-canvas {
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  max-width: 100%;
  height: auto;
}

/* 加载状态 */
.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--gray-200);
  border-radius: 50%;
  border-top-color: var(--primary-500);
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  max-width: 300px;
}

.loading-content p {
  margin: 0;
  color: var(--gray-700);
  font-size: var(--text-base);
  font-weight: 500;
}

.loading-progress {
  width: 200px;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.loading-detail {
  font-size: var(--text-sm) !important;
  color: var(--gray-500) !important;
  font-weight: 400 !important;
}

/* 错误状态 */
.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.pdf-error h3 {
  margin: 0 0 var(--space-md) 0;
  color: var(--gray-800);
  font-size: var(--text-xl);
  font-weight: 600;
}

.pdf-error p {
  margin: 0 0 var(--space-xl) 0;
  color: var(--gray-600);
  font-size: var(--text-base);
  max-width: 400px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  border: none;
  min-width: 120px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-controls {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .control-group {
    justify-content: center;
    width: 100%;
  }

  .pdf-container {
    padding: var(--space-md);
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .control-btn {
    padding: var(--space-xs);
    font-size: var(--text-xs);
  }

  .btn-icon {
    font-size: var(--text-xs);
  }

  .control-group {
    gap: var(--space-xs);
    padding: var(--space-xs);
  }
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .pdf-viewer {
    background: var(--gray-800);
  }

  .pdf-controls {
    background: rgba(17, 24, 39, 0.95);
    border-bottom-color: var(--gray-600);
  }

  .control-group {
    background: rgba(31, 41, 55, 0.8);
    border-color: var(--gray-600);
  }

  .control-btn {
    background: var(--gray-700);
    color: var(--gray-200);
    border-color: var(--gray-600);
  }

  .control-btn:hover:not(:disabled) {
    background: var(--gray-600);
    color: var(--primary-300);
  }

  .page-input {
    background: var(--gray-700);
    color: var(--gray-200);
    border-color: var(--gray-600);
  }

  .pdf-container {
    background: var(--gray-800);
  }

  .pdf-container.fullscreen {
    background: var(--gray-900);
  }

  .pdf-loading,
  .pdf-error {
    background: rgba(17, 24, 39, 0.9);
  }

  .loading-content p {
    color: var(--gray-200);
  }

  .pdf-error h3 {
    color: var(--gray-100);
  }

  .pdf-error p {
    color: var(--gray-300);
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }

  .pdf-canvas,
  .control-btn,
  .btn {
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .control-btn {
    border-width: 2px;
  }

  .pdf-canvas {
    border-width: 2px;
  }
}
</style>
