import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json({ ok: true, session });
  } catch (e: any) {
    console.error("[Debug][session]", e?.message);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
