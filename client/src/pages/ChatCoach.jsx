import { useEffect, useRef, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { apiFetch, SCRIBE_API_BASE_URL } from "../lib/api.js";

function ChatCoach() {
  const { summary, series, userContext, personas, currentPersonaId, setCurrentPersonaId } =
    useAppContext();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help you interpret your wearable data and suggest small, realistic next steps. What would you like to focus on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingOptions, setMeetingOptions] = useState([]);
  const [meetingId, setMeetingId] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState("");
  const [activeContext, setActiveContext] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadMeetings() {
    setMeetingLoading(true);
    setMeetingError("");
    try {
      const response = await fetch(`${SCRIBE_API_BASE_URL}/api/meetings`);
      if (!response.ok) {
        throw new Error("Unable to load meetings.");
      }
      const meetings = await response.json();
      const options = (meetings || []).map((meeting) => ({
        id: meeting.id,
        label: `${meeting.patientDisplayName || "Meeting"} - ${new Date(
          meeting.createdAt
        ).toLocaleDateString()}`,
      }));
      setMeetingOptions(options);
      if (options.length && !meetingId) {
        setMeetingId(options[0].id);
      }
    } catch (error) {
      setMeetingError(error.message || "Unable to load meetings.");
    } finally {
      setMeetingLoading(false);
    }
  }

  async function importMeeting() {
    if (!meetingId) {
      return;
    }
    setMeetingLoading(true);
    setMeetingError("");
    try {
      const response = await fetch(
        `${SCRIBE_API_BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}`
      );
      if (!response.ok) {
        throw new Error("Unable to import meeting.");
      }
      const detail = await response.json();
      setActiveContext(detail);
      setShowImporter(false);
    } catch (error) {
      setMeetingError(error.message || "Unable to import meeting.");
    } finally {
      setMeetingLoading(false);
    }
  }

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
      const meetingPayload = activeContext
        ? {
            id: activeContext.id,
            patientDisplayName: activeContext.patientDisplayName,
            createdAt: activeContext.createdAt,
            transcript: activeContext.transcript
              ? String(activeContext.transcript).slice(0, 2000)
              : null,
            plan: activeContext.plan ? JSON.parse(JSON.stringify(activeContext.plan)) : null,
          }
        : null;
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          metrics: summary || {},
          user_context: userContext,
          query: userMessage.content,
          series,
          meeting_context: meetingPayload,
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
        action={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 md:flex">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Persona</span>
              <select
                value={currentPersonaId || ""}
                onChange={(event) => setCurrentPersonaId(event.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name}
                  </option>
                ))}
              </select>
            </div>
            {activeContext ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                onClick={() => setActiveContext(null)}
              >
                Clear context
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-glow"
              onClick={() => {
                setShowImporter((prev) => !prev);
                if (!meetingOptions.length) {
                  loadMeetings();
                }
              }}
            >
              Import meeting
            </button>
          </div>
        }
      />

      {showImporter ? (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={meetingId}
              onChange={(event) => setMeetingId(event.target.value)}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
              disabled={meetingLoading || !meetingOptions.length}
            >
              {meetingOptions.length ? (
                meetingOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))
              ) : (
                <option value="">No meetings found</option>
              )}
            </select>
            <button
              type="button"
              onClick={importMeeting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-glow"
              disabled={meetingLoading || !meetingId}
            >
              {meetingLoading ? "Loading..." : "Use meeting"}
            </button>
          </div>
          {meetingError ? <p className="mt-3 text-xs text-rose-500">{meetingError}</p> : null}
        </div>
      ) : null}

      {activeContext ? (
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Active context: {activeContext.patientDisplayName || "Imported meeting"} on{" "}
              {activeContext.createdAt
                ? new Date(activeContext.createdAt).toLocaleDateString()
                : "unknown date"}
              .
            </span>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700"
              onClick={() => setShowPreview((prev) => !prev)}
            >
              {showPreview ? "Hide preview" : "Preview payload"}
            </button>
          </div>
        </div>
      ) : null}

      {activeContext && showPreview ? (
        <div className="glass-card rounded-2xl p-4 text-xs text-slate-600">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Meeting context payload
          </p>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-white/90 p-3 text-[11px] text-slate-600">
            {JSON.stringify(
              {
                id: activeContext.id,
                patientDisplayName: activeContext.patientDisplayName,
                createdAt: activeContext.createdAt,
                transcript: activeContext.transcript
                  ? String(activeContext.transcript).slice(0, 2000)
                  : null,
                plan: activeContext.plan ? JSON.parse(JSON.stringify(activeContext.plan)) : null,
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : null}

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
