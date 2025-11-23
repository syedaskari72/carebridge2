import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChatId } from "@/lib/chatUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stored notifications
    const storedNotifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Create notifications from recent messages if not already stored
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        chatId: { contains: session.user.id },
        senderId: { not: session.user.id },
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    for (const msg of recentMessages) {
      const notificationId = `msg-${msg.id}`;
      const exists = storedNotifications.find(n => n.id === notificationId);
      
      if (!exists) {
        const [userId1, userId2] = msg.chatId.split("-");
        const normalizedChatId = createChatId(userId1, userId2);
        
        await prisma.notification.create({
          data: {
            id: notificationId,
            userId: session.user.id,
            type: "MESSAGE",
            title: "New Message",
            message: `${msg.senderName}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? "..." : ""}`,
            link: `/chat/${normalizedChatId}`,
            createdAt: msg.timestamp,
          },
        });
      }
    }

    // Fetch all notifications again
    const allNotifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = allNotifications.filter(n => !n.read).length;

    return NextResponse.json({ 
      notifications: allNotifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        read: n.read,
        link: n.link,
      })), 
      unreadCount 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
