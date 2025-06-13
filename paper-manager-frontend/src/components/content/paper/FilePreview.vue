<template>
  <div class="file-preview">
    <!-- 预览头部 -->
    <div class="preview-header">
      <div class="file-info">
        <div class="file-icon">{{ getFileIcon(fileType) }}</div>
        <div class="file-details">
          <h4 class="file-name">{{ fileName }}</h4>
          <div class="file-meta">
            <span class="file-type">{{ getFileTypeText(fileType) }}</span>
            <span v-if="fileSize" class="file-size">{{
              formatFileSize(fileSize)
            }}</span>
            <span v-if="lastModified" class="file-date">{{
              formatDate(lastModified)
            }}</span>
          </div>
        </div>
      </div>
      <div class="preview-actions">
        <button
          @click="downloadFile"
          class="action-btn download-btn"
          :disabled="downloading"
        >
          <span class="btn-icon">{{ downloading ? "⏳" : "⬇️" }}</span>
          {{ downloading ? "下载中..." : "下载" }}
        </button>
        <button @click="$emit('close')" class="action-btn close-btn">
          <span class="btn-icon">✕</span>
          关闭
        </button>
      </div>
    </div>
    <!-- 预览内容 -->
    <div class="preview-content">
      <!-- PDF预览 -->
      <PdfViewer
        v-if="fileType === 'pdf'"
        :url="fileUrl"
        @load="onPreviewLoad"
        @error="onPreviewError"
      />
      <!-- 文本文件预览 -->
      <div v-else-if="isText" class="text-preview-container">
        <div v-if="textLoading" class="text-loading">
          <div class="loading-spinner"></div>
          <p>正在加载文档...</p>
        </div>
        <div v-else-if="textError" class="text-error">
          <div class="error-icon">📄</div>
          <p>{{ textError }}</p>
          <button @click="retryTextLoad" class="btn btn-primary">
            重新加载
          </button>
        </div>
        <div v-else class="text-viewer">
          <div class="text-controls">
            <button @click="decreaseFontSize" class="control-btn">
              <span class="btn-icon">A-</span>
            </button>
            <span class="font-size-info">{{ fontSize }}px</span>
            <button @click="increaseFontSize" class="control-btn">
              <span class="btn-icon">A+</span>
            </button>
            <button @click="toggleWordWrap" class="control-btn">
              <span class="btn-icon">{{ wordWrap ? "📄" : "📜" }}</span>
              {{ wordWrap ? "取消换行" : "自动换行" }}
            </button>
          </div>
          <div
            class="text-content"
            :style="{
              fontSize: fontSize + 'px',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            }"
          >
            {{ textContent }}
          </div>
        </div>
      </div>
      <!-- Office文档预览 -->
      <div v-else-if="isOffice" class="office-preview-container">
        <div class="office-notice">
          <div class="notice-icon">📄</div>
          <h3>Office文档预览</h3>
          <p>这是一个 {{ getFileTypeText(fileType) }} 文档</p>
          <div class="office-actions">
            <button @click="downloadFile" class="btn btn-primary">
              <span class="btn-icon">⬇️</span>
              下载文档
            </button>
          </div>
          <p class="office-tip">
            💡 提示：建议下载后使用 Microsoft Office 或 WPS 等软件打开
          </p>
        </div>
      </div>
      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-preview">
        <div class="unsupported-icon">{{ getFileIcon(fileType) }}</div>
        <h3>无法预览此文件</h3>
        <p>{{ getFileTypeText(fileType) }} 文件不支持在线预览</p>
        <div class="unsupported-actions">
          <button @click="downloadFile" class="btn btn-primary">
            <span class="btn-icon">⬇️</span>
            下载文件
          </button>
          <button @click="$emit('close')" class="btn btn-secondary">
            <span class="btn-icon">←</span>
            返回详情页面
          </button>
        </div>
        <div class="file-suggestions">
          <h4>建议的查看方式：</h4>
          <ul>
            <li
              v-for="suggestion in getViewingSuggestions(fileType)"
              :key="suggestion"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import PdfViewer from "./PdfViewer.vue";

const props = defineProps({
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: "",
  },
  fileSize: {
    type: Number,
    default: null,
  },
  lastModified: {
    type: [String, Date],
    default: null,
  },
});

const emit = defineEmits(["close", "download", "load", "error"]);

// 基础状态
const downloading = ref(false);

// 文本相关状态
const textLoading = ref(false);
const textError = ref(null);
const textContent = ref("");
const fontSize = ref(14);
const wordWrap = ref(true);

// 文件类型判断
const fileType = computed(() => {
  const extension = props.fileName.split(".").pop()?.toLowerCase();
  return extension || "";
});

const isText = computed(() => {
  return [
    "txt",
    "md",
    "json",
    "xml",
    "csv",
    "log",
    "js",
    "css",
    "html",
    "py",
    "java",
    "cpp",
    "c",
    "ts",
  ].includes(fileType.value);
});

const isOffice = computed(() => {
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileType.value);
});

// 工具函数
const getFileIcon = (type) => {
  const iconMap = {
    pdf: "📄",
    doc: "📘",
    docx: "📘",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    txt: "📝",
    md: "📋",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    bmp: "🖼️",
    webp: "🖼️",
    svg: "🖼️",
    mp4: "🎬",
    avi: "🎬",
    mov: "🎬",
    wmv: "🎬",
    flv: "🎬",
    webm: "🎬",
    mkv: "🎬",
    mp3: "🎵",
    wav: "🎵",
    ogg: "🎵",
    aac: "🎵",
    flac: "🎵",
    m4a: "🎵",
    zip: "📦",
    rar: "📦",
    "7z": "📦",
    json: "⚙️",
    xml: "⚙️",
    csv: "📊",
    js: "🟨",
    ts: "🔷",
    css: "🎨",
    html: "🌐",
    py: "🐍",
    java: "☕",
    cpp: "⚡",
    c: "⚡",
  };
  return iconMap[type] || "📎";
};

const getFileTypeText = (type) => {
  const typeMap = {
    pdf: "PDF文档",
    doc: "Word文档",
    docx: "Word文档",
    xls: "Excel表格",
    xlsx: "Excel表格",
    ppt: "PowerPoint演示",
    pptx: "PowerPoint演示",
    txt: "文本文件",
    md: "Markdown文档",
    jpg: "JPEG图片",
    jpeg: "JPEG图片",
    png: "PNG图片",
    gif: "GIF图片",
    bmp: "BMP图片",
    webp: "WebP图片",
    svg: "SVG图片",
    mp4: "MP4视频",
    avi: "AVI视频",
    mov: "MOV视频",
    wmv: "WMV视频",
    flv: "FLV视频",
    webm: "WebM视频",
    mkv: "MKV视频",
    mp3: "MP3音频",
    wav: "WAV音频",
    ogg: "OGG音频",
    aac: "AAC音频",
    flac: "FLAC音频",
    m4a: "M4A音频",
    zip: "ZIP压缩包",
    rar: "RAR压缩包",
    "7z": "7Z压缩包",
    json: "JSON数据",
    xml: "XML文档",
    csv: "CSV表格",
    js: "JavaScript",
    ts: "TypeScript",
    css: "CSS样式",
    html: "HTML网页",
    py: "Python脚本",
    java: "Java源码",
    cpp: "C++源码",
    c: "C源码",
  };
  return typeMap[type] || "未知格式";
};

const formatFileSize = (bytes) => {
  if (!bytes) return "未知大小";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getViewingSuggestions = (type) => {
  const suggestions = {
    doc: ["Microsoft Word", "WPS文字", "LibreOffice Writer"],
    docx: ["Microsoft Word", "WPS文字", "LibreOffice Writer"],
    xls: ["Microsoft Excel", "WPS表格", "LibreOffice Calc"],
    xlsx: ["Microsoft Excel", "WPS表格", "LibreOffice Calc"],
    ppt: ["Microsoft PowerPoint", "WPS演示", "LibreOffice Impress"],
    pptx: ["Microsoft PowerPoint", "WPS演示", "LibreOffice Impress"],
    zip: ["WinRAR", "7-Zip", "系统自带解压工具"],
    rar: ["WinRAR", "7-Zip"],
    "7z": ["7-Zip", "WinRAR"],
  };
  return suggestions[type] || ["下载后使用相应的软件打开"];
};

// 文本操作
const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value += 2;
  }
};

const decreaseFontSize = () => {
  if (fontSize.value > 10) {
    fontSize.value -= 2;
  }
};

const toggleWordWrap = () => {
  wordWrap.value = !wordWrap.value;
};

// 加载处理
const loadTextContent = async () => {
  if (!isText.value) return;

  textLoading.value = true;
  textError.value = null;

  try {
    const response = await fetch(props.fileUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    textContent.value = await response.text();
  } catch (error) {
    console.error("加载文本文件失败:", error);
    textError.value = `加载失败: ${error.message}`;
  } finally {
    textLoading.value = false;
  }
};

const retryTextLoad = () => {
  loadTextContent();
};

// 事件处理
const onPreviewLoad = (data) => {
  emit("load", { type: "pdf", ...data });
};

const onPreviewError = (error) => {
  emit("error", { type: "pdf", error });
};

const downloadFile = async () => {
  downloading.value = true;

  try {
    let downloadUrl = props.fileUrl;

    // 如果是本地文件路径，提示用户使用主下载按钮
    if (
      downloadUrl.startsWith("file://") ||
      downloadUrl.includes("C:") ||
      downloadUrl.includes("/Users/")
    ) {
      emit("error", {
        type: "download",
        message: '请使用页面下方的"下载文件"按钮来下载此文件',
      });
      return;
    }

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = props.fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    emit("download", { fileName: props.fileName });
  } catch (error) {
    console.error("下载失败:", error);
    emit("error", { type: "download", message: `下载失败: ${error.message}` });
  } finally {
    downloading.value = false;
  }
};

// 生命周期
onMounted(() => {
  if (isText.value) {
    loadTextContent();
  }
});

// 键盘快捷键
const handleKeydown = (event) => {
  if (event.target.tagName === "INPUT") return;

  switch (event.key) {
    case "Escape":
      emit("close");
      break;
    case "+":
    case "=":
      if (isText.value) {
        event.preventDefault();
        increaseFontSize();
      }
      break;
    case "-":
      if (isText.value) {
        event.preventDefault();
        decreaseFontSize();
      }
      break;
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.file-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

/* 预览头部 */
.preview-header {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(248, 250, 252, 0.9)
  );
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.file-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.file-details h4 {
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--gray-800);
}

.file-meta {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--gray-500);
}

.file-meta > * {
  position: relative;
}

.file-meta > *:not(:last-child)::after {
  content: "·";
  margin-left: var(--space-sm);
  color: var(--gray-400);
}

.preview-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.download-btn {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.download-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.close-btn {
  background: var(--gray-100);
  color: var(--gray-700);
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

/* 预览内容 */
.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 图片预览 */
.image-preview-container,
.text-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.image-controls,
.text-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--gray-200);
}

.control-btn {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: white;
  color: var(--gray-700);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}

.control-btn:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--primary-300);
  color: var(--primary-600);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-info,
.font-size-info {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-700);
  min-width: 50px;
  text-align: center;
}

.image-container {
  flex: 1;
  overflow: auto;
  background: var(--gray-100);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-lg);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: grab;
  transition: transform 0.3s ease;
}

.preview-image:active {
  cursor: grabbing;
}

/* 文本预览 */
.text-content {
  flex: 1;
  padding: var(--space-lg);
  background: white;
  overflow: auto;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  line-height: 1.6;
  color: var(--gray-800);
  border-radius: var(--border-radius);
  margin: var(--space-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Office文档预览 */
.office-preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-3xl);
}

.office-notice {
  text-align: center;
  max-width: 400px;
}

.notice-icon {
  font-size: 4rem;
  margin-bottom: var(--space-lg);
  opacity: 0.8;
}

.office-notice h3 {
  margin: 0 0 var(--space-md) 0;
  color: var(--gray-800);
  font-size: var(--text-xl);
}

.office-notice p {
  margin: 0 0 var(--space-lg) 0;
  color: var(--gray-600);
}

.office-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.office-tip {
  font-size: var(--text-sm) !important;
  color: var(--gray-500) !important;
  font-style: italic;
}

/* 媒体预览 */
.video-preview-container,
.audio-preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-lg);
  background: var(--gray-900);
}

.video-player {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--border-radius);
}

.audio-player-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  background: white;
  padding: var(--space-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.audio-player {
  width: 300px;
}

.audio-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-align: left;
}

.audio-icon {
  font-size: 2rem;
}

.audio-details h4 {
  margin: 0 0 var(--space-xs) 0;
  color: var(--gray-800);
}

.audio-details p {
  margin: 0;
  color: var(--gray-600);
  font-size: var(--text-sm);
}

/* 不支持的文件类型和本地文件 */
.unsupported-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-3xl);
  text-align: center;
}

.unsupported-icon {
  font-size: 5rem;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
}

.unsupported-preview h3 {
  margin: 0 0 var(--space-md) 0;
  color: var(--gray-800);
  font-size: var(--text-xl);
}

.unsupported-preview p {
  margin: 0 0 var(--space-xl) 0;
  color: var(--gray-600);
}

.unsupported-actions {
  margin-bottom: var(--space-xl);
}

.file-suggestions {
  max-width: 300px;
  margin-bottom: var(--space-lg);
}

.file-suggestions h4 {
  margin: 0 0 var(--space-md) 0;
  color: var(--gray-700);
  font-size: var(--text-base);
}

.file-suggestions ul {
  margin: 0;
  padding-left: var(--space-lg);
  text-align: left;
}

.file-suggestions li {
  margin-bottom: var(--space-xs);
  color: var(--gray-600);
  font-size: var(--text-sm);
}

/* 本地文件相关样式 */
.local-file-info {
  background: rgba(255, 255, 255, 0.7);
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-lg);
  max-width: 500px;
  width: 100%;
}

.file-path {
  text-align: left;
  word-break: break-all;
}

.file-path strong {
  color: var(--gray-700);
  font-size: var(--text-sm);
}

.file-path code {
  display: block;
  background: var(--gray-100);
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: var(--text-xs);
  color: var(--gray-800);
  margin-top: var(--space-xs);
  border: 1px solid var(--gray-200);
}

.local-file-tip {
  font-size: var(--text-sm) !important;
  color: #92400e !important;
  font-style: italic;
  background: rgba(255, 255, 255, 0.5);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  border: 1px solid #fbbf24;
  margin: 0 !important;
}

/* 加载和错误状态 */
.image-loading,
.image-error,
.text-loading,
.text-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-xl);
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
}

/* 按钮样式 */
.btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: var(--space-md);
  }

  .file-info {
    flex-direction: column;
    text-align: center;
  }

  .preview-actions {
    width: 100%;
    justify-content: center;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .image-controls,
  .text-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .office-actions {
    flex-direction: column;
    width: 100%;
  }
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
