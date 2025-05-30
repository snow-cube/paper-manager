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

    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const name = findCategory(categories.value, categoryId);
    return name || '未知分类';
  };

  const getCategoryPath = (categoryId) => {
    if (!categoryId) return [];

    const findPath = (cats, id, path = []) => {
      for (const cat of cats) {
        const currentPath = [...path, cat];
        if (cat.id === id) return currentPath;
        if (cat.children) {
          const found = findPath(cat.children, id, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findPath(categories.value, categoryId) || [];
  };

  const getAllCategories = () => {
    const flatten = (cats) => {
      let result = [];
      for (const cat of cats) {
        result.push(cat);
        if (cat.children) {
          result = result.concat(flatten(cat.children));
        }
      }
      return result;
    };

    return flatten(categories.value);
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
