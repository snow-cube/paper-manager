import { ref, watch } from 'vue';

// 全局状态，用于触发论文更新事件
const paperUpdateTrigger = ref(0);

/**
 * 论文更新事件处理 composable
 * 用于在论文添加、编辑、删除后通知所有相关组件刷新数据
 */
export function usePaperEvents() {
  /**
   * 触发论文更新事件
   * @param {string} eventType - 事件类型: 'add', 'edit', 'delete'
   * @param {string} paperType - 论文类型: 'published', 'literature'
   * @param {Object} paper - 论文数据（可选）
   */
  const triggerPaperUpdate = (eventType = 'update', paperType = 'all', paper = null) => {
    console.log(`Triggering paper update event: ${eventType} for ${paperType}`, paper);
    paperUpdateTrigger.value++;
  };

  /**
   * 监听论文更新事件
   * @param {Function} callback - 回调函数
   * @param {string} filterType - 过滤特定类型的更新（可选）
   */
  const onPaperUpdate = (callback, filterType = null) => {
    const stopWatcher = watch(
      paperUpdateTrigger,
      (newValue, oldValue) => {
        if (newValue > oldValue) {
          console.log('Paper update event received, calling callback');
          callback();
        }
      }
    );

    // 返回停止监听的函数
    return stopWatcher;
  };

  return {
    triggerPaperUpdate,
    onPaperUpdate
  };
}
