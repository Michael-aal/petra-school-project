import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Inbox, Mail, MessageSquare, Search, Send, Users, Bell, Paperclip } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { messageApi } from "../../../../services/messageApi";
import "../page-styles/MessagesPage.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function MessagesPage() {
  const [folder, setFolder] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [conversation, setConversation] = useState([]);
  const [compose, setCompose] = useState({ recipientId: "", subject: "", body: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const [inboxResponse, sentResponse] = await Promise.all([
        messageApi.inbox(),
        messageApi.sent(),
      ]);
      setMessages(inboxResponse.messages || []);
      setSent(sentResponse.messages || []);
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (searchTerm = "") => {
    try {
      const result = await adminApi.users({ search: searchTerm, limit: 30 });
      setUsers(result.data?.users || []);
    } catch (err) {
      // Keep the page usable even if user lookup fails.
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchConversation(selectedUserId);
    } else {
      setConversation([]);
    }
  }, [selectedUserId]);

  const fetchConversation = async (recipientId) => {
    setError("");
    try {
      const response = await messageApi.conversation(recipientId);
      setConversation(response.conversation || []);
    } catch (err) {
      setError(err.message || "Unable to load conversation.");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!compose.recipientId || !compose.body.trim()) {
      setError("Please select a recipient and write a message.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await messageApi.send(compose);
      setCompose({ recipientId: compose.recipientId, subject: "", body: "" });
      await fetchMessages();
      await fetchConversation(compose.recipientId);
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const availableRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return users.filter((user) => user.id !== compose.recipientId);
    const needle = recipientSearch.toLowerCase();
    return users.filter((user) =>
      [user.fullName, user.email, user.role].some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [users, recipientSearch, compose.recipientId]);

  const messageList = folder === "sent" ? sent : messages;

  return (
    <div className="messages-page dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Messages</h1>
          <p>Manage inbox, sent mail, and school conversations in one place.</p>
        </div>
        <div className="dashboard-home-session-pill">Communication center</div>
      </section>

      <section className="dashboard-home-summary messages-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Inbox</span>
              <strong>{messages.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Inbox size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Sent</span>
              <strong>{sent.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <Send size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Active thread</span>
              <strong>{selectedUserId ? "Yes" : "None"}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-rose">
              <MessageSquare size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="messages-layout">
        <aside className="messages-panel messages-list-panel">
          <div className="messages-panel-header">
            <div>
              <h2>Mailboxes</h2>
              <p>Switch between inbox and sent items.</p>
            </div>
            <div className="messages-folder-buttons">
              <button type="button" className={folder === "inbox" ? "active" : ""} onClick={() => setFolder("inbox")}>Inbox</button>
              <button type="button" className={folder === "sent" ? "active" : ""} onClick={() => setFolder("sent")}>Sent</button>
            </div>
          </div>
          <div className="messages-search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search by sender or subject"
              value={recipientSearch}
              onChange={(event) => setRecipientSearch(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="module-empty">Loading messages...</div>
          ) : messageList.length ? (
            <div className="message-thread-list">
              {messageList.map((item) => {
                const sender = item.sender?.fullName || item.sender?.email || "Unknown";
                const recipient = item.recipient?.fullName || item.recipient?.email || "Unknown";
                const line = folder === "sent" ? `To: ${recipient}` : `From: ${sender}`;
                const otherUser = folder === "sent" ? item.recipient : item.sender;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`message-row ${selectedUserId === otherUser?.id ? "selected" : ""}`}
                    onClick={() => setSelectedUserId(otherUser?.id || "")}
                  >
                    <div>
                      <strong>{item.subject || "No subject"}</strong>
                      <span>{line}</span>
                    </div>
                    <span>{formatDate(item.sentAt)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="module-empty">No messages in this folder yet.</div>
          )}
        </aside>

        <main className="messages-panel messages-conversation-panel">
          <div className="messages-panel-header">
            <div>
              <h2>Conversation</h2>
              <p>Pick a thread or compose a new message.</p>
            </div>
            <div className="messages-thread-meta">
              <Bell size={16} />
              <span>{selectedUserId ? "Active conversation" : "No conversation selected"}</span>
            </div>
          </div>

          <div className="conversation-toolbar">
            <div className="recipient-select">
              <label htmlFor="recipient">Recipient</label>
              <select
                id="recipient"
                value={compose.recipientId}
                onChange={(event) => {
                  setCompose((current) => ({ ...current, recipientId: event.target.value }));
                  setSelectedUserId(event.target.value);
                }}
              >
                <option value="">Select recipient</option>
                {users.filter((user) => user.id !== compose.recipientId).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName || user.email} • {user.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="message-actions">
              <button type="button" onClick={() => setFolder("inbox")}>Refresh inbox</button>
              <button type="button" onClick={() => setFolder("sent")}>View sent</button>
            </div>
          </div>

          {error ? <div className="announcement-error">{error}</div> : null}

          <form className="compose-form" onSubmit={handleSend}>
            <label>
              Subject
              <input
                type="text"
                value={compose.subject}
                onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Subject or note title"
              />
            </label>
            <label>
              Message
              <textarea
                value={compose.body}
                onChange={(event) => setCompose((current) => ({ ...current, body: event.target.value }))}
                placeholder="Type your message here"
                rows={5}
              />
            </label>
            <button type="submit" className="dashboard-home-summary-action tone-blue" disabled={sending}>
              <Send size={14} />
              <span>{sending ? "Sending..." : "Send message"}</span>
            </button>
          </form>

          <div className="conversation-history">
            {selectedUserId ? (
              conversation.length ? (
                conversation.map((item) => (
                  <div key={item.id} className={`conversation-bubble ${item.senderId === selectedUserId ? "incoming" : "outgoing"}`}>
                    <div className="conversation-meta">
                      <span>{item.sender?.fullName || item.sender?.email}</span>
                      <span>{formatDate(item.sentAt)}</span>
                    </div>
                    <p>{item.body}</p>
                  </div>
                ))
              ) : (
                <div className="module-empty">Open a user thread to view messages.</div>
              )
            ) : (
              <div className="module-empty">Select a message thread or send a new message to get started.</div>
            )}
          </div>
        </main>
      </section>
    </div>
  );
}
