import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chat messages involving this user
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: { contains: session.user.id },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Group by chatId
    const grouped = messages.reduce((acc: any, msg) => {
      if (!acc[msg.chatId]) {
        acc[msg.chatId] = [];
      }
      acc[msg.chatId].push({
        id: msg.id,
        sender: msg.senderName,
        message: msg.message.substring(0, 50),
        timestamp: msg.timestamp,
      });
      return acc;
    }, {});

    return NextResponse.json({
      userId: session.user.id,
      userName: session.user.name,
      totalMessages: messages.length,
      chatRooms: Object.keys(grouped).map(chatId => ({
        chatId,
        messageCount: grouped[chatId].length,
        lastMessage: grouped[chatId][0],
      })),
    });
  } catch (error) {
    console.error("Debug chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
