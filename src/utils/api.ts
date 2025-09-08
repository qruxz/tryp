// Enhanced API configuration with Hinglish detection support
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  refined_query?: string;
  session_id?: string;
  language?: string;
  detected_language?: 'en' | 'hinglish'; // ✅ Only English & Hinglish
}

export async function sendMessage(
  message: string,
  language: "en" | "hinglish" = "en" // ✅ Removed Hindi
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
      response:
        "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001",
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

// ✅ Helper function to detect Hinglish in frontend (for preview/validation)
export function isHinglishText(text: string): boolean {
  const hinglishWords = [
    'kaise', 'kya', 'hai', 'nahi', 'kyu', 'kab', 'kaun', 'acha', 'krna', 'karo', 'karta',
    'bhai', 'haan', 'karna', 'hona', 'paas', 'chal', 'kyunki', 'fir', 'bhi', 'aap', 'aapka',
    'yeh', 'ye', 'woh', 'wo', 'mera', 'mere', 'tera', 'tere', 'batao', 'bataiye', 'chahiye'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const hinglishCount = words.filter(word => hinglishWords.includes(word)).length;
  
  return hinglishCount > 0 && hinglishCount / words.length > 0.2;
}
