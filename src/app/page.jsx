"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import TabsComp from './components/TabsComp';
import Faqs from './components/Faqs';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import {
  Mic,
  Heart,
  Settings as Lungs,
  Footprints,
  Moon,
  Droplets,
  Camera,
  Volume as VolumeUp,
  Eye,
  BringToFront as Tongue,
  Scan,
  ChevronRight,
  Menu,
} from "lucide-react";


export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleChatStart = () => {
    // Store the input in localStorage before navigating
    if (input.trim()) {
      localStorage.setItem('initialMessage', input);
    }
    router.push("/chat");
  };

  const handleSensorClick = (type) => {
    router.push(`/sensors/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleCameraClick = (type) => {
    router.push(`/camera/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar/>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Early Action, Healthy Living
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Your personal AI-powered health companion that helps you stay ahead of health issues
            through preventive care and early detection.
          </p>

          {/* AI Chat Box */}
          <Card className="p-4 mb-12">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Chat with AI about your health concerns..."
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatStart()}
              />
              <Button variant="outline" size="icon" onClick={handleChatStart}>
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
      {/* Health Scanning Sections */}
      <TabsComp handleSensorClick={handleSensorClick} handleCameraClick={handleCameraClick}/>

      {/* Insights Section */}
      <section className="container mx-auto px-4 py-12 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            AI-Powered Health Insights
          </h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Personalized Health Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Get real-time insights based on your vital signs and daily activities
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <Faqs/>
    </div>
  );
}