import { ref, computed } from "vue";
import { useToast } from "./useToast";
import { useAuth } from "./useAuth";
import {
  getJournals,
  createJournal as createJournalAPI,
  updateJournal as updateJournalAPI,
  deleteJournal as deleteJournalAPI,
  getJournal,
  searchJournals as searchJournalsAPI,
  getJournalGrades,
} from "../services/api";

const journals = ref([]);
const loading = ref(false);
const totalJournals = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

export function useJournals() {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const isAdmin = computed(() => {
    return currentUser.value?.is_superuser === true;
  });// 获取期刊列表
  const fetchJournals = async (params = {}) => {
    loading.value = true;
    try {
      // 处理分页参数
      const searchParams = {
        skip: ((params.page || currentPage.value) - 1) * pageSize.value,
        limit: params.limit || pageSize.value,
        name: params.name,
        grade: params.grade,
      };

      const response = await getJournals(searchParams);
      journals.value = response.items || [];
      totalJournals.value = response.total || 0;
      currentPage.value = response.page || params.page || 1;
      return response;
    } catch (error) {
      console.error("获取期刊列表失败:", error);
      showToast("获取期刊列表失败", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };
  // 搜索期刊
  const searchJournals = async (query, limit = 10) => {
    try {
      const response = await searchJournalsAPI(query, limit);
      return response;
    } catch (error) {
      console.error("搜索期刊失败:", error);
      showToast("搜索期刊失败", "error");
      throw error;
    }
  };

  // 获取单个期刊
  const fetchJournal = async (journalId) => {
    loading.value = true;
    try {
      const response = await getJournal(journalId);
      return response;
    } catch (error) {
      console.error("获取期刊详情失败:", error);
      showToast("获取期刊详情失败", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };
  // 创建期刊（仅管理员）
  const createJournal = async (journalData) => {
    if (!isAdmin.value) {
      throw new Error("权限不足");
    }

    loading.value = true;
    try {
      const response = await createJournalAPI(journalData);
      showToast("期刊创建成功", "success");
      // 重新加载期刊列表
      await fetchJournals();
      return response;
    } catch (error) {
      console.error("创建期刊失败:", error);
      showToast("创建期刊失败", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 更新期刊（仅管理员）
  const updateJournal = async (journalId, journalData) => {
    if (!isAdmin.value) {
      throw new Error("权限不足");
    }

    loading.value = true;
    try {
      const response = await updateJournalAPI(journalId, journalData);
      showToast("期刊更新成功", "success");
      // 重新加载期刊列表
      await fetchJournals();
      return response;
    } catch (error) {
      console.error("更新期刊失败:", error);
      showToast("更新期刊失败", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 删除期刊（仅管理员）
  const deleteJournal = async (journalId) => {
    if (!isAdmin.value) {
      throw new Error("权限不足");
    }

    loading.value = true;
    try {
      await deleteJournalAPI(journalId);
      showToast("期刊删除成功", "success");
      // 重新加载期刊列表
      await fetchJournals();
    } catch (error) {
      console.error("删除期刊失败:", error);

      let errorMessage = "删除期刊失败";

      // 根据错误状态码和响应内容提供更具体的错误信息
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          // 400 错误通常表示期刊已被使用，无法删除
          if (data?.detail?.includes?.("referenced") || data?.detail?.includes?.("使用") ||
              data?.message?.includes?.("referenced") || data?.message?.includes?.("使用")) {
            errorMessage = "无法删除期刊：该期刊已被论文引用，请先移除相关论文的期刊关联";
          } else if (data?.detail || data?.message) {
            errorMessage = `删除期刊失败：${data.detail || data.message}`;
          } else {
            errorMessage = "删除期刊失败：该期刊可能已被使用，无法删除";
          }
        } else if (status === 403) {
          errorMessage = "删除期刊失败：权限不足";
        } else if (status === 404) {
          errorMessage = "删除期刊失败：期刊不存在";
        } else if (status >= 500) {
          errorMessage = "删除期刊失败：服务器内部错误，请稍后重试";
        }
      } else if (error.message) {
        errorMessage = `删除期刊失败：${error.message}`;
      }

      showToast(errorMessage, "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 获取期刊等级列表
  const fetchJournalGrades = async () => {
    try {
      const response = await getJournalGrades();
      return response;
    } catch (error) {
      console.error("获取期刊等级失败:", error);
      showToast("获取期刊等级失败", "error");
      throw error;
    }
  };

  // 分页信息
  const paginationInfo = computed(() => ({
    total: totalJournals.value,
    current: currentPage.value,
    pageSize: pageSize.value,
    totalPages: Math.ceil(totalJournals.value / pageSize.value),
  }));

  return {
    // 数据
    journals,
    loading,
    totalJournals,
    currentPage,
    pageSize,
    isAdmin,
    paginationInfo, // 方法
    fetchJournals,
    searchJournals,
    fetchJournal,
    createJournal,
    updateJournal,
    deleteJournal,
    fetchJournalGrades,
  };
}
