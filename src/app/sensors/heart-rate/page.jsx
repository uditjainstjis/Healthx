// src/app/sensors/heart-rate/page.jsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label"; // Import Label
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Terminal, Heart, ArrowLeft, Send } from "lucide-react";

export default function HeartRateScanPage() {
    const router = useRouter();

    const [heartRate, setHeartRate] = useState(null);
    const [isProcessingPpg, setIsProcessingPpg] = useState(false);
    const [ppgError, setPpgError] = useState(null);
    const [progress, setProgress] = useState(0);
    // --- NEW: State for user comment ---
    const [userComment, setUserComment] = useState("");

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const ppgTimeoutRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const isMountedRef = useRef(false); // To prevent state updates after unmount

    // --- stopCamera (robust version) ---
    const stopCamera = useCallback(() => {
        console.log("PPG Page: Stopping camera...");
        if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        ppgTimeoutRef.current = null;
        progressIntervalRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            console.log("PPG Page: Tracks stopped.");
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject = null;
            console.log("PPG Page: Video source cleared.");
        }
        // Reset processing state only if not showing results? Better to reset always on stop.
        // Let subsequent actions manage state if needed.
        // setIsProcessingPpg(false);
        // setProgress(0);
    }, []);

    // --- startPpgScan (robust version) ---
    const startPpgScan = useCallback(async () => {
        if (!isMountedRef.current) return;
        console.log("PPG Page: Attempting to start scan...");

        // Reset state for new scan
        setHeartRate(null);
        setPpgError(null);
        setIsProcessingPpg(true);
        setProgress(0);
        setUserComment(""); // Clear previous comment

        stopCamera(); // Ensure cleanup before start
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
         if (!isMountedRef.current) return;


        let localStream = null;
        try {
            console.log("PPG Page: Requesting user media...");
            const constraints = { video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn("PPG Page: Environment camera failed, trying default.", err);
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") throw err;
                const fallbackConstraints = { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
                localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            }

            if (!isMountedRef.current) { localStream?.getTracks().forEach(t => t.stop()); return; }
            streamRef.current = localStream;

            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
                try {
                    await videoRef.current.play();
                     if (!isMountedRef.current) return; // Check after play starts
                    console.log("PPG Page: Video playing.");
                } catch (playError) {
                     if (!isMountedRef.current) return;
                     if (playError.name === 'AbortError') { console.log("Play aborted"); return; }
                    throw new Error(`Could not play video: ${playError.message}`);
                }
            } else {
                 if (!isMountedRef.current) return;
                 throw new Error("Video ref missing.");
            }

            if (!isMountedRef.current) return; // Check before timers

            // Clear old timers just in case
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            if (ppgTimeoutRef.current) clearTimeout(ppgTimeoutRef.current);

            // Start progress and simulation
            setProgress(10);
            const duration = 10000;
            const intervalTime = 100;
            const steps = duration / intervalTime;
            const increment = 90 / steps;

            progressIntervalRef.current = setInterval(() => {
                 if (!isMountedRef.current) { clearInterval(progressIntervalRef.current); return; }
                 setProgress(p => Math.min(100, p + increment));
            }, intervalTime);

            ppgTimeoutRef.current = setTimeout(() => {
                 if (!isMountedRef.current) { console.log("Unmounted before scan timeout"); return; }
                const bpm = Math.floor(Math.random() * 41) + 60; // 60-100 BPM
                setHeartRate(bpm);
                setIsProcessingPpg(false);
                setProgress(100);
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
                // Don't stop camera here, let user see result/add comment
                console.log("PPG Page: Scan complete. BPM:", bpm);
            }, duration);

        } catch (error) {
             if (!isMountedRef.current) { localStream?.getTracks().forEach(t => t.stop()); return; }
            console.error("PPG Page Error during scan setup:", error);
            let message = "Could not access camera.";
             // ... (more specific error messages) ...
             if (error instanceof DOMException) { /* ... */ }
             else if (error instanceof Error) { message = error.message; }
            setPpgError(message);
            setIsProcessingPpg(false);
            setProgress(0);
            // Stop camera/stream if acquired before error
            localStream?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopCamera]); // Keep dependency

    // --- useEffect for auto-start and cleanup ---
    useEffect(() => {
        isMountedRef.current = true;
        console.log("PPG Page: Component mounted.");
        // Delay start slightly
        const startTimeoutId = setTimeout(() => {
            if (isMountedRef.current) startPpgScan();
        }, 300);

        return () => {
            console.log("PPG Page: Component unmounting...");
            isMountedRef.current = false;
            clearTimeout(startTimeoutId);
            stopCamera(); // Call cleanup
            console.log("PPG Page: Cleanup complete.");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount

    // --- MODIFIED: Function to handle sending data to chat ---
    const handleSendToChat = () => {
        if (heartRate !== null && !ppgError) {
            // Construct the message including the comment if present
            let message = `My heart rate reading is ${heartRate} BPM.`;
            if (userComment.trim()) {
                message += `\nComment: ${userComment.trim()}`; // Add comment on new line
            }

            stopCamera(); // Stop camera before navigating
            console.log(`PPG Page: Navigating to chat with message: "${message}"`);

            // Encode the full message for URL
            const encodedMessage = encodeURIComponent(message);

            // Use a generic parameter name like 'healthReading'
            router.push(`/chat?healthReading=${encodedMessage}`);
        } else {
            console.warn("PPG Page: Attempted to send to chat without a valid heart rate.");
        }
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
                    <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                </div>

                {/* Status Display */}
                {ppgError && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{ppgError}</AlertDescription>
                    </Alert>
                )}
                {isProcessingPpg && !ppgError && (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground animate-pulse">Scanning... Keep finger still</p>
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                    </div>
                )}

                {/* --- Result and Comment Area (Conditional) --- */}
                {!isProcessingPpg && heartRate !== null && !ppgError && (
                     <div className="space-y-4 p-4 border rounded-lg bg-card animate-fade-in">
                        {/* Heart Rate Result */}
                        <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-300 dark:border-green-700">
                            <Heart className="mx-auto h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                            <p className="text-sm text-muted-foreground mb-1">Estimated Heart Rate:</p>
                            <p className="text-4xl font-bold text-green-700 dark:text-green-300">{heartRate}</p>
                            <p className="text-sm text-muted-foreground mt-1">BPM</p>
                        </div>

                         {/* Comment Input */}
                         <div className="space-y-2">
                            <Label htmlFor="hrComment" className="text-sm font-medium">Add a comment (optional):</Label>
                            <Textarea
                                id="hrComment"
                                placeholder="How were you feeling? What were you doing?"
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                                rows={3}
                                className="resize-none"
                             />
                         </div>

                         {/* Send to Chat Button for Result */}
                         <Button onClick={handleSendToChat} className="w-full">
                            <Send className="mr-2 h-4 w-4" /> Send Result to Chat
                         </Button>
                     </div>
                )}
                {/* End Result and Comment Area */}

                {/* Initial state message */}
                {!isProcessingPpg && heartRate === null && !ppgError && progress === 0 && (
                     <div className="text-center p-4 text-muted-foreground">Preparing camera...</div>
                )}
            </div>

            {/* --- Bottom Button Area (Adjusted) --- */}
            <div className="mt-6 flex justify-center space-x-4">
                {/* Scan Again Button: Show if not processing AND (error exists OR result exists) */}
                {!isProcessingPpg && (ppgError || heartRate !== null) && (
                    <Button variant="secondary" onClick={startScan}>
                        Scan Again
                    </Button>
                )}

                {/* Done Button: Always visible */}
                <Button variant="outline" onClick={() => router.back()}>
                    Done
                </Button>
            </div>
            {/* Note: The primary "Send to Chat" button is now shown *with* the result */}
        </div>
    );
}