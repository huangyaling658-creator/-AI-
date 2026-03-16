/**
 * 文件解析工具 — 将各种格式统一提取为文本
 */
import * as XLSX from "xlsx";

export interface ParsedTable {
  type: "table";
  headers: string[];
  rows: string[][];
  fileName: string;
  rowCount: number;
}

export interface ParsedText {
  type: "text";
  paragraphs: string[];
  fileName: string;
  rowCount: number;
}

export interface ParsedImage {
  type: "image";
  base64: string;
  mimeType: string;
  fileName: string;
  rowCount: number;
}

export type ParsedFile = ParsedTable | ParsedText | ParsedImage;

/** 解析 CSV/Excel */
export function parseSpreadsheet(buffer: Buffer, fileName: string): ParsedTable {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (jsonData.length === 0) {
    return { type: "table", headers: [], rows: [], fileName, rowCount: 0 };
  }

  const headers = (jsonData[0] || []).map((h) => String(h || "").trim());
  const rows = jsonData.slice(1).map((row) =>
    headers.map((_, i) => String(row[i] ?? "").trim())
  );

  return { type: "table", headers, rows, fileName, rowCount: rows.length };
}

/** 解析 PDF */
export async function parsePDF(buffer: Buffer, fileName: string): Promise<ParsedText> {
  // pdf-parse 是 CommonJS 模块
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const paragraphs = data.text
    .split(/\n{2,}/)
    .map((p: string) => p.replace(/\n/g, " ").trim())
    .filter((p: string) => p.length > 0);

  return { type: "text", paragraphs, fileName, rowCount: paragraphs.length };
}

/** 解析 Word (.docx) */
export async function parseWord(buffer: Buffer, fileName: string): Promise<ParsedText> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return { type: "text", paragraphs, fileName, rowCount: paragraphs.length };
}

/** 解析纯文本 */
export function parseText(text: string, fileName: string): ParsedText {
  const paragraphs = text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.replace(/[\r\n]+/g, " ").trim())
    .filter((p) => p.length > 0);

  // 如果只有一段，尝试按单行拆分
  if (paragraphs.length === 1 && paragraphs[0].includes("\n")) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    return { type: "text", paragraphs: lines, fileName, rowCount: lines.length };
  }

  return { type: "text", paragraphs, fileName, rowCount: paragraphs.length };
}

/** 解析图片 → base64 */
export function parseImage(buffer: Buffer, fileName: string, mimeType: string): ParsedImage {
  const base64 = buffer.toString("base64");
  return { type: "image", base64, mimeType, fileName, rowCount: 1 };
}

/** 根据文件扩展名自动分发解析 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["csv", "xlsx", "xls"].includes(ext)) {
    return parseSpreadsheet(buffer, fileName);
  }
  if (ext === "pdf") {
    return parsePDF(buffer, fileName);
  }
  if (["doc", "docx"].includes(ext)) {
    return parseWord(buffer, fileName);
  }
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return parseImage(buffer, fileName, mimeType);
  }
  if (["txt", "md", "markdown", "text"].includes(ext)) {
    return parseText(buffer.toString("utf-8"), fileName);
  }

  // 默认当文本处理
  return parseText(buffer.toString("utf-8"), fileName);
}

/** 从表格中智能提取反馈内容列 */
export function guessFeedbackColumn(headers: string[]): string | null {
  const keywords = ["反馈", "评论", "评价", "内容", "描述", "建议", "意见", "comment", "feedback", "review", "content", "description", "text", "message", "工单"];
  for (const h of headers) {
    const lower = h.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) return h;
    }
  }
  // 如果没匹配到，找最长平均内容的列
  return null;
}

/** 从 ParsedFile 提取反馈文本列表 */
export function extractFeedbacks(
  file: ParsedFile,
  feedbackColumn?: string
): string[] {
  if (file.type === "text") {
    return file.paragraphs;
  }
  if (file.type === "image") {
    return []; // 图片需要AI处理，此处返回空
  }
  // table
  const colName = feedbackColumn || guessFeedbackColumn(file.headers);
  if (!colName) {
    // 没有明确的反馈列，把每行所有列拼起来
    return file.rows.map((row) => row.join(" ").trim()).filter((s) => s.length > 0);
  }
  const colIndex = file.headers.indexOf(colName);
  if (colIndex === -1) {
    return file.rows.map((row) => row.join(" ").trim()).filter((s) => s.length > 0);
  }
  return file.rows.map((row) => row[colIndex]?.trim()).filter((s) => s && s.length > 0);
}
