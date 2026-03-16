import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildAnalysisPrompt } from "@/lib/feedback/prompts";

export async function POST(request: NextRequest) {
  try {
    const { feedbacks, dimensions, model, apiKey } = await request.json();

    if (!feedbacks?.length || !dimensions?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 如果数据量超过 500 条，分批处理
    const BATCH_SIZE = 500;
    if (feedbacks.length <= BATCH_SIZE) {
      const prompt = buildAnalysisPrompt(feedbacks, dimensions);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "AI 返回格式异常", raw: result }, { status: 500 });
      }

      const analysis = JSON.parse(jsonMatch[0]);
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

    const firstMatch = firstResult.match(/\{[\s\S]*\}/);
    if (!firstMatch) {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 500 });
    }

    const merged = JSON.parse(firstMatch[0]);

    // 后续批次分析并合并
    for (let b = 1; b < batches.length; b++) {
      const prompt = buildAnalysisPrompt(batches[b], dimensions);
      const result = await callAI(
        { model, apiKey },
        [{ role: "user", content: prompt }],
        { maxTokens: 8192, temperature: 0.2 }
      );

      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const batch = JSON.parse(match[0]);
        // 合并 feedbacks
        if (batch.feedbacks) {
          const offset = b * BATCH_SIZE;
          batch.feedbacks.forEach((f: { id: number }) => { f.id += offset; });
          merged.feedbacks.push(...batch.feedbacks);
        }
        // 合并 summary
        if (batch.summary) {
          merged.summary.total += batch.summary.total;
          merged.summary.valid += batch.summary.valid;
          merged.summary.deduplicated += batch.summary.deduplicated;
        }
      }
    }

    // 重新计算 percent
    const totalValid = merged.feedbacks?.length || 1;
    if (merged.categories) {
      for (const cat of merged.categories) {
        cat.count = merged.feedbacks.filter(
          (f: { category: string }) => f.category === cat.name
        ).length;
        cat.percent = Math.round((cat.count / totalValid) * 1000) / 10;
        cat.feedbackIds = merged.feedbacks
          .filter((f: { category: string }) => f.category === cat.name)
          .map((f: { id: number }) => f.id);
      }
    }

    return NextResponse.json(merged);
  } catch (error) {
    console.error("[feedback/analyze]", error);
    return NextResponse.json(
      { error: "分析失败: " + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
