import { NextRequest, NextResponse } from "next/server";

function getProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3")) return "openai";
  if (m.startsWith("deepseek")) return "deepseek";
  if (m.includes("openrouter")) return "openrouter";
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const { model, apiKey } = await request.json();

    if (!apiKey || !model) {
      return NextResponse.json({ valid: false, error: "缺少参数" }, { status: 400 });
    }

    const provider = getProvider(model);

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });

      if (res.ok || res.status === 200) {
        return NextResponse.json({ valid: true });
      }

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ valid: false, error: "API Key 无效或无权限" });
      }
      // Other errors (rate limit, overloaded, bad request) mean the key itself is valid
      if (res.status === 429 || res.status === 400 || res.status === 529) {
        return NextResponse.json({ valid: true });
      }
      return NextResponse.json({ valid: false, error: "验证失败，请检查 Key" });
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return NextResponse.json({ valid: true });
      }
      if (res.status === 401) {
        return NextResponse.json({ valid: false, error: "API Key 无效" });
      }
      return NextResponse.json({ valid: false, error: "验证失败" });
    }

    if (provider === "deepseek") {
      const res = await fetch("https://api.deepseek.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return NextResponse.json({ valid: true });
      }
      if (res.status === 401) {
        return NextResponse.json({ valid: false, error: "API Key 无效" });
      }
      return NextResponse.json({ valid: false, error: "验证失败" });
    }

    if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return NextResponse.json({ valid: true });
      }
      if (res.status === 401) {
        return NextResponse.json({ valid: false, error: "API Key 无效" });
      }
      return NextResponse.json({ valid: false, error: "验证失败" });
    }

    return NextResponse.json({ valid: false, error: "不支持的模型" });
  } catch (error) {
    console.error("[validate-key]", error);
    return NextResponse.json({ valid: false, error: "验证请求失败" }, { status: 500 });
  }
}
