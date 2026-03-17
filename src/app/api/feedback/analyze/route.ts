import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildTableAnalysisPrompt, buildTextAnalysisPrompt } from "@/lib/feedback/prompts";
import { extractJsonObject } from "@/lib/feedback/json-utils";

// 延长超时到 120 秒
export const maxDuration = 120;

interface DimensionInfo {
  name: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "sentiment" | "keyword";
  presetValues?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, apiKey, dimensions, isTable } = body;

    if (!dimensions?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (isTable) {
      // 表格分析
      const { tableData, headers } = body;
      if (!tableData?.length || !headers?.length) {
        return NextResponse.json({ error: "缺少表格数据" }, { status: 400 });
      }

      const dims = dimensions as DimensionInfo[];

      // 分批处理（>300 行时分批）
      const BATCH_SIZE = 300;
      if (tableData.length <= BATCH_SIZE) {
        const prompt = buildTableAnalysisPrompt(tableData, dims, headers);
        console.log("[feedback/analyze] prompt length:", prompt.length, "chars");

        const result = await callAI(
          { model, apiKey },
          [{ role: "user", content: prompt }],
          { maxTokens: 8192, temperature: 0.2 }
        );

        console.log("[feedback/analyze] raw response (first 300):", result.slice(0, 300));
        const analysis = extractJsonObject(result);
        return NextResponse.json(analysis);
      }

      // 分批：先分析第一批，然后合并
      const firstBatch = tableData.slice(0, BATCH_SIZE);
      const prompt = buildTableAnalysisPrompt(firstBatch, dims, headers);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      const analysis = extractJsonObject(result);

      // 后续批次简化处理：只统计分类列分布（不需要 AI）
      // 因为分类列的分布可以在本地计算
      if (analysis.dimensions && Array.isArray(analysis.dimensions)) {
        for (const dim of analysis.dimensions as Array<{ type: string; column: string; data: Array<{ label: string; count: number; percent: number }> }>) {
          if (dim.type === "distribution") {
            // 重新用全量数据计算分布
            const fullCounts: Record<string, number> = {};
            for (const row of tableData) {
              const val = row[dim.column] || "(空)";
              fullCounts[val] = (fullCounts[val] || 0) + 1;
            }
            dim.data = Object.entries(fullCounts)
              .map(([label, count]) => ({
                label,
                count,
                percent: Math.round((count / tableData.length) * 1000) / 10,
              }))
              .sort((a, b) => b.count - a.count);
          }
        }
        // 更新 summary
        (analysis.summary as Record<string, number>).total = tableData.length;
        (analysis.summary as Record<string, number>).analyzed = tableData.length;
      }

      return NextResponse.json(analysis);
    } else {
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

      const analysis = extractJsonObject(result);
      return NextResponse.json(analysis);
    }
  } catch (error) {
    console.error("[feedback/analyze]", error);
    const msg = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: "分析失败: " + msg },
      { status: 500 }
    );
  }
}
