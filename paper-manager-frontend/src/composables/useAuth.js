import { ref, computed } from 'vue';
import { getCurrentUser, setAuthToken } from '../services/api.js';

// 全局用户状态
const currentUser = ref(null);
const isAuthenticated = computed(() => !!currentUser.value);
const isLoading = ref(false);

// 初始化用户状态
const initializeAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    isLoading.value = true;
    setAuthToken(token);
    const user = await getCurrentUser();
    currentUser.value = user;
    return true;
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    logout();
    return false;
  } finally {
    isLoading.value = false;
  }
};

// 登出
const logout = () => {
  currentUser.value = null;
  setAuthToken(null);
  localStorage.removeItem('token');
};

// 设置当前用户
const setCurrentUser = (user) => {
  currentUser.value = user;
};

export function useAuth() {
  return {
    currentUser: computed(() => currentUser.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    initializeAuth,
    logout,
    setCurrentUser
  };
}
