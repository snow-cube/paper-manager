<template>
  <div class="category-tree">
    <div class="tree-header">
      <h3 class="tree-title">
        <span class="tree-icon">🗂️</span>
        分类目录
      </h3>
      <button
        class="btn btn-sm btn-primary"
        @click="showAddDialog(null)"
        title="添加根分类"
      >
        <span class="btn-icon">➕</span>
      </button>
    </div>

    <div class="tree-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="tree-loading">
        <LoadingSpinner size="small" message="加载分类中..." />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="tree-error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="btn btn-sm btn-primary" @click="loadCategories">
          <span class="btn-icon">🔄</span>
          重试
        </button>
      </div>

      <!-- 分类内容 -->
      <template v-else>        <!-- 全部论文选项 -->
        <div
          class="tree-node tree-node-all"
          :class="{ 'tree-node-active': props.selectedCategoryId === null }"
          @click="selectCategory(null)"
        >
          <div class="tree-node-content">
            <span class="tree-node-icon">
              {{ props.paperType === 'published' ? '🎓' : props.paperType === 'literature' ? '📚' : '📄' }}
            </span>
            <span class="tree-node-label">
              {{ props.paperType === 'published' ? '全部发表论文' :
                 props.paperType === 'literature' ? '全部文献' : '全部论文' }}
            </span>
            <span class="tree-node-count">{{ totalPapers }}</span>
          </div>
        </div>        <!-- 分类树 -->
        <div class="tree-list">
          <CategoryNode
            v-for="category in categoryTree"
            :key="category.id"
            :category="category"
            :selected-id="props.selectedCategoryId"
            :level="0"
            @select="selectCategory"
            @add-child="showAddDialog"
            @edit="showEditDialog"
            @delete="deleteCategory"
          />
        </div>
      </template>    </div>

    <!-- 添加/编辑分类对话框 -->
    <Teleport to="body">
      <div v-if="showDialog" class="dialog-overlay" @click="closeCategoryDialog">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h4>{{ isEditing ? '编辑分类' : '添加分类' }}</h4>
            <button class="dialog-close" @click="closeCategoryDialog">×</button>
          </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">分类名称</label>
            <input
              v-model="categoryForm.name"
              class="form-input"
              placeholder="请输入分类名称"
              @keyup.enter="saveCategory"
            />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="categoryForm.description"
              class="form-textarea"
              placeholder="请输入分类描述（可选）"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeCategoryDialog">取消</button>
          <button class="btn btn-primary" @click="saveCategory" :disabled="!categoryForm.name.trim()">
            {{ isEditing ? '保存' : '添加' }}          </button>        </div>
      </div>
    </div>
    </Teleport>    <!-- 确认对话框 -->
    <ConfirmDialog
      :visible="dialogState.visible"
      :title="dialogState.title"
      :message="dialogState.message"
      :confirm-text="dialogState.confirmText"
      :cancel-text="dialogState.cancelText"
      :loading="dialogState.loading"
      @confirm="confirmDialog"
      @cancel="cancelDialog"
      @close="closeConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getCategoryTree, createCategory, updateCategory, deleteCategory as deleteCategoryAPI, getPapersByType } from '../services/api';
import { useToast } from '../composables/useToast';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import CategoryNode from './CategoryNode.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps({
  selectedCategoryId: {
    type: [Number, String],
    default: null
  },
  paperType: {
    type: String,
    default: null // 'literature', 'published' 或 null (显示所有类型)
  }
});

const emit = defineEmits(['select']);

const { showToast } = useToast();
const {
  dialogState,
  confirmDialog,
  cancelDialog,
  closeDialog: closeConfirmDialog,
  confirmDelete,
  setLoading
} = useConfirmDialog();

const categoryTree = ref([]);
const totalPapers = ref(0);
const loading = ref(true);
const error = ref(null);

// 对话框状态
const showDialog = ref(false);
const isEditing = ref(false);
const editingCategoryId = ref(null);
const parentCategoryId = ref(null);

const categoryForm = ref({
  name: '',
  description: ''
});

// 选择分类
const selectCategory = (categoryId) => {
  emit('select', categoryId);
};

// 加载分类数据和论文统计
const loadCategories = async () => {
  loading.value = true;
  error.value = null;

  try {
    const data = await getCategoryTree();
    categoryTree.value = data.categories || [];

    // 加载论文统计
    await loadPaperCounts();
  } catch (err) {
    console.error('加载分类失败:', err);
    error.value = '加载分类失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 加载论文数量统计
const loadPaperCounts = async () => {
  try {
    const papers = props.paperType
      ? await getPapersByType(props.paperType)
      : []; // 如果没有指定类型，这里可以调用获取所有论文的API

    totalPapers.value = papers.length;

    // 为每个分类计算论文数量
    const updateCategoryCounts = (categories) => {
      categories.forEach(category => {
        const categoryPapers = papers.filter(paper => paper.category_id === category.id);
        category.paperCount = categoryPapers.length;

        if (category.children) {
          updateCategoryCounts(category.children);
        }
      });
    };

    updateCategoryCounts(categoryTree.value);
  } catch (err) {
    console.error('加载论文统计失败:', err);
  }
};

// 监听 paperType 变化，重新加载统计
watch(() => props.paperType, () => {
  if (categoryTree.value.length > 0) {
    loadPaperCounts();
  }
});

// 显示添加分类对话框
const showAddDialog = (parentId) => {
  isEditing.value = false;
  parentCategoryId.value = parentId;
  categoryForm.value = { name: '', description: '' };
  showDialog.value = true;
};

// 显示编辑分类对话框
const showEditDialog = (category) => {
  isEditing.value = true;
  editingCategoryId.value = category.id;
  categoryForm.value = {
    name: category.name,
    description: category.description || ''
  };
  showDialog.value = true;
};

// 关闭分类对话框
const closeCategoryDialog = () => {
  showDialog.value = false;
  categoryForm.value = { name: '', description: '' };
  editingCategoryId.value = null;
  parentCategoryId.value = null;
};

// 保存分类
const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) return;

  try {
    if (isEditing.value) {
      await updateCategory(editingCategoryId.value, categoryForm.value);
    } else {
      const data = {
        ...categoryForm.value,
        parent_id: parentCategoryId.value
      };
      await createCategory(data);
    }    await loadCategories();
    closeCategoryDialog();
    showToast(isEditing.value ? '分类更新成功' : '分类创建成功', 'success');
  } catch (error) {
    console.error('保存分类失败:', error);
    showToast('保存分类失败，请重试', 'error');
  }
};

// 删除分类
const deleteCategory = async (categoryId) => {
  try {
    await confirmDelete('这个分类（删除后其子分类也会被删除）');

    setLoading(true);
    await deleteCategoryAPI(categoryId);
    await loadCategories();

    // 如果删除的是当前选中的分类，重置选择
    if (selectedCategoryId.value === categoryId) {
      selectCategory(null);
    }      showToast('分类删除成功', 'success');
    closeConfirmDialog(); // 关闭确认对话框
  } catch (error) {
    if (error !== false) { // 用户没有取消操作
      console.error('删除分类失败:', error);
      showToast('删除分类失败，请重试', 'error');
    }
    setLoading(false);
  }
};

onMounted(() => {
  loadCategories();
});

defineExpose({
  loadCategories,
  selectCategory,
  categoryTree
});
</script>

<style scoped>
.category-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.tree-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.tree-icon {
  font-size: 1.125rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.tree-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  gap: 0.5rem;
}

.tree-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  gap: 0.75rem;
}

.tree-error .error-icon {
  font-size: 2rem;
  opacity: 0.6;
}

.tree-error p {
  color: var(--error-600);
  font-size: 0.875rem;
  margin: 0;
}

.tree-node {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tree-node:hover {
  background: var(--color-background-soft);
}

.tree-node-active {
  background: var(--primary-50);
  border-right: 3px solid var(--color-primary);
}

.tree-node-all {
  margin: 0 0.5rem 0.5rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tree-node-icon {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
}

.tree-node-label {
  flex: 1;
  font-weight: 500;
  color: var(--color-heading);
}

.tree-node-count {
  font-size: 0.75rem;
  background: var(--color-background-mute);
  color: var(--color-text-light);
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  font-weight: 500;
}

.tree-node-active .tree-node-count {
  background: var(--white);
  color: var(--color-primary);
}

.tree-list {
  padding: 0 0.5rem;
}

/* 加载状态样式 */
.tree-loading {
  text-align: center;
  padding: 1rem;
  color: var(--color-text);
}

/* 错误状态样式 */
.tree-error {
  text-align: center;
  padding: 1rem;
  color: var(--color-danger);
}

.error-icon {
  font-size: 2rem;  margin-bottom: 0.5rem;
}
</style>

<!-- 对话框的全局样式（不使用scoped） -->
<style>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* 提高z-index确保对话框显示在其他元素之上 */
}

.dialog {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-light);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.dialog-close:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.dialog-body {
  padding: 1.5rem;
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-soft);
}
</style>
