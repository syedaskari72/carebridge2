import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const nurse = await prisma.nurse.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
      },
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse not found" }, { status: 404 });
    }

    return NextResponse.json(nurse);
  } catch (e) {
    console.error("[Nurse][GET]", e);
    return NextResponse.json({ error: "Failed to fetch nurse" }, { status: 500 });
  }
}
