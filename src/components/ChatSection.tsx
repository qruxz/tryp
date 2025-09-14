"use client";  
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { sendMessage, checkHealth } from "@/utils/api";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const LCB_GREEN = "rgb(148,191,115)";
const LCB_GREEN_DARK = "rgb(118,161,85)";
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

  // Language state: "en" for English, "hi" for Hindi (Hinglish auto-detected)
  const [language, setLanguage] = useState<"en" | "hi">("en");

  // Follow-up suggestions state
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

  // English follow-up questions
  const englishQuestions = [
    "What is Navyakosh Organic Fertilizer?",
    "What are the benefits of using Navyakosh?",
    "How do I apply it for Wheat, Maize, and Paddy?",
    "Is it safe for long-term soil health?",
    "Can it replace chemical fertilizers?",
    "How does it improve crop yield?",
    "What kind of results can I expect?",
    "On which crops can it be used?",
    "Where can I buy Navyakosh?",
    "How does it reduce irrigation?",
    "What is the cost of Navyakosh?",
    "How much quantity should I use?",
    "When should I apply the fertilizer?",
    "What are the soil requirements?",
    "How long does it take to show results?",
    "Is it suitable for organic farming?",
    "What is the shelf life?",
    "How to store Navyakosh properly?",
    "Can it be mixed with other fertilizers?",
    "What are the main ingredients?",
    "How does weather affect application?",
    "What crops benefit most from Navyakosh?",
    "How often should I apply it?",
    "What is the application method for different crops?",
    "Does it work in all soil types?"
  ];

  // Hindi follow-up questions
  const hindiQuestions = [
    "नव्याकोश जैविक उर्वरक क्या है?",
    "नव्याकोश उपयोग करने के क्या फायदे हैं?",
    "गेहूं, मक्का और धान के लिए इसे कैसे लगाएं?",
    "क्या यह मिट्टी के स्वास्थ्य के लिए सुरक्षित है?",
    "क्या यह रासायनिक उर्वरकों की जगह ले सकता है?",
    "यह फसल की पैदावार कैसे बढ़ाता है?",
    "मुझे किस प्रकार के परिणामों की उम्मीद करनी चाहिए?",
    "यह किन फसलों पर इस्तेमाल हो सकता है?",
    "नव्याकोश कहाँ से खरीद सकते हैं?",
    "यह सिंचाई कैसे कम करता है?",
    "नव्याकोश की कीमत क्या है?",
    "कितनी मात्रा में उपयोग करना चाहिए?",
    "उर्वरक कब लगाना चाहिए?",
    "मिट्टी की क्या आवश्यकताएं हैं?",
    "परिणाम दिखने में कितना समय लगता है?",
    "क्या यह जैविक खेती के लिए उपयुक्त है?",
    "इसकी शेल्फ लाइफ कितनी है?",
    "नव्याकोश को सही तरीके से कैसे स्टोर करें?",
    "क्या इसे अन्य उर्वरकों के साथ मिलाया जा सकता है?",
    "मुख्य सामग्री क्या हैं?",
    "मौसम लगाने को कैसे प्रभावित करता है?",
    "कौन सी फसलों को नव्याकोश से सबसे ज्यादा फायदा होता है?",
    "कितनी बार लगाना चाहिए?",
    "विभिन्न फसलों के लिए लगाने का तरीका क्या है?",
    "क्या यह सभी प्रकार की मिट्टी में काम करता है?"
  ];

  const isNearBottom = (): boolean => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const threshold = 100;
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

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentQuestions = language === "en" ? englishQuestions : hindiQuestions;
    const filtered = currentQuestions.filter((question) =>
      question.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 6); // Show max 6 suggestions

    setFollowUpSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, language]);

  // Handle keyboard navigation for suggestions
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

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSendMessage(suggestion);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const predefinedQuestions = language === "en" ? englishQuestions.slice(0, 12) : hindiQuestions.slice(0, 12);

  // Server health check with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkServerStatus = async () => {
      try {
        const isOnline = await Promise.race([
          checkHealth(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        setIsServerOnline(isOnline);
        if (!isOnline) {
          toast.error("AI server is currently offline. Please try again later.");
        }
      } catch (error) {
        setIsServerOnline(false);
        console.error("Health check failed:", error);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 45000); // Check every 45 seconds
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const updateChipsScrollState = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    updateChipsScrollState();
    const onResize = () => updateChipsScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [predefinedQuestions]);

  const scrollChips = (dir: "left" | "right") => {
    const el = chipsRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    if (!isServerOnline) {
      toast.error("AI server is currently offline. Please try again later.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowSuggestions(false);
    setIsLoading(true);
    
    // Immediate scroll without animation for better UX
    setTimeout(() => scrollChatToBottom(), 50);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await sendMessage(messageText, language);
      clearTimeout(timeoutId);

      if (response.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        toast.error("Failed to get response. Please try again.");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to get response. Please try again later.");
      }
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-0 sm:p-4 font-poppins">
      <div className="w-full h-full sm:w-[95vw] sm:h-[92vh] sm:max-w-7xl mx-auto">
        <div
          className="bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl overflow-hidden flex flex-col h-full border-0 sm:border"
          style={{ borderColor: LCB_GREEN }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 sm:px-6 sm:py-4 text-white border-b flex justify-between items-center shrink-0"
            style={{ backgroundColor: LCB_GREEN, borderColor: LCB_GREEN_DARK }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src="https://static.wixstatic.com/media/9f521c_3889887a159a4d15b348c18ed3a8b49c~mv2.jpeg/v1/crop/x_24,y_43,w_579,h_579/fill/w_80,h_80,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/LCB%20Fertilizers.jpeg"
                  alt="LCB Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-montserrat font-bold">
                  LCB ChatBot 🌱
                </h2>
                <p className="text-xs sm:text-sm font-poppins opacity-90">
                  {language === "en" ? "Ask about Navyakosh (English/Hinglish supported)" : "नव्याकोश के बारे में पूछें"}
                </p>
              </div>
            </div>

            {/* Language Toggle - Hindi and English */}
            <div className="flex items-center gap-1 text-sm bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  language === "en" 
                    ? "bg-white text-green-700 shadow-sm" 
                    : "text-white hover:bg-white/20"
                }`}
                title="English (Hinglish auto-detected)"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  language === "hi" 
                    ? "bg-white text-green-700 shadow-sm" 
                    : "text-white hover:bg-white/20"
                }`}
                title="Hindi"
              >
                हिं
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4 bg-gray-50/50"
            style={{ scrollBehavior: "smooth" }}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="rounded-2xl px-4 py-3 max-w-xs font-poppins text-sm flex items-center gap-2"
                  style={{ backgroundColor: LCB_GREEN_SOFT, color: LCB_GREEN_DARK }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  {language === "en" ? "Typing..." : "टाइप कर रहे हैं..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Suggestions + Chips */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-t relative shrink-0" style={{ borderColor: LCB_GREEN }}>
            {/* Follow-up Suggestions Dropdown */}
            {showSuggestions && followUpSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute bottom-full left-4 right-4 sm:left-6 sm:right-6 mb-2 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto z-20"
                style={{ borderColor: LCB_GREEN }}
              >
                {followUpSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 font-poppins text-sm transition-colors ${
                      selectedSuggestionIndex === index ? 'bg-green-50' : ''
                    }`}
                    style={{
                      color: selectedSuggestionIndex === index ? LCB_GREEN_DARK : '#374151'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "en" 
                    ? "Type in English or Hinglish (e.g., 'aap kya bechte ho')..." 
                    : "अपना प्रश्न हिंदी में टाइप करें..."
                }
                className="flex-1 bg-gray-50 rounded-xl font-poppins text-sm sm:text-base h-12 sm:h-14 px-4 focus:bg-white transition-colors"
                style={{
                  borderColor: LCB_GREEN,
                  color: "#166534",
                }}
                disabled={isLoading || !isServerOnline}
                autoComplete="off"
                spellCheck="false"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !isServerOnline}
                className="rounded-xl px-4 sm:px-6 text-white font-montserrat h-12 sm:h-14 min-w-[48px] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: LCB_GREEN }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN_DARK)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN)
                }
              >
                <ArrowRight size={18} className="shrink-0" />
              </Button>
            </div>

            {/* Chips */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-montserrat font-medium" style={{ color: LCB_GREEN_DARK }}>
                {language === "en" ? "Try asking:" : "पूछने की कोशिश करें:"}
              </p>

              <div className="relative">
                <button
                  aria-label="Scroll left"
                  onClick={() => scrollChips("left")}
                  disabled={!canScrollLeft}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 shadow-lg transition-all ${
                    canScrollLeft 
                      ? "opacity-100 hover:scale-110" 
                      : "opacity-0 cursor-not-allowed"
                  } hidden sm:flex`}
                  style={{ backgroundColor: LCB_GREEN, color: "white" }}
                >
                  <ChevronLeft size={18} />
                </button>

                <div
                  ref={chipsRef}
                  onScroll={updateChipsScrollState}
                  className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory px-2 sm:px-10 pb-2 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {predefinedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading || !isServerOnline}
                      className="shrink-0 snap-start rounded-full text-xs sm:text-sm px-4 py-2.5 border-2 transition-all hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap font-medium active:scale-95"
                      style={{
                        borderColor: LCB_GREEN,
                        color: LCB_GREEN_DARK,
                        background: "white",
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <button
                  aria-label="Scroll right"
                  onClick={() => scrollChips("right")}
                  disabled={!canScrollRight}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 shadow-lg transition-all ${
                    canScrollRight 
                      ? "opacity-100 hover:scale-110" 
                      : "opacity-0 cursor-not-allowed"
                  } hidden sm:flex`}
                  style={{ backgroundColor: LCB_GREEN, color: "white" }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style >{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatSection;
