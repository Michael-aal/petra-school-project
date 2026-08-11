import { useState } from "react";
import { 
  Search, CheckCircle2, XCircle, Loader2, CreditCard, 
  ArrowRight, ArrowLeft, ShieldCheck, Lock, AlertTriangle, 
  FileText, RefreshCw, School, Wallet 
} from "lucide-react";
import "./StudentPaymentPage.css";

// ==========================================
// MOCK DATA (Replace with Backend API calls)
// ==========================================
const MOCK_STUDENTS = {
  "PET-2024-001": { name: "Michael John Doe", className: "SS2A" },
  "PET-2024-002": { name: "Ayo Ogunleye", className: "JSS1" },
};

const MOCK_PAYMENT_ITEMS = [
  { id: 1, name: "School Fees", amount: 95000, description: "Tuition for the current term" },
  { id: 2, name: "Registration Fee", amount: 20000, description: "One-time enrollment fee" },
  { id: 3, name: "New Student Package", amount: 15000, description: "Starter kit and materials" },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function StudentPaymentPage() {
  // Flow: verify -> verifying -> confirm -> selectPayment -> review -> processing -> success/failed
  const [step, setStep] = useState("verify");
  
  const [studentCode, setStudentCode] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [paymentItems, setPaymentItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const formatNaira = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

  // ==========================================
  // STEP 1-3: VERIFY STUDENT CODE
  // ==========================================
  const handleVerifyStudent = async (e) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      setErrorMsg("Please enter a student code.");
      return;
    }

    setStep("verifying");
    setErrorMsg("");

    // TODO: REPLACE WITH REAL API CALL
    // const response = await fetch(`${API_BASE_URL}/payments/verify-student`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ studentCode: studentCode.trim().toUpperCase() }),
    // });
    // if (!response.ok) throw new Error("Student code not found.");
    // const data = await response.json();

    // SIMULATED API DELAY (2 seconds)
    setTimeout(() => {
      const code = studentCode.trim().toUpperCase();
      const found = MOCK_STUDENTS[code];

      if (found) {
        setVerifiedStudent({ ...found, code });
        setStep("confirm");
      } else {
        setErrorMsg("Student code not found. Please check the code and try again.");
        setStep("verify");
      }
    }, 1500);
  };

  // ==========================================
  // STEP 4: CONFIRM STUDENT & LOAD PAYMENT ITEMS
  // ==========================================
  const handleConfirmStudent = async () => {
    setStep("selectPayment");
    setLoadingItems(true);

    // TODO: REPLACE WITH REAL API CALL
    // const response = await fetch(`${API_BASE_URL}/payments/active-items?studentCode=${verifiedStudent.code}`);
    // const data = await response.json();
    // setPaymentItems(data.paymentItems);

    // SIMULATED API DELAY
    setTimeout(() => {
      setPaymentItems(MOCK_PAYMENT_ITEMS);
      setLoadingItems(false);
    }, 1200);
  };

  // ==========================================
  // STEP 6-8: SELECT ITEM & REVIEW
  // ==========================================
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setStep("review");
  };

  // ==========================================
  // STEP 9-11: PROCESS PAYMENT
  // ==========================================
  const handleProceedToPayment = async () => {
    setStep("processing");

    // TODO: REPLACE WITH REAL PAYSTACK INTEGRATION
    // 1. Send payment info to backend to initialize
    // 2. Backend returns authorization_url
    // 3. Redirect user to Paystack
    // 4. Listen for success/failure callback
    // 5. Verify payment with backend

    // SIMULATED PAYMENT PROCESS
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      const ref = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setPaymentRef(ref);

      if (isSuccess) {
        setStep("success");
      } else {
        setStep("failed");
      }
    }, 3000);
  };

  const handleReset = () => {
    setStep("verify");
    setStudentCode("");
    setVerifiedStudent(null);
    setSelectedItem(null);
    setPaymentItems([]);
    setErrorMsg("");
  };

  return (
    <div className="sp-page">
      <div className="sp-container">
        
        {/* SECURITY BADGE */}
        <div className="sp-security-bar">
          <Lock size={14} />
          <span>Secure Payment • Powered by Paystack</span>
        </div>

        {/* ========================================== */}
        {/* STEP 1 & 2: STUDENT CODE INPUT             */}
        {/* ========================================== */}
        {(step === "verify" || step === "verifying") && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-icon-box blue">
                <Search size={24} />
              </div>
              <div>
                <h2>Verify Student</h2>
                <p>Enter your student code to begin the payment process.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyStudent} className="sp-form">
              <div className="sp-field">
                <label htmlFor="studentCode">Student Code</label>
                <input
                  id="studentCode"
                  type="text"
                  placeholder="PET-XXXXXXXX"
                  value={studentCode}
                  onChange={(e) => {
                    setStudentCode(e.target.value.toUpperCase());
                    setErrorMsg("");
                  }}
                  disabled={step === "verifying"}
                  className="sp-input code-input"
                />
                <small className="sp-hint">Try: PET-2024-001 or PET-2024-002</small>
              </div>

              {errorMsg && (
                <div className="sp-alert error">
                  <XCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" className="sp-btn primary" disabled={step === "verifying"}>
                {step === "verifying" ? (
                  <><Loader2 size={18} className="spin" /> Verifying...</>
                ) : (
                  <><CheckCircle2 size={18} /> Verify Student</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3 & 4: CONFIRM STUDENT                */}
        {/* ========================================== */}
        {step === "confirm" && verifiedStudent && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-icon-box green">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2>Student Verified</h2>
                <p>Please confirm this is the correct student before proceeding.</p>
              </div>
            </div>

            <div className="sp-student-confirm">
              <div className="sp-student-avatar">
                {verifiedStudent.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="sp-student-details">
                <span className="sp-student-name">{verifiedStudent.name}</span>
                <span className="sp-student-code mono">{verifiedStudent.code}</span>
                <span className="sp-student-class">Class: {verifiedStudent.className}</span>
              </div>
            </div>

            <div className="sp-btn-group">
              <button className="sp-btn secondary" onClick={handleReset}>
                <ArrowLeft size={18} /> Not my student
              </button>
              <button className="sp-btn primary" onClick={handleConfirmStudent}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 5-6: SELECT PAYMENT ITEM              */}
        {/* ========================================== */}
        {step === "selectPayment" && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-icon-box purple">
                <Wallet size={24} />
              </div>
              <div>
                <h2>What would you like to pay for?</h2>
                <p>Select a payment option for <strong>{verifiedStudent?.name}</strong></p>
              </div>
            </div>

            {loadingItems ? (
              <div className="sp-loading-state">
                <Loader2 size={32} className="spin" />
                <p>Loading available payment options...</p>
              </div>
            ) : paymentItems.length > 0 ? (
              <div className="sp-payment-options">
                {paymentItems.map((item) => (
                  <button
                    key={item.id}
                    className="sp-payment-option"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="sp-option-info">
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </div>
                    <div className="sp-option-right">
                      <span className="sp-option-amount">{formatNaira(item.amount)}</span>
                      <ArrowRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="sp-empty-state">
                <AlertTriangle size={28} />
                <p>No payment options are currently available. Please contact the school office.</p>
              </div>
            )}

            <button className="sp-btn ghost" onClick={handleReset}>
              <ArrowLeft size={16} /> Change student
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 7-8: REVIEW & CONFIRM PAYMENT         */}
        {/* ========================================== */}
        {step === "review" && selectedItem && verifiedStudent && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-icon-box orange">
                <FileText size={24} />
              </div>
              <div>
                <h2>Payment Summary</h2>
                <p>Please review the details before proceeding to payment.</p>
              </div>
            </div>

            <div className="sp-review-box">
              <div className="sp-review-row">
                <span>Student</span>
                <strong>{verifiedStudent.name}</strong>
              </div>
              <div className="sp-review-row">
                <span>Student Code</span>
                <strong className="mono">{verifiedStudent.code}</strong>
              </div>
              <div className="sp-review-row">
                <span>Payment Item</span>
                <strong>{selectedItem.name}</strong>
              </div>
              <div className="sp-review-divider"></div>
              <div className="sp-review-row total">
                <span>Amount Due</span>
                <strong>{formatNaira(selectedItem.amount)}</strong>
              </div>
            </div>

            <div className="sp-btn-group">
              <button className="sp-btn secondary" onClick={() => setStep("selectPayment")}>
                <ArrowLeft size={18} /> Change payment
              </button>
              <button className="sp-btn primary" onClick={handleProceedToPayment}>
                <Lock size={16} /> Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 9: PROCESSING PAYMENT                 */}
        {/* ========================================== */}
        {step === "processing" && (
          <div className="sp-card sp-center">
            <Loader2 size={56} className="spin purple-spin" />
            <h2>Processing Payment...</h2>
            <p>Please do not close this window.</p>
            <p className="sp-processing-note">Connecting securely to payment gateway...</p>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 10: PAYMENT SUCCESS                   */}
        {/* ========================================== */}
        {step === "success" && (
          <div className="sp-card sp-center success-state">
            <div className="sp-result-icon success-ring">
              <CheckCircle2 size={48} />
            </div>
            <h2>Payment Successful</h2>
            <p>Your payment has been confirmed and processed.</p>

            <div className="sp-receipt-box">
              <div className="sp-review-row"><span>Student</span><strong>{verifiedStudent?.name}</strong></div>
              <div className="sp-review-row"><span>Student Code</span><strong className="mono">{verifiedStudent?.code}</strong></div>
              <div className="sp-review-row"><span>Payment</span><strong>{selectedItem?.name}</strong></div>
              <div className="sp-review-row"><span>Amount</span><strong>{formatNaira(selectedItem?.amount)}</strong></div>
              <div className="sp-review-divider"></div>
              <div className="sp-review-row"><span>Reference</span><strong className="mono">{paymentRef}</strong></div>
            </div>

            <button className="sp-btn primary" onClick={handleReset}>
              <RefreshCw size={18} /> Make Another Payment
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 11: PAYMENT FAILED                    */}
        {/* ========================================== */}
        {step === "failed" && (
          <div className="sp-card sp-center failed-state">
            <div className="sp-result-icon failed-ring">
              <XCircle size={48} />
            </div>
            <h2>Payment Failed</h2>
            <p>We were unable to process your payment. No money was deducted from your account.</p>

            <div className="sp-btn-group center">
              <button className="sp-btn primary" onClick={() => setStep("review")}>
                <RefreshCw size={18} /> Try Again
              </button>
              <button className="sp-btn secondary" onClick={handleReset}>
                Start Over
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}