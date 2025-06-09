<template>
  <div class="paper-detail">
    <div class="detail-header">
      <div class="paper-type-badge" :class="paper.paper_type">
        <span class="badge-icon">{{
          paper.paper_type === "published" ? "🎓" : "📚"
        }}</span>
        {{ paper.paper_type === "published" ? "发表论文" : "文献" }}
      </div>
      <h1 class="paper-title">{{ paper.title }}</h1>
    </div>

    <div class="detail-content">
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>        <div class="info-grid">          <div class="info-item">
            <label>作者：</label>
            <div class="authors-section">
              <div class="authors-text">{{ authorsText }}</div>
            </div>
          </div>

          <div v-if="paper.journal" class="info-item">
            <label>期刊：</label>
            <span class="journal">{{ paper.journal }}</span>
          </div>

          <div class="info-item">
            <label>发表年份：</label>
            <span>{{ paper.year }}</span>
          </div>

          <div v-if="paper.volume" class="info-item">
            <label>卷号：</label>
            <span>{{ paper.volume }}</span>
          </div>

          <div v-if="paper.pages" class="info-item">
            <label>页码：</label>
            <span>{{ paper.pages }}</span>
          </div>

          <div v-if="paper.doi" class="info-item">
            <label>DOI：</label>
            <span class="doi">{{ paper.doi }}</span>
          </div>

          <div v-if="paper.impact_factor" class="info-item">
            <label>影响因子：</label>
            <span class="impact-factor">{{ paper.impact_factor }}</span>
          </div>

          <div class="info-item">
            <label>分类：</label>
            <span class="category">{{ categoriesText }}</span>
          </div>
        </div>
      </div>

      <div v-if="paper.abstract" class="detail-section">
        <h3 class="section-title">摘要</h3>
        <div class="abstract-content">
          {{ paper.abstract }}
        </div>
      </div>      <div v-if="paper.keywords" class="detail-section">
        <h3 class="section-title">关键词</h3>
        <div class="keywords-container">
          <span
            v-for="keyword in keywordList"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <div v-if="paper.notes" class="detail-section">
        <h3 class="section-title">笔记</h3>
        <div class="notes-content">
          {{ paper.notes }}
        </div>
      </div>
      <div v-if="paper.url" class="detail-section">
        <h3 class="section-title">链接</h3>
        <div class="url-container">
          <a :href="paper.url" target="_blank" class="paper-url">
            {{ paper.url }}
            <span class="external-icon">🔗</span>
          </a>
        </div>
      </div>

      <div v-if="paper.file_path" class="detail-section">
        <h3 class="section-title">文件</h3>
        <div class="file-container">
          <div class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-name">{{ getFileName(paper.file_path) }}</div>
          </div>
          <div class="file-actions">
            <button @click="previewFile" class="btn btn-small btn-preview">
              <span class="btn-icon">👁️</span> 预览
            </button>
            <button @click="downloadFile" class="btn btn-small btn-download">
              <span class="btn-icon">⬇️</span> 下载
            </button>
          </div>
        </div>
        <div v-if="showPreview" class="file-preview">
          <div class="preview-header">
            <h4>文件预览</h4>
            <button @click="closePreview" class="preview-close">×</button>
          </div>
          <div class="preview-content">
            <template v-if="isPreviewable">
              <PdfViewer v-if="isPdf" :url="previewUrl" />
              <img
                v-else-if="isImage"
                :src="previewUrl"
                class="image-preview"
              />
              <div v-else class="preview-not-available">
                <div class="preview-icon">🔎</div>
                <p>暂不支持此类型文件的预览</p>
                <button @click="downloadFile" class="btn btn-primary">
                  <span class="btn-icon">⬇️</span> 下载文件
                </button>
              </div>
            </template>
            <div v-else class="preview-not-available">
              <div class="preview-icon">🔎</div>
              <p>该文件类型不支持在线预览</p>
              <button @click="downloadFile" class="btn btn-primary">
                <span class="btn-icon">⬇️</span> 下载文件
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">元数据</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <label>创建时间：</label>
            <span>{{ formatDate(paper.created_at) }}</span>
          </div>
          <div v-if="paper.updated_at" class="metadata-item">
            <label>更新时间：</label>
            <span>{{ formatDate(paper.updated_at) }}</span>
          </div>
        </div>
      </div>

      <div v-if="workloads.length > 0" class="detail-section">
        <h3 class="section-title">工作量数据</h3>
        <div class="workload-container">
          <div v-for="(workload, index) in workloads" :key="index" class="workload-item">
            <div class="workload-header">
              <h4 class="workload-title">{{ workload.title }}</h4>
              <div class="workload-meta">
                <span class="workload-type">{{ workload.type }}</span>
                <span class="workload-date">{{ formatDate(workload.date) }}</span>
              </div>
            </div>
            <div class="workload-content">
              <div class="workload-field">
                <span class="field-label">工作量：</span>
                <span class="field-value">{{ workload.amount }}</span>
              </div>
              <div class="workload-field">
                <span class="field-label">状态：</span>
                <span class="field-value">{{ workload.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="isLoadingWorkload" class="detail-section">
        <h3 class="section-title">工作量数据</h3>
        <div class="loading-spinner">
          <span class="spinner-border" role="status">
            <span class="visually-hidden">加载中...</span>
          </span>
        </div>
      </div>
      <div v-else-if="workloadError" class="detail-section">
        <h3 class="section-title">工作量数据</h3>
        <div class="error-message">
          {{ workloadError }}
        </div>
      </div>
      <div v-if="paper.paper_type === 'published' && workloads.length > 0" class="detail-section">
        <h3 class="section-title">作者贡献及工作量</h3>
        <div class="workload-table-container">
          <table class="workload-table">
            <thead>
              <tr>
                <th>作者ID</th>
                <th>贡献比例</th>
                <th>工作量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="workload in workloads" :key="workload.author_id">
                <td>{{ workload.author_id }}</td>
                <td>{{ (workload.contribution_ratio * 100).toFixed(1) }}%</td>
                <td>{{ workload.workload.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="paper.paper_type === 'published' && isLoadingWorkload" class="detail-section">
        <p>正在加载工作量数据...</p>
      </div>
      <div v-else-if="paper.paper_type === 'published' && workloadError" class="detail-section">
        <p class="error-message">{{ workloadError }}</p>
      </div>
    </div>    <div class="detail-actions">
      <button
        v-if="paper.file_path"
        @click="downloadFile"
        class="btn btn-success"
        :disabled="downloading"
      >
        {{ downloading ? '⏳ 下载中...' : '⬇️ 下载文件' }}
      </button>
      <button @click="$emit('edit', paper)" class="btn btn-primary">
        ✏️ 编辑
      </button>
      <button @click="$emit('close')" class="btn btn-secondary">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useCategories } from "../composables/useCategories";
import { downloadPaper, downloadReference, getPaperWorkload } from "../services/api";
import { useToast } from "../composables/useToast";
import { useTeam } from "../composables/useTeam";
import PdfViewer from "./PdfViewer.vue";

const props = defineProps({
  paper: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "close"]);

const { getCategoryName, loadCategories } = useCategories();
const { showToast } = useToast();
const { currentTeam } = useTeam();

const showPreview = ref(false);
const previewUrl = ref("");
const downloading = ref(false);
const workloads = ref([]);
const isLoadingWorkload = ref(false);
const workloadError = ref(null);

// 计算作者文本
const authorsText = computed(() => {
  if (!props.paper.authors) return '';
  if (typeof props.paper.authors === 'string') return props.paper.authors;
  if (Array.isArray(props.paper.authors)) {
    return props.paper.authors
      .map(author => typeof author === 'string' ? author : author.name)
      .join(', ');
  }
  return '';
});

// 计算分类文本
const categoriesText = computed(() => {
  if (!props.paper.categories) {
    return props.paper.category_id ? getCategoryName(props.paper.category_id) : '';
  }
  if (Array.isArray(props.paper.categories)) {
    return props.paper.categories.map(cat => cat.name).join(', ');
  }
  return '';
});

// 处理关键词列表
const keywordList = computed(() => {
  if (!props.paper.keywords) return [];

  if (typeof props.paper.keywords === 'string') {
    return props.paper.keywords.split(",").map((k) => k.trim()).filter(k => k);
  }

  if (Array.isArray(props.paper.keywords)) {
    return props.paper.keywords.map(keyword =>
      typeof keyword === 'string' ? keyword : keyword.name
    ).filter(k => k);
  }
  return [];
});

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFileName = (fileUrl) => {
  if (!fileUrl) return "";
  return fileUrl.split("/").pop() || "paper-file";
};

const getFileExtension = (fileUrl) => {
  if (!fileUrl) return "";
  const fileName = getFileName(fileUrl);
  return fileName.split(".").pop().toLowerCase();
};

const isPreviewable = computed(() => {
  const extension = getFileExtension(props.paper.file_path);
  // 支持预览的文件类型
  return ["pdf", "jpg", "jpeg", "png", "gif"].includes(extension);
});

const isPdf = computed(() => {
  return getFileExtension(props.paper.file_path) === "pdf";
});

const isImage = computed(() => {
  const extension = getFileExtension(props.paper.file_path);
  return ["jpg", "jpeg", "png", "gif"].includes(extension);
});

const previewFile = () => {
  if (!props.paper.file_path) {
    showToast("没有可预览的文件", "warning");
    return;
  }

  if (!isPreviewable.value) {
    showToast("该文件类型不支持在线预览，请下载后查看", "warning");
    return;
  }

  try {    // 在实际环境中，这里可能需要通过API获取预览URL
    // 这里简单地使用file_path作为预览地址
    previewUrl.value = props.paper.file_path;
    showPreview.value = true;
  } catch (error) {
    console.error("预览文件失败:", error);
    showToast("预览文件失败，请尝试下载查看", "error");
  }
};

const closePreview = () => {
  showPreview.value = false;
  previewUrl.value = "";
};

const downloadFile = async () => {  if (!props.paper.file_path) {
    showToast("没有可下载的文件", "warning");
    return;
  }

  downloading.value = true;

  try {
    showToast("正在准备下载文件...", "info");    // 根据项目类型选择不同的下载API
    let response;
    if (props.paper._itemType === 'reference') {
      // 参考文献：使用references API
      response = await downloadReference(props.paper.id);
    } else {
      // 论文：使用papers API
      response = await downloadPaper(props.paper.id);
    }// 从Content-Disposition头部提取文件名，如果有的话
    const contentDisposition = response.headers['content-disposition'];
    let fileName = getFileName(props.paper.file_path);

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        fileName = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // 确定内容类型
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // 创建下载链接
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast("文件下载成功", "success");
  } catch (error) {
    console.error("下载文件失败:", error);
    showToast("下载文件失败，请重试", "error");
  } finally {
    downloading.value = false;
  }
};

const fetchWorkload = async () => {
  if (props.paper.paper_type !== 'published' || !props.paper.id) {
    return;
  }

  isLoadingWorkload.value = true;
  workloadError.value = null;
  workloads.value = [];

  try {
    const response = await getPaperWorkload(props.paper.id);
    workloads.value = response.workloads || [];
  } catch (error) {
    console.error("Failed to fetch paper workload:", error);
    workloadError.value = "无法加载工作量数据，请稍后重试。";
    if (error.response && error.response.status === 404) {
      workloadError.value = "找不到该论文的工作量数据。";
    }
  } finally {
    isLoadingWorkload.value = false;  }
};

// 加载适当的分类数据
const loadAppropriateCategories = async () => {
  if (props.paper?.paper_type === 'literature') {
    // 文献使用参考文献分类（团队特定）
    await loadCategories('references', currentTeam.value?.id);
  } else {
    // 发表论文使用公共论文分类
    await loadCategories('papers');
  }
};

onMounted(() => {
  fetchWorkload();
  loadAppropriateCategories();
});

watch(() => props.paper, () => {
  fetchWorkload();
  loadAppropriateCategories();
}, { deep: true });
</script>

<style scoped>
.paper-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl);
}

.detail-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-md);
  border-bottom: 2px solid var(--color-border);
}

.paper-type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: 25px;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: var(--space-md);
}

.paper-type-badge.published {
  background: linear-gradient(135deg, #6e7fc4 0%, #7d6cc0 100%);
  color: var(--white);
  box-shadow: 0 3px 8px rgba(125, 108, 192, 0.15);
}

.paper-type-badge.literature {
  background: linear-gradient(
    135deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  color: var(--white);
  box-shadow: 0 3px 8px rgba(125, 108, 192, 0.15);
}

.badge-icon {
  font-size: var(--text-base);
}

.paper-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.detail-content {
  margin-bottom: var(--space-xl);
}

.detail-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-700);
  margin: 0 0 var(--space-md) 0;
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--primary-200);
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: var(--space-xs);
  background: linear-gradient(90deg, var(--primary-600), var(--primary-300));
  border-radius: var(--space-xs);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-md);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.info-item label {
  font-weight: 600;
  color: var(--color-text-soft);
  min-width: 80px;
  flex-shrink: 0;
}

.info-item span {
  color: var(--color-text);
  word-break: break-word;
}

.journal {
  font-weight: 600;
  color: var(--color-primary);
}

.doi {
  font-family: monospace;
  font-size: var(--text-sm);
  background: var(--color-bg-soft);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
}

.impact-factor {
  font-weight: 600;
  color: var(--primary-600);
}

.category {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  font-weight: 500;
}

.abstract-content {
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg-soft);
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  border-left: var(--border-width-thick) solid var(--color-primary);
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.keyword-tag {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  font-weight: 500;
}

.notes-content {
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--primary-50);
  padding: var(--space-lg);
  border-radius: var(--border-radius);
  border-left: var(--border-width-thick) solid var(--primary-400);
}

.url-container {
  padding: var(--space-md);
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
}

.paper-url {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  word-break: break-all;
}

.paper-url:hover {
  text-decoration: underline;
}

.external-icon {
  font-size: var(--text-sm);
  opacity: 0.7;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
}

.metadata-item label {
  font-weight: 600;
  color: var(--color-text-soft);
  min-width: 80px;
}

.metadata-item span {
  color: var(--color-text);
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: var(--space-md) var(--space-2xl);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-small {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  color: var(--white);
}

.btn-secondary {
  background: var(--color-bg-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--gray-200);
  color: var(--gray-800);
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.btn-preview {
  background: var(--primary-50);
  color: var(--primary-700);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--primary-200);
  box-shadow: 0 2px 6px rgba(125, 108, 192, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
}

.btn-preview:before,
.btn-preview:after {
  content: "";
  position: absolute;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-preview:before {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(125, 108, 192, 0.12) 0%,
    rgba(125, 108, 192, 0.06) 100%
  );
  opacity: 0;
  transform: translateY(5px);
}

.btn-preview:after {
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.25) 0%,
    transparent 60%
  );
  opacity: 0;
  transform: scale(0.8);
}

.btn-preview:hover {
  background: var(--primary-500);
  color: var(--white);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(125, 108, 192, 0.2),
    0 6px 16px rgba(125, 108, 192, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
  border-color: var(--primary-400);
}

.btn-preview:hover:before {
  opacity: 1;
  transform: translateY(0);
}

.btn-preview:hover:after {
  opacity: 1;
  transform: scale(1);
}

.btn-preview:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-download {
  background: var(--primary-50);
  color: var(--primary-700);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--primary-200);
  box-shadow: 0 2px 6px rgba(125, 108, 192, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
}

.btn-download:before,
.btn-download:after {
  content: "";
  position: absolute;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-download:before {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(125, 108, 192, 0.12) 0%,
    rgba(125, 108, 192, 0.06) 100%
  );
  opacity: 0;
  transform: translateY(5px);
}

.btn-download:after {
  top: -50%;
  left: -10%;
  width: 120%;
  height: 150%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.25) 0%,
    transparent 60%
  );
  opacity: 0;
  transform: scale(0.8);
}

.btn-download:hover {
  background: var(--primary-500);
  color: var(--white);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(125, 108, 192, 0.2),
    0 6px 16px rgba(125, 108, 192, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
  border-color: var(--primary-400);
}

.btn-download:hover:before {
  opacity: 1;
  transform: translateY(0);
}

.btn-download:hover:after {
  opacity: 1;
  transform: scale(1);
  animation: downloadGlow 1.5s ease-in-out infinite alternate;
}

@keyframes downloadGlow {
  0% {
    opacity: 0.6;
    transform: translateY(0%) scale(1);
  }
  100% {
    opacity: 0.9;
    transform: translateY(10%) scale(1.05);
  }
}

.btn-download:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.1),
    inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.file-container {
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
  padding: var(--space-md);
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
}

.file-icon {
  font-size: var(--space-lg);
}

.file-name {
  font-weight: 500;
  color: var(--color-text);
  word-break: break-all;
}

.file-actions {
  display: flex;
  gap: var(--space-sm);
}

.file-preview {
  margin-top: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.preview-header {
  padding: var(--space-md) var(--space-md);
  background: var(--color-bg-soft);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h4 {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.preview-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--color-text-light);
  width: var(--space-lg);
  height: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.preview-close:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.preview-content {
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
}

.preview-frame {
  width: 100%;
  height: 600px;
  border: none;
}

.image-preview {
  max-width: 100%;
  max-height: 600px;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

.preview-not-available {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-3xl) var(--space-xl);
  text-align: center;
}

.preview-icon {
  font-size: var(--space-3xl);
  opacity: 0.6;
}

.preview-not-available p {
  color: var(--color-text-light);
  margin: 0;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.error-message {
  color: #dc3545;
  font-style: italic;
  text-align: center;
  padding: var(--space-md);
}

/* 作者合作网络样式 */
.authors-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.authors-text {
  font-weight: 500;
  color: var(--color-text);
}

.authors-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .paper-detail {
    padding: var(--space-md);
  }

  .paper-title {
    font-size: var(--text-xl);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
