<template>
  <div class="paper-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="page-icon">{{ config.icon }}</span>
        {{ config.title }}
      </h1>
      <p class="page-description">
        {{ config.description }}
      </p>
    </div>

    <!-- 无团队警告（仅对需要团队的页面显示） -->
    <div v-if="config.requireTeam && !currentTeam" class="no-team-warning">
      <div class="warning-icon">⚠️</div>
      <h3>请先选择团队</h3>
      <p>您需要先选择一个团队才能管理{{ config.teamRequiredText }}。团队中的所有{{ config.teamRequiredText }}将对团队成员共享。</p>
      <RouterLink to="/teams" class="btn btn-primary">
        转到团队管理
      </RouterLink>
    </div>

    <!-- 主内容区域 -->
    <div v-else class="content-layout">
      <!-- 左侧分类树 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>分类</h3>
        </div>        <CategoryTree
          :paperType="config.paperType"
          :selectedCategoryId="selectedCategoryId"
          @select="handleCategorySelect"
        />
      </div>

      <!-- 右侧内容 -->
      <div class="main-content">
        <!-- 内容头部 -->
        <div class="content-header">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="`搜索${config.searchPlaceholder}...`"
              @input="handleSearch"
            />
            <span class="search-icon">🔍</span>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-search-btn"
              title="清空搜索"
            >
              ✕
            </button>
          </div>
          <button
            @click="$emit('add-new')"
            class="btn btn-outline-purple"
          >
            <span class="btn-icon">+</span>
            {{ config.addButtonText }}
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="papers-container">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载数据...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>{{ error }}</p>
            <button @click="loadPapers" class="btn btn-primary">
              重新加载
            </button>
          </div>

          <!-- 空状态 -->
          <div v-else-if="filteredPapers.length === 0" class="empty-state">
            <div class="empty-icon">{{ config.emptyIcon }}</div>
            <h3>{{ searchQuery ? '未找到匹配的结果' : config.emptyTitle }}</h3>
            <p>{{ searchQuery ? '试试调整搜索关键词或选择其他分类' : config.emptyDescription }}</p>
            <button
              v-if="!searchQuery"
              @click="$emit('add-new')"
              class="btn btn-outline-purple"
            >
              <span class="btn-icon">+</span>
              {{ config.addButtonText }}
            </button>
          </div>

          <!-- 论文列表 -->
          <div v-else class="papers-grid">
            <PaperCard
              v-for="paper in filteredPapers"
              :key="paper.id"
              :paper="paper"
              :paper-type="config.paperType"
              @edit="$emit('edit', paper)"
              @delete="handleDelete"
              @view="$emit('view', paper)"
            />
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            v-for="page in totalPages"
            :key="page"
            :class="['page-btn', { active: currentPage === page }]"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import CategoryTree from './CategoryTree.vue'
import PaperCard from './PaperCard.vue'
import { usePapers } from '../composables/usePapers'
import { useTeam } from '../composables/useTeam'

const props = defineProps({
  config: {
    type: Object,
    required: true,
    validator: (config) => {
      const required = ['title', 'icon', 'paperType']
      return required.every(key => key in config)
    }
  }
})

const emit = defineEmits(['add-new', 'edit', 'view'])

const { currentTeam } = useTeam()

// 使用通用的论文管理逻辑
const {
  papers,
  loading,
  error,
  searchQuery,
  selectedCategoryId,
  currentPage,
  filteredPapers,
  totalPages,
  loadPapers,
  handleDelete,
  handleCategorySelect,
  handleSearch,
  clearSearch
} = usePapers({
  type: props.config.type || 'papers',
  requireTeam: props.config.requireTeam || false,
  loadData: props.config.loadData,
  deleteData: props.config.deleteData
})

// 动态描述
const description = computed(() => {
  if (props.config.requireTeam && currentTeam.value) {
    return props.config.description.replace('{teamName}', currentTeam.value.name)
  }
  return props.config.description
})

// 生命周期
onMounted(() => {
  loadPapers()
})

// 暴露给父组件的方法
defineExpose({
  loadPapers,
  papers,
  loading
})
</script>

<style scoped>
.paper-manager {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.page-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--white);
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.page-icon {
  font-size: 2rem;
}

.page-description {
  color: var(--color-text-soft);
  font-size: 1.1rem;
  margin: 0;
}

.content-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
}

.sidebar {
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 200px);
}

.sidebar-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.main-content {
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.content-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 91, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-soft);
}

.clear-search-btn {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-text);
}

.papers-container {
  min-height: 400px;
  padding: 1.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3,
.empty-state h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.error-state p,
.empty-state p {
  color: var(--color-text-soft);
  margin: 0 0 2rem 0;
}

.papers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--white);
  color: var(--color-text);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.page-btn.active {
  background: var(--color-primary);
  color: var(--white);
  border-color: var(--color-primary);
}

.no-team-warning {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin: 2rem 0;
}

.warning-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-team-warning h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.no-team-warning p {
  color: var(--color-text-soft);
  margin: 0 0 2rem 0;
}

@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sidebar {
    position: static;
    max-height: none;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-bar {
    max-width: none;
  }
}
</style>
