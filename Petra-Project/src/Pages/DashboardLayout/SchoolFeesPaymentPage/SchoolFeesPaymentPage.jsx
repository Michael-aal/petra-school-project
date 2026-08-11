import { useState } from "react";
import { 
  CreditCard, ShieldCheck, CheckCircle2, XCircle, Loader2, 
  Lock, ArrowRight, School, AlertTriangle 
} from "lucide-react";
import "./SchoolFeesPaymentPage.css";

export default function SchoolFeesPaymentPage() {
  // States: 'idle' | 'processing' | 'success' | 'failed'
  const [status, setStatus] = useState("idle");

  // TODO: Replace with real data from backend (e.g., userInfo.admissionDetails)
  const paymentDetails = {
    studentName: "Ayo Ogunleye",
    studentCode: "PTR-2024-88392",
    appliedClass: "JSS 1",
    session: "2024/2025",
    term: "First Term",
    amount: 150000, // In Naira
    reference: `TXN-${Date.now()}` // Unique transaction reference
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePayment = () => {
    setStatus("processing");

    // TODO: INTEGRATE REAL PAYSTACK HERE
    // 1. Load Paystack script
    // 2. Initialize transaction with backend
    // 3. Open Paystack popup
    
    // SIMULATION: We simulate a 3-second payment process for the UI demo
    setTimeout(() => {
      // Simulate 90% success rate for demo purposes
      const isSuccess = Math.random() > 0.1; 
      
      if (isSuccess) {
        setStatus("success");
      } else {
        setStatus("failed");
      }
    }, 3000);
  };

  const handleRetry = () => setStatus("idle");
  const handleGoToPortal = () => {
    // TODO: Redirect to actual parent portal route
    alert("Redirecting to Parent Portal...");
    // window.location.href = "/portal/dashboard";
  };

  return (
    <div className="fees-page">
      <div className="fees-container">
        
        {/* SECURITY BADGE HEADER */}
        <div className="fees-security-bar">
          <Lock size={14} />
          <span>Secure Payment Encrypted by Paystack</span>
        </div>

        {/* ==========================================
            STATE 1: IDLE (Ready to Pay)
            ========================================== */}
        {status === "idle" && (
          <div className="fees-card">
            <div className="fees-header">
              <School size={24} className="fees-logo" />
              <div>
                <h2>School Fees Payment</h2>
                <p>Secure your ward's admission for the upcoming term.</p>
              </div>
            </div>

            <div className="fees-summary">
              <div className="summary-row">
                <span>Student Name</span>
                <strong>{paymentDetails.studentName}</strong>
              </div>
              <div className="summary-row">
                <span>Student Code</span>
                <strong className="mono">{paymentDetails.studentCode}</strong>
              </div>
              <div className="summary-row">
                <span>Class</span>
                <strong>{paymentDetails.appliedClass}</strong>
              </div>
              <div className="summary-row">
                <span>Session / Term</span>
                <strong>{paymentDetails.session} - {paymentDetails.term}</strong>
              </div>
              
              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total Amount Payable</span>
                <strong>{formatCurrency(paymentDetails.amount)}</strong>
              </div>
            </div>

            <div className="fees-methods">
              <span>We accept:</span>
              <div className="method-icons">
                <div className="method-icon">💳</div>
                <div className="method-icon">🏦</div>
                <div className="method-icon">📱</div>
              </div>
            </div>

            <button className="fees-pay-btn" onClick={handlePayment}>
              <CreditCard size={20} />
              <span>Pay {formatCurrency(paymentDetails.amount)}</span>
            </button>

            <p className="fees-disclaimer">
              By clicking pay, you agree to the school's financial policies. This transaction is non-refundable.
            </p>
          </div>
        )}

        {/* ==========================================
            STATE 2: PROCESSING
            ========================================== */}
        {status === "processing" && (
          <div className="fees-card processing-card">
            <div className="processing-spinner">
              <Loader2 size={48} className="spin" />
            </div>
            <h2>Processing Payment...</h2>
            <p>Please do not close this window or refresh the page.</p>
            <p className="processing-ref">Reference: {paymentDetails.reference}</p>
          </div>
        )}

        {/* ==========================================
            STATE 3: SUCCESS
            ========================================== */}
        {status === "success" && (
          <div className="fees-card success-card">
            <div className="success-icon-ring">
              <CheckCircle2 size={48} />
            </div>
            <h2>Payment Successful!</h2>
            <p className="success-msg">
              Thank you. Your ward's admission is now fully confirmed and active.
            </p>
            
            <div className="success-details">
              <div className="detail-item">
                <span>Amount Paid</span>
                <strong>{formatCurrency(paymentDetails.amount)}</strong>
              </div>
              <div className="detail-item">
                <span>Transaction Ref</span>
                <strong className="mono">{paymentDetails.reference}</strong>
              </div>
            </div>

            <button className="fees-portal-btn" onClick={handleGoToPortal}>
              <ArrowRight size={18} />
              <span>Go to Parent Portal</span>
            </button>
          </div>
        )}

        {/* ==========================================
            STATE 4: FAILED
            ========================================== */}
        {status === "failed" && (
          <div className="fees-card failed-card">
            <div className="failed-icon-ring">
              <XCircle size={48} />
            </div>
            <h2>Payment Failed</h2>
            <p className="failed-msg">
              We could not process your payment. Please check your funds and try again, or use a different card.
            </p>
            
            <div className="failed-actions">
              <button className="fees-retry-btn" onClick={handleRetry}>
                Try Again
              </button>
              <button className="fees-support-btn">
                <AlertTriangle size={16} />
                Contact Support
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}