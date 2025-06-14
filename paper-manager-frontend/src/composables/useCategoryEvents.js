import { ref, watch } from 'vue';

// 创建事件总线用于分类更新通知
const categoryUpdateEvent = ref(0);

export function useCategoryEvents() {
  // 触发分类更新事件
  const triggerCategoryUpdate = () => {
    categoryUpdateEvent.value++;
  };

  // 监听分类更新事件
  const onCategoryUpdate = (callback) => {
    const stopWatcher = watch(categoryUpdateEvent, callback, { immediate: false });
    return stopWatcher;
  };

  return {
    categoryUpdateEvent,
    triggerCategoryUpdate,
    onCategoryUpdate
  };
}
