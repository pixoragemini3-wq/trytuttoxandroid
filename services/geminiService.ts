
import { GoogleGenAI } from "@google/genai";

export const getTechAssistantResponse = async (userPrompt: string) => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("Gemini API Key non trovata in process.env.API_KEY");
    return "L'assistente AI non è configurato correttamente. Verifica la chiave API.";
  }

  try {
    // Inizializziamo il client solo quando serve davvero
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: "Sei un assistente esperto di tecnologia per il blog TuttoXAndroid. Aiuta gli utenti a trovare guide, spiegare concetti Android (modding, kernel, app) e dare consigli sugli acquisti. Sii professionale, amichevole e sintetico. Scrivi in Italiano.",
        temperature: 0.7,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Mi dispiace, sto avendo problemi a connettermi al mio cervello elettronico. Riprova più tardi!";
  }
};
