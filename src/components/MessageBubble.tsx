import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date | string; // safer: accept both
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const time =
    message.timestamp instanceof Date
      ? message.timestamp
      : new Date(message.timestamp);

  return (
    <div className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow ${
          message.isUser
            ? "bg-emerald-500 text-white rounded-br-sm" // user bubble (right)
            : "bg-gray-100 text-gray-900 rounded-bl-sm" // ai bubble (left)
        }`}
      >
        {/* Markdown text */}
        <div className="prose-sm max-w-none">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 text-right ${
            message.isUser ? "text-emerald-200" : "text-gray-500"
          }`}
        >
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
