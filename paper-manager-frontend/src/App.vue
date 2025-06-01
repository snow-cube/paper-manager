<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">📚</span>
            <span class="logo-text">科研论文管理系统</span>
          </div>          <nav class="nav">
            <RouterLink to="/" class="nav-link">
              <span class="nav-icon">🏠</span>
              首页
            </RouterLink>
            <template v-if="isAuthenticated">
              <RouterLink to="/literature" class="nav-link">
                <span class="nav-icon">📚</span>
                文献管理
              </RouterLink>
              <RouterLink to="/publications" class="nav-link">
                <span class="nav-icon">🎓</span>
                发表论文
              </RouterLink>
              <RouterLink to="/teams" class="nav-link">
                <span class="nav-icon">👥</span>
                团队管理
              </RouterLink>
              <RouterLink to="/categories" class="nav-link">
                <span class="nav-icon">🏷️</span>
                分类管理
              </RouterLink>
            </template>
          </nav>
          <div class="center-section">
            <template v-if="isAuthenticated && hasTeams">
              <TeamSelector />
            </template>
          </div>
          <div class="user-section">
            <template v-if="isAuthenticated">
              <div class="user-info">
                <span class="user-icon">👤</span>
                <span class="user-name">{{ user?.username || '用户' }}</span>
              </div>
              <button @click="handleLogout" class="logout-btn">
                <span class="logout-icon">🚪</span>
                退出
              </button>
            </template>
            <template v-else>
              <RouterLink to="/login" class="login-btn">
                <span class="login-icon">🔑</span>
                登录
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main class="main">
      <ErrorBoundary @retry="handleRetry">
        <RouterView />
      </ErrorBoundary>
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; {{ new Date().getFullYear() }} 科研论文管理系统. All rights reserved.</p>
      </div>
    </footer>

    <!-- Toast通知容器 -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
import { computed } from "vue";
import ToastContainer from "./components/ToastContainer.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import TeamSelector from "./components/TeamSelector.vue";
import { useAuth } from "./composables/useAuth";
import { useTeam } from "./composables/useTeam";

const { user, isAuthenticated, logout } = useAuth();
const { hasTeams } = useTeam();

const handleRetry = () => {
  // 这里可以添加重试逻辑，比如重新加载数据
  console.log('Application retry triggered');
};

const handleLogout = async () => {
  await logout();
};
</script>

<style scoped>
.header {
  background: var(--white);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.2));
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  text-decoration: none;
  color: var(--color-text);
}

.nav-icon {
  font-size: 1.125rem;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.nav-link:hover {
  background: var(--primary-50);
  color: var(--color-primary);
}

.nav-link:hover::before {
  width: 80%;
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.nav-link.router-link-active::before {
  display: none;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 1rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--primary-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
}

.user-icon {
  font-size: 1.125rem;
}

.user-name {
  font-weight: 500;
  color: var(--primary-700);
}

.logout-btn, .login-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.logout-btn {
  background: var(--color-danger-soft);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-light);
}

.logout-btn:hover {
  background: var(--color-danger);
  color: var(--white);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.login-btn {
  background: var(--primary-500);
  color: var(--white);
  border: 1px solid var(--primary-600);
}

.login-btn:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.3);
}

.main {
  flex: 1;
  width: 100%;
}

.footer {
  background: var(--color-background-mute);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 0;
  margin-top: 2rem;
}

.footer p {
  text-align: center;
  color: var(--color-text-light);
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem 0;
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .nav {
    gap: 0.25rem;
    flex-wrap: wrap;
    justify-content: center;
    order: 2;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .nav-icon {
    font-size: 1rem;
  }

  .center-section {
    order: 1;
    margin: 0.5rem 0;
    width: 100%;
  }

  .user-section {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    align-items: center;
    order: 3;
  }

  .user-info {
    justify-content: center;
  }
}
</style>
