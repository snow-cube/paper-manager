import { ref, computed } from "vue";
import {
  validateUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  calculatePasswordStrength,
} from "../config/userValidationConfig.js";

/**
 * 单个字段验证组合式函数
 * @param {Object} options 验证选项
 * @param {Function} options.validator 验证函数
 * @param {string} options.errorMessage 错误消息
 * @param {boolean} options.required 是否必填
 * @param {boolean} options.validateOnBlur 是否在失焦时验证
 * @param {boolean} options.validateOnInput 是否在输入时验证
 * @returns {Object} 验证相关的响应式数据和方法
 */
export function useFieldValidation(options = {}) {
  const {
    validator = () => true,
    errorMessage = "输入无效",
    required = false,
    validateOnBlur = true,
    validateOnInput = false,
  } = options;

  const value = ref("");
  const error = ref("");
  const touched = ref(false);
  const focused = ref(false);

  // 验证函数
  const validate = () => {
    error.value = "";

    // 必填验证
    if (
      required &&
      (!value.value || (typeof value.value === "string" && !value.value.trim()))
    ) {
      error.value = "此字段为必填项";
      return false;
    }

    // 如果为空且非必填，跳过验证
    if (
      !value.value ||
      (typeof value.value === "string" && !value.value.trim())
    ) {
      return true;
    }

    // 自定义验证
    const result = validator(value.value);
    if (result !== true) {
      error.value = typeof result === "string" ? result : errorMessage;
      return false;
    }

    return true;
  };

  // 处理输入
  const handleInput = (newValue) => {
    value.value = newValue;
    if (validateOnInput && touched.value) {
      validate();
    }
  };

  // 处理失焦
  const handleBlur = () => {
    touched.value = true;
    focused.value = false;
    if (validateOnBlur) {
      validate();
    }
  };

  // 处理聚焦
  const handleFocus = () => {
    focused.value = true;
  };

  // 重置字段
  const reset = () => {
    value.value = "";
    error.value = "";
    touched.value = false;
    focused.value = false;
  };

  // 设置值
  const setValue = (newValue) => {
    value.value = newValue;
  };

  // 设置错误
  const setError = (errorMsg) => {
    error.value = errorMsg;
    touched.value = true;
  };

  // 清除错误
  const clearError = () => {
    error.value = "";
  };

  // 计算属性
  const isValid = computed(() => !error.value);
  const hasError = computed(() => Boolean(touched.value && error.value));
  const showError = computed(() => touched.value && error.value);

  return {
    // 响应式数据
    value,
    error,
    touched,
    focused,

    // 计算属性
    isValid,
    hasError,
    showError,

    // 方法
    validate,
    handleInput,
    handleBlur,
    handleFocus,
    reset,
    setValue,
    setError,
    clearError,
  };
}

/**
 * 多字段验证组合式函数
 * @param {Object} fieldConfigs 字段配置对象
 * @returns {Object} 所有字段的验证实例和全局验证方法
 */
export function useFormValidation(fieldConfigs = {}) {
  const fields = ref({});

  // 初始化字段
  Object.keys(fieldConfigs).forEach((fieldName) => {
    fields.value[fieldName] = useFieldValidation(fieldConfigs[fieldName]);
  });

  // 验证所有字段
  const validateAll = () => {
    let isValid = true;
    Object.values(fields.value).forEach((field) => {
      field.touched.value = true;
      if (!field.validate()) {
        isValid = false;
      }
    });
    return isValid;
  };

  // 重置所有字段
  const resetAll = () => {
    Object.values(fields.value).forEach((field) => {
      field.reset();
    });
  };

  // 获取所有错误
  const getAllErrors = computed(() => {
    return Object.values(fields.value)
      .filter((field) => field.hasError.value)
      .map((field) => field.error.value);
  });

  // 检查是否有错误
  const hasErrors = computed(() => {
    return Object.values(fields.value).some((field) => field.hasError.value);
  });

  // 检查是否所有字段都有效
  const isFormValid = computed(() => {
    return Object.values(fields.value).every((field) => field.isValid.value);
  });

  // 获取字段值
  const getValues = () => {
    const values = {};
    Object.keys(fields.value).forEach((fieldName) => {
      values[fieldName] = fields.value[fieldName].value.value;
    });
    return values;
  };

  // 设置字段值
  const setValues = (values) => {
    Object.keys(values).forEach((fieldName) => {
      if (fields.value[fieldName]) {
        fields.value[fieldName].setValue(values[fieldName]);
      }
    });
  };

  return {
    fields,
    validateAll,
    resetAll,
    getAllErrors,
    hasErrors,
    isFormValid,
    getValues,
    setValues,
  };
}
