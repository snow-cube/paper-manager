<template>
  <div class="categories-page">
    <div class="page-header">
      <h1 class="page-title">🏷️ 分类管理</h1>
      <p class="page-subtitle">管理论文和文献分类体系</p>
    </div>

    <!-- 分类类型切换 -->
    <div class="category-tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'papers' }]"
        @click="activeTab = 'papers'"
      >
        <span class="tab-icon">🎓</span>
        <span class="tab-text">论文分类</span>
        <span class="tab-badge">公共</span>
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'references' }]"
        @click="activeTab = 'references'"
      >
        <span class="tab-icon">📚</span>
        <span class="tab-text">文献分类</span>
        <span class="tab-badge">团队私有</span>
      </button>
    </div>

    <!-- 论文分类（公共） -->
    <div v-if="activeTab === 'papers'" class="card">
      <div class="card-header">
        <h2>
          <span class="header-icon">🎓</span>
          论文分类
          <span class="header-description">所有用户共享</span>
        </h2>
      </div>
      <div class="card-body">
        <CategoryTree
          categoryType="papers"
          :key="'papers-' + categoryTreeKey"
        />
      </div>
    </div>

    <!-- 文献分类（团队私有） -->
    <div v-if="activeTab === 'references'" class="card">
      <div class="card-header">
        <h2>
          <span class="header-icon">📚</span>
          文献分类
          <span class="header-description">
            {{ currentTeam ? `"${currentTeam.name}" 团队专用` : '请先选择团队' }}
          </span>
        </h2>
      </div>
      <div class="card-body">
        <div v-if="!currentTeam" class="no-team-warning">
          <div class="warning-icon">⚠️</div>
          <h3>请先选择团队</h3>
          <p>文献分类是团队私有的，您需要先选择一个团队才能管理文献分类。</p>
          <RouterLink to="/teams" class="btn btn-primary">
            转到团队管理
          </RouterLink>
        </div>
        <CategoryTree
          v-else
          categoryType="references"
          :teamId="currentTeam.id"
          :key="'references-' + categoryTreeKey + '-' + currentTeam.id"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { RouterLink } from "vue-router";
import CategoryTree from "../components/CategoryTree.vue";
import { useTeam } from "../composables/useTeam";

const { currentTeam } = useTeam();

// 当前激活的标签页
const activeTab = ref('papers');

// 用于强制重新渲染CategoryTree的key
const categoryTreeKey = ref(0);

// 监听团队变化，重新渲染组件
watch(currentTeam, () => {
  categoryTreeKey.value++;
}, { deep: true });

// 监听标签页切换，重新渲染组件
watch(activeTab, () => {
  categoryTreeKey.value++;
});
</script>

<style scoped>
.categories-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-md);
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
  padding: var(--space-2xl) 0;
  background: linear-gradient(135deg, var(--primary-50), var(--color-background-soft));
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
}

.page-title {
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  font-weight: 800;
  color: var(--color-heading);
  margin-bottom: var(--space-md);
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text);
  max-width: 500px;
  margin: 0 auto;
}

/* 分类标签页 */
.category-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-2xl);
  background: var(--white);
  padding: var(--space-sm);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:hover {
  background: var(--primary-50);
  color: var(--primary-700);
  transform: translateY(-1px);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  box-shadow: var(--shadow-md);
}

.tab-icon {
  font-size: var(--text-xl);
}

.tab-text {
  font-weight: 600;
}

.tab-badge {
  font-size: var(--text-xs);
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 600;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
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
  padding: var(--space-lg) var(--space-xl);
}

.card-header h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
  font-size: var(--text-lg);
}

.header-description {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-text-light);
  margin-left: auto;
}

.card-body {
  padding: 0;
}

/* 无团队警告 */
.no-team-warning {
  text-align: center;
  padding: var(--space-4xl) var(--space-xl);
  background: linear-gradient(135deg, var(--warning-50), var(--color-background-soft));
  border-radius: var(--border-radius);
  margin: var(--space-xl);
}

.warning-icon {
  font-size: var(--space-4xl);
  margin-bottom: var(--space-lg);
}

.no-team-warning h3 {
  color: var(--warning-700);
  margin-bottom: var(--space-md);
  font-size: var(--text-xl);
}

.no-team-warning p {
  color: var(--color-text);
  margin-bottom: var(--space-xl);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 768px) {
  .categories-page {
    padding: var(--space-md) var(--space-sm);
  }

  .page-header {
    margin-bottom: var(--space-xl);
    padding: var(--space-lg) var(--space-md);
  }

  .page-title {
    font-size: var(--text-xl);
  }

  .category-tabs {
    flex-direction: column;
  }

  .tab-btn {
    padding: var(--space-md) var(--space-lg);
  }

  .tab-text {
    font-size: var(--text-sm);
  }
}
</style>
