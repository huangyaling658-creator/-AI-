import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

interface AnnotatedFeedback {
  id: number;
  content: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  keywords: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { feedbacks, format } = (await request.json()) as {
      feedbacks: AnnotatedFeedback[];
      format: string;
    };

    if (!feedbacks?.length) {
      return NextResponse.json({ error: "无数据可导出" }, { status: 400 });
    }

    // 构建导出数据
    const exportRows = feedbacks.map((f) => ({
      序号: f.id + 1,
      反馈内容: f.content,
      分类: f.category,
      情感倾向: f.sentiment === "positive" ? "正面" : f.sentiment === "negative" ? "负面" : "中立",
      情感分数: f.sentimentScore,
      关键词: f.keywords.join("、"),
    }));

    if (format === "xlsx" || format === "excel") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);

      // 设置列宽
      ws["!cols"] = [
        { wch: 6 },  // 序号
        { wch: 60 }, // 反馈内容
        { wch: 12 }, // 分类
        { wch: 8 },  // 情感倾向
        { wch: 8 },  // 情感分数
        { wch: 20 }, // 关键词
      ];

      XLSX.utils.book_append_sheet(wb, ws, "反馈分析结果");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="feedback-analysis.xlsx"',
        },
      });
    }

    // 默认 CSV
    const header = "序号,反馈内容,分类,情感倾向,情感分数,关键词";
    const rows = exportRows.map((r) =>
      [
        r.序号,
        `"${r.反馈内容.replace(/"/g, '""')}"`,
        r.分类,
        r.情感倾向,
        r.情感分数,
        `"${r.关键词}"`,
      ].join(",")
    );
    const csv = "\uFEFF" + header + "\n" + rows.join("\n"); // BOM for Excel UTF-8

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="feedback-analysis.csv"',
      },
    });
  } catch (error) {
    console.error("[feedback/export]", error);
    return NextResponse.json(
      { error: "导出失败: " + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
