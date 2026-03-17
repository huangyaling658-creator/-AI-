/**
 * 安全解析 AI 返回的 JSON — 处理 markdown 代码块、多余文字、截断、特殊字符等问题
 */

/** 从 AI 响应中提取 JSON 数组 */
export function extractJsonArray(text: string): unknown[] {
  const cleaned = stripMarkdownCodeBlock(text);

  // 策略 1：直接解析
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    // 如果是对象（response_format: json_object 会返回对象），尝试提取内部第一个数组
    if (typeof parsed === "object" && parsed !== null) {
      const firstArray = Object.values(parsed).find(Array.isArray);
      if (firstArray) return firstArray as unknown[];
    }
  } catch {
    // continue
  }

  // 策略 2：提取 [...] 部分
  const arrayStr = extractBracketContent(cleaned, "[", "]");
  if (arrayStr) {
    try {
      return JSON.parse(arrayStr);
    } catch {
      // 策略 3：清洗后重试
      const sanitized = sanitizeJsonString(arrayStr);
      try {
        return JSON.parse(sanitized);
      } catch {
        // 策略 4：修复截断
        return tryFixTruncatedArray(sanitized);
      }
    }
  }

  throw new Error("无法从 AI 响应中提取 JSON 数组");
}

/** 从 AI 响应中提取 JSON 对象 */
export function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = stripMarkdownCodeBlock(text);

  // 策略 1：直接解析
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // continue
  }

  // 策略 2：提取 {...} 部分
  const objStr = extractBracketContent(cleaned, "{", "}");
  if (objStr) {
    try {
      return JSON.parse(objStr);
    } catch {
      // 策略 3：清洗后重试
      const sanitized = sanitizeJsonString(objStr);
      try {
        return JSON.parse(sanitized);
      } catch {
        // 策略 4：修复截断
        return tryFixTruncatedObject(sanitized);
      }
    }
  }

  throw new Error("无法从 AI 响应中提取 JSON 对象");
}

/** 去除 markdown 代码块包裹 */
function stripMarkdownCodeBlock(text: string): string {
  let cleaned = text.trim();
  // 去除 ```json ... ``` 或 ``` ... ```
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  // 去除开头的非 JSON 文字（如 "以下是分析结果：" 等）
  const firstBracket = cleaned.search(/[\[{]/);
  if (firstBracket > 0) cleaned = cleaned.slice(firstBracket);
  // 去除尾部的非 JSON 文字
  const lastBracket = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (lastBracket >= 0 && lastBracket < cleaned.length - 1) cleaned = cleaned.slice(0, lastBracket + 1);
  return cleaned.trim();
}

/**
 * 提取匹配的最外层括号内容（处理嵌套）
 * 比 indexOf/lastIndexOf 更准确 — 会正确处理字符串内的括号
 */
function extractBracketContent(text: string, open: string, close: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === open) {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  // 如果有开始但没有闭合 — 可能被截断，返回到末尾
  if (start !== -1) {
    return text.slice(start);
  }

  return null;
}

/**
 * 清洗 JSON 字符串中的常见问题：
 * - 字符串值内的未转义换行
 * - 字符串值内的未转义制表符
 * - 尾部逗号 (trailing commas)
 * - 注释
 */
function sanitizeJsonString(text: string): string {
  let result = text;

  // 去除单行注释 // ... （不在字符串内的）
  result = removeJsonComments(result);

  // 修复字符串内的控制字符（换行、制表等）
  result = fixControlCharsInStrings(result);

  // 去除尾部逗号：,} 或 ,]
  result = result.replace(/,\s*([}\]])/g, "$1");

  return result;
}

/** 去除 JSON 中的注释 */
function removeJsonComments(text: string): string {
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; result += ch; continue; }
    if (ch === "\\") { escape = true; result += ch; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) { result += ch; continue; }

    // 检查单行注释
    if (ch === "/" && i + 1 < text.length && text[i + 1] === "/") {
      // 跳到行尾
      const newline = text.indexOf("\n", i);
      if (newline === -1) break;
      i = newline - 1; // 循环 i++ 会跳到 newline
      continue;
    }

    result += ch;
  }
  return result;
}

/** 修复 JSON 字符串值内的控制字符 */
function fixControlCharsInStrings(text: string): string {
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      result += ch;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // 替换字符串内的控制字符
      const code = ch.charCodeAt(0);
      if (code === 0x0a) { result += "\\n"; continue; }   // 换行
      if (code === 0x0d) { result += "\\r"; continue; }   // 回车
      if (code === 0x09) { result += "\\t"; continue; }   // 制表
      if (code < 0x20) { result += " "; continue; }       // 其他控制字符
    }

    result += ch;
  }

  // 如果字符串未闭合，补上引号
  if (inString) result += '"';

  return result;
}

/** 尝试修复被截断的 JSON 数组 */
function tryFixTruncatedArray(text: string): unknown[] {
  // 从末尾向前找最后一个完整的 } — 截断到那里然后闭合数组
  let lastComplete = text.lastIndexOf("}");
  while (lastComplete > 0) {
    const attempt = text.slice(0, lastComplete + 1) + "]";
    // 去除尾部逗号
    const cleaned = attempt.replace(/,\s*\]$/, "]");
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // 继续往前找
    }
    lastComplete = text.lastIndexOf("}", lastComplete - 1);
  }
  throw new Error("JSON 数组被截断且无法修复");
}

/** 尝试修复被截断的 JSON 对象 */
function tryFixTruncatedObject(text: string): Record<string, unknown> {
  // 策略 1：统计未闭合的括号，自动补全
  const fixed = autoCloseBrackets(text);
  try {
    const parsed = JSON.parse(fixed);
    if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // continue
  }

  // 策略 2：逐步回退到最后一个完整的键值对
  const cutPoints = [
    text.lastIndexOf("}"),
    text.lastIndexOf("]"),
    text.lastIndexOf(","),
  ].filter((i) => i > 0).sort((a, b) => b - a);

  for (const cut of cutPoints) {
    const trimmed = text.slice(0, cut);
    const attempt = autoCloseBrackets(trimmed);
    try {
      const parsed = JSON.parse(attempt);
      if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // try next cut point
    }
  }

  // 策略 3：更激进地回退 — 每次去掉一个字符
  for (let i = text.length - 1; i > Math.max(0, text.length - 500); i--) {
    const trimmed = text.slice(0, i);
    const attempt = autoCloseBrackets(trimmed);
    try {
      const parsed = JSON.parse(attempt);
      if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // keep trying
    }
  }

  throw new Error("JSON 对象被截断且无法修复");
}

/** 自动补全未闭合的括号 */
function autoCloseBrackets(text: string): string {
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of text) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  let fixed = text;
  // 如果在字符串中间截断，先关闭字符串
  if (inString) fixed += '"';
  // 去除尾部逗号
  fixed = fixed.replace(/,\s*$/, "");
  // 关闭所有未闭合的括号（按打开的反序关闭）
  for (let i = 0; i < brackets; i++) fixed += "]";
  for (let i = 0; i < braces; i++) fixed += "}";

  return fixed;
}
