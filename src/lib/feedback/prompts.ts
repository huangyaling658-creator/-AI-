/**
 * 反馈分析专属 Prompt
 */

interface DimensionInfo {
  name: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "painpoint";
  presetValues?: string[];
}

/**
 * 构建 AI 分析 prompt — 只让 AI 做语义分析（分类 + 痛点总结）
 * 分类列的分布统计在本地完成，不浪费 AI 的 token
 */
export function buildAIAnalysisPrompt(
  rows: Record<string, string>[],
  aiDimensions: DimensionInfo[],
  headers: string[]
): string {
  const tasks: string[] = [];
  let taskIdx = 1;

  for (const d of aiDimensions) {
    if (d.analysisType === "classification") {
      tasks.push(`${taskIdx}. 【${d.name}】对「${d.column}」列的每条内容进行问题类型分类。
   分类标准（请严格使用以下类别，可新增但不超过 10 个）：
   - 功能使用问题：用户不知道怎么用某功能，或操作后效果不符合预期
   - UI/显示问题：界面显示异常、布局错乱、样式丢失
   - 功能缺失/需求：用户需要的功能不存在或不够完善
   - Bug/异常：崩溃、报错、网络异常、数据丢失等技术故障
   - 兼容性问题：跨平台、跨版本、跨软件的兼容问题
   - 咨询求助：纯粹的操作咨询，不涉及问题
   输出：每条数据的分类结果 + 各类别的数量统计`);
      taskIdx++;
    }

    if (d.analysisType === "painpoint") {
      const parts = d.column.split("|");
      const textCol = parts[0];
      const groupCol = parts.length > 1 ? parts[1] : null;

      if (groupCol) {
        tasks.push(`${taskIdx}. 【${d.name}】按「${groupCol}」列分组，对每组中的「${textCol}」内容做痛点提炼：
   - painPoints：该分类下用户最痛的 3-5 个具体问题（要具体，不要笼统）
   - needs：基于痛点推导的产品改进建议（可落地的）
   只对数量 >= 3 的分组做总结`);
      } else {
        tasks.push(`${taskIdx}. 【${d.name}】对全部「${textCol}」内容做痛点提炼：
   - painPoints：用户最痛的 5-8 个具体问题
   - needs：基于痛点推导的产品改进建议`);
      }
      taskIdx++;
    }
  }

  if (tasks.length === 0) return "";

  // 只发送 AI 需要的列数据（节省 token）
  const neededCols = new Set<string>();
  for (const d of aiDimensions) {
    d.column.split("|").forEach((c) => neededCols.add(c));
  }
  const relevantHeaders = headers.filter((h) => neededCols.has(h));

  const dataLines = rows.map((row, i) => {
    const vals = relevantHeaders.map((h) => row[h] || "").join(" | ");
    return `[${i}] ${vals}`;
  }).join("\n");

  return `你是一位资深产品经理和用户研究专家。请对以下用户反馈数据进行深度分析。

## 数据说明
相关列: ${relevantHeaders.join(" | ")}
总行数: ${rows.length}

## 分析任务
${tasks.join("\n\n")}

## 输出要求（严格遵守）
1. 只返回纯 JSON 对象，禁止用 markdown 代码块包裹
2. 禁止在 JSON 前后添加任何解释文字
3. 所有字符串值中禁止包含换行符和双引号，用空格和中文引号替代

JSON 结构：
{
  "classification": {
    "items": [{"id": 0, "type": "功能使用问题"}, {"id": 1, "type": "Bug/异常"}],
    "summary": [{"label": "功能使用问题", "count": 数字, "percent": 数字}]
  },
  "painpoints": [
    {"group": "分组名", "count": 数字, "painPoints": ["痛点1", "痛点2"], "needs": ["建议1", "建议2"]}
  ],
  "topInsights": ["整体洞察1", "整体洞察2", "整体洞察3"]
}

注意：
- 如果没有 classification 任务，classification 字段返回 null
- 如果没有 painpoint 任务，painpoints 字段返回 null
- topInsights 必须返回 3 条最重要的整体分析洞察，帮助产品经理做决策
- percent 保留 1 位小数

## 数据
${dataLines}`;
}

/**
 * 构建纯文本分析 prompt（非表格场景）
 */
export function buildTextAnalysisPrompt(
  feedbacks: string[],
  dimensions: string[]
): string {
  return `你是一位资深用户研究专家，请对以下用户反馈数据进行深度分析。

## 数据清洗规则
1. 去除完全重复的反馈
2. 过滤无意义内容（纯表情、单字回复如"好""嗯""OK"）

## 分析维度
${dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## 输出要求（严格遵守）
1. 只返回纯 JSON 对象，禁止用 markdown 代码块包裹
2. 所有字符串值中禁止包含换行符和双引号

JSON 结构：
{"classification":{"items":[{"id":0,"type":"分类"}],"summary":[{"label":"分类","count":数字,"percent":数字}]},"painpoints":[{"group":"总体","count":${feedbacks.length},"painPoints":["痛点"],"needs":["建议"]}],"topInsights":["洞察1","洞察2","洞察3"]}

## 反馈数据（共${feedbacks.length}条）
${feedbacks.map((f, i) => `[${i}] ${f}`).join("\n")}`;
}

export function buildMergeFieldPrompt(
  files: Array<{ fileName: string; headers: string[]; sampleRows: string[][] }>
): string {
  return `你是数据分析专家。以下是用户上传的多份反馈数据文件，每份文件有不同的列名。

请识别每份文件中哪一列最可能是"用户反馈内容"（如评论、意见、建议等）。

严格以 JSON 数组格式返回，不要包含其他文字：
[{"fileName":"文件名","feedbackColumn":"列名"}]

## 文件信息
${files
  .map(
    (f) =>
      `### ${f.fileName}\n列名: ${f.headers.join(", ")}\n示例数据:\n${f.sampleRows
        .slice(0, 3)
        .map((r) => r.join(" | "))
        .join("\n")}`
  )
  .join("\n\n")}`;
}

export function buildImageOCRPrompt(): string {
  return `请识别这张图片中的所有文字内容。如果图片包含用户反馈、评论或意见类的内容，请逐条提取。

以 JSON 数组格式返回每条反馈文本：
["反馈1", "反馈2", ...]

如果图片中没有可识别的反馈内容，返回空数组 []`;
}
