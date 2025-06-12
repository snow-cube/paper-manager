<template>
  <StandardPageLayout title="文献管理" icon="📚" :description="pageDescription">
    <!-- 无团队警告 -->
    <template #warning v-if="!currentTeam">
      <StandardWarning
        icon="⚠️"
        title="请先选择团队"
        message="您需要先选择一个团队才能管理参考文献。团队中的所有参考文献将对团队成员共享。"
      >
        <template #actions>
          <RouterLink to="/teams" class="btn btn-primary">
            转到团队管理
          </RouterLink>
        </template>
      </StandardWarning>
    </template>

    <!-- 论文管理器 -->
    <PaperManager
      v-if="currentTeam"
      :config="paperManagerConfig"
      @add-new="showAddForm = true"
      @edit="handleEdit"
      @view="handleView"
    />

    <!-- 添加/编辑表单模态框 -->
    <Modal
      v-if="showAddForm || editingPaper"
      @close="closeForm"
      :show-progress="true"
      :progress="formProgress"
    >
      <PaperForm
        :paper="editingPaper"
        :paperType="'literature'"
        @saved="handlePaperSaved"
        @cancel="closeForm"
        @progress-update="handleProgressUpdate"
      />
    </Modal>    <!-- 论文详情模态框 -->
    <Modal v-if="viewingPaper" @close="closeViewPaper">
      <PaperDetail
        :paper="viewingPaper"
        :loadDetails="true"
        @edit="handleEditPaper"
        @close="closeViewPaper"
      />
    </Modal>
  </StandardPageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  StandardPageLayout,
  StandardWarning,
  PaperManager,
  PaperForm,
  PaperDetail,
  Modal,
} from "@/components";
import { useToast } from "../composables/useToast";
import { useTeam } from "../composables/useTeam";
import { useCategories } from "../composables/useCategories";

const { showToast } = useToast();
const { currentTeam } = useTeam();
const { loadCategories } = useCategories();

// 响应式数据
const showAddForm = ref(false);
const editingPaper = ref(null);
const viewingPaper = ref(null);
const formProgress = ref(0);

// 页面描述
const pageDescription = computed(() => {
  return currentTeam.value
    ? `管理 "${currentTeam.value.name}" 团队的学术文献`
    : "请先选择一个团队";
});

// 论文管理器配置
const paperManagerConfig = computed(() => ({
  title: "文献管理",
  icon: "📚",
  description: pageDescription.value,
  paperType: "literature",
  categoryType: "references",
  type: "literature",
  requireTeam: true,
  teamRequiredText: "参考文献",
  searchPlaceholder: "文献标题、作者、关键词",
  addButtonText: "添加文献",
  emptyIcon: "📚",
  emptyTitle: "暂无参考文献",
  emptyDescription: "开始添加您团队的第一篇参考文献吧",
}));

// 处理编辑
const handleEdit = (paper) => {
  editingPaper.value = paper;
  showAddForm.value = true;
};

// 处理查看
const handleView = (paper) => {
  viewingPaper.value = paper;
};

// 关闭论文详情
const closeViewPaper = () => {
  viewingPaper.value = null;
};

// 编辑论文
const handleEditPaper = (paper) => {
  closeViewPaper();
  editingPaper.value = paper;
  showAddForm.value = true;
};

// 处理论文保存
const handlePaperSaved = (savedPaper) => {
  // 为保存的论文添加当前团队ID
  if (currentTeam.value) {
    savedPaper.team_id = currentTeam.value.id;
  }

  closeForm();
  showToast(editingPaper.value ? "文献更新成功" : "文献添加成功", "success");
};

// 关闭表单
const closeForm = () => {
  showAddForm.value = false;
  editingPaper.value = null;
  formProgress.value = 0;
};

const handleProgressUpdate = (progress) => {
  formProgress.value = progress;
};

// 监听团队变化，重新加载参考文献分类
watch(
  () => currentTeam.value,
  (newTeam) => {
    if (newTeam) {
      loadCategories("references", newTeam.id);
    }
  }
);

// 生命周期
onMounted(() => {
  // 加载参考文献分类（团队特定）
  if (currentTeam.value) {
    loadCategories("references", currentTeam.value.id);
  }
});
</script>

<style scoped>
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
</style>
