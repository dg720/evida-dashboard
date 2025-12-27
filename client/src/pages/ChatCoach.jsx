import { useEffect, useRef, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { apiFetch } from "../lib/api.js";

function ChatCoach() {
  const { summary, series, userContext } = useAppContext();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help you interpret your wearable data and suggest small, realistic next steps. What would you like to focus on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function renderInlineBold(text) {
    const segments = text.split("**");
    return segments.map((segment, index) =>
      index % 2 === 1 ? (
        <strong key={`bold-${index}`} className="font-semibold text-ink">
          {segment}
        </strong>
      ) : (
        <span key={`text-${index}`}>{segment}</span>
      )
    );
  }

  function renderAssistantMessage(content) {
    const blocks = content.split(/\n\n+/).filter(Boolean);
    return blocks.map((block, blockIndex) => {
      const lines = block.split("\n").filter(Boolean);
      const hasHeading = lines[0]?.includes("**");
      const listLines = hasHeading ? lines.slice(1) : lines;
      const listOnly = listLines.length > 0 && listLines.every((line) => line.trim().startsWith("- "));
      const isList = lines.every((line) => line.trim().startsWith("- "));
      if (isList || listOnly) {
        return (
          <div key={`list-wrap-${blockIndex}`} className="space-y-2">
            {hasHeading ? (
              <p className="text-sm font-semibold text-ink">{renderInlineBold(lines[0])}</p>
            ) : null}
            <ul className="space-y-1 pl-4 text-sm text-slate-600">
              {listLines.map((line, lineIndex) => (
                <li key={`li-${blockIndex}-${lineIndex}`} className="list-disc">
                  {renderInlineBold(line.replace(/^\s*-\s*/, ""))}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      if (lines.length === 1 && /\w+:$/.test(lines[0])) {
        return (
          <p key={`heading-${blockIndex}`} className="text-sm font-semibold text-ink">
            {lines[0]}
          </p>
        );
      }
      return (
        <p key={`para-${blockIndex}`} className="text-sm leading-relaxed text-slate-700">
          {renderInlineBold(lines.join(" "))}
        </p>
      );
    });
  }

  async function handleSend() {
    if (!input.trim()) {
      return;
    }
    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          metrics: summary || {},
          user_context: userContext,
          query: userMessage.content,
          series,
        }),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.message || "No response yet." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't reach the coach service right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Chat Coach"
        subtitle="Ask about your sleep, training, stress, or recovery."
      />

      <div className="glass-card flex h-[60vh] flex-col rounded-2xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "flex",
                message.role === "assistant" ? "justify-start" : "justify-end",
              ].join(" ")}
            >
              <div
                className={[
                  "w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  message.role === "assistant"
                    ? "border border-slate-200/70 bg-white/90 text-slate-700"
                    : "bg-accent text-white",
                ].join(" ")}
              >
                {message.role === "assistant"
                  ? renderAssistantMessage(message.content)
                  : message.content}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="w-fit max-w-[70%] rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-500">
                Coach is typing...
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-slate-200/60 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your sleep or fitness"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleSend}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500">
        Disclaimer: The Health Coach is informational and not a medical device. Consult a healthcare
        professional for persistent or serious issues.
      </div>
    </div>
  );
}

export default ChatCoach;
