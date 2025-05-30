import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Literature from "../pages/Literature.vue";
import Publications from "../pages/Publications.vue";
import Categories from "../pages/Categories.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/literature", name: "Literature", component: Literature },
  { path: "/publications", name: "Publications", component: Publications },
  { path: "/categories", name: "Categories", component: Categories },
  // 重定向旧的论文路由到文献管理
  { path: "/papers", redirect: "/literature" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
