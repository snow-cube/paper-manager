import { downloadPaper, downloadReference } from './api'

/**
 * 统一的下载服务
 * 根据项目类型自动选择正确的下载API
 */
export const downloadItem = async (item) => {
  if (!item || !item.id) {
    throw new Error('无效的项目数据')
  }

  if (!item.file_path) {
    throw new Error('没有可下载的文件')
  }

  // 根据项目类型选择API
  if (item._itemType === 'reference') {
    return await downloadReference(item.id)
  } else {
    return await downloadPaper(item.id)
  }
}

/**
 * 获取下载文件名
 */
export const getDownloadFileName = (item, response) => {
  // 优先从响应头获取文件名
  const contentDisposition = response?.headers?.['content-disposition']
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '')
    }
  }

  // 从文件路径提取文件名
  if (item.file_path) {
    const fileName = item.file_path.split('/').pop()
    if (fileName && fileName !== 'undefined') {
      return fileName
    }
  }

  // 使用论文标题作为备选文件名
  if (item.title) {
    return `${item.title}.pdf`
  }

  // 最后的备选方案
  return `${item._itemType === 'reference' ? 'reference' : 'paper'}-${item.id}.pdf`
}

/**
 * 执行文件下载
 */
export const triggerDownload = (blob, fileName, contentType = 'application/octet-stream') => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
