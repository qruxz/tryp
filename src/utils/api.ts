// Enhanced API configuration with Hindi, English, and Hinglish support
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  refined_query?: string;
  session_id?: string;
  language?: string;
  detected_language?: 'en' | 'hinglish' | 'hi'; // ✅ Added Hindi support
}

export async function sendMessage(
  message: string,
  language: "en" | "hinglish" | "hi" = "en" // ✅ Added Hindi support
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Language": language, // Send user's language preference
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
        
    // Log detected language for debugging (optional)
    if (data.detected_language && data.detected_language !== language) {
      console.log(`🔍 Auto-detected language: ${data.detected_language} (user preference: ${language})`);
    }
        
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      response: getErrorMessage(language),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.api_key === "configured";
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}

// ✅ Helper function to get error messages in appropriate language
function getErrorMessage(language: "en" | "hinglish" | "hi"): string {
  switch (language) {
    case "en":
      return "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001";
    case "hinglish":
      return "Sorry, server se connect nahi ho pa raha. Please check karo ki backend http://localhost:5001 pe running hai";
    case "hi":
      return "क्षमा करें, सर्वर से कनेक्ट करने में समस्या हो रही है। कृपया जांच लें कि बैकएंड http://localhost:5001 पर चल रहा है";
    default:
      return "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001";
  }
}

// ✅ Enhanced language detection functions
export function isHinglishText(text: string): boolean {
  const hinglishWords = [
    'kaise', 'kya', 'hai', 'nahi', 'kyu', 'kab', 'kaun', 'acha', 'krna', 'karo', 'karta',
    'bhai', 'haan', 'karna', 'hona', 'paas', 'chal', 'kyunki', 'fir', 'bhi', 'aap', 'aapka',
    'yeh', 'ye', 'woh', 'wo', 'mera', 'mere', 'tera', 'tere', 'batao', 'bataiye', 'chahiye',
    'mein', 'main', 'tum', 'tumhara', 'hamara', 'unka', 'iska', 'uska', 'jaise', 'waise',
    'phir', 'abhi', 'sabhi', 'sab', 'kuch', 'koi', 'agar', 'lekin', 'par', 'aur', 'ya'
  ];
    
  const words = text.toLowerCase().split(/\s+/);
  const hinglishCount = words.filter(word => hinglishWords.includes(word)).length;
    
  return hinglishCount > 0 && hinglishCount / words.length > 0.2;
}

// ✅ New function to detect Hindi (Devanagari) text
export function isHindiText(text: string): boolean {
  // Check for Devanagari Unicode range (U+0900-U+097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

// ✅ Smart language detection that can distinguish between all three
export function detectLanguage(text: string): 'en' | 'hinglish' | 'hi' {
  // First check for Hindi (Devanagari script)
  if (isHindiText(text)) {
    return 'hi';
  }
  
  // Then check for Hinglish (romanized Hindi words)
  if (isHinglishText(text)) {
    return 'hinglish';
  }
  
  // Default to English
  return 'en';
}

// ✅ Helper function to validate language preference
export function isValidLanguage(lang: string): lang is 'en' | 'hinglish' | 'hi' {
  return ['en', 'hinglish', 'hi'].includes(lang);
}
