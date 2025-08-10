"use client";

import { useState, useRef, useEffect } from "react";

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

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
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
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-200px)] flex flex-col">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">AI Health Assistant</h1>
      
      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100 text-slate-900"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-cyan-100" : "text-slate-500"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-slate-900 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-slate-600 mb-3">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-cyan-50 hover:border-cyan-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your health..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="px-6 py-3 button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            ⚠️ This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
