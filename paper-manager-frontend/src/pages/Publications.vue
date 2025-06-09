<template>
  <StandardPageLayout
    title="发表论文管理"
    icon="📄"
    :description="pageDescription"
  >
    <!-- 模式切换控制器 -->
    <template #controls>
      <ModeSwitch
        v-model="viewMode"
        :options="viewModeOptions"
        class="team-mode-switch"
      />
    </template>

    <!-- 论文管理器 -->
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
        :paperType="'published'"
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
  </StandardPageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import StandardPageLayout from "../components/StandardPageLayout.vue";
import PaperManager from "../components/PaperManager.vue";
import PaperForm from "../components/PaperForm.vue";
import PaperDetail from "../components/PaperDetail.vue";
import Modal from "../components/Modal.vue";
import ModeSwitch from "../components/forms/ModeSwitch.vue";
import { useToast } from "../composables/useToast";
import { useCategories } from "../composables/useCategories";
import { useTeam } from "../composables/useTeam";

const { showToast } = useToast();
const { loadCategories } = useCategories();
const { currentTeam } = useTeam();

// 响应式数据
const showAddForm = ref(false);
const editingPaper = ref(null);
const viewingPaper = ref(null);
const formProgress = ref(0);
const viewMode = ref("all"); // "team" 或 "all"

// 模式切换选项
const viewModeOptions = [
  { value: "all", label: "所有论文" },
  { value: "team", label: "本团队论文" },
];

// 页面描述
const pageDescription = computed(() => {
  return viewMode.value === "team" && currentTeam.value
    ? `管理 "${currentTeam.value.name}" 团队的发表论文`
    : "管理所有发表论文";
});

// 论文管理器配置
const paperManagerConfig = computed(() => ({
  title: "发表论文管理",
  icon: "📄",
  description: pageDescription.value,
  paperType: "published",
  categoryType: "papers",
  type: "papers",
  requireTeam: viewMode.value === "team",
  teamRequiredText: "发表论文",
  searchPlaceholder: "论文标题、作者、关键词",
  addButtonText: "添加论文",
  emptyIcon: "📄",
  emptyTitle: "暂无发表论文",
  emptyDescription: "开始添加您的第一篇发表论文吧",
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
const handlePaperSaved = () => {
  closeForm();
  showToast(editingPaper.value ? "论文更新成功" : "论文添加成功", "success");
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

// 生命周期
onMounted(() => {
  // 加载发表论文分类（公共分类）
  loadCategories("papers");
});
</script>

<style scoped>
.team-mode-switch {
  transform: scale(1.1);
}
</style>
