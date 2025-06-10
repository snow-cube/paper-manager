import { ref, computed } from "vue";
import {
  createPaper,
  updatePaper,
  createReference,
  updateReference,
  uploadPaperFile,
  uploadReference,
} from "../services/api";
import { useToast } from "./useToast";
import { useAuth } from "./useAuth";
import { useTeam } from "./useTeam";

export function usePaperFormData(form, file, authorContributions) {
  const submitting = ref(false);
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { currentTeam } = useTeam();

  // 转换作者名称
  const processAuthors = (authorNames, paperType) => {
    if (!authorNames) return paperType === "published" ? [] : "";

    const authors = authorNames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    return paperType === "published" ? authors : authors.join(", ");
  };

  // 转换关键词
  const processKeywords = (keywordNames) => {
    if (!keywordNames) return [];
    return keywordNames
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  };

  // 转换分类ID
  const processCategories = (categoryIds, paperType) => {
    if (paperType === "published") {
      return Array.isArray(categoryIds)
        ? categoryIds
        : categoryIds
        ? [categoryIds]
        : [];
    } else {
      return Array.isArray(categoryIds) ? categoryIds[0] : categoryIds;
    }
  };  // 准备发表论文数据
  const preparePaperData = (form, authorContributions) => {
    return {
      title: form.title,
      abstract: form.abstract || null,
      publication_date: form.publication_date || null,
      journal_id: form.journal_id || null, // 使用期刊ID而不是期刊名称
      doi: form.doi || null,
      author_names: processAuthors(form.author_names, "published"),
      category_ids: processCategories(form.category_ids, "published"),
      keyword_names: processKeywords(form.keyword_names),
      author_contribution_ratios: authorContributions.contributions?.some(
        (contrib) => contrib > 0
      )
        ? [...authorContributions.contributions]
        : undefined,
      corresponding_author_name:
        authorContributions.correspondingAuthor || null,
      team_id: currentTeam?.value?.id,
    };
  };

  // 准备参考文献数据
  const prepareReferenceData = (form, currentTeam, currentUser) => {
    return {
      title: form.title,
      authors: processAuthors(form.author_names, "literature"),
      doi: form.doi || null,
      team_id: currentTeam?.id,
      category_id: processCategories(form.category_ids, "literature"),
      keyword_names: processKeywords(form.keyword_names),
      created_by_id: currentUser?.id,
    };
  };

  // 创建发表论文
  const createPaperWithFile = async (paperData, file) => {
    const savedPaper = await createPaper(paperData);
    if (file) {
      await uploadPaperFile(savedPaper.id, file);
    }
    return savedPaper;
  };

  // 创建参考文献
  const createReferenceWithFile = async (referenceData, file) => {
    const savedReference = await createReference(referenceData);
    if (file) {
      await uploadReference(savedReference.id, file);
    }
    return savedReference;
  };

  // 更新发表论文
  const updatePaperData = async (paperId, paperData) => {
    return await updatePaper(paperId, paperData);
  };

  // 更新参考文献
  const updateReferenceData = async (referenceId, referenceData) => {
    return await updateReference(referenceId, referenceData);
  }; // 主要的提交处理函数
  const handleSubmit = async (props, isEdit) => {
    if (!form?.value) {
      showToast("表单数据不可用", "error");
      throw new Error("表单数据不可用");
    }

    submitting.value = true;

    try {
      const paperType = form.value.paper_type;
      let result;

      if (paperType === "published") {
        // 验证团队选择（发表论文必须选择团队）
        if (!currentTeam?.value) {
          showToast("发表论文必须选择团队", "error");
          throw new Error("发表论文必须选择团队");
        }

        // 处理发表论文
        const paperData = preparePaperData(
          form.value,
          authorContributions?.value || []
        );        if (isEdit && props.paper?.id) {
          result = await updatePaperData(props.paper.id, paperData);

          // 如果有新文件需要上传，单独处理文件上传
          if (file?.value) {
            try {
              await uploadPaperFile(props.paper.id, file.value);
              showToast("论文更新成功，文件上传成功", "success");
            } catch (uploadError) {
              console.error("文件上传失败:", uploadError);
              showToast("论文更新成功，但文件上传失败", "warning");
            }
          } else {
            showToast("论文更新成功", "success");
          }
        } else {
          result = await createPaperWithFile(paperData, file?.value);
          showToast("论文添加成功", "success");
        }
      } else if (paperType === "literature") {
        // 处理文献引用
        const referenceData = prepareReferenceData(
          form.value,
          currentTeam?.value,
          currentUser?.value
        );        if (isEdit && props.paper?.id) {
          result = await updateReferenceData(props.paper.id, referenceData);

          // 如果有新文件需要上传，单独处理文件上传
          if (file?.value) {
            try {
              await uploadReference(props.paper.id, file.value);
              showToast("文献更新成功，文件上传成功", "success");
            } catch (uploadError) {
              console.error("文件上传失败:", uploadError);
              showToast("文献更新成功，但文件上传失败", "warning");
            }
          } else {
            showToast("文献更新成功", "success");
          }
        } else {
          result = await createReferenceWithFile(referenceData, file?.value);
          showToast("文献添加成功", "success");
        }
      } else {
        throw new Error("请选择论文类型");
      }

      return result;
    } catch (error) {
      console.error("提交失败:", error);
      showToast(error.message || "提交失败，请重试", "error");
      throw error;
    } finally {
      submitting.value = false;
    }
  };

  return {
    submitting,
    handleSubmit,
    preparePaperData,
    prepareReferenceData,
    createPaperWithFile,
    createReferenceWithFile,
    updatePaperData,
    updateReferenceData,
    processAuthors,
    processKeywords,
    processCategories,
  };
}
