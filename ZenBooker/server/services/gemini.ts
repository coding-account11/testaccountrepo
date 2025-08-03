import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface CampaignContentParams {
  businessType: string;
  campaignType: string;
  targetAudience: string;
  customPrompt?: string;
  seasonalTheme?: string;
  focusKeywords?: string;
  additionalInstructions?: string;
  businessProfile?: {
    businessName?: string;
    businessCategory?: string;
    location?: string;
    brandVoice?: string;
    shortBusinessBio?: string;
    productsServices?: string;
    businessMaterials?: string;
  };
}

export interface GeneratedContent {
  subject: string;
  body: string;
}

export async function generateCampaignContent(params: CampaignContentParams): Promise<GeneratedContent> {
  try {
    const systemPrompt = `You are an expert email marketing specialist for service businesses. 
Generate high-converting email campaigns that drive appointment bookings.
Your response must be valid JSON with this exact format:
{
  "subject": "compelling subject line under 50 characters",
  "body": "personalized email body that includes a clear call-to-action to book an appointment"
}`;

    const businessContext = params.businessProfile ? `
Business Context:
- Business Name: ${params.businessProfile.businessName || 'Not specified'}
- Business Category: ${params.businessProfile.businessCategory || 'Not specified'}
- Location: ${params.businessProfile.location || 'Not specified'}
- Brand Voice: ${params.businessProfile.brandVoice || 'Not specified'}
- Business Bio: ${params.businessProfile.shortBusinessBio || 'Not specified'}
- Products/Services: ${params.businessProfile.productsServices || 'Not specified'}
- Brand Materials: ${params.businessProfile.businessMaterials || 'Not specified'}
` : '';

    const userPrompt = `Business Type: ${params.businessType}
Campaign Type: ${params.campaignType}
Target Audience: ${params.targetAudience}
${params.seasonalTheme ? `Seasonal Theme: ${params.seasonalTheme}` : ''}
${params.focusKeywords ? `Focus Keywords: ${params.focusKeywords}` : ''}
${params.customPrompt ? `Additional Instructions: ${params.customPrompt}` : ''}
${params.additionalInstructions ? `Extra Instructions: ${params.additionalInstructions}` : ''}
${businessContext}

Create an email campaign that:
- Has a compelling subject line that drives opens
- Includes personalized content relevant to the target audience
- Has a clear call-to-action to book an appointment
- Maintains the specified brand voice and tone
- Incorporates the business context and details provided
- Includes urgency or value proposition where appropriate
- Incorporates the seasonal theme and focus keywords if provided
- Uses the business name, location, and specific services when relevant`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["subject", "body"],
        },
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const content: GeneratedContent = JSON.parse(rawJson);
    return content;
  } catch (error) {
    console.error("Error generating campaign content:", error);
    throw new Error(`Failed to generate campaign content: ${error}`);
  }
}

export interface CleanedClientData {
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  lastVisit?: Date;
}

export async function cleanClientData(csvData: string): Promise<CleanedClientData[]> {
  try {
    const systemPrompt = `You are a data cleaning expert. Clean and structure messy CSV client data.
Your response must be valid JSON array with this exact format:
[
  {
    "name": "cleaned full name",
    "email": "valid email address",
    "phone": "cleaned phone number (optional)",
    "tags": ["array", "of", "relevant", "tags"],
    "lastVisit": "ISO date string if available (optional)"
  }
]

Rules:
- Fix typos and inconsistent formatting
- Standardize phone numbers
- Validate email addresses
- Extract relevant tags from any available data
- Convert dates to ISO format
- Skip invalid records
- Maximum 100 records per response`;

    const userPrompt = `Clean this CSV data:
${csvData}

Please:
1. Auto-detect column headers
2. Fix typos and formatting issues
3. Extract meaningful tags from any available data
4. Ensure email addresses are valid
5. Standardize phone number formats
6. Convert any date fields to ISO format`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const cleanedData: CleanedClientData[] = JSON.parse(rawJson);
    
    // Additional validation and processing
    return cleanedData
      .filter(client => client.name && client.email)
      .map(client => ({
        ...client,
        lastVisit: client.lastVisit ? new Date(client.lastVisit) : undefined,
        tags: client.tags || [],
      }));
  } catch (error) {
    console.error("Error cleaning client data:", error);
    throw new Error(`Failed to clean client data: ${error}`);
  }
}
