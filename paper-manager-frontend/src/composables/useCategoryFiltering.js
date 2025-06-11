import { ref, computed, watch } from 'vue';
import {
  getCategories,
  getReferenceCategories,
  getPapers,
  getReferences
} from '../services/api';
import { useToast } from './useToast';

/**
 * 分类筛选组合式函数 - 完全依赖服务端分类统计
 * @param {Object} options 配置选项
 * @param {string} options.categoryType - 分类类型: 'papers' | 'references'
 * @param {string} options.paperType - 论文类型: 'literature' | 'published' | null
 * @param {number|string} options.teamId - 团队ID（参考文献分类必需）
 */
export function useCategoryFiltering(options = {}) {
  const { showToast } = useToast();

  // 响应式状态
  const categories = ref([]);
  const categoryTree = ref([]);
  const selectedCategoryId = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const categoryType = computed(() => options.categoryType || 'papers');
  const paperType = computed(() => options.paperType || null);
  const teamId = computed(() => options.teamId || null);

  // 构建分类树结构
  const buildCategoryTree = (flatCategories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // 创建分类映射
    flatCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建树形结构
    flatCategories.forEach((category) => {
      const categoryNode = categoryMap.get(category.id);
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryNode);
        } else {
          rootCategories.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  };

  // 加载分类数据 - 完全依赖服务端统计
  const loadCategories = async () => {
    loading.value = true;
    error.value = null;

    try {
      let categoriesData;

      if (categoryType.value === 'references') {
        if (!teamId.value) {
          categories.value = [];
          categoryTree.value = [];
          return;
        }
        // 强制要求服务端返回统计信息
        categoriesData = await getReferenceCategories(teamId.value, {
          include_stats: true
        });
      } else {
        // 强制要求服务端返回统计信息
        categoriesData = await getCategories({
          include_stats: true,
          paper_type: paperType.value
        });
      }

      categories.value = categoriesData || [];
      categoryTree.value = buildCategoryTree(categories.value);

    } catch (err) {
      console.error('加载分类失败:', err);
      error.value = '加载分类失败，请重试';
      showToast('加载分类失败', 'error');
    } finally {
      loading.value = false;
    }
  };

  // 获取筛选后的论文/参考文献
  const getFilteredItems = async (categoryId = null, additionalParams = {}) => {
    try {
      const params = {
        ...additionalParams,
        skip: 0,
        limit: 1000 // 获取更多数据用于筛选
      };

      if (categoryId) {
        params.category_id = categoryId;
      }

      let items;
      if (categoryType.value === 'references') {
        if (!teamId.value) return [];
        items = await getReferences(teamId.value, params);
      } else {
        if (paperType.value) {
          params.paper_type = paperType.value;
        }
        items = await getPapers(params);
      }

      // 处理分页响应格式
      if (Array.isArray(items)) {
        return items;
      } else if (items && Array.isArray(items.items)) {
        return items.items;
      } else if (items && Array.isArray(items.data)) {
        return items.data;
      }

      return [];
    } catch (err) {
      console.error('获取筛选数据失败:', err);
      showToast('获取数据失败', 'error');
      return [];
    }
  };

  // 选择分类
  const selectCategory = (categoryId) => {
    selectedCategoryId.value = categoryId;
  };

  // 获取选中的分类信息
  const selectedCategory = computed(() => {
    if (!selectedCategoryId.value) return null;

    const findCategory = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findCategory(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    return findCategory(categoryTree.value, selectedCategoryId.value);
  });

  // 监听配置变化
  watch(
    [categoryType, paperType, teamId],
    () => {
      loadCategories();
    },
    { immediate: true }
  );

  return {
    // 状态
    categories,
    categoryTree,
    selectedCategoryId,
    loading,
    error,

    // 计算属性
    selectedCategory,

    // 方法
    loadCategories,
    getFilteredItems,
    selectCategory,
  };
}
