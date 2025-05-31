<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">科研论文管理系统</span>
        </div>
      </div>

      <div class="auth-content">
        <LoginForm
          v-if="!showRegister"
          @login-success="handleLoginSuccess"
          @switch-to-register="showRegister = true"
        />
        <RegisterForm
          v-else
          @register-success="handleRegisterSuccess"
          @switch-to-login="showRegister = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import LoginForm from '../components/LoginForm.vue';
import RegisterForm from '../components/RegisterForm.vue';

const router = useRouter();
const showRegister = ref(false);

const handleLoginSuccess = () => {
  router.push('/');
};

const handleRegisterSuccess = () => {
  showRegister.value = false;
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 600;
}

.logo-icon {
  font-size: 2rem;
}

.auth-content {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
</style>
