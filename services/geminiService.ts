
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTechAssistantResponse = async (userPrompt: string) => {
  try {
    // Generate response using gemini-3-flash-preview for text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: "Sei un assistente esperto di tecnologia per il blog TuttoXAndroid. Aiuta gli utenti a trovare guide, spiegare concetti Android (modding, kernel, app) e dare consigli sugli acquisti. Sii professionale, amichevole e sintetico. Scrivi in Italiano.",
        temperature: 0.7,
      },
    });
    // Directly access the .text property of GenerateContentResponse.
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Mi dispiace, sto avendo problemi a connettermi al mio cervello elettronico. Riprova più tardi!";
  }
};
