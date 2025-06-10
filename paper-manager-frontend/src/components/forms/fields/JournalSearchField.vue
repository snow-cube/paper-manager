<template>
  <FormField
    :id="id"
    type="search-select"
    :label="label"
    :placeholder="placeholder"
    :required="required"
    :error="error"    :model-value="selectedJournal"
    :search-results="searchResults"
    :search-loading="searchLoading"
    :allow-create="isAdmin"
    :create-text="createText"
    :no-results-text="noResultsText"
    :loading-text="loadingText"
    :selected-item-icon="selectedItemIcon"
    item-label-key="name"
    item-value-key="id"
    item-meta-key="gradeLabel"
    @search="handleSearch"
    @change="handleChange"
    @blur="handleBlur"
    @create-new="handleCreateNew"
    @update:model-value="handleUpdateValue"
  >
    <!-- 自定义搜索结果项 -->
    <template #search-item="{ item }">
      <div class="journal-search-item">
        <div class="journal-header">
          <div class="journal-name">{{ item.name }}</div>
          <div v-if="item.grade" class="journal-grade">
            {{ getGradeLabel(item.grade) }}
          </div>
        </div>
        <div v-if="item.description" class="journal-description">
          {{ item.description }}
        </div>
      </div>
    </template>
    <!-- 自定义选中项显示 -->
    <template #selected-item="{ item }">
      <div class="selected-journal-content">
        <span class="journal-icon">📖</span>
        <div class="journal-details">
          <div class="journal-header">
            <div class="journal-name">{{ item.name }}</div>
            <div v-if="item.grade" class="journal-grade">
              {{ getGradeLabel(item.grade) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </FormField>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import FormField from "./FormField.vue";
import { useJournals } from "../../../composables/useJournals";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  label: {
    type: String,
    default: "期刊",
  },
  placeholder: {
    type: String,
    default: "搜索期刊名称...",
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "change", "blur"]);

const { searchJournals, isAdmin, createJournal, fetchJournal } = useJournals();

// 组件状态
const searchQuery = ref("");
const searchResults = ref([]);
const searchLoading = ref(false);
const selectedJournal = ref(null);

// 期刊等级标签映射
const gradeLabels = {
  SCI: "SCI",
  SCI_Q1: "SCI Q1",
  SCI_Q2: "SCI Q2",
  SCI_Q3: "SCI Q3",
  SCI_Q4: "SCI Q4",
  EI: "EI",
  CORE: "CORE",
  CSSCI: "CSSCI",
  OTHER: "其他",
};

const getGradeLabel = (grade) => {
  return gradeLabels[grade] || grade;
};

// 计算属性
const createText = computed(() => {
  return `创建新期刊 "${searchQuery.value}"`;
});

const noResultsText = "未找到匹配的期刊";
const loadingText = "搜索期刊中...";
const selectedItemIcon = "📖";

// 处理搜索
const handleSearch = async (query) => {
  searchQuery.value = query;

  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    searchLoading.value = true;
    console.log("搜索期刊:", query.trim()); // 调试信息
    const results = await searchJournals(query.trim());
    console.log("搜索结果:", results); // 调试信息

    // 检查结果的数据结构
    let journalsArray = results;
    if (results && typeof results === "object") {
      // 如果返回的是分页格式
      journalsArray = results.items || results.data || results;
    }

    // 确保是数组
    if (!Array.isArray(journalsArray)) {
      console.warn("期刊搜索结果不是数组:", journalsArray);
      journalsArray = [];
    }

    // 为每个结果添加 gradeLabel 属性
    searchResults.value = journalsArray.map((journal) => ({
      ...journal,
      gradeLabel: journal.grade ? getGradeLabel(journal.grade) : "",
    }));

    console.log("处理后的搜索结果:", searchResults.value); // 调试信息
  } catch (error) {
    console.error("搜索期刊失败:", error);
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

// 处理选择变化
const handleChange = (journal) => {
  console.log("JournalSearchField handleChange:", journal); // 调试信息
  selectedJournal.value = journal;
  emit("change", journal);
};

// 处理失焦
const handleBlur = () => {
  emit("blur");
};

// 处理值更新
const handleUpdateValue = (value) => {
  console.log("JournalSearchField handleUpdateValue:", value); // 调试信息

  if (value && typeof value === "object") {
    selectedJournal.value = value;
    emit("update:modelValue", value.id);
  } else if (typeof value === "number") {
    // 如果是ID，查找对应的期刊对象
    const journal = searchResults.value.find(j => j.id === value);
    if (journal) {
      selectedJournal.value = journal;
    }
    emit("update:modelValue", value);
  } else {
    selectedJournal.value = null;
    emit("update:modelValue", null);
  }
};

// 创建新期刊
const handleCreateNew = async (journalName) => {
  try {
    const newJournal = await createJournal({
      name: journalName.trim(),
      grade: "OTHER",
    });

    // 添加 gradeLabel 并选择新创建的期刊
    const journalWithLabel = {
      ...newJournal,
      gradeLabel: getGradeLabel(newJournal.grade),
    };

    searchResults.value = [journalWithLabel, ...searchResults.value];
    selectedJournal.value = journalWithLabel;
    emit("update:modelValue", newJournal.id);
    emit("change", journalWithLabel);
  } catch (error) {
    console.error("创建期刊失败:", error);
  }
};

// 监听 modelValue 变化，处理初始化或外部值变化
watch(
  () => props.modelValue,
  async (newValue) => {
    console.log("JournalSearchField modelValue changed:", newValue); // 调试信息

    if (newValue && typeof newValue === "number") {
      // 如果传入的是 ID，需要获取期刊详情
      try {
        console.log("Fetching journal by ID:", newValue); // 调试信息
        const journal = await fetchJournal(newValue);
        console.log("Fetched journal:", journal); // 调试信息

        const journalWithLabel = {
          ...journal,
          gradeLabel: journal.grade ? getGradeLabel(journal.grade) : "",
        };

        // 设置选中的期刊
        selectedJournal.value = journalWithLabel;

        // 确保在 searchResults 中
        if (!searchResults.value.find((j) => j.id === journal.id)) {
          searchResults.value.unshift(journalWithLabel);
        }
      } catch (error) {
        console.error("获取期刊详情失败:", error);
        selectedJournal.value = null;
      }
    } else if (newValue && typeof newValue === "object") {
      // 如果传入的是期刊对象
      console.log("Received journal object:", newValue); // 调试信息

      const journalWithLabel = {
        ...newValue,
        gradeLabel: newValue.grade ? getGradeLabel(newValue.grade) : "",
      };

      selectedJournal.value = journalWithLabel;

      // 确保在 searchResults 中
      if (!searchResults.value.find((j) => j.id === newValue.id)) {
        searchResults.value.unshift(journalWithLabel);
      }
    } else if (!newValue) {
      // 清空选择
      console.log("Clearing journal selection"); // 调试信息
      selectedJournal.value = null;
      searchResults.value = [];
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.journal-search-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.journal-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.journal-name {
  font-weight: 600;
  color: var(--gray-900);
  flex: 1;
}

.journal-grade {
  font-size: var(--text-xs);
  color: var(--primary-600);
  font-weight: 500;
  background: var(--primary-50);
  padding: 2px 6px;
  border-radius: var(--border-radius);
  flex-shrink: 0;
}

.journal-description {
  font-size: var(--text-xs);
  color: var(--gray-600);
  line-height: 1.4;
}

.selected-journal-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.journal-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.journal-details {
  flex: 1;
}

.journal-details .journal-name {
  font-weight: 600;
  color: var(--primary-700);
}

.journal-details .journal-grade {
  background: var(--primary-100);
  color: var(--primary-600);
}
</style>
