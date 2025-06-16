/**
 * 用户相关的验证配置文件
 *
 * 统一管理用户注册、登录、个人资料修改等场景的验证规则
 */

// 用户字段验证配置
export const USER_VALIDATION_CONFIG = {
  // 用户名验证
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    messages: {
      required: "请输入用户名",
      minLength: "用户名至少需要3个字符",
      maxLength: "用户名不能超过50个字符",
      pattern: "用户名只能包含字母、数字、下划线和连字符",
    },
  },

  // 邮箱验证
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      required: "请输入邮箱地址",
      pattern: "请输入有效的邮箱地址",
    },
  },

  // 真实姓名验证
  fullName: {
    minLength: 2,
    maxLength: 100,
    messages: {
      required: "请输入真实姓名",
      minLength: "姓名至少需要2个字符",
      maxLength: "姓名不能超过100个字符",
    },
  },
  // 密码验证
  password: {
    minLength: 6,
    maxLength: 128,
    // 密码强度规则：已移除字符类型要求
    strengthRules: {
      hasLowerCase: /[a-z]/,
      hasUpperCase: /[A-Z]/,
      hasNumber: /[0-9]/,
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      minRuleMatches: 0, // 不要求任何字符类型
    },
    messages: {
      required: "请输入密码",
      minLength: "密码至少需要6个字符",
      maxLength: "密码不能超过128个字符",
      strength: "", // 移除强度要求提示
    },
  },
};

/**
 * 验证用户名
 * @param {string} username 用户名
 * @returns {string|true} 验证错误信息或true表示通过
 */
export function validateUsername(username) {
  const config = USER_VALIDATION_CONFIG.username;

  if (!username || !username.trim()) {
    return config.messages.required;
  }

  if (username.length < config.minLength) {
    return config.messages.minLength;
  }

  if (username.length > config.maxLength) {
    return config.messages.maxLength;
  }

  if (!config.pattern.test(username)) {
    return config.messages.pattern;
  }

  return true;
}

/**
 * 验证邮箱
 * @param {string} email 邮箱地址
 * @returns {string|true} 验证错误信息或true表示通过
 */
export function validateEmail(email) {
  const config = USER_VALIDATION_CONFIG.email;

  if (!email || !email.trim()) {
    return config.messages.required;
  }

  if (!config.pattern.test(email.trim())) {
    return config.messages.pattern;
  }

  return true;
}

/**
 * 验证真实姓名
 * @param {string} fullName 真实姓名
 * @returns {string|true} 验证错误信息或true表示通过
 */
export function validateFullName(fullName) {
  const config = USER_VALIDATION_CONFIG.fullName;

  if (!fullName || !fullName.trim()) {
    return config.messages.required;
  }

  if (fullName.trim().length < config.minLength) {
    return config.messages.minLength;
  }

  if (fullName.trim().length > config.maxLength) {
    return config.messages.maxLength;
  }

  return true;
}

/**
 * 验证密码强度
 * @param {string} password 密码
 * @returns {string|true} 验证错误信息或true表示通过
 */
export function validatePassword(password) {
  const config = USER_VALIDATION_CONFIG.password;

  if (!password) {
    return config.messages.required;
  }

  if (password.length < config.minLength) {
    return config.messages.minLength;
  }

  if (password.length > config.maxLength) {
    return config.messages.maxLength;
  }

  // 已移除密码强度检查要求

  return true;
}

/**
 * 验证密码确认
 * @param {string} password 原密码
 * @param {string} confirmPassword 确认密码
 * @returns {string|true} 验证错误信息或true表示通过
 */
export function validatePasswordConfirm(password, confirmPassword) {
  if (!confirmPassword) {
    return "请确认密码";
  }

  if (password !== confirmPassword) {
    return "两次输入的密码不一致";
  }

  return true;
}

/**
 * 计算密码强度
 * @param {string} password 密码
 * @returns {object} 包含强度级别、百分比和文本描述的对象
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return { level: 0, percentage: 0, text: "", class: "" };
  }

  const config = USER_VALIDATION_CONFIG.password;
  const strengthRules = config.strengthRules;
  let score = 0;
  // 基础分数：长度
  if (password.length >= config.minLength) score += 2;
  if (password.length >= 8) score += 1; // 调整为8个字符以上有额外分数
  if (password.length >= 12) score += 1;

  // 字符类型分数
  if (strengthRules.hasLowerCase.test(password)) score += 1;
  if (strengthRules.hasUpperCase.test(password)) score += 1;
  if (strengthRules.hasNumber.test(password)) score += 1;
  if (strengthRules.hasSpecialChar.test(password)) score += 1;

  // 额外奖励
  if (password.length >= 16) score += 1;
  if (/(.)\1{2,}/.test(password)) score -= 1; // 连续重复字符扣分
  // 计算强度级别 (调整为更宽松的标准)
  if (score <= 2) {
    return { level: 1, percentage: 25, text: "弱", class: "weak" };
  } else if (score <= 3) {
    return { level: 2, percentage: 50, text: "中等", class: "medium" };
  } else if (score <= 5) {
    return { level: 3, percentage: 75, text: "强", class: "strong" };
  } else {
    return { level: 4, percentage: 100, text: "很强", class: "very-strong" };
  }
}

/**
 * 验证完整的用户表单
 * @param {object} formData 表单数据
 * @param {object} options 验证选项
 * @returns {object} 验证结果
 */
export function validateUserForm(formData, options = {}) {
  const {
    includeUsername = true,
    includeEmail = true,
    includeFullName = true,
    includePassword = true,
    includePasswordConfirm = true,
    isUpdate = false, // 是否为更新操作（更新时某些字段可以为空）
  } = options;

  const errors = {};

  // 验证用户名
  if (includeUsername) {
    const usernameResult = validateUsername(formData.username);
    if (usernameResult !== true) {
      errors.username = usernameResult;
    }
  }

  // 验证邮箱
  if (includeEmail) {
    // 更新操作时，如果邮箱没有变化则不验证
    if (!isUpdate || formData.email) {
      const emailResult = validateEmail(formData.email);
      if (emailResult !== true) {
        errors.email = emailResult;
      }
    }
  }

  // 验证真实姓名
  if (includeFullName) {
    // 更新操作时，如果姓名没有变化则不验证
    if (!isUpdate || formData.full_name) {
      const fullNameResult = validateFullName(formData.full_name);
      if (fullNameResult !== true) {
        errors.full_name = fullNameResult;
      }
    }
  }

  // 验证密码
  if (includePassword && formData.password) {
    const passwordResult = validatePassword(formData.password);
    if (passwordResult !== true) {
      errors.password = passwordResult;
    }

    // 验证密码确认
    if (includePasswordConfirm) {
      const confirmResult = validatePasswordConfirm(
        formData.password,
        formData.confirmPassword
      );
      if (confirmResult !== true) {
        errors.confirmPassword = confirmResult;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  USER_VALIDATION_CONFIG,
  validateUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  calculatePasswordStrength,
  validateUserForm,
};
