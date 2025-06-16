import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import Home from "../pages/Home.vue";
import Literature from "../pages/Literature.vue";
import Publications from "../pages/Publications.vue";
import Categories from "../pages/Categories.vue";
import Teams from "../pages/Teams.vue";
import Auth from "../pages/Auth.vue";
import AuthorAnalysis from "../pages/AuthorAnalysis.vue";
import Journals from "../pages/Journals.vue";
import FilePreviewPage from "../pages/FilePreviewPage.vue";
import Profile from "../pages/Profile.vue";
import Settings from "../pages/Settings.vue";

const routes = [
  {
    path: "/login",
    name: "Auth",
    component: Auth,
    meta: { requiresGuest: true },
  },
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: "/literature",
    name: "Literature",
    component: Literature,
    meta: { requiresAuth: true },
  },
  {
    path: "/publications",
    name: "Publications",
    component: Publications,
    meta: { requiresAuth: true },
  },
  {
    path: "/categories",
    name: "Categories",
    component: Categories,
    meta: { requiresAuth: true },
  },
  {
    path: "/teams",
    name: "Teams",
    component: Teams,
    meta: { requiresAuth: true },
  },
  {
    path: "/author-analysis",
    name: "AuthorAnalysis",
    component: AuthorAnalysis,
    meta: { requiresAuth: true },
    props: (route) => ({ searchAuthor: route.query.author }),
  },
  {
    path: "/journals",
    name: "Journals",
    component: Journals,
    meta: { requiresAuth: true },
  },
  {
    path: "/file-preview",
    name: "FilePreviewPage",
    component: FilePreviewPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    meta: { requiresAuth: true },
  }, // 重定向旧的论文路由到文献管理
  { path: "/papers", redirect: "/literature" }, // 重定向旧的合作网络路由到作者信息查询
  { path: "/collaboration", redirect: "/author-analysis" },
  { path: "/collaboration-search", redirect: "/author-analysis" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log("路由守卫 - 导航到:", to.path, to.query);

  const { isAuthenticated, initializeAuth } = useAuth();

  console.log("路由守卫 - 当前认证状态:", isAuthenticated.value);

  // 尝试初始化认证状态
  if (!isAuthenticated.value) {
    console.log("路由守卫 - 尝试初始化认证...");
    const authResult = await initializeAuth();
    console.log("路由守卫 - 认证初始化结果:", authResult);
  }
  // 检查是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    console.log("路由守卫 - 需要认证但未登录，重定向到登录页");
    // 特殊处理：如果是文件预览页面，保存完整URL用于登录后重定向
    if (to.path === "/file-preview") {
      const redirectUrl = encodeURIComponent(
        `${window.location.origin}${to.fullPath}`
      );
      next(`/login?redirect=${redirectUrl}`);
    } else {
      next("/login");
    }
    return;
  }

  // 检查是否需要访客状态（如登录页面）
  if (to.meta.requiresGuest && isAuthenticated.value) {
    console.log("路由守卫 - 已登录用户访问访客页面，重定向到首页");
    next("/");
    return;
  }

  console.log("路由守卫 - 允许导航");
  next();
});

export default router;
