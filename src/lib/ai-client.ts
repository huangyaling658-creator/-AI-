/**
 * AI 统一调用封装 — 根据用户选择的 model 路由到对应 Provider
 */

interface AIClientConfig {
  model: string;
  apiKey: string;
}

interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image_url";
  image_url: { url: string };
}

interface AnthropicImageContent {
  type: "image";
  source: { type: "base64"; media_type: string; data: string };
}

type MessageContent = string | (TextContent | ImageContent)[];

interface Message {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

function getProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("claude") || m.includes("anthropic")) return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3")) return "openai";
  if (m.startsWith("deepseek")) return "deepseek";
  if (m.includes("openrouter")) return "openrouter";
  return "openai"; // fallback to OpenAI-compatible
}

function getAnthropicModel(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "claude-opus-4-0-20250514";
  if (m.includes("haiku")) return "claude-3-haiku-20240307";
  return "claude-sonnet-4-20250514"; // default sonnet
}

async function callAnthropic(
  config: AIClientConfig,
  messages: Message[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role, content: m.content };
      }
      // Convert image content for Anthropic format
      const parts = (m.content as (TextContent | ImageContent)[]).map((c) => {
        if (c.type === "text") return c;
        if (c.type === "image_url") {
          const url = c.image_url.url;
          // data:image/png;base64,xxx
          const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            return {
              type: "image",
              source: { type: "base64", media_type: match[1], data: match[2] },
            } as AnthropicImageContent;
          }
        }
        return c;
      });
      return { role: m.role, content: parts };
    });

  const body: Record<string, unknown> = {
    model: getAnthropicModel(config.model),
    max_tokens: maxTokens,
    temperature,
    messages: userMessages,
  };
  if (systemMsg) {
    body.system = typeof systemMsg.content === "string" ? systemMsg.content : "";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    return textBlock?.text || "";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI 请求超时（120秒），请尝试减少数据量或更换模型");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAICompatible(
  baseUrl: string,
  config: AIClientConfig,
  messages: Message[],
  maxTokens: number,
  temperature: number,
  extraHeaders?: Record<string, string>
): Promise<string> {
  // 检查 prompt 是否期望 JSON 输出
  const lastMsg = messages[messages.length - 1];
  const promptText = typeof lastMsg?.content === "string" ? lastMsg.content : "";
  const wantsJson = promptText.includes("JSON") || promptText.includes("json");

  const body: Record<string, unknown> = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: maxTokens,
    temperature,
  };

  // 对支持 response_format 的 API 强制 JSON 输出
  if (wantsJson) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000); // 120s 超时

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI 请求超时（120秒），请尝试减少数据量或更换模型");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAI(
  config: AIClientConfig,
  messages: Message[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.3;
  const provider = getProvider(config.model);

  switch (provider) {
    case "anthropic":
      return callAnthropic(config, messages, maxTokens, temperature);
    case "openai":
      return callOpenAICompatible(
        "https://api.openai.com/v1",
        config,
        messages,
        maxTokens,
        temperature
      );
    case "deepseek":
      return callOpenAICompatible(
        "https://api.deepseek.com/v1",
        config,
        messages,
        maxTokens,
        temperature
      );
    case "openrouter": {
      // OpenRouter model name: strip "openrouter/" prefix if present
      const orModel = config.model.replace(/^openrouter\//i, "");
      return callOpenAICompatible(
        "https://openrouter.ai/api/v1",
        { ...config, model: orModel },
        messages,
        maxTokens,
        temperature
      );
    }
    default:
      return callOpenAICompatible(
        "https://api.openai.com/v1",
        config,
        messages,
        maxTokens,
        temperature
      );
  }
}
