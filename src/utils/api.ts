// Fixed API configuration with two-language support and proper CORS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  session_id?: string;
  user_language_preference?: 'en' | 'hi';
  response_language?: 'en' | 'hi' | 'hinglish';
}

export async function sendMessage(
  message: string,
  language: "en" | "hi" = "en"
): Promise<ChatResponse> {
  try {
    console.log(`🚀 Sending message to ${API_BASE_URL}/api/chat`);
    console.log(`📝 Message: "${message}"`);
    console.log(`🌐 User language preference: ${language}`);
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Language": language, // Send user's language preference (en or hi)
        "Origin": window.location.origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, X-Language",
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ message }),
    });

    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Response received:`, data);
        
    // Log smart language detection results
    if (data.response_language && data.user_language_preference) {
      console.log(`🔍 Smart Detection Results:`);
      console.log(`   User preference: ${data.user_language_preference}`);
      console.log(`   Response language: ${data.response_language}`);
      
      if (data.response_language === 'hinglish') {
        console.log(`   🎯 Detected Hinglish input - responding in Hinglish`);
      } else if (data.response_language !== data.user_language_preference) {
        console.log(`   🔄 Language adjusted based on input`);
      }
    }
        
    return data;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    
    // Enhanced error handling with CORS-specific messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("🌐 Network error - possible causes:");
      console.error("   1. Backend not running on http://localhost:5001");
      console.error("   2. CORS policy blocking request");
      console.error("   3. Network connectivity issue");
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
    
    // Check if smart detection is enabled
    if (data.smart_detection === "enabled") {
      console.log(`🧠 Smart language detection is enabled`);
    }
    
    return data.api_key === "configured" && data.rag_system === "initialized";
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
}

// Enhanced CORS test with more detailed logging
export async function testCORS(): Promise<boolean> {
  try {
    console.log(`🧪 Testing CORS at ${API_BASE_URL}/api/cors-test`);
    
    // Test preflight request
    const preflightResponse = await fetch(`${API_BASE_URL}/api/cors-test`, {
      method: "OPTIONS",
      headers: {
        "Origin": window.location.origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Accept, Content-Type",
      },
      mode: "cors",
    });
    
    console.log(`🚁 Preflight response status: ${preflightResponse.status}`);
    
    // Test actual request
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
    console.error("   Possible causes:");
    console.error("   1. Backend CORS middleware not configured correctly");
    console.error("   2. Backend not running");
    console.error("   3. Network blocking cross-origin requests");
    return false;
  }
}

// Helper function to get error messages in appropriate language
function getErrorMessage(language: "en" | "hi"): string {
  switch (language) {
    case "en":
      return "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001 and CORS is properly configured.";
    case "hi":
      return "क्षमा करें, सर्वर से कनेक्ट करने में समस्या हो रही है। कृपया जांच लें कि बैकएंड http://localhost:5001 पर चल रहा है और CORS सही तरीके से कॉन्फ़िगर किया गया है।";
    default:
      return "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001";
  }
}

// Enhanced language detection functions (client-side validation)
export function isHinglishText(text: string): boolean {
  const hinglishWords = [
    // Question words
    'kaise', 'kya', 'kaun', 'kab', 'kyun', 'kyu', 'kahan', 'kitna', 'kitni',
    
    // Common words
    'hai', 'hain', 'nahi', 'haan', 'acha', 'accha', 'theek', 'krna', 'karo', 'karta', 'karte',
    'bhai', 'didi', 'sir', 'madam', 'ji', 'sahab',
    
    // Pronouns and possessives
    'aap', 'aapka', 'aapko', 'yeh', 'ye', 'woh', 'wo', 'mera', 'mere', 'tera', 'tere',
    'mein', 'main', 'tum', 'tumhara', 'hamara', 'humara', 'unka', 'iska', 'uska',
    
    // Verbs
    'batao', 'bataiye', 'chahiye', 'chaahiye', 'hona', 'gaya', 'gayi', 'kiya', 'hua', 'hui',
    'milta', 'milega', 'dekho', 'dekhe', 'suno', 'suniye', 'boliye', 'kaho', 'kehte',
    'samjha', 'samjhi', 'pata', 'malum', 'lagana', 'apply',
    
    // Connectors
    'jaise', 'waise', 'phir', 'fir', 'abhi', 'sabhi', 'sab', 'kuch', 'koi', 
    'agar', 'lekin', 'par', 'aur', 'ya', 'bhi', 'ke', 'ka', 'ki', 'liye',
    
    // Agricultural/fertilizer specific
    'navyakosh', 'fertilizer', 'organic', 'fayde', 'benefits', 'price', 'cost', 'rate',
    'khareed', 'soil', 'mitti', 'crop', 'fasal', 'khet', 'kheti', 'ugana', 'paida',
    'wala', 'wale', 'wali', 'waala', 'waale', 'waali'
  ];
    
  const words = text.toLowerCase().split(/\s+/);
  const hinglishCount = words.filter(word => hinglishWords.includes(word)).length;
  const totalWords = words.length;
    
  // More lenient detection - even 1 Hinglish word in a short sentence
  if (totalWords <= 3 && hinglishCount >= 1) return true;
  if (totalWords <= 10 && hinglishCount >= 2) return true;
    
  return hinglishCount > 0 && (hinglishCount / totalWords) > 0.15;
}

// Function to detect Hindi (Devanagari) text
export function isHindiText(text: string): boolean {
  // Check for Devanagari Unicode range (U+0900-U+097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

// Client-side language detection for UI feedback
export function detectInputLanguage(text: string): 'en' | 'hi' | 'hinglish' {
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
export function isValidLanguage(lang: string): lang is 'en' | 'hi' {
  return ['en', 'hi'].includes(lang);
}

// Get appropriate placeholder text based on detected input
export function getSmartPlaceholder(userToggle: 'en' | 'hi', inputText: string = ''): string {
  if (inputText.trim()) {
    const detected = detectInputLanguage(inputText);
    if (detected === 'hinglish') {
      return "Continue typing in Hinglish...";
    }
  }
  
  return userToggle === 'hi' 
    ? "अपना प्रश्न लिखें..." 
    : "Type your question...";
}
