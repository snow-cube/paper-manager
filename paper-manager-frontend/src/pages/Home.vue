<template>
  <div>
    <h1>论文管理系统首页</h1>
    <RouterLink to="/papers">查看论文</RouterLink>
    <RouterLink to="/categories">分类管理</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>
