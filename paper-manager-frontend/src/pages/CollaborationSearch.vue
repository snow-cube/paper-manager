<template>
  <StandardPageLayout
    title="合作网络搜索"
    icon="🔍"
    description="搜索和分析学者间的合作关系网络"
  >
    <!-- 搜索控制器 -->
    <template #controls>
      <div class="search-controls">
        <div class="search-form">
          <input
            v-model="searchQuery"
            @keyup.enter="searchNetwork"
            type="text"
            placeholder="输入学者姓名（如：张三）"
            class="search-input"
          />
          <button
            @click="searchNetwork"
            :disabled="!searchQuery.trim() || isLoading"
            class="btn btn-primary"
          >
            <span v-if="isLoading">搜索中...</span>
            <span v-else>🔍 搜索网络</span>
          </button>
        </div>

        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0" class="search-history">
          <div class="history-header">
            <span>搜索历史</span>
            <button @click="clearHistory" class="clear-history-btn">
              清空
            </button>
          </div>
          <div class="history-tags">
            <button
              v-for="author in searchHistory"
              :key="author"
              @click="quickSearch(author)"
              class="history-tag"
            >
              {{ author }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 搜索结果 -->
    <div class="results-section">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <LoadingSpinner />
        <p>正在搜索合作网络...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <StandardWarning icon="❌" title="搜索失败" :message="error" />
      </div>

      <!-- 无结果 -->
      <div v-else-if="hasSearched && !networkData" class="no-results-state">
        <StandardWarning
          icon="📭"
          title="未找到结果"
          message="未找到该学者的合作网络信息，请尝试其他关键词。"
        />
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="networkData" class="search-results">
        <!-- 网络概览 -->
        <div class="network-summary">
          <h3>合作网络概览</h3>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">合作学者</span>
              <span class="stat-value">{{
                networkData.total_collaborators
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">合作论文</span>
              <span class="stat-value">{{ totalPapers }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均合作度</span>
              <span class="stat-value">{{
                averageCollaboration.toFixed(1)
              }}</span>
            </div>
          </div>
        </div>

        <!-- 网络可视化 -->
        <div class="network-container">
          <CollaborationNetwork
            :network-data="networkData"
            @node-click="searchCollaboratorNetwork"
          />
        </div>

        <!-- 合作者列表 -->
        <div class="collaborators-list">
          <h4>主要合作学者</h4>
          <div class="collaborators-grid">
            <div
              v-for="collaborator in sortedCollaborators.slice(0, 10)"
              :key="collaborator.name"
              class="collaborator-card"
              @click="searchCollaboratorNetwork(collaborator.name)"
            >
              <div class="collaborator-info">
                <h5 class="collaborator-name">{{ collaborator.name }}</h5>
                <div class="collaborator-stats">
                  <span class="collaboration-count">
                    合作 {{ collaborator.collaboration_count }} 次
                  </span>
                  <span class="paper-count">
                    共同论文 {{ collaborator.papers.length }} 篇
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 初始状态 -->
      <div v-else class="initial-state">
        <StandardWarning
          icon="🔍"
          title="开始搜索"
          message="输入学者姓名开始搜索合作网络关系"
          type="info"
        />
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  StandardPageLayout,
  StandardWarning,
  CollaborationNetwork,
  LoadingSpinner,
} from "@/components";
import { getAuthorCollaborationNetwork } from "@/services/api";
import { useToast } from "@/composables/useToast";

const { showToast } = useToast();

// 响应式数据
const searchQuery = ref("");
const isLoading = ref(false);
const error = ref(null);
const networkData = ref(null);
const hasSearched = ref(false);
const searchHistory = ref([]);

// 计算属性
const totalPapers = computed(() => {
  if (!networkData.value) return 0;
  return networkData.value.collaborators.reduce(
    (sum, collab) => sum + collab.papers.length,
    0
  );
});

const averageCollaboration = computed(() => {
  if (!networkData.value || networkData.value.total_collaborators === 0)
    return 0;
  return totalPapers.value / networkData.value.total_collaborators;
});

const sortedCollaborators = computed(() => {
  if (!networkData.value) return [];
  return [...networkData.value.collaborators].sort(
    (a, b) => b.collaboration_count - a.collaboration_count
  );
});

// 搜索网络
const searchNetwork = async () => {
  if (!searchQuery.value.trim()) {
    showToast("请输入学者姓名", "warning");
    return;
  }

  isLoading.value = true;
  error.value = null;
  networkData.value = null;
  hasSearched.value = true;

  try {
    const result = await getAuthorCollaborationNetwork(
      searchQuery.value.trim()
    );
    networkData.value = result;
    addToHistory(searchQuery.value.trim());
    showToast("搜索完成", "success");
  } catch (err) {
    error.value = err.message || "搜索失败，请稍后重试";
    showToast("搜索失败", "error");
  } finally {
    isLoading.value = false;
  }
};

// 搜索合作者网络
const searchCollaboratorNetwork = (collaboratorName) => {
  searchQuery.value = collaboratorName;
  searchNetwork();
};

// 快速搜索
const quickSearch = (authorName) => {
  searchQuery.value = authorName;
  searchNetwork();
};

// 添加到搜索历史
const addToHistory = (authorName) => {
  if (!searchHistory.value.includes(authorName)) {
    searchHistory.value.unshift(authorName);
    searchHistory.value = searchHistory.value.slice(0, 10); // 只保留最近10次搜索
    saveHistory();
  }
};

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem("collaboration_search_history");
  showToast("搜索历史已清空", "info");
};

// 保存搜索历史到本地存储
const saveHistory = () => {
  localStorage.setItem(
    "collaboration_search_history",
    JSON.stringify(searchHistory.value)
  );
};

// 加载搜索历史
const loadHistory = () => {
  const saved = localStorage.getItem("collaboration_search_history");
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved);
    } catch {
      searchHistory.value = [];
    }
  }
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
/* 搜索控制器 */
.search-controls {
  background: var(--white);
  padding: var(--space-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

.search-form {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  margin-bottom: var(--space-lg);
}

.search-input {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  background: var(--white);
  transition: all var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.btn {
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--text-base);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border: none;
  transition: all var(--transition-normal);
}

.btn-primary {
  background: var(--primary-500);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-600);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 搜索历史 */
.search-history {
  border-top: 1px solid var(--primary-100);
  padding-top: var(--space-lg);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  font-weight: 600;
  color: var(--color-text);
}

.clear-history-btn {
  background: none;
  border: none;
  color: var(--primary-500);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-normal);
}

.clear-history-btn:hover {
  background: var(--primary-50);
  color: var(--primary-600);
}

.history-tags {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.history-tag {
  background: var(--primary-100);
  color: var(--primary-700);
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.history-tag:hover {
  background: var(--primary-200);
  transform: translateY(-1px);
}

/* 结果区域 */
.results-section {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
}

.loading-state,
.error-state,
.no-results-state,
.initial-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.loading-state p {
  margin-top: var(--space-lg);
  color: var(--color-text);
}

/* 网络概览 */
.network-summary {
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--primary-25), var(--white));
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
}

.network-summary h3 {
  margin: 0 0 var(--space-lg) 0;
  color: var(--color-heading);
  font-size: var(--text-xl);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-lg);
}

.stat-item {
  text-align: center;
  padding: var(--space-lg);
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-light);
  margin-bottom: var(--space-sm);
}

.stat-value {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--primary-600);
}

/* 网络可视化 */
.network-container {
  margin-bottom: var(--space-xl);
  min-height: 400px;
  border: 1px solid var(--primary-100);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

/* 合作者列表 */
.collaborators-list h4 {
  margin: 0 0 var(--space-lg) 0;
  color: var(--color-heading);
  font-size: var(--text-lg);
}

.collaborators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

.collaborator-card {
  padding: var(--space-lg);
  background: var(--white);
  border: 1px solid var(--primary-100);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.collaborator-card:hover {
  background: var(--primary-25);
  border-color: var(--primary-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.collaborator-name {
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-heading);
  font-size: var(--text-base);
  font-weight: 600;
}

.collaborator-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.collaboration-count,
.paper-count {
  font-size: var(--text-sm);
  color: var(--color-text-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .collaborators-grid {
    grid-template-columns: 1fr;
  }

  .history-tags {
    justify-content: center;
  }
}
</style>
