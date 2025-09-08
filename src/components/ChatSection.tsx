"use client";  
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Bot, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Language state: "en" for English, "hi" for Hinglish (using "hi" to maintain backend compatibility)
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

  // Hinglish follow-up questions
  const hinglishQuestions = [
    "aap kya bechte ho?",
    "Navyakosh kya hai organic fertilizer?",
    "iske kya fayde hai crops ke liye?",
    "wheat, maize aur paddy ke liye kaise use karna hai?",
    "soil health ke liye safe hai kya?",
    "chemical fertilizers ki jagah use kar sakte hai?",
    "crop yield kaise improve karta hai?",
    "kya results expect kar sakte hai?",
    "kaun se crops pe use kar sakte hai?",
    "kahan se buy kar sakte hai Navyakosh?",
    "irrigation kaise reduce karta hai?",
    "price kya hai Navyakosh ki?",
    "kitna quantity use karna chahiye?",
    "kab apply karna chahiye fertilizer?",
    "soil requirements kya hai?",
    "results dikhne mein kitna time lagta hai?",
    "organic farming ke liye suitable hai?",
    "shelf life kitni hai?",
    "proper storage kaise karna hai?",
    "dusre fertilizers ke saath mix kar sakte hai?",
    "main ingredients kya hai?",
    "weather ka application pe effect hota hai kya?",
    "kaun se crops ko sabse zyada benefit hota hai?",
    "kitni baar apply karna chahiye?",
    "different crops ke liye application method alag hai?",
    "sabhi soil types mein kaam karta hai?"
  ];

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

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentQuestions = language === "en" ? englishQuestions : hinglishQuestions;
    const filtered = currentQuestions.filter((question) =>
      question.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 5); // Show max 5 suggestions

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

  const predefinedQuestions = language === "en" ? englishQuestions.slice(0, 10) : hinglishQuestions.slice(0, 10);

  // Server check
  useEffect(() => {
    const checkServerStatus = async () => {
      const isOnline = await checkHealth();
      setIsServerOnline(isOnline);
      if (!isOnline) {
        toast.error("AI server is currently offline. Please try again later.");
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
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
    requestAnimationFrame(scrollChatToBottom);

    try {
      const response = await sendMessage(messageText, language);

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
      toast.error("Failed to get response. Please try again later.");
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
    <section className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 font-poppins bg-gray-50">
      <div className="w-full max-w-6xl mx-auto h-screen sm:h-[95vh]">
        <div
          className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-xl overflow-hidden flex flex-col h-full border-0 sm:border-2"
          style={{ borderColor: LCB_GREEN }}
        >
          {/* Header */}
          <div
            className="p-4 sm:p-6 text-white border-b flex justify-between items-center"
            style={{ backgroundColor: LCB_GREEN, borderColor: LCB_GREEN_DARK }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                <img
                  src="https://static.wixstatic.com/media/9f521c_3889887a159a4d15b348c18ed3a8b49c~mv2.jpeg/v1/crop/x_24,y_43,w_579,h_579/fill/w_80,h_80,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/LCB%20Fertilizers.jpeg"
                  alt="LCB Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-montserrat font-bold">
                  LCB ChatBot 🌱
                </h2>
                <p className="text-xs sm:text-sm font-poppins">
                  {language === "en" ? "Ask about Navyakosh" : "Navyakosh ke baare mein puche"}
                </p>
              </div>
            </div>

            {/* Language Toggle - English and Hinglish */}
            <div className="flex items-center gap-1 sm:gap-2 text-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 sm:px-3 py-1 rounded transition-all ${
                  language === "en" ? "bg-white text-green-700 font-bold shadow" : "bg-transparent text-white hover:bg-white/20"
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2 sm:px-3 py-1 rounded transition-all ${
                  language === "hi" ? "bg-white text-green-700 font-bold shadow" : "bg-transparent text-white hover:bg-white/20"
                }`}
                title="Hinglish"
              >
                हिंग्लिश
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-white"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3 sm:px-4 py-2 max-w-xs font-poppins text-sm"
                  style={{ backgroundColor: LCB_GREEN_SOFT, color: LCB_GREEN_DARK }}
                >
                  {language === "en" ? "Typing..." : "Type kar raha hai..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Suggestions + Chips */}
          <div className="p-3 sm:p-6 bg-white border-t relative" style={{ borderColor: LCB_GREEN }}>
            {/* Follow-up Suggestions Dropdown */}
            {showSuggestions && followUpSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute bottom-full left-3 right-3 sm:left-6 sm:right-6 mb-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10"
                style={{ borderColor: LCB_GREEN }}
              >
                {followUpSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 font-poppins text-sm transition-colors ${
                      selectedSuggestionIndex === index ? 'bg-gray-50' : ''
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "en" 
                    ? "Type your question in English..." 
                    : "Apna sawal Hinglish mein type kare..."
                }
                className="flex-1 bg-white rounded-xl font-poppins text-sm sm:text-base"
                style={{
                  borderColor: LCB_GREEN,
                  color: "#166534",
                }}
                disabled={isLoading || !isServerOnline}
                autoComplete="off"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !isServerOnline}
                className="rounded-xl px-4 sm:px-6 text-white font-montserrat h-10 sm:h-11"
                style={{ backgroundColor: LCB_GREEN }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN_DARK)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor = LCB_GREEN)
                }
              >
                <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
            </div>

            {/* Chips */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-montserrat" style={{ color: LCB_GREEN_DARK }}>
                {language === "en" ? "Try asking:" : "Ye puche:"}
              </p>

              <div className="relative">
                <button
                  aria-label="Scroll left"
                  onClick={() => scrollChips("left")}
                  disabled={!canScrollLeft}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow transition-opacity ${
                    canScrollLeft ? "opacity-100" : "opacity-40 cursor-not-allowed"
                  } hidden sm:flex`}
                  style={{ backgroundColor: LCB_GREEN, color: "white" }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div
                  ref={chipsRef}
                  onScroll={updateChipsScrollState}
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory pr-2 pl-2 sm:pl-8 sm:pr-8 items-stretch pb-1"
                >
                  {predefinedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading || !isServerOnline}
                      className="shrink-0 snap-start rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 border transition-all hover:shadow-md hover:bg-gray-50 whitespace-nowrap"
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
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow transition-opacity ${
                    canScrollRight ? "opacity-100" : "opacity-40 cursor-not-allowed"
                  } hidden sm:flex`}
                  style={{ backgroundColor: LCB_GREEN, color: "white" }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 0px;
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: ${LCB_GREEN};
          border-radius: 2px;
        }
        @media (max-width: 640px) {
          div::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default ChatSection;
