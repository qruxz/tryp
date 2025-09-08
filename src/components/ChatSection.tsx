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

  // 👇 Language state: only en or hinglish
  const [language, setLanguage] = useState<"en" | "hinglish">("en");

  // Follow-up suggestions
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // English questions
  const englishQuestions = [
    "What is Navyakosh Organic Fertilizer?",
    "What are the benefits of using Navyakosh?",
    "How do I apply it for Wheat, Maize, and Paddy?",
    "Is it safe for long-term soil health?",
    "Can it replace chemical fertilizers?",
    "How does it improve crop yield?",
    "Where can I buy Navyakosh?",
    "What is the cost of Navyakosh?",
    "When should I apply the fertilizer?",
    "Is it suitable for organic farming?"
  ];

  // Hinglish questions
  const hinglishQuestions = [
    "Navyakosh organic fertilizer kya hai?",
    "Navyakosh use karne ke kya benefits hain?",
    "Isko wheat, maize aur paddy par kaise lagayein?",
    "Kya yeh long-term soil health ke liye safe hai?",
    "Kya yeh chemical fertilizers ki jagah le sakta hai?",
    "Yeh crop yield kaise improve karta hai?",
    "Navyakosh kahan se kharid sakte hain?",
    "Navyakosh ki cost kya hai?",
    "Fertilizer kab lagana chahiye?",
    "Kya yeh organic farming ke liye suitable hai?"
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
    if (isNearBottom()) scrollChatToBottom();
  }, [messages]);

  // ✅ Suggestions filter (based only on selected language)
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentQuestions =
      language === "en" ? englishQuestions : hinglishQuestions;

    const filtered = currentQuestions
      .filter((q) => q.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 5);

    setFollowUpSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, language]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSendMessage(suggestion);
  };

  const predefinedQuestions =
    language === "en"
      ? englishQuestions.slice(0, 8)
      : hinglishQuestions.slice(0, 8);

  // ✅ Server check
  useEffect(() => {
    const checkServerStatus = async () => {
      const isOnline = await checkHealth();
      setIsServerOnline(isOnline);
      if (!isOnline) {
        toast.error("AI server is offline. Please try again later.");
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

  const scrollChips = (dir: "left" | "right") => {
    const el = chipsRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    if (!isServerOnline) {
      toast.error("AI server is offline. Please try again later.");
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
        toast.error("Failed to get response. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-4 sm:px-6 pb-12 font-poppins">
      <div className="max-w-5xl mx-auto">
        <div
          className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[80vh] border-2"
          style={{ borderColor: LCB_GREEN }}
        >
          {/* Header */}
          <div
            className="p-4 sm:p-6 text-white border-b flex justify-between items-center"
            style={{ backgroundColor: LCB_GREEN }}
          >
            <h2 className="text-lg sm:text-2xl font-bold">LCB ChatBot 🌱</h2>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 rounded ${
                  language === "en"
                    ? "bg-white text-green-700 font-bold"
                    : "bg-transparent text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hinglish")}
                className={`px-2 py-1 rounded ${
                  language === "hinglish"
                    ? "bg-white text-green-700 font-bold"
                    : "bg-transparent text-white"
                }`}
              >
                HINGLISH
              </button>
            </div>
          </div>

          {/* Chat */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
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
                  {language === "en" ? "Typing..." : "Typing... (Hinglish)"}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white" style={{ borderColor: LCB_GREEN }}>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Type your question..."
                    : "Apna question type karo..."
                }
                className="flex-1 bg-white rounded-xl font-poppins"
                style={{ borderColor: LCB_GREEN, color: "#166534" }}
                disabled={isLoading || !isServerOnline}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !isServerOnline}
                className="rounded-xl px-4 sm:px-6 text-white font-bold"
                style={{ backgroundColor: LCB_GREEN }}
              >
                <ArrowRight size={18} />
              </Button>
            </div>

            {/* Chips */}
            <div className="relative">
              <div
                ref={chipsRef}
                onScroll={updateChipsScrollState}
                className="flex gap-2 overflow-x-auto snap-x snap-mandatory pr-2 pl-2 sm:pl-8 sm:pr-8"
              >
                {predefinedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading || !isServerOnline}
                    className="shrink-0 snap-start rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 border hover:shadow"
                    style={{
                      borderColor: LCB_GREEN,
                      color: LCB_GREEN_DARK,
                      background: "white",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
