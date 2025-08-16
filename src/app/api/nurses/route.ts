import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const department = searchParams.get("department") || undefined;

    const nurses = await prisma.nurse.findMany({
      where: {
        AND: [
          department ? { department: department as any } : {},
          q ? { user: { name: { contains: q, mode: "insensitive" } } } : {},
        ]
      },
      include: {
        user: true,
      },
      take: 100,
    });

    return NextResponse.json(nurses);
  } catch (e) {
    console.error("[Nurses][GET]", e);
    return NextResponse.json({ error: "Failed to fetch nurses" }, { status: 500 });
  }
}
