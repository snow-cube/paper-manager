import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.js";

// 设置 Service Worker
export const worker = setupWorker(...handlers);

// 启动 mock 服务
export const startMocking = async () => {
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 启动 MSW (Mock Service Worker)...");

    try {
      await worker.start({
        onUnhandledRequest: "bypass", // 对未处理的请求放行
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });

      console.log("✅ MSW 启动成功，API 请求将被拦截并模拟");
      console.log("📚 模拟数据包含：");
      console.log("  - 6 篇示例论文");
      console.log("  - 3 个主分类及其子分类");
      console.log("  - 3 个用户");
      console.log("  - 完整的 CRUD 操作支持");
    } catch (error) {
      console.error("❌ MSW 启动失败:", error);
    }
  }
};

// 停止 mock 服务
export const stopMocking = () => {
  worker.stop();
  console.log("🛑 MSW 已停止");
};

// 重置 handlers
export const resetHandlers = () => {
  worker.resetHandlers();
  console.log("🔄 MSW handlers 已重置");
};
