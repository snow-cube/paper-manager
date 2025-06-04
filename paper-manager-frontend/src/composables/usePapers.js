import { ref, computed, watch } from 'vue'
import { getPapers, getReferences, deletePaper, deleteReference } from '../services/api'
import { useToast } from './useToast'
import { useTeam } from './useTeam'

/**
 * 通用论文/文献管理组合式函数
 * @param {Object} options 配置选项
 * @param {string} options.type - 类型: 'papers' | 'literature'
 * @param {boolean} options.requireTeam - 是否需要团队
 * @param {Function} options.loadData - 自定义数据加载函数
 * @param {Function} options.deleteData - 自定义删除函数
 */
export function usePapers(options = {}) {
  const {
    type = 'papers',
    requireTeam = false,
    loadData = null,
    deleteData = null
  } = options

  const { showToast } = useToast()
  const { currentTeam } = useTeam()

  // 响应式数据
  const papers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const selectedCategoryId = ref(null)
  const currentPage = ref(1)
  const itemsPerPage = 12

  // 辅助函数：处理作者数据
  const getAuthorsText = (authors) => {
    if (!authors) return ''
    if (typeof authors === 'string') return authors
    if (Array.isArray(authors)) {
      return authors.map(author => typeof author === 'string' ? author : author.name).join(', ')
    }
    return ''
  }

  // 辅助函数：处理关键词数据
  const getKeywordsText = (keywords) => {
    if (!keywords) return ''
    if (typeof keywords === 'string') return keywords
    if (Array.isArray(keywords)) {
      return keywords.map(keyword => typeof keyword === 'string' ? keyword : keyword.name).join(', ')
    }
    return ''
  }

  // 计算属性：过滤后的论文列表
  const filteredPapers = computed(() => {
    // 如果需要团队但没有选择团队，返回空数组
    if (requireTeam && !currentTeam.value) return []

    let filtered = papers.value

    // 团队筛选（只对参考文献有效）
    if (requireTeam && currentTeam.value) {
      filtered = filtered.filter(paper => paper.team_id === currentTeam.value.id)
    }

    // 分类筛选
    if (selectedCategoryId.value) {
      filtered = filtered.filter(paper => {
        if (Array.isArray(paper.categories)) {
          return paper.categories.some(cat => cat.id === selectedCategoryId.value)
        }
        return paper.category_id === selectedCategoryId.value
      })
    }

    // 搜索筛选
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(paper =>
        paper.title?.toLowerCase().includes(query) ||
        getAuthorsText(paper.authors)?.toLowerCase().includes(query) ||
        paper.abstract?.toLowerCase().includes(query) ||
        getKeywordsText(paper.keywords)?.toLowerCase().includes(query)
      )
    }

    // 分页
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filtered.slice(start, end)
  })

  // 计算属性：总页数
  const totalPages = computed(() => {
    if (requireTeam && !currentTeam.value) return 0

    let filtered = papers.value

    // 团队筛选
    if (requireTeam && currentTeam.value) {
      filtered = filtered.filter(paper => paper.team_id === currentTeam.value.id)
    }

    // 分类筛选
    if (selectedCategoryId.value) {
      filtered = filtered.filter(paper => {
        if (Array.isArray(paper.categories)) {
          return paper.categories.some(cat => cat.id === selectedCategoryId.value)
        }
        return paper.category_id === selectedCategoryId.value
      })
    }

    // 搜索筛选
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(paper =>
        paper.title?.toLowerCase().includes(query) ||
        getAuthorsText(paper.authors)?.toLowerCase().includes(query) ||
        paper.abstract?.toLowerCase().includes(query) ||
        getKeywordsText(paper.keywords)?.toLowerCase().includes(query)
      )
    }

    return Math.ceil(filtered.length / itemsPerPage)
  })

  // 加载数据
  const loadPapers = async () => {
    if (requireTeam && !currentTeam.value) {
      papers.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      let data
      if (loadData) {
        data = await loadData()
      } else if (type === 'literature') {
        data = await getReferences(currentTeam.value.id)
      } else {
        data = await getPapers()
      }      papers.value = data || []

      // 为每个数据项添加明确的类型标识
      papers.value.forEach(item => {
        if (type === 'literature') {
          // 参考文献数据
          item._itemType = 'reference'
          item.paper_type = 'literature' // 保持兼容性
        } else {
          // 论文数据
          item._itemType = 'paper'
          if (!item.paper_type) {
            item.paper_type = 'published'
          }
        }
      })
    } catch (err) {
      console.error('加载数据失败:', err)
      error.value = err.message || '加载失败，请重试'
      papers.value = []
      showToast(
        type === 'literature' ? '加载文献失败' : '加载论文失败',
        'error'
      )
    } finally {
      loading.value = false
    }
  }

  // 删除数据
  const handleDelete = async (paper) => {
    const paperType = type === 'literature' ? '文献' : '论文'
    if (!confirm(`确定要删除${paperType}"${paper.title}"吗？`)) {
      return
    }

    try {
      if (deleteData) {
        await deleteData(paper.id)
      } else if (type === 'literature') {
        await deleteReference(paper.id)
      } else {
        await deletePaper(paper.id)
      }

      await loadPapers()
      showToast(`${paperType}删除成功`, 'success')
    } catch (err) {
      console.error('删除失败:', err)
      showToast(`删除${paperType}失败`, 'error')
    }
  }

  // 处理分类选择
  const handleCategorySelect = (categoryId) => {
    selectedCategoryId.value = categoryId
    currentPage.value = 1
  }

  // 处理搜索
  const handleSearch = () => {
    currentPage.value = 1
  }

  // 清空搜索
  const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
  }

  // 监听器
  watch([selectedCategoryId, searchQuery], () => {
    currentPage.value = 1
  })

  // 监听当前团队变化（仅当需要团队时）
  if (requireTeam) {
    watch(() => currentTeam.value, () => {
      loadPapers()
      currentPage.value = 1
      selectedCategoryId.value = null
    })
  }

  return {
    // 数据
    papers,
    loading,
    error,
    searchQuery,
    selectedCategoryId,
    currentPage,
    itemsPerPage,

    // 计算属性
    filteredPapers,
    totalPages,

    // 方法
    loadPapers,
    handleDelete,
    handleCategorySelect,
    handleSearch,
    clearSearch,

    // 辅助函数
    getAuthorsText,
    getKeywordsText
  }
}
