<template>
  <div class="auth-page">
    <!-- 背景装饰元素 -->
    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <div class="logo-icon-wrapper">
            <span class="logo-icon">📚</span>
            <div class="logo-glow"></div>
          </div>
          <div class="logo-content">
            <span class="logo-text">科研论文管理系统</span>
            <span class="logo-subtitle">Research Paper Management System</span>
          </div>
        </div>
      </div>      <div class="auth-content">
        <div class="form-container">
          <transition name="slide-fade" mode="out-in">
            <LoginForm
              v-if="!showRegister"
              key="login"
              @login-success="handleLoginSuccess"
              @switch-to-register="showRegister = true"
            />
            <RegisterForm
              v-else
              key="register"
              @register-success="handleRegisterSuccess"
              @switch-to-login="showRegister = false"
            />
          </transition>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="auth-footer">
        <p>&copy; {{ new Date().getFullYear() }} 科研论文管理系统. All rights reserved.</p>
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
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 20%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  bottom: 10%;
  right: 10%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

.auth-container {
  width: 100%;
  height: 100%;
  max-width: 1000px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  color: white;
  text-decoration: none;
}

.logo-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.logo-icon {
  font-size: 2.5rem;
  z-index: 2;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255,255,255,0.3), transparent);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
}

.logo-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-text {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.logo-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 400;
  letter-spacing: 0.05em;
}

.auth-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 800px;
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-container {
  width: 100%;
  padding: 2rem;
  max-height: 80vh;
  overflow-y: auto;
}

/* 表单切换动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.auth-footer {
  text-align: center;
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .auth-content {
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .auth-page {
    padding: 0;
  }

  .auth-container {
    padding: 1rem;
  }

  .logo {
    flex-direction: column;
    gap: 1rem;
  }

  .logo-content {
    align-items: center;
    text-align: center;
  }
  .logo-text {
    font-size: 1.5rem;
  }

  .form-container {
    padding: 1.25rem;
    max-height: 85vh;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
  }

  .form-container {
    padding: 1rem;
    max-height: 90vh;
  }

  .logo-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .logo-icon {
    font-size: 2rem;
  }

  .auth-content {
    border-radius: 16px;
  }
}
</style>
