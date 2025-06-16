import { ref, reactive, computed, watch } from "vue";
import { register } from "../services/api.js";
import { useToast } from "./useToast.js";
import {
  validateUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  calculatePasswordStrength,
} from "../config/userValidationConfig.js";

export function useUserRegistration() {
  const { showToast } = useToast();

  const loading = ref(false);
  const error = ref("");
  const validationErrors = ref({});
  const confirmPassword = ref("");
  const agreeTerms = ref(false);

  const formData = reactive({
    username: "",
    email: "",
    full_name: "",
    password: "",
  });

  // 监听表单数据变化，自动清除错误信息
  watch(
    [
      () => formData.username,
      () => formData.email,
      () => formData.full_name,
      () => formData.password,
      confirmPassword,
    ],
    () => {
      if (error.value) {
        error.value = "";
      }
      // 清除对应字段的验证错误
      validationErrors.value = {};
    }
  );

  // 密码强度计算
  const passwordStrength = computed(() => {
    return calculatePasswordStrength(formData.password);
  });

  // 实时验证单个字段
  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors.value };

    switch (fieldName) {
      case "username":
        const usernameResult = validateUsername(value);
        if (usernameResult !== true) {
          errors.username = usernameResult;
        } else {
          delete errors.username;
        }
        break;

      case "email":
        const emailResult = validateEmail(value);
        if (emailResult !== true) {
          errors.email = emailResult;
        } else {
          delete errors.email;
        }
        break;

      case "full_name":
        const fullNameResult = validateFullName(value);
        if (fullNameResult !== true) {
          errors.full_name = fullNameResult;
        } else {
          delete errors.full_name;
        }
        break;

      case "password":
        const passwordResult = validatePassword(value);
        if (passwordResult !== true) {
          errors.password = passwordResult;
        } else {
          delete errors.password;
        }

        // 同时验证密码确认
        if (confirmPassword.value) {
          const confirmResult = validatePasswordConfirm(
            value,
            confirmPassword.value
          );
          if (confirmResult !== true) {
            errors.confirmPassword = confirmResult;
          } else {
            delete errors.confirmPassword;
          }
        }
        break;

      case "confirmPassword":
        const confirmResult = validatePasswordConfirm(formData.password, value);
        if (confirmResult !== true) {
          errors.confirmPassword = confirmResult;
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    validationErrors.value = errors;
  };

  // 完整表单验证
  const validateForm = () => {
    const errors = {};

    // 验证用户名
    const usernameResult = validateUsername(formData.username);
    if (usernameResult !== true) {
      errors.username = usernameResult;
    }

    // 验证邮箱
    const emailResult = validateEmail(formData.email);
    if (emailResult !== true) {
      errors.email = emailResult;
    }

    // 验证真实姓名
    const fullNameResult = validateFullName(formData.full_name);
    if (fullNameResult !== true) {
      errors.full_name = fullNameResult;
    }

    // 验证密码
    const passwordResult = validatePassword(formData.password);
    if (passwordResult !== true) {
      errors.password = passwordResult;
    }

    // 验证密码确认
    const confirmResult = validatePasswordConfirm(
      formData.password,
      confirmPassword.value
    );
    if (confirmResult !== true) {
      errors.confirmPassword = confirmResult;
    }

    // 验证服务条款
    if (!agreeTerms.value) {
      errors.terms = "请同意服务条款和隐私政策";
    }

    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  // 注册处理
  const handleRegister = async () => {
    if (!validateForm()) {
      error.value = "请检查表单中的错误信息";
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      await register(formData);
      showToast("注册成功！请登录", "success");
      return true;
    } catch (err) {
      console.error("Register error:", err);

      if (err.response?.status === 409) {
        const message =
          err.response.data?.detail || "用户名或邮箱已存在，请尝试其他信息";
        error.value = message;
      } else if (err.response?.status === 422) {
        error.value = "提交的信息格式不正确，请检查后重试";
      } else if (err.response?.status === 429) {
        error.value = "注册请求过于频繁，请稍后再试";
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        error.value = "网络连接失败，请检查网络后重试";
      } else {
        error.value = "注册失败，请稍后重试";
      }

      return false;
    } finally {
      loading.value = false;
    }
  };

  // 重置表单
  const resetForm = () => {
    Object.keys(formData).forEach((key) => {
      formData[key] = "";
    });
    confirmPassword.value = "";
    agreeTerms.value = false;
    error.value = "";
    validationErrors.value = {};
  };

  // 计算属性
  const isFormValid = computed(() => {
    return (
      Object.keys(validationErrors.value).length === 0 &&
      formData.username &&
      formData.email &&
      formData.full_name &&
      formData.password &&
      confirmPassword.value &&
      agreeTerms.value
    );
  });

  return {
    // 状态
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    validationErrors: computed(() => validationErrors.value),

    // 表单数据
    formData,
    confirmPassword,
    agreeTerms,

    // 计算属性
    passwordStrength,
    isFormValid,

    // 方法
    validateField,
    validateForm,
    handleRegister,
    resetForm,
  };
}
