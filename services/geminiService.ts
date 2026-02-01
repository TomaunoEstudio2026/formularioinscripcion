
import { GoogleGenAI, Type } from "@google/genai";

export const analyzeFormContent = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente mensaje de un cliente y clasifícalo en una categoría (Ventas, Soporte, Reclamo, General) y resume su intención en una frase corta:\n\n"${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria: { type: Type.STRING },
            resumen: { type: Type.STRING }
          },
          required: ["categoria", "resumen"]
        }
      }
    });

    return response.text || "Sin análisis disponible";
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    return "Error en análisis AI";
  }
};
