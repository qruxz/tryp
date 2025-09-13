// Fixed API configuration with proper CORS headers
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  refined_query?: string;
  session_id?: string;
  language?: string;
  detected_language?: 'en' | 'hinglish' | 'hi';
}

export async function sendMessage(
  message: string,
  language: "en" | "hinglish" | "hi" = "en"
): Promise<ChatResponse> {
  try {
    console.log(`🚀 Sending message to ${API_BASE_URL}/api/chat with language: ${language}`);
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Language": language, // Send user's language preference
        "Origin": window.location.origin, // Explicitly set origin
      },
      credentials: "include", // Important for CORS with credentials
      mode: "cors", // Explicitly set CORS mode
      body: JSON.stringify({ message }),
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Response received:`, data);
        
    // Log detected language for debugging
    if (data.detected_language && data.detected_language !== language) {
      console.log(`🔍 Auto-detected language: ${data.detected_language} (user preference: ${language})`);
    }
        
    return data;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("🌐 Network error - check if backend is running on http://localhost:5001");
    }
    
    return {
      response: getErrorMessage(language),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    console.log(`🏥 Checking health at ${API_BASE_URL}/api/health`);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Origin": window.location.origin,
      },
      credentials: "include",
      mode: "cors",
    });
    
    if (!response.ok) {
      console.error(`❌ Health check failed with status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Health check response:`, data);
    
    return data.api_key === "configured" && data.rag_system === "initialized";
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
}

// Test CORS endpoint
export async function testCORS(): Promise<boolean> {
  try {
    console.log(`🧪 Testing CORS at ${API_BASE_URL}/api/cors-test`);
    
    const response = await fetch(`${API_BASE_URL}/api/cors-test`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Origin": window.location.origin,
      },
      credentials: "include",
      mode: "cors",
    });
    
    if (!response.ok) {
      console.error(`❌ CORS test failed with status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ CORS test successful:`, data);
    return true;
  } catch (error) {
    console.error("❌ CORS test failed:", error);
    return false;
  }
}

// Helper function to get error messages in appropriate language
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

// Enhanced language detection functions
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

// Function to detect Hindi (Devanagari) text
export function isHindiText(text: string): boolean {
  // Check for Devanagari Unicode range (U+0900-U+097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

// Smart language detection that can distinguish between all three
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

// Helper function to validate language preference
export function isValidLanguage(lang: string): lang is 'en' | 'hinglish' | 'hi' {
  return ['en', 'hinglish', 'hi'].includes(lang);
}
