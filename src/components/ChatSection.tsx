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

  // ✅ Language state (only English and Hinglish)
  const [language, setLanguage] = useState<"en" | "hinglish">("en");

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

  // ✅ Hinglish example questions
  const hinglishQuestions = [
    "aap kya bechte ho?",
    "Navyakosh kaise use karna hai?",
    "iske kya fayde hai?",
    "price kya hai is fertilizer ki?",
    "kahan se khareed sakte hai?",
    "wheat ke liye kaise lagana hai?",
    "organic hai ya nahi yeh?",
    "kitna quantity chahiye ek acre ke liye?",
    "results kitne time mein aate hai?",
    "kya yeh safe hai soil ke liye?",
    "chemical fertilizer ki jagah use kar sakte hai?",
    "storage kaise karna hai?",
    "shelf life kitni hai?",
    "mixing kar sakte hai dusre fertilizer ke sath?",
    "main ingredients kya hai?",
    "weather ka effect hota hai kya?",
    "best crops kaun se hai is ke liye?",
    "kitni baar apply karna hai?",
    "different crops ke liye method alag hai kya?",
    "all soil types mein kaam karta hai?"
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

  // ✅ Suggestion filtering (strict English OR Hinglish)
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const languageQuestions =
      language === "en" ? englishQuestions : hinglishQuestions;

    const filtered = languageQuestions
      .filter((question) =>
        question.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 6);

    setFollowUpSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, language]);

  // ✅ Predefined chips (strict English OR Hinglish)
  const predefinedQuestions =
    language === "en"
      ? englishQuestions.slice(0, 6)
      : hinglishQuestions.slice(0, 6);

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

        if ((response as any).detected_language) {
          console.log(`Detected language: ${(response as any).detected_language}`);
        }
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
  <section className="px-0 sm:px-6 pb-0 sm:pb-12 font-poppins h-screen sm:h-auto">
  <div className="mx-0 sm:mx-auto w-full sm:max-w-5xl h-screen sm:h-auto">
    <div
      className="bg-white flex flex-col h-screen sm:h-[80vh] rounded-none sm:rounded-3xl border-0 sm:border-2 shadow-xl overflow-hidden"
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
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-montserrat font-bold">
                  LCB ChatBot 🌱
                </h2>
                <p className="text-xs sm:text-sm font-poppins">
                  {language === "en"
                    ? "Ask about Navyakosh (English only)"
                    : "Navyakosh ke baare mein puchho (Hinglish only)"}
                </p>
              </div>
            </div>

            {/* ✅ Language Toggle (English / Hinglish) */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded transition-all ${
                  language === "en"
                    ? "bg-white text-green-700 font-bold shadow"
                    : "bg-transparent text-white hover:bg-white/20"
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hinglish")}
                className={`px-3 py-1 rounded transition-all ${
                  language === "hinglish"
                    ? "bg-white text-green-700 font-bold shadow"
                    : "bg-transparent text-white hover:bg-white/20"
                }`}
                title="Hinglish"
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2 max-w-xs font-poppins"
                  style={{
                    backgroundColor: LCB_GREEN_SOFT,
                    color: LCB_GREEN_DARK,
                  }}
                >
                  {language === "en" ? "Typing..." : "Typing in Hinglish..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Suggestions + Chips */}
          <div
            className="p-4 sm:p-6 bg-white border-t relative"
            style={{ borderColor: LCB_GREEN }}
          >
            {/* Follow-up Suggestions Dropdown */}
            {showSuggestions && followUpSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute bottom-full left-4 right-4 sm:left-6 sm:right-6 mb-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto z-10"
                style={{ borderColor: LCB_GREEN }}
              >
                {followUpSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(suggestion);
                      setShowSuggestions(false);
                      handleSendMessage(suggestion);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 font-poppins text-sm transition-colors ${
                      selectedSuggestionIndex === index ? "bg-gray-50" : ""
                    }`}
                    style={{
                      color:
                        selectedSuggestionIndex === index
                          ? LCB_GREEN_DARK
                          : "#374151",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === "en"
                    ? "Type in English..."
                    : "Type in Hinglish..."
                }
                className="flex-1 bg-white rounded-xl font-poppins"
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
                className="rounded-xl px-4 sm:px-6 text-white font-montserrat"
                style={{ backgroundColor: LCB_GREEN }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    LCB_GREEN_DARK)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    LCB_GREEN)
                }
              >
                <ArrowRight size={18} />
              </Button>
            </div>

            {/* Chips */}
            <div className="space-y-2">
              <p
                className="text-xs sm:text-sm font-montserrat"
                style={{ color: LCB_GREEN_DARK }}
              >
                Try asking ({language === "en" ? "English" : "Hinglish"} examples):
              </p>

              <div className="relative">
                <button
                  aria-label="Scroll left"
                  onClick={() => scrollChips("left")}
                  disabled={!canScrollLeft}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow transition-opacity ${
                    canScrollLeft
                      ? "opacity-100"
                      : "opacity-40 cursor-not-allowed"
                  } hidden sm:flex`}
                  style={{ backgroundColor: LCB_GREEN, color: "white" }}
                >
                  <ChevronLeft size={18} />
                </button>

                <div
                  ref={chipsRef}
                  onScroll={updateChipsScrollState}
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory pr-2 pl-2 sm:pl-8 sm:pr-8 items-stretch"
                >
                  {predefinedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading || !isServerOnline}
                      className="shrink-0 snap-start rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 border transition-all hover:shadow-md hover:bg-gray-50"
                      style={{
                        borderColor: LCB_GREEN,
                        color: LCB_GREEN_DARK,
                        background: "white",
                      }}
                      title={language === "en" ? "English" : "Hinglish"}
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
                    canScrollRight
                      ? "opacity-100"
                      : "opacity-40 cursor-not-allowed"
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
    </section>
  );
};

export default ChatSection;
