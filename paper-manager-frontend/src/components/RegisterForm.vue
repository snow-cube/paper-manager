<template>
  <div class="register-form">
    <div class="form-header">
      <h2>用户注册</h2>
      <p>创建您的科研论文管理账号</p>
    </div>

    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="username">用户名 *</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          placeholder="请输入用户名"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="email">邮箱 *</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          placeholder="请输入邮箱地址"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="full_name">真实姓名 *</label>
        <input
          id="full_name"
          v-model="formData.full_name"
          type="text"
          required
          placeholder="请输入真实姓名"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="password">密码 *</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          placeholder="请输入密码"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">确认密码 *</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          placeholder="请再次输入密码"
          class="form-control"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </div>
    </form>

    <div class="form-footer">
      <p>
        已有账号？
        <a href="#" @click.prevent="$emit('switch-to-login')">立即登录</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { register } from '../services/api.js';
import { useToast } from '../composables/useToast.js';

const emit = defineEmits(['register-success', 'switch-to-login']);

const { showToast } = useToast();
const loading = ref(false);
const error = ref('');
const confirmPassword = ref('');

const formData = reactive({
  username: '',
  email: '',
  full_name: '',
  password: ''
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
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #666;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-actions {
  margin-bottom: 1.5rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5855eb;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
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
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}

.form-footer a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
