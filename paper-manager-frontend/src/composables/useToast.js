import { ref } from 'vue'

// 全局Toast状态
const toasts = ref([])
let toastId = 0

export function useToast() {
  const addToast = ({ title, message, type = 'info', duration = 4000 }) => {
    const id = ++toastId
    const toast = {
      id,
      title,
      message,
      type,
      duration,
      visible: true
    }

    toasts.value.push(toast)

    // 自动移除Toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message, title = '成功') => {
    return addToast({ title, message, type: 'success' })
  }

  const error = (message, title = '错误') => {
    return addToast({ title, message, type: 'error', duration: 6000 })
  }

  const warning = (message, title = '警告') => {
    return addToast({ title, message, type: 'warning' })
  }

  const info = (message, title = '提示') => {
    return addToast({ title, message, type: 'info' })
  }
  const clear = () => {
    toasts.value = []
  }

  // 通用的 showToast 方法
  const showToast = (message, type = 'info', duration = 4000) => {
    const title = {
      'success': '成功',
      'error': '错误',
      'warning': '警告',
      'info': '提示'
    }[type] || '提示'

    return addToast({
      title,
      message,
      type,
      duration: type === 'error' ? 6000 : duration
    })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
    showToast
  }
}
