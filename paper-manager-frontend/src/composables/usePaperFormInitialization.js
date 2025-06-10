import { ref, watch, computed } from "vue";

export function usePaperFormInitialization(props) {  const form = ref({
    title: "",
    author_names: "",
    keyword_names: "",
    abstract: "",
    paper_type: props.paperType || "",
    doi: "",
    journal: "",
    journal_id: null,
    publication_date: "",
    category_ids: [],
  });

  const file = ref(null);
  const authorContributions = ref({
    contributions: [],
    correspondingAuthor: null,
  });

  // 计算是否为编辑模式
  const isEdit = computed(() => !!props.paper);
  // 初始化表单数据
  const initializeForm = () => {
    if (props.paper) {
      // 编辑模式：填充现有数据
      form.value.title = props.paper.title || "";
      form.value.abstract = props.paper.abstract || "";
      form.value.doi = props.paper.doi || "";

      // 处理期刊信息 - 优先使用journal_id，兼容journal字段
      if (props.paper.journal_id) {
        form.value.journal_id = props.paper.journal_id;
        form.value.journal = props.paper.journal_name || props.paper.journal || "";
      } else if (props.paper.journal) {
        // 向后兼容：如果只有期刊名称，保留它
        form.value.journal = props.paper.journal;
        form.value.journal_id = null;
      } else {
        form.value.journal = "";
        form.value.journal_id = null;
      }

      // 处理发表日期
      if (props.paper.publication_date) {
        const date = new Date(props.paper.publication_date);
        form.value.publication_date = date.toISOString().split("T")[0];
      }

      // 处理作者信息
      if (props.paper.authors) {
        if (Array.isArray(props.paper.authors)) {
          form.value.author_names = props.paper.authors
            .map((a) => a.name || a)
            .join(", ");
        } else if (typeof props.paper.authors === "string") {
          form.value.author_names = props.paper.authors;
        }
      }

      // 处理关键词
      if (props.paper.keywords) {
        if (Array.isArray(props.paper.keywords)) {
          form.value.keyword_names = props.paper.keywords
            .map((k) => k.name || k)
            .join(", ");
        } else if (typeof props.paper.keywords === "string") {
          form.value.keyword_names = props.paper.keywords;
        }
      }

      // 处理分类
      if (props.paper.categories && Array.isArray(props.paper.categories)) {
        form.value.category_ids = props.paper.categories.map((c) => c.id || c);
      } else if (props.paper.category_id) {
        form.value.category_ids = props.paper.category_id;
      } // 初始化作者贡献比例和通讯作者（仅发表论文）
      if (
        props.paper.author_contribution_ratios &&
        Array.isArray(props.paper.author_contribution_ratios)
      ) {
        authorContributions.value.contributions = [
          ...props.paper.author_contribution_ratios,
        ];
      }

      // 初始化通讯作者
      if (props.paper.corresponding_author_name) {
        authorContributions.value.correspondingAuthor =
          props.paper.corresponding_author_name;
      }
    } else if (props.paperType) {
      // 新建模式：设置论文类型
      form.value.paper_type = props.paperType;
    }
  }; // 重置表单
  const resetForm = () => {
    form.value = {
      title: "",
      author_names: "",
      keyword_names: "",
      abstract: "",
      paper_type: props.paperType || "",
      doi: "",
      journal: "",
      journal_id: null,
      publication_date: "",
      category_ids: [],
    };
    file.value = null;
    authorContributions.value = {
      contributions: [],
      correspondingAuthor: null,
    };
  };

  // 监听 props 变化
  watch(() => props.paper, initializeForm, { immediate: true });
  watch(
    () => props.paperType,
    () => {
      if (!props.paper && props.paperType) {
        form.value.paper_type = props.paperType;
      }
    },
    { immediate: true }
  );
  return {
    form,
    file,
    authorContributions,
    isEdit,
    initializeForm,
    resetForm,
  };
}
