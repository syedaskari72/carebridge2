"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  nurseRecommendation?: {
    id: string;
    name: string;
    gender?: string;
    department?: string;
    specialties?: string[];
    rating?: number;
    hourlyRate?: number;
    location?: string;
    isAvailable?: boolean;
  };
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
      text: "<p>Hello! I'm your CareBridge Medical AI Assistant.</p><p>I can help you with:</p><ul><li>Understanding symptoms and health conditions</li><li>Medication information and interactions</li><li>When to seek medical care</li><li>Recommending nurses from our platform</li><li>General health tips and guidance</li><li>Booking healthcare services</li></ul><p>How can I assist with your health today?</p>",
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
        timestamp: new Date(),
        nurseRecommendation: data.nurseRecommendation
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
    "🩺 What are the symptoms of high blood pressure?",
    "🩸 How often should I check my blood sugar?",
    "🚨 When should I seek emergency care?",
    "👩‍⚕️ Help me book a nurse visit",
    "💊 What medications interact with aspirin?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <>
    <style jsx global>{`
      .ai-response p {
        margin-bottom: 0.75rem;
      }
      .ai-response p:last-child {
        margin-bottom: 0;
      }
      .ai-response ul, .ai-response ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      .ai-response li {
        margin-bottom: 0.25rem;
      }
      .ai-response strong {
        font-weight: 600;
        color: inherit;
      }
      .ai-response em {
        font-style: italic;
      }
    `}</style>
    <div className="w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] flex flex-col">
    <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3 sm:mb-4 pb-3 border-b">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl">
          🤖
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">CareBridge Medical AI</h1>
          <p className="text-xs text-muted-foreground">Your 24/7 Health Assistant</p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 bg-background md:bg-card md:rounded-lg md:border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border text-foreground rounded-bl-sm"
                }`}
              >
                {message.sender === "assistant" ? (
                  <div 
                    className="text-sm leading-relaxed ai-response"
                    dangerouslySetInnerHTML={{ __html: message.text }}
                    style={{
                      wordBreak: 'break-word',
                    }}
                  />
                ) : (
                  <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{message.text}</p>
                )}
                <p className={`text-xs mt-2 ${
                  message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.nurseRecommendation && (
                <div className="mt-3 max-w-[85%] sm:max-w-[75%] lg:max-w-2xl w-full">
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-2 border-cyan-200 dark:border-cyan-800 rounded-xl p-4 shadow-md">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">👩⚕️</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{message.nurseRecommendation.name}</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">Verified</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.nurseRecommendation.department || "General"}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{message.nurseRecommendation.rating || 4.8}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="font-medium">PKR {message.nurseRecommendation.hourlyRate || 2500}/hr</span>
                      </div>
                      {message.nurseRecommendation.gender && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Gender:</span>
                          <span>{message.nurseRecommendation.gender}</span>
                        </div>
                      )}
                      {message.nurseRecommendation.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{message.nurseRecommendation.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {message.nurseRecommendation.specialties && message.nurseRecommendation.specialties.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1.5">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.nurseRecommendation.specialties.map((specialty: string) => (
                            <span
                              key={specialty}
                              className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => window.location.href = `/book/nurse?nurse=${message.nurseRecommendation?.id}`}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )}
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
          <div className="p-3 sm:p-4 border-t bg-muted/30">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">💡 Quick questions:</p>
            <div className="flex flex-col gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-3 py-2 text-xs sm:text-sm bg-background border rounded-lg hover:bg-primary/5 hover:border-primary transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t bg-background">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about symptoms, medications, health tips..."
              className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm bg-background"
              rows={2}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="px-4 sm:px-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium self-end"
            >
              {isTyping ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span>⚕️</span>
            <span>Medical AI • For informational purposes only • Consult professionals for diagnosis</span>
          </p>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}
