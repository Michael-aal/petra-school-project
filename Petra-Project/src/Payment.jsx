import { useMemo, useState } from "react";
import "./Payment.css";
import { financeApi } from "./services/financeApi";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

function Payment() {
  const [studentCode, setStudentCode] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const selectedFees = useMemo(
    () => fees.filter((fee) => selectedItems[fee.id]),
    [fees, selectedItems],
  );
  const overallTotal = useMemo(
    () => selectedFees.reduce((total, fee) => total + Number(fee.amount || 0) * Number(selectedItems[fee.id] || 1), 0),
    [selectedFees, selectedItems],
  );

  const verifyStudentCode = async () => {
    const normalizedCode = studentCode.trim();
    if (!normalizedCode) {
      setError("Enter your Student Code before verifying.");
      return;
    }

    setVerifyingStudent(true);
    setError("");
    setVerifiedStudent(null);
    setFees([]);
    setSelectedItems({});
    try {
      const response = await financeApi.publicStudentLookup(normalizedCode);
      setVerifiedStudent(response?.student || null);
      setFees(response?.feeStructures || []);
      if (!response?.student) setError("Student Code could not be verified.");
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || "Unable to verify the Student Code.");
    } finally {
      setVerifyingStudent(false);
    }
  };

  const continuePayment = async () => {
    if (!verifiedStudent) {
      setError("Verify a Student Code before continuing.");
      return;
    }
    if (!selectedFees.length) {
      setError("Select a payment item before continuing.");
      return;
    }

    setProcessingPayment(true);
    setError("");

    try {
      const response = await financeApi.publicPayment({
        studentCode: studentCode.trim(),
        feeItems: selectedFees.map((fee) => ({
          feeStructureId: fee.id,
          quantity: Number(selectedItems[fee.id] || 1),
        })),
      });

      const checkoutUrl = response?.session?.authorization_url || response?.session?.data?.authorization_url;

      if (!checkoutUrl) {
        setError("Payment session was created without a checkout URL.");
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || "Unable to initialize the payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="payment-screen">
      <div className="payment-container">
        <div className="payment-header">
          <div className="logo">PETRA</div>
          <span>School Portal</span>
        </div>

        <div className="payment-content">
          <div className="payment-title">
            <h1>School Payment</h1>
            <p>
              Select the school fees you would like to pay.
            </p>
          </div>

          <div className="payment-card">
            {error ? <div className="payment-error" role="alert">{error}</div> : null}

            <label htmlFor="student-code">Student Code</label>
            <div className="student-input" style={{ display: "block", marginTop: 8 }}>
              <input
                id="student-code"
                value={studentCode}
                onChange={(event) => { setStudentCode(event.target.value); setVerifiedStudent(null); setFees([]); setSelectedItems({}); }}
                placeholder="Enter Student Code"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #dfe2ea" }}
              />
              <button type="button" className="payment-button" onClick={verifyStudentCode} disabled={verifyingStudent} style={{ marginTop: 12, width: "100%" }}>
                {verifyingStudent ? "Verifying..." : "Verify Student Code"}
              </button>
            </div>

            {verifiedStudent ? (
              <div className="student-result" style={{ marginTop: 16 }} role="status">
                <strong className="verified-label">✓ Student verified</strong>
                <div className="student-row">
                  <span>Name</span>
                  <strong>{verifiedStudent.name}</strong>
                </div>
                <div className="student-row">
                  <span>Class</span>
                  <strong>{verifiedStudent.className || "Not assigned"}</strong>
                </div>
              </div>
            ) : null}

            {verifiedStudent ? (
              <div className="payment-options" style={{ marginTop: 22 }}>
                <div className="section-heading">
                  <h2>Payment items</h2>
                  <p>Select one or more items configured by your school.</p>
                </div>
                <div className="payment-item-list">
                  {fees.map((fee) => {
                    const quantity = Number(selectedItems[fee.id] || 1);
                    const selected = Boolean(selectedItems[fee.id]);
                    return (
                      <div key={fee.id} className={`payment-item${selected ? " selected" : ""}`}>
                        <label className="payment-item-select">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => setSelectedItems((current) => {
                              const next = { ...current };
                              if (event.target.checked) next[fee.id] = 1;
                              else delete next[fee.id];
                              return next;
                            })}
                            disabled={processingPayment}
                          />
                          <span>
                            <strong>{fee.name}</strong>
                            <small>{formatMoney(fee.amount)} each{fee.className ? ` • ${fee.className}` : ""}</small>
                          </span>
                        </label>
                        <div className="payment-item-total">
                          {fee.quantityRequired ? (
                            <div className="quantity-control" aria-label={`Quantity for ${fee.name}`}>
                              <button type="button" onClick={() => setSelectedItems((current) => ({ ...current, [fee.id]: Math.max(1, quantity - 1) }))} disabled={!selected || processingPayment}>-</button>
                              <span>{quantity}</span>
                              <button type="button" onClick={() => setSelectedItems((current) => ({ ...current, [fee.id]: quantity + 1 }))} disabled={!selected || processingPayment}>+</button>
                            </div>
                          ) : null}
                          <strong>{formatMoney(Number(fee.amount || 0) * quantity)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedFees.length ? (
                  <div className="payment-summary" style={{ marginTop: 16 }}>
                    <span>Overall total</span>
                    <strong>{formatMoney(overallTotal)}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={continuePayment}
              disabled={processingPayment || verifyingStudent || !verifiedStudent || !selectedFees.length}
              className="payment-button"
              style={{ marginTop: 22, width: "100%" }}
            >
              {processingPayment ? "Processing payment..." : "Continue to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;