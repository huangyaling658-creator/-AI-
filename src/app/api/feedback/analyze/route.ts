import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildAnalysisPrompt } from "@/lib/feedback/prompts";
import { extractJsonObject } from "@/lib/feedback/json-utils";

// 延长超时到 120 秒（大数据量分析需要更多时间）
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { feedbacks, dimensions, model, apiKey } = await request.json();

    if (!feedbacks?.length || !dimensions?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 如果数据量超过 300 条，分批处理（减小单次 token 量避免截断）
    const BATCH_SIZE = 300;
    if (feedbacks.length <= BATCH_SIZE) {
      const prompt = buildAnalysisPrompt(feedbacks, dimensions);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      const analysis = extractJsonObject(result);
      return NextResponse.json(analysis);
    }

    // 分批处理
    const batches: string[][] = [];
    for (let i = 0; i < feedbacks.length; i += BATCH_SIZE) {
      batches.push(feedbacks.slice(i, i + BATCH_SIZE));
    }

    // 先分析第一批获取完整结构
    const firstPrompt = buildAnalysisPrompt(batches[0], dimensions);
    const firstResult = await callAI(
      { model, apiKey },
      [{ role: "user", content: firstPrompt }],
      { maxTokens: 8192, temperature: 0.2 }
    );

    const merged = extractJsonObject(firstResult) as Record<string, unknown>;

    // 后续批次分析并合并
    for (let b = 1; b < batches.length; b++) {
      const prompt = buildAnalysisPrompt(batches[b], dimensions);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      try {
        const batch = extractJsonObject(result);
        const batchFeedbacks = batch.feedbacks as Array<{ id: number }> | undefined;
        const mergedFeedbacks = merged.feedbacks as Array<{ id: number }> | undefined;
        if (batchFeedbacks && mergedFeedbacks) {
          const offset = b * BATCH_SIZE;
          batchFeedbacks.forEach((f) => { f.id += offset; });
          mergedFeedbacks.push(...batchFeedbacks);
        }
        const batchSummary = batch.summary as Record<string, number> | undefined;
        const mergedSummary = merged.summary as Record<string, number> | undefined;
        if (batchSummary && mergedSummary) {
          mergedSummary.total += batchSummary.total;
          mergedSummary.valid += batchSummary.valid;
          mergedSummary.deduplicated += batchSummary.deduplicated;
        }
      } catch {
        // 某批次解析失败时跳过，不中断整体
        console.warn(`[feedback/analyze] Batch ${b} parse failed, skipping`);
      }
    }

    // 重新计算 percent
    const allFeedbacks = merged.feedbacks as Array<{ category: string; id: number }> | undefined;
    const categories = merged.categories as Array<{ name: string; count: number; percent: number; feedbackIds: number[] }> | undefined;
    if (allFeedbacks && categories) {
      const totalValid = allFeedbacks.length || 1;
      for (const cat of categories) {
        cat.count = allFeedbacks.filter((f) => f.category === cat.name).length;
        cat.percent = Math.round((cat.count / totalValid) * 1000) / 10;
        cat.feedbackIds = allFeedbacks
          .filter((f) => f.category === cat.name)
          .map((f) => f.id);
      }
    }

    return NextResponse.json(merged);
  } catch (error) {
    console.error("[feedback/analyze]", error);
    const msg = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: "分析失败: " + msg },
      { status: 500 }
    );
  }
}
