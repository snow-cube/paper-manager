/**
 * 文件相关工具函数
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 从文件路径或URL中提取文件名
 * @param {string} filePath - 文件路径或URL
 * @returns {string} 文件名
 */
export const getFileName = (filePath) => {
  if (!filePath) return "";

  // 处理URL格式
  try {
    const url = new URL(filePath);
    const pathname = url.pathname;
    return pathname.split("/").pop() || "";
  } catch {
    // 不是有效URL，按路径处理
    return filePath.split("/").pop() || filePath.split("\\").pop() || "";
  }
};

/**
 * 根据文件路径获取文件类型
 * @param {string} filePath - 文件路径
 * @returns {string} 文件类型描述
 */
export const getFileType = (filePath) => {
  if (!filePath) return "未知类型";

  const fileName = getFileName(filePath);
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const typeMap = {
    // 文档类型
    pdf: "PDF文档",
    doc: "Word文档",
    docx: "Word文档",
    xls: "Excel表格",
    xlsx: "Excel表格",
    ppt: "PowerPoint演示",
    pptx: "PowerPoint演示",
    txt: "文本文件",
    rtf: "RTF文档",

    // 图片类型
    jpg: "JPEG图片",
    jpeg: "JPEG图片",
    png: "PNG图片",
    gif: "GIF图片",
    bmp: "BMP图片",
    svg: "SVG图片",
    webp: "WebP图片",

    // 压缩文件
    zip: "ZIP压缩包",
    rar: "RAR压缩包",
    "7z": "7Z压缩包",
    tar: "TAR压缩包",
    gz: "GZ压缩包",

    // 媒体文件
    mp4: "MP4视频",
    avi: "AVI视频",
    mov: "MOV视频",
    mp3: "MP3音频",
    wav: "WAV音频",

    // 代码文件
    js: "JavaScript文件",
    ts: "TypeScript文件",
    html: "HTML文件",
    css: "CSS文件",
    py: "Python文件",
    java: "Java文件",
    cpp: "C++文件",
    c: "C文件",
    json: "JSON文件",
    xml: "XML文件",
    yaml: "YAML文件",
    yml: "YAML文件",
  };

  return typeMap[extension] || `${extension.toUpperCase()}文件`;
};

/**
 * 检查文件是否为图片类型
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为图片
 */
export const isImageFile = (filePath) => {
  if (!filePath) return false;

  const fileName = getFileName(filePath);
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
  return imageExtensions.includes(extension);
};

/**
 * 检查文件是否为文档类型
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为文档
 */
export const isDocumentFile = (filePath) => {
  if (!filePath) return false;

  const fileName = getFileName(filePath);
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const docExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "rtf",
  ];
  return docExtensions.includes(extension);
};

/**
 * 获取文件扩展名
 * @param {string} filePath - 文件路径
 * @returns {string} 文件扩展名（小写）
 */
export const getFileExtension = (filePath) => {
  if (!filePath) return "";

  const fileName = getFileName(filePath);
  return fileName.split(".").pop()?.toLowerCase() || "";
};
