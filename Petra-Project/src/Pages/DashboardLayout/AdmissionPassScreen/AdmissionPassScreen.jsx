import { useState } from "react";
import { 
  CheckCircle2, Copy, GraduationCap, CreditCard, 
  Download, Sparkles, ArrowRight, School 
} from "lucide-react";
import "./AdmissionPassScreen.css";

export default function AdmissionPassScreen() {
  const [copied, setCopied] = useState(false);

  // TODO: Replace with real data from backend (e.g., userInfo.applicationResult)
  const admissionData = {
    studentName: "Ayo Ogunleye",
    studentCode: "PTR-2024-88392", // The official generated code
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
      
      {/* Decorative Background Elements */}
      <div className="pass-bg-glow glow-1"></div>
      <div className="pass-bg-glow glow-2"></div>

      <div className="pass-container">
        
        {/* 1. Celebration Header */}
        <div className="pass-hero">
          <div className="pass-checkmark-ring">
            <div className="pass-checkmark-inner">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <div className="pass-sparkles">
            <Sparkles size={24} className="sparkle s1" />
            <Sparkles size={16} className="sparkle s2" />
            <Sparkles size={20} className="sparkle s3" />
          </div>
          
          <h1 className="pass-title">Congratulations!</h1>
          <p className="pass-subtitle">
            Your ward has successfully passed the entrance examination and has been offered admission into <strong>{admissionData.appliedClass}</strong>.
          </p>
        </div>

        {/* 2. Official Student Code Card */}
        <div className="pass-code-card">
          <div className="code-card-header">
            <School size={20} />
            <span>Official Student Identity</span>
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
              Please save this code. You will need it to pay school fees and log into the parent portal.
            </p>
          </div>
        </div>

        {/* 3. Next Steps & Action */}
        <div className="pass-next-steps">
          <h3>Next Step: Secure the Admission</h3>
          <p>
            To confirm your ward's spot for the <strong>{admissionData.academicSession}</strong> academic session, please proceed to pay the school fees.
          </p>
          
          <div className="pass-fee-summary">
            <div className="fee-row">
              <span>Tuition & Development Levy</span>
              <strong>{admissionData.schoolFeesAmount}</strong>
            </div>
            <div className="fee-row total">
              <span>Total Payable Now</span>
              <strong>{admissionData.schoolFeesAmount}</strong>
            </div>
          </div>

          <button className="pass-pay-btn">
            <CreditCard size={20} />
            <span>Pay School Fees Now</span>
            <ArrowRight size={18} />
          </button>
          
          <button className="pass-receipt-btn">
            <Download size={16} />
            Download Admission Letter (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}