const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTION = `You are an AI filter extractor for an Alumni Search Assistant.
Your task is to analyze user search requests (which may be in Bangla, English, Banglish, or mixed) and extract alumni search filters into a structured JSON object.

Strict Rules:
1. Return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks (\`\`\`json). Do NOT add extra text or explanation.
2. The JSON object MUST contain EXACTLY these 7 keys and NO OTHER KEYS:
   - "position": string or null (job title or role like "Data Scientist", "Software Engineer", "DevOps", "Manager")
   - "company": string or null (company or organization name like "Enosis", "Google", "Brain Station 23", "Selise")
   - "location": string or null
   - "skill": string or null
   - "session": string or null
   - "project": string or null
   - "query": string or null (general search query keywords)
3. All extracted string values MUST ALWAYS BE TRANSLATED TO ENGLISH (e.g., "মালয়েশিয়া" -> "Malaysia", "ডেটা সায়েন্টিস্ট" -> "Data Scientist", "মেশিন লার্নিং" -> "Machine Learning", "২০২২" -> "2022").
4. If a filter category is not mentioned in the prompt, set its value to null.
5. Do NOT invent fake alumni information or SQL. ONLY extract search filter values.

Example 1:
User: "data scientist ace emon alumni khuje dao"
Output:
{"position":"Data Scientist","company":null,"location":null,"skill":null,"session":null,"project":null,"query":"Data Scientist"}

Example 2:
User: "Enosis Solutions e working position data scientist emon alumni dekhao"
Output:
{"position":"Data Scientist","company":"Enosis Solutions","location":null,"skill":null,"session":null,"project":null,"query":"Data Scientist Enosis"}

Example 3:
User: "malaysia te thake ekjon alumni er profile dao je machine learning skill ace"
Output:
{"position":null,"company":null,"location":"Malaysia","skill":"Machine Learning","session":null,"project":null,"query":"Malaysia Machine Learning"}

Example 4:
User: "Dhaka te thaka 2022 session er alumni chai"
Output:
{"position":null,"company":null,"location":"Dhaka","skill":null,"session":"2022","project":null,"query":"Dhaka 2022"}`;

const extractSearchFiltersWithOpenRouter = async (prompt, apiKey) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'AlumNet',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenRouter API call failed (${response.status}): ${errData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  return rawText;
};

const extractSearchFiltersWithGemini = async (prompt, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const extractSearchFilters = async (prompt) => {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let rawText;

  if (openRouterKey) {
    try {
      rawText = await extractSearchFiltersWithOpenRouter(prompt, openRouterKey);
    } catch (err) {
      console.error('OpenRouter request failed:', err.message);
      if (geminiKey) {
        console.log('Falling back to Google Gemini SDK...');
        rawText = await extractSearchFiltersWithGemini(prompt, geminiKey);
      } else {
        throw err;
      }
    }
  } else if (geminiKey) {
    rawText = await extractSearchFiltersWithGemini(prompt, geminiKey);
  } else {
    throw new Error(
      'Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured in environment variables'
    );
  }

  if (!rawText) {
    throw new Error('Empty response received from AI API');
  }

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

  const sanitizeValue = (val) => {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
    return null;
  };

  const finalFilters = {
    position: sanitizeValue(parsedFilters.position),
    company: sanitizeValue(parsedFilters.company),
    location: sanitizeValue(parsedFilters.location),
    skill: sanitizeValue(parsedFilters.skill),
    session: sanitizeValue(parsedFilters.session),
    project: sanitizeValue(parsedFilters.project),
    query: sanitizeValue(parsedFilters.query),
  };

  return finalFilters;
};

module.exports = {
  extractSearchFilters,
};
