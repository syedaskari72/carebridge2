import { NextResponse } from "next/server";

export async function GET() {
  const info = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    APP_DEBUG: process.env.APP_DEBUG || "0",
    NODE_ENV: process.env.NODE_ENV,
  };
  return NextResponse.json({ ok: true, info });
}
