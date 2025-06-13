import { ref } from "vue";
import {
  downloadItem,
  getDownloadFileName,
  triggerDownload,
  getValidFileUrl,
} from "../services/downloadService";
import { useToast } from "./useToast";

/**
 * 统一的文件下载组合式函数
 * 提供一致的下载逻辑，适用于详情页、卡片、列表项等所有场景
 */
export function useFileDownload() {
  const { showToast } = useToast();
  const downloading = ref(false);

  /**
   * 执行文件下载
   * @param {Object} item - 论文或文献对象
   * @param {Object} options - 下载选项
   * @param {string} options.paperType - 论文类型 'papers' | 'literature'
   * @param {Function} options.onStart - 下载开始回调
   * @param {Function} options.onSuccess - 下载成功回调
   * @param {Function} options.onError - 下载失败回调
   * @param {Function} options.onFinally - 下载完成回调（无论成功失败）
   */
  const downloadFile = async (item, options = {}) => {
    // 验证输入参数
    if (!item || !item.id) {
      const errorMsg = "无效的项目数据";
      showToast(errorMsg, "error");
      options.onError?.(new Error(errorMsg));
      return;
    }

    const fileUrl = getValidFileUrl(item);
    if (!fileUrl) {
      const errorMsg = "没有可下载的文件";
      showToast(errorMsg, "warning");
      options.onError?.(new Error(errorMsg));
      return;
    }

    // 防止重复下载
    if (downloading.value) {
      return;
    }

    downloading.value = true;

    try {
      // 执行开始回调
      options.onStart?.();
      showToast("正在准备下载文件...", "info");

      // 准备带有类型信息的项目对象
      const itemWithType = {
        ...item,
        _itemType: options.paperType === "literature" ? "reference" : "paper",
        paper_type:
          options.paperType ||
          item.paper_type ||
          (item._itemType === "reference" ? "literature" : "published"),
      };

      // 使用统一的下载服务
      const response = await downloadItem(itemWithType);

      // 获取文件名
      const fileName = getDownloadFileName(item, response);

      // 确定内容类型
      const contentType =
        response.headers["content-type"] || "application/octet-stream";

      // 触发下载
      triggerDownload(response.data, fileName, contentType);

      // 执行成功回调
      const successMsg = "文件下载成功";
      showToast(successMsg, "success");
      options.onSuccess?.({ fileName, contentType, size: response.data.size });
    } catch (error) {
      console.error("下载文件失败:", error);
      const errorMsg = error.message || "下载文件失败，请重试";
      showToast(errorMsg, "error");
      options.onError?.(error);
    } finally {
      downloading.value = false;
      options.onFinally?.();
    }
  };
  /**
   * 检查是否有可下载的文件
   * @param {Object} item - 论文或文献对象
   * @returns {boolean} 是否有可下载的文件
   */
  const hasDownloadableFile = (item) => {
    return !!getValidFileUrl(item);
  };

  /**
   * 获取下载按钮的状态
   * @param {Object} item - 论文或文献对象
   * @returns {Object} 按钮状态信息
   */
  const getDownloadButtonState = (item) => {
    const hasFile = hasDownloadableFile(item);

    return {
      visible: hasFile,
      disabled: !hasFile || downloading.value,
      loading: downloading.value,
      icon: downloading.value ? "⏳" : "⬇️",
      text: downloading.value ? "下载中..." : "下载",
      title: hasFile
        ? downloading.value
          ? "正在下载..."
          : "下载文件"
        : "没有可下载的文件",
    };
  };

  return {
    downloading,
    downloadFile,
    hasDownloadableFile,
    getDownloadButtonState,
  };
}
