<template>
  <ul>
    <li v-for="cat in categories" :key="cat.id">
      {{ cat.name }}
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getCategories } from "../services/api";
const categories = ref([]);

onMounted(async () => {
  categories.value = await getCategories();
});
</script>
