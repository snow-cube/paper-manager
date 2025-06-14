import {
  downloadPaper,
  downloadReference,
  exportPapersExcel,
  exportReferencesExcel,
} from "./api";

/**
 * 统一的下载服务
 * 根据项目类型自动选择正确的下载API
 * @param {Object} item - 论文或文献对象
 * @param {string} item.id - 项目ID
 * @param {string} item.file_url - 文件URL
 * @param {string} item._itemType - 项目类型标识 'reference' | 'paper' (可选)
 * @param {string} item.paper_type - 论文类型 'literature' | 'published' (可选)
 * @returns {Promise<Object>} 下载响应对象
 */
export const downloadItem = async (item) => {
  if (!item || !item.id) {
    throw new Error("无效的项目数据");
  }

  if (!item.file_url) {
    throw new Error("没有可下载的文件");
  }

  // 更精确的类型识别逻辑
  const isReference = determineItemType(item);

  if (isReference) {
    return await downloadReference(item.id);
  } else {
    return await downloadPaper(item.id);
  }
};

/**
 * 确定项目类型
 * @param {Object} item - 项目对象
 * @returns {boolean} true表示参考文献，false表示论文
 */
const determineItemType = (item) => {
  // 1. 优先使用明确的类型标识
  if (item._itemType === "reference") return true;
  if (item._itemType === "paper") return false;

  // 2. 根据论文类型判断
  if (item.paper_type === "literature") return true;
  if (item.paper_type === "published") return false;

  // 3. 根据URL路径判断（如果从路由传递的话）
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (pathname.includes("literature") || pathname.includes("references"))
      return true;
    if (pathname.includes("papers") || pathname.includes("publications"))
      return false;
  }

  // 4. 根据数据特征判断（参考文献通常有team_id，而论文可能没有）
  // 这个启发式方法可能不够准确，但作为最后的判断依据
  if (item.team_id && !item.impact_factor) return true;

  // 5. 默认为论文
  return false;
};

/**
 * 获取文件元数据
 * @param {string} fileUrl - 文件URL
 * @returns {Promise<Object>} 文件元数据
 */
export const getFileMetadata = async (fileUrl) => {
  try {
    if (!fileUrl) {
      throw new Error("Invalid file URL");
    }

    const response = await fetch(fileUrl, { method: "HEAD" });

    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type");
    const lastModified = response.headers.get("last-modified");

    return {
      size: contentLength ? parseInt(contentLength, 10) : null,
      type: contentType,
      lastModified: lastModified ? new Date(lastModified) : null,
      exists: response.ok,
    };
  } catch (error) {
    console.warn("Failed to get file metadata:", error);
    return {
      size: null,
      type: null,
      lastModified: null,
      exists: false,
    };
  }
};

/**
 * 检查文件是否可以预览
 * @param {string} fileName - 文件名
 * @returns {Object} 预览信息
 */
export const getFilePreviewInfo = (fileName) => {
  if (!fileName) {
    return { canPreview: false, type: "unknown", category: "unknown" };
  }

  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const previewableTypes = {
    // 文档类型
    pdf: { canPreview: true, type: "pdf", category: "document" },

    // 图片类型
    jpg: { canPreview: true, type: "image", category: "image" },
    jpeg: { canPreview: true, type: "image", category: "image" },
    png: { canPreview: true, type: "image", category: "image" },
    gif: { canPreview: true, type: "image", category: "image" },
    bmp: { canPreview: true, type: "image", category: "image" },
    webp: { canPreview: true, type: "image", category: "image" },
    svg: { canPreview: true, type: "image", category: "image" },

    // 文本类型
    txt: { canPreview: true, type: "text", category: "text" },
    md: { canPreview: true, type: "text", category: "text" },
    json: { canPreview: true, type: "text", category: "text" },
    xml: { canPreview: true, type: "text", category: "text" },
    csv: { canPreview: true, type: "text", category: "text" },
    log: { canPreview: true, type: "text", category: "text" },
    js: { canPreview: true, type: "text", category: "code" },
    ts: { canPreview: true, type: "text", category: "code" },
    css: { canPreview: true, type: "text", category: "code" },
    html: { canPreview: true, type: "text", category: "code" },
    py: { canPreview: true, type: "text", category: "code" },
    java: { canPreview: true, type: "text", category: "code" },
    cpp: { canPreview: true, type: "text", category: "code" },
    c: { canPreview: true, type: "text", category: "code" },

    // 视频类型
    mp4: { canPreview: true, type: "video", category: "media" },
    avi: { canPreview: true, type: "video", category: "media" },
    mov: { canPreview: true, type: "video", category: "media" },
    wmv: { canPreview: true, type: "video", category: "media" },
    flv: { canPreview: true, type: "video", category: "media" },
    webm: { canPreview: true, type: "video", category: "media" },
    mkv: { canPreview: true, type: "video", category: "media" },

    // 音频类型
    mp3: { canPreview: true, type: "audio", category: "media" },
    wav: { canPreview: true, type: "audio", category: "media" },
    ogg: { canPreview: true, type: "audio", category: "media" },
    aac: { canPreview: true, type: "audio", category: "media" },
    flac: { canPreview: true, type: "audio", category: "media" },
    m4a: { canPreview: true, type: "audio", category: "media" },

    // Office文档（有限预览支持）
    doc: { canPreview: true, type: "office", category: "document" },
    docx: { canPreview: true, type: "office", category: "document" },
    xls: { canPreview: true, type: "office", category: "document" },
    xlsx: { canPreview: true, type: "office", category: "document" },
    ppt: { canPreview: true, type: "office", category: "document" },
    pptx: { canPreview: true, type: "office", category: "document" },
  };

  return (
    previewableTypes[extension] || {
      canPreview: false,
      type: extension || "unknown",
      category: "unknown",
    }
  );
};

/**
 * 获取下载文件名
 */
export const getDownloadFileName = (item, response) => {
  // 优先从响应头获取文件名
  const contentDisposition = response?.headers?.["content-disposition"];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, "");
    }
  }

  // 从文件URL提取文件名
  if (item.file_url) {
    try {
      const url = new URL(item.file_url);
      const fileName = url.pathname.split("/").pop();
      if (fileName && fileName !== "undefined") {
        return fileName;
      }
    } catch {
      // URL解析失败，尝试简单字符串分割
      const fileName = item.file_url.split("/").pop();
      if (fileName && fileName !== "undefined") {
        return fileName;
      }
    }
  }

  // 使用论文标题作为备选文件名
  if (item.title) {
    return `${item.title}.pdf`;
  }

  // 最后的备选方案
  return `${item._itemType === "reference" ? "reference" : "paper"}-${
    item.id
  }.pdf`;
};

/**
 * 执行文件下载
 */
export const triggerDownload = (
  blob,
  fileName,
  contentType = "application/octet-stream"
) => {
  const url = window.URL.createObjectURL(
    new Blob([blob], { type: contentType })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * 导出论文/文献列表为Excel
 * @param {string} type - 'papers' 或 'literature'
 * @param {Object} searchParams - 搜索和筛选参数
 * @param {boolean} requireTeam - 是否需要团队
 * @param {Object} currentTeam - 当前团队对象
 */
export const exportToExcel = async (
  type,
  searchParams = {},
  requireTeam = false,
  currentTeam = null
) => {
  // 构建导出参数
  const exportParams = {};

  // 如果需要团队且有当前团队，添加团队ID
  if (requireTeam && currentTeam?.id) {
    exportParams.team_id = currentTeam.id;
  }

  // 添加搜索和筛选参数
  if (searchParams.keyword) exportParams.keyword = searchParams.keyword;
  if (searchParams.title) exportParams.title = searchParams.title;
  if (searchParams.author_name)
    exportParams.author_name = searchParams.author_name;
  if (searchParams.category_id)
    exportParams.category_id = searchParams.category_id;
  if (searchParams.journal_id)
    exportParams.journal_id = searchParams.journal_id;
  if (searchParams.start_date)
    exportParams.start_date = searchParams.start_date;
  if (searchParams.end_date) exportParams.end_date = searchParams.end_date;
  if (searchParams.publication_year)
    exportParams.publication_year = searchParams.publication_year;

  // 根据类型调用不同的导出API
  if (type === "literature") {
    return await exportReferencesExcel(exportParams);
  } else {
    return await exportPapersExcel(exportParams);
  }
};

/**
 * 生成Excel文件名
 * @param {string} type - 'papers' 或 'literature'
 * @param {Object} currentTeam - 当前团队对象
 */
export const generateExcelFileName = (type, currentTeam = null) => {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const typeName = type === "literature" ? "参考文献" : "论文";
  const teamName = currentTeam?.name || "";

  if (teamName) {
    return `${teamName}_${typeName}_${timestamp}.xlsx`;
  } else {
    return `${typeName}_${timestamp}.xlsx`;
  }
};

/**
 * 获取项目的有效文件URL
 * @param {Object} item - 论文或文献对象
 * @returns {string|null} 有效的文件URL
 */
export const getValidFileUrl = (item) => {
  if (!item) return null;

  return item.file_url || null;
};
