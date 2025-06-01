<template>
  <div class="register-form">
    <div class="form-header">
      <div class="welcome-icon">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="url(#registerGradient)" stroke-width="2" fill="none"/>
          <path d="M24 16v16M16 24h16" stroke="url(#registerGradient)" stroke-width="2" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="6" fill="url(#registerGradient)" opacity="0.2"/>
          <defs>
            <linearGradient id="registerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f093fb"/>
              <stop offset="100%" style="stop-color:#f5576c"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h2>创建账户</h2>
      <p>加入我们的科研论文管理平台</p>
    </div>

    <form @submit.prevent="handleRegister" class="register-form-content">
      <div class="form-row">
        <div class="form-group">
          <label for="username">
            <span class="label-icon">👤</span>
            用户名 <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="请输入用户名"
              class="form-control"
              :class="{ 'error': error && !formData.username }"
            />
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-group">
          <label for="email">
            <span class="label-icon">📧</span>
            邮箱 <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="请输入邮箱地址"
              class="form-control"
              :class="{ 'error': error && !formData.email }"
            />
            <div class="input-border"></div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="full_name">
          <span class="label-icon">✨</span>
          真实姓名 <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="full_name"
            v-model="formData.full_name"
            type="text"
            required
            placeholder="请输入您的真实姓名"
            class="form-control"
            :class="{ 'error': error && !formData.full_name }"
          />
          <div class="input-border"></div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="password">
            <span class="label-icon">🔒</span>
            密码 <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="请输入密码"
              class="form-control"
              :class="{ 'error': error && !formData.password }"
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
          <div class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.width }"></div>
            </div>
            <span class="strength-text" :class="passwordStrength.class">{{ passwordStrength.text }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">
            <span class="label-icon">🔐</span>
            确认密码 <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              placeholder="请再次输入密码"
              class="form-control"
              :class="{ 'error': error && !confirmPassword, 'success': confirmPassword && formData.password === confirmPassword }"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="password-toggle"
            >
              <span v-if="showConfirmPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
            <div class="input-border"></div>
          </div>
        </div>
      </div>

      <div class="terms-wrapper">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="agreeTerms" required />
          <span class="checkmark"></span>
          <span class="checkbox-label">
            我同意 <a href="#" class="terms-link">服务条款</a> 和 <a href="#" class="terms-link">隐私政策</a>
          </span>
        </label>
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
          :disabled="loading || !agreeTerms"
          class="btn btn-primary"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span class="btn-text">{{ loading ? '注册中...' : '创建账户' }}</span>
          <span v-if="!loading" class="btn-arrow">→</span>
        </button>
      </div>
    </form>

    <div class="form-footer">
      <div class="divider">
        <span>或</span>
      </div>
      <p class="switch-form">
        已有账号？
        <a href="#" @click.prevent="$emit('switch-to-login')" class="switch-link">立即登录</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { register } from '../services/api.js';
import { useToast } from '../composables/useToast.js';

const emit = defineEmits(['register-success', 'switch-to-login']);

const { showToast } = useToast();
const loading = ref(false);
const error = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreeTerms = ref(false);

const formData = reactive({
  username: '',
  email: '',
  full_name: '',
  password: ''
});

// 密码强度计算
const passwordStrength = computed(() => {
  const password = formData.password;
  if (!password) return { width: '0%', class: '', text: '' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { width: '33%', class: 'weak', text: '弱' };
  if (score <= 4) return { width: '66%', class: 'medium', text: '中' };
  return { width: '100%', class: 'strong', text: '强' };
});

const validateForm = () => {
  if (!formData.username || !formData.email || !formData.full_name || !formData.password) {
    error.value = '请填写所有必填字段';
    return false;
  }

  if (formData.password !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return false;
  }

  if (formData.password.length < 6) {
    error.value = '密码长度不能少于6位';
    return false;
  }

  return true;
};

const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await register(formData);

    showToast('注册成功！请登录', 'success');
    emit('register-success');

  } catch (err) {
    console.error('Register error:', err);

    if (err.response?.status === 409) {
      const message = err.response.data?.detail || '用户名或邮箱已存在';
      error.value = message;
    } else {
      error.value = '注册失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-form {
  width: 100%;
  max-width: 500px;
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
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.form-header h2 {
  color: #1a1a1a;
  margin-bottom: 0.25rem;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.form-header p {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 400;
}

.register-form-content {
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
  font-size: 0.8rem;
}

.label-icon {
  font-size: 1rem;
}

.required {
  color: #ef4444;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  position: relative;
  z-index: 1;
}

.form-control:focus {
  outline: none;
  border-color: #f093fb;
  box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
  transform: translateY(-2px);
}

.form-control.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-control.success {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  background: linear-gradient(90deg, #f093fb, #f5576c);
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

.password-strength {
  margin-top: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background: #ef4444;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.strong {
  background: #10b981;
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
}

.strength-text.weak {
  color: #ef4444;
}

.strength-text.medium {
  color: #f59e0b;
}

.strength-text.strong {
  color: #10b981;
}

.terms-wrapper {
  margin-bottom: 1rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.checkbox-wrapper input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 1px;
}

.checkbox-wrapper input:checked + .checkmark {
  background: #f093fb;
  border-color: #f093fb;
}

.checkbox-wrapper input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.terms-link {
  color: #f093fb;
  text-decoration: none;
  font-weight: 500;
}

.terms-link:hover {
  text-decoration: underline;
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.error-message {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.register-form .btn-primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
  color: white;
  box-shadow: 0 4px 14px rgba(240, 147, 251, 0.4);
}

.register-form .btn-primary:hover:not(:disabled) {
  /* 保持原色不变，只调整位移和阴影 */
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.5);
  filter: brightness(1.05);
}

.register-form .btn-primary:active:not(:disabled) {
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
  content: '';
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
  color: #f093fb;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
}

.switch-link:hover {
  color: #f5576c;
}

.switch-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #f093fb, #f5576c);
  transition: width 0.3s ease;
}

.switch-link:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-group {
    margin-bottom: 0.875rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }

  .form-header {
    margin-bottom: 1.25rem;
  }
}

@media (max-width: 480px) {
  .form-control {
    padding: 0.625rem 0.875rem;
    font-size: 0.8rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.75rem;
    margin-bottom: 0.375rem;
  }

  .checkbox-wrapper {
    font-size: 0.75rem;
  }

  .terms-wrapper {
    margin-bottom: 0.75rem;
  }

  .password-strength {
    margin-top: 0.25rem;
    gap: 0.375rem;
  }

  .strength-text {
    font-size: 0.7rem;
  }
}
</style>
