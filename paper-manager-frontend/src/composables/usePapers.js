import { ref, computed, watch, nextTick } from 'vue'
import { getPapers, getReferences, deletePaper, deleteReference } from '../services/api'
import { useToast } from './useToast'
import { useTeam } from './useTeam'

/**
 * 通用论文/文献管理组合式函数 - 支持服务端分页
 * @param {Object} options 配置选项
 * @param {string} options.type - 类型: 'papers' | 'literature'
 * @param {boolean|import('vue').Ref<boolean>} options.requireTeam - 是否需要团队
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

  // 将 requireTeam 转换为响应式引用（如果它还不是的话）
  const requireTeamRef = computed(() => {
    return typeof requireTeam === 'object' && 'value' in requireTeam
      ? requireTeam.value
      : requireTeam
  })
  // 响应式数据
  const papers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const selectedCategoryId = ref(null)
  const currentPage = ref(1)
  const itemsPerPage = 10 // 服务端分页每页数量
  const totalItems = ref(0) // 服务端返回的总数量
  const totalPages = ref(0) // 计算得出的总页数

  // 搜索防抖定时器
  let searchDebounceTimer = null

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

  // 计算属性：当前页的论文列表（直接返回从服务端获取的数据）
  const filteredPapers = computed(() => {
    // 如果需要团队但没有选择团队，返回空数组
    if (requireTeamRef.value && !currentTeam.value) return []
    return papers.value
  })

  // 构建查询参数
  const buildQueryParams = () => {
    const skip = (currentPage.value - 1) * itemsPerPage
    const limit = itemsPerPage

    const params = { skip, limit }

    // 添加搜索关键词
    if (searchQuery.value.trim()) {
      if (type === 'literature') {
        params.keyword = searchQuery.value.trim()
      } else {
        // 对于论文，我们使用 keyword 参数进行全文搜索
        params.keyword = searchQuery.value.trim()
      }
    }

    // 添加分类筛选
    if (selectedCategoryId.value) {
      params.category_id = selectedCategoryId.value
    }

    // 添加团队筛选
    if (requireTeamRef.value && currentTeam.value) {
      params.team_id = currentTeam.value.id
    }

    return params
  }

  // 加载数据
  const loadPapers = async () => {
    if (requireTeamRef.value && !currentTeam.value) {
      papers.value = []
      totalItems.value = 0
      totalPages.value = 0
      return
    }

    loading.value = true
    error.value = null

    try {
      let response
      const params = buildQueryParams()

      if (loadData) {
        response = await loadData(params)
      } else if (type === 'literature') {
        response = await getReferences(currentTeam.value.id, params)
      } else {
        response = await getPapers(params)
      }

      // 处理响应数据
      if (response && typeof response === 'object') {
        // 检查是否有分页信息
        if ('items' in response || 'data' in response) {
          // 标准分页响应格式
          papers.value = response.items || response.data || []
          totalItems.value = response.total || response.total_count || 0
          totalPages.value = Math.ceil(totalItems.value / itemsPerPage)
        } else if (Array.isArray(response)) {
          // 直接数组响应（向后兼容）
          papers.value = response
          totalItems.value = response.length
          totalPages.value = Math.ceil(totalItems.value / itemsPerPage)
        } else {
          // 未知响应格式
          papers.value = []
          totalItems.value = 0
          totalPages.value = 0
        }
      } else {
        papers.value = response || []
        totalItems.value = papers.value.length
        totalPages.value = Math.ceil(totalItems.value / itemsPerPage)
      }

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
      totalItems.value = 0
      totalPages.value = 0
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

      // 删除后重新加载当前页
      await loadPapers()
      showToast(`${paperType}删除成功`, 'success')

      // 如果当前页没有数据了，回到上一页
      if (papers.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1
        await loadPapers()
      }
    } catch (err) {
      console.error('删除失败:', err)
      showToast(`删除${paperType}失败`, 'error')
    }
  }

  // 处理分类选择
  const handleCategorySelect = (categoryId) => {
    selectedCategoryId.value = categoryId
    currentPage.value = 1
    loadPapers()
  }

  // 处理搜索（带防抖）
  const handleSearch = () => {
    // 清除之前的定时器
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    // 设置新的定时器
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1
      loadPapers()
    }, 300) // 300ms 防抖延迟
  }

  // 清空搜索
  const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    loadPapers()
  }

  // 页面变化处理
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      currentPage.value = page
      loadPapers()
    }
  }

  // 监听器
  watch(searchQuery, () => {
    handleSearch()
  })

  // 监听当前团队变化（仅当需要团队时）
  watch(() => currentTeam.value, () => {
    if (requireTeamRef.value) {
      currentPage.value = 1
      selectedCategoryId.value = null
      loadPapers()
    }
  })

  // 监听 requireTeam 变化
  watch(requireTeamRef, () => {
    currentPage.value = 1
    selectedCategoryId.value = null
    loadPapers()
  })

  return {
    // 数据
    papers,
    loading,
    error,
    searchQuery,
    selectedCategoryId,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,

    // 计算属性
    filteredPapers,

    // 方法
    loadPapers,
    handleDelete,
    handleCategorySelect,
    handleSearch,
    clearSearch,
    changePage,

    // 辅助函数
    getAuthorsText,
    getKeywordsText
  }
}
