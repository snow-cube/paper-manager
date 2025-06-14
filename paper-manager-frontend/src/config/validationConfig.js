/**
 * 表单验证配置文件
 *
 * 集中管理验证相关的配置选项，方便维护和自定义
 */

// 文件验证配置
export const FILE_VALIDATION_CONFIG = {
  // 默认配置
  DEFAULT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [".pdf", ".doc", ".docx"],
    maxSizeMessage: "文件大小不能超过10MB",
    allowedTypesMessage: "只支持 PDF、DOC、DOCX 格式的文件",
  },

  // 扩展配置 - 支持更多格式
  EXTENDED: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
      ".md",
    ],
    maxSizeMessage: "文件大小不能超过50MB",
    allowedTypesMessage:
      "支持 PDF、Office文档（Word、Excel、PowerPoint）、文本文件格式",
  },

  // 仅文档配置
  DOCUMENTS_ONLY: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [".pdf", ".doc", ".docx"],
    maxSizeMessage: "文件大小不能超过50MB",
    allowedTypesMessage: "只支持 PDF、Word 文档格式",
  },

  // 图片配置
  IMAGES: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    maxSizeMessage: "图片大小不能超过5MB",
    allowedTypesMessage: "支持 JPG、PNG、GIF、BMP、WebP 格式的图片",
  },
};

// 根据论文类型获取合适的文件验证配置
export function getFileValidationConfig(
  paperType = "published",
  configType = "EXTENDED"
) {
  const baseConfig =
    FILE_VALIDATION_CONFIG[configType] || FILE_VALIDATION_CONFIG.EXTENDED;

  // 可以根据论文类型进行额外的配置调整
  switch (paperType) {
    case "published":
      // 发表论文可能需要更严格的格式要求
      return baseConfig;

    case "literature":
      // 参考文献可能允许更多格式
      return baseConfig;

    default:
      return baseConfig;
  }
}

// 字段验证配置
export const FIELD_VALIDATION_CONFIG = {
  title: {
    minLength: 5,
    maxLength: 500,
    messages: {
      required: "请输入论文标题",
      minLength: "标题至少需要5个字符",
      maxLength: "标题不能超过500个字符",
    },
  },

  abstract: {
    maxLength: 2000,
    messages: {
      maxLength: "摘要不能超过2000个字符",
    },
  },

  authorNames: {
    minAuthorNameLength: 2,
    maxAuthorNameLength: 50,
    messages: {
      required: "请输入作者信息",
      minLength: "作者姓名至少需要2个字符",
      maxLength: "作者姓名不能超过50个字符",
      noAuthors: "请输入至少一个作者",
    },
  },

  keywords: {
    minKeywordLength: 2,
    maxKeywordLength: 30,
    maxKeywordCount: 10,
    messages: {
      required: "发表论文必须填写关键词",
      minLength: "关键词至少需要2个字符",
      maxLength: "关键词不能超过30个字符",
      tooMany: "关键词数量不能超过10个",
      noKeywords: "请输入至少一个关键词",
    },
  },
};

// 获取完整的验证配置
export function getValidationConfig(options = {}) {
  const {
    paperType = "published",
    fileConfig = "EXTENDED",
    customFileConfig = {},
    customFieldConfig = {},
  } = options;

  const baseFileConfig = getFileValidationConfig(paperType, fileConfig);

  // 只合并非 undefined 的自定义配置
  const mergedFileConfig = { ...baseFileConfig };
  Object.keys(customFileConfig).forEach((key) => {
    if (customFileConfig[key] !== undefined) {
      mergedFileConfig[key] = customFileConfig[key];
    }
  });

  return {
    file: mergedFileConfig,
    field: {
      ...FIELD_VALIDATION_CONFIG,
      ...customFieldConfig,
    },
  };
}

export default {
  FILE_VALIDATION_CONFIG,
  FIELD_VALIDATION_CONFIG,
  getFileValidationConfig,
  getValidationConfig,
};
