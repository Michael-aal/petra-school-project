import { useState, useContext, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  CreditCard,
  GraduationCap,
  Calendar,
  BookOpen,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { aiApi } from "../../../services/aiApi";
import { normalizeRole } from "../../../utils/userProfile";
import "../../../Styles/DashBoardLayout/AskNuvora.css";

const ROLE_SUGGESTIONS = {
  principal: [
    { label: "Attendance Overview", text: "How is attendance this week?" },
    { label: "School Snapshot", text: "Give me a high-level overview of our school." },
    { label: "Fee Collection", text: "How much in school fees is currently outstanding?" },
  ],
  super_admin: [
    { label: "School Overview", text: "Give me a high-level overview of our school." },
    { label: "Attendance Status", text: "How is attendance this week?" },
    { label: "Financial Summary", text: "What is the current fee collection and outstanding balance?" },
  ],
  teacher: [
    { label: "Class Attendance", text: "How is attendance for my assigned class this week?" },
    { label: "Low Attendance Alert", text: "Which students in my class have low attendance?" },
    { label: "Academic Performance", text: "What are the latest assessment results?" },
  ],
  parent: [
    { label: "Child Attendance", text: "How has my child's attendance changed this term?" },
    { label: "Child Results", text: "What are my child's results for this term?" },
    { label: "Outstanding Fees", text: "What is my outstanding fee balance?" },
  ],
  guardian: [
    { label: "Child Attendance", text: "How has my child's attendance changed this term?" },
    { label: "Academic Results", text: "What are my child's results for this term?" },
    { label: "Fee Status", text: "What is my outstanding fee balance?" },
  ],
  student: [
    { label: "My Term Results", text: "What are my results for this term?" },
    { label: "My Attendance", text: "How has my attendance been this term?" },
    { label: "My Fee Status", text: "What is my outstanding fee balance?" },
  ],
};

export default function AskNuvoraPage() {
  const { userInfo } = useContext(UserContext);
  const role = normalizeRole(userInfo?.role || "parent");
  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.parent;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("nuvora_ai_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("nuvora_ai_chat_history", JSON.stringify(messages));
    } catch {
      // ignore
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setError(null);

    const userMessage = { role: "user", content: query, timestamp: new Date().toISOString() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.query({
        message: query,
        conversationHistory: historyPayload,
      });

      const botMessage = {
        role: "assistant",
        content: res.answer || "Here is the information from your school records.",
        data: res.data || null,
        toolsUsed: res.toolsUsed || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(err.message || "Failed to get an answer from Nuvora AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setError(null);
    try {
      sessionStorage.removeItem("nuvora_ai_chat_history");
    } catch {}
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="ask-nuvora-page">
      {/* Header */}
      <header className="ask-nuvora-header">
        <div className="ask-nuvora-header-left">
          <div className="ask-nuvora-icon-badge">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="ask-nuvora-title">
              Ask Nuvora
              <span className="ask-nuvora-tag">{role}</span>
            </h1>
            <p className="ask-nuvora-subtitle">
              Secure AI copilot for your authorized school data
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="ask-nuvora-header-actions">
            <button
              type="button"
              className="ask-nuvora-btn-ghost"
              onClick={handleClearHistory}
              title="Clear conversation"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        )}
      </header>

      {/* Messages Container */}
      <div className="ask-nuvora-messages-container">
        {messages.length === 0 ? (
          <div className="ask-nuvora-empty-state">
            <div className="ask-nuvora-empty-icon">
              <Sparkles size={36} />
            </div>
            <h2 className="ask-nuvora-empty-title">What would you like to know?</h2>
            <p className="ask-nuvora-empty-desc">
              Ask questions in plain language about attendance, academic results, school operations,
              or fee summaries. Nuvora AI only accesses data you are authorized to see.
            </p>

            <div className="ask-nuvora-suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ask-nuvora-suggestion-btn"
                  onClick={() => handleSuggestionClick(s.text)}
                >
                  <span>{s.text}</span>
                  <Sparkles size={14} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`ask-nuvora-msg-row ${msg.role === "user" ? "user" : "ai"}`}>
              <div className={`ask-nuvora-avatar ${msg.role === "user" ? "user" : "ai"}`}>
                {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="ask-nuvora-bubble">
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Structured Data Highlights */}
                {msg.data && (
                  <div className="ask-nuvora-data-card">
                    <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Authoritative Verified Data
                    </div>
                    <div className="ask-nuvora-data-grid">
                      {msg.data.totalStudents !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Students</div>
                          <div className="ask-nuvora-data-val">{msg.data.totalStudents}</div>
                        </div>
                      )}
                      {msg.data.totalTeachers !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Teachers</div>
                          <div className="ask-nuvora-data-val">{msg.data.totalTeachers}</div>
                        </div>
                      )}
                      {msg.data.attendanceRate !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Attendance</div>
                          <div className="ask-nuvora-data-val">{msg.data.attendanceRate}%</div>
                        </div>
                      )}
                      {msg.data.percentage !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Attendance Rate</div>
                          <div className="ask-nuvora-data-val">{msg.data.percentage}%</div>
                        </div>
                      )}
                      {msg.data.averageScore !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Average Score</div>
                          <div className="ask-nuvora-data-val">{msg.data.averageScore}%</div>
                        </div>
                      )}
                      {msg.data.outstandingBalance !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Outstanding Balance</div>
                          <div className="ask-nuvora-data-val">
                            ₦{Number(msg.data.outstandingBalance || 0).toLocaleString()}
                          </div>
                        </div>
                      )}
                      {msg.data.totalPaid !== undefined && (
                        <div className="ask-nuvora-data-item">
                          <div className="ask-nuvora-data-label">Total Paid</div>
                          <div className="ask-nuvora-data-val">
                            ₦{Number(msg.data.totalPaid || 0).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, idx)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy answer</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="ask-nuvora-msg-row ai">
            <div className="ask-nuvora-avatar ai">
              <Bot size={18} />
            </div>
            <div className="ask-nuvora-bubble ask-nuvora-loading">
              <span>Checking school records</span>
              <div className="ask-nuvora-typing-dots">
                <div className="ask-nuvora-typing-dot" />
                <div className="ask-nuvora-typing-dot" />
                <div className="ask-nuvora-typing-dot" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="ask-nuvora-error-banner">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="ask-nuvora-input-card">
        <form onSubmit={handleSubmit} className="ask-nuvora-form">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about attendance, results, fees, or school overview..."
            className="ask-nuvora-textarea"
            rows={1}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ask-nuvora-send-btn"
            aria-label="Send query"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
