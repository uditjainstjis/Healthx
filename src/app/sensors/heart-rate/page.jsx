// src/app/sensors/heart-rate/page.jsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Heart, ArrowLeft, Mic } from "lucide-react"; // Added Mic icon

export default function HeartRateScanPage() {
    const router = useRouter();

    const [heartRate, setHeartRate] = useState(null);
    const [isProcessingPpg, setIsProcessingPpg] = useState(false);
    const [ppgError, setPpgError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [aiQuery, setAiQuery] = useState(""); // State for the AI input
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const ppgTimeoutRef = useRef(null);
    const progressIntervalRef = useRef(null);

    const stopCamera = useCallback(() => {
        console.log("PPG Page: Stopping camera...");
        if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            console.log("PPG Page: Tracks stopped.");
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            console.log("PPG Page: Video source cleared.");
        }
        streamRef.current = null;
        // Don't reset processing/progress flags here if called during cleanup
        // Let the start function handle resetting them explicitly
        ppgTimeoutRef.current = null;
        progressIntervalRef.current = null;
    }, []);

    const startPpgScan = useCallback(async () => {
        console.log("PPG Page: Attempting to start scan...");
        setHeartRate(null);
        setPpgError(null);
        setIsProcessingPpg(true);
        setProgress(0);
        setAiQuery(""); // Reset AI query on new scan

        // Stop any existing camera streams/timers before starting new ones
        if (streamRef.current || ppgTimeoutRef.current || progressIntervalRef.current) {
            console.log("PPG Page: Stopping previous scan artifacts before starting new one.");
            if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            streamRef.current = null;
            ppgTimeoutRef.current = null;
            progressIntervalRef.current = null;
        }


        try {
            console.log("PPG Page: Requesting user media...");
            const constraints = { video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("PPG Page: Got environment camera stream.");
            } catch (err) {
                console.warn("PPG Page: Environment camera failed, trying default.", err);
                const fallbackConstraints = { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
                stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                console.log("PPG Page: Got default camera stream.");
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Ensure the video element is ready before playing
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => {
                        resolve();
                    };
                });
                await videoRef.current.play();
                console.log("PPG Page: Video playing.");
            } else {
                throw new Error("Video ref is not available.");
            }

            // Start progress and simulation
            setProgress(10);
            const duration = 10000; // 10 seconds
            const intervalTime = 100; // Update progress every 100ms
            const steps = duration / intervalTime;
            const increment = 90 / steps; // Increment to reach 100% (10 initial + 90 over duration)

            progressIntervalRef.current = setInterval(() => {
                setProgress(p => Math.min(100, p + increment));
            }, intervalTime);

            ppgTimeoutRef.current = setTimeout(() => {
                const bpm = Math.floor(Math.random() * 36) + 60; // Simulate 60-95 BPM
                setHeartRate(bpm);
                setIsProcessingPpg(false);
                setProgress(100); // Ensure progress hits 100
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
                // Camera is intentionally left running until user navigates away or scans again
                console.log("PPG Page: Scan simulation complete. BPM:", bpm);

            }, duration);

        } catch (error) {
            console.error("PPG Page Error during scan setup:", error);
            let message = "Could not access camera. Please ensure permission is granted and the camera is not in use by another application.";
             if (error instanceof DOMException) {
                if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                    message = "No suitable camera found.";
                } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    message = "Camera permission denied. Please grant permission in your browser settings.";
                } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
                    message = "Camera is already in use or encountered a hardware error.";
                } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
                     message = "Could not find a camera matching the requested constraints (e.g., facing mode).";
                }
            } else if (error.message === "Video ref is not available."){
                message = "Internal error: Video element reference missing.";
            }
            setPpgError(message);
            setIsProcessingPpg(false);
            setProgress(0);
            // Explicitly call stopCamera here to clean up resources after a setup failure
            stopCamera();
        }
    }, [stopCamera]); // Include stopCamera in dependencies


    useEffect(() => {
        console.log("PPG Page: Component mounted.");
        const startDelayMs = 300;
        const startTimeoutId = setTimeout(() => {

            // Only start if the component is still mounted and no error occurred during potential previous attempts
            if (!ppgError && videoRef.current) { // Check videoRef as proxy for mounted state
                 startPpgScan();
            } else {
                 console.log("PPG Page: Scan start aborted (component unmounted or error present).");
            }
        }, startDelayMs);

        return () => {
            console.log("PPG Page: Component unmounting...");
            clearTimeout(startTimeoutId);
            stopCamera(); // Use the memoized stop function for cleanup
            console.log("PPG Page: Cleanup complete.");
        };
        // Start scan only on initial mount. Avoid re-running if dependencies change.
        // startPpgScan is memoized, but adding it can cause re-runs if its own deps change unexpectedly.
        // We want the mount/unmount behavior primarily.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Keep dependencies minimal for mount/unmount behavior

    // --- Handlers for AI Input ---
    const handleAiInputChange = (event) => {
        setAiQuery(event.target.value);
    };

    const handleAiInputKeyDown = (event) => {
        if (event.key === 'Enter' && aiQuery.trim()) {
            event.preventDefault(); // Prevent potential form submission if wrapped later
            console.log("PPG Page: Navigating to chat with query:", aiQuery);
            // Optionally pass the query via state or query params later
            router.push('/chat');
        } else if (event.key === 'Enter') {
             event.preventDefault();
             // Optionally provide feedback if Enter is pressed with empty input
             console.log("PPG Page: Enter pressed on empty AI input, doing nothing.");
        }
    };

    const handleMicClick = () => {
        console.log("PPG Page: Mic button clicked, navigating to chat.");
        // Navigate to chat, potentially activating voice input on that page later
        router.push('/chat');
    };

    // --- RETURN page JSX ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-lg">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-4 text-center">Heart Rate Scan (PPG)</h1>

            <p className="text-muted-foreground mb-6 text-center">
                Place your index finger gently over the rear camera lens, covering it completely. Remain still.
            </p>

            <div className="py-4 space-y-4">
                {/* Video Feed */}
                <div className="relative w-full aspect-video bg-neutral-800 rounded overflow-hidden border border-neutral-700">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    ></video>
                    {/* Optional: Add overlay/indicator if needed */}
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
                        <p className="text-sm text-muted-foreground animate-pulse">Scanning... Keep finger still</p>
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                    </div>
                )}
                {!isProcessingPpg && heartRate !== null && !ppgError && (
                    <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-300 dark:border-green-700">
                        <Heart className="mx-auto h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Estimated Heart Rate:</p>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-300">{heartRate}</p>
                        <p className="text-sm text-muted-foreground mt-1">BPM</p>

                        {/* --- NEW: AI Input Section --- */}
                        <div className="mt-6 flex items-center space-x-2">
                            <Input
                                type="text"
                                placeholder="Ask about this heart rate..."
                                value={aiQuery}
                                onChange={handleAiInputChange}
                                onKeyDown={handleAiInputKeyDown}
                                className="flex-grow" // Allow input to take available space
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleMicClick}
                                aria-label="Ask AI via voice"
                            >
                                <Mic className="h-5 w-5" />
                            </Button>
                        </div>
                        {/* --- End AI Input Section --- */}
                    </div>
                )}
                {/* Initial state */}
                {!isProcessingPpg && heartRate === null && !ppgError && progress === 0 && (
                     <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-300 dark:border-blue-700">
                        <p className="text-sm text-muted-foreground">Preparing camera...</p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-center space-x-4">
                {/* Scan Again Button: Show if not processing AND (error exists OR result exists) */}
                {!isProcessingPpg && (ppgError || heartRate !== null) && (
                    <Button variant="secondary" onClick={startPpgScan}>
                        Scan Again
                    </Button>
                )}
                {/* Done Button: Always show */}
                <Button variant="outline" onClick={() => router.back()}>
                    Done
                </Button>
            </div>
        </div>
    );
}