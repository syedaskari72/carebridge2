"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Phone, ArrowLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { createChatId } from "@/lib/chatUtils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const rawChatId = params.id as string;
  
  // Normalize chat ID to ensure consistency
  const [userId1, userId2] = rawChatId.split("-");
  const chatId = createChatId(userId1, userId2);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;

    loadChatDetails();

    const socketInstance = io({
      path: "/api/socket",
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("join-chat", chatId);
    });

    socketInstance.on("receive-message", (message: Message) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatDetails = async () => {
    try {
      console.log('[Chat] Loading chat details for:', chatId);
      const res = await fetch(`/api/chat/${chatId}`);
      console.log('[Chat] API response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Chat] Loaded data:', { 
          otherUser: data.otherUser?.name, 
          messageCount: data.messages?.length 
        });
        setOtherUser(data.otherUser);
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } else {
        console.error('[Chat] Failed to load:', await res.text());
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    const messageData = {
      chatId,
      message: newMessage,
      senderName: session.user.name || "User",
    };

    try {
      console.log('[Chat] Sending message to chatId:', chatId);
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Chat] Message saved:', data.message.id);
        setMessages((prev) => [...prev, data.message]);
        if (socket) {
          socket.emit("send-message", { chatId, message: data.message });
        }
        setNewMessage("");
      } else {
        console.error('[Chat] Failed to send:', await res.text());
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCall = () => {
    if (otherUser?.phone) {
      window.location.href = `tel:${otherUser.phone}`;
    }
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{otherUser?.name || "Loading..."}</h2>
            <p className="text-xs opacity-90">{otherUser?.userType?.toLowerCase()}</p>
          </div>
        </div>
        {otherUser?.phone && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCall}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === session.user.id ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[75%] p-3 ${
                msg.senderId === session.user.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background"
              }`}
            >
              <p className="text-sm break-words">{msg.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
