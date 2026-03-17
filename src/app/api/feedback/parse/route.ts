import { NextRequest, NextResponse } from "next/server";
import { parseFile, type ParsedFile, type ParsedTable } from "@/lib/feedback/file-parser";

/** 列元数据 */
interface ColumnMeta {
  name: string;
  /** 非空值数量 */
  filledCount: number;
  /** 唯一值数量 */
  uniqueCount: number;
  /** 唯一值列表（<=30 个时全量返回） */
  uniqueValues?: string[];
  /** 平均值长度 */
  avgLength: number;
  /** 列类型推断 */
  columnType: "categorical" | "text" | "empty" | "id";
}

function analyzeColumns(table: ParsedTable): ColumnMeta[] {
  return table.headers.map((header, colIdx) => {
    const values = table.rows.map((row) => row[colIdx] || "").filter((v) => v.length > 0);
    const unique = [...new Set(values)];
    const avgLen = values.length > 0
      ? Math.round(values.reduce((sum, v) => sum + v.length, 0) / values.length)
      : 0;

    let columnType: ColumnMeta["columnType"] = "text";
    if (values.length === 0 || values.length < table.rows.length * 0.1) {
      columnType = "empty";
    } else if (unique.length <= 30 && values.length > 5) {
      columnType = "categorical";
    } else if (unique.length === table.rows.length && avgLen < 20) {
      columnType = "id";
    }

    return {
      name: header,
      filledCount: values.length,
      uniqueCount: unique.length,
      uniqueValues: unique.length <= 30 ? unique : unique.slice(0, 15),
      avgLength: avgLen,
      columnType,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "未上传文件" }, { status: 400 });
    }

    const parsedFiles: ParsedFile[] = [];
    const fileInfos: Array<{
      fileName: string;
      type: string;
      rowCount: number;
      headers?: string[];
      columnMetas?: ColumnMeta[];
    }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseFile(buffer, file.name, file.type);
      parsedFiles.push(parsed);

      const info: (typeof fileInfos)[number] = {
        fileName: file.name,
        type: parsed.type,
        rowCount: parsed.rowCount,
      };

      if (parsed.type === "table") {
        info.headers = parsed.headers;
        info.columnMetas = analyzeColumns(parsed);
      }

      fileInfos.push(info);
    }

    // 对于表格，保留完整行数据（JSON 格式）
    const tableData: Array<Record<string, string>> = [];
    for (const parsed of parsedFiles) {
      if (parsed.type === "table") {
        for (const row of parsed.rows) {
          const record: Record<string, string> = {};
          parsed.headers.forEach((h, i) => {
            if (row[i] && row[i].length > 0) {
              record[h] = row[i];
            }
          });
          if (Object.keys(record).length > 0) {
            tableData.push(record);
          }
        }
      }
    }

    // 前 10 行预览（完整行）
    const previewRows = tableData.slice(0, 10);

    // 兼容：也提取纯文本反馈（给非表格文件用）
    const textFeedbacks: string[] = [];
    for (const parsed of parsedFiles) {
      if (parsed.type === "text") {
        textFeedbacks.push(...parsed.paragraphs);
      }
    }

    return NextResponse.json({
      files: fileInfos,
      tableData,
      textFeedbacks,
      totalCount: tableData.length || textFeedbacks.length,
      previewRows,
      isTable: tableData.length > 0,
    });
  } catch (error) {
    console.error("[feedback/parse]", error);
    return NextResponse.json(
      { error: "文件解析失败: " + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
