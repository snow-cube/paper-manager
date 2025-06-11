/**
 * 论文和文献错误处理工具函数
 */

/**
 * 处理论文/文献提交错误
 * @param {Error} error - 错误对象
 * @param {string} operationType - 操作类型 ('create' | 'update')
 * @param {string} paperType - 论文类型 ('published' | 'literature')
 * @returns {string} 用户友好的错误消息
 */
export const handlePaperSubmissionError = (error, operationType = 'create', paperType = 'published') => {
  console.error(`${operationType} ${paperType} error:`, error);

  const isCreating = operationType === 'create';
  const isLiterature = paperType === 'literature';

  const entityName = isLiterature ? '文献' : '论文';
  const actionName = isCreating ? '添加' : '更新';

  // 检查是否有响应错误
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        // 400 错误通常是数据验证错误
        if (data?.detail) {
          const detail = data.detail;

          // DOI 重复错误
          if (detail.includes('DOI') || detail.includes('doi')) {
            if (detail.includes('already exists') || detail.includes('重复') || detail.includes('存在')) {
              return `${actionName}${entityName}失败：该 DOI 已存在，请检查是否重复提交`;
            }
          }

          // 标题重复错误
          if (detail.includes('title') || detail.includes('标题')) {
            if (detail.includes('already exists') || detail.includes('重复') || detail.includes('存在')) {
              return `${actionName}${entityName}失败：该标题已存在，请修改标题后重试`;
            }
          }

          // 期刊相关错误
          if (detail.includes('journal') || detail.includes('期刊')) {
            if (detail.includes('not found') || detail.includes('不存在')) {
              return `${actionName}${entityName}失败：所选期刊不存在，请重新选择期刊`;
            }
          }

          // 分类相关错误
          if (detail.includes('category') || detail.includes('分类')) {
            if (detail.includes('not found') || detail.includes('不存在')) {
              return `${actionName}${entityName}失败：所选分类不存在，请重新选择分类`;
            }
          }

          // 团队相关错误
          if (detail.includes('team') || detail.includes('团队')) {
            if (detail.includes('not found') || detail.includes('不存在')) {
              return `${actionName}${entityName}失败：团队不存在，请检查团队信息`;
            }
            if (detail.includes('permission') || detail.includes('权限')) {
              return `${actionName}${entityName}失败：没有权限在此团队中操作`;
            }
          }

          // 作者相关错误
          if (detail.includes('author') || detail.includes('作者')) {
            return `${actionName}${entityName}失败：作者信息格式不正确，请检查作者列表`;
          }

          // 关键词相关错误
          if (detail.includes('keyword') || detail.includes('关键词')) {
            return `${actionName}${entityName}失败：关键词格式不正确，请使用逗号分隔多个关键词`;
          }

          // 文件相关错误
          if (detail.includes('file') || detail.includes('文件')) {
            if (detail.includes('size') || detail.includes('大小')) {
              return `${actionName}${entityName}失败：文件过大，请选择小于 10MB 的文件`;
            }
            if (detail.includes('format') || detail.includes('格式')) {
              return `${actionName}${entityName}失败：文件格式不支持，请上传 PDF、DOC 或 DOCX 文件`;
            }
          }

          // 通用数据验证错误
          return `${actionName}${entityName}失败：${detail}`;
        } else if (data?.message) {
          return `${actionName}${entityName}失败：${data.message}`;
        } else {
          return `${actionName}${entityName}失败：数据验证失败，请检查输入信息`;
        }

      case 401:
        return `${actionName}${entityName}失败：登录状态已过期，请重新登录`;

      case 403:
        return `${actionName}${entityName}失败：权限不足，您没有权限执行此操作`;

      case 404:
        if (isCreating) {
          return `${actionName}${entityName}失败：相关资源不存在，请检查期刊或分类信息`;
        } else {
          return `${actionName}${entityName}失败：${entityName}不存在或已被删除`;
        }

      case 409:
        // 冲突错误，通常是重复数据
        return `${actionName}${entityName}失败：数据冲突，该${entityName}可能已存在`;

      case 413:
        return `${actionName}${entityName}失败：上传文件过大，请选择较小的文件`;

      case 422:
        // 数据验证错误
        if (data?.detail && Array.isArray(data.detail)) {
          const validationErrors = data.detail.map(err => {
            if (err.loc && err.msg) {
              const field = err.loc[err.loc.length - 1];
              const fieldName = getFieldDisplayName(field);
              return `${fieldName}: ${err.msg}`;
            }
            return err.msg || err;
          }).join('；');
          return `${actionName}${entityName}失败：${validationErrors}`;
        } else if (data?.detail) {
          return `${actionName}${entityName}失败：${data.detail}`;
        } else {
          return `${actionName}${entityName}失败：数据格式不正确，请检查输入信息`;
        }

      case 429:
        return `${actionName}${entityName}失败：操作过于频繁，请稍后重试`;

      case 500:
      case 502:
      case 503:
      case 504:
        return `${actionName}${entityName}失败：服务器错误，请稍后重试`;

      default:
        if (data?.detail || data?.message) {
          return `${actionName}${entityName}失败：${data.detail || data.message}`;
        }
        return `${actionName}${entityName}失败：未知错误，请联系管理员`;
    }
  }

  // 网络错误或其他错误
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return `${actionName}${entityName}失败：网络连接错误，请检查网络连接`;
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return `${actionName}${entityName}失败：请求超时，请重试`;
  }

  // 其他错误
  if (error.message) {
    return `${actionName}${entityName}失败：${error.message}`;
  }

  return `${actionName}${entityName}失败，请重试`;
};

/**
 * 获取字段的显示名称
 * @param {string} fieldName - 字段名
 * @returns {string} 显示名称
 */
const getFieldDisplayName = (fieldName) => {
  const fieldMap = {
    title: '标题',
    author_names: '作者',
    keyword_names: '关键词',
    abstract: '摘要',
    doi: 'DOI',
    journal_id: '期刊',
    category_id: '分类',
    team_id: '团队',
    publication_date: '发表日期',
    publication_year: '发表年份',
    paper_type: '论文类型',
    file: '文件'
  };

  return fieldMap[fieldName] || fieldName;
};

/**
 * 处理文件上传错误
 * @param {Error} error - 错误对象
 * @param {string} paperType - 论文类型 ('published' | 'literature')
 * @returns {string} 用户友好的错误消息
 */
export const handleFileUploadError = (error, paperType = 'published') => {
  console.error('File upload error:', error);

  const isLiterature = paperType === 'literature';
  const entityName = isLiterature ? '文献' : '论文';

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        if (data?.detail?.includes('file') || data?.detail?.includes('文件')) {
          if (data.detail.includes('format') || data.detail.includes('格式')) {
            return `${entityName}文件上传失败：文件格式不支持，请上传 PDF、DOC 或 DOCX 文件`;
          }
          if (data.detail.includes('size') || data.detail.includes('大小')) {
            return `${entityName}文件上传失败：文件过大，请选择小于 10MB 的文件`;
          }
        }
        return `${entityName}文件上传失败：文件格式或大小不符合要求`;

      case 404:
        return `${entityName}文件上传失败：${entityName}不存在或已被删除`;

      case 413:
        return `${entityName}文件上传失败：文件过大，请选择较小的文件`;

      case 415:
        return `${entityName}文件上传失败：不支持的文件格式，请上传 PDF、DOC 或 DOCX 文件`;

      default:
        return `${entityName}文件上传失败：${data?.detail || data?.message || '服务器错误'}`;
    }
  }

  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return `${entityName}文件上传失败：网络连接错误，请检查网络连接`;
  }

  return `${entityName}文件上传失败，请重试`;
};
