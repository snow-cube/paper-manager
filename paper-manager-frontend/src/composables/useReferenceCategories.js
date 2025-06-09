import { ref, onMounted } from 'vue';
import { getReferenceCategories } from '../services/api';

const referenceCategories = ref([]);
const loading = ref(false);
const loaded = ref(false);

export function useReferenceCategories() {
  const loadReferenceCategories = async (teamId) => {
    if (!teamId) {
      console.warn('Reference categories require teamId');
      return [];
    }

    if (loaded.value) return referenceCategories.value; // 已加载过则直接返回

    loading.value = true;
    try {
      referenceCategories.value = await getReferenceCategories(teamId);
      loaded.value = true;
    } catch (error) {
      console.error('Failed to load reference categories:', error);
    } finally {
      loading.value = false;
    }
    return referenceCategories.value;
  };

  const getReferenceCategoryName = (categoryId) => {
    if (!categoryId) return '未分类';

    // 确保分类已加载
    if (!loaded.value && !loading.value) {
      loadReferenceCategories(); // 异步加载分类
      return '加载中...'; // 返回临时提示
    }

    const category = referenceCategories.value.find(cat => cat.id === Number(categoryId));
    return category ? category.name : '未知分类';
  };

  const getReferenceCategoryPath = (categoryId) => {
    if (!categoryId) return [];

    const category = referenceCategories.value.find(cat => cat.id === Number(categoryId));
    return category ? [category] : [];
  };

  const getAllReferenceCategories = () => {
    return referenceCategories.value;
  };

  // 重置状态，用于切换团队时重新加载
  const resetReferenceCategories = () => {
    referenceCategories.value = [];
    loaded.value = false;
  };

  // 自动加载分类数据
  onMounted(() => {
    if (!loaded.value && !loading.value) {
      loadReferenceCategories();
    }
  });

  return {
    referenceCategories,
    loading,
    loaded,
    loadReferenceCategories,
    getReferenceCategoryName,
    getReferenceCategoryPath,
    getAllReferenceCategories,
    resetReferenceCategories
  };
}
