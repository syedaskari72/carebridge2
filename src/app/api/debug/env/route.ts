import { NextResponse } from "next/server";

export async function GET() {
  const safeEnv = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "set" : "missing",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "set" : "missing",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "set" : "missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "set" : "missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "set" : "missing",
    APP_DEBUG: process.env.APP_DEBUG || "0",
    NODE_ENV: process.env.NODE_ENV,
  };
  return NextResponse.json({ ok: true, env: safeEnv });
}
