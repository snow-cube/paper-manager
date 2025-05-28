<template>
  <div id="app">
    <header>
      <h1>科研论文管理系统</h1>
      <nav>
        <RouterLink to="/">首页</RouterLink> |
        <RouterLink to="/papers">论文管理</RouterLink> |
        <RouterLink to="/categories">分类管理</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <small>© {{ new Date().getFullYear() }} 论文管理系统</small>
    </footer>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<style scoped>
#app {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

header {
  background-color: #f0f0f0;
  padding: 1rem;
  margin-bottom: 1rem;
}

nav a {
  margin: 0 0.5rem;
  text-decoration: none;
  color: #0077cc;
}

nav a.router-link-exact-active {
  font-weight: bold;
}

footer {
  margin-top: 2rem;
  text-align: center;
  color: #666;
}
</style>
