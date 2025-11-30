import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, message, senderName } = await req.json();
    console.log('[Messages API] Saving message to chatId:', chatId);

    const savedMessage = await prisma.chatMessage.create({
      data: {
        chatId,
        senderId: session.user.id,
        senderName: senderName || session.user.name || "User",
        message,
        timestamp: new Date(),
      },
    });
    
    console.log('[Messages API] Message saved:', savedMessage.id);

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
