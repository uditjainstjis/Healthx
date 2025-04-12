// src/components/ppg-modal.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Terminal, } from "lucide-react"; // Add Heart icon if needed for display
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

interface PpgModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    // Optional: Callback when measurement is done
    // onMeasurementComplete?: (bpm: number) => void;
}

export function PpgModal({ isOpen, onOpenChange }: PpgModalProps) {
    const [heartRate, setHeartRate] = useState<number | null>(null);
    const [isProcessingPpg, setIsProcessingPpg] = useState(false);
    const [ppgError, setPpgError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const ppgTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopCamera = useCallback(() => {
        console.log("PPG Modal: Attempting to stop camera...");
        // Clear timeouts/intervals first
        if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        ppgTimeoutRef.current = null;
        progressIntervalRef.current = null;

        // Stop media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                console.log(`PPG Modal: Stopping track: ${track.kind} (${track.label})`);
                track.stop();
            });
            streamRef.current = null;
            console.log("PPG Modal: Stream tracks stopped.");
        }

        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load(); // Explicitly load to clear the last frame in some browsers
            console.log("PPG Modal: Video srcObject set to null.");
        }

        // Reset state related to active scanning
        setIsProcessingPpg(false);
        // Keep heartRate and ppgError displayed until next scan or close
        // setHeartRate(null); // Don't reset result immediately
        // setPpgError(null); // Don't reset error immediately
        setProgress(0);

    }, []); // No dependencies needed

    const startPpgScan = useCallback(async () => {
        console.log("PPG Modal: Starting PPG scan...");
        setHeartRate(null); // Clear previous result
        setPpgError(null); // Clear previous error
        setIsProcessingPpg(true);
        setProgress(0);

        // Stop any existing stream before starting anew
        stopCamera();

        try {
            console.log("PPG Modal: Requesting camera access...");
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: "environment", // Prefer rear camera
                    width: { ideal: 640 },     // Smaller resolution might be sufficient
                    height: { ideal: 480 },
                    // Advanced constraints (often don't work reliably across browsers/devices)
                    // advanced: [{ torch: true }] // Attempt to turn on flash (experimental, often fails)
                },
                audio: false,
            };

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                 console.warn("PPG Modal: Rear camera failed or not available, trying default camera:", err);
                 const fallbackConstraints: MediaStreamConstraints = {
                     video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                     },
                     audio: false
                 };
                 stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            }

            streamRef.current = stream;
            console.log("PPG Modal: Camera access granted.");

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Ensure video plays even if user hasn't interacted recently (common on mobile)
                await videoRef.current.play().catch(e => {
                    console.error("PPG Modal: Video play error:", e);
                    // Handle autoplay failure (e.g., show a manual play button or specific error)
                    throw new Error("Could not play video stream.");
                });
                console.log("PPG Modal: Video stream attached and playing.");
            } else {
                console.error("PPG Modal: Video element ref not found.");
                throw new Error("Video element not available.");
            }

            // --- Progress Simulation ---
            setProgress(10);
            const duration = 10000; // Simulate 10 seconds processing
            const intervalTime = 100;
            const steps = duration / intervalTime;
            const increment = 90 / steps; // Progress from 10% to 100%

            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Clear previous just in case
            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => {
                    const nextVal = prev + increment;
                    if (nextVal >= 100) {
                        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = null;
                        return 100;
                    }
                    return nextVal;
                });
            }, intervalTime);

            // --- Simulate PPG Calculation ---
            if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current); // Clear previous just in case
            ppgTimeoutRef.current = setTimeout(() => {
                const simulatedBpm = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
                setHeartRate(simulatedBpm);
                setIsProcessingPpg(false);
                setProgress(100);
                console.log("PPG Modal: Simulation Complete. BPM:", simulatedBpm);
                // Optional: call callback
                // if (onMeasurementComplete) onMeasurementComplete(simulatedBpm);

                 // Keep camera running until modal is closed for better UX
                 // stopCamera();

                 // Clear interval if timeout finishes before progress reaches 100%
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                 progressIntervalRef.current = null;

            }, duration);

        } catch (error) {
            console.error("PPG Modal: Error during scan setup:", error);
            let message = "Could not access camera. Please ensure permission is granted and try again.";
            if (error instanceof Error) {
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    message = "Camera permission denied. Please enable it in your browser/system settings.";
                } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                    message = "No suitable camera found on this device.";
                } else if (error.message.includes("Could not play video stream")) {
                    message = "Could not start video stream. Please ensure permissions are granted and try again."
                }
                 else {
                    message = `Error: ${error.message}`;
                }
            }
            setPpgError(message);
            setIsProcessingPpg(false);
            setProgress(0);
            stopCamera(); // Ensure cleanup on critical error
        }
    }, [stopCamera]); // Add stopCamera dependency

    // Effect to manage camera based on modal visibility
    useEffect(() => {
        if (isOpen) {
            // Delay start slightly to allow modal animation
            const timer = setTimeout(() => {
                startPpgScan();
            }, 100); // Adjust delay as needed
             return () => clearTimeout(timer);
        } else {
            // Stop camera immediately when modal starts closing
            stopCamera();
        }
    }, [isOpen, startPpgScan, stopCamera]); // Rerun when modal opens/closes or functions change

    // Ensure cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
                // Prevent closing if processing, optional
                // if (isProcessingPpg) {
                //    e.preventDefault();
                // }
            }}>
                <DialogHeader>
                    <DialogTitle>Heart Rate Scan (PPG)</DialogTitle>
                    <DialogDescription>
                        Place your index finger gently over the **rear camera lens**.
                        Ensure your finger covers the lens{/* and flash (if possible) */}. Remain still.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Video Feed */}
                    <div className="relative w-full aspect-video bg-black rounded overflow-hidden border">
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            // Add poster if needed for initial state
                            // poster="/path/to/placeholder.jpg"
                        ></video>
                         {/* Optional: Add an overlay or indicator for finger placement */}
                         {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 border-2 border-dashed border-red-500 rounded-full opacity-50"></div>
                         </div> */}
                    </div>

                    {/* Status Display */}
                    {ppgError && (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{ppgError}</AlertDescription>
                        </Alert>
                    )}

                    {isProcessingPpg && !ppgError && (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground animate-pulse">Scanning... Please keep still.</p>
                            <Progress value={progress} className="w-full" />
                            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                        </div>
                    )}

                    {!isProcessingPpg && heartRate !== null && !ppgError && (
                        <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-300 dark:border-green-700">
                            <p className="text-sm text-muted-foreground mb-1">Estimated Heart Rate:</p>
                            <p className="text-4xl font-bold text-green-700 dark:text-green-300">{heartRate}</p>
                            <p className="text-sm text-muted-foreground mt-1">BPM</p>
                        </div>
                    )}

                    {/* Ready state (optional) */}
                    {!isProcessingPpg && heartRate === null && !ppgError && progress === 0 && isOpen && (
                         <p className="text-center text-sm text-muted-foreground">Preparing camera...</p>
                    )}

                    {/* Initial instruction state before starting */}
                     {!isProcessingPpg && heartRate === null && !ppgError && progress === 0 && !isOpen && (
                         <p className="text-center text-sm text-muted-foreground">Ready to start scan.</p>
                     )}

                </div>

                <DialogFooter className="sm:justify-between">
                     {/* Restart Button - only show if not processing and maybe if there was an error or result */}
                    {(!isProcessingPpg && (ppgError || heartRate !== null)) && (
                        <Button variant="secondary" onClick={startPpgScan}>
                             Scan Again
                        </Button>
                    )}
                     {/* Spacer if Scan Again button is not shown */}
                     {isProcessingPpg || (!ppgError && heartRate === null) ? <div/> : null}


                     {/* Close Button */}
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}