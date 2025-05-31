<template>
  <div class="login-form">
    <div class="form-header">
      <h2>用户登录</h2>
      <p>登录到科研论文管理系统</p>
    </div>

    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名</label>
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
        <label for="password">密码</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          placeholder="请输入密码"
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
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </form>

    <div class="form-footer">
      <p>
        还没有账号？
        <a href="#" @click.prevent="$emit('switch-to-register')">立即注册</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { login, setAuthToken } from '../services/api.js';
import { useToast } from '../composables/useToast.js';

const emit = defineEmits(['login-success', 'switch-to-register']);

const { showToast } = useToast();
const loading = ref(false);
const error = ref('');

const formData = reactive({
  username: '',
  password: ''
});

const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    error.value = '请填写用户名和密码';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await login(formData.username, formData.password);

    // 设置token
    setAuthToken(response.access_token);

    showToast('登录成功！', 'success');
    emit('login-success');

  } catch (err) {
    console.error('Login error:', err);

    if (err.response?.status === 401) {
      error.value = '用户名或密码错误';
    } else if (err.response?.status === 403) {
      error.value = '账号未激活，请联系管理员';
    } else {
      error.value = '登录失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-form {
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
