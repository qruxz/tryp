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

  // 👇 Language state (English | Hinglish only)
  const [language, setLanguage] = useState<"en" | "hinglish">("en");

  // 👇 Follow-up suggestions state
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
    "How does it reduce irrigation?"
  ];

  // Hinglish follow-up questions
  const hinglishQuestions = [
    "Navyakosh kya hai?",
    "Iska use karne ke fayde kya hain?",
    "Wheat, Maize aur Paddy me kaise lagana hai?",
    "Kya yeh soil health ke liye safe hai?",
    "Kya yeh chemical fertilizers replace kar sakta hai?",
    "Crop yield kaise improve hota hai?",
    "Mujhe kya results milenge?",
    "Kaunse crops me use ho sakta hai?",
    "Navyakosh kahan milega?",
    "Irrigation kaise kam hota hai?"
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

  // 👇 Filter suggestions based on input + language
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setFollowUpSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentQuestions = language === "en" ? englishQuestions : hinglishQuestions;
    const filtered = currentQuestions
      .filter((q) => q.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 5);

    setFollowUpSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, language]);

  // Suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSendMessage(suggestion);
  };

  const predefinedQuestions =
    language === "en" ? englishQuestions.slice(0, 10) : hinglishQuestions.slice(0, 10);

  // Server health check
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
                    ? "Ask about Navyakosh"
                    : "Navyakosh ke baare me puchho"}
                </p>
              </div>
            </div>

            {/* Language Toggle */}
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
                HIN
              </button>
            </div>
          </div>

          {/* Messages */}
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
                  {language === "en" ? "Typing..." : "Typing kar rahe hain..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Chips */}
          <div
            className="p-4 sm:p-6 bg-white border-t relative"
            style={{ borderColor: LCB_GREEN }}
          >
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Type your question..."
                    : "Apna sawal type karo..."
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
                {language === "en" ? "Try asking:" : "Sawal poochho:"}
              </p>

              <div className="flex gap-2 overflow-x-auto">
                {predefinedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="shrink-0 rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 border"
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
