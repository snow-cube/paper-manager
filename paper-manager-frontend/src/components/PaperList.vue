<template>
  <ul>
    <li v-for="p in papers" :key="p.id">
      {{ p.title }} - {{ p.journal }} ({{ p.year }})
    </li>
  </ul>
</template>

<script setup>
defineProps({ papers: Array });
</script>
