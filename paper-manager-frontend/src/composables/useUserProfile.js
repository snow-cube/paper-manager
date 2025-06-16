import { ref, computed } from "vue";
import { updateCurrentUserProfile } from "../services/api.js";
import { useAuth } from "./useAuth.js";
import { useToast } from "./useToast.js";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  calculatePasswordStrength,
} from "../config/userValidationConfig.js";

export function useUserProfile() {
  const { currentUser, setCurrentUser } = useAuth();
  const { showToast } = useToast();

  const isUpdating = ref(false);
  const validationErrors = ref({});

  // 表单数据
  const profileForm = ref({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });

  // 初始化表单数据
  const initializeForm = () => {
    if (currentUser.value) {
      profileForm.value = {
        email: currentUser.value.email || "",
        full_name: currentUser.value.full_name || "",
        password: "",
        confirmPassword: "",
      };
    }
  };
  // 验证表单
  const validateForm = () => {
    const errors = {};

    // 邮箱验证（如果有输入值）
    if (profileForm.value.email) {
      const emailResult = validateEmail(profileForm.value.email);
      if (emailResult !== true) {
        errors.email = emailResult;
      }
    }

    // 全名验证（如果有输入值）
    if (profileForm.value.full_name) {
      const fullNameResult = validateFullName(profileForm.value.full_name);
      if (fullNameResult !== true) {
        errors.full_name = fullNameResult;
      }
    }

    // 密码验证（如果有输入值）
    if (profileForm.value.password) {
      const passwordResult = validatePassword(profileForm.value.password);
      if (passwordResult !== true) {
        errors.password = passwordResult;
      }

      // 密码确认验证
      const confirmResult = validatePasswordConfirm(
        profileForm.value.password,
        profileForm.value.confirmPassword
      );
      if (confirmResult !== true) {
        errors.confirmPassword = confirmResult;
      }
    }

    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  // 更新用户资料
  const updateProfile = async () => {
    if (!validateForm()) {
      return false;
    }

    isUpdating.value = true;

    try {
      // 准备更新数据
      const updateData = {};

      // 只添加有值的字段
      if (profileForm.value.email !== currentUser.value?.email) {
        updateData.email = profileForm.value.email;
      }
      if (profileForm.value.full_name !== currentUser.value?.full_name) {
        updateData.full_name = profileForm.value.full_name;
      }
      if (profileForm.value.password) {
        updateData.password = profileForm.value.password;
      }

      // 如果没有要更新的内容
      if (Object.keys(updateData).length === 0) {
        showToast("没有检测到任何更改", "info");
        return true;
      }

      // 发送更新请求
      const updatedUser = await updateCurrentUserProfile(updateData);

      // 更新全局用户状态
      setCurrentUser(updatedUser);

      // 重新初始化表单（移除密码字段）
      profileForm.value.password = "";
      profileForm.value.confirmPassword = "";

      showToast("个人资料更新成功", "success");
      return true;
    } catch (error) {
      console.error("更新用户资料失败:", error);

      // 处理特定错误
      if (error.response?.status === 409) {
        validationErrors.value.email = "该邮箱已被其他用户使用";
      } else if (error.response?.status === 422) {
        showToast("请检查输入的数据格式", "error");
      } else {
        showToast("更新失败，请稍后重试", "error");
      }

      return false;
    } finally {
      isUpdating.value = false;
    }
  };

  // 重置表单
  const resetForm = () => {
    initializeForm();
    validationErrors.value = {};
  };
  // 计算属性
  const hasChanges = computed(() => {
    if (!currentUser.value) return false;

    return (
      profileForm.value.email !== (currentUser.value.email || "") ||
      profileForm.value.full_name !== (currentUser.value.full_name || "") ||
      profileForm.value.password !== ""
    );
  });

  const isFormValid = computed(() => {
    return Object.keys(validationErrors.value).length === 0;
  });

  // 密码强度计算
  const passwordStrength = computed(() => {
    return calculatePasswordStrength(profileForm.value.password);
  });
  return {
    // 状态
    isUpdating: computed(() => isUpdating.value),
    validationErrors: computed(() => validationErrors.value),

    // 表单数据
    profileForm,

    // 计算属性
    hasChanges,
    isFormValid,
    passwordStrength,

    // 方法
    initializeForm,
    validateForm,
    updateProfile,
    resetForm,
  };
}
