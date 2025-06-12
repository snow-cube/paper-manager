<template>
  <div class="paper-detail">
    <!-- 加载状态 -->
    <div v-if="isLoadingDetails" class="loading-state">
      <div class="loading-spinner">
        <span class="spinner-border" role="status">
          <span class="visually-hidden">正在加载详细信息...</span>
        </span>
      </div>
      <p>正在加载详细信息...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="detailsError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ detailsError }}</p>
      <button @click="fetchDetailData" class="btn btn-primary">重新加载</button>
    </div>
    <!-- 正常内容 -->
    <div v-else>
      <!-- 头部信息卡片 -->
      <div class="header-card">
        <div
          class="paper-type-badge"
          :class="isLiteratureType ? 'literature' : 'published'"
        >
          <span class="badge-icon">{{ isLiteratureType ? "📚" : "🎓" }}</span>
          {{ isLiteratureType ? "参考文献" : "发表论文" }}
        </div>
        <h1 class="paper-title">{{ displayData.title }}</h1>

        <!-- 核心信息摘要 -->
        <div class="core-info">
          <div class="core-info-item">
            <span class="info-icon">👤</span>
            <span class="info-text">{{ authorsText }}</span>
          </div>
          <div
            v-if="journalText && journalText !== '未知期刊'"
            class="core-info-item"
          >
            <span class="info-icon">📖</span>
            <span class="info-text">{{ journalText }}</span>
          </div>
          <div class="core-info-item">
            <span class="info-icon">📅</span>
            <span class="info-text">{{ yearText }}</span>
          </div>
          <div
            v-if="!isLiteratureType && displayData.impact_factor"
            class="core-info-item"
          >
            <span class="info-icon">📊</span>
            <span class="info-text"
              >影响因子: {{ displayData.impact_factor }}</span
            >
          </div>
        </div>
      </div>
      <div class="detail-content">
        <!-- 双列布局区域 -->
        <div class="dual-column-section">
          <!-- 左列：基本信息卡片 -->
          <div class="left-column">
            <div class="info-card">
              <div class="card-header">
                <span class="card-icon">ℹ️</span>
                <h3 class="card-title">详细信息</h3>
              </div>
              <div class="card-content">
                <div class="info-grid">
                  <!-- DOI信息 -->
                  <div v-if="displayData.doi" class="info-item highlight">
                    <div class="info-label">
                      <span class="label-icon">🔗</span>
                      <span>DOI</span>
                    </div>
                    <span class="doi">{{ displayData.doi }}</span>
                  </div>

                  <!-- 分类信息 -->
                  <div class="info-item">
                    <div class="info-label">
                      <span class="label-icon">🏷️</span>
                      <span>分类</span>
                    </div>
                    <span class="category">{{ categoriesText }}</span>
                  </div>
                  <!-- 期刊信息 -->
                  <div
                    v-if="
                      !isLiteratureType &&
                      journalText &&
                      journalText !== '未知期刊'
                    "
                    class="info-item"
                  >
                    <div class="info-label">
                      <span class="label-icon">📖</span>
                      <span>期刊</span>
                    </div>
                    <span class="journal-name">{{ journalText }}</span>
                  </div>
                  <!-- 团队信息 -->
                  <div
                    v-if="displayData.team_id || displayData.team_name"
                    class="info-item"
                  >
                    <div class="info-label">
                      <span class="label-icon">👥</span>
                      <span>团队</span>
                    </div>
                    <span class="team">{{ teamText }}</span>
                  </div>
                  <!-- 发表日期/年份信息 -->
                  <div v-if="publicationDateOrYear" class="info-item">
                    <div class="info-label">
                      <span class="label-icon">📅</span>
                      <span>{{ isLiteratureType ? "年份" : "发表日期" }}</span>
                    </div>
                    <span class="publication-date">{{
                      publicationDateOrYear
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右列：元数据卡片 -->
          <div class="right-column">
            <div class="info-card">
              <div class="card-header">
                <span class="card-icon">🕒</span>
                <h3 class="card-title">元数据</h3>
              </div>
              <div class="card-content">
                <div class="metadata-grid">
                  <div class="metadata-item">
                    <div class="metadata-label">
                      <span class="label-icon">📅</span>
                      <span>创建时间</span>
                    </div>
                    <span class="metadata-value">{{
                      formatDate(displayData.created_at)
                    }}</span>
                  </div>
                  <div v-if="displayData.updated_at" class="metadata-item">
                    <div class="metadata-label">
                      <span class="label-icon">✏️</span>
                      <span>更新时间</span>
                    </div>
                    <span class="metadata-value">{{
                      formatDate(displayData.updated_at)
                    }}</span>
                  </div>
                  <div v-if="displayData.created_by_id" class="metadata-item">
                    <div class="metadata-label">
                      <span class="label-icon">👤</span>
                      <span>创建者</span>
                    </div>
                    <span class="metadata-value">{{
                      displayData.created_by_id
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 全宽度卡片区域 -->
        <div class="full-width-section">
          <!-- 关键词卡片 - 位于摘要上方，占据全宽度 -->
          <div v-if="keywordList.length > 0" class="content-card">
            <div class="card-header">
              <span class="card-icon">🏷️</span>
              <h3 class="card-title">关键词</h3>
            </div>
            <div class="card-content">
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
          </div>

          <!-- 摘要卡片 -->
          <div v-if="displayData.abstract" class="content-card">
            <div class="card-header">
              <span class="card-icon">📄</span>
              <h3 class="card-title">摘要</h3>
            </div>
            <div class="card-content">
              <div class="abstract-content">
                {{ displayData.abstract }}
              </div>
            </div>
          </div>

          <!-- 链接卡片 - 单独显示 -->
          <div v-if="displayData.url" class="content-card">
            <div class="card-header">
              <span class="card-icon">🔗</span>
              <h3 class="card-title">外部链接</h3>
            </div>
            <div class="card-content">
              <div class="url-container">
                <a :href="displayData.url" target="_blank" class="paper-url">
                  {{ displayData.url }}
                  <span class="external-icon">↗️</span>
                </a>
              </div>
            </div>
          </div>

          <!-- 笔记卡片 -->
          <div v-if="displayData.notes" class="content-card">
            <div class="card-header">
              <span class="card-icon">📝</span>
              <h3 class="card-title">笔记</h3>
            </div>
            <div class="card-content">
              <div class="notes-content">
                {{ displayData.notes }}
              </div>
            </div>
          </div>

          <!-- 文件卡片 -->
          <div v-if="displayData.file_path" class="content-card">
            <div class="card-header">
              <span class="card-icon">📁</span>
              <h3 class="card-title">附件文件</h3>
            </div>
            <div class="card-content">
              <div class="file-container">
                <div class="file-info">
                  <div class="file-icon">📄</div>
                  <div class="file-details">
                    <div class="file-name">
                      {{ getFileName(displayData.file_path) }}
                    </div>
                    <div class="file-meta">
                      {{ getFileSize(displayData.file_path) }} ·
                      {{ getFileType(displayData.file_path) }}
                    </div>
                  </div>
                </div>
                <div class="file-actions">
                  <button
                    @click="previewFile"
                    class="btn btn-small btn-preview"
                  >
                    <span class="btn-icon">👁️</span> 预览
                  </button>
                  <button
                    @click="downloadFile"
                    class="btn btn-small btn-download"
                  >
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
          </div>
        </div>
        <!-- 工作量数据卡片 - 仅对发表论文显示 -->
        <div
          v-if="!isLiteratureType && workloads.length > 0"
          class="content-card workload-card"
        >
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h3 class="card-title">作者贡献及工作量</h3>
          </div>
          <div class="card-content">
            <div class="workload-table-container">
              <table class="workload-table">
                <thead>
                  <tr>
                    <th>
                      <span class="table-header">
                        <span class="header-icon">👤</span>
                        <span>作者ID</span>
                      </span>
                    </th>
                    <th>
                      <span class="table-header">
                        <span class="header-icon">📈</span>
                        <span>贡献比例</span>
                      </span>
                    </th>
                    <th>
                      <span class="table-header">
                        <span class="header-icon">⏱️</span>
                        <span>工作量</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="workload in workloads" :key="workload.author_id">
                    <td>{{ workload.author_id }}</td>
                    <td>
                      <div class="contribution-cell">
                        <div class="contribution-bar">
                          <div
                            class="contribution-fill"
                            :style="{
                              width: workload.contribution_ratio * 100 + '%',
                            }"
                          ></div>
                        </div>
                        <span class="contribution-text"
                          >{{
                            (workload.contribution_ratio * 100).toFixed(1)
                          }}%</span
                        >
                      </div>
                    </td>
                    <td>
                      <span class="workload-value">{{
                        workload.workload.toFixed(2)
                      }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 工作量加载状态 -->
        <div
          v-else-if="!isLiteratureType && isLoadingWorkload"
          class="content-card"
        >
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h3 class="card-title">工作量数据</h3>
          </div>
          <div class="card-content">
            <div class="loading-spinner">
              <span class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
              </span>
              <span class="loading-text">正在加载工作量数据...</span>
            </div>
          </div>
        </div>

        <!-- 工作量错误状态 -->
        <div
          v-else-if="!isLiteratureType && workloadError"
          class="content-card"
        >
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h3 class="card-title">工作量数据</h3>
          </div>
          <div class="card-content">
            <div class="error-message">
              <span class="error-text">{{ workloadError }}</span>
              <button
                @click="fetchWorkload"
                class="btn btn-small btn-secondary"
              >
                <span class="btn-icon">🔄</span>
                重新加载
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <div class="action-group primary-actions">
          <button
            v-if="displayData.file_path"
            @click="downloadFile"
            class="btn btn-download-main"
            :disabled="downloading"
          >
            <span class="btn-icon">{{ downloading ? "⏳" : "⬇️" }}</span>
            {{ downloading ? "下载中..." : "下载文件" }}
          </button>
          <button @click="$emit('edit', displayData)" class="btn btn-edit">
            <span class="btn-icon">✏️</span>
            编辑
          </button>
        </div>
        <div class="action-group secondary-actions">
          <button @click="$emit('close')" class="btn btn-close">
            <span class="btn-icon">✕</span>
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useCategories } from "../../../composables/useCategories.js";
import { useCategoryEvents } from "../../../composables/useCategoryEvents.js";
import {
  downloadPaper,
  downloadReference,
  getPaper,
  getReference,
  getPaperWorkload,
} from "../../../services/api.js";
import { useToast } from "../../../composables/useToast.js";
import { useTeam } from "../../../composables/useTeam.js";
import { PdfViewer } from ".";

const props = defineProps({
  paper: {
    type: Object,
    required: true,
  },
  // 添加可选的详细数据获取标识
  loadDetails: {
    type: Boolean,
    default: false,
  },
  // 添加类型标识，优先使用此字段判断
  paperType: {
    type: String,
    default: null,
  },
});

defineEmits(["edit", "close"]);

const { getCategoryName, loadCategories } = useCategories();
const { showToast } = useToast();
const { currentTeam } = useTeam();
const { onCategoryUpdate } = useCategoryEvents();

const showPreview = ref(false);
const previewUrl = ref("");
const downloading = ref(false);
const workloads = ref([]);
const isLoadingWorkload = ref(false);
const workloadError = ref(null);
const detailData = ref(null);
const isLoadingDetails = ref(false);
const detailsError = ref(null);

// 获取实际显示的数据（详细数据优先，否则使用传入的基本数据）
const displayData = computed(() => detailData.value || props.paper);

// 判断是否为文献类型 - 优先使用props.paperType，避免循环依赖
const isLiteratureType = computed(() => {
  // 优先使用传入的paperType参数
  if (props.paperType) {
    return props.paperType === "literature";
  }

  // 基于初始传入的paper数据判断
  const initialData = props.paper;

  // 常见的文献类型标识字段
  return (
    initialData.paper_type === "literature" ||
    initialData.type === "literature" ||
    initialData._itemType === "reference" ||
    initialData.itemType === "reference" ||
    // 如果有category信息，也可以作为判断依据
    (initialData.category && initialData.category.type === "reference") ||
    // 检查URL路径或组件上下文（如果来自Literature页面）
    window.location.pathname.includes("/literature")
  );
});

// 计算作者文本 - 根据 API 规范处理不同的数据格式
const authorsText = computed(() => {
  const authors = displayData.value.authors;
  if (!authors) return "未知作者";

  // 对于参考文献，authors 是字符串类型
  if (typeof authors === "string") return authors;

  // 对于发表论文，authors 是字符串数组
  if (Array.isArray(authors)) {
    return authors.join(", ");
  }

  return String(authors);
});

// 计算期刊信息 - 优先使用 journal_name，后备使用 journal
const journalText = computed(() => {
  return (
    displayData.value.journal_name || displayData.value.journal || "未知期刊"
  );
});

// 计算发表年份 - 处理不同的日期字段
const yearText = computed(() => {
  // 参考文献使用 publication_year
  if (displayData.value.publication_year) {
    return displayData.value.publication_year.toString();
  }

  // 发表论文使用 publication_date
  if (displayData.value.publication_date) {
    return new Date(displayData.value.publication_date)
      .getFullYear()
      .toString();
  }

  // 后备方案：从 year 字段获取
  if (displayData.value.year) {
    return displayData.value.year.toString();
  }

  return "未知年份";
});

// 计算分类文本 - 根据 API 规范处理分类信息
const categoriesText = computed(() => {
  const data = displayData.value;

  // 优先使用 category_name（API 直接返回的分类名称）
  if (data.category_name) {
    return data.category_name;
  }

  // 处理 category 对象（参考文献的完整分类对象）
  if (data.category && typeof data.category === "object") {
    return data.category.name || "未知分类";
  }

  // 使用 category_id 查找分类名称
  if (data.category_id) {
    return getCategoryName(data.category_id) || "未知分类";
  }

  // 处理 categories 数组（如果存在）
  if (data.categories && Array.isArray(data.categories)) {
    const categoryNames = data.categories
      .map((cat) => (typeof cat === "object" ? cat.name : cat))
      .filter((name) => name);
    return categoryNames.length > 0 ? categoryNames.join(", ") : "未分类";
  }

  return "未分类";
});

// 处理关键词列表 - 根据 API 规范，关键词是字符串数组
const keywordList = computed(() => {
  const keywords = displayData.value.keywords;
  if (!keywords) return [];

  // 如果已经是数组，直接返回
  if (Array.isArray(keywords)) {
    return keywords.filter((k) => k && k.trim());
  }

  // 如果是字符串，按逗号分割
  if (typeof keywords === "string") {
    return keywords
      .split(/[,，;；\s]+/)
      .map((k) => k.trim())
      .filter((k) => k);
  }

  return [];
});

// 计算团队信息
const teamText = computed(() => {
  return displayData.value.team_name || currentTeam.value?.name || "未知团队";
});

// 计算发表日期或年份信息
const publicationDateOrYear = computed(() => {
  const data = displayData.value;

  if (isLiteratureType.value) {
    // 参考文献：优先使用 publication_year，后备使用 year
    if (data.publication_year) {
      return data.publication_year.toString();
    }
    if (data.year) {
      return data.year.toString();
    }
    return null; // 如果没有年份数据，返回 null 不显示
  } else {
    // 发表论文：优先使用 publication_date，后备使用 year
    if (data.publication_date) {
      return formatPublicationDate(data.publication_date);
    }
    if (data.year) {
      return data.year.toString();
    }
    return null; // 如果没有日期数据，返回 null 不显示
  }
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

const formatPublicationDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getFileName = (fileUrl) => {
  if (!fileUrl) return "";
  return fileUrl.split("/").pop() || "paper-file";
};

const getFileSize = (filePath) => {
  // 模拟文件大小信息，实际应该从API获取
  return "未知大小";
};

const getFileType = (filePath) => {
  if (!filePath) return "未知类型";
  const extension = filePath.split(".").pop()?.toLowerCase();
  const typeMap = {
    pdf: "PDF文档",
    doc: "Word文档",
    docx: "Word文档",
    xls: "Excel表格",
    xlsx: "Excel表格",
    ppt: "PowerPoint演示",
    pptx: "PowerPoint演示",
    txt: "文本文件",
    jpg: "图片文件",
    jpeg: "图片文件",
    png: "图片文件",
    gif: "图片文件",
  };
  return typeMap[extension] || "其他文件";
};

const getFileExtension = (fileUrl) => {
  if (!fileUrl) return "";
  const fileName = getFileName(fileUrl);
  return fileName.split(".").pop().toLowerCase();
};

const isPreviewable = computed(() => {
  const extension = getFileExtension(displayData.value.file_path);
  // 支持预览的文件类型
  return ["pdf", "jpg", "jpeg", "png", "gif"].includes(extension);
});

const isPdf = computed(() => {
  return getFileExtension(displayData.value.file_path) === "pdf";
});

const isImage = computed(() => {
  const extension = getFileExtension(displayData.value.file_path);
  return ["jpg", "jpeg", "png", "gif"].includes(extension);
});

// 获取详细数据
const fetchDetailData = async () => {
  if (!props.loadDetails || !displayData.value.id) return;

  isLoadingDetails.value = true;
  detailsError.value = null;

  try {
    let response;
    if (isLiteratureType.value) {
      response = await getReference(displayData.value.id);
    } else {
      response = await getPaper(displayData.value.id);
    }
    detailData.value = response;
  } catch (error) {
    console.error("Failed to fetch detail data:", error);
    detailsError.value = "无法加载详细信息，请稍后重试。";
    if (error.response && error.response.status === 404) {
      detailsError.value = "找不到该项目的详细信息。";
    }
  } finally {
    isLoadingDetails.value = false;
  }
};

const previewFile = () => {
  if (!displayData.value.file_path) {
    showToast("没有可预览的文件", "warning");
    return;
  }

  if (!isPreviewable.value) {
    showToast("该文件类型不支持在线预览，请下载后查看", "warning");
    return;
  }

  try {
    // 在实际环境中，这里可能需要通过API获取预览URL
    // 这里简单地使用file_path作为预览地址
    previewUrl.value = displayData.value.file_path;
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

const downloadFile = async () => {
  if (!displayData.value.file_path) {
    showToast("没有可下载的文件", "warning");
    return;
  }

  downloading.value = true;

  try {
    showToast("正在准备下载文件...", "info");

    // 根据项目类型选择不同的下载API
    let response;
    if (isLiteratureType.value) {
      // 参考文献：使用references API
      response = await downloadReference(displayData.value.id);
    } else {
      // 论文：使用papers API
      response = await downloadPaper(displayData.value.id);
    }

    // 从Content-Disposition头部提取文件名，如果有的话
    const contentDisposition = response.headers["content-disposition"];
    let fileName = getFileName(displayData.value.file_path);

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        fileName = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    // 确定内容类型
    const contentType =
      response.headers["content-type"] || "application/octet-stream";

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
  if (isLiteratureType.value || !displayData.value.id) {
    return;
  }

  isLoadingWorkload.value = true;
  workloadError.value = null;
  workloads.value = [];

  try {
    const response = await getPaperWorkload(displayData.value.id);
    workloads.value = response.workloads || [];
  } catch (error) {
    console.error("Failed to fetch paper workload:", error);
    workloadError.value = "无法加载工作量数据，请稍后重试。";
    if (error.response && error.response.status === 404) {
      workloadError.value = "找不到该论文的工作量数据。";
    }
  } finally {
    isLoadingWorkload.value = false;
  }
};

// 加载适当的分类数据
const loadAppropriateCategories = async () => {
  if (isLiteratureType.value) {
    // 文献使用参考文献分类（团队特定）
    await loadCategories("references", currentTeam.value?.id);
  } else {
    // 发表论文使用公共论文分类
    await loadCategories("papers");
  }
};

onMounted(() => {
  fetchDetailData();
  fetchWorkload();
  loadAppropriateCategories();

  // Listen for category updates
  onCategoryUpdate(() => {
    loadAppropriateCategories();
  });
});

watch(
  () => props.paper,
  () => {
    fetchDetailData();
    fetchWorkload();
    loadAppropriateCategories();
  },
  { deep: true }
);

watch(
  () => props.loadDetails,
  (newVal) => {
    if (newVal) {
      fetchDetailData();
    }
  }
);
</script>

<style scoped>
.paper-detail {
  max-width: 1200px; /* 增加最大宽度以利用Modal空间 */
  margin: 0 auto;
  padding: var(--space-lg);
  min-height: fit-content;
  width: 100%;
}

/* 详情内容区域 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* 双列布局区域 */
.dual-column-section {
  display: grid;
  grid-template-columns: 2fr 1fr; /* 左侧占2份，右侧占1份 */
  gap: var(--space-lg);
  align-items: flex-start; /* 改为顶部对齐，不强制拉伸高度 */
}

/* 小卡片的双列布局 */
.dual-column-section.small-cards {
  grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr);
}

/* 全宽度区域 */
.full-width-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* 左右列样式 */
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
}

/* 卡片保持自然高度 */
.left-column .info-card,
.right-column .info-card {
  display: flex;
  flex-direction: column;
}

/* 让卡片内容区域保持自然高度 */
.left-column .card-content,
.right-column .card-content {
  display: flex;
  flex-direction: column;
}

/* 工作量卡片特殊样式 */
.workload-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
  border: 2px solid var(--primary-200);
}

/* 头部信息卡片 */
.header-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  backdrop-filter: blur(12px);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.04);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.header-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--primary-400) 25%,
    var(--primary-500) 50%,
    var(--primary-400) 75%,
    transparent 100%
  );
  opacity: 0.8;
}

.paper-type-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border-radius: 24px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: var(--space-md);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.paper-type-badge.published {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25),
    0 1px 3px rgba(99, 102, 241, 0.15);
}

.paper-type-badge.published:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 5px 12px rgba(99, 102, 241, 0.3),
    0 2px 4px rgba(99, 102, 241, 0.2);
}

.paper-type-badge.literature {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.25),
    0 1px 3px rgba(16, 185, 129, 0.15);
}

.paper-type-badge.literature:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 5px 12px rgba(16, 185, 129, 0.3),
    0 2px 4px rgba(16, 185, 129, 0.2);
}

.badge-icon {
  font-size: var(--text-sm);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.paper-title {
  font-size: clamp(var(--text-lg), 3vw, var(--text-2xl));
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 var(--space-md) 0;
  line-height: 1.25;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  letter-spacing: -0.02em;
}

/* 核心信息摘要 */
.core-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.core-info-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: var(--text-sm);
  color: var(--gray-700);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.core-info-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  border-color: var(--primary-200);
}

.info-icon {
  font-size: var(--text-base);
  opacity: 0.8;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.info-text {
  font-weight: 500;
  color: var(--gray-800);
}

/* 卡片通用样式 */
.info-card,
.content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--space-md);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.info-card:hover,
.content-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.card-header {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.08) 0%,
    rgba(139, 92, 246, 0.05) 100%
  );
  padding: var(--space-md);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.card-icon {
  font-size: var(--text-lg);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  opacity: 0.9;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
  letter-spacing: -0.01em;
}

.card-content {
  padding: var(--space-md);
}

/* 信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(280px, 1fr)
  ); /* 在较宽的左列中可以显示多列 */
  gap: var(--space-sm); /* 与 metadata-grid 保持一致的间距 */
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: rgba(248, 250, 252, 0.6);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 75px;
  justify-content: center;
}

.info-item:hover {
  background: rgba(248, 250, 252, 0.8);
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
}

.info-item.highlight {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.08) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.08),
    0 1px 2px rgba(99, 102, 241, 0.06);
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;
  color: var(--gray-600);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.label-icon {
  font-size: var(--text-sm);
  opacity: 0.8;
}

.doi {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
  font-size: var(--text-sm);
  color: var(--gray-800);
  font-weight: 500;
  word-break: break-word;
}

.category,
.team {
  color: var(--gray-800);
  font-size: var(--text-sm);
  font-weight: 500;
  word-break: break-word;
}

.publication-date {
  color: var(--gray-800);
  font-size: var(--text-sm);
  font-weight: 500;
  word-break: break-word;
}

.journal-name {
  color: var(--gray-800);
  font-size: var(--text-sm);
  font-weight: 500;
  word-break: break-word;
}

/* 摘要和内容区域美化 */
.abstract-content {
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--gray-700);
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.8) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  padding: var(--space-xl);
  padding-left: calc(var(--space-xl) + var(--space-md));
  border-radius: var(--border-radius-lg);
  position: relative;
  margin: 0;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  text-align: justify;
  word-spacing: 0.1em;
}

.abstract-content::before {
  content: "";
  position: absolute;
  left: var(--space-md);
  top: var(--space-md);
  bottom: var(--space-md);
  width: 4px;
  background: linear-gradient(
    180deg,
    var(--primary-500) 0%,
    var(--primary-400) 50%,
    var(--primary-300) 100%
  );
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.25);
}

.notes-content {
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--gray-700);
  background: linear-gradient(
    135deg,
    rgba(254, 252, 232, 0.8) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  padding: var(--space-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(251, 191, 36, 0.2);
  position: relative;
  margin: 0;
  box-shadow: 0 2px 6px rgba(251, 191, 36, 0.08),
    0 1px 3px rgba(251, 191, 36, 0.04);
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: justify;
}

.notes-content::before {
  content: "📝";
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  font-size: var(--text-lg);
  opacity: 0.6;
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.keyword-tag {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.12) 0%,
    rgba(139, 92, 246, 0.08) 100%
  );
  color: var(--primary-700);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-xs);
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  letter-spacing: 0.3px;
}

.keyword-tag:hover {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.18) 0%,
    rgba(139, 92, 246, 0.12) 100%
  );
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(99, 102, 241, 0.15),
    0 1px 3px rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.25);
}

.notes-content {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--gray-700);
  background: linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  border-left: 3px solid #f59e0b;
  position: relative;
}

.notes-content::before {
  content: "📝";
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  font-size: var(--text-lg);
  opacity: 0.6;
}

.url-container {
  padding: var(--space-lg);
  background: linear-gradient(
    135deg,
    var(--blue-50) 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--blue-200);
}

.paper-url {
  color: var(--blue-600);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  word-break: break-all;
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.paper-url:hover {
  background: rgba(59, 130, 246, 0.1);
  text-decoration: underline;
  transform: translateX(2px);
}

.external-icon {
  font-size: var(--text-sm);
  transition: transform 0.2s ease;
}

.paper-url:hover .external-icon {
  transform: translate(2px, -2px);
}

/* 文件信息样式 */
.file-container {
  background: linear-gradient(
    135deg,
    var(--gray-50) 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border-radius: var(--border-radius);
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  border: 1px solid var(--gray-200);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
}

.file-icon {
  font-size: var(--text-xl);
  color: var(--primary-500);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.file-name {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--text-sm);
}

.file-meta {
  font-size: var(--text-xs);
  color: var(--gray-500);
  font-weight: 500;
}

.file-actions {
  display: flex;
  gap: var(--space-sm);
}

/* 元数据网格 */
.metadata-grid {
  display: grid;
  grid-template-columns: 1fr; /* 右侧较窄，保持单列 */
  gap: var(--space-sm);
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: rgba(248, 250, 252, 0.6);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 75px;
  justify-content: center;
}

.metadata-item:hover {
  background: rgba(248, 250, 252, 0.8);
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 元数据项的紧凑样式 */
.metadata-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;
  color: var(--gray-600);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.metadata-value {
  color: var(--gray-800);
  font-weight: 500;
  font-size: var(--text-sm);
  word-break: break-word;
}

/* 工作量表格增强 */
.workload-table-container {
  overflow: hidden;
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
  background: white;
}

.workload-table {
  width: 100%;
  border-collapse: collapse;
}

.workload-table th,
.workload-table td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}

.workload-table th {
  background: linear-gradient(
    135deg,
    var(--primary-50) 0%,
    var(--primary-25) 100%
  );
  color: var(--primary-700);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.header-icon {
  font-size: var(--text-xs);
  opacity: 0.8;
}

.workload-table tbody tr {
  transition: all 0.2s ease;
}

.workload-table tbody tr:hover {
  background: linear-gradient(
    135deg,
    var(--primary-25) 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
}

.workload-table tbody tr:last-child td {
  border-bottom: none;
}

.contribution-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.contribution-bar {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.contribution-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.contribution-text {
  font-weight: 600;
  color: var(--primary-600);
  min-width: 40px;
  text-align: right;
  font-size: var(--text-xs);
}

.workload-value {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--text-sm);
}

/* 操作按钮区域 */
.action-bar {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.action-group {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.primary-actions {
  flex: 1;
}

.secondary-actions {
  justify-content: flex-end;
}

/* 按钮样式增强 */
.btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-small {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  border-radius: var(--border-radius);
}

.btn-icon {
  font-size: var(--text-sm);
  transition: transform 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.btn:hover .btn-icon {
  transform: scale(1.05);
}

.btn-download-main {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.25),
    0 1px 3px rgba(16, 185, 129, 0.15);
}

.btn-download-main:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 5px 12px rgba(16, 185, 129, 0.3),
    0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-edit {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25),
    0 1px 3px rgba(99, 102, 241, 0.15);
}

.btn-edit:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 0 5px 12px rgba(99, 102, 241, 0.3),
    0 2px 4px rgba(99, 102, 241, 0.2);
}

.btn-close {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(248, 250, 252, 0.9)
  );
  color: var(--gray-700);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.btn-close:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1),
    rgba(248, 250, 252, 0.95)
  );
  color: var(--gray-800);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
  border-color: rgba(99, 102, 241, 0.2);
}

.btn-preview,
.btn-download {
  background: var(--white);
  color: var(--primary-600);
  border: 1px solid var(--primary-200);
  box-shadow: var(--shadow-xs);
}

.btn-preview:hover,
.btn-download:hover {
  background: var(--primary-50);
  color: var(--primary-700);
  border-color: var(--primary-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-lg);
  margin: var(--space-lg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.spinner-border {
  width: 2rem;
  height: 2rem;
  border: 0.25em solid var(--primary-200);
  border-right-color: var(--primary-500);
  border-radius: 50%;
  animation: spinner-border 0.8s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--gray-600);
  font-size: var(--text-sm);
  font-weight: 500;
}

.error-state .error-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.error-state h3 {
  color: var(--gray-800);
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.error-state p {
  color: var(--gray-600);
  margin: 0 0 var(--space-lg) 0;
  font-size: var(--text-sm);
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  background: linear-gradient(135deg, #fef2f2 0%, #fce8e6 100%);
  color: #dc2626;
  padding: var(--space-lg);
  border-radius: var(--border-radius-lg);
  border: 1px solid #fecaca;
}

.error-text {
  flex: 1;
  font-weight: 500;
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* 文件预览 */
.file-preview {
  margin-top: var(--space-lg);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: white;
}

.preview-header {
  padding: var(--space-lg);
  background: linear-gradient(
    135deg,
    var(--gray-50) 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h4 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--gray-800);
}

.preview-close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  cursor: pointer;
  color: var(--gray-500);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.preview-close:hover {
  background: var(--gray-100);
  color: var(--gray-700);
  transform: scale(1.1);
}

.preview-content {
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
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
  gap: var(--space-lg);
  padding: var(--space-3xl);
  text-align: center;
  color: var(--gray-600);
}

.preview-icon {
  font-size: var(--space-3xl);
  opacity: 0.6;
  margin-bottom: var(--space-md);
}

.preview-not-available p {
  margin: 0;
  font-size: var(--text-base);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dual-column-section {
    grid-template-columns: 3fr 2fr; /* 在中等屏幕上调整比例 */
  }

  .info-grid {
    grid-template-columns: 1fr; /* 在较小宽度时改为单列 */
  }
}

@media (max-width: 1024px) {
  .dual-column-section {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .dual-column-section.small-cards {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: repeat(
      auto-fit,
      minmax(240px, 1fr)
    ); /* 在单列布局时恢复多列 */
  }
}

@media (max-width: 768px) {
  .paper-detail {
    padding: var(--space-md);
    max-width: 100%;
  }

  .header-card,
  .card-content {
    padding: var(--space-lg);
  }

  .core-info {
    flex-direction: column;
    align-items: center;
  }

  .core-info-item {
    width: 100%;
    justify-content: center;
  }

  .dual-column-section {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr; /* 移动端单列显示 */
  }

  .action-bar {
    flex-direction: column;
  }

  .action-group {
    width: 100%;
    justify-content: center;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .file-container {
    flex-direction: column;
    align-items: stretch;
  }

  .file-actions {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .paper-title {
    font-size: var(--text-xl);
  }

  .header-card,
  .card-content {
    padding: var(--space-md);
  }

  .core-info-item {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-sm);
  }
}

/* 动画和交互增强 */
@media (prefers-reduced-motion: no-preference) {
  .info-card,
  .content-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .keyword-tag,
  .info-item,
  .metadata-item {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* 深色模式支持（如果需要） */
@media (prefers-color-scheme: dark) {
  .paper-detail {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  .header-card,
  .info-card,
  .content-card {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .paper-title {
    color: var(--gray-100);
  }
  .card-title {
    color: var(--primary-300);
  }
}
</style>
