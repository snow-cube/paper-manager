import { ref, onMounted } from 'vue';
import { getCategories } from '../services/api';

const categories = ref([]);
const loading = ref(false);
const loaded = ref(false);

export function useCategories() {
  const loadCategories = async () => {
    if (loaded.value) return categories.value; // 已加载过则直接返回

    loading.value = true;
    try {
      categories.value = await getCategories();
      loaded.value = true;
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      loading.value = false;
    }
    return categories.value;
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return '未分类';

    // 确保分类已加载
    if (!loaded.value && !loading.value) {
      loadCategories(); // 异步加载分类
      return '加载中...'; // 返回临时提示
    }

    const category = categories.value.find(cat => cat.id === Number(categoryId));
    return category ? category.name : '未知分类';
  };

  const getCategoryPath = (categoryId) => {
    if (!categoryId) return [];

    const category = categories.value.find(cat => cat.id === Number(categoryId));
    return category ? [category] : [];
  };

  const getAllCategories = () => {
    return categories.value;
  };

  // 自动加载分类数据
  onMounted(() => {
    if (!loaded.value && !loading.value) {
      loadCategories();
    }
  });

  return {
    categories,
    loading,
    loaded,
    loadCategories,
    getCategoryName,
    getCategoryPath,
    getAllCategories
  };
}
