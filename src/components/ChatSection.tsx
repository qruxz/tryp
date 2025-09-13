"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { sendMessage, checkHealth, testCORS, detectInputLanguage, getSmartPlaceholder } from "@/utils/api";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

const LCB_GREEN = "rgb(148,191,115)";
const LCB_GREEN_DARK = "rgb(148,191,115)";
const LCB_GREEN_SOFT = "#EAF8EE";

const ChatSection = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "LCB Fertilizer's Query Window. Ask me any queries you have!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);

  // Two-language toggle: English and Hindi
  const [language, setLanguage] = useState<"en" | "hi">("en");

  // Smart language detection state
  const [detectedInputLanguage, setDetectedInputLanguage] = useState<"en" | "hi" | "hinglish">("en");

  // Follow-up suggestions
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Enhanced questions for both languages
  const englishQuestions = [
    "What is Navyakosh Organic Fertilizer?",
    "What are the benefits of using Navyakosh?",
    "How do I apply it for Wheat, Maize, and Paddy?",
    "Is it safe for long-term soil health?",
    "Can it replace chemical fertilizers?",
    "How does it improve crop yield?",
    "Where can I buy Navyakosh?",
    "How much quantity should I use?",
    "When should I apply the fertilizer?",
    "Does it work in all soil types?"
  ];

  // Hindi questions (Devanagari script)
  const hindiQuestions = [
    "नव्याकोष जैविक उर्वरक क्या है?",
    "नव्याकोष का उपयोग करने के क्या फायदे हैं?",
    "गेहूं, मक्का और धान के लिए इसे कैसे लगाएं?",
    "क्या यह दीर्घकालिक मिट्टी के स्वास्थ्य के लिए सुरक्षित है?",
    "क्या यह रासायनिक उर्वरकों को बदल सकता है?",
    "यह फसल की पैदावार कैसे बेहतर बनाता है?",
    "नव्याकोष कहां मिलेगा?",
    "कितनी मात्रा में उपयोग करना चाहिए?",
    "कब लगाना सही है?",
    "क्या यह सभी प्रकार की मिट्टी में काम करता है?"
  ];

  // Dynamic input detection
  useEffect(() => {
    if (inputValue.trim()) {
      const detected = detectInputLanguage(inputValue);
      setDetectedInputLanguage(detected);
    } else {
      setDetectedInputLanguage(language);
    }
  }, [inputValue, language]);

  const isNearBottom = (): boolean => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const threshold = 80;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollChatToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (isNearBottom()) scrollChatToBottom();
  }, [messages]);

  // Get current questions based on language mode
  const getCurrentQuestions = () => {
    return language === "hi" ? hindiQuestions : englishQuestions;
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentQuestions = getCurrentQuestions();
    const filtered = currentQuestions
      .filter((question) =>
        question.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 5);

    setFollowUpSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, language]);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || followUpSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < followUpSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selectedSuggestion = followUpSuggestions[selectedSuggestionIndex];
      setInputValue(selectedSuggestion);
      setShowSuggestions(false);
      handleSendMessage(selectedSuggestion);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSendMessage(suggestion);
  };

  const predefinedQuestions = getCurrentQuestions().slice(0, 10);

  // Enhanced server health check with detailed CORS testing
  useEffect(() => {
    const checkServerStatus = async () => {
      console.log("🔍 Checking server status...");
      
      // Test CORS first with detailed logging
      const corsWorking = await testCORS();
      if (!corsWorking) {
        console.warn("⚠️ CORS test failed - this may cause connection issues");
        toast.error("CORS configuration issue detected");
      }
      
      const isOnline = await checkHealth();
      setIsServerOnline(isOnline);
      
      if (!isOnline) {
        toast.error("AI server is currently offline. Please check backend on http://localhost:5001");
      } else {
        console.log("✅ Server is online and healthy");
        toast.success("Connected to AI server", { duration: 2000 });
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const updateChipsScrollState = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateChipsScrollState();
    const onResize = () => updateChipsScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollChips = (dir: "left" | "right") => {
    const el = chipsRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    if (!isServerOnline) {
      toast.error("AI server is currently offline. Please check http://localhost:5001");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      language: detectedInputLanguage,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setShowSuggestions(false);
    setIsLoading(true);
    requestAnimationFrame(scrollChatToBottom);

    try {
      console.log(`📤 Sending message: "${messageText}"`);
      console.log(`🎛️ User toggle: ${language}`);
      console.log(`🔍 Detected input: ${detectedInputLanguage}`);
      
      const response = await sendMessage(messageText, language); // Send user's toggle preference
      
      if (response.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false,
          timestamp: new Date(),
          language: response.response_language,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Show smart detection info to user
        if (response.response_language === 'hinglish') {
          toast.success("Detected Hinglish - responding accordingly", { duration: 3000 });
        } else if (response.response_language !== response.user_language_preference) {
          toast.info(`Auto-adjusted response language`, { duration: 3000 });
        }
        
        console.log("✅ Message sent successfully");
        console.log(`🎯 Response language: ${response.response_language}`);
      } else {
        console.error("❌ Failed to get response:", response.error);
        toast.error("Failed to get response. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      toast.error("Failed to get response. Check your connection and backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && selectedSuggestionIndex === -1) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Get placeholder text with smart detection
  const getPlaceholder = () => {
    return getSmartPlaceholder(language, inputValue);
  };

  // Get loading text based on user's language toggle
  const getLoadingText = () => {
    return language === "hi" ? "टाइप हो रहा है..." : "Typing...";
  };

  // Get "Try asking" text based on language toggle
  const getTryAskingText = () => {
    return language === "hi" ? "पूछने की कोशिश करो:" : "Try asking:";
  };

  // Get header subtitle based on language toggle
  const getHeaderSubtitle = () => {
    return language === "hi" ? "नव्याकोष के बारे में पूछें" : "Ask about Navyakosh";
  };

  // Get input language indicator
  const getInputLanguageIndicator = () => {
    if (!inputValue.trim()) return null;
    
    const indicators = {
      'en': '🇬🇧 English',
      'hi': '🇮🇳 Hindi',
      'hinglish': '🌐 Hinglish'
    };
    
    return indicators[detectedInputLanguage];
  };

  return (
    <section className="px-0 sm:px-6 pb-0 sm:pb-12 font-poppins h-screen sm:h-auto">
      <div className="mx-0 sm:mx-auto w-full sm:max-w-5xl h-screen sm:h-auto">
        <div className="bg-white flex flex-col h-screen sm:h-[80vh] rounded-none sm:rounded-3xl border-0 sm:border-2 shadow-xl overflow-hidden" style={{ borderColor: LCB_GREEN }}>
          
          {/* Enhanced Header with Connection Status */}
          <div className="p-4 sm:p-6 text-white border-b flex justify-between items-center" style={{ backgroundColor: LCB_GREEN, borderColor: LCB_GREEN_DARK }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                <img
                  src="https://static.wixstatic.com/media/9f521c_3889887a159a4d15b348c18ed3a8b49c~mv2.jpeg/v1/crop/x_24,y_43,w_579,h_579/fill/w_80,h_80,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/LCB%20Fertilizers.jpeg"
                  alt="LCB Logo"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-montserrat font-bold">LCB ChatBot 🌱</h2>
                  {isServerOnline ? (
                    <CheckCircle size={16} className="text-green-300" />
                  ) : (
                    <AlertCircle size={16} className="text-red-300" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-poppins">{getHeaderSubtitle()}</p>
              </div>
            </div>

            {/* Two-Language Toggle: English and Hindi */}
            <div className="flex items-center gap-1 text-xs sm:text-sm bg-white bg-opacity-20 rounded-full p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 sm:px-4 py-1.5 rounded-full transition-all ${
                  language === "en" 
                    ? "bg-white text-green-700 font-bold shadow-sm" 
                    : "bg-transparent text-white hover:bg-white hover:bg-opacity-10"
                }`}
                title="English Mode"
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-3 sm:px-4 py-1.5 rounded-full transition-all ${
                  language === "hi" 
                    ? "bg-white text-green-700 font-bold shadow-sm" 
                    : "bg-transparent text-white hover:bg-white hover:bg-opacity-10"
                }`}
                title="Hindi Mode"
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-xs font-poppins" style={{ backgroundColor: LCB_GREEN_SOFT, color: LCB_GREEN_DARK }}>
                  {getLoadingText()}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input + Suggestions + Chips */}
          <div className="p-4 sm:p-6 bg-white border-t relative" style={{ borderColor: LCB_GREEN }}>
            {/* Follow-up Suggestions */}
            {showSuggestions && followUpSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute bottom-full left-4 right-4 sm:left-6 sm:right-6 mb-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10" style={{ borderColor: LCB_GREEN }}>
                {followUpSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 font-poppins text-sm ${selectedSuggestionIndex === index ? 'bg-gray-50' : ''}`}
                    style={{ color: selectedSuggestionIndex === index ? LCB_GREEN_DARK : '#374151' }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  className="bg-white rounded-xl font-poppins pr-20"
                  style={{ borderColor: LCB_GREEN, color: "#166534" }}
                  disabled={isLoading || !isServerOnline}
                  autoComplete="off"
                />
                {/* Input Language Indicator */}
                {getInputLanguageIndicator() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                    {getInputLanguageIndicator()}
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !isServerOnline}
                className="rounded-xl px-4 sm:px-6 text-white font-montserrat"
                style={{ backgroundColor: LCB_GREEN }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN_DARK)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN)}
              >
                <ArrowRight size={18} />
              </Button>
            </div>

            {/* Chips with improved arrow positioning */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-montserrat" style={{ color: LCB_GREEN_DARK }}>
                {getTryAskingText()}
              </p>
              <div className="relative">
                {/* Left Arrow */}
                <button 
                  aria-label="Scroll left" 
                  onClick={() => scrollChips("left")} 
                  disabled={!canScrollLeft} 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-md transition-all ${
                    canScrollLeft ? "opacity-100 hover:scale-105" : "opacity-30 cursor-not-allowed"
                  } hidden sm:flex`} 
                  style={{ 
                    backgroundColor: LCB_GREEN, 
                    color: "white",
                    marginLeft: "-12px"
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Chips container */}
                <div 
                  ref={chipsRef} 
                  onScroll={updateChipsScrollState} 
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory items-stretch py-1 px-1 sm:px-10"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                  }}
                >
                  {predefinedQuestions.map((question, index) => (
                    <button 
                      key={index} 
                      onClick={() => handleSendMessage(question)} 
                      disabled={isLoading || !isServerOnline} 
                      className="shrink-0 snap-start rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 border transition-all hover:shadow-md hover:scale-[1.02] active:scale-95" 
                      style={{ 
                        borderColor: LCB_GREEN, 
                        color: LCB_GREEN_DARK, 
                        background: "white",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>

                {/* Right Arrow */}
                <button 
                  aria-label="Scroll right" 
                  onClick={() => scrollChips("right")} 
                  disabled={!canScrollRight} 
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-md transition-all ${
                    canScrollRight ? "opacity-100 hover:scale-105" : "opacity-30 cursor-not-allowed"
                  } hidden sm:flex`} 
                  style={{ 
                    backgroundColor: LCB_GREEN, 
                    color: "white",
                    marginRight: "-12px"
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Smart Detection Info */}
            {detectedInputLanguage === 'hinglish' && inputValue.trim() && (
              <div className="mt-2 text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                💡 Hinglish detected - will respond in Hinglish regardless of toggle setting
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
