// src/app/chat/page.jsx (or .tsx)
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Heart, Send, Mic, MessageSquare, Plus, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState([]); // Array of chat objects
  const [currentChat, setCurrentChat] = useState(null); // ID of the current chat
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const storedChats = localStorage.getItem('chats');
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    } else {
      // Create a default chat if there are no existing chats
      createNewChat();
    }
  }, []);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chats, currentChat]);


  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to the current chat
    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === currentChat) {
          return { ...chat, messages: [...chat.messages, newUserMessage] };
        }
        return chat;
      });
    });

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/medlm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        // Display an error message to the user (consider using a state variable for this)
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response; // Adjust based on the API response

      const newAiMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === currentChat) {
            return { ...chat, messages: [...chat.messages, newAiMessage] };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle the error (e.g., display an error message to the user)
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
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
    setCurrentChat(newChatId);
  };

  const handleVoiceInput = async () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(
        "Speech Recognition Not Available: Your browser doesn't support speech recognition."
      );
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
          <Button
            className="w-full justify-start space-x-2"
            onClick={createNewChat}
          >
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
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isListening}
            >
              {isListening ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}