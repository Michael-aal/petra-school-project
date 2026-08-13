import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Loader2,
  LockKeyhole,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import "./StudentPaymentPage.css";

/**
 * Frontend demonstration data.
 *
 * Replace verifyStudent() and loadPaymentItems() with authenticated API calls
 * once the payment service is connected to the backend.
 *
 * Payment items are intentionally data-driven so the admin/payment-management
 * module can later create, update, activate/deactivate, and remove fee items
 * without changing this component.
 */
const MOCK_STUDENTS = {
  "PET-2024-001": {
    name: "Michael John Doe",
    className: "SS2A",
    level: "Senior Secondary",
  },
  "PET-2024-002": {
    name: "Ayo Ogunleye",
    className: "JSS1",
    level: "Junior Secondary",
  },
};

const MOCK_PAYMENT_ITEMS = [
  {
    id: "tuition",
    name: "Tuition Fee",
    amount: 150000,
    description: "Current term tuition",
  },
  {
    id: "registration",
    name: "Registration Fee",
    amount: 25000,
    description: "Registration and administrative fee",
  },
];

const STEPS = [
  { id: 1, label: "Student" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Confirmation" },
];

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function StudentPaymentPage() {
  const [step, setStep] = useState(1);
  const [studentCode, setStudentCode] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [paymentItems, setPaymentItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(null);

  const totalAmount = useMemo(
    () =>
      paymentItems
        .filter((item) => selectedIds.includes(item.id))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [paymentItems, selectedIds],
  );

  const selectedItems = useMemo(
    () => paymentItems.filter((item) => selectedIds.includes(item.id)),
    [paymentItems, selectedIds],
  );

  const verificationBusy = status === "verifying";
  const paymentBusy = status === "processing";

  const currentStep =
    step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 3;

  const resetFlow = () => {
    setStep(1);
    setStudentCode("");
    setVerifiedStudent(null);
    setPaymentItems([]);
    setSelectedIds([]);
    setStatus("idle");
    setErrorMessage("");
    setPaymentReference("");
    setPaymentDate(null);
  };

  const handleVerifyStudent = async (event) => {
    event.preventDefault();
    const normalizedCode = studentCode.trim().toUpperCase();

    if (!normalizedCode) {
      setErrorMessage("Enter a student code to continue.");
      return;
    }

    setErrorMessage("");
    setStatus("verifying");

    // Replace this demo lookup with: POST /api/payments/verify-student
    await new Promise((resolve) => setTimeout(resolve, 900));

    const student = MOCK_STUDENTS[normalizedCode];

    if (!student) {
      setStatus("idle");
      setErrorMessage(
        "We couldn't find a student with that code. Check the code and try again.",
      );
      return;
    }

    setVerifiedStudent({ ...student, code: normalizedCode });

    // Replace this with: GET /api/payments/items?studentCode=...
    setPaymentItems(MOCK_PAYMENT_ITEMS);

    setSelectedIds([]);
    setStatus("idle");
  };

  const handleContinue = () => {
    if (!verifiedStudent) return;
    setErrorMessage("");
    setStep(2);
  };

  const togglePaymentItem = (itemId) => {
    setErrorMessage("");
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const handleProceedToPayment = () => {
    if (!selectedItems.length || totalAmount <= 0) {
      setErrorMessage("Select at least one payment item to continue.");
      return;
    }

    setErrorMessage("");
    setStep(3);
  };

  const handlePaystackPayment = async () => {
    if (!verifiedStudent || totalAmount <= 0 || paymentBusy) return;

    setErrorMessage("");
    setStatus("processing");

    /*
     * Production integration point:
     *
     * 1. POST to your backend to initialize a Paystack transaction.
     * 2. Receive the Paystack authorization URL/reference.
     * 3. Open Paystack Checkout / Inline.
     * 4. Let Paystack handle authentication and payment.
     * 5. Verify the transaction server-side.
     * 6. Mark the backend payment as completed.
     *
     * For this frontend-only demonstration, a short mock completion is used.
     */
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const reference = `NUV-${Date.now().toString(36).toUpperCase()}`;

    setPaymentReference(reference);
    setPaymentDate(new Date());
    setStatus("success");
  };

  const continueToStudentPortal = () => {
    // Student accounts currently resolve to the portal dashboard in roleAccess.js.
    window.location.assign("/portal/dashboard");
  };

  const retryPayment = () => {
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <main className="student-payment-page">
      <div className="student-payment-shell">
        <header className="student-payment-header">
          <div>
            <span className="student-payment-eyebrow">Nuvora Pay</span>
            <h1>Student Payment</h1>
            <p>
              Securely verify a student, choose outstanding fees, and complete
              payment in one calm flow.
            </p>
          </div>

          <div className="student-payment-security">
            <ShieldCheck size={16} />
            <span>Secure payment experience</span>
          </div>
        </header>

        <div className="student-payment-stepper" aria-label="Payment progress">
          {STEPS.map((item, index) => {
            const active = currentStep === item.id;
            const complete = currentStep > item.id;

            return (
              <div className="payment-step" key={item.id}>
                <div
                  className={`payment-step-marker ${
                    active ? "is-active" : ""
                  } ${complete ? "is-complete" : ""}`}
                >
                  {complete ? <Check size={15} /> : item.id}
                </div>
                <span
                  className={`payment-step-label ${
                    active ? "is-active" : ""
                  }`}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`payment-step-line ${
                      currentStep > item.id ? "is-complete" : ""
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <section className="student-payment-card">
          {step === 1 ? (
            <>
              <div className="student-payment-card-heading">
                <div className="student-payment-icon">
                  <Search size={20} />
                </div>
                <div>
                  <span className="student-payment-kicker">Step 1</span>
                  <h2>Find the student</h2>
                  <p>
                    Enter the unique student code assigned by the school.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyStudent} className="student-payment-form">
                <label className="student-payment-field" htmlFor="studentCode">
                  <span>Student Code</span>
                  <div className="student-payment-input-wrap">
                    <UserRound size={18} />
                    <input
                      id="studentCode"
                      name="studentCode"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck="false"
                      placeholder="Enter student code"
                      value={studentCode}
                      onChange={(event) => {
                        setStudentCode(event.target.value.toUpperCase());
                        setErrorMessage("");
                      }}
                      disabled={verificationBusy}
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={
                        errorMessage ? "student-code-error" : undefined
                      }
                    />
                  </div>
                </label>

                {errorMessage ? (
                  <div
                    className="student-payment-alert student-payment-alert--error"
                    id="student-code-error"
                    role="alert"
                  >
                    <XCircle size={17} />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="student-payment-primary-btn"
                  disabled={!studentCode.trim() || verificationBusy}
                >
                  {verificationBusy ? (
                    <>
                      <Loader2 className="student-payment-spin" size={18} />
                      Verifying student...
                    </>
                  ) : (
                    <>
                      Verify Student
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="student-payment-demo-note">
                <span>Demo code</span>
                <button
                  type="button"
                  onClick={() => setStudentCode("PET-2024-001")}
                >
                  PET-2024-001
                </button>
                <span>•</span>
                <span>Mock frontend data</span>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="student-payment-card-heading">
                <div className="student-payment-icon student-payment-icon--success">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="student-payment-kicker">Step 2</span>
                  <h2>Select payment items</h2>
                  <p>Choose the fees you want to settle today.</p>
                </div>
              </div>

              {verifiedStudent ? (
                <div className="student-payment-student-card">
                  <div className="student-payment-avatar">
                    {getInitials(verifiedStudent.name)}
                  </div>
                  <div className="student-payment-student-main">
                    <div>
                      <strong>{verifiedStudent.name}</strong>
                      <span>{verifiedStudent.code}</span>
                    </div>
                    <div className="student-payment-student-meta">
                      <span>{verifiedStudent.className}</span>
                      <span>{verifiedStudent.level}</span>
                    </div>
                  </div>
                  <div className="student-payment-verified-badge">
                    <CheckCircle2 size={15} />
                    Verified
                  </div>
                </div>
              ) : null}

              <div className="student-payment-success-message">
                <CheckCircle2 size={16} />
                <span>Student verified successfully.</span>
              </div>

              <div className="student-payment-items">
                {paymentItems.map((item) => {
                  const selected = selectedIds.includes(item.id);

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`student-payment-item ${
                        selected ? "is-selected" : ""
                      }`}
                      onClick={() => togglePaymentItem(item.id)}
                      aria-pressed={selected}
                    >
                      <span
                        className={`student-payment-checkbox ${
                          selected ? "is-selected" : ""
                        }`}
                        aria-hidden="true"
                      >
                        {selected ? <Check size={14} /> : null}
                      </span>

                      <span className="student-payment-item-copy">
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>

                      <span className="student-payment-item-amount">
                        {formatNaira(item.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="student-payment-summary">
                <div className="student-payment-summary-header">
                  <div>
                    <span>Payment Summary</span>
                    <small>{selectedItems.length} item(s) selected</small>
                  </div>
                  <ReceiptText size={18} />
                </div>

                {selectedItems.length ? (
                  <div className="student-payment-summary-items">
                    {selectedItems.map((item) => (
                      <div className="student-payment-summary-row" key={item.id}>
                        <span>{item.name}</span>
                        <strong>{formatNaira(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="student-payment-empty-summary">
                    Select one or more payment items to calculate your total.
                  </div>
                )}

                <div className="student-payment-summary-total">
                  <span>Total amount</span>
                  <strong>{formatNaira(totalAmount)}</strong>
                </div>
              </div>

              {errorMessage ? (
                <div
                  className="student-payment-alert student-payment-alert--error"
                  role="alert"
                >
                  <XCircle size={17} />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="student-payment-actions">
                <button
                  type="button"
                  className="student-payment-secondary-btn"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage("");
                  }}
                >
                  <ArrowLeft size={17} />
                  Back
                </button>

                <button
                  type="button"
                  className="student-payment-primary-btn"
                  onClick={handleProceedToPayment}
                  disabled={!selectedItems.length || totalAmount <= 0}
                >
                  Continue to payment
                  <ArrowRight size={17} />
                </button>
              </div>

              <button
                type="button"
                className="student-payment-change-student"
                onClick={resetFlow}
              >
                Change student
              </button>
            </>
          ) : null}

          {step === 3 && status !== "success" ? (
            <>
              <div className="student-payment-card-heading">
                <div className="student-payment-icon">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="student-payment-kicker">Step 3</span>
                  <h2>Choose payment method</h2>
                  <p>Securely complete your payment with Paystack.</p>
                </div>
              </div>

              {verifiedStudent ? (
                <div className="student-payment-mini-student">
                  <div className="student-payment-avatar student-payment-avatar--small">
                    {getInitials(verifiedStudent.name)}
                  </div>
                  <div>
                    <strong>{verifiedStudent.name}</strong>
                    <span>
                      {verifiedStudent.code} · {verifiedStudent.className}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="student-payment-method-card">
                <div className="student-payment-method-leading">
                  <div className="student-payment-paystack-mark">
                    <CircleDollarSign size={20} />
                  </div>
                  <div>
                    <strong>Paystack</strong>
                    <span>Secure online card, bank, and transfer checkout.</span>
                  </div>
                </div>
                <ShieldCheck size={19} />
              </div>

              <div className="student-payment-total-callout">
                <span>Total to pay</span>
                <strong>{formatNaira(totalAmount)}</strong>
              </div>

              {errorMessage ? (
                <div
                  className="student-payment-alert student-payment-alert--error"
                  role="alert"
                >
                  <XCircle size={17} />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <button
                type="button"
                className="student-payment-primary-btn"
                onClick={handlePaystackPayment}
                disabled={paymentBusy}
              >
                {paymentBusy ? (
                  <>
                    <Loader2 className="student-payment-spin" size={18} />
                    Connecting to Paystack...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={17} />
                    Pay {formatNaira(totalAmount)} with Paystack
                  </>
                )}
              </button>

              <button
                type="button"
                className="student-payment-back-link"
                onClick={() => {
                  setStep(2);
                  setErrorMessage("");
                }}
                disabled={paymentBusy}
              >
                <ArrowLeft size={16} />
                Back to payment items
              </button>
            </>
          ) : null}

          {step === 3 && status === "success" ? (
            <div className="student-payment-success-state">
              <div className="student-payment-success-icon">
                <CheckCircle2 size={34} />
              </div>

              <span className="student-payment-kicker">Payment complete</span>
              <h2>Payment Successful</h2>
              <p>
                The payment has been confirmed for the selected student in this
                frontend demonstration.
              </p>

              <div className="student-payment-receipt">
                <div>
                  <span>Student</span>
                  <strong>{verifiedStudent?.name}</strong>
                </div>
                <div>
                  <span>Student Code</span>
                  <strong>{verifiedStudent?.code}</strong>
                </div>
                <div>
                  <span>Amount paid</span>
                  <strong>{formatNaira(totalAmount)}</strong>
                </div>
                <div>
                  <span>Payment reference</span>
                  <strong className="student-payment-mono">
                    {paymentReference}
                  </strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>
                    {paymentDate
                      ? paymentDate.toLocaleString("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Paid items</span>
                  <strong>
                    {selectedItems.map((item) => item.name).join(", ")}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="student-payment-primary-btn"
                onClick={continueToStudentPortal}
              >
                Continue to Student Portal
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="student-payment-secondary-btn student-payment-secondary-btn--full"
                onClick={resetFlow}
              >
                Make another payment
              </button>

              <p className="student-payment-production-note">
                <ShieldCheck size={14} />
                Production flow: verify the Paystack transaction server-side
                before marking the payment complete or activating a student
                account.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
