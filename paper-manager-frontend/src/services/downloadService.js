import {
  downloadPaper,
  downloadReference,
  exportPapersExcel,
  exportReferencesExcel,
} from "./api";

/**
 * 统一的下载服务
 * 根据项目类型自动选择正确的下载API
 */
export const downloadItem = async (item) => {
  if (!item || !item.id) {
    throw new Error("无效的项目数据");
  }

  if (!item.file_path) {
    throw new Error("没有可下载的文件");
  }

  // 根据项目类型选择API
  if (item._itemType === "reference") {
    return await downloadReference(item.id);
  } else {
    return await downloadPaper(item.id);
  }
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

  // 从文件路径提取文件名
  if (item.file_path) {
    const fileName = item.file_path.split("/").pop();
    if (fileName && fileName !== "undefined") {
      return fileName;
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
