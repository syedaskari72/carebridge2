"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

// Mock AI responses - replace with real AI integration
const mockResponses = [
  "I'm here to help with your health questions. What would you like to know?",
  "Based on your symptoms, I recommend consulting with a healthcare professional. Would you like me to help you book a nurse visit?",
  "For medication management, it's important to follow your prescribed schedule. I can help you set up reminders.",
  "That sounds like it could be related to several conditions. Let me ask a few questions to better understand your situation.",
  "I recommend monitoring your symptoms and seeking medical attention if they worsen. Would you like me to connect you with a nurse?"
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your CareBridge AI Assistant. I can help answer health questions, provide medical guidance, and assist with booking healthcare services. How can I help you today?",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    const messageText = inputText;
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      console.log('[Chat] Sending message:', messageText);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText })
      });

      console.log('[Chat] Response status:', response.status);

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.success ? data.message : "Sorry, I couldn't process that. Please try again.",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What are the symptoms of high blood pressure?",
    "How often should I check my blood sugar?",
    "When should I seek emergency care?",
    "Help me book a nurse visit",
    "What medications interact with aspirin?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="w-full overflow-x-hidden">
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">AI Health Assistant</h1>
      
      {/* Chat Messages */}
      <div className="flex-1 bg-card rounded-lg border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-xs sm:text-sm break-words">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted px-3 sm:px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-3 sm:p-4 border-t bg-muted/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-card border rounded-full hover:bg-primary/10 hover:border-primary transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your health..."
              className="flex-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm bg-background"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🤖 Powered by Groq AI (Llama 3.3) • ⚠️ This provides general health information only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
