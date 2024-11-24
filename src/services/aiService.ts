import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');

export interface RecyclingRecommendation {
  method: string;
  environmentalImpact: string;
  materialGuidance: string;
  complianceSuggestions: string;
  transportLogistics: string;
  sustainabilityMetrics: string;
  priorityAssessment: string;
  facilitySuitability: string;
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
    
    const prompt = "Analyze this electronic waste image and provide the following details in a concise and precise text format (not Markdown). " + 
                    "Ensure the response uses clear formatting with line breaks for readability and distinguishes headers from subtexts. Avoid unnecessary lengthy explanations.\n\n" +
                    "1. **Material Composition**\n" +
                    "   - List the primary materials present and their approximate percentage composition.\n\n" +
                    "2. **Recycling Difficulty Level**\n" +
                    "   - Provide a simple rating (e.g., Easy, Moderate, Difficult) with a brief explanation.\n\n" +
                    "3. **Recommended Handling Procedure**\n" +
                    "   - Include specific actions for safe and environmentally friendly recycling or disposal.\n\n" +
                    "4. **Toxic Materials (if any)**\n" +
                    "   - Highlight any hazardous materials present and precautions for handling.\n\n" +
                    "5. **Reuse Potential**\n" +
                    "   - Suggest components or materials that can be repurposed or refurbished.\n\n" +
                    "Ensure the response is user-friendly, well-structured, and concise.";
    
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
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
  Provide detailed and actionable recycling recommendations for the electronic waste item with the following details:
  - Item Type: ${itemType}
  - Condition: ${condition}
  - Additional Details: ${description}

  Ensure the response is concise, user-friendly, and in plain text format (no Markdown), with clear headers and subheaders. Include the following sections:

  1. **Best Recycling Method**:
     - Recommend the most effective recycling or disposal process. Include specific steps tailored to the item type.

  2. **Environmental Impact**:
     - Summarize the environmental benefits of recycling this item and potential risks if mishandled.

  3. **Material-Specific Guidance**:
     - **Secondary Use Options**: Suggest alternative uses for functional parts (e.g., repurposing batteries).
     - **Hazardous Disposal Protocols**: Provide clear guidelines for safely disposing of toxic materials like lithium or cadmium.

  4. **Regional Compliance Suggestions**:
     - Recommend recycling methods that comply with local regulations. (If geolocation is integrated, suggest certified recycling centers near the user.)

  5. **Transport and Logistics**:
     - **Packaging Recommendations**: Outline best practices for packing the item safely for transport to a recycling center.
     - **Transport Impact**: Highlight the potential carbon footprint of transporting the waste based on estimated distances.

  6. **Sustainability Metrics**:
     - **Recycling Savings**: Quantify environmental benefits such as CO₂ emissions avoided or energy saved by recycling.
     - **Potential Resource Recovery**: Estimate recoverable materials (e.g., metals, plastics) and their potential value.

  7. **Priority Assessment**:
     - **Urgency of Disposal**: Assess the urgency of disposing of the item based on risks such as leakage or fire hazards.
     - **Degradation Likelihood**: Predict the rate at which the item’s materials might degrade if not recycled promptly.

  8. **Recycling Facility Suitability**:
     - Recommend specific types of facilities equipped to handle the item (e.g., battery-focused centers vs. appliance recyclers).

  Ensure the output is precise, structured with proper line breaks, and easy to read for users. Avoid unnecessary elaboration and focus on actionable insights.`;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    // const text = response.text();

    // // Improved parsing logic
    // const sections = text.split(/\n(?=\d\.)/); // Split by numbered sections (e.g., "1.", "2.")
    // const findSection = (keyword: string) => {
    //   const section = sections.find(s => s.trim().startsWith(keyword));
    //   return section ? section.replace(/^\d\.\s*/, '').trim() : 'Not available';
    // };

    // return {
    //   method: findSection('1.'),
    //   environmentalImpact: findSection('2.'),
    //   materialGuidance: findSection('3.'),
    //   complianceSuggestions: findSection('4.'),
    //   transportLogistics: findSection('5.'),
    //   sustainabilityMetrics: findSection('6.'),
    //   priorityAssessment: findSection('7.'),
    //   facilitySuitability: findSection('8.'),
    // };
    return response.text();
  } catch (error) {
    console.error('Error getting AI recommendations:', error);

    // Fallback to default values
    return 'AI recommendation service temporarily unavailable';
  }
}
    
//     return {
//       method: lines[0]?.replace(/^1\.\s*/, '') || 'Standard recycling process recommended',
//       environmentalImpact: lines[1]?.replace(/^2\.\s*/, '') || 'Impact assessment not available',
//       additionalNotes: lines[2]?.replace(/^3\.\s*/, '') || 'No additional notes',
//     };
//   } catch (error) {
//     console.error('Error getting AI recommendations:', error);
//     return {
//       method: 'Standard recycling process recommended',
//       environmentalImpact: 'Unable to assess environmental impact',
//       additionalNotes: 'AI recommendation service temporarily unavailable',
//     };
//   }
// }


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