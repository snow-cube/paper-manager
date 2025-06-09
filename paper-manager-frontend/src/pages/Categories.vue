<template>
  <StandardPageLayout
    title="分类管理"
    icon="📂"
    description="管理论文和文献的分类体系"
  >
    <!-- 分类类型切换控制器 -->
    <template #controls>
      <div class="category-tabs">        <button
          v-for="tab in categoryTabs"
          :key="tab.value"
          @click="activeTab = tab.value; categoryTreeKey++"
          :class="['tab-btn', { active: activeTab === tab.value }]"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ tab.label }}</span>
          <span class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>
    </template>

    <!-- 论文分类（公共） -->
    <div v-if="activeTab === 'papers'" class="card">
      <div class="card-header">
        <h2>
          <span class="header-icon">📄</span>
          发表论文分类
          <span class="header-description">公共分类</span>
        </h2>
      </div>
      <div class="card-body">
        <CategoryTree
          :key="categoryTreeKey"
          paper-type="published"
          category-type="papers"
          :team-id="null"
        />
      </div>
    </div>

    <!-- 文献分类（团队私有） -->
    <div v-if="activeTab === 'references'" class="card">
      <div class="card-header">
        <h2>
          <span class="header-icon">📚</span>
          参考文献分类
          <span class="header-description" v-if="currentTeam">
            {{ currentTeam.name }} 团队
          </span>
        </h2>
      </div>
      <div class="card-body">
        <!-- 无团队警告 -->
        <StandardWarning
          v-if="!currentTeam"
          icon="⚠️"
          title="请先选择团队"
          message="参考文献分类是团队私有的，您需要先选择一个团队才能管理分类。"
        >
          <template #actions>
            <RouterLink to="/teams" class="btn btn-primary">
              转到团队管理
            </RouterLink>
          </template>
        </StandardWarning>

        <!-- 分类树 -->
        <CategoryTree
          v-else
          :key="categoryTreeKey"
          paper-type="literature"
          category-type="references"
          :team-id="currentTeam.id"
        />
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { RouterLink } from "vue-router";
import StandardPageLayout from "../components/StandardPageLayout.vue";
import StandardWarning from "../components/StandardWarning.vue";
import CategoryTree from "../components/CategoryTree.vue";
import { useTeam } from "../composables/useTeam";

const { currentTeam } = useTeam();

// 当前激活的标签页
const activeTab = ref('papers');

// 用于强制重新渲染CategoryTree的key
const categoryTreeKey = ref(0);

// 分类标签页配置
const categoryTabs = computed(() => [
  {
    value: 'papers',
    label: '论文分类',
    icon: '📄',
    badge: '公共'
  },
  {
    value: 'references',
    label: '文献分类',
    icon: '📚',
    badge: currentTeam.value ? '团队' : '需要团队'
  }
]);

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
/* 分类标签页 */
.category-tabs {
  display: flex;
  gap: var(--space-sm);
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
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-xl);
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
  background: var(--primary-100);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
}

.card-body {
  padding: 0;
}

.btn {
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
  .category-tabs {
    flex-direction: column;
    gap: var(--space-xs);
  }

  .tab-btn {
    padding: var(--space-md);
  }

  .tab-text {
    display: none;
  }

  .card-header {
    padding: var(--space-md);
  }

  .card-header h2 {
    font-size: var(--text-lg);
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .header-description {
    margin-left: 0;
  }
}
</style>
