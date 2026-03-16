# 反馈分析模块 — 技术设计文档

## 1. 架构概览

```
┌──────────────────────────────────────────────────────┐
│                    前端 (React 19)                     │
│                                                        │
│  FeedbackPage (步骤容器)                                │
│    ├── UploadStep      文件上传 + 解析                   │
│    ├── PreviewStep     数据预览 + 多文件合并确认          │
│    ├── DimensionStep   AI推荐维度 + 自定义维度            │
│    ├── AnalysisStep    分析执行 + 进度展示                │
│    ├── ResultStep      结果展示 + 标注数据下载            │
│    └── ChartStep       图表呈现 + 原文溯源 + 报告导出     │
└──────────────────┬───────────────────────────────────┘
                   │ API Routes
┌──────────────────▼───────────────────────────────────┐
│                 Next.js API Routes                     │
│                                                        │
│  /api/feedback/parse      文件解析 → 提取文本            │
│  /api/feedback/dimensions AI推荐分析维度                 │
│  /api/feedback/analyze    执行完整分析                    │
│  /api/feedback/export     生成下载文件                    │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│              AI Provider (用户自带 Key)                 │
│  Anthropic / OpenAI / DeepSeek / OpenRouter            │
└──────────────────────────────────────────────────────┘
```

## 2. 技术栈

### 2.1 新增依赖

| 包名 | 用途 | 版本 |
|------|------|------|
| `xlsx` | Excel (.xlsx) 读写 | ^0.18 |
| `pdf-parse` | PDF 文本提取 | ^1.1 |
| `mammoth` | Word (.docx) 文本提取 | ^1.8 |
| `recharts` | 图表渲染（柱状图、饼图、情感分布） | ^2.15 |
| `d3-cloud` | 词云图生成 | ^1.2 |
| `jspdf` + `html2canvas` | PDF 报告导出 | latest |

### 2.2 已有技术栈
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- better-sqlite3 (用户认证)
- 用户 API Key 存储在 localStorage (`useSettings` hook)

## 3. 文件结构

```
src/
├── app/
│   ├── feedback/
│   │   └── page.tsx              # 重写：步骤容器 + 状态管理
│   └── api/
│       └── feedback/
│           ├── parse/route.ts    # 文件解析 API
│           ├── dimensions/route.ts # 维度推荐 API
│           ├── analyze/route.ts  # 分析执行 API
│           └── export/route.ts   # 文件导出 API
├── components/
│   └── feedback/
│       ├── UploadStep.tsx        # 文件上传组件
│       ├── PreviewStep.tsx       # 数据预览组件
│       ├── DimensionStep.tsx     # 维度选择组件
│       ├── AnalysisStep.tsx      # 分析进度组件
│       ├── ResultStep.tsx        # 结果展示组件
│       ├── ChartStep.tsx         # 图表呈现组件
│       └── FeedbackCharts.tsx    # 图表子组件集合
└── lib/
    ├── file-parser.ts            # 文件解析工具
    ├── ai-client.ts              # AI 统一调用封装
    └── feedback-prompts.ts       # 反馈分析专属 Prompt
```

## 4. 核心模块设计

### 4.1 文件解析 (`/api/feedback/parse`)

**输入：** multipart/form-data，支持多文件上传

**处理流程：**
```
文件上传 → 按格式分发解析器 → 提取文本/结构化数据 → 返回统一格式
```

**各格式解析策略：**

```typescript
// CSV/Excel → 结构化表格
interface ParsedTable {
  type: "table";
  headers: string[];
  rows: string[][];
  fileName: string;
}

// TXT/PDF/Word → 纯文本段落
interface ParsedText {
  type: "text";
  paragraphs: string[];
  fileName: string;
}

// 图片 → 通过 AI 视觉能力提取文字
interface ParsedImage {
  type: "image";
  base64: string;  // 传给 AI 做 OCR
  fileName: string;
}

type ParsedFile = ParsedTable | ParsedText | ParsedImage;
```

**多文件合并逻辑：**
```typescript
// 1. 解析所有文件
// 2. 对表格类文件，AI 识别"反馈内容"字段
// 3. 返回字段映射建议 + 合并后的统一数据
interface MergeResult {
  files: Array<{
    fileName: string;
    type: string;
    rowCount: number;
    feedbackColumn?: string;  // AI 识别的反馈字段
  }>;
  mergedFeedbacks: string[];  // 合并后的反馈文本列表
  totalCount: number;
  preview: string[];  // 前 10 条预览
}
```

### 4.2 AI 统一调用封装 (`lib/ai-client.ts`)

封装多 Provider 调用，根据用户 settings 中的 model 和 apiKey 路由到对应 API。

```typescript
interface AIClientConfig {
  model: string;
  apiKey: string;
}

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; ... }>;
}

async function callAI(
  config: AIClientConfig,
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string>
```

**Provider 路由逻辑：**
- `claude-*` → Anthropic Messages API
- `gpt-*` / `o1-*` / `o3-*` → OpenAI Chat Completions API
- `deepseek-*` → DeepSeek Chat API (OpenAI 兼容)
- `openrouter/*` / `*openrouter*` → OpenRouter API (OpenAI 兼容)

### 4.3 反馈分析 Prompt (`lib/feedback-prompts.ts`)

#### 4.3.1 维度推荐 Prompt

```
你是一位资深用户研究专家。以下是用户上传的反馈数据样本（前20条）。

请分析这些数据，推荐 3-6 个最有价值的分析维度。对每个维度说明：
1. 维度名称
2. 一句话说明分析价值
3. 该数据是否支持此维度（supported: true/false + 原因）

以 JSON 格式返回：
[{ "name": "...", "description": "...", "supported": true, "reason": "..." }]
```

#### 4.3.2 分析执行 Prompt

```
你是一位资深用户研究专家，请对以下用户反馈数据进行深度分析。

## 数据清洗规则
1. 去除重复或极度相似的反馈
2. 过滤无意义内容（纯表情、单字回复如"好""嗯"、无关广告等）
3. 合并表述不同但含义相同的反馈

## 分析维度
{用户选择的维度列表}

## 输出要求
以 JSON 格式返回，包含：
1. summary: 清洗统计（原始数量、有效数量、去重数量）
2. categories: 各分类 { name, count, percent, feedbackIds[] }
3. sentiments: 情感分布 { positive, negative, neutral } 含数量和占比
4. topIssues: 高频问题 Top10 { issue, count, sentiment, keywords[] }
5. keywords: 高频关键词 { word, count }[]
6. feedbacks: 每条反馈的标注 { id, content, category, sentiment, sentimentScore, keywords[] }

## 反馈数据
{反馈数据}
```

### 4.4 图表呈现 (Recharts)

使用 Recharts 渲染以下图表：

| 组件 | 图表类型 | 数据来源 |
|------|----------|----------|
| `<PieChart>` | 饼图 | categories（分类占比） |
| `<BarChart>` | 柱状图 | categories（分类数量） |
| `<PieChart>` | 环形图 | sentiments（情感分布） |
| 自定义 | 词云 | keywords（高频关键词） |
| 列表组件 | Top N | topIssues（高频问题） |

**原文溯源：** 图表中每个分类/问题可点击，展开显示 `feedbackIds` 对应的原始反馈列表。

### 4.5 文件导出 (`/api/feedback/export`)

**标注数据下载：**
- 根据上传格式决定导出格式
- CSV 上传 → 导出 CSV（新增标注列）
- Excel 上传 → 导出 Excel（新增标注列）
- 其他格式 → 默认导出 CSV
- 新增列：分类、情感倾向、情感分数、关键词、优先级

**报告导出：**
- 前端使用 `html2canvas` 截取图表区域
- 使用 `jsPDF` 生成 PDF，包含：概要信息 + 图表截图 + Top 10 列表

## 5. 数据流

```
         ┌─────────┐
         │  上传文件  │
         └────┬────┘
              │ POST /api/feedback/parse
              │ (multipart/form-data)
              ▼
     ┌────────────────┐
     │  服务端文件解析    │  xlsx / pdf-parse / mammoth
     │  + 多文件合并     │  AI识别反馈字段
     └───────┬────────┘
             │ 返回 ParsedData + MergeResult
             ▼
     ┌────────────────┐
     │  用户确认预览     │  前端展示
     └───────┬────────┘
             │ POST /api/feedback/dimensions
             │ (前20条样本 + model + apiKey)
             ▼
     ┌────────────────┐
     │  AI 推荐维度     │  ≤ 2秒
     └───────┬────────┘
             │ 用户选择维度
             │ POST /api/feedback/analyze
             │ (全量数据 + 维度 + model + apiKey)
             ▼
     ┌────────────────┐
     │  AI 执行分析     │  ≤ 10秒
     │  语义聚类        │
     │  情感分析        │
     │  频次统计        │
     └───────┬────────┘
             │ 返回 AnalysisResult
             ▼
     ┌────────────────┐
     │  图表渲染        │  Recharts + 词云
     │  结果展示        │  原文溯源
     │  下载/导出       │  CSV/Excel + PDF报告
     └────────────────┘
```

## 6. API 接口设计

### 6.1 POST `/api/feedback/parse`

**Request:** `multipart/form-data`
- `files`: File[] — 上传的文件（1-10份）

**Response:**
```json
{
  "files": [
    { "fileName": "appstore.csv", "type": "table", "rowCount": 234, "feedbackColumn": "评论内容" },
    { "fileName": "tickets.xlsx", "type": "table", "rowCount": 89, "feedbackColumn": "工单描述" }
  ],
  "mergedFeedbacks": ["反馈1", "反馈2", ...],
  "totalCount": 323,
  "preview": ["反馈1", "反馈2", ..., "反馈10"]
}
```

### 6.2 POST `/api/feedback/dimensions`

**Request:**
```json
{
  "sample": ["反馈1", "反馈2", ..., "反馈20"],
  "model": "claude-sonnet",
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "dimensions": [
    { "name": "情感倾向", "description": "分析正面/负面/中立分布", "supported": true, "reason": "数据包含明确的情感表达" },
    { "name": "时间趋势", "description": "分析反馈随时间的变化", "supported": false, "reason": "数据中未包含时间字段" }
  ]
}
```

### 6.3 POST `/api/feedback/analyze`

**Request:**
```json
{
  "feedbacks": ["反馈1", "反馈2", ...],
  "dimensions": ["情感倾向", "问题分类", "优先级评估"],
  "model": "claude-sonnet",
  "apiKey": "sk-..."
}
```

**Response:**
```json
{
  "summary": { "total": 323, "valid": 298, "deduplicated": 275 },
  "categories": [
    { "name": "功能需求", "count": 87, "percent": 31.6, "feedbackIds": [0, 3, 7, ...] }
  ],
  "sentiments": {
    "positive": { "count": 82, "percent": 29.8 },
    "negative": { "count": 143, "percent": 52.0 },
    "neutral": { "count": 50, "percent": 18.2 }
  },
  "topIssues": [
    { "issue": "加载速度慢", "count": 45, "sentiment": "negative", "keywords": ["加载", "慢", "卡顿"] }
  ],
  "keywords": [
    { "word": "加载", "count": 67 },
    { "word": "功能", "count": 52 }
  ],
  "feedbacks": [
    { "id": 0, "content": "原始反馈文本", "category": "功能需求", "sentiment": "negative", "sentimentScore": -0.7, "keywords": ["加载", "慢"] }
  ]
}
```

### 6.4 POST `/api/feedback/export`

**Request:**
```json
{
  "feedbacks": [...],
  "format": "csv"
}
```

**Response:** 文件流下载（Content-Disposition: attachment）

## 7. 性能考量

| 场景 | 策略 |
|------|------|
| 大文件上传 | 前端分片上传，API Route 使用 stream 处理 |
| AI 调用超时 | 500条以内一次调用；超500条分批调用后合并 |
| 图表渲染 | Recharts 懒加载，数据量大时采样展示 |
| 图片 OCR | 利用模型多模态能力，图片直接作为 message content 发送 |

## 8. 安全考量

- API Key 仅在前端 localStorage 存储，由前端传给 API Route，API Route 转发至 AI Provider，不做任何持久化
- 上传文件仅在内存中处理，不写入磁盘
- 分析结果不做服务端持久化（MVP阶段）
