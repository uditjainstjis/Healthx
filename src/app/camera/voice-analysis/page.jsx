// src/app/sensors/voice-analysis/page.jsx <-- Create this file

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Using Progress for visual feedback
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // For report display
import { Terminal, ArrowLeft, Send, Mic, Square, Loader2, FileText, Play, BrainCircuit } from "lucide-react"; // Added icons

// Constants
const RECORDING_DURATION_MS = 10000; // Record for 10 seconds (adjust as needed)

export default function VoiceAnalysisPage() {
    const router = useRouter();

    // State Management
    const [status, setStatus] = useState('idle'); // 'idle', 'permission', 'recording', 'processing', 'analyzing', 'complete', 'error'
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const [countdown, setCountdown] = useState(RECORDING_DURATION_MS / 1000);
    const [audioUrl, setAudioUrl] = useState(null); // To allow playback

    // Refs
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const countdownIntervalRef = useRef(null);
    const isMountedRef = useRef(false);

    // --- Cleanup Function ---
    const cleanup = useCallback(() => {
        console.log("Voice Analysis: Cleaning up resources...");
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop(); // Will trigger onstop
             console.log("Voice Analysis: MediaRecorder stopped during cleanup.");
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            console.log("Voice Analysis: MediaStream tracks stopped.");
        }
         // Reset refs
         mediaRecorderRef.current = null;
         audioChunksRef.current = [];

    }, []);


    // --- Request Microphone Permission ---
    const requestMicPermission = useCallback(async () => {
        setStatus('permission');
        setError(null);
        setReport(null);
        setAudioUrl(null); // Clear previous recording URL

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("MediaDevices API not supported.");
            }
            // Get stream but don't assign to ref yet
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

             if (!isMountedRef.current) { // Check if component unmounted during permission request
                console.log("Voice Analysis: Unmounted after getting permission. Stopping tracks.");
                stream.getTracks().forEach(track => track.stop());
                return null; // Indicate failure or inability to proceed
            }

            console.log("Voice Analysis: Microphone permission granted.");
            setStatus('idle'); // Ready to record
            return stream; // Return the stream for immediate use

        } catch (err) {
            console.error("Voice Analysis: Microphone permission error:", err);
            let message = "Could not access microphone.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                message = "Microphone permission denied. Please allow access in browser settings.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                 message = "No microphone found on this device.";
            }
            setError(message);
            setStatus('error');
            return null; // Indicate failure
        }
    }, []);

    // --- Handle Start Recording ---
    const handleStartRecording = useCallback(async () => {
        if (!isMountedRef.current) return;

        setError(null); // Clear previous errors
        setReport(null); // Clear previous report
        setAudioUrl(null); // Clear previous audio URL

        let stream = streamRef.current; // Use existing stream if available
        if (!stream) {
             console.log("Voice Analysis: No existing stream, requesting permission...");
             stream = await requestMicPermission();
             if (!stream || !isMountedRef.current) { // Check if permission failed or unmounted
                 console.error("Voice Analysis: Failed to get stream for recording.");
                 return; // Exit if stream couldn't be obtained
             }
              streamRef.current = stream; // Assign to ref only if successful and mounted
        }


        // --- Safety check if stream is *still* null ---
         if (!streamRef.current) {
             console.error("Voice Analysis: Stream ref is null, cannot start recorder.");
             setError("Failed to initialize microphone stream.");
             setStatus('error');
             return;
         }

        audioChunksRef.current = []; // Clear previous chunks
        setStatus('recording');
        setCountdown(RECORDING_DURATION_MS / 1000);


        try {
             // Determine supported MIME type
            const options = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/wav', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
             if (!options) { throw new Error("No suitable audio recording format supported by this browser."); }
             console.log(`Voice Analysis: Using MIME type: ${options}`);

            mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: options });

            // --- Event Handlers for MediaRecorder ---
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    // console.log("Voice Analysis: Chunk received, size:", event.data.size);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                console.log("Voice Analysis: Recording stopped.");
                if (!isMountedRef.current) {
                     console.log("Voice Analysis: Unmounted during onstop. Aborting analysis.");
                     return;
                }

                if (audioChunksRef.current.length === 0) {
                    console.warn("Voice Analysis: No audio chunks recorded.");
                    setError("No audio data was captured. Please try again.");
                    setStatus('error');
                    cleanup(); // Clean up resources
                    return;
                }

                 setStatus('processing'); // Indicate processing audio blob

                // Combine chunks into a single Blob
                const mimeType = mediaRecorderRef.current.mimeType; // Get the actual mimeType used
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url); // Set URL for playback

                console.log("Voice Analysis: Audio Blob created, size:", audioBlob.size, "type:", audioBlob.type);
                audioChunksRef.current = []; // Clear chunks after creating blob

                // Send to backend API
                await sendAudioToApi(audioBlob);
            };

            mediaRecorderRef.current.onerror = (event) => {
                 console.error("Voice Analysis: MediaRecorder error:", event.error);
                 if (isMountedRef.current) {
                    setError(`Recording error: ${event.error.message || 'Unknown recording error'}`);
                    setStatus('error');
                    cleanup();
                 }
            };
            // --- End Event Handlers ---


            mediaRecorderRef.current.start();
            console.log("Voice Analysis: MediaRecorder started.");


            // Start countdown timer
            countdownIntervalRef.current = setInterval(() => {
                 if (!isMountedRef.current) { clearInterval(countdownIntervalRef.current); return; }
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current);
                        // Trigger stop slightly before timeout ensures onstop fires reliably
                         if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                              mediaRecorderRef.current.stop();
                         }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Optional: Set timeout to automatically stop recording
            // setTimeout(() => {
            //     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            //         console.log("Voice Analysis: Reaching recording duration timeout.");
            //         mediaRecorderRef.current.stop();
            //     }
            // }, RECORDING_DURATION_MS);


        } catch (err) {
            console.error("Voice Analysis: Error starting recorder:", err);
             if (isMountedRef.current) {
                setError(`Failed to start recording: ${err.message}`);
                setStatus('error');
                cleanup(); // Clean up if start failed
             }
        }

    }, [requestMicPermission, cleanup]);


     // --- Handle Stop Recording (Manual) ---
     const handleStopRecording = useCallback(() => {
         if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
             console.log("Voice Analysis: Manual stop requested.");
             mediaRecorderRef.current.stop(); // This will trigger the 'onstop' handler
              if (countdownIntervalRef.current) {
                 clearInterval(countdownIntervalRef.current); // Stop countdown early
                 countdownIntervalRef.current = null;
             }
             // Status will change in onstop handler
         }
     }, []);


    // --- Send Audio to Backend API ---
    const sendAudioToApi = async (audioBlob) => {
        if (!isMountedRef.current) return;
        setStatus('analyzing'); // Update status: Sending to API

        console.log("Voice Analysis: Sending audio to API...");
        const formData = new FormData();
        // Append the blob with a filename (backend might use this)
        formData.append('audio', audioBlob, `voice-analysis-${Date.now()}.webm`); // Adjust extension based on MIME if needed

        try {
            // Replace with your actual backend API endpoint
            const response = await fetch('/api/analyze-voice', {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed for FormData, browser sets it with boundary
            });

            if (!isMountedRef.current) {
                console.log("Voice Analysis: Unmounted during API fetch.");
                return; // Exit if unmounted
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `API Error: ${response.status}`);
            }

            if (result.success && result.report) {
                console.log("Voice Analysis: Analysis successful.");
                setReport(result.report);
                setStatus('complete');
            } else {
                throw new Error(result.error || "API returned unsuccessful or missing report.");
            }
        } catch (err) {
            console.error("Voice Analysis: API Error:", err);
            if (isMountedRef.current) {
                setError(`Analysis failed: ${err.message}`);
                setStatus('error');
            }
        } finally {
            // Clean up stream/recorder *after* API call attempt, regardless of success/error
             // Note: onstop already cleared chunks, but cleanup ensures stream is released
             cleanup();
             console.log("Voice Analysis: Resources potentially cleaned up after API call.");
        }
    };

    // --- Handle Send Report to Chat ---
     const handleSendToChat = () => {
        if (report && status === 'complete') {
             console.log("Voice Analysis: Sending report to chat.");
             // Encode the report to handle special characters in URL
             const encodedReport = encodeURIComponent(report);
             // You might want a shorter summary or a specific part of the report
             // For now, sending the whole (potentially long) report.
             router.push(`/chat?voiceReport=${encodedReport}`);
        }
    };


    // --- Effect for Initial Permission & Cleanup ---
    useEffect(() => {
        isMountedRef.current = true;
        console.log("Voice Analysis: Component mounted.");
        // Optionally request permission on mount, or wait for button click
        // requestMicPermission(); // Uncomment to request permission immediately

        return () => {
            console.log("Voice Analysis: Component unmounting.");
            isMountedRef.current = false;
            cleanup(); // Call cleanup on unmount
        };
    }, [cleanup, requestMicPermission]);


    // --- Render Logic ---
    const renderStatus = () => {
        switch (status) {
            case 'permission':
                return <p className="text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting microphone access...</p>;
            case 'idle':
                return <p className="text-muted-foreground">Ready to record.</p>;
            case 'recording':
                return (
                    <div className="text-center space-y-2">
                         <div className="flex items-center justify-center space-x-2 text-red-500">
                            <Mic className="h-5 w-5 animate-pulse" />
                            <span className="font-medium">Recording...</span>
                         </div>
                         <p className="text-2xl font-bold">{countdown}s</p>
                         {/* Optional: Add a simple visualizer here if desired */}
                    </div>
                );
            case 'processing':
                 return <p className="text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing audio...</p>;
            case 'analyzing':
                return (
                     <div className="text-center space-y-2 text-blue-500">
                        <BrainCircuit className="h-6 w-6 mx-auto animate-pulse" />
                        <p className="font-medium">Analyzing voice with AI...</p>
                    </div>
                );
             case 'complete':
                return <p className="text-green-600 flex items-center justify-center"><FileText className="mr-2 h-4 w-4" /> Analysis Complete.</p>;
            case 'error':
                return <p className="text-red-600">Error occurred.</p>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-lg">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-4 text-center">Voice Analysis</h1>

            <p className="text-muted-foreground mb-6 text-center">
                Record a short voice sample (e.g., read a sentence or describe your day) for AI analysis. Ensure you are in a quiet environment.
            </p>

             <Card className="mb-6">
                 <CardContent className="pt-6 min-h-[100px] flex flex-col items-center justify-center">
                    {renderStatus()}
                    {error && (
                         <Alert variant="destructive" className="mt-4">
                             <Terminal className="h-4 w-4" />
                             <AlertTitle>Error</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                         </Alert>
                    )}
                 </CardContent>
            </Card>


            {/* Recording Controls */}
            <div className="flex justify-center space-x-4 mb-6">
                 <Button
                    onClick={handleStartRecording}
                    disabled={status === 'recording' || status === 'processing' || status === 'analyzing' || status === 'permission'}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Mic className="mr-2 h-5 w-5" /> Start Recording
                </Button>
                 <Button
                    onClick={handleStopRecording}
                    disabled={status !== 'recording'}
                    variant="destructive"
                    size="lg"
                >
                    <Square className="mr-2 h-5 w-5" /> Stop Recording
                </Button>
            </div>

            {/* Audio Playback (Optional) */}
            {audioUrl && status !== 'recording' && status !== 'processing' && status !== 'analyzing' && (
                <div className="mb-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Listen to your recording:</p>
                    <audio controls src={audioUrl} className="mx-auto">
                         Your browser does not support the audio element.
                     </audio>
                </div>
            )}

            {/* Report Display */}
             {report && status === 'complete' && (
                 <Card>
                     <CardHeader>
                         <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Voice Analysis Report</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <p className="whitespace-pre-wrap text-sm">{report}</p> {/* Use pre-wrap to respect formatting */}
                     </CardContent>
                 </Card>
             )}


            {/* Bottom Buttons */}
            <div className="mt-8 flex justify-center space-x-4">
                {(status === 'complete' || status === 'error') && status !== 'recording' && (
                     <Button variant="secondary" onClick={handleStartRecording}>
                        Record Again
                    </Button>
                )}
                {status === 'complete' && report && (
                    <Button onClick={handleSendToChat}>
                        <Send className="mr-2 h-4 w-4" /> Send Report to Chat
                    </Button>
                )}
                <Button variant="outline" onClick={() => router.back()}>
                    Done
                </Button>
            </div>
        </div>
    );
}