import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildAIAnalysisPrompt, buildTextAnalysisPrompt } from "@/lib/feedback/prompts";
import { extractJsonObject } from "@/lib/feedback/json-utils";

export const maxDuration = 120;

interface DimensionInfo {
  name: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "painpoint";
  presetValues?: string[];
}

/** 本地计算分类列分布 */
function computeDistribution(
  rows: Record<string, string>[],
  column: string
): Array<{ label: string; count: number; percent: number }> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = row[column] || "(空)";
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / rows.length) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

/** 本地计算交叉分布 */
function computeCross(
  rows: Record<string, string>[],
  colA: string,
  colB: string
): Array<{ label: string; count: number; percent: number }> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const a = row[colA] || "(空)";
    const b = row[colB] || "(空)";
    const key = `${a} × ${b}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / rows.length) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, apiKey, dimensions, isTable } = body;

    if (!dimensions?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (!isTable) {
      // 纯文本分析
      const { textFeedbacks } = body;
      if (!textFeedbacks?.length) {
        return NextResponse.json({ error: "缺少反馈数据" }, { status: 400 });
      }
      const dimNames = dimensions.map((d: DimensionInfo) => d.name);
      const prompt = buildTextAnalysisPrompt(textFeedbacks, dimNames);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );
      const aiResult = extractJsonObject(result);
      return NextResponse.json(aiResult);
    }

    // ===== 表格分析 =====
    const { tableData, headers } = body;
    if (!tableData?.length || !headers?.length) {
      return NextResponse.json({ error: "缺少表格数据" }, { status: 400 });
    }

    const dims = dimensions as DimensionInfo[];
    const result: Record<string, unknown> = {
      summary: { total: tableData.length, analyzed: tableData.length },
      dimensions: [],
      painpoints: null,
      topInsights: [],
    };

    const resultDims: Array<Record<string, unknown>> = [];

    // 1. 本地计算：分类列分布 + 交叉分析
    for (const dim of dims) {
      if (dim.analysisType === "distribution") {
        const data = computeDistribution(tableData, dim.column);
        resultDims.push({
          name: dim.name,
          column: dim.column,
          type: "distribution",
          data,
          insight: `最多的是「${data[0]?.label}」(${data[0]?.percent}%)，共 ${data.length} 个类别`,
        });
      } else if (dim.analysisType === "cross") {
        const [colA, colB] = dim.column.split("|");
        const data = computeCross(tableData, colA, colB);
        resultDims.push({
          name: dim.name,
          column: dim.column,
          type: "cross",
          data: data.slice(0, 20), // 交叉组合可能很多，只取 Top20
          insight: `最常见的组合是「${data[0]?.label}」(${data[0]?.count}次)`,
        });
      }
    }

    // 2. AI 分析：语义分类 + 痛点总结
    const aiDims = dims.filter((d) => d.analysisType === "classification" || d.analysisType === "painpoint");

    if (aiDims.length > 0) {
      const prompt = buildAIAnalysisPrompt(tableData, aiDims, headers);
      console.log("[feedback/analyze] AI prompt length:", prompt.length, "chars");

      const aiResponse = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      console.log("[feedback/analyze] AI response (first 500):", aiResponse.slice(0, 500));
      const aiResult = extractJsonObject(aiResponse);

      // 合并分类结果
      const classification = aiResult.classification as {
        items?: Array<{ id: number; type: string }>;
        summary?: Array<{ label: string; count: number; percent: number }>;
      } | null;

      if (classification?.summary) {
        const classifyDim = aiDims.find((d) => d.analysisType === "classification");
        resultDims.push({
          name: classifyDim?.name || "问题类型分类",
          column: classifyDim?.column || "",
          type: "classification",
          data: classification.summary,
          insight: `最多的问题类型是「${classification.summary[0]?.label}」(${classification.summary[0]?.percent}%)`,
        });
      }

      // 合并痛点
      result.painpoints = aiResult.painpoints || null;
      result.topInsights = aiResult.topInsights || [];
    }

    result.dimensions = resultDims;
    return NextResponse.json(result);
  } catch (error) {
    console.error("[feedback/analyze]", error);
    const msg = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: "分析失败: " + msg },
      { status: 500 }
    );
  }
}
