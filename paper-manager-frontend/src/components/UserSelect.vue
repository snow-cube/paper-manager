<template>
  <select v-model="modelValue" multiple>
    <option v-for="u in users" :key="u.id" :value="u.id">
      {{ u.name }}
    </option>
  </select>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getUsers } from "../services/api";
const users = ref([]);
const modelValue = defineModel();

onMounted(async () => {
  users.value = await getUsers();
});
</script>
