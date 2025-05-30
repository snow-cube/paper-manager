import { ref } from 'vue';

export function useConfirmDialog() {
  const dialogState = ref({
    visible: false,
    title: '确认操作',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    loading: false,
    resolve: null,
    reject: null
  });

  const showConfirmDialog = (options = {}) => {
    return new Promise((resolve, reject) => {
      dialogState.value = {
        visible: true,
        title: options.title || '确认操作',
        message: options.message || '',
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        loading: false,
        resolve,
        reject
      };
    });
  };

  const confirmDialog = async () => {
    try {
      if (dialogState.value.resolve) {
        dialogState.value.resolve(true);
      }
    } catch (error) {
      console.error('确认对话框错误:', error);
    } finally {
      closeDialog();
    }
  };

  const cancelDialog = () => {
    if (dialogState.value.reject) {
      dialogState.value.reject(false);
    }
    closeDialog();
  };

  const closeDialog = () => {
    dialogState.value.visible = false;
    dialogState.value.resolve = null;
    dialogState.value.reject = null;
  };

  const setLoading = (loading) => {
    dialogState.value.loading = loading;
  };

  // 便捷方法
  const confirmDelete = (itemName = '该项目') => {
    return showConfirmDialog({
      title: '确认删除',
      message: `确定要删除${itemName}吗？此操作无法撤销。`,
      confirmText: '删除',
      cancelText: '取消'
    });
  };

  const confirmAction = (action, message) => {
    return showConfirmDialog({
      title: `确认${action}`,
      message: message || `确定要${action}吗？`,
      confirmText: action,
      cancelText: '取消'
    });
  };

  return {
    dialogState,
    showConfirmDialog,
    confirmDialog,
    cancelDialog,
    closeDialog,
    setLoading,
    confirmDelete,
    confirmAction
  };
}
