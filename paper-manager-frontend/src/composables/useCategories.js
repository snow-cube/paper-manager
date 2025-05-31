import { ref, onMounted } from 'vue';
import { getCategories } from '../services/api';

const categories = ref([]);
const loading = ref(false);

export function useCategories() {
  const loadCategories = async () => {
    if (categories.value.length > 0) return; // 避免重复加载

    loading.value = true;
    try {
      categories.value = await getCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      loading.value = false;
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return '未分类';

    const category = categories.value.find(cat => cat.id === categoryId);
    return category ? category.name : '未知分类';
  };

  const getCategoryPath = (categoryId) => {
    if (!categoryId) return [];

    const category = categories.value.find(cat => cat.id === categoryId);
    return category ? [category] : [];
  };

  const getAllCategories = () => {
    return categories.value;
  };

  // 自动加载分类数据
  if (categories.value.length === 0) {
    loadCategories();
  }

  return {
    categories,
    loading,
    loadCategories,
    getCategoryName,
    getCategoryPath,
    getAllCategories
  };
}
