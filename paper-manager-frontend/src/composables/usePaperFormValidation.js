import { ref, computed, watch } from "vue";
import { useToast } from "./useToast";
import { getValidationConfig } from "../config/validationConfig";

export function usePaperFormValidation(form, options = {}) {
  const errors = ref({});
  const touched = ref({});
  const { showToast } = useToast();
  // 获取验证配置，优先使用传入的选项，其次使用默认配置
  const paperType = computed(() => {
    if (options.paperType && typeof options.paperType === "function") {
      return options.paperType();
    }
    if (options.paperType && options.paperType.value) {
      return options.paperType.value;
    }
    return options.paperType || "published";
  });
  const validationConfig = getValidationConfig({
    paperType: paperType.value,
    fileConfig: options.fileConfig || "EXTENDED",
    customFileConfig:
      options.fileMaxSize ||
      options.fileAllowedTypes ||
      options.fileMaxSizeMessage ||
      options.fileAllowedTypesMessage
        ? {
            ...(options.fileMaxSize && { maxSize: options.fileMaxSize }),
            ...(options.fileAllowedTypes && {
              allowedTypes: options.fileAllowedTypes,
            }),
            ...(options.fileMaxSizeMessage && {
              maxSizeMessage: options.fileMaxSizeMessage,
            }),
            ...(options.fileAllowedTypesMessage && {
              allowedTypesMessage: options.fileAllowedTypesMessage,
            }),
          }
        : {},
    customFieldConfig: options.customFieldConfig,
  });
  // 验证配置选项，支持通过参数自定义
  const validationOptions = {
    file: validationConfig?.file || {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: [".pdf", ".doc", ".docx"],
      maxSizeMessage: "文件大小不能超过10MB",
      allowedTypesMessage: "只支持 PDF、DOC、DOCX 格式的文件",
    },
    field: validationConfig?.field || {},
    ...options.customValidationOptions,
  };

  // 验证规则
  const validationRules = {
    title: {
      required: true,
      minLength: 5,
      maxLength: 500,
      message: "请输入论文标题",
      minLengthMessage: "标题至少需要5个字符",
      maxLengthMessage: "标题不能超过500个字符",
    },
    paper_type: {
      required: true,
      message: "请选择论文类型",
    },
    author_names: {
      required: true,
      custom: (value) => {
        if (!value || !value.trim()) return "请输入作者信息";
        const authors = value
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
        if (authors.length === 0) return "请输入至少一个作者";
        if (authors.some((author) => author.length < 2))
          return "作者姓名至少需要2个字符";
        if (authors.some((author) => author.length > 50))
          return "作者姓名不能超过50个字符";
        return true;
      },
      message: "请输入作者信息",
    },
    keyword_names: {
      requiredIf: (formData) => formData.paper_type === "published",
      custom: (value, formData) => {
        if (formData.paper_type === "published") {
          if (!value || !value.trim()) return "发表论文必须填写关键词";
          const keywords = value
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
          if (keywords.length === 0) return "请输入至少一个关键词";
          if (keywords.length > 10) return "关键词数量不能超过10个";
          if (keywords.some((keyword) => keyword.length < 2))
            return "关键词至少需要2个字符";
          if (keywords.some((keyword) => keyword.length > 30))
            return "关键词不能超过30个字符";
        }
        return true;
      },
      message: "发表论文必须填写关键词",
    },
    abstract: {
      maxLength: 2000,
      maxLengthMessage: "摘要不能超过2000个字符",
    },
    journal_id: {
      requiredIf: (formData) => formData.paper_type === "published",
      custom: (value, formData) => {
        if (formData.paper_type === "published") {
          if (!value) return "请选择期刊";
          if (typeof value !== "number" || value <= 0) return "期刊选择无效";
        }
        return true;
      },
      message: "发表论文必须选择期刊",
    },
    doi: {
      custom: (value) => {
        if (value && value.trim()) {
          // 简单的DOI格式验证
          const doiPattern = /^10\.\d{4,}\/[\S]+$/;
          if (!doiPattern.test(value.trim())) {
            return "DOI格式不正确，应为 10.xxxx/xxxxx 格式";
          }
        }
        return true;
      },
    },
    publication_date: {
      custom: (value) => {
        if (value) {
          const date = new Date(value);
          const now = new Date();
          if (date > now) {
            return "发表日期不能是未来日期";
          }
          const minDate = new Date("1900-01-01");
          if (date < minDate) {
            return "发表日期不能早于1900年";
          }
        }
        return true;
      },
    },
    file: {
      custom: (value) => {
        if (value) {
          // 确保验证配置存在
          const fileConfig = validationOptions.file || {};
          const maxSize = fileConfig.maxSize || 10 * 1024 * 1024; // 默认10MB
          const allowedTypes = fileConfig.allowedTypes || [
            ".pdf",
            ".doc",
            ".docx",
          ];
          const maxSizeMessage =
            fileConfig.maxSizeMessage || "文件大小不能超过10MB";
          const allowedTypesMessage =
            fileConfig.allowedTypesMessage ||
            "只支持 PDF、DOC、DOCX 格式的文件";

          // 使用参数化的文件大小限制
          if (value.size > maxSize) {
            return maxSizeMessage;
          }

          // 使用参数化的文件类型限制
          const fileName = value.name.toLowerCase();
          const isAllowed = allowedTypes.some((type) =>
            fileName.endsWith(type.toLowerCase())
          );
          if (!isAllowed) {
            return allowedTypesMessage;
          }
        }
        return true;
      },
    },
  };
  // 验证单个字段
  const validateField = (field, value, formData = {}) => {
    const rule = validationRules[field];
    if (!rule) return true;

    // 清除旧错误
    delete errors.value[field];

    // 必填验证
    if (
      rule.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      errors.value[field] = rule.message;
      return false;
    }

    // 条件必填验证
    if (
      rule.requiredIf &&
      rule.requiredIf(formData) &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      errors.value[field] = rule.message;
      return false;
    }

    // 如果字段为空且不是必填，跳过其他验证
    if (!value || (typeof value === "string" && !value.trim())) {
      return true;
    }

    const stringValue =
      typeof value === "string" ? value.trim() : String(value);

    // 最小长度验证
    if (rule.minLength && stringValue.length < rule.minLength) {
      errors.value[field] =
        rule.minLengthMessage || `至少需要${rule.minLength}个字符`;
      return false;
    }

    // 最大长度验证
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      errors.value[field] =
        rule.maxLengthMessage || `不能超过${rule.maxLength}个字符`;
      return false;
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(value, formData);
      if (customResult !== true) {
        errors.value[field] = customResult;
        return false;
      }
    }

    return true;
  };

  // 标记字段为已接触
  const markTouched = (field) => {
    touched.value[field] = true;
  };

  // 获取字段错误（只有在字段被接触后才显示）
  const getFieldError = (field) => {
    return touched.value[field] ? errors.value[field] : null;
  };

  // 检查字段是否有错误
  const hasFieldError = (field) => {
    return Boolean(touched.value[field] && errors.value[field]);
  }; // 验证整个表单
  const validateForm = () => {
    if (!form?.value) {
      showToast("表单数据不可用", "error");
      return false;
    }

    errors.value = {};
    // 标记所有字段为已接触
    Object.keys(validationRules).forEach((field) => {
      touched.value[field] = true;
    });

    let isValid = true;
    const formData = form.value;

    Object.keys(validationRules).forEach((field) => {
      if (!validateField(field, formData[field], formData)) {
        isValid = false;
      }
    });

    // 特殊验证：作者贡献比例
    if (formData.paper_type === "published" && formData.author_names) {
      const authors = formData.author_names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
      if (authors.length > 1) {
        // 如果有多个作者，检查是否设置了贡献比例
        const contributions = formData.author_contribution_ratios || [];
        const totalContribution = contributions.reduce(
          (sum, ratio) => sum + (ratio || 0),
          0
        );

        if (totalContribution > 1) {
          errors.value["author_contributions"] = "作者贡献比例总和不能超过100%";
          isValid = false;
        }
      }
    }

    // 显示第一个错误信息
    if (!isValid) {
      const firstError = Object.values(errors.value)[0];
      if (firstError) {
        showToast(firstError, "warning");
      }
    }

    return isValid;
  };

  // 实时验证单个字段
  const validateFieldRealtime = (field, value) => {
    if (!form?.value) return;

    markTouched(field);
    return validateField(field, value, form.value);
  }; // 表单是否有效
  const isValidForm = computed(() => {
    if (!form?.value) return false;

    const formData = form.value;

    // 基本必填字段检查
    if (
      !formData.title?.trim() ||
      !formData.paper_type ||
      !formData.author_names?.trim()
    ) {
      return false;
    } // 发表论文的额外检查
    if (formData.paper_type === "published") {
      if (!formData.keyword_names?.trim() || !formData.journal_id) {
        return false;
      }
    }

    // 检查是否有验证错误
    return !hasErrors.value;
  });

  // 清除所有错误
  const clearErrors = () => {
    errors.value = {};
  };

  // 清除单个字段错误
  const clearFieldError = (field) => {
    delete errors.value[field];
  };

  // 清除所有touched状态
  const clearTouched = () => {
    touched.value = {};
  };

  // 重置验证状态
  const resetValidation = () => {
    clearErrors();
    clearTouched();
  };

  // 是否有错误
  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

  // 获取所有错误信息
  const getAllErrors = computed(() => Object.values(errors.value));

  // 获取错误字段数量
  const errorCount = computed(() => Object.keys(errors.value).length);

  // 设置表单字段监听器，用于实时验证
  if (form?.value) {
    // 监听表单变化进行实时验证
    watch(
      () => form.value,
      (newForm, oldForm) => {
        if (!newForm || !oldForm) return;

        // 只对已接触的字段进行实时验证
        Object.keys(touched.value).forEach((field) => {
          if (touched.value[field] && newForm[field] !== oldForm[field]) {
            validateField(field, newForm[field], newForm);
          }
        });
      },
      { deep: true }
    );
  }

  return {
    errors,
    touched,
    validateField,
    validateForm,
    validateFieldRealtime,
    markTouched,
    getFieldError,
    hasFieldError,
    clearErrors,
    clearFieldError,
    clearTouched,
    resetValidation,
    hasErrors,
    getAllErrors,
    errorCount,
    isValidForm,
  };
}
