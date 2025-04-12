"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radiation, Brain, Activity } from "lucide-react";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const handleSensorClick = (type: string) => {
    router.push(`/sensors/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleCameraClick = (type: string) => {
    router.push(`/camera/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">HealthGuard AI</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">How it Works</Button>
            <Button variant="ghost">About</Button>
            <Button>Get Started</Button>
          </div>
          <Button variant="ghost" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

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
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="sensors" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sensors">Sensor-based Scanning</TabsTrigger>
            <TabsTrigger value="camera">Camera-based Analysis</TabsTrigger>
            <TabsTrigger value="reports">Scan-reports Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sensors">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Heart, label: "Heart Rate", description: "Monitor your heart rate in real-time" },
                { icon: Lungs, label: "Breath Rate", description: "Track your breathing patterns" },
                { icon: Footprints, label: "Step Count", description: "Daily activity monitoring" },
                { icon: Moon, label: "Sleep Tracking", description: "Analyze your sleep quality" },
                { icon: Droplets, label: "SPO₂", description: "Measure oxygen saturation" },
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                  onClick={() => handleSensorClick(item.label)}
                >
                  <item.icon className="h-8 w-8" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="camera">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Camera, label: "Image Capture", description: "Take photos for analysis" },
                { icon: VolumeUp, label: "Voice Analysis", description: "Analyze speech patterns" },
                { icon: Eye, label: "Eye Scan", description: "Check eye health" },
                { icon: Tongue, label: "Tongue Analysis", description: "Analyze tongue health" },
                { icon: Scan, label: "Skin & Nail Scan", description: "Detect skin conditions" },
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                  onClick={() => handleCameraClick(item.label)}
                >
                  <item.icon className="h-8 w-8" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Radiation, label: "X-ray Scan", description: "Analyze X-ray images" },
                { icon: Brain, label: "MRI Scan", description: "Detailed brain and body scans" },
                { icon: Activity, label: "ECG Scan", description: "Monitor heart activity" },
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5"
                  onClick={() => handleCameraClick(item.label)}
                >
                  <item.icon className="h-8 w-8" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </Button>
              ))}
            </div>
        </TabsContent>
        </Tabs>
      </section>

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
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>How do the sensor-based scans work?</AccordionTrigger>
              <AccordionContent>
                Our app uses your device built-in sensors to measure various health metrics.
                Simply follow the on-screen instructions for each measurement type.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is the camera analysis safe and private?</AccordionTrigger>
              <AccordionContent>
                Yes, all camera-based analyses are performed locally on your device.
                Your privacy is our top priority, and no images are stored or transmitted.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How accurate are the AI predictions?</AccordionTrigger>
              <AccordionContent>
                Our AI models are trained on extensive medical datasets and provide insights
                with high accuracy. However, they should not replace professional medical advice.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}