import { NextRequest, NextResponse } from "next/server";

/**
 * 维度推荐 — 纯本地生成，不调 AI，毫秒级返回
 * 根据表格列结构自动推导分析维度
 */

interface ColumnMeta {
  name: string;
  filledCount: number;
  uniqueCount: number;
  uniqueValues?: string[];
  avgLength: number;
  columnType: "categorical" | "text" | "empty" | "id";
}

interface Dimension {
  name: string;
  description: string;
  column: string;
  analysisType: "distribution" | "classification" | "cross" | "sentiment" | "keyword";
  supported: boolean;
  reason: string;
  /** 预设的分类值（分类列直接使用） */
  presetValues?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { columnMetas, totalCount, isTable } = await request.json();

    if (!isTable || !columnMetas?.length) {
      // 非表格数据 — 给默认文本维度
      return NextResponse.json({
        dimensions: [
          { name: "情感倾向", description: "分析每条反馈的正面/负面/中立态度", column: "_text", analysisType: "sentiment", supported: true, reason: "文本数据默认支持" },
          { name: "问题分类", description: "将反馈按问题类型自动归类", column: "_text", analysisType: "classification", supported: true, reason: "文本数据默认支持" },
          { name: "高频关键词", description: "提取出现频率最高的关键词", column: "_text", analysisType: "keyword", supported: true, reason: "文本数据默认支持" },
        ],
      });
    }

    const dimensions: Dimension[] = [];
    const metas = columnMetas as ColumnMeta[];

    for (const col of metas) {
      // 跳过空列和 ID 列
      if (col.columnType === "empty" || col.columnType === "id") continue;

      if (col.columnType === "categorical") {
        // 分类列 → 分布分析
        dimensions.push({
          name: `${col.name}分布`,
          description: `分析各「${col.name}」的数量占比（共 ${col.uniqueCount} 个类别）`,
          column: col.name,
          analysisType: "distribution",
          supported: true,
          reason: `${col.uniqueCount} 个类别，${col.filledCount}/${totalCount} 条有值`,
          presetValues: col.uniqueValues,
        });
      } else if (col.columnType === "text") {
        // 文本列
        if (col.avgLength > 10) {
          // 长文本 → 分类分析
          dimensions.push({
            name: `${col.name}类型分析`,
            description: `对「${col.name}」列进行语义分类，识别操作类型和意图`,
            column: col.name,
            analysisType: "classification",
            supported: true,
            reason: `${col.uniqueCount} 种不同内容，平均长度 ${col.avgLength} 字`,
          });
        }
        if (col.avgLength > 5 && col.filledCount > 10) {
          // 文本列 → 关键词提取
          dimensions.push({
            name: `${col.name}关键词`,
            description: `提取「${col.name}」列中的高频关键词和主题`,
            column: col.name,
            analysisType: "keyword",
            supported: true,
            reason: `${col.filledCount} 条数据可供分析`,
          });
        }
      }
    }

    // 添加交叉分析维度（分类列之间的交叉）
    const categoricalCols = metas.filter((c) => c.columnType === "categorical" && c.uniqueCount >= 2);
    if (categoricalCols.length >= 2) {
      // 最多取前 3 对交叉
      const pairs: [ColumnMeta, ColumnMeta][] = [];
      for (let i = 0; i < categoricalCols.length && pairs.length < 3; i++) {
        for (let j = i + 1; j < categoricalCols.length && pairs.length < 3; j++) {
          pairs.push([categoricalCols[i], categoricalCols[j]]);
        }
      }
      for (const [a, b] of pairs) {
        dimensions.push({
          name: `${a.name} × ${b.name}`,
          description: `分析「${a.name}」与「${b.name}」的交叉分布关系`,
          column: `${a.name}|${b.name}`,
          analysisType: "cross",
          supported: true,
          reason: `${a.uniqueCount}×${b.uniqueCount} 组合`,
        });
      }
    }

    // 确保至少 3 个维度
    if (dimensions.length < 3) {
      // 补充通用维度
      const textCols = metas.filter((c) => c.columnType === "text" && c.avgLength > 5);
      if (textCols.length > 0 && !dimensions.some((d) => d.analysisType === "sentiment")) {
        dimensions.push({
          name: "情感倾向",
          description: `分析「${textCols[0].name}」中每条内容的正面/负面/中立态度`,
          column: textCols[0].name,
          analysisType: "sentiment",
          supported: true,
          reason: "基于文本语义判断情感",
        });
      }
    }

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
