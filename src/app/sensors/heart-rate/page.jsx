// src/app/sensors/heart-rate/page.jsx

"use client";

// Keep necessary imports
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Heart, ArrowLeft } from "lucide-react"; // Removed Video icon as it wasn't used in JSX below

export default function HeartRateScanPage() {
    const router = useRouter();

    const [heartRate, setHeartRate] = useState(null);
    const [isProcessingPpg, setIsProcessingPpg] = useState(false);
    const [ppgError, setPpgError] = useState(null);
    const [progress, setProgress] = useState(0);
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
        setIsProcessingPpg(false); // Ensure processing stops visually
        setProgress(0); // Reset progress
        ppgTimeoutRef.current = null;
        progressIntervalRef.current = null;
    }, []);

    const startPpgScan = useCallback(async () => {
        console.log("PPG Page: Attempting to start scan...");
        setHeartRate(null);
        setPpgError(null);
        setIsProcessingPpg(true);
        setProgress(0);

        // Ensure any previous streams/timers are stopped before starting new ones
        stopCamera();

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
                await videoRef.current.play();
                console.log("PPG Page: Video playing.");
            } else {
                // This case should ideally not happen if component mounted correctly
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
                // Don't stop camera here, let user see result or scan again
                console.log("PPG Page: Scan simulation complete. BPM:", bpm);
                // Stop camera after a brief delay showing the result, or let Scan Again/Done handle it.
                // For simplicity, we'll let the buttons or unmount handle the final stop.

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
            stopCamera(); // Clean up if setup failed
        }
    }, [stopCamera]); // Include stopCamera in dependencies


    // --- CHANGE: Use effect to start scan automatically WITH A DELAY ---
    useEffect(() => {
        console.log("PPG Page: Component mounted.");

        // Use a timeout to slightly delay the camera start after navigation
        const startDelayMs = 300; // Delay in milliseconds (adjust if needed)
        const startTimeoutId = setTimeout(() => {
            console.log(`PPG Page: ${startDelayMs}ms delay finished, starting scan.`);
            startPpgScan();
        }, startDelayMs);

        // Return cleanup function
        return () => {
            console.log("PPG Page: Component unmounting...");
            clearTimeout(startTimeoutId); // Clear the start timeout if component unmounts before it fires
            stopCamera(); // Call the memoized stop function
            console.log("PPG Page: Cleanup complete.");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startPpgScan]); // Add startPpgScan (which depends on stopCamera)

    // --- RETURN page JSX (No Dialog wrapper) ---
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
                        className="w-full h-full object-cover" // Ensure video fills the container
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
                    </div>
                )}
                {/* Initial state before scan starts or if it finishes without error/result */}
                {!isProcessingPpg && heartRate === null && !ppgError && progress === 0 && (
                     <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-300 dark:border-blue-700">
                        <p className="text-sm text-muted-foreground">Preparing camera...</p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-center space-x-4">
                {/* Scan Again Button: Show if not processing and (error exists or result exists) */}
                {!isProcessingPpg && (ppgError || heartRate !== null) && (
                    <Button variant="secondary" onClick={startPpgScan}>
                        Scan Again
                    </Button>
                )}
                {/* Done Button: Always show? Or hide while processing? Let's always show it. */}
                <Button variant="outline" onClick={() => router.back()}>
                    Done
                </Button>
            </div>
        </div>
    );
}