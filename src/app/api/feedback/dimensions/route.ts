import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildDimensionPrompt } from "@/lib/feedback/prompts";
import { extractJsonArray } from "@/lib/feedback/json-utils";

// 延长超时到 30 秒
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { sample, model, apiKey } = await request.json();

    if (!sample?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 取前 10 条作为样本（减少 token 加速响应）
    const sampleSlice = sample.slice(0, 10);
    const prompt = buildDimensionPrompt(sampleSlice);

    const result = await callAI(
      { model, apiKey },
      [{ role: "user", content: prompt }],
      { maxTokens: 1024, temperature: 0.3 }
    );

    console.log("[feedback/dimensions] raw AI response:", result.slice(0, 500));

    const dimensions = extractJsonArray(result);
    return NextResponse.json({ dimensions });
  } catch (error) {
    console.error("[feedback/dimensions]", error);
    const msg = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: "维度推荐失败: " + msg },
      { status: 500 }
    );
  }
}
