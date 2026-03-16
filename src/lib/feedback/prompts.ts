/**
 * 反馈分析专属 Prompt
 */

export function buildDimensionPrompt(sampleFeedbacks: string[]): string {
  return `你是一位资深用户研究专家。以下是用户上传的反馈数据样本（共${sampleFeedbacks.length}条）。

请分析这些数据的特征，推荐 3-6 个最有价值的分析维度。

对每个维度说明：
1. name: 维度名称（简短，如"情感倾向"、"问题分类"）
2. description: 一句话说明分析这个维度的价值
3. supported: true/false，当前数据是否支持此维度
4. reason: 为什么支持或不支持

常见维度供参考（不限于此，根据数据特征灵活推荐）：
- 情感倾向：正面/负面/中立分布
- 问题分类：功能缺陷、体验问题、性能问题、需求建议等
- 优先级评估：按频次和情感强度综合评分
- 功能模块归属：反馈涉及产品的哪个模块/功能
- 用户画像标签：如果数据含用户信息
- 时间趋势：如果数据含时间信息

严格以 JSON 数组格式返回，不要包含其他文字：
[{"name":"...","description":"...","supported":true,"reason":"..."}]

## 反馈样本数据
${sampleFeedbacks.map((f, i) => `${i + 1}. ${f}`).join("\n")}`;
}

export function buildAnalysisPrompt(
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

## 输出要求
严格以 JSON 格式返回，不要包含其他文字。JSON 结构如下：

{
  "summary": {
    "total": 原始总条数,
    "valid": 清洗后有效条数,
    "deduplicated": 去重后条数
  },
  "categories": [
    { "name": "分类名", "count": 数量, "percent": 百分比(保留1位小数), "feedbackIds": [0,3,7] }
  ],
  "sentiments": {
    "positive": { "count": 数量, "percent": 百分比 },
    "negative": { "count": 数量, "percent": 百分比 },
    "neutral": { "count": 数量, "percent": 百分比 }
  },
  "topIssues": [
    { "issue": "问题描述", "count": 出现次数, "sentiment": "negative/positive/neutral", "keywords": ["关键词1","关键词2"] }
  ],
  "keywords": [
    { "word": "关键词", "count": 出现次数 }
  ],
  "feedbacks": [
    { "id": 原始序号(从0开始), "content": "原始内容", "category": "所属分类", "sentiment": "positive/negative/neutral", "sentimentScore": -1到1的浮点数, "keywords": ["关键词"] }
  ]
}

注意：
- topIssues 最多返回 10 条，按 count 降序
- keywords 最多返回 20 个，按 count 降序
- feedbacks 中的 id 对应原始数据的序号
- percent 都保留 1 位小数
- 所有分类名称使用中文

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
