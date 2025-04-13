// src/app/analysis-result/page.js
'use client'; // Required for useState, useEffect, sessionStorage

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming you use shadcn/ui cards
import Image from 'next/image'; // Use Next.js Image for optimization if possible

export default function AnalysisResultPage() {
    const [analysis, setAnalysis] = useState('');
    const [imageData, setImageData] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // This code runs only on the client after the component mounts
        try {
            const storedAnalysis = sessionStorage.getItem('analysisResult');
            const storedImageData = sessionStorage.getItem('analysisImage');

            if (storedAnalysis && storedImageData) {
                setAnalysis(storedAnalysis);
                setImageData(storedImageData);
                // Optional: Clear storage after reading to prevent reuse on refresh/revisit
                // sessionStorage.removeItem('analysisResult');
                // sessionStorage.removeItem('analysisImage');
            } else {
                setError('Analysis data not found. Please try uploading again.');
            }
        } catch (err) {
            console.error("Error retrieving data from sessionStorage:", err);
            setError('Failed to load analysis data.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <p>Loading analysis results...</p>
                {/* You can add a spinner here */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 text-center text-red-600">
                <p>{error}</p>
            </div>
        );
    }

    // Helper to format analysis text (simple example: replace newlines with <br>)
    const formatAnalysisText = (text) => {
        return text.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                <br />
            </span>
        ));
    };

    return (
        <section className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-center">Analysis Result</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded Image</CardTitle>
                        <CardDescription>The image submitted for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {imageData ? (
                             // Using standard img tag as Next/Image might require width/height or remotePatterns setup for data URLs
                             // eslint-disable-next-line @next/next/no-img-element
                             <img
                                src={imageData}
                                alt="Uploaded Face for Analysis"
                                className="max-w-full h-auto rounded-md object-contain max-h-[400px]" // Limit height
                            />
                            // Alternatively, if using Next/Image and configured correctly:
                            // <Image
                            //     src={imageData}
                            //     alt="Uploaded Face for Analysis"
                            //     width={400} // Example width
                            //     height={400} // Example height
                            //     className="rounded-md object-contain"
                            // />
                        ) : (
                            <p>Image could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Wellness Observations</CardTitle>
                        <CardDescription>AI-generated observations based on the image. <span className="font-semibold text-destructive">Not a medical diagnosis.</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                             {/* Using whitespace-pre-line preserves newlines from the analysis */}
                             {analysis || "No analysis text found."}
                         </div>
                         {/* Alternative formatting using the helper function: */}
                         {/* <p className="text-sm text-muted-foreground">
                            {formatAnalysisText(analysis || "No analysis text found.")}
                         </p> */}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}