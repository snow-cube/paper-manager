<template>
  <div class="category-tree tree-container">
    <div class="tree-header">
      <h3 class="tree-title">
        <span class="tree-icon">🗂️</span>
        {{ props.categoryType === "references" ? "参考文献分类" : "论文分类" }}
      </h3>
      <button
        class="btn btn-sm btn-outline-purple"
        @click="showAddDialog()"
        :title="
          props.categoryType === 'references'
            ? '添加根参考文献分类'
            : '添加根论文分类'
        "
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
      <template v-else>
        <!-- 全部条目选项 -->
        <div
          class="tree-node tree-node-all"
          :class="{ 'tree-node-active': props.selectedCategoryId === null }"
          @click="selectCategory(null)"
        >
          <div class="tree-node-content">
            <span class="tree-node-icon">
              {{
                props.categoryType === "references"
                  ? "🔗"
                  : props.paperType === "published"
                  ? "🎓"
                  : props.paperType === "literature"
                  ? "📚"
                  : "📄"
              }}
            </span>
            <span class="tree-node-label">
              {{
                props.categoryType === "references"
                  ? "全部参考文献"
                  : props.paperType === "published"
                  ? "全部发表论文"
                  : props.paperType === "literature"
                  ? "全部文献"
                  : "全部论文"
              }}
            </span>
            <span class="tree-node-count">{{ totalPapers }}</span>
          </div>
        </div>
        <!-- 分类列表 -->
        <div class="tree-list">
          <CategoryNode
            v-for="category in categoryTree"
            :key="category.id"
            :category="category"
            :selected-id="props.selectedCategoryId"
            :level="0"
            @select="selectCategory"
            @add-child="handleAddChild"
            @edit="showEditDialog"
            @delete="handleDeleteCategory"
          />
        </div>
      </template>
    </div>

    <!-- 添加/编辑分类对话框 -->
    <Teleport to="body">
      <div
        v-if="showDialog"
        class="dialog-overlay"
        @click="closeCategoryDialog"
      >
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h4>
              {{
                isEditing
                  ? `编辑${
                      props.categoryType === "references" ? "参考文献" : "论文"
                    }分类`
                  : parentCategoryId
                  ? `添加${
                      props.categoryType === "references" ? "参考文献" : "论文"
                    }子分类`
                  : `添加${
                      props.categoryType === "references" ? "参考文献" : "论文"
                    }分类`
              }}
            </h4>
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
            <button class="btn btn-secondary" @click="closeCategoryDialog">
              取消
            </button>
            <button
              class="btn btn-primary"
              @click="saveCategory"
              :disabled="!canSubmitForm"
            >
              {{ isEditing ? "保存" : "添加" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- 确认对话框 -->
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
import { ref, onMounted, computed, watch } from "vue";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory as deleteCategoryAPI,
  getReferenceCategories,
  createReferenceCategory,
  updateReferenceCategory,
  deleteReferenceCategory as deleteReferenceCategoryAPI,
} from "../../../services/api";
import { useToast } from "../../../composables/useToast";
import { useConfirmDialog } from "../../../composables/useConfirmDialog";
import { useCategories } from "../../../composables/useCategories";
import { useCategoryEvents } from "../../../composables/useCategoryEvents";
import { handleCategoryError } from "../../../utils/errorHandlers";
import { LoadingSpinner, ConfirmDialog } from "../../base";
import { CategoryNode } from ".";

const props = defineProps({
  selectedCategoryId: {
    type: [Number, String],
    default: null,
  },
  paperType: {
    type: String,
    default: null, // 'literature', 'published' 或 null (显示所有类型)
  },
  categoryType: {
    type: String,
    default: "papers", // 'papers' 或 'references'
  },
  teamId: {
    type: [Number, String],
    default: null, // 对于参考文献分类必需
  },
});

const emit = defineEmits(["select"]);

const { showToast } = useToast();
const { refreshCategories } = useCategories(); // 添加全局分类刷新功能
const { triggerCategoryUpdate } = useCategoryEvents(); // 添加事件总线
const {
  dialogState,
  confirmDialog,
  cancelDialog,
  closeDialog: closeConfirmDialog,
  confirmDelete,
  setLoading,
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
  name: "",
  description: "",
});

// 计算属性：检查表单是否可提交
const canSubmitForm = computed(() => {
  return (
    categoryForm.value &&
    categoryForm.value.name &&
    categoryForm.value.name.trim().length > 0
  );
});

// 选择分类
const selectCategory = (categoryId) => {
  emit("select", categoryId);
};

// 将扁平化分类列表转换为树形结构
const buildCategoryTree = (categories) => {
  const categoryMap = new Map();
  const rootCategories = [];

  // 创建所有分类的映射
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // 构建树形结构
  categories.forEach((category) => {
    const categoryNode = categoryMap.get(category.id);
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(categoryNode);
      } else {
        // 如果父分类不存在，则作为根分类
        rootCategories.push(categoryNode);
      }
    } else {
      // 根分类
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
};

// 加载分类数据和论文统计
const loadCategories = async () => {
  loading.value = true;
  error.value = null;

  try {
    let categories;
    if (props.categoryType === "references") {
      // 参考文献分类需要传递团队ID
      if (!props.teamId) {
        categoryTree.value = [];
        totalPapers.value = 0;
        return;
      }
      // 使用服务端统计
      categories = await getReferenceCategories(props.teamId, {
        include_stats: true,
      });
    } else {
      // 使用服务端统计，传递论文类型用于筛选
      categories = await getCategories({
        include_stats: true,
        paper_type: props.paperType,
      });
    } // 将扁平化列表转换为树形结构
    categoryTree.value = buildCategoryTree(categories || []);

    // 设置服务端统计数据
    setServerStats(categoryTree.value); // 计算总数量（从服务端统计数据中获取）
    totalPapers.value = calculateTotalFromStats(categories || []);
  } catch (err) {
    console.error("加载分类失败:", err);
    error.value = handleCategoryError(err, "load", props.categoryType);
  } finally {
    loading.value = false;
  }
};

// 从服务端统计数据计算总数量
const calculateTotalFromStats = (categories) => {
  if (!categories || categories.length === 0) return 0;

  // 根分类的计数已经包含了其子分类的数量，只累加根级分类的计数
  const rootCategories = categories.filter((category) => !category.parent_id);
  const rootTotal = rootCategories.reduce((total, category) => {
    const count = category.paper_count || category.reference_count || 0;
    return total + count;
  }, 0);

  return rootTotal;
};

// 递归设置分类统计数据（完全依赖服务端）
const setServerStats = (categories) => {
  categories.forEach((category) => {
    // 直接使用服务端返回的统计数据
    // 论文分类使用 paper_count，参考文献分类使用 reference_count
    if (typeof category.paper_count !== "undefined") {
      // 保持原有值
    } else if (typeof category.reference_count !== "undefined") {
      // 将 reference_count 映射到 paper_count 用于显示
      category.paper_count = category.reference_count;
    } else {
      // 如果服务端没有返回统计数据，记录错误但不降级
      console.warn(`分类 ${category.name} 缺少统计数据`);
      category.paper_count = 0;
    }

    // 递归处理子分类
    if (category.children && category.children.length > 0) {
      setServerStats(category.children);
    }
  });
};

// 监听 paperType 变化，重新加载统计
watch(
  () => props.paperType,
  () => {
    // 重新加载分类以获取正确的统计数据
    loadCategories();
  }
);

// 监听 teamId 和 categoryType 变化，重新加载分类
watch(
  () => [props.teamId, props.categoryType],
  () => {
    loadCategories();
  }
);

// 显示添加分类对话框
const showAddDialog = () => {
  isEditing.value = false;
  parentCategoryId.value = null;
  editingCategoryId.value = null;
  categoryForm.value = { name: "", description: "" };
  showDialog.value = true;
};

// 显示添加子分类对话框
const showAddChildDialog = (parentCategory) => {
  if (!parentCategory || !parentCategory.id) {
    console.error("Invalid parent category:", parentCategory);
    showToast("无效的父分类", "error");
    return;
  }

  isEditing.value = false;
  parentCategoryId.value = parentCategory.id;
  categoryForm.value = { name: "", description: "" };
  showDialog.value = true;
};

// 处理从 CategoryNode 传来的添加子分类事件
const handleAddChild = (categoryId) => {
  // 从 categoryTree 中找到对应的 category 对象
  const findCategory = (categories, id) => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const parentCategory = findCategory(categoryTree.value, categoryId);
  if (parentCategory) {
    showAddChildDialog(parentCategory);
  } else {
    console.error("Parent category not found:", categoryId);
    showToast("无法找到父分类，请刷新页面重试", "error");
  }
};

// 显示编辑分类对话框
const showEditDialog = (category) => {
  isEditing.value = true;
  parentCategoryId.value = null;
  editingCategoryId.value = category.id;
  categoryForm.value = {
    name: category.name,
    description: category.description || "",
  };
  showDialog.value = true;
};

// 关闭分类对话框
const closeCategoryDialog = () => {
  showDialog.value = false;
  isEditing.value = false;
  editingCategoryId.value = null;
  parentCategoryId.value = null;
  categoryForm.value = { name: "", description: "" };
};

// 保存分类
const saveCategory = async () => {
  if (
    !categoryForm.value ||
    !categoryForm.value.name ||
    !categoryForm.value.name.trim()
  ) {
    showToast("请输入分类名称", "error");
    return;
  }

  try {
    if (isEditing.value) {
      // 更新分类
      if (!editingCategoryId.value) {
        showToast("编辑分类ID缺失", "error");
        return;
      }

      if (props.categoryType === "references") {
        await updateReferenceCategory(
          editingCategoryId.value,
          categoryForm.value
        );
      } else {
        await updateCategory(editingCategoryId.value, categoryForm.value);
      }
    } else {
      // 创建分类
      const data = {
        ...categoryForm.value,
        parent_id: parentCategoryId.value,
      };

      if (props.categoryType === "references") {
        // 参考文献分类需要传递 teamId
        if (!props.teamId) {
          showToast("团队ID缺失，无法创建参考文献分类", "error");
          return;
        }
        data.team_id = props.teamId;
        await createReferenceCategory(data);
      } else {
        await createCategory(data);
      }
    }
    await loadCategories();

    // 通知全局分类数据已更新
    await refreshCategories(props.categoryType, props.teamId);

    // 触发全局分类更新事件
    triggerCategoryUpdate();

    closeCategoryDialog();
    showToast(isEditing.value ? "分类更新成功" : "分类创建成功", "success");
  } catch (error) {
    console.error("保存分类失败:", error);
    const errorMessage = handleCategoryError(
      error,
      isEditing.value ? "update" : "create",
      props.categoryType
    );
    if (errorMessage) {
      showToast(errorMessage, "error");
    }
  }
};

// 处理从 CategoryNode 传来的删除分类事件
const handleDeleteCategory = (categoryId) => {
  // 从 categoryTree 中找到对应的 category 对象
  const findCategory = (categories, id) => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const category = findCategory(categoryTree.value, categoryId);
  if (category) {
    deleteCategory(category);
  }
};

// 删除分类
const deleteCategory = async (category) => {
  try {
    await confirmDelete("这个分类");

    setLoading(true);

    // 根据分类类型使用不同的删除API
    if (props.categoryType === "references") {
      await deleteReferenceCategoryAPI(category.id);
    } else {
      await deleteCategoryAPI(category.id);
    }
    await loadCategories();

    // 通知全局分类数据已更新
    await refreshCategories(props.categoryType, props.teamId);

    // 触发全局分类更新事件
    triggerCategoryUpdate();

    // 如果删除的是当前选中的分类，重置选择
    if (props.selectedCategoryId === category.id) {
      selectCategory(null);
    }
    showToast("分类删除成功", "success");
    closeConfirmDialog(); // 关闭确认对话框
  } catch (error) {
    if (error !== false) {
      // 用户没有取消操作
      console.error("删除分类失败:", error);
      const errorMessage = handleCategoryError(
        error,
        "delete",
        props.categoryType
      );
      if (errorMessage) {
        showToast(errorMessage, "error");
      }
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
  categoryTree,
});
</script>

<style scoped>
.category-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 6px rgba(125, 108, 192, 0.04);
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--primary-100);
  background: linear-gradient(to right, var(--primary-50), var(--white));
}

.tree-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-heading);
}

.tree-icon {
  font-size: var(--text-lg);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm) 0;
}

.tree-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  gap: var(--space-sm);
}

.tree-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  gap: var(--space-md);
}

.tree-error .error-icon {
  font-size: var(--text-3xl);
  opacity: 0.6;
}

.tree-error p {
  color: var(--error-600);
  font-size: var(--text-sm);
  margin: 0;
}

.tree-node {
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.tree-node:hover {
  background: var(--primary-50);
}

.tree-node-active {
  background: var(--primary-50);
  border-right: 3px solid var(--primary-600);
}

.tree-node-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--primary-400);
  opacity: 0.5;
}

.tree-node-all {
  margin: 0 var(--space-sm) var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
  background: linear-gradient(to right, var(--primary-50), var(--white));
  box-shadow: var(--shadow-sm);
}

.tree-node-all .tree-node-content {
  padding: var(--space-sm);
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  position: relative;
}

.tree-node-icon {
  font-size: var(--text-base);
  width: var(--space-lg);
  text-align: center;
}

.tree-node-label {
  flex: 1;
  font-weight: 500;
  color: var(--color-heading);
}

.tree-node-count {
  font-size: var(--text-xs);
  background: var(--white);
  color: var(--primary-600);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 50px;
  font-weight: 500;
  border: 1px solid var(--primary-200);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.tree-node:hover .tree-node-count {
  background: var(--white);
  color: var(--primary-700);
  border-color: var(--primary-300);
  box-shadow: var(--shadow-hover);
}

.tree-node-active .tree-node-count {
  background: var(--white);
  color: var(--primary-700);
  border-color: var(--primary-300);
  box-shadow: var(--shadow-hover);
}

.tree-node-actions {
  display: none;
  gap: var(--space-xs);
  margin-left: var(--space-sm);
}

.tree-node:hover .tree-node-actions {
  display: flex;
}

.tree-action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.tree-action-btn:hover {
  opacity: 1;
  background: var(--primary-100);
  transform: scale(1.1);
}

.tree-action-btn-add:hover {
  background: var(--success-100);
  color: var(--success-600);
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
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
</style>
