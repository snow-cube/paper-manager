import { ref, onMounted } from "vue";
import { getCategories, getReferenceCategories } from "../services/api.js";

const categories = ref([]);
const loading = ref(false);
const loaded = ref(false);
const lastLoadedType = ref(null);
const lastLoadedTeamId = ref(null);

export function useCategories() {
  const loadCategories = async (
    categoryType = "papers",
    teamId = null,
    forceReload = false
  ) => {
    // 如果强制重新加载，或者未加载过相同类型的分类，则重新加载
    if (
      forceReload ||
      !loaded.value ||
      lastLoadedType.value !== categoryType ||
      lastLoadedTeamId.value !== teamId
    ) {
      // 继续加载逻辑
    } else {
      // 已加载过相同类型的分类则直接返回
      return categories.value;
    }

    loading.value = true;
    try {
      if (categoryType === "references") {
        // 加载参考文献分类（团队特定）
        if (!teamId) {
          categories.value = [];
          console.warn("Reference categories require teamId");
        } else {
          categories.value = await getReferenceCategories(teamId);
        }
      } else {
        // 加载论文分类（公共）
        categories.value = await getCategories();
      }

      loaded.value = true;
      lastLoadedType.value = categoryType;
      lastLoadedTeamId.value = teamId;
    } catch (error) {
      console.error("Failed to load categories:", error);
      categories.value = [];
    } finally {
      loading.value = false;
    }
    return categories.value;
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return "未分类";

    // 确保分类已加载
    if (!loaded.value && !loading.value) {
      loadCategories(); // 异步加载分类
      return "加载中..."; // 返回临时提示
    }

    const category = categories.value.find(
      (cat) => cat.id === Number(categoryId)
    );
    return category ? category.name : "未知分类";
  };

  const getCategoryPath = (categoryId) => {
    if (!categoryId) return [];

    const category = categories.value.find(
      (cat) => cat.id === Number(categoryId)
    );
    return category ? [category] : [];
  };
  const getAllCategories = () => {
    return categories.value;
  };

  // 强制刷新分类数据
  const refreshCategories = async (categoryType = "papers", teamId = null) => {
    return await loadCategories(categoryType, teamId, true);
  };

  // 重置分类数据
  const resetCategories = () => {
    categories.value = [];
    loaded.value = false;
    lastLoadedType.value = null;
    lastLoadedTeamId.value = null;
  };

  // 自动加载分类数据（默认加载论文分类）
  onMounted(() => {
    if (!loaded.value && !loading.value) {
      loadCategories("papers");
    }
  });

  return {
    categories,
    loading,
    loaded,
    loadCategories,
    refreshCategories,
    resetCategories,
    getCategoryName,
    getCategoryPath,
    getAllCategories,
  };
}
