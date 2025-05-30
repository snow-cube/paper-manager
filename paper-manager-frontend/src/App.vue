<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">📚</span>
            <span class="logo-text">科研论文管理系统</span>
          </div>
          <nav class="nav">
            <RouterLink to="/" class="nav-link">
              <span class="nav-icon">🏠</span>
              首页
            </RouterLink>
            <RouterLink to="/literature" class="nav-link">
              <span class="nav-icon">📚</span>
              文献管理
            </RouterLink>
            <RouterLink to="/publications" class="nav-link">
              <span class="nav-icon">🎓</span>
              发表论文
            </RouterLink>
            <RouterLink to="/categories" class="nav-link">
              <span class="nav-icon">🏷️</span>
              分类管理
            </RouterLink>
          </nav>
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
import ToastContainer from "./components/ToastContainer.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";

const handleRetry = () => {
  // 这里可以添加重试逻辑，比如重新加载数据
  console.log('Application retry triggered');
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
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .nav-icon {
    font-size: 1rem;
  }
}
</style>
