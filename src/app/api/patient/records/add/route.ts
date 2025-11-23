import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const records = new Map<string, any[]>();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, data, patientId } = body;

    const targetPatientId = patientId || session.user.id;
    const userRecords = records.get(targetPatientId) || [];
    
    const newRecord = {
      id: Date.now().toString(),
      type,
      data,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
    };

    userRecords.push(newRecord);
    records.set(targetPatientId, userRecords);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    console.error("Add record error:", error);
    return NextResponse.json({ error: "Failed to add record" }, { status: 500 });
  }
}
