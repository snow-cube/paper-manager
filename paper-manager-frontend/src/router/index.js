import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import Home from "../pages/Home.vue";
import Literature from "../pages/Literature.vue";
import Publications from "../pages/Publications.vue";
import Categories from "../pages/Categories.vue";
import Teams from "../pages/Teams.vue";
import Auth from "../pages/Auth.vue";
import CollaborationSearch from "../pages/CollaborationSearch.vue";

const routes = [
  {
    path: "/login",
    name: "Auth",
    component: Auth,
    meta: { requiresGuest: true }
  },
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: "/literature",
    name: "Literature",
    component: Literature,
    meta: { requiresAuth: true }
  },
  {
    path: "/publications",
    name: "Publications",
    component: Publications,
    meta: { requiresAuth: true }
  },
  {
    path: "/categories",
    name: "Categories",
    component: Categories,
    meta: { requiresAuth: true }
  },  {
    path: "/teams",
    name: "Teams",
    component: Teams,
    meta: { requiresAuth: true }
  },
  {
    path: "/collaboration",
    name: "CollaborationSearch",
    component: CollaborationSearch,
    meta: { requiresAuth: true }
  },
  // 重定向旧的论文路由到文献管理
  { path: "/papers", redirect: "/literature" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, initializeAuth } = useAuth();

  // 尝试初始化认证状态
  if (!isAuthenticated.value) {
    await initializeAuth();
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login');
    return;
  }

  // 检查是否需要访客状态（如登录页面）
  if (to.meta.requiresGuest && isAuthenticated.value) {
    next('/');
    return;
  }

  next();
});

export default router;
