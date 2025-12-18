import { GoogleGenAI, Type } from "@google/genai";
import { DreamResult, TarotResult, AstralResult } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-flash-preview";
const imageModelName = "gemini-2.5-flash-image";

export const getTarotReading = async (question: string): Promise<TarotResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User explicitly asks: "${question}"
      
      Instructions:
      1. Draw 3 Tarot cards (Past, Present, Future).
      2. For each card, provide an interpretation that SPECIFICALLY addresses the question: "${question}".
      3. DO NOT give generic meanings. If the user asks if tarot is true, use the cards to explain the nature of intuition and truth.
      4. The 'visualCue' must be a vivid, descriptive prompt (1 sentence) for an image generator to create a mystical illustration of this specific card.
      5. Provide a summary that ties all cards back to the user's specific inquiry.`,
      config: {
        systemInstruction: "You are Aetheria, a direct and insightful digital oracle. You NEVER ignore the user's question. Your readings are tailored entirely to the specific words the user types.",
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