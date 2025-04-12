'use client'
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Heart, Send, Mic, MessageSquare, Plus, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState([
    {
      id: "1",
      title: "General Health Advice",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm your AI health assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    },
  ]);
  const [currentChat, setCurrentChat] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Check for initial message from home page
    const initialMessage = localStorage.getItem("initialMessage");
    if (initialMessage) {
      handleSendMessage(initialMessage);
      localStorage.removeItem("initialMessage");
    }
  }, []);

  const handleSendMessage = (message) => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChat
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );

    // Simulate AI response with loading state
    setIsLoading(true);
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(message),
        timestamp: new Date(),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChat
            ? {
                ...chat,
                messages: [...chat.messages, aiResponse],
              }
            : chat
        )
      );
      setIsLoading(false);
    }, 1000);

    setInput("");
  };

  const generateAIResponse = (message) => {
    // Simulate AI response based on keywords
    const lowercaseMessage = message.toLowerCase();
    if (lowercaseMessage.includes("heart") || lowercaseMessage.includes("chest")) {
      return "Based on your description, I recommend monitoring your heart rate and consulting with a healthcare provider. Would you like to use our heart rate monitoring feature?";
    } else if (lowercaseMessage.includes("breath") || lowercaseMessage.includes("breathing")) {
      return "Breathing issues can be concerning. Let's check your breathing rate using our sensor. Would you like to start a breathing assessment?";
    } else if (lowercaseMessage.includes("sleep") || lowercaseMessage.includes("tired")) {
      return "Sleep quality is crucial for health. I can help you track your sleep patterns using our sleep monitoring feature. Would you like to learn more?";
    }
    return "I understand your health concern. While I can provide general information, please consult with a healthcare professional for personalized medical advice. Would you like to explore our health monitoring features?";
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Hello! How can I assist you with your health today?",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat.id);
  };

  const handleVoiceInput = async () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition Not Available: Your browser doesn't support speech recognition.");
      return;
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      alert("Error: Failed to start voice recognition. Please try again.");
    }
  };

  const currentChatData = chats.find((chat) => chat.id === currentChat);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <div className="p-4">
          <Button className="w-full justify-start space-x-2" onClick={createNewChat}>
            <Plus size={16} />
            <span>New chat</span>
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-2 space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant={chat.id === currentChat ? "secondary" : "ghost"}
                className="w-full justify-start space-x-2"
                onClick={() => setCurrentChat(chat.id)}
              >
                <MessageSquare size={16} />
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center px-6">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold">HealthGuard AI Chat</span>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {currentChatData?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your health question..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage(input)}
            />
            <Button variant="outline" size="icon" onClick={handleVoiceInput} disabled={isListening}>
              {isListening ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Button onClick={() => handleSendMessage(input)} disabled={!input.trim() || isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}