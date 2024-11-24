import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');

export interface RecyclingRecommendation {
  method: string;
  environmentalImpact: string;
  additionalNotes: string;
}

// Function to prepare image part for Gemini
async function fileToGenerativePart(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Get the base64 string without the data URL prefix
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeWasteImage(file: File, retries: number = 3): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare the image data
    const imagePart = await fileToGenerativePart(file);
    
    const prompt = "Analyze this electronic waste image and provide:\n" +
                   "1. Material composition\n" +
                   "2. Recycling difficulty level\n" +
                   "3. Recommended handling procedure\n\n" +
                   "Please be specific about the materials present and their recyclability.";
    
    const result = await model.generateContent([
      {
        text: prompt
      },
      imagePart
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing waste image:', error);
    
    if (error.message.includes('503') && retries > 0) {
      console.log(`Model overloaded. Retrying... (${3 - retries + 1})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return analyzeWasteImage(file, retries - 1);
    }
    
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

// Modified to handle file directly
export const handleImageUploadAndAnalyze = async (file: File) => {
  try {
    const analysisResult = await analyzeWasteImage(file);
    return analysisResult;
  } catch (error) {
    console.error('Error in image analysis:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
};

// Original getRecyclingRecommendations function remains unchanged
export async function getRecyclingRecommendations(
  itemType: string,
  condition: string,
  description: string
): Promise<RecyclingRecommendation> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Provide recycling recommendations for electronic waste with the following details:
      - Item Type: ${itemType}
      - Condition: ${condition}
      - Additional Details: ${description}
      
      Please provide recommendations in the following format:
      1. Best recycling method
      2. Environmental impact
      3. Additional considerations
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response into structured format
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      method: lines[0]?.replace(/^1\.\s*/, '') || 'Standard recycling process recommended',
      environmentalImpact: lines[1]?.replace(/^2\.\s*/, '') || 'Impact assessment not available',
      additionalNotes: lines[2]?.replace(/^3\.\s*/, '') || 'No additional notes',
    };
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return {
      method: 'Standard recycling process recommended',
      environmentalImpact: 'Unable to assess environmental impact',
      additionalNotes: 'AI recommendation service temporarily unavailable',
    };
  }
}


// export async function analyzeWasteImage(imageUrl: string, retries: number = 3): Promise<string> {
//   try {
//     console.log('Analyzing image URL:', imageUrl);
    
//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
//     const result = await model.generateContent([
//       imageUrl, // Use the public URL for analysis
//       "Analyze this electronic waste image and provide: 1. Material composition 2. Recycling difficulty level 3. Recommended handling procedure"
//     ]);
    
//     const response = await result.response;
//     console.log('AI response:', response);
//     return response.text();
//   } catch (error) {
//     console.error('Error analyzing waste image:', error);
    
//     if (error.message.includes('503') && retries > 0) {
//       console.log(`Model overloaded. Retrying... (${3 - retries + 1})`);
//       await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
//       return analyzeWasteImage(imageUrl, retries - 1); // Retry the analysis
//     }
    
//     throw new Error('Failed to analyze image');
//   }
// }

// // Example function to handle image upload and analysis
// export const handleImageUploadAndAnalyze = async (file: File) => {
//   try {
//     const publicImageUrl = await uploadImageToImgur(file); // Upload the image to Imgur
//     const analysisResult = await analyzeWasteImage(publicImageUrl); // Analyze the image using the public URL
//     return analysisResult; // Return the analysis result
//   } catch (error) {
//     console.error('Error in image upload and analysis:', error);
//     throw new Error('Image upload and analysis failed');
//   }
// };