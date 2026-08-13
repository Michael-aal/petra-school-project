import { useState } from "react";
import { 
  CheckCircle2, XCircle, Loader2, CreditCard, ArrowRight, 
  ArrowLeft, Lock, AlertTriangle, Search, ShieldCheck, 
  User, School, FileText, Calendar
} from "lucide-react";
import "./StudentPaymentPage.css";

// ==========================================
// MOCK DATA (Replace with Backend API)
// ==========================================
const MOCK_STUDENT = {
  "PET-2024-001": {
    name: "Michael John Doe",
    code: "PET-2024-001",
    initials: "MD",
    className: "SS 2A",
  },
};

const MOCK_PAYMENT_ITEMS = [
  { id: 1, name: "Tuition Fee", amount: 150000, description: "Full term tuition" },
  { id: 2, name: "Registration Fee", amount: 25000, description: "One-time enrollment fee" },
  { id: 3, name: "Uniform Package", amount: 35000, description: "Complete school uniform set" },
  { id: 4, name: "Transportation", amount: 45000, description: "School bus service per term" },
];

const STEPS = [
  { id: 1, title: "Student" },
  { id: 2, title: "Payment" },
  { id: 3, title: "Confirmation" },
];

export default function StudentPaymentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [studentCode, setStudentCode] = useState("");
  const [student, setStudent] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { status, reference, date }

  const formatNaira = (amount) =>
    `₦${Number(amount).toLocaleString("en-NG")}`;

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // ==========================================
  // STEP 1: VERIFY STUDENT
  // ==========================================
  const handleVerifyStudent = (e) => {
    e.preventDefault();
    setVerifyError("");

    if (!studentCode.trim()) {
      setVerifyError("Please enter a student code.");
      return;
    }

    setIsVerifying(true);

    // TODO: Replace with real API call
    // await paymentApi.verifyStudent(studentCode);
    setTimeout(() => {
      const found = MOCK_STUDENT[studentCode.trim().toUpperCase()];
      if (found) {
        setStudent(found);
        setIsVerifying(false);
      } else {
        setVerifyError("Student code not found. Please check and try again.");
        setIsVerifying(false);
      }
    }, 1500);
  };

  const handleContinueFromStudent = () => {
    setCurrentStep(2);
  };

  // ==========================================
  // STEP 2: PAYMENT ITEMS
  // ==========================================
  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleProceedToPayment = () => {
    setCurrentStep(3);
  };

  // ==========================================
  // STEP 3: PAYMENT GATEWAY
  // ==========================================
  const handlePayWithPaystack = () => {
    setIsProcessing(true);

    // TODO: Replace with real Paystack integration
    // 1. Call backend to initialize payment
    // 2. Open Paystack popup with authorization_url
    // 3. On callback, verify payment with backend
    
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15;
      if (isSuccess) {
        setPaymentResult({
          status: "success",
          reference: `PS-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        });
      } else {
        setPaymentResult({ status: "failed" });
      }
      setIsProcessing(false);
    }, 2500);
  };

  const handleContinueToPortal = () => {
    // TODO: Redirect to actual student portal
    alert("Redirecting to Student Portal...");
    // window.location.href = "/portal/dashboard";
  };

  const handleTryAgain = () => {
    setPaymentResult(null);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setStudentCode("");
    setStudent(null);
    setSelectedItems([]);
    setPaymentResult(null);
    setVerifyError("");
  };

  return (
    <div className="sp-page">
      <div className="sp-container">

        {/* SECURITY BADGE */}
        <div className="sp-security-bar">
          <Lock size={14} />
          <span>Secure Payment • Encrypted by Paystack</span>
        </div>

        {/* STEPPER */}
        {!paymentResult && (
          <div className="sp-stepper">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="sp-step-wrapper">
                  <div
                    className={`sp-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <div className="sp-step-circle">
                      {isCompleted ? <CheckCircle2 size={16} /> : step.id}
                    </div>
                    <span className="sp-step-label">{step.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`sp-step-line ${isCompleted ? "completed" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 1: STUDENT VERIFICATION               */}
        {/* ========================================== */}
        {currentStep === 1 && !student && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-card-icon-box">
                <User size={22} />
              </div>
              <div>
                <h2>Student Payment</h2>
                <p>Enter the student code to begin the payment process.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyStudent} className="sp-form">
              <div className="sp-field">
                <label htmlFor="studentCode">Student Code</label>
                <div className="sp-input-wrapper">
                  <Search size={18} className="sp-input-icon" />
                  <input
                    id="studentCode"
                    type="text"
                    placeholder="Enter student code"
                    value={studentCode}
                    onChange={(e) => {
                      setStudentCode(e.target.value.toUpperCase());
                      setVerifyError("");
                    }}
                    disabled={isVerifying}
                    className="sp-input code-input"
                  />
                </div>
                <small className="sp-hint">
                  Try: <code>PET-2024-001</code>
                </small>
              </div>

              {verifyError && (
                <div className="sp-alert error">
                  <AlertTriangle size={16} />
                  <span>{verifyError}</span>
                </div>
              )}

              <button
                type="submit"
                className="sp-btn primary"
                disabled={isVerifying || !studentCode.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={18} className="spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} /> Verify Student
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {currentStep === 1 && student && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-card-icon-box success">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h2>Student Verified Successfully</h2>
                <p>Please confirm this is the correct student.</p>
              </div>
            </div>

            <div className="sp-student-display">
              <div className="sp-student-avatar">{student.initials}</div>
              <div className="sp-student-info">
                <h3>{student.name}</h3>
                <div className="sp-student-meta">
                  <span className="sp-meta-item">
                    <FileText size={14} /> {student.code}
                  </span>
                  <span className="sp-meta-item">
                    <School size={14} /> {student.className}
                  </span>
                </div>
              </div>
            </div>

            <div className="sp-btn-group">
              <button className="sp-btn secondary" onClick={handleStartOver}>
                <ArrowLeft size={18} /> Change Student
              </button>
              <button className="sp-btn primary" onClick={handleContinueFromStudent}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: PAYMENT ITEMS                      */}
        {/* ========================================== */}
        {currentStep === 2 && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-card-icon-box">
                <CreditCard size={22} />
              </div>
              <div>
                <h2>Select Payment Items</h2>
                <p>
                  Choose the fees to pay for{" "}
                  <strong>{student?.name}</strong>
                </p>
              </div>
            </div>

            {/* Selected Student Summary */}
            <div className="sp-mini-student">
              <div className="sp-mini-avatar">{student?.initials}</div>
              <div>
                <strong>{student?.name}</strong>
                <span>{student?.code}</span>
              </div>
            </div>

            {/* Payment Items List */}
            <div className="sp-items-list">
              {MOCK_PAYMENT_ITEMS.map((item) => {
                const isSelected = selectedItems.find((i) => i.id === item.id);
                return (
                  <label
                    key={item.id}
                    className={`sp-item-row ${isSelected ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleItem(item)}
                      className="sp-checkbox"
                    />
                    <div className="sp-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </div>
                    <div className="sp-item-amount">
                      {formatNaira(item.amount)}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Payment Summary */}
            <div className="sp-summary">
              <h4>Payment Summary</h4>
              {selectedItems.length === 0 ? (
                <p className="sp-empty-summary">
                  No items selected yet. Choose at least one payment item.
                </p>
              ) : (
                <>
                  <div className="sp-summary-items">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="sp-summary-row">
                        <span>{item.name}</span>
                        <strong>{formatNaira(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="sp-summary-divider" />
                  <div className="sp-summary-row total">
                    <span>Total</span>
                    <strong>{formatNaira(totalAmount)}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="sp-btn-group">
              <button className="sp-btn secondary" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={18} /> Back
              </button>
              <button
                className="sp-btn primary"
                onClick={handleProceedToPayment}
                disabled={selectedItems.length === 0}
              >
                Proceed to Payment <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3: PAYMENT GATEWAY                    */}
        {/* ========================================== */}
        {currentStep === 3 && !paymentResult && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-card-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2>Choose Payment Method</h2>
                <p>Securely complete your payment.</p>
              </div>
            </div>

            <div className="sp-method-card">
              <div className="sp-method-top">
                <div className="sp-method-logo">
                  <CreditCard size={24} />
                </div>
                <div>
                  <strong>Paystack</strong>
                  <span>Securely complete your payment with Paystack.</span>
                </div>
                <div className="sp-method-check">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="sp-method-divider" />
              <div className="sp-method-total">
                <span>Total Amount</span>
                <strong>{formatNaira(totalAmount)}</strong>
              </div>
            </div>

            <div className="sp-btn-group">
              <button
                className="sp-btn secondary"
                onClick={() => setCurrentStep(2)}
                disabled={isProcessing}
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                className="sp-btn primary pay-btn"
                onClick={handlePayWithPaystack}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Pay {formatNaira(totalAmount)} with Paystack
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SUCCESS STATE                              */}
        {/* ========================================== */}
        {paymentResult?.status === "success" && (
          <div className="sp-card sp-success-card">
            <div className="sp-success-icon">
              <CheckCircle2 size={56} />
            </div>
            <h2>Payment Successful</h2>
            <p className="sp-success-sub">
              Your payment has been verified and processed successfully.
            </p>

            <div className="sp-receipt">
              <div className="sp-receipt-row">
                <span><User size={14} /> Student Name</span>
                <strong>{student?.name}</strong>
              </div>
              <div className="sp-receipt-row">
                <span><FileText size={14} /> Student Code</span>
                <strong className="mono">{student?.code}</strong>
              </div>
              <div className="sp-receipt-row">
                <span><CreditCard size={14} /> Amount Paid</span>
                <strong>{formatNaira(totalAmount)}</strong>
              </div>
              <div className="sp-receipt-row">
                <span><ShieldCheck size={14} /> Reference</span>
                <strong className="mono">{paymentResult.reference}</strong>
              </div>
              <div className="sp-receipt-row">
                <span><Calendar size={14} /> Date</span>
                <strong>{paymentResult.date}</strong>
              </div>
              <div className="sp-receipt-divider" />
              <div className="sp-receipt-section">
                <strong>Paid Items</strong>
                <ul>
                  {selectedItems.map((item) => (
                    <li key={item.id}>
                      <CheckCircle2 size={14} /> {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="sp-btn primary" onClick={handleContinueToPortal}>
              Continue to Student Portal <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* FAILED STATE                               */}
        {/* ========================================== */}
        {paymentResult?.status === "failed" && (
          <div className="sp-card sp-failed-card">
            <div className="sp-failed-icon">
              <XCircle size={56} />
            </div>
            <h2>Payment Failed</h2>
            <p className="sp-failed-sub">
              We could not process your payment. No amount has been charged to your account.
            </p>

            <div className="sp-btn-group center">
              <button className="sp-btn primary" onClick={handleTryAgain}>
                Try Again
              </button>
              <button className="sp-btn secondary" onClick={handleStartOver}>
                Start Over
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}