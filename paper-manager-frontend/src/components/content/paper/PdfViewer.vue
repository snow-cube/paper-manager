<template>
  <div class="pdf-viewer">
    <!-- 控制栏 -->
    <div v-if="!loading && !error" class="pdf-controls">
      <!-- 导航控制组 -->
      <div class="control-group">
        <button
          @click="goToFirstPage"
          :disabled="currentPage <= 1"
          class="control-btn"
        >
          <span class="btn-icon">⏮️</span>
          首页
        </button>
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
        <button
          @click="goToLastPage"
          :disabled="currentPage >= totalPages"
          class="control-btn"
        >
          <span class="btn-icon">⏭️</span>
          末页
        </button>
      </div>

      <!-- 缩放控制组 -->
      <div class="control-group">
        <button @click="zoomOut" :disabled="scale <= 0.25" class="control-btn">
          <span class="btn-icon">🔍-</span>
          缩小
        </button>
        <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" :disabled="scale >= 5" class="control-btn">
          <span class="btn-icon">🔍+</span>
          放大
        </button>
        <button @click="resetZoom" class="control-btn">
          <span class="btn-icon">↻</span>
          重置
        </button>
        <select v-model="zoomMode" @change="applyZoomMode" class="zoom-select">
          <option value="custom">自定义</option>
          <option value="fit-width">适合宽度</option>
          <option value="fit-page">适合页面</option>
          <option value="actual-size">实际大小</option>
        </select>
      </div>

      <!-- 显示和旋转控制组 -->
      <div class="control-group">
        <button @click="rotateLeft" class="control-btn">
          <span class="btn-icon">↶</span>
          逆转
        </button>
        <button @click="rotateRight" class="control-btn">
          <span class="btn-icon">↷</span>
          顺转
        </button>
        <button @click="toggleDisplayMode" class="control-btn">
          <span class="btn-icon">{{ isTwoPageMode ? "📄" : "📄📄" }}</span>
          {{ isTwoPageMode ? "单页" : "双页" }}
        </button>
        <button @click="toggleThumbnails" class="control-btn">
          <span class="btn-icon">🗂️</span>
          缩略图
        </button>
      </div>

      <!-- 工具控制组 -->
      <div class="control-group">
        <button @click="toggleSearch" class="control-btn">
          <span class="btn-icon">🔍</span>
          搜索
        </button>
        <button @click="printPdf" class="control-btn">
          <span class="btn-icon">🖨️</span>
          打印
        </button>
        <button @click="openInNewWindow" class="control-btn new-window-btn">
          <span class="btn-icon">🔗</span>
          新标签页
        </button>
        <button @click="toggleFullscreen" class="control-btn">
          <span class="btn-icon">{{ isFullscreen ? "⛶" : "⛶" }}</span>
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div v-if="showSearch && !loading && !error" class="pdf-search">
      <div class="search-input-group">
        <input
          ref="searchInput"
          v-model="searchQuery"
          @keyup.enter="searchNext"
          @input="onSearchInput"
          type="text"
          placeholder="搜索PDF内容..."
          class="search-input"
        />
        <button
          @click="searchPrevious"
          :disabled="searchResults.length === 0"
          class="search-btn"
        >
          <span class="btn-icon">⬆️</span>
        </button>
        <button
          @click="searchNext"
          :disabled="searchResults.length === 0"
          class="search-btn"
        >
          <span class="btn-icon">⬇️</span>
        </button>
        <span v-if="searchResults.length > 0" class="search-info">
          {{ currentSearchIndex + 1 }} / {{ searchResults.length }}
        </span>
        <button @click="closeSearch" class="search-btn close-btn">
          <span class="btn-icon">✕</span>
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
      class="pdf-viewer-content"
      :class="{ 'with-thumbnails': showThumbnails }"
    >
      <!-- 缩略图侧边栏 -->
      <div v-if="showThumbnails" class="thumbnails-panel">
        <div class="thumbnails-header">
          <h4>页面导航</h4>
          <button @click="closeThumbnails" class="close-thumbnails-btn">
            ✕
          </button>
        </div>
        <div class="thumbnails-container">
          <div
            v-for="pageNum in totalPages"
            :key="pageNum"
            @click="goToSpecificPage(pageNum)"
            class="thumbnail-item"
            :class="{ active: pageNum === currentPage }"
          >
            <canvas
              :ref="(el) => setThumbnailRef(el, pageNum)"
              class="thumbnail-canvas"
            ></canvas>
            <span class="thumbnail-label">第 {{ pageNum }} 页</span>
          </div>
        </div>
      </div>

      <!-- PDF主视图 -->
      <div
        ref="pdfContainer"
        class="pdf-container"
        :class="{ fullscreen: isFullscreen, 'two-page': isTwoPageMode }"
      >
        <div v-if="!isTwoPageMode" class="single-page-view">
          <canvas
            ref="pdfCanvas"
            class="pdf-canvas"
            :style="{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
            }"
          ></canvas>
        </div>
        <div v-else class="two-page-view">
          <canvas
            ref="pdfCanvasLeft"
            class="pdf-canvas left-page"
            :style="{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
            }"
          ></canvas>
          <canvas
            ref="pdfCanvasRight"
            class="pdf-canvas right-page"
            :style="{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
            }"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch, nextTick, onUnmounted } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import { useFilePreview } from "@/composables/useFilePreview.js";

// 设置PDF.js worker - 使用本地worker文件
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const { smartOpenPreview } = useFilePreview();

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

const emit = defineEmits(["load", "error", "pageChange", "new-window-opened"]);

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

// 新增的增强功能状态
const zoomMode = ref("custom"); // 'custom', 'fit-width', 'fit-page', 'actual-size'
const isTwoPageMode = ref(false);
const showThumbnails = ref(false);
const showSearch = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const currentSearchIndex = ref(-1);

// DOM引用
const pdfContainer = ref(null);
const pdfCanvas = ref(null);
const pdfCanvasLeft = ref(null);
const pdfCanvasRight = ref(null);
const searchInput = ref(null);
const thumbnailRefs = ref(new Map());

// 当前页面渲染 - 也使用shallowRef
const currentPageObj = shallowRef(null);
const thumbnailCache = ref(new Map());

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

    // 根据缩放级别调整容器的居中行为
    updateContainerCentering();

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
const goToFirstPage = () => {
  if (
    currentPage.value > 1 &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    currentPage.value = 1;
    renderPage(currentPage.value);
  }
};

const goToLastPage = () => {
  if (
    currentPage.value < totalPages.value &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    currentPage.value = totalPages.value;
    renderPage(currentPage.value);
  }
};

const goToSpecificPage = (pageNum) => {
  if (
    pageNum >= 1 &&
    pageNum <= totalPages.value &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    currentPage.value = pageNum;
    renderPage(currentPage.value);
  }
};

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
  if (scale.value < 5 && isDocumentValid() && !loading.value && !error.value) {
    scale.value = Math.min(5, scale.value + 0.25);
    zoomMode.value = "custom";
    renderCurrentPage();
  }
};

const zoomOut = () => {
  if (
    scale.value > 0.25 &&
    isDocumentValid() &&
    !loading.value &&
    !error.value
  ) {
    scale.value = Math.max(0.25, scale.value - 0.25);
    zoomMode.value = "custom";
    renderCurrentPage();
  }
};

const resetZoom = () => {
  if (isDocumentValid() && !loading.value && !error.value) {
    scale.value = 1.0;
    rotation.value = 0;
    zoomMode.value = "actual-size";
    renderCurrentPage();
  }
};

const applyZoomMode = () => {
  if (!pdfContainer.value || !isDocumentValid()) return;

  const containerWidth = pdfContainer.value.clientWidth;
  const containerHeight = pdfContainer.value.clientHeight;

  if (!currentPageObj.value) return;

  const viewport = currentPageObj.value.getViewport({ scale: 1.0 });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  switch (zoomMode.value) {
    case "fit-width":
      scale.value = (containerWidth - 40) / pageWidth; // 减去一些边距
      break;
    case "fit-page":
      const scaleWidth = (containerWidth - 40) / pageWidth;
      const scaleHeight = (containerHeight - 40) / pageHeight;
      scale.value = Math.min(scaleWidth, scaleHeight);
      break;
    case "actual-size":
      scale.value = 1.0;
      break;
  }

  renderCurrentPage();
};

const renderCurrentPage = () => {
  if (isTwoPageMode.value) {
    renderTwoPages();
  } else {
    renderPage(currentPage.value);
  }
};

// 根据缩放级别更新容器的居中行为
const updateContainerCentering = () => {
  if (!pdfContainer.value) return;

  // 移除之前的属性
  pdfContainer.value.removeAttribute("data-scale-small");
  pdfContainer.value.removeAttribute("data-scale-large");

  // 根据缩放级别设置相应的属性
  if (scale.value <= 0.75) {
    pdfContainer.value.setAttribute("data-scale-small", "true");
  } else if (scale.value >= 1.5) {
    pdfContainer.value.setAttribute("data-scale-large", "true");
  }

  // 确保容器滚动到中心位置（特别是在大缩放时）
  if (scale.value >= 1.5) {
    nextTick(() => {
      const container = pdfContainer.value;
      if (container) {
        const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        container.scrollTo({
          left: scrollLeft,
          top: scrollTop,
          behavior: "smooth",
        });
      }
    });
  }
};

// 旋转控制
const rotateLeft = () => {
  rotation.value = (rotation.value - 90) % 360;
  renderCurrentPage();
};

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360;
  renderCurrentPage();
};

// 显示模式控制
const toggleDisplayMode = () => {
  isTwoPageMode.value = !isTwoPageMode.value;
  nextTick(() => {
    renderCurrentPage();
  });
};

const renderTwoPages = async () => {
  if (!pdfCanvasLeft.value || !pdfCanvasRight.value) return;

  try {
    // 渲染当前页（左页）
    if (currentPage.value <= totalPages.value) {
      await renderPageOnCanvas(currentPage.value, pdfCanvasLeft.value);
    }

    // 渲染下一页（右页）
    if (currentPage.value + 1 <= totalPages.value) {
      await renderPageOnCanvas(currentPage.value + 1, pdfCanvasRight.value);
    }

    // 更新居中行为
    updateContainerCentering();
  } catch (err) {
    console.error("双页渲染失败:", err);
  }
};

const renderPageOnCanvas = async (pageNum, canvas) => {
  const page = await getPageSafely(pageNum);
  const viewport = page.getViewport({
    scale: scale.value,
    rotation: rotation.value,
  });

  const context = canvas.getContext("2d");
  const devicePixelRatio = window.devicePixelRatio || 1;

  canvas.width = viewport.width * devicePixelRatio;
  canvas.height = viewport.height * devicePixelRatio;
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";

  context.scale(devicePixelRatio, devicePixelRatio);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
};

// 缩略图功能
const toggleThumbnails = () => {
  showThumbnails.value = !showThumbnails.value;
  if (showThumbnails.value) {
    nextTick(() => {
      generateThumbnails();
    });
  }
};

const closeThumbnails = () => {
  showThumbnails.value = false;
};

const setThumbnailRef = (el, pageNum) => {
  if (el) {
    thumbnailRefs.value.set(pageNum, el);
  }
};

const generateThumbnails = async () => {
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    if (thumbnailCache.value.has(pageNum)) continue;

    try {
      const canvas = thumbnailRefs.value.get(pageNum);
      if (!canvas) continue;

      const page = await getPageSafely(pageNum);
      const viewport = page.getViewport({ scale: 0.2 }); // 小缩略图

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      const context = canvas.getContext("2d");
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      thumbnailCache.value.set(pageNum, true);
    } catch (err) {
      console.error(`生成第${pageNum}页缩略图失败:`, err);
    }
  }
};

// 搜索功能
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  } else {
    clearSearch();
  }
};

const closeSearch = () => {
  showSearch.value = false;
  clearSearch();
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  currentSearchIndex.value = -1;
};

const onSearchInput = () => {
  if (searchQuery.value.trim().length > 0) {
    performSearch();
  } else {
    clearSearch();
  }
};

const performSearch = async () => {
  if (!searchQuery.value.trim() || !isDocumentValid()) return;

  searchResults.value = [];
  const query = searchQuery.value.toLowerCase();

  try {
    for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
      const page = await getPageSafely(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ")
        .toLowerCase();

      if (pageText.includes(query)) {
        searchResults.value.push(pageNum);
      }
    }

    if (searchResults.value.length > 0) {
      currentSearchIndex.value = 0;
      goToSpecificPage(searchResults.value[0]);
    }
  } catch (err) {
    console.error("搜索失败:", err);
  }
};

const searchNext = () => {
  if (searchResults.value.length === 0) return;

  currentSearchIndex.value =
    (currentSearchIndex.value + 1) % searchResults.value.length;
  goToSpecificPage(searchResults.value[currentSearchIndex.value]);
};

const searchPrevious = () => {
  if (searchResults.value.length === 0) return;

  currentSearchIndex.value =
    currentSearchIndex.value === 0
      ? searchResults.value.length - 1
      : currentSearchIndex.value - 1;
  goToSpecificPage(searchResults.value[currentSearchIndex.value]);
};

// 打印功能
const printPdf = () => {
  try {
    const printWindow = window.open(props.url, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    } else {
      // 如果弹窗被阻止，则使用当前窗口打印
      window.open(props.url, "_blank")?.print();
    }
  } catch (error) {
    console.error("打印失败:", error);
    // 备选方案：下载文件
    downloadFallback();
  }
};

// 在新标签页中打开PDF
const openInNewWindow = () => {
  try {
    const fileInfo = {
      fileUrl: props.url,
      fileName: extractFileName(props.url),
      fileSize: null, // PDF viewer doesn't have size info
      lastModified: null,
    };

    const newTab = smartOpenPreview(fileInfo);

    if (newTab) {
      emit("new-window-opened", {
        windowRef: newTab,
        fileUrl: props.url,
        fileName: fileInfo.fileName,
      });
    }
  } catch (error) {
    console.error("打开新标签页失败:", error);
    emit("error", error.message || "无法打开新标签页");
  }
};

// 从URL中提取文件名
const extractFileName = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split("/").pop() || "document.pdf";
    return fileName.includes(".") ? fileName : fileName + ".pdf";
  } catch {
    return "document.pdf";
  }
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
}

/* 缩放选择器 */
.zoom-select {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: white;
  color: var(--gray-700);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 搜索栏样式 */
.pdf-search {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.05),
    rgba(37, 99, 235, 0.05)
  );
  border-bottom: 1px solid var(--primary-200);
  padding: var(--space-sm) var(--space-md);
  animation: slideDown 0.3s ease;
}

.search-input-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: var(--space-sm);
  border: 1px solid var(--primary-300);
  border-radius: var(--border-radius);
  background: white;
  color: var(--gray-700);
  font-size: var(--text-sm);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
  padding: var(--space-sm);
  border: 1px solid var(--primary-300);
  border-radius: var(--border-radius);
  background: var(--primary-50);
  color: var(--primary-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover:not(:disabled) {
  background: var(--primary-100);
  border-color: var(--primary-400);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-btn.close-btn {
  background: var(--gray-100);
  color: var(--gray-600);
  border-color: var(--gray-300);
}

.search-info {
  font-size: var(--text-sm);
  color: var(--primary-600);
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* 主视图容器 */
.pdf-viewer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pdf-viewer-content.with-thumbnails {
  /* 缩略图模式下的特殊样式 */
  flex-direction: row;
}

/* 缩略图面板 */
.thumbnails-panel {
  width: 200px;
  background: var(--gray-50);
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.thumbnails-header {
  padding: var(--space-md);
  background: var(--gray-100);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thumbnails-header h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--gray-700);
}

.close-thumbnails-btn {
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.close-thumbnails-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.thumbnails-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
}

.thumbnail-item {
  margin-bottom: var(--space-sm);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.thumbnail-item:hover {
  border-color: var(--primary-300);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.thumbnail-item.active {
  border-color: var(--primary-500);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.thumbnail-canvas {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.thumbnail-label {
  display: block;
  padding: var(--space-xs);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--gray-600);
  background: var(--gray-50);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

/* 双页面模式 */
.two-page-view {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  align-items: center;
  padding: var(--space-md);
  min-height: 100%;
  width: 100%;
}

.left-page,
.right-page {
  border: 1px solid var(--gray-200);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.single-page-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-md);
  min-height: 100%;
  width: 100%;
}

/* 缩放居中优化 */
.pdf-canvas {
  margin: auto;
}

/* 确保在小缩放比例下也能居中 */
.pdf-container[data-scale-small="true"] {
  align-items: center;
}

/* 确保在大缩放比例下滚动居中 */
.pdf-container[data-scale-large="true"] {
  align-items: flex-start;
}

.pdf-container[data-scale-large="true"] .single-page-view,
.pdf-container[data-scale-large="true"] .two-page-view {
  min-width: max-content;
  justify-content: center;
}

/* 响应式居中优化 */
@media (max-width: 768px) {
  .pdf-container {
    padding: var(--space-sm);
  }

  .single-page-view,
  .two-page-view {
    padding: var(--space-sm);
  }
}

/* 高分辨率屏幕优化 */
@media (min-resolution: 2dppx) {
  .pdf-canvas {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-100);
}

.control-btn.new-window-btn {
  background: linear-gradient(135deg, var(--primary-400), var(--primary-500));
  color: white;
  border-color: var(--primary-500);
}

.control-btn.new-window-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-color: var(--primary-600);
  color: white;
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
  align-items: center;
  position: relative;
  min-height: 0;
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
  align-items: center;
  justify-content: center;
}

.pdf-canvas {
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  max-width: none; /* 允许缩放超出容器 */
  height: auto;
  display: block;
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
  /* 在小屏幕上隐藏新标签页按钮 */
  .control-btn.new-window-btn {
    display: none;
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
