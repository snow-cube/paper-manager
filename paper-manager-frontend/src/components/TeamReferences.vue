<template>
  <div class="team-references">
    <div class="references-header">
      <h3>团队参考文献</h3>
      <div class="header-actions">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文献..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        <button @click="showAddForm = true" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          添加文献
        </button>
      </div>
    </div>

    <div class="filters">
      <select v-model="selectedCategoryId" class="filter-select">
        <option value="">所有分类</option>
        <option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
      <input
        v-model="keywordFilter"
        type="text"
        placeholder="按关键词筛选..."
        class="filter-input"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>加载文献中...</p>
    </div>

    <div v-else-if="filteredReferences.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>暂无参考文献</h3>
      <p>{{ searchQuery || keywordFilter ? '没有找到匹配的文献' : '添加团队的第一篇参考文献' }}</p>
      <button
        v-if="!searchQuery && !keywordFilter"
        @click="showAddForm = true"
        class="btn btn-primary"
      >
        添加文献
      </button>
    </div>

    <div v-else class="references-list">
      <div
        v-for="reference in filteredReferences"
        :key="reference.id"
        class="reference-card"
      >
        <div class="reference-content">
          <h4 class="reference-title">{{ reference.title }}</h4>
          <p class="reference-authors">{{ reference.authors }}</p>
          <div class="reference-meta">
            <span v-if="reference.doi" class="doi">
              DOI: {{ reference.doi }}
            </span>
            <span class="created-date">
              添加于 {{ formatDate(reference.created_at) }}
            </span>
          </div>
          <div v-if="reference.keywords?.length" class="keywords">
            <span
              v-for="keyword in reference.keywords"
              :key="keyword"
              class="keyword-tag"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
        <div class="reference-actions">
          <button
            v-if="reference.file_path"
            @click="downloadReference(reference)"
            class="btn-action"
            title="下载文件"
          >
            📥
          </button>
          <button
            @click="editReference(reference)"
            class="btn-action"
            title="编辑"
          >
            ✏️
          </button>          <button
            @click="handleDeleteReference(reference)"
            class="btn-action"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>    <!-- 添加/编辑文献模态框 -->
    <Modal v-if="showAddForm || editingReference" @close="closeForm">
      <PaperForm
        :paper="editingReference"
        :paperType="'literature'"
        @saved="handleReferenceSaved"
        @cancel="closeForm"
      />
    </Modal>

    <!-- 删除确认对话框 -->    <ConfirmDialog
      v-if="deletingReference"
      title="删除参考文献"
      :message="`确定要删除文献 &quot;${deletingReference.title}&quot; 吗？此操作不可撤销。`"
      @confirm="confirmDelete"
      @cancel="deletingReference = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  getReferences,
  deleteReference as deleteReferenceAPI,
  downloadReference as downloadReferenceAPI,
  getCategories
} from '../services/api.js';
import { useToast } from '../composables/useToast.js';
import LoadingSpinner from './LoadingSpinner.vue';
import Modal from './Modal.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import PaperForm from './PaperForm.vue';

const props = defineProps({
  team: {
    type: Object,
    required: true
  }
});

const { showToast } = useToast();

const loading = ref(false);
const references = ref([]);
const categories = ref([]);
const showAddForm = ref(false);
const editingReference = ref(null);
const deletingReference = ref(null);
const searchQuery = ref('');
const selectedCategoryId = ref('');
const keywordFilter = ref('');

const filteredReferences = computed(() => {
  let filtered = references.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(ref =>
      ref.title.toLowerCase().includes(query) ||
      ref.authors.toLowerCase().includes(query)
    );
  }

  if (selectedCategoryId.value) {
    filtered = filtered.filter(ref => ref.category_id === parseInt(selectedCategoryId.value));
  }

  if (keywordFilter.value) {
    const keyword = keywordFilter.value.toLowerCase();
    filtered = filtered.filter(ref =>
      ref.keywords?.some(k => k.toLowerCase().includes(keyword))
    );
  }

  return filtered;
});

const loadReferences = async () => {
  loading.value = true;
  try {
    // 获取当前团队的参考文献
    references.value = await getReferences(props.team.id);
  } catch (error) {
    console.error('Failed to load references:', error);
    showToast('加载参考文献失败', 'error');
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const editReference = (reference) => {
  editingReference.value = reference;
};

const handleDeleteReference = (reference) => {
  deletingReference.value = reference;
};

const confirmDelete = async () => {
  if (!deletingReference.value) return;

  try {
    await deleteReferenceAPI(deletingReference.value.id);
    references.value = references.value.filter(r => r.id !== deletingReference.value.id);
    showToast('参考文献删除成功', 'success');
  } catch (error) {
    console.error('Failed to delete reference:', error);
    showToast('删除参考文献失败', 'error');
  } finally {
    deletingReference.value = null;
  }
};

const downloadReference = async (reference) => {
  try {
    showToast('准备下载文件...', 'info');
    const response = await downloadReferenceAPI(reference.id);

    // 创建下载链接
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reference.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showToast('文件下载成功', 'success');
  } catch (error) {
    console.error('Failed to download reference:', error);
    showToast('文件下载失败', 'error');
  }
};

const handleReferenceSaved = (savedReference) => {
  console.log("handleReferenceSaved called with:", savedReference);

  if (!savedReference) {
    console.error("savedReference is undefined");
    showToast('保存文献时出现错误', 'error');
    return;
  }

  // 确保论文与当前团队关联
  savedReference.team_id = props.team.id;

  if (editingReference.value) {
    // 更新现有文献
    const index = references.value.findIndex(r => r.id === savedReference.id);
    if (index !== -1) {
      references.value[index] = savedReference;
    }
  } else {
    // 添加新文献
    references.value.unshift(savedReference);
  }
  closeForm();
};

const closeForm = () => {
  showAddForm.value = false;
  editingReference.value = null;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 监听筛选条件变化，重新加载数据
watch([selectedCategoryId, keywordFilter], () => {
  loadReferences();
}, { debounce: 300 });

onMounted(() => {
  loadReferences();
  loadCategories();
});
</script>

<style scoped>
.team-references {
  max-width: 1000px;
}

.references-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  gap: var(--space-md);
}

.references-header h3 {
  color: var(--color-heading);
  margin: 0;
  font-size: var(--text-xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.search-bar {
  position: relative;
}

.search-input {
  padding: var(--space-md) var(--space-2xl) var(--space-md) var(--space-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  width: 250px;
  transition: border-color var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-icon {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
}

.filters {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.filter-select,
.filter-input {
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--white);
  font-size: var(--text-sm);
}

.filter-input {
  flex: 1;
  max-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-md);
  color: var(--color-text-light);
}

.empty-icon {
  font-size: var(--space-4xl);
  margin-bottom: var(--space-md);
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.reference-card {
  display: flex;
  padding: var(--space-lg);
  background: var(--white);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  transition: all var(--transition-normal);
}

.reference-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.reference-content {
  flex: 1;
}

.reference-title {
  color: var(--color-heading);
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--text-lg);
  line-height: 1.4;
}

.reference-authors {
  color: var(--color-text-light);
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-sm);
}

.reference-meta {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.doi {
  font-family: monospace;
  background: var(--color-bg-soft);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.keyword-tag {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: var(--space-xs) var(--space-md);
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 500;
}

.reference-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-left: var(--space-md);
}

.btn-action {
  background: none;
  border: none;
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-normal);
  font-size: var(--text-xl);
}

.btn-action:hover {
  background: var(--color-bg-soft);
}

.btn {
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
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
  transform: translateY(-1px);
}

.btn-icon {
  font-size: var(--text-base);
}
</style>
