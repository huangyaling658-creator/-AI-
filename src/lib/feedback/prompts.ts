/**
 * 反馈分析专属 Prompt
 */

interface DimensionInfo {
  name: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "sentiment" | "keyword";
  presetValues?: string[];
}

/**
 * 构建表格分析 prompt — 核心 prompt
 * 按用户选择的维度，对表格数据进行精准的列级分析
 */
export function buildTableAnalysisPrompt(
  rows: Record<string, string>[],
  dimensions: DimensionInfo[],
  headers: string[]
): string {
  // 构建维度分析指令
  const dimInstructions = dimensions.map((d, i) => {
    switch (d.analysisType) {
      case "distribution":
        return `${i + 1}. 【${d.name}】统计「${d.column}」列每个值的数量和百分比。${d.presetValues ? "已知类别: " + d.presetValues.join("、") : ""}`;
      case "classification":
        return `${i + 1}. 【${d.name}】对「${d.column}」列的内容进行语义分类，归纳出 5-15 个类别（如：改写、起草、总结、提问、纠错、排版、图片生成等），统计每个类别的数量和百分比`;
      case "cross":
        const [colA, colB] = d.column.split("|");
        return `${i + 1}. 【${d.name}】统计「${colA}」与「${colB}」的交叉分布，每个组合的数量`;
      case "sentiment":
        return `${i + 1}. 【${d.name}】对「${d.column}」列进行情感分析，统计正面/负面/中立的数量和百分比`;
      case "keyword":
        return `${i + 1}. 【${d.name}】从「${d.column}」列提取 Top20 高频关键词，统计每个关键词出现次数`;
      default:
        return `${i + 1}. 【${d.name}】分析「${d.column}」列`;
    }
  }).join("\n");

  // 将行数据序列化（紧凑格式减少 token）
  const dataLines = rows.map((row, i) => {
    const vals = headers.map((h) => row[h] || "").join(" | ");
    return `[${i}] ${vals}`;
  }).join("\n");

  return `你是一位资深数据分析师。请对以下表格数据进行精准分析。

## 表格结构
列名: ${headers.join(" | ")}
总行数: ${rows.length}

## 分析任务
${dimInstructions}

## 输出要求（严格遵守）
1. 只返回纯 JSON 对象，禁止用 markdown 代码块包裹
2. 禁止在 JSON 前后添加任何解释文字
3. 所有字符串值中禁止包含换行符和双引号，用空格和中文引号替代

JSON 结构：
{"summary":{"total":${rows.length},"analyzed":数字},"dimensions":[{"name":"维度名","column":"列名","type":"distribution/classification/cross/sentiment/keyword","data":[{"label":"分类名","count":数字,"percent":数字}],"insight":"一句话结论"}],"topInsights":["洞察1","洞察2","洞察3"]}

字段说明：
- dimensions: 每个分析维度的结果，data 数组按 count 降序排列
- 对于 cross 类型，label 格式为 "值A × 值B"
- percent 保留 1 位小数
- insight: 每个维度的一句话核心发现
- topInsights: 整体 Top3 最重要的分析洞察，帮助产品经理做决策

## 表格数据
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

## 数据清洗规则（分析前先执行）
1. 去除完全重复的反馈
2. 过滤无意义内容（纯表情、单字回复如"好""嗯""OK"、无关广告等）
3. 合并表述不同但含义相同的反馈（保留一条，计入频次）

## 分析维度
${dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## 输出要求（严格遵守）
1. 只返回纯 JSON 对象，禁止用 markdown 代码块包裹
2. 禁止在 JSON 前后添加任何解释文字
3. 所有字符串值中禁止包含换行符和双引号，用空格和中文引号替代

JSON 结构：
{"summary":{"total":${feedbacks.length},"valid":数字,"deduplicated":数字},"dimensions":[{"name":"维度名","type":"classification","data":[{"label":"分类名","count":数字,"percent":数字}],"insight":"一句话结论"}],"topInsights":["洞察1","洞察2","洞察3"]}

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
