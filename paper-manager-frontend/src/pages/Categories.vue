<template>
  <div class="categories-page">
    <div class="page-header">
      <h1 class="page-title">🏷️ 分类管理</h1>
      <p class="page-subtitle">管理论文分类体系</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>分类列表</h2>
      </div>
      <div class="card-body">
        <CategoryTree />
      </div>
    </div>
  </div>
</template>

<script setup>
import CategoryTree from "../components/CategoryTree.vue";
</script>

<style scoped>
.categories-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  background: linear-gradient(135deg, var(--primary-50), var(--color-background-soft));
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
}

.page-title {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text);
  max-width: 500px;
  margin: 0 auto;
}

.card {
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  border: 1px solid var(--primary-100);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  background: linear-gradient(135deg, var(--white), var(--primary-50));
  border-bottom: 1px solid var(--primary-100);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header h2::before {
  content: "🗂️";
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .categories-page {
    padding: 1rem 0.5rem;
  }

  .page-header {
    margin-bottom: 2rem;
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }
}
</style>
