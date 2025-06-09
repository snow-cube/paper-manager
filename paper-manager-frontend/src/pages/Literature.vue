<template>
  <div class="literature-page">
    <div class="container">
      <PaperManager
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
      </Modal>

      <!-- 论文详情模态框 -->
      <Modal v-if="viewingPaper" @close="closeViewPaper">
        <PaperDetail
          :paper="viewingPaper"
          @edit="handleEditPaper"
          @close="closeViewPaper"
        />
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import PaperManager from "../components/PaperManager.vue";
import PaperForm from "../components/PaperForm.vue";
import PaperDetail from "../components/PaperDetail.vue";
import Modal from "../components/Modal.vue";
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

// 论文管理器配置
const paperManagerConfig = computed(() => ({
  title: "文献管理",
  icon: "📚",
  description: currentTeam.value
    ? `管理 "${currentTeam.value.name}" 团队的学术文献`
    : "请先选择一个团队",
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
.literature-page {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>
