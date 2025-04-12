"use client";

import { useState } from "react"; // Remove unused imports: useRef, useEffect, useCallback
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radiation, Brain, Activity } from "lucide-react";
// Remove Progress, Alert, Terminal, Video, X from here if not used elsewhere
// Keep Heart icon for logo/other uses

import {
    Mic,
    Heart, // Keep for logo
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
// Remove Dialog imports from here

// --- Import the new PPG Modal component ---
import { PpgModal } from "@/components/ppg-modal"; // Adjust path if necessary

// --- Sensor Data Type (keep as is) ---
interface SensorItem {
    icon: React.ElementType;
    label: string;
    description: string;
    type: 'sensor' | 'camera' | 'report';
}

// --- Sensor Definitions (keep as is) ---
const sensorItems: SensorItem[] = [
    { icon: Heart, label: "Heart Rate", description: "Measure via camera (PPG)", type: 'sensor' },
    { icon: Lungs, label: "Breath Rate", description: "Track your breathing patterns", type: 'sensor' },
    { icon: Footprints, label: "Step Count", description: "Daily activity monitoring", type: 'sensor' },
    { icon: Moon, label: "Sleep Tracking", description: "Analyze your sleep quality", type: 'sensor' },
    { icon: Droplets, label: "SPO₂", description: "Measure oxygen saturation", type: 'sensor' },
];

const cameraItems: SensorItem[] = [
    { icon: Camera, label: "Image Capture", description: "Take photos for analysis", type: 'camera' },
    { icon: VolumeUp, label: "Voice Analysis", description: "Analyze speech patterns", type: 'camera' },
    { icon: Eye, label: "Eye Scan", description: "Check eye health", type: 'camera' },
    { icon: Tongue, label: "Tongue Analysis", description: "Analyze tongue health", type: 'camera' },
    { icon: Scan, label: "Skin & Nail Scan", description: "Detect skin conditions", type: 'camera' },
];

const reportItems: SensorItem[] = [
    { icon: Radiation, label: "X-ray Scan", description: "Analyze X-ray images", type: 'report' },
    { icon: Brain, label: "MRI Scan", description: "Detailed brain and body scans", type: 'report' },
    { icon: Activity, label: "ECG Scan", description: "Monitor heart activity", type: 'report' },
];


export default function Home() {
    const router = useRouter();
    const [input, setInput] = useState("");
    // --- State for controlling the modal visibility ---
    const [isPpgModalOpen, setIsPpgModalOpen] = useState(false);
    // --- Remove PPG-specific state (heartRate, isProcessingPpg, ppgError, progress) ---
    // --- Remove PPG-specific refs (videoRef, streamRef, etc.) ---

    const handleChatStart = () => {
        if (input.trim()) {
            localStorage.setItem('initialMessage', input);
        }
        router.push("/chat");
    };

    // --- Unified Click Handler ---
    const handleItemClick = (item: SensorItem) => {
        const targetPath = `/${item.type}/${item.label.toLowerCase().replace(/\s+/g, '-')}`;

        if (item.label === "Heart Rate" && item.type === 'sensor') {
            // --- Only set the state to open the modal ---
            setIsPpgModalOpen(true);
        } else {
            // Navigate for other items
            router.push(targetPath);
        }
    };

    // --- Remove startPpgScan and stopCamera functions ---
    // --- Remove useEffect related to PPG modal ---

    // --- Function to handle modal open/close state change ---
    const handleModalOpenChange = (open: boolean) => {
        setIsPpgModalOpen(open);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar (keep as is) */}
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

            {/* Hero Section (keep as is) */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Early Action, Healthy Living
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-8">
                        Your personal AI-powered health companion that helps you stay ahead of health issues
                        through preventive care and early detection.
                    </p>

                    {/* AI Chat Box (keep as is) */}
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

             {/* Health Scanning Sections (keep as is, handleItemClick triggers modal) */}
             <section className="container mx-auto px-4 py-12">
                <Tabs defaultValue="sensors" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="sensors">Sensor-based Scanning</TabsTrigger>
                        <TabsTrigger value="camera">Camera-based Analysis</TabsTrigger>
                        <TabsTrigger value="reports">Scan-reports Analysis</TabsTrigger>
                    </TabsList>

                    {/* Sensor Tab */}
                    <TabsContent value="sensors">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sensorItems.map((item, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5 text-center justify-center items-center"
                                    onClick={() => handleItemClick(item)} // Pass item here
                                >
                                    <item.icon className="h-8 w-8 mb-1 mx-auto" />
                                    <span className="font-medium block">{item.label}</span>
                                    <span className="text-xs text-muted-foreground block">{item.description}</span>
                                </Button>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Camera Tab */}
                     <TabsContent value="camera">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {cameraItems.map((item, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5 text-center justify-center items-center"
                                    onClick={() => handleItemClick(item)} // Pass item here
                                >
                                     <item.icon className="h-8 w-8 mb-1 mx-auto" />
                                     <span className="font-medium block">{item.label}</span>
                                     <span className="text-xs text-muted-foreground block">{item.description}</span>
                                </Button>
                            ))}
                        </div>
                    </TabsContent>

                     {/* Reports Tab */}
                    <TabsContent value="reports">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {reportItems.map((item, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="h-32 flex-col space-y-2 p-4 hover:bg-primary/5 text-center justify-center items-center"
                                    onClick={() => handleItemClick(item)} // Pass item here
                                >
                                     <item.icon className="h-8 w-8 mb-1 mx-auto" />
                                     <span className="font-medium block">{item.label}</span>
                                     <span className="text-xs text-muted-foreground block">{item.description}</span>
                                </Button>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </section>

            {/* Insights Section (keep as is) */}
            <section className="container mx-auto px-4 py-12 bg-muted/50">
                {/* ... */}
            </section>

            {/* FAQ Section (keep as is) */}
            <section className="container mx-auto px-4 py-12">
                 {/* ... */}
                 <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-6 text-center">
                        Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                        <AccordionTrigger>How do the sensor-based scans work?</AccordionTrigger>
                        <AccordionContent>
                            For Heart Rate, the app uses your phone's camera (Photoplethysmography - PPG) to detect subtle changes in finger color corresponding to blood flow. For other metrics like steps or sleep (if integrated with wearables/OS health data), it uses device sensors or connected services.
                        </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                        <AccordionTrigger>Is the camera analysis safe and private?</AccordionTrigger>
                        <AccordionContent>
                            Yes, the heart rate analysis using the camera is performed locally on your device during the scan. Your privacy is important; the video stream is only used for calculation and is not stored or transmitted. Other camera features follow similar privacy principles where applicable.
                        </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                        <AccordionTrigger>How accurate is the PPG heart rate scan?</AccordionTrigger>
                        <AccordionContent>
                           Camera-based PPG accuracy can vary depending on factors like finger placement, pressure, lighting, skin tone, and movement. While useful for trends, it may not be as accurate as dedicated medical devices. It should not replace professional medical advice or diagnosis.
                        </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* --- Render the PPG Modal --- */}
            <PpgModal
                isOpen={isPpgModalOpen}
                onOpenChange={handleModalOpenChange}
            />

        </div>
    );
}