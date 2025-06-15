import { ref, watch, computed, nextTick } from "vue";
import { getPaper, getReference, getPaperWorkload } from "../services/api";

export function usePaperFormInitialization(props) {
  const form = ref({
    title: "",
    author_names: "",
    keyword_names: "",
    abstract: "",
    paper_type: props.paperType || "",
    doi: "",
    journal: "",
    journal_id: null,
    publication_date: "",
    publication_year: null,
    category_id: "", // 使用单个分类ID
  });
  const file = ref(null);
  const authorContributions = ref({
    contributions: [],
    correspondingAuthor: null,
  });
  const isInitializing = ref(false);

  // 计算是否为编辑模式
  const isEdit = computed(() => !!props.paper); // 初始化表单数据
  const initializeForm = async () => {
    if (props.paper && props.paper.id) {
      isInitializing.value = true;
      try {
        let paperData;
        let workloadData = null;

        // 根据论文类型调用不同的API获取最新数据
        if (
          props.paper.paper_type === "literature" ||
          (props.paper.publication_year && !props.paper.publication_date)
        ) {
          // 参考文献
          paperData = await getReference(props.paper.id);
        } else {
          // 发表论文 - 同时获取基本信息和工作量信息
          [paperData, workloadData] = await Promise.all([
            getPaper(props.paper.id),
            getPaperWorkload(props.paper.id).catch((error) => {
              console.warn("Failed to fetch workload data:", error);
              return null; // 如果工作量数据获取失败，使用null作为默认值
            }),
          ]);
          console.log("Fetched paper data:", paperData);
          console.log("Fetched workload data:", workloadData);

          // 详细分析工作量数据结构
          if (workloadData && workloadData.workloads) {
            console.log("Workloads detail:");
            workloadData.workloads.forEach((workload, index) => {
              console.log(`  Workload ${index}:`, {
                author_name: workload.author_name,
                contribution_ratio: workload.contribution_ratio,
                is_corresponding: workload.is_corresponding,
                full_workload: workload,
              });
            });
          }
        } // 使用从API获取的最新数据初始化表单
        await initializeFormWithData(paperData, workloadData);
      } catch (error) {
        console.error("Failed to fetch paper data:", error);
        // 如果API调用失败，使用传入的props数据作为后备
        initializeFormWithData(props.paper);
      } finally {
        isInitializing.value = false;
      }
    } else if (props.paper) {
      // 如果没有ID（新建基于现有论文的情况），直接使用props数据
      initializeFormWithData(props.paper);
    } else if (props.paperType) {
      // 新建模式：设置论文类型
      form.value.paper_type = props.paperType;
    }
  }; // 使用论文数据初始化表单的辅助函数
  const initializeFormWithData = async (paperData, workloadData = null) => {
    if (!paperData) return;

    // 填充基础数据
    form.value.title = paperData.title || "";
    form.value.abstract = paperData.abstract || "";
    form.value.doi = paperData.doi || "";

    // 处理期刊信息 - 优先使用journal_id，兼容journal字段
    if (paperData.journal_id) {
      form.value.journal_id = paperData.journal_id;
      form.value.journal = paperData.journal_name || paperData.journal || "";
    } else if (paperData.journal) {
      // 向后兼容：如果只有期刊名称，保留它
      form.value.journal = paperData.journal;
      form.value.journal_id = null;
    } else {
      form.value.journal = "";
      form.value.journal_id = null;
    }

    // 处理发表年份
    if (paperData.publication_year) {
      form.value.publication_year = paperData.publication_year;
    }

    // 处理发表日期
    if (paperData.publication_date) {
      const date = new Date(paperData.publication_date);
      form.value.publication_date = date.toISOString().split("T")[0];
    }

    // 处理作者信息
    if (paperData.authors) {
      if (Array.isArray(paperData.authors)) {
        form.value.author_names = paperData.authors
          .map((a) => a.name || a)
          .join(", ");
      } else if (typeof paperData.authors === "string") {
        form.value.author_names = paperData.authors;
      }
    }

    // 处理关键词
    if (paperData.keywords) {
      if (Array.isArray(paperData.keywords)) {
        form.value.keyword_names = paperData.keywords
          .map((k) => k.name || k)
          .join(", ");
      } else if (typeof paperData.keywords === "string") {
        form.value.keyword_names = paperData.keywords;
      }
    }

    // 处理分类 - 现在统一使用单个分类ID
    if (paperData.categories && Array.isArray(paperData.categories)) {
      // 如果有多个分类，取第一个
      form.value.category_id =
        paperData.categories[0]?.id || paperData.categories[0];
    } else if (paperData.category_id) {
      form.value.category_id = paperData.category_id;
    } // 初始化作者贡献比例和通讯作者（仅发表论文）
    console.log("Initializing author contributions...");
    console.log(
      "Current authorContributions.value:",
      authorContributions.value
    );
    console.log("workloadData structure:", workloadData);
    console.log("paperData structure for contributions:", {
      author_contribution_ratios: paperData.author_contribution_ratios,
      corresponding_author_name: paperData.corresponding_author_name,
    });

    // 重置贡献数据
    authorContributions.value = {
      contributions: [],
      correspondingAuthor: null,
    };

    // 处理工作量数据 - 检查正确的数据结构
    if (
      workloadData &&
      workloadData.workloads &&
      Array.isArray(workloadData.workloads)
    ) {
      console.log("Found workloads array:", workloadData.workloads);

      // 从 workloads 数组中提取贡献比例
      const contributions = workloadData.workloads.map(
        (workload) => workload.contribution_ratio || 0
      );
      console.log("Extracted contributions from workloads:", contributions); // 检查是否有通讯作者信息
      const correspondingAuthorWorkload = workloadData.workloads.find(
        (workload) => workload.is_corresponding
      );
      console.log(
        "Corresponding author workload:",
        correspondingAuthorWorkload
      );
      const correspondingAuthor = correspondingAuthorWorkload
        ? correspondingAuthorWorkload.author_name
        : null;
      console.log("Extracted corresponding author:", correspondingAuthor);

      authorContributions.value = {
        contributions: contributions,
        correspondingAuthor: correspondingAuthor,
      };
      console.log("Using workload data for author contributions");
    } else if (workloadData && workloadData.author_contribution_ratios) {
      // 处理旧格式的工作量数据
      console.log(
        "Using old format workload data for author contributions:",
        workloadData.author_contribution_ratios
      );
      authorContributions.value = {
        contributions: [...workloadData.author_contribution_ratios],
        correspondingAuthor: workloadData.corresponding_author_name || null,
      };
    } else if (
      paperData.author_contribution_ratios &&
      Array.isArray(paperData.author_contribution_ratios)
    ) {
      // 如果没有工作量数据，使用基本数据中的贡献比例
      console.log(
        "Using paper data for author contributions:",
        paperData.author_contribution_ratios
      );
      authorContributions.value = {
        contributions: [...paperData.author_contribution_ratios],
        correspondingAuthor: paperData.corresponding_author_name || null,
      };
    } else {
      console.log("No author contribution data found, resetting to default");
    }

    console.log("Final authorContributions.value:", authorContributions.value);
    // 使用 nextTick 确保数据在下一个 Vue 更新周期中生效
    await nextTick();
    console.log(
      "After nextTick, authorContributions.value:",
      authorContributions.value
    );

    // 强制触发响应式更新
    const temp = { ...authorContributions.value };
    authorContributions.value = temp;
    console.log(
      "After forced update, authorContributions.value:",
      authorContributions.value
    );
  };

  // 重置表单
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
      publication_year: null,
      category_id: "", // 使用单个分类ID
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
    isInitializing,
    initializeForm,
    resetForm,
  };
}
