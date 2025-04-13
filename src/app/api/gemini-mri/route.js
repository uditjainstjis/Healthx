// src/app/api/gemini-mri/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function (same as before)
function arrayBufferToGenerativePart(buffer, mimeType) { /* ... same code ... */ }

export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;
    // ... (API key check - same as before) ...
    if (!apiKey) { return NextResponse.json({ error: "API key configuration error." }, { status: 500 }); }

    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');
        // ... (File validation - same as before) ...
         if (!imageFile || !(imageFile instanceof File) || !imageFile.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Valid image file required.' }, { status: 400 });
        }

        const imageBuffer = await imageFile.arrayBuffer();
        const imagePart = arrayBufferToGenerativePart(imageBuffer, imageFile.type);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or gemini-1.5-pro

        // ***** MRI SPECIFIC PROMPT *****
        const prompt = `
            Analyze this MRI scan image for potential points of interest based ONLY on visually observable features.
            Focus on describing tissue contrast, identifiable structures, shapes, signal intensity variations (hyperintensity/hypointensity), or potential anomalies like lesions or masses.

            IMPORTANT:
            - DO NOT provide any medical diagnosis, definitive condition names (e.g., tumor type), staging, or treatment recommendations.
            - State clearly that this analysis is based purely on visual observation by an AI and is NOT a substitute for professional radiological evaluation by a qualified medical expert.
            - Describe findings neutrally (e.g., "Region of hyperintensity noted in the [lobe/area]", "Structure appears [symmetrical/asymmetrical]", "Possible lesion measuring approximately [size] observed at [location]").
            - If the image quality is poor, the sequence is unclear, or it's not an MRI, state that analysis cannot be performed reliably.
            Example format:
            "Based on AI visual observation (this is not a medical diagnosis and requires expert review):
            - Signal intensity in the [region] appears [normal/hyperintense/hypointense].
            - A possible [shape/type] anomaly is observed near [location], characterized by [signal intensity].
            - Ventricular size appears [normal/enlarged].
            - Grey-white matter differentiation seems [clear/blurred]."
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const geminiText = response.text();

        const base64ImageData = Buffer.from(imageBuffer).toString('base64');
        const imageDataUrl = `data:${imageFile.type};base64,${base64ImageData}`;

        return NextResponse.json(
            { analysis: geminiText, imageData: imageDataUrl },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error processing MRI request:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: `An error occurred during MRI analysis: ${errorMessage}` },
            { status: 500 }
        );
    }
}