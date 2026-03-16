import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai-client";
import { buildDimensionPrompt } from "@/lib/feedback/prompts";

export async function POST(request: NextRequest) {
  try {
    const { sample, model, apiKey } = await request.json();

    if (!sample?.length || !model || !apiKey) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 取前 20 条作为样本
    const sampleSlice = sample.slice(0, 20);
    const prompt = buildDimensionPrompt(sampleSlice);

    const result = await callAI(
      { model, apiKey },
      [{ role: "user", content: prompt }],
      { maxTokens: 2048, temperature: 0.3 }
    );

    // 解析 JSON
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回格式异常", raw: result }, { status: 500 });
    }

    const dimensions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ dimensions });
  } catch (error) {
    console.error("[feedback/dimensions]", error);
    return NextResponse.json(
      { error: "维度推荐失败: " + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
