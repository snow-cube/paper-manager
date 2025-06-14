// 模拟数据
export const mockPapers = [
  {
    id: 1,
    title: "深度学习在计算机视觉中的应用研究",
    authors: "张三, 李四, 王五",
    abstract: "本文探讨了深度学习技术在计算机视觉领域的最新应用，包括图像分类、目标检测和图像分割等方面的研究进展。通过对比分析不同深度学习模型的性能，提出了一种改进的神经网络架构。",
    keywords: "深度学习, 计算机视觉, 神经网络, 图像处理",
    publication_date: "2024-03-15",
    publication_info: "IEEE Transactions on Pattern Analysis and Machine Intelligence, Vol. 46, No. 3",    doi: "10.1109/TPAMI.2024.1234567",
    file_url: "http://localhost:8000/media/papers/1_20250613_123456_paper1.pdf",
    category_id: 1,
    paper_type: "literature", // 文献类型：literature（文献）或 published（发表论文）
    created_at: "2024-03-20T10:30:00Z",
    updated_at: "2024-03-20T10:30:00Z"
  },  {
    id: 2,
    title: "基于强化学习的自动驾驶决策算法",
    authors: "赵六, 钱七",
    abstract: "提出了一种基于深度强化学习的自动驾驶决策算法，能够在复杂交通环境中做出安全可靠的驾驶决策。实验结果表明该算法在仿真环境中表现优异。",
    keywords: "强化学习, 自动驾驶, 决策算法, 人工智能",
    publication_date: "2024-02-20",
    publication_info: "Nature Machine Intelligence, Vol. 6, No. 2",    doi: "10.1038/s42256-024-0123",
    file_url: "http://localhost:8000/media/papers/2_20250613_123457_paper2.pdf",
    category_id: 1,
    paper_type: "published", // 发表论文
    created_at: "2024-02-25T14:15:00Z",
    updated_at: "2024-02-25T14:15:00Z"
  },
  {
    id: 3,
    title: "量子计算在密码学中的应用前景",
    authors: "孙八, 周九, 吴十",
    abstract: "分析了量子计算技术对现有密码学体系的影响，探讨了量子密码学的发展前景和技术挑战。提出了几种后量子密码算法的设计思路。",
    keywords: "量子计算, 密码学, 量子密码, 信息安全",
    publication_date: "2024-01-10",
    publication_info: "Science, Vol. 383, No. 6629",    doi: "10.1126/science.2024.383.6629",
    file_url: "http://localhost:8000/media/papers/3_20250613_123458_paper3.pdf",
    category_id: 2,
    paper_type: "literature", // 文献
    created_at: "2024-01-15T09:20:00Z",
    updated_at: "2024-01-15T09:20:00Z"
  },
  {
    id: 4,
    title: "区块链技术在供应链管理中的创新应用",
    authors: "郑十一, 王十二",
    abstract: "研究了区块链技术在供应链管理中的应用模式，设计了一个基于智能合约的供应链追溯系统，提高了供应链的透明度和可信度。",
    keywords: "区块链, 供应链管理, 智能合约, 可追溯性",
    publication_date: "2023-12-05",
    publication_info: "Journal of Business Research, Vol. 168",    doi: "10.1016/j.jbusres.2023.114567",
    file_url: "http://localhost:8000/media/papers/4_20250613_123459_paper4.pdf",
    category_id: 2,
    paper_type: "published", // 发表论文
    created_at: "2023-12-10T16:45:00Z",
    updated_at: "2023-12-10T16:45:00Z"
  },
  {
    id: 5,
    title: "边缘计算在物联网中的优化策略",
    authors: "冯十三, 陈十四, 褚十五",
    abstract: "针对物联网设备的计算资源限制问题，提出了一种基于边缘计算的优化策略。通过任务卸载和资源分配算法，显著提升了系统性能。",
    keywords: "边缘计算, 物联网, 任务卸载, 资源优化",
    publication_date: "2023-11-18",
    publication_info: "IEEE Internet of Things Journal, Vol. 10, No. 22",    doi: "10.1109/JIOT.2023.3234567",
    file_url: "http://localhost:8000/media/papers/5_20250613_123500_paper5.pdf",
    category_id: 3,
    paper_type: "literature", // 文献
    created_at: "2023-11-20T11:30:00Z",
    updated_at: "2023-11-20T11:30:00Z"
  },
  {
    id: 6,
    title: "自然语言处理中的大语言模型研究进展",
    authors: "卫十六, 蒋十七",
    abstract: "综述了大语言模型在自然语言处理领域的最新发展，分析了GPT、BERT等模型的技术特点和应用场景，探讨了未来发展趋势。",
    keywords: "自然语言处理, 大语言模型, GPT, BERT, 预训练",
    publication_date: "2023-10-25",
    publication_info: "Computational Linguistics, Vol. 49, No. 4",    doi: "10.1162/coli_a_00234",
    file_url: "http://localhost:8000/media/papers/6_20250613_123501_paper6.pdf",
    category_id: 1,
    paper_type: "published", // 发表论文
    created_at: "2023-10-28T13:15:00Z",
    updated_at: "2023-10-28T13:15:00Z"
  }
];

export const mockCategories = [
  {
    id: 1,
    name: "人工智能",
    description: "AI相关研究论文",
    parent_id: null,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    children: [
      {
        id: 4,
        name: "机器学习",
        description: "机器学习算法与应用",
        parent_id: 1,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        children: []
      },
      {
        id: 5,
        name: "深度学习",
        description: "深度神经网络相关研究",
        parent_id: 1,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        children: []
      }
    ]
  },
  {
    id: 2,
    name: "信息安全",
    description: "网络安全与信息保护",
    parent_id: null,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    children: [
      {
        id: 6,
        name: "密码学",
        description: "加密算法与协议",
        parent_id: 2,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        children: []
      }
    ]
  },
  {
    id: 3,
    name: "分布式系统",
    description: "分布式计算与系统架构",
    parent_id: null,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    children: [
      {
        id: 7,
        name: "云计算",
        description: "云服务与虚拟化技术",
        parent_id: 3,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        children: []
      },
      {
        id: 8,
        name: "边缘计算",
        description: "边缘节点计算技术",
        parent_id: 3,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        children: []
      }
    ]
  }
];

export const mockUsers = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    role: "研究员",
    created_at: "2023-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@example.com",
    role: "教授",
    created_at: "2023-01-01T00:00:00Z"
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    role: "博士生",
    created_at: "2023-01-01T00:00:00Z"
  }
];

// 辅助函数：获取分类的扁平列表
export const getFlatCategories = () => {
  const flatCategories = [];

  const addCategory = (category) => {
    flatCategories.push({
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      created_at: category.created_at,
      updated_at: category.updated_at
    });

    if (category.children) {
      category.children.forEach(addCategory);
    }
  };

  mockCategories.forEach(addCategory);
  return flatCategories;
};

// 辅助函数：计算论文总数
export const getTotalPapers = () => mockPapers.length;

// 辅助函数：根据分类ID获取论文
export const getPapersByCategory = (categoryId) => {
  if (!categoryId) return mockPapers;
  return mockPapers.filter(paper => paper.category_id === categoryId);
};

// 辅助函数：根据论文类型获取论文
export const getPapersByType = (paperType) => {
  if (!paperType) return mockPapers;
  return mockPapers.filter(paper => paper.paper_type === paperType);
};

// 辅助函数：根据类型和分类获取论文
export const getPapersByTypeAndCategory = (paperType, categoryId) => {
  let papers = mockPapers;

  if (paperType) {
    papers = papers.filter(paper => paper.paper_type === paperType);
  }

  if (categoryId) {
    papers = papers.filter(paper => paper.category_id === categoryId);
  }

  return papers;
};

// 辅助函数：统计各类型论文数量
export const getPaperCountsByType = () => {
  const literature = mockPapers.filter(p => p.paper_type === 'literature').length;
  const published = mockPapers.filter(p => p.paper_type === 'published').length;

  return {
    literature,
    published,
    total: mockPapers.length
  };
};
