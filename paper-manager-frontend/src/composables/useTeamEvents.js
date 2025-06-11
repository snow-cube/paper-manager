import { ref, watch } from 'vue';

// 全局状态，用于触发团队更新事件
const teamUpdateTrigger = ref(0);

/**
 * 团队更新事件处理 composable
 * 用于在团队添加、编辑、删除后通知所有相关组件刷新数据
 */
export function useTeamEvents() {
  /**
   * 触发团队更新事件
   * @param {string} eventType - 事件类型: 'add', 'edit', 'delete'
   * @param {Object} team - 团队数据（可选）
   */
  const triggerTeamUpdate = (eventType = 'update', team = null) => {
    console.log(`Triggering team update event: ${eventType}`, team);
    teamUpdateTrigger.value++;
  };

  /**
   * 监听团队更新事件
   * @param {Function} callback - 回调函数
   */
  const onTeamUpdate = (callback) => {
    const stopWatcher = watch(
      teamUpdateTrigger,
      (newValue, oldValue) => {
        if (newValue > oldValue) {
          console.log('Team update event received, calling callback');
          callback();
        }
      }
    );

    // 返回停止监听的函数
    return stopWatcher;
  };

  return {
    triggerTeamUpdate,
    onTeamUpdate
  };
}
