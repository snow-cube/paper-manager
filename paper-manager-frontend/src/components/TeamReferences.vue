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
          </button>
          <button
            @click="deleteReference(reference)"
            class="btn-action"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑文献模态框 -->
    <Modal v-if="showAddForm || editingReference" @close="closeForm">
      <ReferenceForm
        :reference="editingReference"
        :team="team"
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
import { getReferences, deleteReference as deleteReferenceApi, downloadReference as downloadReferenceApi, getCategories } from '../services/api.js';
import { useToast } from '../composables/useToast.js';
import LoadingSpinner from './LoadingSpinner.vue';
import Modal from './Modal.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import ReferenceForm from './ReferenceForm.vue';

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
    const params = {};
    if (selectedCategoryId.value) {
      params.category_id = selectedCategoryId.value;
    }
    if (keywordFilter.value) {
      params.keyword = keywordFilter.value;
    }

    references.value = await getReferences(props.team.id, params);
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

const deleteReference = (reference) => {
  deletingReference.value = reference;
};

const confirmDelete = async () => {
  if (!deletingReference.value) return;

  try {
    await deleteReferenceApi(deletingReference.value.id);
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
    const response = await downloadReferenceApi(reference.id);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reference.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showToast('文件下载开始', 'success');
  } catch (error) {
    console.error('Failed to download reference:', error);
    showToast('文件下载失败', 'error');
  }
};

const handleReferenceSaved = (savedReference) => {
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
  margin-bottom: 2rem;
  gap: 1rem;
}

.references-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-bar {
  position: relative;
}

.search-input {
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  width: 250px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-select,
.filter-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.filter-input {
  flex: 1;
  max-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-card {
  display: flex;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.reference-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.reference-content {
  flex: 1;
}

.reference-title {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  line-height: 1.4;
}

.reference-authors {
  color: #666;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.reference-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: #888;
}

.doi {
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.reference-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
}

.btn-action {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1.2rem;
}

.btn-action:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #5855eb;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}
</style>
