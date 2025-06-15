<template>
  <StandardPageLayout
    title="作者信息查询"
    icon="🔍"
    description="查询作者的工作量和合作网络信息"
  >
    <!-- 搜索控制器 -->
    <template #controls>
      <div class="search-controls">
        <div class="search-form">
          <input
            v-model="searchQuery"
            @keyup.enter="searchAuthorInfo"
            type="text"
            placeholder="输入学者姓名（如：张三）"
            class="search-input"
          />
          <button
            @click="searchAuthorInfo"
            :disabled="!searchQuery.trim() || isLoading"
            class="btn btn-primary"
          >
            <span v-if="isLoading">搜索中...</span>
            <span v-else>🔍 搜索</span>
          </button>
          <button
            @click="exportAllAuthorsWorkload"
            :disabled="isExporting"
            class="btn btn-secondary"
            title="导出所有作者工作量汇总"
          >
            <span v-if="isExporting">导出中...</span>
            <span v-else>📈 导出汇总</span>
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
    <!-- 双列布局内容 -->
    <div class="dual-column-layout">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <LoadingSpinner />
        <p>正在搜索作者信息...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <StandardWarning icon="❌" title="搜索失败" :message="error" />
      </div>

      <!-- 无结果 -->
      <div
        v-else-if="hasSearched && !workloadData && !networkData"
        class="no-results-state"
      >
        <StandardWarning
          icon="📭"
          title="未找到结果"
          message="未找到该学者的信息，请尝试其他关键词。"
        />
      </div>

      <!-- 搜索结果 - 双列布局 -->
      <div v-else-if="workloadData || networkData" class="search-results">
        <!-- 左侧边栏 -->
        <div class="sidebar">
          <!-- 工作量统计 -->
          <div v-if="workloadData" class="sidebar-section workload-summary">
            <div class="workload-header">
              <h3>{{ workloadData.author_name }} 统计概览</h3>
              <button
                @click="exportCurrentAuthorWorkload"
                :disabled="isExporting"
                class="btn btn-sm btn-outline"
                title="导出当前作者详细工作量"
              >
                <span v-if="isExporting">导出中...</span>
                <span v-else>📊 导出详情</span>
              </button>
            </div>
            <div class="author-stats">
              <div class="stat-item">
                <span class="stat-label">总工作量</span>
                <span class="stat-value">{{
                  workloadData.total_workload.toFixed(2)
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">论文数量</span>
                <span class="stat-value">{{
                  workloadData.paper_workloads.length
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均贡献率</span>
                <span class="stat-value">{{ averageContribution }}%</span>
              </div>
            </div>
          </div>

          <!-- 合作者列表 -->
          <div v-if="networkData" class="sidebar-section collaborators-summary">
            <h3>主要合作者</h3>
            <div class="collaborator-search">
              <input
                type="text"
                v-model="collaboratorSearch"
                placeholder="搜索合作者..."
                class="search-input-small"
              />
            </div>
            <div class="collaborators-list">
              <div
                v-for="collaborator in filteredTopCollaborators"
                :key="collaborator.name"
                class="collaborator-item"
                @click="searchCollaboratorInfo(collaborator.name)"
              >
                <div class="collaborator-avatar">
                  {{ collaborator.name.charAt(0) }}
                </div>
                <div class="collaborator-detail">
                  <div class="collaborator-name">{{ collaborator.name }}</div>
                  <div class="collaboration-count">
                    合作 {{ collaborator.collaboration_count }} 次
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧主体内容 -->
        <div class="main-content">
          <!-- 期刊等级分布和作者排序分布 -->
          <div v-if="workloadData" class="charts-section">
            <div class="chart-container">
              <h4>期刊等级分布</h4>
              <div class="journal-grades-chart">
                <div
                  v-for="(count, grade) in journalGradeCounts"
                  :key="grade"
                  class="grade-bar"
                >
                  <div class="grade-label">{{ grade || "未知" }}</div>
                  <div class="grade-bar-container">
                    <div
                      class="grade-bar-fill"
                      :style="{
                        width:
                          (count / workloadData.paper_workloads.length) * 100 +
                          '%',
                      }"
                    ></div>
                    <span class="grade-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="chart-container">
              <h4>作者排序分布</h4>
              <div class="author-order-chart">
                <div
                  v-for="(count, order) in authorOrderCounts"
                  :key="order"
                  class="order-bar"
                >
                  <div class="order-label">
                    {{
                      order === "1"
                        ? "第一作者"
                        : order === "2"
                        ? "第二作者"
                        : `第${order}作者`
                    }}
                  </div>
                  <div class="order-bar-container">
                    <div
                      class="order-bar-fill"
                      :style="{
                        width:
                          (count / workloadData.paper_workloads.length) * 100 +
                          '%',
                      }"
                    ></div>
                    <span class="order-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 论文列表 -->
          <div v-if="workloadData" class="papers-section">
            <div class="papers-header">
              <h4>论文详情列表</h4>
              <div class="papers-controls">
                <select v-model="sortBy" class="sort-select">
                  <option value="date">按发表时间排序</option>
                  <option value="contribution">按贡献率排序</option>
                  <option value="order">按作者排序</option>
                </select>
              </div>
            </div>
            <div class="papers-table-container">
              <table class="papers-table">
                <thead>
                  <tr>
                    <th>论文ID</th>
                    <th>期刊等级</th>
                    <th>发表时间</th>
                    <th>贡献率</th>
                    <th>作者排序</th>
                    <th>通讯作者</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="paper in sortedPapers"
                    :key="paper.paper_id"
                    class="paper-row"
                  >
                    <td>{{ paper.paper_id }}</td>
                    <td>
                      <div class="journal-grade">
                        <span
                          class="grade-badge"
                          :class="`grade-${paper.journal_grade?.toLowerCase()}`"
                        >
                          {{ paper.journal_grade || "未知" }}
                        </span>
                      </div>
                    </td>
                    <td>{{ formatDate(paper.publication_date) }}</td>
                    <td>
                      <div class="contribution-container">
                        <div class="contribution-bar-container">
                          <div
                            class="contribution-bar"
                            :style="{
                              width: paper.contribution_ratio * 100 + '%',
                            }"
                          ></div>
                        </div>
                        <span class="contribution-text"
                          >{{
                            (paper.contribution_ratio * 100).toFixed(1)
                          }}%</span
                        >
                      </div>
                    </td>
                    <td>
                      <span
                        class="author-order"
                        :class="{ 'first-author': paper.author_order === 1 }"
                      >
                        {{ paper.author_order }}
                      </span>
                    </td>
                    <td>
                      <span
                        v-if="paper.is_corresponding"
                        class="corresponding-badge"
                        >✓</span
                      >
                      <span v-else class="not-corresponding">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 合作网络 -->
          <div v-if="networkData" class="network-section">
            <div class="collaboration-visualization">
              <CollaborationNetwork
                :networkData="formattedNetworkData"
                @select-collaborator="searchCollaboratorInfo"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 初始状态 -->
      <div v-else class="initial-state">
        <StandardWarning
          icon="🔍"
          title="开始搜索"
          message="输入学者姓名开始搜索作者信息"
          type="info"
        />
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { ref, onMounted, defineProps, watch, computed } from "vue";
import {
  StandardPageLayout,
  StandardWarning,
  LoadingSpinner,
  CollaborationNetwork,
} from "@/components";
import {
  getAuthorCollaborationNetwork,
  getAuthorWorkloadByName,
  exportAuthorWorkloadExcel,
} from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useRoute } from "vue-router";

const props = defineProps({
  searchAuthor: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const { showToast } = useToast();

// 响应式数据
const searchQuery = ref("");
const isLoading = ref(false);
const isExporting = ref(false);
const error = ref(null);
const networkData = ref(null);
const workloadData = ref(null);
const hasSearched = ref(false);
const searchHistory = ref([]);
const collaboratorSearch = ref("");
const sortBy = ref("date");

// 计算属性
const averageContribution = computed(() => {
  if (!workloadData.value?.paper_workloads) return 0;
  const total = workloadData.value.paper_workloads.reduce(
    (sum, paper) => sum + paper.contribution_ratio * 100,
    0
  );
  return (total / workloadData.value.paper_workloads.length).toFixed(1);
});

const journalGradeCounts = computed(() => {
  if (!workloadData.value?.paper_workloads) return {};
  return workloadData.value.paper_workloads.reduce((counts, paper) => {
    const grade = paper.journal_grade || "未知";
    counts[grade] = (counts[grade] || 0) + 1;
    return counts;
  }, {});
});

const authorOrderCounts = computed(() => {
  if (!workloadData.value?.paper_workloads) return {};
  return workloadData.value.paper_workloads.reduce((counts, paper) => {
    const order = paper.author_order.toString();
    counts[order] = (counts[order] || 0) + 1;
    return counts;
  }, {});
});

const sortedPapers = computed(() => {
  if (!workloadData.value?.paper_workloads) return [];
  const papers = [...workloadData.value.paper_workloads];

  switch (sortBy.value) {
    case "contribution":
      return papers.sort((a, b) => b.contribution_ratio - a.contribution_ratio);
    case "order":
      return papers.sort((a, b) => a.author_order - b.author_order);
    case "date":
    default:
      return papers.sort(
        (a, b) => new Date(b.publication_date) - new Date(a.publication_date)
      );
  }
});

const filteredTopCollaborators = computed(() => {
  if (!networkData.value?.collaborators) return [];

  let collaborators = [...networkData.value.collaborators]
    .sort((a, b) => b.collaboration_count - a.collaboration_count)
    .slice(0, 10);

  if (collaboratorSearch.value.trim()) {
    collaborators = collaborators.filter((collaborator) =>
      collaborator.name
        .toLowerCase()
        .includes(collaboratorSearch.value.toLowerCase())
    );
  }

  return collaborators;
});

const formattedNetworkData = computed(() => {
  if (!networkData.value) return null;
  return {
    author: {
      id: "main_author",
      name: networkData.value.author,
    },
    collaborators: networkData.value.collaborators || [],
    total_collaborators: networkData.value.total_collaborators || 0,
  };
});

// 工具函数
const formatDate = (dateString) => {
  if (!dateString) return "未知";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 搜索作者信息
const searchAuthorInfo = async () => {
  if (!searchQuery.value.trim()) {
    showToast("请输入学者姓名", "warning");
    return;
  }

  isLoading.value = true;
  error.value = null;
  networkData.value = null;
  workloadData.value = null;
  hasSearched.value = true;

  try {
    // 并行请求作者工作量和合作网络数据
    const [workloadResult, networkResult] = await Promise.allSettled([
      getAuthorWorkloadByName(searchQuery.value.trim()),
      getAuthorCollaborationNetwork(searchQuery.value.trim()),
    ]);

    // 处理工作量数据结果
    if (workloadResult.status === "fulfilled") {
      workloadData.value = workloadResult.value;
    } else {
      console.error("Failed to fetch author workload:", workloadResult.reason);
    }

    // 处理合作网络数据结果
    if (networkResult.status === "fulfilled") {
      networkData.value = networkResult.value;
    } else {
      console.error(
        "Failed to fetch collaboration network:",
        networkResult.reason
      );
    }

    // 如果两个请求都失败
    if (
      workloadResult.status === "rejected" &&
      networkResult.status === "rejected"
    ) {
      error.value = "无法加载作者信息，请稍后重试";
      showToast("搜索失败", "error");
    } else {
      addToHistory(searchQuery.value.trim());
      showToast("搜索完成", "success");
    }
  } catch (err) {
    error.value = err.message || "搜索失败，请稍后重试";
    showToast("搜索失败", "error");
  } finally {
    isLoading.value = false;
  }
};

// 搜索合作者信息
const searchCollaboratorInfo = (collaboratorName) => {
  searchQuery.value = collaboratorName;
  searchAuthorInfo();
};

// 快速搜索
const quickSearch = (authorName) => {
  searchQuery.value = authorName;
  searchAuthorInfo();
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
  localStorage.removeItem("author_search_history");
  showToast("搜索历史已清空", "info");
};

// 保存搜索历史到本地存储
const saveHistory = () => {
  localStorage.setItem(
    "author_search_history",
    JSON.stringify(searchHistory.value)
  );
};

// 加载搜索历史
const loadHistory = () => {
  const saved = localStorage.getItem("author_search_history");
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved);
    } catch {
      searchHistory.value = [];
    }
  }
};

// 导出当前作者详细工作量
const exportCurrentAuthorWorkload = async () => {
  if (!workloadData.value?.author_name) {
    showToast("没有可导出的作者数据", "warning");
    return;
  }

  await exportWorkloadExcel(workloadData.value.author_name);
};

// 导出所有作者工作量汇总
const exportAllAuthorsWorkload = async () => {
  await exportWorkloadExcel();
};

// 通用导出工作量Excel函数
const exportWorkloadExcel = async (authorName = null) => {
  if (isExporting.value) {
    return;
  }

  isExporting.value = true;

  try {
    const response = await exportAuthorWorkloadExcel(authorName);

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // 生成文件名
    const now = new Date();
    const timestamp = now
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "")
      .replace("T", "_");

    if (authorName) {
      link.download = `${authorName}_workload_${timestamp}.xlsx`;
      showToast(`${authorName} 工作量详情导出成功`, "success");
    } else {
      link.download = `all_authors_workload_summary_${timestamp}.xlsx`;
      showToast("所有作者工作量汇总导出成功", "success");
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
    const message = authorName
      ? `导出 ${authorName} 工作量详情失败`
      : "导出所有作者工作量汇总失败";
    showToast(message, "error");
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  loadHistory();

  // 如果有搜索参数，自动搜索
  const authorParam = route.query.author;
  if (authorParam) {
    searchQuery.value = authorParam;
    searchAuthorInfo();
  }
});

// 监听 props 变化
watch(
  () => props.searchAuthor,
  (newValue) => {
    if (newValue && newValue !== searchQuery.value) {
      searchQuery.value = newValue;
      searchAuthorInfo();
    }
  }
);

// 监听路由变化
watch(
  () => route.query.author,
  (newValue) => {
    if (newValue && newValue !== searchQuery.value) {
      searchQuery.value = newValue;
      searchAuthorInfo();
    }
  }
);
</script>

<style scoped>
/* 搜索控制器 */
.search-controls {
  background: var(--white);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
  max-width: 1200px;
  margin: 0 auto;
}

.search-form {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  margin-bottom: var(--space-md);
  max-width: 800px;
  margin: 0 auto var(--space-md) auto;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  background: var(--white);
  transition: all var(--transition-normal);
  height: 42px;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--text-base);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border: none;
  transition: all var(--transition-normal);
  height: 42px;
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

.btn-secondary {
  background: var(--color-border);
  color: var(--color-text-dark);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--primary-100);
  border-color: var(--primary-300);
  color: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-outline {
  background: transparent;
  color: var(--primary-600);
  border: 1px solid var(--primary-300);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-50);
  border-color: var(--primary-500);
  color: var(--primary-700);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
  height: auto;
  min-height: 32px;
}

/* 搜索历史 */
.search-history {
  border-top: 1px solid var(--primary-100);
  padding-top: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
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
  justify-content: center;
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
.dual-column-layout {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
}

.search-results {
  display: grid;
  grid-template-columns: 320px 1fr;
}

/* 左侧边栏 */
.sidebar {
  background: var(--primary-25);
  border-right: 1px solid var(--primary-100);
  overflow-y: auto;
}

.sidebar-section {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--primary-100);
}

.sidebar-section:last-child {
  border-bottom: none;
}

.sidebar-section h3 {
  margin: 0 0 var(--space-md) 0;
  color: var(--primary-700);
  font-size: var(--text-lg);
  font-weight: 600;
}

/* 工作量统计 */
.workload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  gap: var(--space-sm);
}

.workload-header h3 {
  margin: 0;
  flex: 1;
}

.workload-summary .author-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.workload-summary .stat-item {
  background: var(--white);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--color-text);
  font-size: var(--text-sm);
}

.stat-value {
  color: var(--primary-600);
  font-weight: 600;
  font-size: var(--text-base);
}

/* 合作者列表 */
.collaborator-search {
  margin-bottom: var(--space-md);
}

.search-input-small {
  width: 100%;
  padding: var(--space-sm);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 300px;
  overflow-y: auto;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--white);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.collaborator-item:hover {
  background: var(--primary-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.collaborator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-500);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.collaborator-detail {
  flex: 1;
  min-width: 0;
}

.collaborator-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
}

.collaboration-count {
  color: var(--color-text);
  font-size: var(--text-xs);
}

/* 右侧主体内容 */
.main-content {
  padding: var(--space-lg);
  overflow-y: auto;
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.chart-container {
  background: var(--white);
  padding: var(--space-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

.chart-container h4 {
  margin: 0 0 var(--space-md) 0;
  color: var(--primary-700);
  font-size: var(--text-base);
  font-weight: 600;
}

/* 期刊等级分布 */
.journal-grades-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.grade-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.grade-label {
  width: 60px;
  font-size: var(--text-sm);
  color: var(--color-text);
  flex-shrink: 0;
}

.grade-bar-container {
  flex: 1;
  height: 20px;
  background: var(--color-border);
  border-radius: var(--border-radius-sm);
  position: relative;
  overflow: hidden;
}

.grade-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
  border-radius: var(--border-radius-sm);
  transition: width 0.3s ease;
}

.grade-count {
  position: absolute;
  right: var(--space-xs);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-xs);
  color: var(--color-text);
  font-weight: 600;
}

/* 作者排序分布 */
.author-order-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.order-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.order-label {
  width: 80px;
  font-size: var(--text-sm);
  color: var(--color-text);
  flex-shrink: 0;
}

.order-bar-container {
  flex: 1;
  height: 20px;
  background: var(--color-border);
  border-radius: var(--border-radius-sm);
  position: relative;
  overflow: hidden;
}

.order-bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--secondary-400),
    var(--secondary-600)
  );
  border-radius: var(--border-radius-sm);
  transition: width 0.3s ease;
}

.order-count {
  position: absolute;
  right: var(--space-xs);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-xs);
  color: var(--color-text);
  font-weight: 600;
}

/* 论文列表 */
.papers-section {
  margin-bottom: var(--space-xl);
}

.papers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.papers-header h4 {
  margin: 0;
  color: var(--primary-700);
  font-size: var(--text-lg);
}

.sort-select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  background: var(--white);
}

.papers-table-container {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--primary-100);
  box-shadow: var(--shadow-sm);
}

.papers-table {
  width: 100%;
  border-collapse: collapse;
}

.papers-table th {
  background: var(--primary-50);
  padding: var(--space-md);
  text-align: left;
  font-weight: 600;
  color: var(--primary-700);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--primary-100);
}

.papers-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
  vertical-align: middle;
}

.paper-row:hover {
  background: var(--primary-25);
}

.grade-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.grade-a {
  background: var(--success-100);
  color: var(--success-700);
}
.grade-b {
  background: var(--warning-100);
  color: var(--warning-700);
}
.grade-c {
  background: var(--error-100);
  color: var(--error-700);
}

.contribution-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100px;
}

.contribution-bar-container {
  width: 100%;
  background-color: var(--color-border);
  border-radius: var(--border-radius-sm);
  height: 8px;
  position: relative;
}

.contribution-bar {
  height: 100%;
  background-color: var(--primary-500);
  border-radius: var(--border-radius-sm);
}

.contribution-text {
  font-size: var(--text-xs);
  color: var(--color-text);
  text-align: center;
}

.author-order {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  font-weight: 600;
}

.first-author {
  background: var(--success-100);
  color: var(--success-700);
}

.corresponding-badge {
  color: var(--success-600);
  font-weight: 600;
}

.not-corresponding {
  color: var(--color-text-light);
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .history-tags {
    justify-content: center;
  }

  .search-results {
    grid-template-columns: 1fr;
  }

  .sidebar {
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--primary-100);
  }

  .main-content {
    max-height: none;
  }

  .papers-table-container {
    overflow-x: auto;
  }

  .papers-table {
    min-width: 600px;
  }

  .collaboration-visualization {
    height: 300px;
  }
}
</style>
