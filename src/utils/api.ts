// Optimized API configuration with CORS and performance improvements
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
  refined_query?: string;
  session_id?: string;
  language?: string;
  detected_language?: 'en' | 'hi' | 'hinglish';
}

// Request cache for faster responses
const requestCache = new Map<string, { response: ChatResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Request debouncing
let currentRequest: AbortController | null = null;

export async function sendMessage(
  message: string,
  language: "en" | "hi" = "en"
): Promise<ChatResponse> {
  // Cancel previous request if still pending
  if (currentRequest) {
    currentRequest.abort();
  }
  
  currentRequest = new AbortController();
  const cacheKey = `${message.trim().toLowerCase()}_${language}`;
  
  // Check cache first
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🚀 Using cached response');
    return cached.response;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Language": language,
        "Accept": "application/json",
        // CORS headers
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Language, Accept",
      },
      body: JSON.stringify({ message }),
      signal: currentRequest.signal,
      // Performance optimizations
      keepalive: true,
      cache: "no-cache",
      mode: "cors",
      credentials: "omit"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache successful responses
    if (data.success) {
      requestCache.set(cacheKey, { 
        response: data, 
        timestamp: Date.now() 
      });
      
      // Clean old cache entries
      cleanCache();
    }
    
    // Log detected language for debugging
    if (data.detected_language && data.detected_language !== language) {
      console.log(`🔍 Auto-detected: ${data.detected_language} (preference: ${language})`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted');
      throw error;
    }
    
    console.error("Error sending message:", error);
    return {
      response: getErrorMessage(error),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    currentRequest = null;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      cache: "no-cache",
      mode: "cors",
      credentials: "omit"
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.api_key === "configured" && data.status === "healthy";
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}

// Helper function to get user-friendly error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return "Request was cancelled. Please try again.";
    }
    if (error.message.includes('Failed to fetch')) {
      return "Unable to connect to server. Please check your connection and ensure the backend is running.";
    }
    if (error.message.includes('timeout')) {
      return "Request timed out. Please try again with a shorter message.";
    }
  }
  return "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running on http://localhost:5001";
}

// Clean old cache entries
function cleanCache(): void {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
  
  // Limit cache size
  if (requestCache.size > 100) {
    const oldestKey = requestCache.keys().next().value;
    if (oldestKey) {
      requestCache.delete(oldestKey);
    }
  }
}

// Helper function to detect Hinglish in frontend (for preview/validation)
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

// Preconnect to API for faster initial requests
export function preconnectToAPI(): void {
  try {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = API_BASE_URL;
    document.head.appendChild(link);
  } catch (error) {
    console.warn('Could not preconnect to API:', error);
  }
}

// Initialize preconnection when module loads
if (typeof window !== 'undefined') {
  preconnectToAPI();
}
