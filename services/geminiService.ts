import { GoogleGenAI, Type } from "@google/genai";
import { DreamResult, TarotResult, AstralResult } from "../types";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).process?.env?.API_KEY;
    if (!apiKey) {
      console.warn("Aetheria: API_KEY is missing. AI features will be unavailable.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
  }
  return aiInstance;
};

const modelName = "gemini-3-flash-preview";
const imageModelName = "gemini-2.5-flash-image";

export const getTarotReading = async (question: string): Promise<TarotResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User explicitly asks: "${question}"
      
      Instructions:
      1. Draw 3 Tarot cards (Past, Present, Future).
      2. For each card, provide an interpretation that SPECIFICALLY addresses the question: "${question}".
      3. DO NOT give generic meanings.
      4. The 'visualCue' must be a vivid, descriptive prompt (1 sentence) for an image generator.
      5. Provide a summary that ties all cards back to the user's specific inquiry.`,
      config: {
        systemInstruction: "You are Aetheria, a direct and insightful digital oracle. Readings are tailored entirely to the specific words the user types.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  position: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  visualCue: { type: Type.STRING }
                },
                required: ["name", "position", "meaning", "visualCue"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["cards", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The Oracle is silent.");
    return JSON.parse(text) as TarotResult;
  } catch (error) {
    console.error("Tarot Error:", error);
    throw new Error("The spiritual connection was interrupted.");
  }
};

export const generateCardImage = async (visualCue: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: imageModelName,
      contents: {
        parts: [
          {
            text: `A beautiful mystical tarot card illustration, highly detailed, ethereal, glowing symbols, dark purple and gold spiritual theme: ${visualCue}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error("Image Gen Error:", error);
    return '';
  }
};

export const getDreamInterpretation = async (dreamText: string): Promise<DreamResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Interpret this dream: "${dreamText}". Link the symbols to the user's current psychological state.`,
      config: {
        systemInstruction: "Expert Jungian and mystical dream analyst.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interpretation: { type: Type.STRING },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            psychologicalNote: { type: Type.STRING },
            luckyNumbers: { type: Type.ARRAY, items: { type: Type.NUMBER } }
          },
          required: ["interpretation", "themes", "psychologicalNote", "luckyNumbers"]
        }
      }
    });
    return JSON.parse(response.text || '{}') as DreamResult;
  } catch (error) {
    throw new Error("Could not decode the dream realm.");
  }
};

export const getAstralGuidance = async (question: string): Promise<AstralResult> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User Question: "${question}"`,
      config: {
        systemInstruction: "Astral Projection guide. Provide techniques and safety tips based on the user's specific inquiry.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            guidance: { type: Type.STRING },
            technique: { type: Type.STRING },
            safetyTip: { type: Type.STRING },
            plane: { type: Type.STRING }
          },
          required: ["guidance", "technique", "safetyTip", "plane"]
        }
      }
    });
    return JSON.parse(response.text || '{}') as AstralResult;
  } catch (error) {
    throw new Error("The astral cord is busy.");
  }
}