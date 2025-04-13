import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Ensure the API key is defined
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables.");
    process.exit(1); // Exit if the API key is not defined
}

const openai = new OpenAI({ apiKey });

// No config needed here.
// export const config = {
//     api: {
//         bodyParser: false,
//     },
// };

const readFile = (req) => {
   const form = formidable({ multiples: false });
   return new Promise((resolve, reject) => {
     form.parse(req, (err, fields, files) => {
       if (err) {
         reject(err);
         return;
       }
       resolve({ fields, files });
     });
   });
};



const analyzeImage = async (imagePath, scanType) => {
    try {
        const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

        const prompt = `Analyze the following image of a ${scanType}.
        Focus on identifying key features relevant to the scan type (e.g., eye structures for eye scans, facial features for face scans).
        Based on the image, detect any potential signs of diseases, abnormalities, or conditions.
        Provide a detailed report of your findings, including any specific observations and potential concerns.
        Specifically:
        -For eye scans look for signs of cataracts, glaucoma, macular degeneration, or other retinal issues.
        -For face scans look for skin abnormalities, lesions, or signs of skin cancer.
        -If the image is an X-ray scan, look for fractures, tumors, or other abnormalities in bone or tissue.
        -If the image is an MRI scan, look for any unusual structures in the brain, spine or any other relevant body part.
        -If the image is an ECG scan, analyze the waveforms and identify any irregularities in heart rhythm or electrical activity.

        Be as specific as possible in your observations. If you detect any potential medical issues, state them clearly and provide a brief explanation of why you suspect them. If the image appears normal, state that clearly as well.

        Important: This analysis is for informational purposes only and should not be considered a medical diagnosis. Always consult with a qualified healthcare professional for any health concerns.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                    ],
                },
            ],
            max_tokens: 500,
        });

        console.log(response.choices[0]);
        return response.choices[0].message.content;

    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error(`Image analysis failed: ${error.message}`);
    }
};


export async function POST(req, res) {
    try {

      // This code is specific to Next.js App Router.
      const formData = await req.formData();
      const imageFile = formData.get('image');
      const scanType = formData.get('scanType');

      if (!imageFile) {
          return NextResponse.json({ message: "Image file is missing" }, { status: 400 });
      }

      if (!scanType || typeof scanType !== 'string') {
          return NextResponse.json({ message: "Scan type is missing or invalid" }, { status: 400 });
      }

      const buffer = await imageFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const filename = imageFile.name
      const tempDir = process.cwd() + "/public/images";
      const imagePath = `${tempDir}/${filename}`; //Temporary path
      fs.writeFileSync(imagePath, bytes);
      const analysisResult = await analyzeImage(imagePath, scanType);


      // Clean up the uploaded file after analysis
      fs.unlinkSync(imagePath);

      return NextResponse.json({ result: analysisResult }, { status: 200 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ message: error.message || "Image analysis failed" }, { status: 500 });
    }
}
