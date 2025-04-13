// src/app/analysis-result/page.js
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from 'next/image'; // Or standard img tag

export default function AnalysisResultPage() {
    const [analysis, setAnalysis] = useState('');
    const [imageData, setImageData] = useState('');
    const [scanType, setScanType] = useState(''); // State for scan type
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            const storedAnalysis = sessionStorage.getItem('analysisResult');
            const storedImageData = sessionStorage.getItem('analysisImage');
            const storedScanType = sessionStorage.getItem('analysisScanType'); // Get the scan type

            if (storedAnalysis && storedImageData && storedScanType) {
                setAnalysis(storedAnalysis);
                setImageData(storedImageData);
                setScanType(storedScanType); // Set the scan type state

                // Optional: Clear storage
                // sessionStorage.removeItem('analysisResult');
                // sessionStorage.removeItem('analysisImage');
                // sessionStorage.removeItem('analysisScanType');
            } else {
                setError('Analysis data (result, image, or type) not found. Please try uploading again.');
            }
        } catch (err) {
            console.error("Error retrieving data from sessionStorage:", err);
            setError('Failed to load analysis data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) { /* ... loading state ... */ }
    if (error) { /* ... error state ... */ }

    // Determine a user-friendly title based on scan type
    const getPageTitle = () => {
        if (!scanType) return "Analysis Result";
        // Handle potential variations if needed, otherwise use the stored type directly
        return `${scanType} Analysis Result`;
    };

    return (
        <section className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-center">{getPageTitle()}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        {/* Dynamic Card Title */}
                        <CardTitle>Uploaded {scanType || 'Image'}</CardTitle>
                        <CardDescription>The image submitted for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {imageData ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img
                                src={imageData}
                                alt={`Uploaded ${scanType || 'Scan'} for Analysis`}
                                className="max-w-full h-auto rounded-md object-contain max-h-[400px]"
                            />
                        ) : (
                            <p>Image could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         {/* Dynamic Card Title */}
                        <CardTitle>AI Observations ({scanType || 'General'})</CardTitle>
                        <CardDescription>AI-generated observations based on the image. <span className="font-semibold text-destructive">Not a medical diagnosis. Requires expert review.</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                             {analysis || "No analysis text found."}
                         </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}