// src/app/sensors/breath-rate/page.jsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Settings as Lungs, ArrowLeft, Send, Mic, Volume2, Waves } from "lucide-react"; // Added Mic, Volume2, Waves

// --- Constants for Audio Processing ---
const MEASUREMENT_DURATION_MS = 20000; // 20 seconds
const ANALYSIS_INTERVAL_MS = 100; // Analyze audio every 100ms
const VOLUME_THRESHOLD = 10; // Sensitivity - ADJUST AS NEEDED (lower = more sensitive)
const SILENCE_THRESHOLD = 5; // Threshold below which we consider it silent - ADJUST AS NEEDED

export default function BreathRateScanPage() {
    const router = useRouter();

    const [breathRate, setBreathRate] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [detectedBreaths, setDetectedBreaths] = useState(0);
    const [currentVolume, setCurrentVolume] = useState(0); // For visual feedback

    // Refs for Web Audio API and timers
    const audioContextRef = useRef(null);
    const streamRef = useRef(null);
    const analyserNodeRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const dataArrayRef = useRef(null); // Uint8Array for audio data

    const processingTimeoutRef = useRef(null); // Overall measurement timer
    const analysisIntervalRef = useRef(null); // Audio analysis timer
    const progressIntervalRef = useRef(null); // UI progress timer

    // Ref to track breathing state to avoid double counting
    const isCurrentlyBreathingRef = useRef(false);

    // --- stopScan function ---
    const stopScan = useCallback(() => {
        console.log("Breath Rate Page: Stopping scan...");

        // Clear timers
        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        // Stop audio analysis loop
        if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        }

        // Stop MediaStream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            console.log("Breath Rate Page: MediaStream tracks stopped.");
            streamRef.current = null;
        }

        // Disconnect nodes and close AudioContext
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
         if (analyserNodeRef.current) {
            analyserNodeRef.current.disconnect(); // Ensure analyser is disconnected
            analyserNodeRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => {
                console.log("Breath Rate Page: AudioContext closed.");
            }).catch(e => console.error("Error closing AudioContext:", e));
            audioContextRef.current = null;
        }


        // Reset state
        setIsProcessing(false);
        setProgress(0);
        setCurrentVolume(0);
        // Don't reset detectedBreaths or breathRate immediately if showing result
        processingTimeoutRef.current = null;
        progressIntervalRef.current = null;
        isCurrentlyBreathingRef.current = false; // Reset breathing state flag

    }, []);


    // --- Function to perform audio analysis ---
    const analyzeAudio = useCallback(() => {
        if (!analyserNodeRef.current || !dataArrayRef.current) return;

        analyserNodeRef.current.getByteFrequencyData(dataArrayRef.current); // Or getByteTimeDomainData

        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
        }
        const averageVolume = sum / dataArrayRef.current.length;
        setCurrentVolume(averageVolume); // Update visual feedback state

        // --- Breath Detection Logic ---
        if (!isCurrentlyBreathingRef.current && averageVolume > VOLUME_THRESHOLD) {
            // Transition from silence/quiet to loud (potential breath)
            isCurrentlyBreathingRef.current = true;
            setDetectedBreaths(count => count + 1);
            console.log("Breath detected! Count:", detectedBreaths + 1, "Volume:", averageVolume);
        } else if (isCurrentlyBreathingRef.current && averageVolume < SILENCE_THRESHOLD) {
            // Transition from loud back to silence/quiet
            isCurrentlyBreathingRef.current = false;
            // console.log("Returned to silence. Volume:", averageVolume);
        }
        // --- End Breath Detection Logic ---

    }, [detectedBreaths]); // Include detectedBreaths to log the correct count


    // --- startScan function ---
    const startScan = useCallback(async () => {
        console.log("Breath Rate Page: Attempting to start scan...");
        // Reset states for a new scan
        setBreathRate(null);
        setProcessingError(null);
        setIsProcessing(true);
        setProgress(0);
        setDetectedBreaths(0);
        setCurrentVolume(0);
        isCurrentlyBreathingRef.current = false; // Ensure breathing flag is reset

        // Ensure any previous scan is fully stopped
        stopScan();
        // Brief delay before requesting media again
        await new Promise(resolve => setTimeout(resolve, 150));

        try {
            // 1. Get Microphone Access
            console.log("Breath Rate Page: Requesting microphone access...");
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia is not supported in this browser.");
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            console.log("Breath Rate Page: Microphone access granted.");

            // 2. Create Audio Context and Nodes
             if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                 console.warn("Breath Rate Page: Existing AudioContext found, closing before creating new one.");
                 await audioContextRef.current.close(); // Ensure previous context is closed
             }
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256; // Smaller FFT size, less freq detail but faster. Adjust if needed.
            const bufferLength = analyserNodeRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength); // Array to hold frequency data

            sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceNodeRef.current.connect(analyserNodeRef.current);
            // We don't connect analyserNode to destination as we only analyze, not play back.

            console.log("Breath Rate Page: AudioContext and nodes set up.");

            // 3. Start Analysis Loop
            analysisIntervalRef.current = setInterval(analyzeAudio, ANALYSIS_INTERVAL_MS);

            // 4. Start UI Progress and Measurement Timer
            setProgress(5); // Initial progress
            const progressSteps = (MEASUREMENT_DURATION_MS / 100); // e.g., 200 steps for 20s
            const progressIncrement = 95 / progressSteps;

            progressIntervalRef.current = setInterval(() => {
                setProgress(p => Math.min(100, p + progressIncrement));
            }, 100);

            processingTimeoutRef.current = setTimeout(() => {
                console.log("Breath Rate Page: Measurement duration complete.");
                 // Final breath count is captured via state `detectedBreaths`
                const finalBreathCount = detectedBreaths; // Read the state value *at this time*
                const rate = Math.round(finalBreathCount * (60000 / MEASUREMENT_DURATION_MS));
                setBreathRate(rate);
                setProgress(100);
                console.log("Breath Rate Page: Calculated Rate:", rate, "from", finalBreathCount, "breaths.");

                stopScan(); // Stop everything except state related to showing results
                setIsProcessing(false); // Set processing to false *after* stopping scan

            }, MEASUREMENT_DURATION_MS);

        } catch (error) {
            console.error("Breath Rate Page Error during scan setup:", error);
            let message = "Could not start breath rate measurement.";
            if (error instanceof DOMException) {
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    message = "Microphone permission denied. Please grant permission in browser settings.";
                } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                    message = "No microphone found.";
                } else {
                     message = `Microphone Error: ${error.message}`;
                }
            } else if (error instanceof Error) {
                 message = error.message; // Use specific error message if available
            }
            setProcessingError(message);
            stopScan(); // Clean up thoroughly on error
            setIsProcessing(false); // Ensure UI updates
        }
    }, [stopScan, analyzeAudio, detectedBreaths]); // Dependencies

    // --- useEffect for auto-start and cleanup ---
    useEffect(() => {
        console.log("Breath Rate Page: Component mounted.");
        startScan(); // Start scan automatically when component mounts

        // Return cleanup function
        return () => {
            console.log("Breath Rate Page: Component unmounting...");
            stopScan(); // Call the memoized stop function
            console.log("Breath Rate Page: Cleanup complete.");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount, startScan has its own deps

    // --- Function to handle sending data to chat ---
    const handleSendToChat = () => {
         if (breathRate !== null && !processingError) {
             // Stop scan completely if still running (shouldn't be, but safety check)
             stopScan();
             console.log(`Breath Rate Page: Navigating to chat with breathRate=${breathRate}`);
             router.push(`/chat?breathRate=${breathRate}`);
         } else {
             console.warn("Breath Rate Page: Attempted to send to chat without a valid result.");
         }
    };

    // --- RETURN page JSX ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-lg">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-4 text-center">Breath Rate Measurement (Mic)</h1>

            <p className="text-muted-foreground mb-6 text-center">
                Find a quiet place. Hold your phone steady near your mouth/nose or place it on your chest. Breathe normally.
            </p>

            <div className="py-4 space-y-4 min-h-[250px] flex flex-col justify-center items-center border rounded-lg p-4 bg-card">

                {/* Error Display */}
                {processingError && (
                    <Alert variant="destructive" className="w-full">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{processingError}</AlertDescription>
                    </Alert>
                )}

                {/* Processing Display */}
                {isProcessing && !processingError && (
                    <div className="text-center space-y-4 w-full">
                        <div className="relative h-20 w-20 mx-auto">
                             <Mic className="h-full w-full text-primary opacity-30" />
                             {/* Simple volume visualizer */}
                             <div
                                className="absolute bottom-0 left-0 right-0 bg-primary/50 transition-all duration-100"
                                style={{ height: `${Math.min(100, currentVolume * 1.5)}%` }} // Scale volume for visibility
                             ></div>
                             <Waves className="absolute inset-0 h-full w-full text-primary animate-pulse" />
                        </div>

                        <p className="text-lg font-medium text-primary">Measuring...</p>
                        <p className="text-sm text-muted-foreground">Detected Breaths: {detectedBreaths}</p>
                         <Progress value={progress} className="w-full" />
                        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                    </div>
                )}

                {/* Result Display */}
                {!isProcessing && breathRate !== null && !processingError && (
                    <div className="text-center p-6 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-300 dark:border-blue-700 w-full">
                        <Lungs className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                        <p className="text-md text-muted-foreground mb-1">Estimated Breath Rate:</p>
                        <p className="text-5xl font-bold text-blue-700 dark:text-blue-300">{breathRate}</p>
                        <p className="text-md text-muted-foreground mt-1">Breaths/min</p>
                    </div>
                )}

                {/* Initial/Idle State */}
                {!isProcessing && breathRate === null && !processingError && (
                     <div className="text-center p-4">
                        <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2"/>
                        <p className="text-muted-foreground">Getting ready to measure...</p>
                     </div>
                )}
            </div>

            {/* Button Area */}
            <div className="mt-8 flex justify-center space-x-4">
                {/* Measure Again Button */}
                {!isProcessing && (processingError || breathRate !== null) && (
                    <Button variant="secondary" onClick={startScan}>
                        Measure Again
                    </Button>
                )}

                {/* Send to Chat Button */}
                {!isProcessing && breathRate !== null && !processingError && (
                    <Button onClick={handleSendToChat}>
                        <Send className="mr-2 h-4 w-4" /> Send to Chat
                    </Button>
                )}

                {/* Done Button */}
                <Button variant="outline" onClick={() => router.back()}>
                    Done
                </Button>
            </div>
        </div>
    );
}