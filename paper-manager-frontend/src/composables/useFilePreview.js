import { ref } from "vue";

/**
 * 文件预览相关功能的可组合函数
 */
export function useFilePreview() {
  const previewWindows = ref(new Map());
  /**
   * 在新标签页中打开文件预览
   * @param {Object} fileInfo - 文件信息对象
   * @param {string} fileInfo.fileUrl - 文件URL
   * @param {string} fileInfo.fileName - 文件名
   * @param {number} [fileInfo.fileSize] - 文件大小
   * @param {string|Date} [fileInfo.lastModified] - 最后修改时间
   * @param {Object} [options] - 选项（为了兼容性保留，但在标签页模式下不使用）
   * @returns {Window|null} 新标签页对象
   */
  const openFileInNewWindow = (fileInfo, options = {}) => {
    const { fileUrl, fileName, fileSize, lastModified } = fileInfo;
    console.log("openFileInNewWindow - 开始打开新标签页");
    console.log("openFileInNewWindow - 文件信息:", fileInfo);

    if (!fileUrl) {
      console.error("openFileInNewWindow - 文件URL是必需的");
      return null;
    }

    // 创建预览页面的URL参数
    const params = new URLSearchParams({
      fileUrl,
      fileName: fileName || "未知文件",
      fileSize: fileSize || "",
      lastModified: lastModified || "",
    }); // 构建新标签页URL - 使用 router 解析正确的路径
    const baseUrl = window.location.origin;
    // 直接使用路由路径，不依赖当前页面路径
    const newTabUrl = `${baseUrl}/file-preview?${params.toString()}`;

    console.log("openFileInNewWindow - 新标签页URL:", newTabUrl);

    // 生成标签页标识符
    const tabId = `preview_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      // 在新标签页中打开，使用 '_blank' 目标
      const newTab = window.open(newTabUrl, "_blank");

      if (newTab) {
        newTab.focus();

        // 存储标签页引用
        previewWindows.value.set(tabId, {
          window: newTab,
          fileInfo,
          openedAt: new Date(),
        });

        // 监听标签页关闭事件
        const checkClosed = setInterval(() => {
          if (newTab.closed) {
            clearInterval(checkClosed);
            previewWindows.value.delete(tabId);
          }
        }, 1000);

        console.log(
          `openFileInNewWindow - 文件预览标签页已成功打开: ${fileName}`
        );
        return newTab;
      } else {
        console.error(
          "openFileInNewWindow - 无法打开预览标签页，可能被浏览器阻止"
        );
        throw new Error("无法打开新标签页，请检查浏览器设置");
      }
    } catch (error) {
      console.error("openFileInNewWindow - 打开预览标签页失败:", error);
      throw error;
    }
  };
  /**
   * 关闭所有预览标签页
   */
  const closeAllPreviewWindows = () => {
    previewWindows.value.forEach((tabInfo, tabId) => {
      if (!tabInfo.window.closed) {
        tabInfo.window.close();
      }
    });
    previewWindows.value.clear();
    console.log("所有预览标签页已关闭");
  };

  /**
   * 获取当前打开的预览标签页数量
   */
  const getOpenWindowsCount = () => {
    // 清理已关闭的标签页
    previewWindows.value.forEach((tabInfo, tabId) => {
      if (tabInfo.window.closed) {
        previewWindows.value.delete(tabId);
      }
    });
    return previewWindows.value.size;
  };
  /**
   * 检查文件是否已在预览标签页中打开
   * @param {string} fileUrl - 文件URL
   * @returns {boolean} 是否已打开
   */
  const isFileAlreadyOpen = (fileUrl) => {
    for (const [tabId, tabInfo] of previewWindows.value) {
      if (tabInfo.fileInfo.fileUrl === fileUrl && !tabInfo.window.closed) {
        return true;
      }
    }
    return false;
  };

  /**
   * 聚焦到已打开的预览标签页
   * @param {string} fileUrl - 文件URL
   * @returns {boolean} 是否找到并聚焦了标签页
   */
  const focusExistingWindow = (fileUrl) => {
    for (const [tabId, tabInfo] of previewWindows.value) {
      if (tabInfo.fileInfo.fileUrl === fileUrl && !tabInfo.window.closed) {
        tabInfo.window.focus();
        return true;
      }
    }
    return false;
  };
  /**
   * 获取文件预览的建议标签页标题
   * @param {string} fileName - 文件名
   * @returns {string} 建议的标签页标题
   */
  const getSuggestedTabTitle = (fileName) => {
    return `预览 - ${fileName}`;
  };

  /**
   * 智能打开文件预览（检查是否已打开，如果是则聚焦，否则打开新标签页）
   * @param {Object} fileInfo - 文件信息对象
   * @param {Object} [options] - 选项（为兼容性保留）
   * @returns {Window|null} 新标签页对象或null（如果聚焦了现有标签页）
   */
  const smartOpenPreview = (fileInfo, options = {}) => {
    // 检查是否已经打开
    if (isFileAlreadyOpen(fileInfo.fileUrl)) {
      focusExistingWindow(fileInfo.fileUrl);
      return null;
    }

    // 直接打开新标签页
    return openFileInNewWindow(fileInfo, options);
  };
  return {
    openFileInNewWindow,
    closeAllPreviewWindows,
    getOpenWindowsCount,
    isFileAlreadyOpen,
    focusExistingWindow,
    getSuggestedTabTitle,
    smartOpenPreview,
    previewWindows: previewWindows.value,
  };
}
