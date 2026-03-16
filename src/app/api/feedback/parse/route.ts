import { NextRequest, NextResponse } from "next/server";
import { parseFile, guessFeedbackColumn, extractFeedbacks, type ParsedFile } from "@/lib/feedback/file-parser";

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
      feedbackColumn?: string | null;
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
        info.feedbackColumn = guessFeedbackColumn(parsed.headers);
      }

      fileInfos.push(info);
    }

    // 提取所有反馈文本
    const allFeedbacks: string[] = [];
    for (let i = 0; i < parsedFiles.length; i++) {
      const parsed = parsedFiles[i];
      if (parsed.type === "image") {
        // 图片文件需要前端单独处理（通过 AI 视觉能力）
        continue;
      }
      const feedbackCol = fileInfos[i].feedbackColumn || undefined;
      const feedbacks = extractFeedbacks(parsed, feedbackCol);
      allFeedbacks.push(...feedbacks);
    }

    // 图片文件的 base64 数据
    const images = parsedFiles
      .filter((f): f is Extract<ParsedFile, { type: "image" }> => f.type === "image")
      .map((f) => ({
        fileName: f.fileName,
        base64: f.base64,
        mimeType: f.mimeType,
      }));

    return NextResponse.json({
      files: fileInfos,
      mergedFeedbacks: allFeedbacks,
      totalCount: allFeedbacks.length,
      preview: allFeedbacks.slice(0, 10),
      images,
    });
  } catch (error) {
    console.error("[feedback/parse]", error);
    return NextResponse.json(
      { error: "文件解析失败: " + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
