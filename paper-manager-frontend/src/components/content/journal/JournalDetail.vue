<template>
  <div class="journal-detail">
    <!-- 期刊头部信息 -->
    <div class="journal-header">
      <div class="journal-title">
        <h2 class="journal-name">{{ journal.name }}</h2>
        <div
          class="journal-grade"
          :class="`grade-${journal.grade.toLowerCase()}`"
        >
          {{ getGradeLabel(journal.grade) }}
        </div>
      </div>
    </div>

    <!-- 期刊描述 -->
    <div v-if="journal.description" class="journal-description">
      <h3 class="section-title">
        <span class="section-icon">📄</span>
        期刊描述
      </h3>
      <p class="description-text">{{ journal.description }}</p>
    </div>

    <!-- 期刊信息 -->
    <div class="journal-info">
      <h3 class="section-title">
        <span class="section-icon">ℹ️</span>
        基本信息
      </h3>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">期刊ID</div>
          <div class="info-value">{{ journal.id }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">期刊等级</div>
          <div class="info-value">
            <span
              class="journal-grade"
              :class="`grade-${journal.grade.toLowerCase()}`"
            >
              {{ getGradeLabel(journal.grade) }}
            </span>
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">创建时间</div>
          <div class="info-value">{{ formatDateTime(journal.created_at) }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">更新时间</div>
          <div class="info-value">{{ formatDateTime(journal.updated_at) }}</div>
        </div>
      </div>    </div>

    <!-- 操作按钮 -->
    <div v-if="isAdmin" class="journal-actions">
      <button @click="editJournal" class="btn btn-secondary">
        <span class="btn-icon">✏️</span>
        编辑期刊
      </button>

      <button @click="deleteJournal" class="btn btn-danger">
        <span class="btn-icon">🗑️</span>
        删除期刊
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useJournals } from "../../../composables/useJournals";
import { useConfirmDialog } from "../../../composables/useConfirmDialog";
import { useToast } from "../../../composables/useToast";

const props = defineProps({
  journal: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["edit", "delete"]);

const { isAdmin, deleteJournal: deleteJournalApi } = useJournals();
const { confirm } = useConfirmDialog();
const { showToast } = useToast();

// 期刊等级标签映射
const gradeLabels = {
  SCI: "SCI",
  EI: "EI",
  CORE: "CORE",
  CSSCI: "CSSCI",
  OTHER: "其他",
};

const getGradeLabel = (grade) => {
  return gradeLabels[grade] || grade;
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 编辑期刊
const editJournal = () => {
  emit("edit", props.journal);
};

// 删除期刊
const deleteJournal = async () => {
  const confirmed = await confirm(
    "确认删除期刊",
    `确定要删除期刊"${props.journal.name}"吗？此操作无法撤销。`,
    "danger"
  );

  if (confirmed) {
    try {
      await deleteJournalApi(props.journal.id);
      emit("delete", props.journal);
      showToast("期刊删除成功", "success");
    } catch (error) {
      showToast("删除期刊失败", "error");
    }  }
};
</script>

<style scoped>
.journal-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
  max-width: 100%;
}

.journal-header {
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--space-lg);
}

.journal-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.journal-name {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  flex: 1;
}

.journal-grade {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.grade-sci {
  background: var(--red-100);
  color: var(--red-700);
  border: 1px solid var(--red-200);
}

.grade-ei {
  background: var(--blue-100);
  color: var(--blue-700);
  border: 1px solid var(--blue-200);
}

.grade-core {
  background: var(--green-100);
  color: var(--green-700);
  border: 1px solid var(--green-200);
}

.grade-cssci {
  background: var(--purple-100);
  color: var(--purple-700);
  border: 1px solid var(--purple-200);
}

.grade-other {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
}

.journal-description {
  background: var(--color-background-soft);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-700);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  font-size: var(--text-xl);
}

.description-text {
  color: var(--gray-700);
  line-height: 1.6;
  margin: 0;
}

.journal-info {
  background: var(--white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.info-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--gray-900);
}

.journal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border-light);
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius-lg);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border: 2px solid transparent;
}

.btn-secondary {
  background: linear-gradient(135deg, var(--white), #f8fafc);
  border-color: var(--gray-300);
  color: var(--gray-700);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-400);
  background: linear-gradient(135deg, #f8fafc, var(--primary-50));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary:hover::before {
  opacity: 1;
}

.btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: transparent;
  color: var(--white);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-danger::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.btn-danger:hover::before {
  opacity: 1;
}

.btn-danger:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-icon {
  font-size: var(--text-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .journal-detail {
    padding: var(--space-lg);
  }

  .journal-name {
    font-size: var(--text-xl);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .journal-actions {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .journal-detail {
    padding: var(--space-md);
  }

  .journal-title {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .journal-name {
    font-size: var(--text-lg);
    text-align: center;
  }
}
</style>
