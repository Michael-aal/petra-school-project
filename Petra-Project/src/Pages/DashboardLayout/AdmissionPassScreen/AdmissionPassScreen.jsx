import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  School,
} from "lucide-react";
import "./AdmissionPassScreen.css";

export default function AdmissionPassScreen() {
  const [copied, setCopied] = useState(false);

  const admissionData = {
    studentName: "Ayo Ogunleye",
    studentCode: "PTR-2024-88392",
    appliedClass: "JSS 1",
    academicSession: "2024/2025",
    schoolFeesAmount: "₦150,000",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(admissionData.studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pass-screen-page">
      <div className="pass-bg-glow glow-1" aria-hidden="true" />
      <div className="pass-bg-glow glow-2" aria-hidden="true" />

      <div className="pass-container">
        <header className="pass-hero">
          <div className="pass-checkmark-ring" aria-hidden="true">
            <div className="pass-checkmark-inner">
              <CheckCircle2 size={44} strokeWidth={2} />
            </div>
          </div>

          <div className="pass-book-mark" aria-hidden="true">
            <BookOpen size={22} strokeWidth={1.9} />
          </div>

          <p className="pass-eyebrow">Admission confirmed</p>
          <h1 className="pass-title">Congratulations!</h1>
          <p className="pass-subtitle">
            Your ward has successfully passed the entrance examination and has
            been offered admission into{" "}
            <strong>{admissionData.appliedClass}</strong>.
          </p>
        </header>

        <section className="pass-code-card" aria-labelledby="student-code-title">
          <div className="code-card-header">
            <School size={19} aria-hidden="true" />
            <span id="student-code-title">Official Student Identity</span>
          </div>

          <div className="code-card-body">
            <span className="code-label">Student Code / ID</span>
            <div className="code-value-wrapper">
              <span className="code-value">{admissionData.studentCode}</span>
              <button className="copy-btn" onClick={handleCopyCode} title="Copy Code">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <p className="code-disclaimer">
              Keep this code safe. You will need it to pay school fees and log
              into the parent portal.
            </p>
          </div>
        </section>

        <section className="pass-next-steps" aria-labelledby="next-step-title">
          <div className="pass-section-heading">
            <p className="pass-section-kicker">Next step</p>
            <h2 id="next-step-title">Secure the admission</h2>
            <p>
              Confirm your ward&apos;s place for the{" "}
              <strong>{admissionData.academicSession}</strong> academic session
              by completing the school-fee payment.
            </p>
          </div>

          <div className="pass-fee-summary">
            <div className="fee-row">
              <span>Tuition &amp; Development Levy</span>
              <strong>{admissionData.schoolFeesAmount}</strong>
            </div>
            <div className="fee-row total">
              <span>Total Payable Now</span>
              <strong>{admissionData.schoolFeesAmount}</strong>
            </div>
          </div>

          <button className="pass-pay-btn">
            <CreditCard size={19} aria-hidden="true" />
            <span>Pay School Fees Now</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <button className="pass-receipt-btn">
            <Download size={16} aria-hidden="true" />
            Download Admission Letter (PDF)
          </button>
        </section>
      </div>
    </div>
  );
}
