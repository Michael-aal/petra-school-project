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
  History,
  Plus,
  X,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { aiApi } from "../../../services/aiApi";
import { normalizeRole } from "../../../utils/userProfile";
import "../../../Styles/DashBoardLayout/AskNuvora.css";

const ROLE_SUGGESTIONS = {
  principal: [
    "How is attendance this week?",
    "Give me a high-level overview of our school.",
    "How much in school fees is currently outstanding?",
  ],
  super_admin: [
    "Give me a high-level overview of our school.",
    "How is attendance this week?",
    "What is the current fee collection and outstanding balance?",
  ],
  teacher: [
    "How is attendance for my assigned class this week?",
    "Which students in my class have low attendance?",
    "What are the latest assessment results?",
  ],
  parent: [
    "How has my child's attendance changed this term?",
    "What are my child's results for this term?",
    "What is my outstanding fee balance?",
  ],
  guardian: [
    "How has my child's attendance changed this term?",
    "What are my child's results for this term?",
    "What is my outstanding fee balance?",
  ],
  student: [
    "What are my results for this term?",
    "How has my attendance been this term?",
    "What is my outstanding fee balance?",
  ],
};

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

export default function AskNuvoraPage() {
  const { userInfo } = useContext(UserContext);
  const role = normalizeRole(userInfo?.role || "parent");
  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.parent;
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const loadChats = async () => {
    setHistoryLoading(true);
    try {
      const res = await aiApi.listChats();
      setChats(res.chats || []);
    } catch (err) {
      setError(err.message || "Unable to load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [userInfo?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setHistoryOpen(false);
  };

  const openChat = async (id) => {
    if (!id || loading) return;
    setError(null);
    try {
      const res = await aiApi.getChat(id);
      setConversationId(res.chat.id);
      setMessages((res.chat.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        data: m.data || null,
        timestamp: m.createdAt,
      })));
      setHistoryOpen(false);
    } catch (err) {
      setError(err.message || "Unable to open this chat.");
    }
  };

  const handleDeleteChat = async (id, event) => {
    event?.stopPropagation();
    if (!window.confirm("Permanently delete this Nuvora chat? This cannot be undone.")) return;
    try {
      await aiApi.deleteChat(id);
      if (conversationId === id) handleNewChat();
      await loadChats();
    } catch (err) {
      setError(err.message || "Unable to delete this chat.");
    }
  };

  const handleDeleteAll = async () => {
    if (!chats.length) return;
    if (!window.confirm("Permanently delete ALL your Nuvora chats? This cannot be undone.")) return;
    try {
      await aiApi.deleteAllChats();
      handleNewChat();
      setChats([]);
      setHistoryOpen(false);
    } catch (err) {
      setError(err.message || "Unable to delete all chats.");
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    setInput("");
    setError(null);
    const userMessage = { role: "user", content: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const res = await aiApi.query({ message: query, conversationId: conversationId || undefined });
      if (res.conversationId) setConversationId(res.conversationId);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.answer || "Here is the information from your school records.",
        data: res.data || null,
        toolsUsed: res.toolsUsed || [],
        timestamp: new Date().toISOString(),
      }]);
      await loadChats();
    } catch (err) {
      setError(err.message || "Failed to get an answer from Nuvora. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setError("Unable to copy the answer. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="ask-nuvora-page">
      <div className="ask-nuvora-context">
        <p className="ask-nuvora-context-label">Nuvora assistant</p>
        <h1 className="ask-nuvora-context-title">Get clarity from your school data.</h1>
      </div>

      <header className="ask-nuvora-header">
        <div className="ask-nuvora-header-left">
          <div className="ask-nuvora-icon-badge"><Sparkles size={22} /></div>
          <div>
            <h1 className="ask-nuvora-title">Nuvora <span className="ask-nuvora-tag">{role}</span></h1>
            <p className="ask-nuvora-subtitle">Secure AI copilot for your authorized school data</p>
          </div>
        </div>
        <div className="ask-nuvora-header-actions">
          <button type="button" className="ask-nuvora-btn-ghost" onClick={() => setHistoryOpen((open) => !open)}>
            {historyOpen ? <X size={16} /> : <History size={16} />} History
          </button>
          <button type="button" className="ask-nuvora-btn-ghost" onClick={handleNewChat}>
            <Plus size={16} /> New chat
          </button>
        </div>
      </header>

      {historyOpen && (
        <aside className="ask-nuvora-history-panel">
          <div className="ask-nuvora-history-head">
            <div>
              <strong>Chat history</strong>
              <span>{chats.length} saved {chats.length === 1 ? "chat" : "chats"}</span>
            </div>
            {chats.length > 0 && (
              <button type="button" className="ask-nuvora-delete-all" onClick={handleDeleteAll}>
                <Trash2 size={14} /> Delete all
              </button>
            )}
          </div>
          <div className="ask-nuvora-history-list">
            {historyLoading ? <div className="ask-nuvora-history-empty">Loading saved chats…</div> : chats.length === 0 ? (
              <div className="ask-nuvora-history-empty">No saved chats yet. Start a conversation with Nuvora.</div>
            ) : chats.map((chat) => (
              <div key={chat.id} className={`ask-nuvora-history-item ${conversationId === chat.id ? "active" : ""}`} onClick={() => openChat(chat.id)}>
                <div className="ask-nuvora-history-main">
                  <span className="ask-nuvora-history-title">{chat.title || "New chat"}</span>
                  <span className="ask-nuvora-history-date">{formatDate(chat.updatedAt)}</span>
                </div>
                <button type="button" className="ask-nuvora-history-delete" onClick={(event) => handleDeleteChat(chat.id, event)} aria-label="Permanently delete chat">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div className="ask-nuvora-messages-container">
        {messages.length === 0 ? (
          <div className="ask-nuvora-empty-state">
            <div className="ask-nuvora-empty-icon"><Sparkles size={36} /></div>
            <h2 className="ask-nuvora-empty-title">What would you like to know?</h2>
            <p className="ask-nuvora-empty-desc">Your Nuvora conversations are saved to your account. You can reopen or permanently delete them from History.</p>
            <div className="ask-nuvora-suggestions">
              {suggestions.map((text) => (
                <button key={text} type="button" className="ask-nuvora-suggestion-btn" onClick={() => setInput(text)}>
                  <span>{text}</span><Sparkles size={14} />
                </button>
              ))}
            </div>
          </div>
        ) : messages.map((msg, idx) => (
          <div key={`${msg.timestamp || "message"}-${idx}`} className={`ask-nuvora-msg-row ${msg.role === "user" ? "user" : "ai"}`}>
            <div className={`ask-nuvora-avatar ${msg.role === "user" ? "user" : "ai"}`}>{msg.role === "user" ? <User size={18} /> : <Bot size={18} />}</div>
            <div className="ask-nuvora-bubble">
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.data && (
                <div className="ask-nuvora-data-card">
                  <div className="ask-nuvora-data-label"><CheckCircle2 size={14} /> Authoritative Verified Data</div>
                  <div className="ask-nuvora-data-grid">
                    {msg.data.totalStudents !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Students</div><div className="ask-nuvora-data-val">{msg.data.totalStudents}</div></div>}
                    {msg.data.totalTeachers !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Teachers</div><div className="ask-nuvora-data-val">{msg.data.totalTeachers}</div></div>}
                    {msg.data.totalClasses !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Classes</div><div className="ask-nuvora-data-val">{msg.data.totalClasses}</div></div>}
                    {msg.data.attendanceRate !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Attendance</div><div className="ask-nuvora-data-val">{msg.data.attendanceRate}%</div></div>}
                    {msg.data.percentage !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Attendance Rate</div><div className="ask-nuvora-data-val">{msg.data.percentage}%</div></div>}
                    {msg.data.averageScore !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Average Score</div><div className="ask-nuvora-data-val">{msg.data.averageScore}%</div></div>}
                    {msg.data.outstandingBalance !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Outstanding Balance</div><div className="ask-nuvora-data-val">₦{Number(msg.data.outstandingBalance || 0).toLocaleString()}</div></div>}
                    {msg.data.totalPaid !== undefined && <div className="ask-nuvora-data-item"><div className="ask-nuvora-data-label">Total Paid</div><div className="ask-nuvora-data-val">₦{Number(msg.data.totalPaid || 0).toLocaleString()}</div></div>}
                  </div>
                </div>
              )}
              {msg.role === "assistant" && (
                <button type="button" onClick={() => handleCopy(msg.content, idx)} className={`ask-nuvora-copy-btn ${copiedIndex === idx ? "copied" : ""}`}>
                  {copiedIndex === idx ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && <div className="ask-nuvora-msg-row ai"><div className="ask-nuvora-avatar ai"><Bot size={18} /></div><div className="ask-nuvora-bubble ask-nuvora-loading"><span>Nuvora is checking school records</span><div className="ask-nuvora-typing-dots"><div className="ask-nuvora-typing-dot" /><div className="ask-nuvora-typing-dot" /><div className="ask-nuvora-typing-dot" /></div></div></div>}
        {error && <div className="ask-nuvora-error-banner"><div className="flex items-center gap-2"><AlertCircle size={16} /><span>{error}</span></div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="ask-nuvora-input-card">
        <form onSubmit={handleSubmit} className="ask-nuvora-form">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask Nuvora about attendance, results, fees, or school activity..." className="ask-nuvora-textarea" rows={1} disabled={loading} />
          <button type="submit" disabled={!input.trim() || loading} className="ask-nuvora-send-btn" aria-label="Send query"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}
