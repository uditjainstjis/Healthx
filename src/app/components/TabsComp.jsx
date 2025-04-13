import { Button } from "@/components/ui/button";
import { Radiation, Brain, Activity } from "lucide-react";

import {
    Mic,
    Heart,
    Settings as Lungs,
    Footprints,
    Moon,
    Droplets,
    ScanFaceIcon,
    Volume as VolumeUp,
    Eye,
    BringToFront as Tongue,
    Scan,
    ChevronRight,
    Menu,
  } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsComp({handleCameraClick, handleSensorClick}){

    return(

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
      { icon: ScanFaceIcon, label: "Checkup via Face", description: "Take photos for analysis" },
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

)
}