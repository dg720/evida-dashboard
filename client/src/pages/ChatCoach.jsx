import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
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
        "Hi! I analyse your recent wearable data and goals to explain trends and suggest realistic next steps. What would you like to focus on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingOptions, setMeetingOptions] = useState([]);
  const [meetingId, setMeetingId] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState("");
  const [activeContext, setActiveContext] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [contextVisibility, setContextVisibility] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!meetingOptions.length && !meetingLoading) {
      loadMeetings();
    }
  }, [meetingOptions.length, meetingLoading]);

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
    } catch (error) {
      setMeetingError(error.message || "Unable to import meeting.");
    } finally {
      setMeetingLoading(false);
    }
  }

  function renderAssistantMessage(content) {
    return (
      <ReactMarkdown
        className="space-y-3 text-sm text-slate-700"
        skipHtml
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold text-ink">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-ink">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="space-y-2 pl-4">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal space-y-4 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="text-slate-700">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  function buildCoachContent(response) {
    if (!response || typeof response !== "object") {
      return {
        answer: "No response yet.",
        context: { reasoning: [], recommendations: [], followUps: [] },
      };
    }
    const answer = response.answer || response.message || "";
    return {
      answer: String(answer || "").trim() || "No response yet.",
      context: {
        reasoning: Array.isArray(response.reasoning_trace) ? response.reasoning_trace : [],
        recommendations: Array.isArray(response.recommendations) ? response.recommendations : [],
        followUps: Array.isArray(response.follow_ups) ? response.follow_ups : [],
      },
    };
  }

  function renderContextSection({ reasoning, recommendations, followUps }) {
    const hasReasoning = reasoning.some((line) => String(line).trim());
    const hasRecommendations = recommendations.some((rec) => rec && typeof rec === "object");
    const hasFollowUps = followUps.some((line) => String(line).trim());

    return (
      <div className="mt-3 space-y-4 border-t border-slate-200/70 pt-3 text-sm text-slate-600">
        {hasReasoning ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              What I'm seeing
            </p>
            <ul className="space-y-1 pl-4 text-sm text-slate-600">
              {reasoning
                .filter((line) => String(line).trim())
                .map((line, index) => (
                  <li key={`reason-${index}`} className="list-disc">
                    {String(line).trim()}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {hasRecommendations ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Next steps (SMART)
            </p>
            <div className="space-y-3">
              {recommendations
                .filter((rec) => rec && typeof rec === "object")
                .map((rec, index) => {
                  const action = String(rec.action || "").trim();
                  const why = String(rec.why || "").trim();
                  const timeframe = String(rec.timeframe || "").trim();
                  const success = String(rec.success_metric || "").trim();
                  const priority = String(rec.priority || "").trim();
                  return (
                    <div key={`rec-${index}`} className="space-y-1">
                      {action ? (
                        <p className="text-sm font-semibold text-ink">{action}</p>
                      ) : null}
                      {why ? <p className="text-xs text-slate-500">Why: {why}</p> : null}
                      {timeframe ? (
                        <p className="text-xs text-slate-500">Timeframe: {timeframe}</p>
                      ) : null}
                      {success ? (
                        <p className="text-xs text-slate-500">Success metric: {success}</p>
                      ) : null}
                      {priority ? (
                        <p className="text-xs text-slate-500">Priority: {priority}</p>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}

        {hasFollowUps ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Follow-up questions
            </p>
            <ul className="space-y-1 pl-4 text-sm text-slate-600">
              {followUps
                .filter((line) => String(line).trim())
                .map((line, index) => (
                  <li key={`follow-${index}`} className="list-disc">
                    {String(line).trim()}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
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
      const coachContent = buildCoachContent(response);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: coachContent.answer, context: coachContent.context },
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
      <div className="mb-6 space-y-3">
        <div>
          <p className="font-display text-2xl font-semibold text-ink">Health Coach</p>
          <p className="text-sm text-slate-500">
            Uses your wearable data and linked coaching sessions for context.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
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
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                Meeting
              </span>
              <select
                value={meetingId}
                onChange={(event) => setMeetingId(event.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
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
              onClick={importMeeting}
              disabled={meetingLoading || !meetingId}
            >
              {meetingLoading ? "Loading..." : "Import meeting"}
            </button>
          </div>
        </div>
      </div>

      {meetingError ? <p className="text-xs text-rose-500">{meetingError}</p> : null}

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
                {message.role === "assistant" ? (
                  <>
                    {renderAssistantMessage(message.content)}
                    {message.context &&
                    (message.context.reasoning?.length ||
                      message.context.recommendations?.length ||
                      message.context.followUps?.length) ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500"
                          onClick={() =>
                            setContextVisibility((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                        >
                          {contextVisibility[index] ? "Hide context" : "Context"}
                        </button>
                        {contextVisibility[index]
                          ? renderContextSection(message.context)
                          : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  message.content
                )}
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
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
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
