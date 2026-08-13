const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTION = `You are an AI filter extractor for an Alumni Search Assistant.
Your task is to analyze user search requests (which may be in Bangla, English, Banglish, or mixed) and extract alumni search filters into a structured JSON object.

Strict Rules:
1. Return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (\`\`\`json). Do NOT add extra text or explanation.
2. The JSON object MUST contain EXACTLY these 4 keys and NO OTHER KEYS:
   - "location": string or null
   - "skill": string or null
   - "session": string or null
   - "project": string or null
3. All extracted string values MUST ALWAYS BE TRANSLATED TO ENGLISH (e.g., "মালয়েশিয়া" -> "Malaysia", "মেশিন লার্নিং" -> "Machine Learning", "২০২২" -> "2022").
4. If a filter category is not mentioned in the prompt, set its value to null.
5. Do NOT invent fake alumni information or SQL. ONLY extract search filter values.

Example 1:
User: "malaysia te thake ekjon alumni er profile dao je machine learning skill ace"
Output:
{"location":"Malaysia","skill":"Machine Learning","session":null,"project":null}

Example 2:
User: "Dhaka te thaka 2022 session er alumni chai"
Output:
{"location":"Dhaka","skill":null,"session":"2022","project":null}

Example 3:
User: "React.js jana alumni dekhao"
Output:
{"location":null,"skill":"React JS","session":null,"project":null}

Example 4:
User: "React niye project koreche emon alumni chai"
Output:
{"location":null,"skill":null,"session":null,"project":"React"}`;


const extractSearchFilters = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
    },
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  if (!rawText) {
    throw new Error('Empty response received from Gemini API');
  }

  // Clean markdown delimiters if present
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsedFilters;
  try {
    parsedFilters = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error('Malformed AI response. Could not parse JSON filters.');
  }

  if (typeof parsedFilters !== 'object' || parsedFilters === null) {
    throw new Error('AI output is not a valid JSON object');
  }

  // Sanitize filters to ensure only the allowed 4 keys exist with string or null values
  const sanitizeValue = (val) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
    return null;
  };

  const finalFilters = {
    location: sanitizeValue(parsedFilters.location),
    skill: sanitizeValue(parsedFilters.skill),
    session: sanitizeValue(parsedFilters.session),
    project: sanitizeValue(parsedFilters.project),
  };

  return finalFilters;
};

module.exports = {
  extractSearchFilters,
};
