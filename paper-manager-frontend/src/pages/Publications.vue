<template>
  <div class="publications-page">
    <div class="container">
      <PaperManager
        :config="paperManagerConfig"
        @add-new="showAddForm = true"
        @edit="handleEdit"
        @view="handleView"
      />      <!-- 添加/编辑表单模态框 -->
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import PaperManager from "../components/PaperManager.vue";
import PaperForm from "../components/PaperForm.vue";
import PaperDetail from "../components/PaperDetail.vue";
import Modal from "../components/Modal.vue";
import { useToast } from "../composables/useToast";
import { useCategories } from "../composables/useCategories";

const { showToast } = useToast();
const { loadCategories } = useCategories();

// 响应式数据
const showAddForm = ref(false);
const editingPaper = ref(null);
const viewingPaper = ref(null);
const formProgress = ref(0);

// 论文管理器配置
const paperManagerConfig = {
  title: '发表论文管理',
  icon: '📄',
  description: '管理您已发表的学术论文',
  paperType: 'published',
  type: 'papers',
  requireTeam: false,
  searchPlaceholder: '论文标题、作者、关键词',
  addButtonText: '添加论文',
  emptyIcon: '📄',
  emptyTitle: '暂无发表论文',
  emptyDescription: '开始添加您的第一篇发表论文吧'
};

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
  loadCategories();
});
</script>

<style scoped>
.publications-page {
  min-height: calc(100vh - 120px);
  background: var(--color-bg-soft);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>
