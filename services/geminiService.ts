import { GoogleGenAI, Type } from "@google/genai";
import { DreamResult, TarotResult, AstralResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

export const getTarotReading = async (question: string): Promise<TarotResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Perform a 3-card Tarot spread (Past, Present, Future) for the user. 
      The user's specific intent/question is: "${question || "General guidance"}".
      Be mystical, insightful, and empathetic.`,
      config: {
        systemInstruction: "You are Aetheria, an ancient digital mystic. You provide deep, psychological, and spiritual insights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the tarot card, e.g., The Fool" },
                  position: { type: Type.STRING, description: "Past, Present, or Future" },
                  meaning: { type: Type.STRING, description: "Interpretation of the card in this position" },
                  visualCue: { type: Type.STRING, description: "A short visual description of the card art" }
                },
                required: ["name", "position", "meaning", "visualCue"]
              }
            },
            summary: { type: Type.STRING, description: "A holistic summary of the reading connecting all three cards." }
          },
          required: ["cards", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Oracle");
    return JSON.parse(text) as TarotResult;

  } catch (error) {
    console.error("Tarot Error:", error);
    throw new Error(" The spirits are silent. Please try again.");
  }
};

export const getDreamInterpretation = async (dreamText: string): Promise<DreamResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Interpret this dream: "${dreamText}". Analyze the symbols, emotional undertone, and potential psychological meaning.`,
      config: {
        systemInstruction: "You are an expert dream analyst combining Jungian psychology with mystical symbolism.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interpretation: { type: Type.STRING, description: "Detailed interpretation of the dream" },
            themes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key themes, e.g., Anxiety, Growth" },
            psychologicalNote: { type: Type.STRING, description: "A note on the psychological state derived from the dream" },
            luckyNumbers: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "3 lucky numbers associated with this dream" }
          },
          required: ["interpretation", "themes", "psychologicalNote", "luckyNumbers"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Oracle");
    return JSON.parse(text) as DreamResult;
  } catch (error) {
    console.error("Dream Error:", error);
    throw new Error("Could not decipher the dream realm.");
  }
};

export const getAstralGuidance = async (question: string): Promise<AstralResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Provide guidance on astral projection or out-of-body experiences regarding: "${question || "How to start"}". 
      Provide a specific visualization technique and a safety tip.`,
      config: {
        systemInstruction: "You are a guide to the Astral Plane. You provide esoteric knowledge, visualization techniques, and safety advice for travelers of the consciousness.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            guidance: { type: Type.STRING, description: "Direct answer or guidance to the user's question" },
            technique: { type: Type.STRING, description: "A specific visualization or breathing technique to try" },
            safetyTip: { type: Type.STRING, description: "Important safety or grounding advice" },
            plane: { type: Type.STRING, description: "The specific plane of existence relevant to this advice (e.g. Etheric, Astral)" }
          },
          required: ["guidance", "technique", "safetyTip", "plane"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Oracle");
    return JSON.parse(text) as AstralResult;
  } catch (error) {
    console.error("Astral Error:", error);
    throw new Error("The astral cord is unreachable.");
  }
};

export const getSymbolExplore = async (symbol: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Explain the mystical and psychological symbolism of "${symbol}" in dreams. Keep it concise (max 2 sentences).`,
      config: {
         systemInstruction: "You are an expert dream symbol interpreter.",
      }
    });
    return response.text || "The mists obscure this symbol's meaning.";
  } catch (error) {
    console.error("Symbol Error:", error);
    return "Meaning cannot be retrieved at this time.";
  }
};