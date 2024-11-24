import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || '');

export interface RecyclingRecommendation {
  method: string;
  environmentalImpact: string;
  additionalNotes: string;
}

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

export async function analyzeWasteImage(imageUrl: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const result = await model.generateContent([
      imageUrl,
      "Analyze this electronic waste image and provide: 1. Material composition 2. Recycling difficulty level 3. Recommended handling procedure"
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing waste image:', error);
    throw new Error('Failed to analyze image');
  }
}