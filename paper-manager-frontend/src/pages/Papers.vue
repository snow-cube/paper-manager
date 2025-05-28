<template>
  <div>
    <h1>论文管理</h1>
    <PaperForm @submitted="refresh" />
    <PaperList :papers="papers" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import PaperList from "../components/PaperList.vue";
import PaperForm from "../components/PaperForm.vue";
import { getPapers } from "../services/api";

const papers = ref([]);
const refresh = async () => {
  papers.value = await getPapers();
};

onMounted(refresh);
</script>
