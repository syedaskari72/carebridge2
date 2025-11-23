import { Server } from "socket.io";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.json({ message: "Socket.io server" });
  
  if (!(global as any).io) {
    const io = new Server((res as any).socket?.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      socket.on("join-chat", (chatId: string) => {
        socket.join(chatId);
      });

      socket.on("send-message", ({ chatId, message }) => {
        io.to(chatId).emit("receive-message", message);
      });
    });

    (global as any).io = io;
  }

  return res;
}
