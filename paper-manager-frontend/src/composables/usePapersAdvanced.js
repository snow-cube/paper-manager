import { ref, computed, watch } from "vue";
import {
  getPapers,
  deletePaper,
  getReferences,
  deleteReference,
} from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useTeam } from "@/composables/useTeam";
import { usePaperEvents } from "@/composables/usePaperEvents";

const { showToast } = useToast();
const { triggerPaperUpdate } = usePaperEvents();

/**
 * 高级论文/文献管理组合式函数 - 支持高级搜索和筛选
 * @param {Object} options 配置选项
 * @param {string} options.type - 类型: 'papers' | 'literature'
 * @param {boolean|import('vue').Ref<boolean>} options.requireTeam - 是否需要团队
 * @param {Function} options.loadData - 自定义数据加载函数
 * @param {Function} options.deleteData - 自定义删除函数
 */
export function usePapersAdvanced(options = {}) {
  const {
    type = "papers",
    requireTeam = false,
    loadData,
    deleteData,
  } = options;
  const { currentTeam } = useTeam();

  // 确保 requireTeam 是响应式的
  const requireTeamRef = computed(() => {
    return typeof requireTeam === "object" && "value" in requireTeam
      ? requireTeam.value
      : requireTeam;
  });

  // 响应式数据
  const papers = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentPage = ref(1);
  const itemsPerPage = 9; // 服务端分页每页数量
  const totalItems = ref(0); // 服务端返回的总数量
  const totalPages = ref(0); // 计算得出的总页数

  // 搜索和筛选状态
  const searchParams = ref({});
  const searchStartTime = ref(null);
  const searchStats = ref(null);

  // 计算属性：当前页的论文列表
  const filteredPapers = computed(() => {
    // 如果需要团队但没有选择团队，返回空数组
    if (requireTeamRef.value && !currentTeam.value) return [];
    return papers.value;
  });

  // 构建查询参数
  const buildQueryParams = () => {
    const skip = (currentPage.value - 1) * itemsPerPage;
    const limit = itemsPerPage;

    const params = { skip, limit };

    // 添加搜索和筛选参数
    Object.entries(searchParams.value).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        params[key] = value.toString().trim();
      }
    });

    // 添加团队筛选
    if (requireTeamRef.value && currentTeam.value) {
      params.team_id = currentTeam.value.id;
    }

    return params;
  };

  // 加载数据
  const loadPapers = async () => {
    if (requireTeamRef.value && !currentTeam.value) {
      papers.value = [];
      totalItems.value = 0;
      totalPages.value = 0;
      return;
    }

    loading.value = true;
    error.value = null;
    searchStartTime.value = Date.now();

    try {
      let response;
      const params = buildQueryParams();

      if (loadData) {
        response = await loadData(params);
      } else if (type === "literature") {
        response = await getReferences(currentTeam.value.id, params);
      } else {
        response = await getPapers(params);
      }

      // 处理响应数据
      if (response && typeof response === "object") {
        // 检查是否有分页信息
        if ("items" in response || "data" in response) {
          // 标准分页响应格式
          papers.value = response.items || response.data || [];
          totalItems.value = response.total || response.total_count || 0;
          totalPages.value = Math.ceil(totalItems.value / itemsPerPage);
        } else if (Array.isArray(response)) {
          // 直接数组响应（向后兼容）
          papers.value = response;
          totalItems.value = response.length;
          totalPages.value = Math.ceil(totalItems.value / itemsPerPage);
        } else {
          // 未知响应格式
          papers.value = [];
          totalItems.value = 0;
          totalPages.value = 0;
        }
      } else {
        papers.value = response || [];
        totalItems.value = papers.value.length;
        totalPages.value = Math.ceil(totalItems.value / itemsPerPage);
      }

      // 为每个数据项添加明确的类型标识
      papers.value.forEach((item) => {
        if (type === "literature") {
          // 参考文献数据
          item._itemType = "reference";
          item.paper_type = "literature"; // 保持兼容性
        } else {
          // 论文数据
          item._itemType = "paper";
          if (!item.paper_type) {
            item.paper_type = "published";
          }
        }
      });

      // 更新搜索统计
      updateSearchStats();
    } catch (err) {
      console.error("加载数据失败:", err);
      error.value = err.message || "加载失败，请重试";
      papers.value = [];
      totalItems.value = 0;
      totalPages.value = 0;
      showToast(
        type === "literature" ? "加载文献失败" : "加载论文失败",
        "error"
      );
    } finally {
      loading.value = false;
    }
  };

  // 更新搜索统计
  const updateSearchStats = () => {
    const hasQuery = Object.values(searchParams.value).some(
      (value) => value && value.toString().trim()
    );

    const timeMs = searchStartTime.value
      ? Date.now() - searchStartTime.value
      : null;

    searchStats.value = {
      total: totalItems.value,
      hasQuery,
      timeMs,
    };
  }; // 删除数据
  const handleDelete = async (paper, confirmCallback = null) => {
    const paperType = type === "literature" ? "文献" : "论文";

    // 如果提供了确认回调，使用它；否则使用原生confirm
    let confirmed = false;
    if (confirmCallback) {
      try {
        confirmed = await confirmCallback(`${paperType}"${paper.title}"`);
      } catch (error) {
        // 用户取消了操作
        return;
      }
    } else {
      confirmed = confirm(`确定要删除${paperType}"${paper.title}"吗？`);
    }

    if (!confirmed) return;

    try {
      if (deleteData) {
        await deleteData(paper.id);
      } else if (type === "literature") {
        await deleteReference(paper.id);
      } else {
        await deletePaper(paper.id);
      }

      // 触发论文更新事件，通知其他组件刷新数据
      const eventType = "delete";
      const paperTypeForEvent =
        type === "literature" ? "literature" : "published";
      triggerPaperUpdate(eventType, paperTypeForEvent, paper);

      // 删除后重新加载当前页
      await loadPapers();
      showToast(`${paperType}删除成功`, "success");

      // 如果当前页没有数据了，回到上一页
      if (papers.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1;
        await loadPapers();
      }
    } catch (err) {
      console.error("删除失败:", err);
      showToast(`删除${paperType}失败`, "error");
    }
  };

  // 处理搜索
  const handleSearch = (params) => {
    // 更新搜索参数
    searchParams.value = { ...params };
    currentPage.value = 1;
    loadPapers();
  };

  // 清空搜索
  const clearSearch = () => {
    searchParams.value = {};
    currentPage.value = 1;
    loadPapers();
  };
  // 处理分类选择
  const handleCategorySelect = (categoryId) => {
    searchParams.value = {
      ...searchParams.value,
      category_id: categoryId || "",
    };
    currentPage.value = 1;
    loadPapers();
  };

  // 计算选中的分类ID（从搜索参数中获取）
  const selectedCategoryId = computed(() => {
    return searchParams.value.category_id || null;
  });

  // 页面变化处理
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      currentPage.value = page;
      loadPapers();
    }
  };

  // 监听器
  // 监听当前团队变化（仅当需要团队时）
  watch(
    () => currentTeam.value,
    () => {
      if (requireTeamRef.value) {
        currentPage.value = 1;
        searchParams.value = {};
        loadPapers();
      }
    }
  );

  // 监听 requireTeam 变化
  watch(requireTeamRef, () => {
    currentPage.value = 1;
    searchParams.value = {};
    loadPapers();
  });
  return {
    // 数据
    papers,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    searchParams,
    searchStats,
    selectedCategoryId,

    // 计算属性
    filteredPapers,

    // 方法
    loadPapers,
    handleDelete,
    handleSearch,
    clearSearch,
    handleCategorySelect,
    changePage,
  };
}
