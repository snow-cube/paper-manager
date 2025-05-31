import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
// import { startMocking } from "./mocks/browser.js";

import "./assets/main.css";

// MSW mocking is disabled - using real backend API
// Uncomment below lines if you need to use mock data for testing
/*
async function enableMocking() {
  if (process.env.NODE_ENV === 'development') {
    await startMocking();
  }
}
*/

// Create Vue application directly without MSW
createApp(App).use(router).mount("#app");

// Use this version instead if you want to enable mocking:
/*
enableMocking().then(() => {
  createApp(App).use(router).mount("#app");
});
*/
