<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.title" placeholder="标题" />
    <input v-model="form.journal" placeholder="期刊" />
    <input v-model.number="form.year" placeholder="年份" />
    <UserSelect v-model="form.author_ids" />
    <select v-model="form.category_id">
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>
    <button type="submit">添加论文</button>
  </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getCategories, createPaper } from "../services/api";
import UserSelect from "./UserSelect.vue";

const emit = defineEmits(["submitted"]);
const form = ref({
  title: "",
  journal: "",
  year: 2023,
  author_ids: [],
  category_id: null,
});
const categories = ref([]);

onMounted(async () => {
  categories.value = await getCategories();
});

const handleSubmit = async () => {
  await createPaper(form.value);
  emit("submitted");
  form.value = {
    title: "",
    journal: "",
    year: 2023,
    author_ids: [],
    category_id: null,
  };
};
</script>
