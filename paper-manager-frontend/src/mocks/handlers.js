import { http, HttpResponse } from 'msw';
import {
  mockPapers,
  mockCategories,
  mockUsers,
  getFlatCategories,
  getTotalPapers,
  getPapersByCategory
} from './data.js';

let papers = [...mockPapers];
let categories = [...mockCategories];
let users = [...mockUsers];
let nextPaperId = Math.max(...papers.map(p => p.id)) + 1;
let nextCategoryId = Math.max(...getFlatCategories().map(c => c.id)) + 1;

// 辅助函数：延迟响应（模拟网络延迟）
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 辅助函数：生成当前时间戳
const now = () => new Date().toISOString();

// 辅助函数：模拟错误响应
const simulateError = (probability = 0.1) => {
  if (Math.random() < probability) {
    return HttpResponse.json(
      { error: '服务器暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
  return null;
};

export const handlers = [
  // 获取论文列表
  http.get('http://localhost:8000/api/paper', async ({ request }) => {
    await delay();

    // 模拟偶发错误
    const errorResponse = simulateError(0.05);
    if (errorResponse) return errorResponse;    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');
    const paperType = url.searchParams.get('paper_type');

    let filteredPapers = papers;

    // 按论文类型筛选
    if (paperType) {
      filteredPapers = filteredPapers.filter(paper =>
        paper.paper_type === paperType
      );
    }

    // 按分类筛选
    if (categoryId) {
      filteredPapers = filteredPapers.filter(paper =>
        paper.category_id === parseInt(categoryId)
      );
    }

    return HttpResponse.json(filteredPapers);
  }),

  // 上传论文
  http.post('http://localhost:8000/api/paper/upload', async ({ request }) => {
    await delay(800); // 上传需要更长时间

    const errorResponse = simulateError(0.1);
    if (errorResponse) return errorResponse;

    const formData = await request.formData();
    const title = formData.get('title');
    const authors = formData.get('authors');
    const abstract = formData.get('abstract');
    const keywords = formData.get('keywords');
    const categoryId = formData.get('category_id');
    const publicationDate = formData.get('publication_date');
    const publicationInfo = formData.get('publication_info');
    const doi = formData.get('doi');

    // 验证必填字段
    if (!title || !authors) {
      return HttpResponse.json(
        { error: '标题和作者为必填字段' },
        { status: 400 }
      );
    }

    const newPaper = {
      id: nextPaperId++,
      title,
      authors,
      abstract: abstract || '',
      keywords: keywords || '',
      publication_date: publicationDate || null,
      publication_info: publicationInfo || '',
      doi: doi || '',
      file_url: `/files/paper${nextPaperId - 1}.pdf`,
      category_id: categoryId ? parseInt(categoryId) : null,
      created_at: now(),
      updated_at: now()
    };

    papers.push(newPaper);

    return HttpResponse.json(newPaper, { status: 201 });
  }),

  // 更新论文
  http.put('http://localhost:8000/api/paper/:id', async ({ params, request }) => {
    await delay();

    const errorResponse = simulateError(0.08);
    if (errorResponse) return errorResponse;

    const paperId = parseInt(params.id);
    const updates = await request.json();

    const paperIndex = papers.findIndex(p => p.id === paperId);
    if (paperIndex === -1) {
      return HttpResponse.json(
        { error: '论文未找到' },
        { status: 404 }
      );
    }

    papers[paperIndex] = {
      ...papers[paperIndex],
      ...updates,
      updated_at: now()
    };

    return HttpResponse.json(papers[paperIndex]);
  }),

  // 删除论文
  http.delete('http://localhost:8000/api/paper/:id', async ({ params }) => {
    await delay();

    const errorResponse = simulateError(0.05);
    if (errorResponse) return errorResponse;

    const paperId = parseInt(params.id);
    const paperIndex = papers.findIndex(p => p.id === paperId);

    if (paperIndex === -1) {
      return HttpResponse.json(
        { error: '论文未找到' },
        { status: 404 }
      );
    }

    papers.splice(paperIndex, 1);

    return HttpResponse.json({ message: '论文删除成功' });
  }),

  // 获取分类列表（扁平）
  http.get('http://localhost:8000/api/category', async () => {
    await delay();

    const errorResponse = simulateError(0.03);
    if (errorResponse) return errorResponse;

    return HttpResponse.json(getFlatCategories());
  }),

  // 获取分类树
  http.get('http://localhost:8000/api/category/tree', async () => {
    await delay();

    const errorResponse = simulateError(0.03);
    if (errorResponse) return errorResponse;

    return HttpResponse.json({
      categories: categories,
      total_papers: getTotalPapers()
    });
  }),

  // 创建分类
  http.post('http://localhost:8000/api/category', async ({ request }) => {
    await delay();

    const errorResponse = simulateError(0.08);
    if (errorResponse) return errorResponse;

    const { name, description, parent_id } = await request.json();

    if (!name) {
      return HttpResponse.json(
        { error: '分类名称为必填字段' },
        { status: 400 }
      );
    }

    const newCategory = {
      id: nextCategoryId++,
      name,
      description: description || '',
      parent_id: parent_id || null,
      created_at: now(),
      updated_at: now(),
      children: []
    };

    // 如果有父分类，添加到对应父分类的children中
    if (parent_id) {
      const addToParent = (cats) => {
        for (let cat of cats) {
          if (cat.id === parent_id) {
            cat.children.push(newCategory);
            return true;
          }
          if (cat.children && addToParent(cat.children)) {
            return true;
          }
        }
        return false;
      };
      addToParent(categories);
    } else {
      // 根分类
      categories.push(newCategory);
    }

    return HttpResponse.json(newCategory, { status: 201 });
  }),

  // 更新分类
  http.put('http://localhost:8000/api/category/:id', async ({ params, request }) => {
    await delay();

    const errorResponse = simulateError(0.08);
    if (errorResponse) return errorResponse;

    const categoryId = parseInt(params.id);
    const updates = await request.json();

    // 递归查找并更新分类
    const updateCategory = (cats) => {
      for (let cat of cats) {
        if (cat.id === categoryId) {
          Object.assign(cat, updates, { updated_at: now() });
          return cat;
        }
        if (cat.children) {
          const found = updateCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    const updatedCategory = updateCategory(categories);

    if (!updatedCategory) {
      return HttpResponse.json(
        { error: '分类未找到' },
        { status: 404 }
      );
    }

    return HttpResponse.json(updatedCategory);
  }),

  // 删除分类
  http.delete('http://localhost:8000/api/category/:id', async ({ params }) => {
    await delay();

    const errorResponse = simulateError(0.05);
    if (errorResponse) return errorResponse;

    const categoryId = parseInt(params.id);

    // 递归删除分类
    const deleteCategory = (cats) => {
      for (let i = 0; i < cats.length; i++) {
        if (cats[i].id === categoryId) {
          cats.splice(i, 1);
          return true;
        }
        if (cats[i].children && deleteCategory(cats[i].children)) {
          return true;
        }
      }
      return false;
    };

    const deleted = deleteCategory(categories);

    if (!deleted) {
      return HttpResponse.json(
        { error: '分类未找到' },
        { status: 404 }
      );
    }

    // 删除该分类下的所有论文
    papers = papers.filter(paper => paper.category_id !== categoryId);

    return HttpResponse.json({ message: '分类删除成功' });
  }),

  // 获取用户列表
  http.get('http://localhost:8000/api/user', async () => {
    await delay();

    const errorResponse = simulateError(0.02);
    if (errorResponse) return errorResponse;

    return HttpResponse.json(users);
  }),

  // 下载文件（模拟）
  http.get('http://localhost:8000/api/paper/:id/download', async ({ params }) => {
    await delay(1000); // 下载需要更长时间

    const errorResponse = simulateError(0.1);
    if (errorResponse) return errorResponse;

    const paperId = parseInt(params.id);
    const paper = papers.find(p => p.id === paperId);

    if (!paper) {
      return HttpResponse.json(
        { error: '论文未找到' },
        { status: 404 }
      );
    }

    if (!paper.file_url) {
      return HttpResponse.json(
        { error: '该论文暂无文件' },
        { status: 404 }
      );
    }

    // 模拟PDF文件下载
    const pdfContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(${paper.title}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000174 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n275\n%%EOF`;

    return new HttpResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${paper.title}.pdf"`
      }
    });
  })
];
