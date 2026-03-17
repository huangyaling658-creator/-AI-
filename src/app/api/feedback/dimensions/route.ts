import { NextRequest, NextResponse } from "next/server";

/**
 * 维度推荐 — 基于列语义智能推导业务问题
 * 不调 AI，毫秒级返回
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
  analysisType: "distribution" | "classification" | "cross" | "painpoint";
  supported: boolean;
  reason: string;
  presetValues?: string[];
}

/** 列名语义识别 — 猜测这列在业务上代表什么 */
function guessColumnRole(name: string): "feature" | "userType" | "category" | "feedback" | "time" | "analyst" | "other" {
  const n = name.toLowerCase();
  // 功能/模块
  if (n.includes("功能") || n.includes("模块") || n.includes("feature") || n.includes("menu")) return "feature";
  // 用户类型
  if (n.includes("用户") || n.includes("会员") || n.includes("属性") || n.includes("user") || n.includes("角色")) return "userType";
  // 分类
  if (n.includes("分类") || n.includes("类别") || n.includes("类型") || n.includes("category") || n.includes("type")) return "category";
  // 反馈内容
  if (n.includes("反馈") || n.includes("内容") || n.includes("描述") || n.includes("评论") || n.includes("query") || n.includes("问题") || n.includes("feedback") || n.includes("comment") || n.includes("content")) return "feedback";
  // 时间
  if (n.includes("时间") || n.includes("日期") || n.includes("月") || n.includes("date") || n.includes("time")) return "time";
  // 分析人
  if (n.includes("分析人") || n.includes("负责人") || n.includes("处理人") || n.includes("analyst")) return "analyst";
  return "other";
}

/** 根据角色生成业务化的维度名称 */
function getBusinessName(colName: string, role: string): string {
  switch (role) {
    case "feature": return "功能模块分布";
    case "userType": return "用户画像分布";
    case "category": return "问题分类分布";
    case "time": return "时间趋势分布";
    default: return `${colName}分布`;
  }
}

function getBusinessDescription(colName: string, role: string, uniqueCount: number): string {
  switch (role) {
    case "feature": return `用户在反馈哪些功能模块？（${uniqueCount} 个功能）`;
    case "userType": return `什么类型的用户在反馈？（${uniqueCount} 种用户）`;
    case "category": return `反馈问题的分类分布如何？（${uniqueCount} 个类别）`;
    case "time": return `反馈的时间趋势如何？`;
    default: return `「${colName}」各值的分布占比（${uniqueCount} 个类别）`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { columnMetas, totalCount, isTable } = await request.json();

    if (!isTable || !columnMetas?.length) {
      return NextResponse.json({
        dimensions: [
          { name: "问题类型分类", description: "将反馈按问题性质自动归类（功能问题/UI问题/bug等）", column: "_text", analysisType: "classification", supported: true, reason: "文本数据默认支持" },
          { name: "痛点需求总结", description: "提炼每个类别下的核心痛点和产品改进建议", column: "_text", analysisType: "painpoint", supported: true, reason: "文本数据默认支持" },
        ],
      });
    }

    const dimensions: Dimension[] = [];
    const metas = columnMetas as ColumnMeta[];

    // 1. 识别每列的业务角色
    const colRoles = metas.map((col) => ({
      ...col,
      role: guessColumnRole(col.name),
    }));

    // 2. 找出核心列
    const feedbackCol = colRoles.find((c) => c.role === "feedback" && c.columnType === "text");
    const featureCols = colRoles.filter((c) => (c.role === "feature" || c.role === "category") && c.columnType === "categorical");
    const userTypeCols = colRoles.filter((c) => c.role === "userType" && c.columnType === "categorical");
    const timeCols = colRoles.filter((c) => c.role === "time" && c.columnType === "categorical");

    // 3. 分类列 → 直接统计分布
    const categoricalCols = colRoles.filter((c) =>
      c.columnType === "categorical" &&
      c.role !== "analyst" && // 跳过分析人
      c.uniqueCount >= 2
    );

    for (const col of categoricalCols) {
      dimensions.push({
        name: getBusinessName(col.name, col.role),
        description: getBusinessDescription(col.name, col.role, col.uniqueCount),
        column: col.name,
        analysisType: "distribution",
        supported: true,
        reason: `${col.uniqueCount} 个类别，${col.filledCount}/${totalCount} 条有值`,
        presetValues: col.uniqueValues,
      });
    }

    // 4. 反馈文本列 → AI 分类（问题类型）
    if (feedbackCol) {
      dimensions.push({
        name: "问题类型分类",
        description: `对「${feedbackCol.name}」进行语义分类（功能使用问题/UI问题/网络异常/数据丢失bug/需求建议等）`,
        column: feedbackCol.name,
        analysisType: "classification",
        supported: true,
        reason: `${feedbackCol.uniqueCount} 条不同反馈内容`,
      });
    } else {
      // 没有明确的反馈列，找最长的文本列
      const longestTextCol = colRoles
        .filter((c) => c.columnType === "text")
        .sort((a, b) => b.avgLength - a.avgLength)[0];
      if (longestTextCol) {
        dimensions.push({
          name: "问题类型分类",
          description: `对「${longestTextCol.name}」进行语义分类`,
          column: longestTextCol.name,
          analysisType: "classification",
          supported: true,
          reason: `${longestTextCol.uniqueCount} 条不同内容`,
        });
      }
    }

    // 5. 交叉分析 — 只推荐有业务价值的组合
    // 用户类型 × 功能模块
    if (userTypeCols.length > 0 && featureCols.length > 0) {
      const u = userTypeCols[0];
      const f = featureCols[0];
      dimensions.push({
        name: "用户×功能交叉",
        description: `哪类用户关注哪些功能？「${u.name}」与「${f.name}」的交叉关系`,
        column: `${u.name}|${f.name}`,
        analysisType: "cross",
        supported: true,
        reason: `${u.uniqueCount}×${f.uniqueCount} 组合`,
      });
    }

    // 时间 × 功能模块
    if (timeCols.length > 0 && featureCols.length > 0) {
      const t = timeCols[0];
      const f = featureCols[0];
      dimensions.push({
        name: "时间×功能趋势",
        description: `各功能模块的反馈量随时间如何变化？`,
        column: `${t.name}|${f.name}`,
        analysisType: "cross",
        supported: true,
        reason: `${t.uniqueCount} 个时间段 × ${f.uniqueCount} 个功能`,
      });
    }

    // 6. 痛点需求总结 — 核心维度，始终推荐
    const textCol = feedbackCol || colRoles.find((c) => c.columnType === "text" && c.avgLength > 10);
    const groupByCol = featureCols[0] || categoricalCols[0];
    if (textCol) {
      dimensions.push({
        name: "痛点需求总结",
        description: groupByCol
          ? `按「${groupByCol.name}」分组，总结每类问题的核心痛点和产品改进建议`
          : `总结反馈中的核心痛点和产品改进建议`,
        column: groupByCol ? `${textCol.name}|${groupByCol.name}` : textCol.name,
        analysisType: "painpoint",
        supported: true,
        reason: "帮助产品经理提炼决策依据",
      });
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
