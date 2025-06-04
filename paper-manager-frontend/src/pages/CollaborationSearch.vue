<template>
  <div class="collaboration-search-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">合作网络分析</h1>
        <div class="search-form">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="请输入作者姓名..."
            class="search-input"
            @keyup.enter="searchNetwork"
            :disabled="isLoading"
          />
          <button
            @click="searchNetwork"
            class="btn btn-primary"
            :disabled="!searchQuery.trim() || isLoading"
          >
            <span v-if="isLoading">⟳</span>
            <span v-else>搜索</span>
          </button>
        </div>
      </div>

      <!-- 搜索结果区域 -->
      <div v-if="hasSearched" class="results-section">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <LoadingSpinner />
          <p>正在分析 {{ searchQuery }} 的合作网络...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="searchNetwork" class="btn btn-primary btn-sm">重试</button>
        </div>

        <!-- 无结果状态 -->
        <div v-else-if="!networkData || networkData.total_collaborators === 0" class="no-results-state">
          <p>未找到作者 "{{ searchQuery }}" 的合作网络数据</p>
        </div>

        <!-- 网络可视化 -->
        <div v-else class="network-visualization">
          <div class="network-summary">
            <h3>{{ networkData.author.name }} ({{ networkData.total_collaborators }}位合作者 / {{ totalPapers }}篇论文)</h3>
          </div>

          <div class="network-container">
            <CollaborationNetwork :network-data="networkData" />
          </div>

          <!-- 合作者列表 -->
          <div class="collaborators-list">
            <h4>合作者列表</h4>
            <div class="collaborators-grid">
              <div
                v-for="collaborator in sortedCollaborators"
                :key="collaborator.author_id"
                class="collaborator-card"
                @click="searchCollaboratorNetwork(collaborator.name)"
              >
                <div class="collaborator-info">
                  <span class="collaborator-name">{{ collaborator.name }}</span>
                  <div class="collaborator-stats">
                    <span class="collaboration-count">{{ collaborator.collaboration_count }}次合作</span>
                    <span class="paper-count">{{ collaborator.papers.length }}篇论文</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="history-header">
          <span>最近搜索:</span>
          <button @click="clearHistory" class="clear-history-btn">清空</button>
        </div>
        <div class="history-tags">
          <button
            v-for="author in searchHistory.slice(0, 5)"
            :key="author"
            @click="quickSearch(author)"
            class="history-tag"
          >
            {{ author }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CollaborationNetwork from '@/components/CollaborationNetwork.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { getAuthorCollaborationNetwork } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

// 响应式数据
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref(null)
const networkData = ref(null)
const hasSearched = ref(false)
const searchHistory = ref([])

// 计算属性
const totalPapers = computed(() => {
  if (!networkData.value) return 0
  return networkData.value.collaborators.reduce((sum, collab) => sum + collab.papers.length, 0)
})

const averageCollaboration = computed(() => {
  if (!networkData.value || networkData.value.total_collaborators === 0) return 0
  return totalPapers.value / networkData.value.total_collaborators
})

const sortedCollaborators = computed(() => {
  if (!networkData.value) return []
  return [...networkData.value.collaborators].sort((a, b) => b.collaboration_count - a.collaboration_count)
})

// 搜索网络
const searchNetwork = async () => {
  if (!searchQuery.value.trim()) {
    showToast('请输入作者姓名', 'warning')
    return
  }

  isLoading.value = true
  error.value = null
  networkData.value = null
  hasSearched.value = true

  try {
    const data = await getAuthorCollaborationNetwork(searchQuery.value.trim())
    networkData.value = data

    // 添加到搜索历史
    addToHistory(searchQuery.value.trim())

    if (data.total_collaborators > 0) {
      showToast(`找到 ${data.total_collaborators} 个合作者`, 'success')
    }
  } catch (err) {
    console.error('Failed to fetch collaboration network:', err)
    error.value = err.response?.data?.detail || '获取合作网络数据失败，请检查作者姓名或稍后重试'
    showToast('搜索失败', 'error')
  } finally {
    isLoading.value = false
  }
}

// 搜索合作者网络
const searchCollaboratorNetwork = (collaboratorName) => {
  searchQuery.value = collaboratorName
  searchNetwork()
}

// 快速搜索
const quickSearch = (authorName) => {
  searchQuery.value = authorName
  searchNetwork()
}

// 添加到搜索历史
const addToHistory = (authorName) => {
  if (!searchHistory.value.includes(authorName)) {
    searchHistory.value.unshift(authorName)
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
    saveHistory()
  }
}

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('collaboration_search_history')
  showToast('搜索历史已清空', 'info')
}

// 保存搜索历史到本地存储
const saveHistory = () => {
  localStorage.setItem('collaboration_search_history', JSON.stringify(searchHistory.value))
}

// 加载搜索历史
const loadHistory = () => {
  const saved = localStorage.getItem('collaboration_search_history')
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load search history:', e)
    }
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.collaboration-search-page {
  min-height: calc(100vh - 120px);
  background: var(--color-background);
  position: relative;
  padding: 0.75rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

/* 页面头部 */
.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0;
  margin-bottom: 0.75rem;
}

.page-title {
  font-size: 1.4rem;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

/* 搜索表单 */
.search-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background: var(--color-background);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* 按钮样式 */
.btn {
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

/* 结果区域 */
.results-section {
  background: var(--color-background);
  border-radius: var(--border-radius);
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--color-border);
  min-height: 200px;
}

.loading-state,
.error-state,
.no-results-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  text-align: center;
}

.loading-state p,
.error-state p,
.no-results-state p {
  color: var(--color-text);
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

/* 网络可视化 */
.network-summary {
  text-align: center;
  margin-bottom: 0.5rem;
}

.network-summary h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1rem;
  font-weight: 600;
}

.network-container {
  background: var(--color-background-soft);
  border-radius: var(--border-radius);
  padding: 0;
  margin-bottom: 0.5rem;
  height: 450px; /* 增加高度以适应网络图 */
  border: 1px solid var(--color-border);
  overflow: hidden; /* 确保内容不会溢出 */
}

/* 合作者列表 */
.collaborators-list {
  margin-top: 0.5rem;
}

.collaborators-list h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 0.95rem;
  font-weight: 600;
}

.collaborators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.5rem;
}

.collaborator-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 0.5rem;
  cursor: pointer;
}

.collaborator-card:hover {
  border-color: var(--color-primary);
}

.collaborator-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.collaborator-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-heading);
}

.collaborator-stats {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.collaboration-count, .paper-count {
  background: var(--color-primary);
  color: var(--white);
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* 搜索历史 */
.history-section {
  background: var(--color-background-soft);
  border-radius: var(--border-radius);
  padding: 0.5rem;
  border: 1px solid var(--color-border);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.85rem;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.history-tag {
  padding: 0.25rem 0.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text);
}

.history-tag:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.clear-history-btn {
  padding: 0.15rem 0.4rem;
  background: none;
  color: var(--error-600);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.8rem;
}

.clear-history-btn:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 0.5rem 0;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .search-form {
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
  }

  .search-input, .btn {
    width: 100%;
  }

  .btn {
    justify-content: center;
  }

  .collaborators-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .network-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.2rem;
  }

  .collaborator-card {
    padding: 0.4rem;
  }

  .collaborator-info {
    gap: 0.2rem;
  }

  .collaboration-count, .paper-count {
    font-size: 0.65rem;
    padding: 0.15rem 0.3rem;
  }
}
</style>
