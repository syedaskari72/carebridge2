import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const anyUser = await prisma.user.findFirst({ select: { id: true, email: true, userType: true } });
    return NextResponse.json({ ok: true, userCount, anyUser });
  } catch (e: any) {
    console.error("[Debug][db]", e?.message);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
