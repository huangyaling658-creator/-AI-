import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = createUser(email, passwordHash, name);
    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
