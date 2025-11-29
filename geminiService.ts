import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ------------------------------------------
// 1. Dummy patient dataset for the demo
// ------------------------------------------
const DUMMY_PATIENT = {
  vaccinations: "The patient received a COVID-19 vaccine in 2021 and a typhoid booster in 2020.",
  medications: "The patient is taking Metformin 1g BD, Perindopril 4mg AM, and Atorvastatin 20mg Nocte.",
  allergies: "The patient has a mild maculopapular rash reaction to Penicillin.",
  imaging: "The most recent imaging is a CT of the head, neck, and abdomen from 2024.",
  pathology: "Recent pathology includes mild neutropenia in March 2025.",
  history: "Past history includes hypertension (2018), type 2 diabetes (2020), and appendicectomy (2005)."
};

// ------------------------------------------
// 2. Keyword triggers for local dummy answers
// ------------------------------------------
const MHR_KEYWORDS = {
  vaccinations: ["vaccine", "vaccination", "immunisation", "immunization", "covid"],
  medications: ["medication", "medications", "drug", "prescription"],
  allergies: ["allergy", "allergies"],
  imaging: ["scan", "ct", "mri", "xray", "imaging", "radiology"],
  pathology: ["blood", "pathology", "neutropenia", "blood test", "hba1c"],
  history: ["history", "past medical", "pmh", "conditions"]
};

// Simple matcher
function detectMhrCategory(text: string): keyof typeof DUMMY_PATIENT | null {
  const lower = text.toLowerCase();
  for (const category in MHR_KEYWORDS) {
    const words = MHR_KEYWORDS[category as keyof typeof MHR_KEYWORDS];
    if (words.some(w => lower.includes(w))) {
      return category as keyof typeof DUMMY_PATIENT;
    }
  }
  return null;
}

// ------------------------------------------
// 3. System instruction for real AI responses
// ------------------------------------------
const SYSTEM_INSTRUCTION = `
You are "Heidi Assist", the AI clinician assistant inside Heidi Pro.
You respond in a concise, clinical, factual tone with no emojis and no markdown.
`;

// ------------------------------------------
// 4. Main function (with dummy override)
// ------------------------------------------
export const sendMessageToHeidi = async (
  history: Message[],
  userMessage: string
): Promise<string> => {
  try {
    // 🔥 FIRST: Check if it's an MHR-related query
    const category = detectMhrCategory(userMessage);

    if (category) {
      // Return dummy structured answer instantly
      return DUMMY_PATIENT[category];
    }

    // Otherwise → use actual Gemini model
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const chat = model.startChat({
      history: history.slice(-10).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      })),
      generationConfig: { temperature: 0.2 }
    });

    const response = await chat.sendMessage(userMessage);
    return response.response.text();
  } catch (err) {
    console.error("Heidi Error:", err);
    return "Unable to complete the request right now.";
  }
};
