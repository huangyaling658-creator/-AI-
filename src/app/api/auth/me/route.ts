import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const user = findUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("[me]", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
