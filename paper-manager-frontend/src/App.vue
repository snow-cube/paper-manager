<template>
  <div id="app">
    <template
      v-if="$route.name === 'Auth' || $route.name === 'FilePreviewPage'"
    >
      <!-- 认证页面和文件预览页面：全屏显示，不显示导航栏和页脚 -->
      <ErrorBoundary @retry="handleRetry">
        <RouterView />
      </ErrorBoundary>
    </template>
    <template v-else>
      <!-- 普通页面：显示完整布局 -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <!-- 左侧：Logo + 导航 -->
            <div class="left-section">
              <div class="logo">
                <span class="logo-icon">📚</span>
                <span class="logo-text">科研论文管理系统</span>
              </div>
              <nav class="nav">
                <RouterLink to="/" class="nav-link">
                  <span class="nav-icon">🏠</span>
                  <span class="nav-text">首页</span>
                </RouterLink>
                <template v-if="isAuthenticated">
                  <RouterLink to="/literature" class="nav-link">
                    <span class="nav-icon">📚</span>
                    <span class="nav-text">文献管理</span>
                  </RouterLink>
                  <RouterLink to="/publications" class="nav-link">
                    <span class="nav-icon">🎓</span>
                    <span class="nav-text">发表论文</span>
                  </RouterLink>
                  <RouterLink to="/teams" class="nav-link">
                    <span class="nav-icon">👥</span>
                    <span class="nav-text">团队管理</span>
                  </RouterLink>
                  <RouterLink to="/author-analysis" class="nav-link">
                    <span class="nav-icon">🔍</span>
                    <span class="nav-text">作者查询</span>
                  </RouterLink>
                  <!-- 管理功能下拉菜单 -->
                  <div
                    class="nav-dropdown"
                    :class="{ open: isManagementDropdownOpen }"
                    @mouseenter="showManagementDropdown"
                    @mouseleave="hideManagementDropdown"
                  >
                    <button
                      class="nav-link dropdown-trigger"
                      @click.stop="toggleManagementDropdown"
                    >
                      <span class="nav-icon">⚙️</span>
                      <span class="nav-text">管理</span>
                      <span
                        class="dropdown-arrow"
                        :class="{ rotated: isManagementDropdownOpen }"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                    </button>

                    <transition name="nav-dropdown">
                      <div
                        v-if="isManagementDropdownOpen"
                        class="nav-dropdown-menu"
                        @click.stop
                      >
                        <RouterLink
                          to="/categories"
                          class="nav-dropdown-item"
                          @click="closeManagementDropdown"
                        >
                          <span class="item-icon">🏷️</span>
                          <span class="item-text">分类管理</span>
                        </RouterLink>
                        <RouterLink
                          to="/journals"
                          class="nav-dropdown-item"
                          @click="closeManagementDropdown"
                        >
                          <span class="item-icon">📖</span>
                          <span class="item-text">期刊管理</span>
                        </RouterLink>
                      </div>
                    </transition>
                  </div>
                </template>
              </nav>
            </div>

            <!-- 右侧：团队选择器 + 用户信息 -->
            <div class="right-section">
              <template v-if="isAuthenticated && hasTeams">
                <div class="team-wrapper">
                  <TeamSelector />
                </div>
              </template>
              <div class="user-section">
                <template v-if="isAuthenticated">
                  <div v-if="isLoading" class="user-loading">
                    <div class="loading-avatar"></div>
                    <div class="loading-text">
                      <div class="loading-line"></div>
                      <div class="loading-line short"></div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="user-dropdown"
                    :class="{ open: isUserDropdownOpen }"
                  >
                    <button @click="toggleUserDropdown" class="user-btn">
                      <div class="user-avatar">
                        <img
                          v-if="currentUser?.avatar"
                          :src="currentUser.avatar"
                          :alt="currentUser.username"
                          class="avatar-img"
                        />
                        <span v-else class="user-initials">{{
                          getUserAvatar(currentUser)
                        }}</span>
                      </div>
                      <div class="user-info">
                        <span class="user-name">{{
                          currentUser?.full_name ||
                          currentUser?.username ||
                          "用户"
                        }}</span>
                        <span class="user-role">{{
                          getRoleDisplayName(currentUser?.role)
                        }}</span>
                      </div>
                      <span
                        class="dropdown-arrow"
                        :class="{ rotated: isUserDropdownOpen }"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                    </button>

                    <transition name="user-dropdown">
                      <div v-if="isUserDropdownOpen" class="user-dropdown-menu">
                        <div class="user-dropdown-header">
                          <div class="user-avatar-large">
                            <img
                              v-if="currentUser?.avatar"
                              :src="currentUser.avatar"
                              :alt="currentUser.username"
                              class="avatar-img-large"
                            />
                            <span v-else class="user-initials-large">{{
                              getUserAvatar(currentUser)
                            }}</span>
                            <div class="status-indicator"></div>
                          </div>
                          <div class="user-details">
                            <div class="user-display-name">
                              {{
                                currentUser?.full_name ||
                                currentUser?.username ||
                                "用户"
                              }}
                            </div>
                            <div v-if="currentUser?.email" class="user-email">
                              {{ currentUser.email }}
                            </div>
                            <div class="user-status">
                              <span class="status-dot"></span>
                              在线
                            </div>
                          </div>
                        </div>

                        <div class="user-dropdown-section">
                          <button
                            @click="handleUserProfile"
                            class="user-dropdown-item"
                          >
                            <span class="item-icon">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path
                                  d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z"
                                />
                              </svg>
                            </span>
                            <span>个人资料</span>
                          </button>
                          <button
                            @click="handleUserSettings"
                            class="user-dropdown-item"
                          >
                            <span class="item-icon">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path
                                  d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z"
                                />
                                <path
                                  d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319z"
                                />
                              </svg>
                            </span>
                            <span>账户设置</span>
                          </button>

                          <div class="dropdown-divider"></div>

                          <button
                            @click="handleLogout"
                            class="user-dropdown-item logout-item"
                          >
                            <span class="item-icon">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path
                                  d="M3 3a1 1 0 011-1h4a1 1 0 010 2H5v8h3a1 1 0 010 2H4a1 1 0 01-1-1V3zM10.293 5.293a1 1 0 011.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 011.414-1.414L8 7.586l2.293-2.293z"
                                />
                              </svg>
                            </span>
                            <span>退出登录</span>
                            <span class="logout-shortcut">Ctrl+Q</span>
                          </button>
                        </div>
                      </div>
                    </transition>
                  </div>
                </template>
                <template v-else>
                  <RouterLink to="/login" class="login-btn">
                    <span class="login-icon">🔑</span>
                    <span class="login-text">登录</span>
                  </RouterLink>
                </template>
              </div>
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
          <p>
            &copy; {{ new Date().getFullYear() }} 科研论文管理系统. All rights
            reserved.
          </p>
        </div>
      </footer>
      <!-- Toast通知容器 -->
      <ToastContainer />
    </template>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import { ToastContainer, ErrorBoundary, TeamSelector } from "@/components";
import { useAuth } from "./composables/useAuth";
import { useTeam } from "./composables/useTeam";

const router = useRouter();
const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
const { hasTeams } = useTeam();

// 用户下拉菜单状态
const isUserDropdownOpen = ref(false);

// 管理功能下拉菜单状态
const isManagementDropdownOpen = ref(false);
let managementDropdownTimer = null;

const handleRetry = () => {
  // 这里可以添加重试逻辑，比如重新加载数据
  console.log("Application retry triggered");
};

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const closeUserDropdown = () => {
  isUserDropdownOpen.value = false;
};

// 管理功能下拉菜单方法
const toggleManagementDropdown = () => {
  isManagementDropdownOpen.value = !isManagementDropdownOpen.value;
};

const showManagementDropdown = () => {
  clearTimeout(managementDropdownTimer);
  isManagementDropdownOpen.value = true;
};

const hideManagementDropdown = () => {
  clearTimeout(managementDropdownTimer);
  managementDropdownTimer = setTimeout(() => {
    isManagementDropdownOpen.value = false;
  }, 150);
};

const closeManagementDropdown = () => {
  isManagementDropdownOpen.value = false;
};

const handleLogout = async () => {
  closeUserDropdown();
  await logout();
  // 跳转到登录页面
  router.push("/login");
};

const handleUserProfile = () => {
  closeUserDropdown();
  // 跳转到个人资料页面
  router.push("/profile");
};

const handleUserSettings = () => {
  closeUserDropdown();
  // 跳转到账户设置页面
  router.push("/settings");
};

// 获取用户头像或首字母
const getUserAvatar = (user) => {
  if (user?.avatar) {
    return user.avatar;
  }
  // 如果没有头像，返回用户名或全名的首字母
  const name = user?.full_name || user?.username || "用户";
  return name.charAt(0).toUpperCase();
};

// 获取角色显示名称
const getRoleDisplayName = (role) => {
  const roleMap = {
    admin: "管理员",
    user: "普通用户",
    researcher: "研究员",
    student: "学生",
  };
  return roleMap[role] || "用户";
};

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest(".user-dropdown")) {
    closeUserDropdown();
  }
  if (!event.target.closest(".nav-dropdown")) {
    closeManagementDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
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
  overflow: visible;
}

.container {
  max-width: 100%;
  margin: 0;
  padding: 0 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  gap: 2rem;
  width: 100%;
  min-height: 60px;
  overflow: visible;
}

/* 左侧区域 */
.left-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 240px;
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
  flex: 1;
  justify-content: flex-start;
  overflow: visible;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
  text-decoration: none;
  color: var(--color-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-icon {
  font-size: 1.125rem;
  filter: grayscale(0.3);
  transition: filter 0.2s ease;
  flex-shrink: 0;
}

.nav-text {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-link:hover .nav-icon {
  filter: grayscale(0);
}

.nav-link::before {
  content: "";
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

/* 导航下拉菜单样式 */
.nav-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.dropdown-trigger {
  cursor: pointer;
  background: none !important;
  border: none !important;
  color: var(--color-text) !important;
  transition: var(--transition-normal);
  border-radius: var(--border-radius);
  padding: var(--space-sm) var(--space-md);
}

.dropdown-trigger:hover {
  background: var(--primary-50) !important;
  color: var(--color-primary) !important;
}

.dropdown-trigger:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: var(--transition-normal);
  margin-left: var(--space-xs);
  display: flex;
  align-items: center;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-sm));
  left: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  padding: var(--space-sm);
  z-index: 9999;
  min-width: 180px;
  /* 确保不被裁剪 */
  overflow: visible;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.875rem;
  transition: var(--transition-normal);
  white-space: nowrap;
}

.nav-dropdown-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-dropdown-item:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-dropdown-item.router-link-active {
  background: var(--color-primary);
  color: var(--white);
}

.nav-dropdown-item .item-icon {
  font-size: 1rem;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-dropdown-item .item-text {
  flex: 1;
  font-weight: 500;
}

/* 下拉菜单动画 */
.nav-dropdown-enter-active,
.nav-dropdown-leave-active {
  transition: var(--transition-normal);
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.nav-dropdown-enter-to,
.nav-dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 右侧区域 */
.right-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
}

.team-wrapper {
  min-width: 200px;
  max-width: 280px;
}

.user-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 用户加载状态 */
.user-loading {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
}

.loading-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.loading-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.loading-line {
  height: var(--space-md);
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
  width: 80px;
}

.loading-line.short {
  width: 60px;
  height: var(--space-sm);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 用户下拉菜单 */
.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, var(--white), #f8fafc);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  min-width: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-btn:hover {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.user-dropdown.open .user-btn {
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border-color: var(--primary-400);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.user-avatar .user-icon {
  font-size: 1rem;
  color: var(--white);
}

.user-avatar .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar .user-initials {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--white);
  text-transform: uppercase;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.user-info .user-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.user-info .user-role {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: var(--color-text-light);
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 260px;
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

.user-dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border-bottom: 1px solid var(--primary-200);
  position: relative;
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 12px rgba(59, 130, 246, 0.25);
  position: relative;
}

.user-avatar-large .user-icon {
  font-size: 1.5rem;
  color: var(--white);
}

.user-avatar-large .avatar-img-large {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-large .user-initials-large {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--white);
  text-transform: uppercase;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid var(--white);
  border-radius: 50%;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-display-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: var(--space-xs);
}

.user-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--primary-600);
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-dropdown-section {
  padding: var(--space-sm) 0;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md) var(--space-md);
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  position: relative;
}

.user-dropdown-item:hover {
  background: linear-gradient(
    135deg,
    var(--primary-50),
    rgba(59, 130, 246, 0.08)
  );
  color: var(--primary-700);
}

.user-dropdown-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.user-dropdown-item.logout-item {
  color: #dc2626;
  margin-top: var(--space-xs);
}

.user-dropdown-item.logout-item:hover {
  background: linear-gradient(135deg, #fef2f2, rgba(220, 38, 38, 0.08));
  color: #b91c1c;
}

.user-dropdown-item .item-icon {
  font-size: 1rem;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-dropdown-item .item-text {
  flex: 1;
  font-weight: 500;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-sm) 0;
}

.logout-shortcut {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-text-light);
  background: var(--color-background-mute);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
}

/* 用户下拉菜单动画 */
.user-dropdown-enter-active,
.user-dropdown-leave-active {
  transition: all 0.2s ease;
}

.user-dropdown-enter-from,
.user-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.user-dropdown-enter-to,
.user-dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.login-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  flex-shrink: 0;
  background: var(--primary-500);
  color: var(--white);
  border: 1px solid var(--primary-600);
}

.login-btn:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.3);
}

.login-icon {
  font-size: 1rem;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.login-text {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main {
  flex: 1;
  width: 100%;
}

.footer {
  background: var(--color-background-mute);
  border-top: 1px solid var(--color-border);
  padding: var(--space-lg) 0;
  margin-top: var(--space-2xl);
}

.footer p {
  text-align: center;
  color: var(--color-text-light);
  font-size: var(--text-sm);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1800px) {
  .container {
    padding: 0 1.25rem;
  }

  .header-content {
    gap: 1.5rem;
  }

  .left-section {
    gap: 1.5rem;
  }

  .logo {
    min-width: 200px;
  }

  .logo-text {
    font-size: 1.3rem;
  }
}

@media (max-width: 1600px) {
  .container {
    padding: 0 1rem;
  }

  .header-content {
    gap: 1rem;
  }

  .left-section {
    gap: 1rem;
  }

  .logo {
    min-width: 180px;
  }

  .nav {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.45rem 0.6rem;
    font-size: 0.8rem;
  }

  .team-wrapper {
    min-width: 160px;
    max-width: 200px;
  }
}

@media (max-width: 900px) {
  .nav-text {
    display: none;
  }

  .nav-link {
    padding: 0.5rem;
  }

  .team-wrapper {
    min-width: 140px;
  }

  .user-info .user-name {
    display: none;
  }

  .user-info .user-role {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
  }

  .left-section {
    width: 100%;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .logo {
    min-width: auto;
  }

  .logo-text {
    font-size: var(--text-xl);
  }

  .nav {
    gap: var(--space-sm);
    flex-wrap: wrap;
    justify-content: center;
    order: 2;
    width: 100%;
  }

  .nav-text {
    display: inline;
  }

  .nav-link {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
    gap: var(--space-sm);
  }

  .right-section {
    order: 1;
    width: 100%;
    justify-content: center;
    gap: var(--space-md);
  }
  .team-wrapper {
    min-width: auto;
    max-width: 200px;
    flex: 1;
  }

  .user-section {
    min-width: auto;
    justify-content: center;
  }

  .user-info .user-name,
  .user-info .user-role,
  .login-text {
    display: inline;
  }

  .login-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
    min-width: 120px;
    justify-content: center;
  }

  .user-dropdown-menu {
    right: auto;
    left: 0;
    min-width: 200px;
  }
}

@media (max-width: 480px) {
  .nav {
    gap: var(--space-xs);
  }

  .nav-link {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
  }

  .nav-icon {
    font-size: var(--text-sm);
  }

  .right-section {
    flex-direction: column;
    gap: var(--space-md);
  }

  .team-wrapper {
    width: 100%;
    max-width: none;
  }

  .user-section {
    width: 100%;
    justify-content: center;
  }

  .login-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.85rem;
    min-width: 100px;
  }

  .user-dropdown-menu {
    left: 50%;
    transform: translateX(-50%);
    min-width: 180px;
  }
}
</style>
