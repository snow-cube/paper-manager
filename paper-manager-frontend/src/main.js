import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { startMocking } from "./mocks/browser.js";

import "./assets/main.css";

// 启动 MSW 模拟服务
async function enableMocking() {
  if (process.env.NODE_ENV === 'development') {
    await startMocking();
  }
}

// 先启动 MSW，再创建 Vue 应用
enableMocking().then(() => {
  createApp(App).use(router).mount("#app");
});
