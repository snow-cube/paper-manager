<template>
  <div class="login-form">
    <div class="form-header">
      <div class="welcome-icon">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#loginGradient)"
            stroke-width="2"
            fill="none"
          />
          <path
            d="M24 8v32M8 24h32"
            stroke="url(#loginGradient)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <defs>
            <linearGradient
              id="loginGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" style="stop-color: #667eea" />
              <stop offset="100%" style="stop-color: #764ba2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h2>欢迎回来</h2>
      <p>登录到您的科研论文管理账户</p>
    </div>

    <form @submit.prevent="handleLogin" class="login-form-content">
      <div class="form-group">
        <label for="username">
          <span class="label-icon">👤</span>
          用户名
        </label>
        <div class="input-wrapper">
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            placeholder="请输入您的用户名"
            class="form-control"
            :class="{ error: error && !formData.username }"
          />
          <div class="input-border"></div>
        </div>
      </div>

      <div class="form-group">
        <label for="password">
          <span class="label-icon">🔒</span>
          密码
        </label>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="请输入您的密码"
            class="form-control"
            :class="{ error: error && !formData.password }"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="password-toggle"
          >
            <span v-if="showPassword">🙈</span>
            <span v-else>👁️</span>
          </button>
          <div class="input-border"></div>
        </div>
      </div>

      <div class="form-options">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="rememberMe" />
          <span class="checkmark"></span>
          <span class="checkbox-label">记住我</span>
        </label>
        <a href="#" class="forgot-link">忘记密码？</a>
      </div>

      <transition name="error-slide">
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </transition>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary"
          :class="{ loading: loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span class="btn-text">{{ loading ? "登录中..." : "登录" }}</span>
          <span v-if="!loading" class="btn-arrow">→</span>
        </button>
      </div>
    </form>

    <div class="form-footer">
      <div class="divider">
        <span>或</span>
      </div>
      <p class="switch-form">
        还没有账号？
        <a
          href="#"
          @click.prevent="$emit('switch-to-register')"
          class="switch-link"
          >立即注册</a
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { login, setAuthToken } from "../../services/api.js";
import { useToast } from "../../composables/useToast.js";

const emit = defineEmits(["login-success", "switch-to-register"]);

const { showToast } = useToast();
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);

const formData = reactive({
  username: "",
  password: "",
});

// 监听表单数据变化，自动清除错误信息
watch([() => formData.username, () => formData.password], () => {
  if (error.value) {
    error.value = "";
  }
});

const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    error.value = "请填写用户名和密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await login(formData.username, formData.password);

    // 设置token
    setAuthToken(response.access_token);

    showToast("登录成功！", "success");
    emit("login-success");
  } catch (err) {
    console.error("Login error:", err);

    // 确保loading状态先设置为false，避免界面状态混乱
    loading.value = false;

    if (err.response?.status === 401) {
      error.value = "用户名或密码错误，请检查后重试";
    } else if (err.response?.status === 403) {
      error.value = "账号未激活，请联系管理员";
    } else if (err.response?.status === 429) {
      error.value = "登录尝试过于频繁，请稍后再试";
    } else if (err.code === 'NETWORK_ERROR' || !err.response) {
      error.value = "网络连接失败，请检查网络后重试";    } else {
      error.value = "登录失败，请稍后重试";
    }

    // 确保loading在catch块中也被重置
    return;
  } finally {
    // 只有在登录成功时才设置loading为false
    // 登录失败时已经在catch块中设置了
    if (!error.value) {
      loading.value = false;
    }
  }
};
</script>

<style scoped>
.login-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.welcome-icon {
  margin-bottom: 0.75rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.form-header h2 {
  color: var(--color-heading);
  margin-bottom: var(--space-xs);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.form-header p {
  color: var(--color-text-light);
  font-size: var(--text-sm);
  font-weight: 400;
}

.login-form-content {
  margin-bottom: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  color: var(--color-heading);
  font-weight: 600;
  font-size: var(--text-xs);
}

.label-icon {
  font-size: 1rem;
}

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  transition: all var(--transition-bounce);
  background: var(--white);
  position: relative;
  z-index: 1;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
  transform: translateY(-2px);
}

.form-control.error {
  border-color: var(--error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-control::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  border-radius: 0 0 12px 12px;
}

.form-control:focus + .password-toggle + .input-border,
.form-control:focus + .input-border {
  transform: scaleX(1);
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  z-index: 2;
}

.password-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6b7280;
}

.checkbox-wrapper input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-wrapper input:checked + .checkmark {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-wrapper input:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #5855eb;
  text-decoration: underline;
}

.error-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.error-message {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  position: relative;
  overflow: hidden;
  animation: pulse-error 0.6s ease-out;
}

.error-icon {
  font-size: 1.25rem;
}

.form-actions {
  margin-bottom: 2rem;
}

.btn {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.btn.loading .btn-text {
  opacity: 0.8;
}

.btn-arrow {
  transition: transform 0.3s ease;
  font-weight: bold;
  font-size: 1.25rem;
}

.btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(4px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
}

.divider {
  position: relative;
  margin-bottom: 1rem;
  color: #9ca3af;
  font-size: 0.8rem;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
  z-index: 1;
}

.divider span {
  background: white;
  padding: 0 1rem;
  position: relative;
  z-index: 2;
}

.switch-form {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.switch-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
}

.switch-link:hover {
  color: #5855eb;
}

.switch-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.switch-link:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-header h2 {
    font-size: 1.5rem;
  }

  .form-header {
    margin-bottom: 1.25rem;
  }

  .form-group {
    margin-bottom: 0.875rem;
  }
}

@media (max-width: 480px) {
  .form-header h2 {
    font-size: 1.375rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.75rem;
    margin-bottom: 0.375rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-control {
    padding: 0.625rem 0.875rem;
    font-size: 0.8rem;
  }

  .checkbox-wrapper {
    font-size: 0.75rem;
  }
  .forgot-link {
    font-size: 0.75rem;
  }
}

/* 错误消息脉冲动画 */
@keyframes pulse-error {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }
}
</style>
