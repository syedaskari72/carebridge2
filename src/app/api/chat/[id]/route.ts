import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChatId } from "@/lib/chatUtils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawChatId } = await params;
    console.log('[Chat API] Raw chat ID:', rawChatId);
    
    const [userId1, userId2] = rawChatId.split("-");
    console.log('[Chat API] User IDs:', { userId1, userId2, sessionUserId: session.user.id });
    
    // Normalize chat ID
    const chatId = createChatId(userId1, userId2);
    console.log('[Chat API] Normalized chat ID:', chatId);
    
    const otherUserId = userId1 === session.user.id ? userId2 : userId1;
    
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true, phone: true, userType: true },
    });

    if (!otherUser) {
      console.error('[Chat API] Other user not found:', otherUserId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch messages with normalized chat ID
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { timestamp: "asc" },
    });
    
    console.log('[Chat API] Found messages:', messages.length);

    return NextResponse.json({ otherUser, messages });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
