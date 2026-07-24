import '../page-styles/SupportPage.css';
 import { useState } from "react";
import { 
  HelpCircle, MessageSquare, Mail, Phone, BookOpen, ChevronDown, 
  Send, AlertCircle, CheckCircle2, Clock, Search, LifeBuoy 
} from "lucide-react";

// Mock FAQ Data
const faqData = [
  {
    id: 1,
    question: "How do I add a new student to the system?",
    answer: "Navigate to the 'Students' module from the sidebar, click the '+ Add Student' button at the top right, fill in the required details (Name, Class, Parent Info), and click 'Save'. The student will instantly appear in your dashboard."
  },
  {
    id: 2,
    question: "How can I generate end-of-term report cards?",
    answer: "Go to 'Examination' > 'Report Cards'. Select the current academic session and term, choose the target class, and click 'Generate Reports'. You can then download them as PDF or print them directly."
  },
  {
    id: 3,
    question: "What happens if a parent's payment fails?",
    answer: "If a payment fails, the student's fee status will remain 'Unpaid'. You can view the failed transaction in 'Finance' > 'Payments'. The parent can retry the payment, or you can manually update the status if they paid via bank transfer."
  },
  {
    id: 4,
    question: "How do I change the active academic session?",
    answer: "Go to 'Settings' > 'Academic Defaults'. Here you can update the Active Session and Active Term. Remember to click 'Save Academic Defaults' at the bottom of the card."
  },
];

// Mock Recent Tickets Data
const initialTickets = [
  { id: 1, subject: "Cannot upload school logo", category: "Technical", priority: "High", status: "In Progress", date: "2 days ago" },
  { id: 2, subject: "Question about bulk student import", category: "General", priority: "Low", status: "Resolved", date: "1 week ago" },
];

export default function  SupportPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [tickets, setTickets] = useState(initialTickets);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "General",
    priority: "Medium",
    message: "",
  });

  const handleFaqToggle = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTicketForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) return;

    const newTicket = {
      id: Date.now(),
      subject: ticketForm.subject,
      category: ticketForm.category,
      priority: ticketForm.priority,
      status: "Open",
      date: "Just now",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setTicketForm({ subject: "", category: "General", priority: "Medium", message: "" });
    setSuccessMsg("Ticket submitted successfully! We will get back to you soon.");
    
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="support-page">
      {/* Header */}
      <div className="support-header">
        <div className="support-header-left">
          <div className="support-icon-box">
            <LifeBuoy size={24} />
          </div>
          <div>
            <h2>Help & Support</h2>
            <p>Find answers, submit a ticket, or contact our team directly.</p>
          </div>
        </div>
      </div>

      {/* Quick Contact Cards */}
      <div className="support-quick-links">
        <div className="quick-link-card">
          <BookOpen size={20} className="ql-icon blue" />
          <div>
            <h4>Documentation</h4>
            <p>Read our comprehensive guides.</p>
          </div>
        </div>
        <div className="quick-link-card">
          <Mail size={20} className="ql-icon green" />
          <div>
            <h4>Email Support</h4>
            <p>support@acceede.com</p>
          </div>
        </div>
        <div className="quick-link-card">
          <Phone size={20} className="ql-icon orange" />
          <div>
            <h4>Call Us</h4>
            <p>+234 800 000 0000</p>
          </div>
        </div>
      </div>

      <div className="support-grid">
        {/* Left Column: FAQ & Ticket Form */}
        <div className="support-main-col">
          
          {/* FAQ Section */}
          <section className="support-card">
            <div className="card-header">
              <h3><HelpCircle size={18} /> Frequently Asked Questions</h3>
            </div>
            <div className="faq-list">
              {faqData.map((faq) => (
                <div key={faq.id} className={`faq-item ${activeFaq === faq.id ? "active" : ""}`}>
                  <button className="faq-question" onClick={() => handleFaqToggle(faq.id)}>
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className={`faq-chevron ${activeFaq === faq.id ? "rotated" : ""}`} />
                  </button>
                  {activeFaq === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Submit Ticket Section */}
          <section className="support-card">
            <div className="card-header">
              <h3><MessageSquare size={18} /> Submit a Support Ticket</h3>
            </div>
            
            {successMsg && (
              <div className="success-banner">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            <form className="ticket-form" onSubmit={handleSubmitTicket}>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    name="subject" 
                    placeholder="Brief description of the issue" 
                    value={ticketForm.subject} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={ticketForm.category} onChange={handleFormChange}>
                    <option value="General">General Inquiry</option>
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing & Payments</option>
                    <option value="Feature">Feature Request</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={ticketForm.priority} onChange={handleFormChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 2}}>
                  <label>Describe the issue</label>
                  <textarea 
                    name="message" 
                    rows={4} 
                    placeholder="Please provide as much detail as possible..." 
                    value={ticketForm.message} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="submit-ticket-btn">
                <Send size={16} /> Submit Ticket
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Recent Tickets */}
        <div className="support-side-col">
          <section className="support-card tickets-card">
            <div className="card-header">
              <h3><Clock size={18} /> Recent Tickets</h3>
            </div>
            <div className="tickets-list">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="ticket-item">
                    <div className="ticket-top">
                      <span className="ticket-subject">{ticket.subject}</span>
                      <span className={`ticket-status status-${ticket.status.toLowerCase().replace(" ", "-")}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="ticket-bottom">
                      <span className="ticket-meta">{ticket.category} • {ticket.priority}</span>
                      <span className="ticket-date">{ticket.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-tickets">
                  <AlertCircle size={20} />
                  <p>No recent tickets.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
