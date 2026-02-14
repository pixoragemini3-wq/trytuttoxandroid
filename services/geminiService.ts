import { GoogleGenAI } from "@google/genai";

export const getTechAssistantResponse = async (userPrompt: string) => {
  try {
    // Utilizziamo direttamente process.env.API_KEY come richiesto dalle linee guida
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: "Sei l'assistente ufficiale di TuttoXAndroid. Aiuta l'utente con news tech, guide Android e consigli sugli smartphone. Rispondi in modo professionale, amichevole e moderno in lingua italiana. Usa un tono da esperto editoriale.",
        temperature: 0.7,
      },
    });
    
    return response.text || "Non ho ricevuto risposta dal server.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Spiacente, l'assistente AI sta riscontrando un problema tecnico. Riprova tra poco.";
  }
};