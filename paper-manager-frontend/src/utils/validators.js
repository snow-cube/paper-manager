/**
 * 表单验证工具函数
 */

// 常用验证规则
export const validators = {
  // 必填验证
  required: (message = '此字段为必填项') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message
    }
    return true
  },

  // 最小长度验证
  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `至少需要${min}个字符`
    }
    return true
  },

  // 最大长度验证
  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `不能超过${max}个字符`
    }
    return true
  },

  // 邮箱验证
  email: (message = '请输入有效的邮箱地址') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message
    }
    return true
  },

  // URL验证
  url: (message = '请输入有效的URL') => (value) => {
    if (value) {
      try {
        new URL(value)
      } catch {
        return message
      }
    }
    return true
  },

  // DOI验证
  doi: (message = 'DOI格式不正确，应为 10.xxxx/xxxxx 格式') => (value) => {
    if (value && !/^10\.\d{4,}\/[\S]+$/.test(value.trim())) {
      return message
    }
    return true
  },

  // 数字范围验证
  numberRange: (min, max, message) => (value) => {
    const num = Number(value)
    if (isNaN(num) || num < min || num > max) {
      return message || `请输入${min}到${max}之间的数字`
    }
    return true
  },

  // 正则表达式验证
  pattern: (regex, message = '格式不正确') => (value) => {
    if (value && !regex.test(value)) {
      return message
    }
    return true
  },

  // 日期验证
  date: (message = '请输入有效的日期') => (value) => {
    if (value && isNaN(Date.parse(value))) {
      return message
    }
    return true
  },

  // 过去日期验证
  pastDate: (message = '日期不能是未来日期') => (value) => {
    if (value) {
      const date = new Date(value)
      const now = new Date()
      if (date > now) {
        return message
      }
    }
    return true
  },

  // 文件类型验证
  fileType: (allowedTypes, message) => (file) => {
    if (file && file instanceof File) {
      const fileName = file.name.toLowerCase()
      const isAllowed = allowedTypes.some(type => fileName.endsWith(type.toLowerCase()))
      if (!isAllowed) {
        return message || `只支持 ${allowedTypes.join(', ')} 格式的文件`
      }
    }
    return true
  },

  // 文件大小验证
  fileSize: (maxSizeInMB, message) => (file) => {
    if (file && file instanceof File) {
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024
      if (file.size > maxSizeInBytes) {
        return message || `文件大小不能超过${maxSizeInMB}MB`
      }
    }
    return true
  }
}

// 组合验证器
export function combineValidators(...validators) {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value)
      if (result !== true) {
        return result
      }
    }
    return true
  }
}

// 条件验证器
export function conditionalValidator(condition, validator) {
  return (value, formData) => {
    if (condition(formData)) {
      return validator(value)
    }
    return true
  }
}

// 异步验证器包装器
export function asyncValidator(asyncFn, loadingMessage = '验证中...') {
  return async (value) => {
    try {
      const result = await asyncFn(value)
      return result
    } catch (error) {
      return error.message || '验证失败'
    }
  }
}

// 常用的复合验证规则
export const commonRules = {
  // 论文标题
  paperTitle: combineValidators(
    validators.required('请输入论文标题'),
    validators.minLength(5, '标题至少需要5个字符'),
    validators.maxLength(500, '标题不能超过500个字符')
  ),

  // 作者名称
  authorNames: (value) => {
    if (!value || !value.trim()) return '请输入作者信息'
    const authors = value.split(',').map(name => name.trim()).filter(name => name.length > 0)
    if (authors.length === 0) return '请输入至少一个作者'
    if (authors.some(author => author.length < 2)) return '作者姓名至少需要2个字符'
    if (authors.some(author => author.length > 50)) return '作者姓名不能超过50个字符'
    return true
  },

  // 关键词
  keywords: (value, required = false) => {
    if (required && (!value || !value.trim())) return '请输入关键词'
    if (value && value.trim()) {
      const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0)
      if (keywords.length === 0) return '请输入至少一个关键词'
      if (keywords.length > 10) return '关键词数量不能超过10个'
      if (keywords.some(keyword => keyword.length < 2)) return '关键词至少需要2个字符'
      if (keywords.some(keyword => keyword.length > 30)) return '关键词不能超过30个字符'
    }
    return true
  },

  // 期刊名称
  journal: combineValidators(
    validators.required('请输入期刊名称'),
    validators.minLength(2, '期刊名称至少需要2个字符'),
    validators.maxLength(200, '期刊名称不能超过200个字符')
  ),

  // DOI
  doi: validators.doi(),

  // 论文文件
  paperFile: combineValidators(
    validators.fileType(['.pdf', '.doc', '.docx'], '只支持 PDF、DOC、DOCX 格式的文件'),
    validators.fileSize(10, '文件大小不能超过10MB')
  )
}
