
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Payment.css";
import { financeApi } from "./services/financeApi";

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

function Payment() {
  const navigate = useNavigate();

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentVerificationCode, setStudentVerificationCode] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState(null);

  const [feeStructures, setFeeStructures] = useState([]);
  const [selectedFees, setSelectedFees] = useState({});

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load the parent's linked students and available fee structures.
   *
   * We keep the existing parentFees() API because the payment itself
   * still uses the existing authenticated finance/payment system.
   */
  useEffect(() => {
    let active = true;

    const loadPaymentData = async () => {
      setLoadingStudents(true);
      setError("");

      try {
        const response = await financeApi.parentFees();

        if (!active) return;

        const students = Array.isArray(response?.children)
          ? response.children
          : [];

        const fees = Array.isArray(response?.feeStructures)
          ? response.feeStructures
          : [];

        setLinkedStudents(students);
        setFeeStructures(fees);
      } catch (requestError) {
        if (!active) return;

        if (requestError.status === 401) {
          navigate("/signin", { replace: true });
          return;
        }

        setError(
          requestError.data?.message ||
            requestError.message ||
            "Unable to load payment information."
        );
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    loadPaymentData();

    return () => {
      active = false;
    };
  }, [navigate]);

  /*
   * Student Verification Code
   *
   * We intentionally support several possible field names so this
   * remains compatible with the existing student response.
   */
  const getStudentVerificationCode = (student) =>
    String(
      student?.studentCode ||
        student?.admissionNumber ||
        student?.verificationCode ||
        student?.code ||
        ""
    ).trim();

  const verifyStudent = () => {
    setError("");
    setSuccess("");
    setVerifiedStudent(null);
    setSelectedStudentId("");
    setSelectedFees({});

    const code = studentVerificationCode.trim();

    if (!code) {
      setError("Please enter the Student Verification Code.");
      return;
    }

    setVerifyingStudent(true);

    try {
      const normalizedCode = code.toLowerCase();

      const student = linkedStudents.find((item) => {
        const studentCode = getStudentVerificationCode(item);

        return studentCode.toLowerCase() === normalizedCode;
      });

      if (!student) {
        setError(
          "Student Verification Code was not found in your linked students."
        );
        return;
      }

      setVerifiedStudent(student);
      setSelectedStudentId(String(student.id));

      setSuccess(
        `${student.name || "Student"} has been verified successfully.`
      );
    } finally {
      setVerifyingStudent(false);
    }
  };

  const selectedFeeItems = useMemo(
    () =>
      feeStructures
        .filter((fee) => selectedFees[fee.id])
        .map((fee) => ({
          feeStructureId: fee.id,
          quantity: fee.quantityRequired
            ? Number(selectedFees[fee.id]) || 1
            : 1,
        })),
    [feeStructures, selectedFees]
  );

  const totalAmount = useMemo(
    () =>
      feeStructures.reduce((total, fee) => {
        if (!selectedFees[fee.id]) return total;

        const quantity = fee.quantityRequired
          ? Number(selectedFees[fee.id]) || 1
          : 1;

        return total + Number(fee.amount || 0) * quantity;
      }, 0),
    [feeStructures, selectedFees]
  );

  const selectedCount = selectedFeeItems.length;

  const toggleFee = (fee) => {
    setSelectedFees((current) => {
      const next = { ...current };

      if (next[fee.id]) {
        delete next[fee.id];
      } else {
        next[fee.id] = fee.quantityRequired ? 1 : true;
      }

      return next;
    });

    setError("");
    setSuccess("");
  };

  const changeQuantity = (feeId, value) => {
    const quantity = Math.max(
      1,
      Number.parseInt(value, 10) || 1
    );

    setSelectedFees((current) => ({
      ...current,
      [feeId]: quantity,
    }));
  };

  const handleVerificationCodeChange = (event) => {
    setStudentVerificationCode(event.target.value);

    setVerifiedStudent(null);
    setSelectedStudentId("");
    setSelectedFees({});
    setError("");
    setSuccess("");
  };

  const continuePayment = async () => {
    setError("");
    setSuccess("");

    if (!verifiedStudent || !selectedStudentId) {
      setError("Please verify the Student Verification Code first.");
      return;
    }

    if (!selectedFeeItems.length) {
      setError("Please select at least one payment item.");
      return;
    }

    setProcessingPayment(true);

    try {
      /*
       * Keep the existing authenticated payment endpoint and payload.
       * The verification code is used to identify the student, while
       * the existing studentId remains the backend payment identifier.
       */
      const response = await financeApi.createPayment({
        studentId: selectedStudentId,
        feeItems: selectedFeeItems,
        paymentType: "school_fee",
      });

      const checkoutUrl =
        response?.session?.authorization_url ||
        response?.session?.data?.authorization_url ||
        response?.authorization_url ||
        response?.data?.authorization_url;

      if (!checkoutUrl) {
        setSuccess(
          "Payment was initialized, but no Paystack checkout link was returned."
        );
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/signin", { replace: true });
        return;
      }

      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to initialize payment."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <main className="payment-page">
      <div className="payment-wrapper">

        {/* Header */}
        <header className="payment-topbar">
          <div className="payment-brand">
            <div className="payment-brand-mark">P</div>

            <div>
              <div className="payment-brand-name">PETRA</div>

              <div className="payment-brand-subtitle">
                School Portal
              </div>
            </div>
          </div>

          <div className="secure-payment">
            <span className="secure-icon">✓</span>
            Secure payment
          </div>
        </header>

        {/* Heading */}
        <section className="payment-heading">
          <div>
            <span className="payment-eyebrow">FINANCE</span>

            <h1>Make a payment</h1>

            <p>
              Verify the student and select the payment items you
              want to pay for.
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="payment-alert payment-alert-error">
            <span className="alert-icon">!</span>

            <div>
              <strong>Payment error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="payment-alert payment-alert-success">
            <span className="alert-icon">✓</span>

            <div>
              <strong>
                {verifiedStudent
                  ? "Student verified"
                  : "Payment initialized"}
              </strong>

              <p>{success}</p>
            </div>
          </div>
        )}

        <div className="payment-layout">

          {/* Main content */}
          <section className="payment-main">

            {/* Student Verification */}
            <div className="payment-section">
              <div className="section-heading">
                <div className="section-number">01</div>

                <div>
                  <h2>Student verification</h2>

                  <p>
                    Enter the Student Verification Code to identify
                    the student you are paying for.
                  </p>
                </div>
              </div>

              {loadingStudents ? (
                <div className="payment-loading">
                  <div className="loading-spinner" />

                  <span>
                    Loading student verification...
                  </span>
                </div>
              ) : (
                <div className="student-select-wrapper">

                  <label htmlFor="student-verification-code">
                    Student Verification Code
                  </label>

                  <div
                    className={`verification-input-wrapper ${
                      verifiedStudent
                        ? "verification-input-verified"
                        : ""
                    }`}
                  >
                    <input
                      id="student-verification-code"
                      type="text"
                      value={studentVerificationCode}
                      onChange={handleVerificationCodeChange}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          verifyStudent();
                        }
                      }}
                      placeholder="Enter Student Verification Code"
                      autoComplete="off"
                      spellCheck="false"
                      disabled={verifyingStudent}
                    />

                    <button
                      type="button"
                      onClick={verifyStudent}
                      disabled={
                        verifyingStudent ||
                        !studentVerificationCode.trim()
                      }
                    >
                      {verifyingStudent
                        ? "Verifying..."
                        : "Verify Student"}
                    </button>
                  </div>

                  <p className="verification-help">
                    Enter the verification code assigned to the
                    student.
                  </p>

                  {/* Verified student */}
                  {verifiedStudent && (
                    <div className="selected-student">
                      <div className="student-avatar">
                        {(verifiedStudent.name || "S")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="selected-student-info">
                        <strong>
                          {verifiedStudent.name || "Student"}
                        </strong>

                        <span>
                          {verifiedStudent.className ||
                            "Class not assigned"}
                        </span>

                        <small>
                          Code:{" "}
                          {getStudentVerificationCode(
                            verifiedStudent
                          ) || studentVerificationCode}
                        </small>
                      </div>

                      <div className="student-check">✓</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fees */}
            <div className="payment-section">
              <div className="section-heading">
                <div className="section-number">02</div>

                <div>
                  <h2>Payment items</h2>

                  <p>
                    Select the fees you want to include in this
                    payment.
                  </p>
                </div>
              </div>

              {!verifiedStudent ? (
                <div className="empty-state">
                  <div className="empty-icon">✓</div>

                  <h3>Verify the student first</h3>

                  <p>
                    Enter and verify the Student Verification Code
                    before selecting payment items.
                  </p>
                </div>
              ) : loadingStudents ? (
                <div className="payment-loading">
                  <div className="loading-spinner" />

                  <span>
                    Loading available fees...
                  </span>
                </div>
              ) : feeStructures.length ? (
                <div className="fee-list">
                  {feeStructures.map((fee) => {
                    const selected = Boolean(
                      selectedFees[fee.id]
                    );

                    return (
                      <div
                        key={fee.id}
                        className={`fee-card ${
                          selected
                            ? "fee-card-selected"
                            : ""
                        }`}
                        onClick={() => toggleFee(fee)}
                      >
                        <div className="fee-card-left">
                          <div
                            className={`custom-checkbox ${
                              selected ? "checked" : ""
                            }`}
                          >
                            {selected && "✓"}
                          </div>

                          <div className="fee-info">
                            <div className="fee-name">
                              {fee.name ||
                                fee.category ||
                                "School fee"}
                            </div>

                            <div className="fee-meta">
                              {fee.className ||
                                "School fee"}

                              {fee.term
                                ? ` • ${fee.term}`
                                : ""}
                            </div>
                          </div>
                        </div>

                        <div className="fee-card-right">
                          <strong>
                            {formatMoney(fee.amount)}
                          </strong>

                          {fee.quantityRequired && (
                            <span className="quantity-label">
                              per item
                            </span>
                          )}
                        </div>

                        {selected &&
                          fee.quantityRequired && (
                            <div
                              className="quantity-control"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <label
                                htmlFor={`quantity-${fee.id}`}
                              >
                                Quantity
                              </label>

                              <div className="quantity-input">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      fee.id,
                                      Number(
                                        selectedFees[
                                          fee.id
                                        ] || 1
                                      ) - 1
                                    )
                                  }
                                  disabled={
                                    Number(
                                      selectedFees[
                                        fee.id
                                      ] || 1
                                    ) <= 1
                                  }
                                >
                                  −
                                </button>

                                <input
                                  id={`quantity-${fee.id}`}
                                  type="number"
                                  min="1"
                                  value={
                                    selectedFees[
                                      fee.id
                                    ] || 1
                                  }
                                  onChange={(event) =>
                                    changeQuantity(
                                      fee.id,
                                      event.target.value
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      fee.id,
                                      Number(
                                        selectedFees[
                                          fee.id
                                        ] || 1
                                      ) + 1
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">₦</div>

                  <h3>No payment items available</h3>

                  <p>
                    There are currently no active fees available
                    for payment.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Summary */}
          <aside className="payment-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <div>
                  <span className="summary-label">
                    PAYMENT SUMMARY
                  </span>

                  <h2>Your payment</h2>
                </div>

                <div className="summary-count">
                  {selectedCount}
                </div>
              </div>

              <div className="summary-divider" />

              {/* Verified student */}
              {verifiedStudent && (
                <div className="summary-student">
                  <span>Student</span>

                  <strong>
                    {verifiedStudent.name || "Student"}
                  </strong>

                  <small>
                    {verifiedStudent.className ||
                      "Class not assigned"}
                  </small>
                </div>
              )}

              <div className="summary-items">
                {selectedFeeItems.length ? (
                  feeStructures
                    .filter(
                      (fee) => selectedFees[fee.id]
                    )
                    .map((fee) => {
                      const quantity =
                        fee.quantityRequired
                          ? Number(
                              selectedFees[fee.id]
                            ) || 1
                          : 1;

                      return (
                        <div
                          className="summary-item"
                          key={fee.id}
                        >
                          <div>
                            <span>
                              {fee.name ||
                                fee.category ||
                                "School fee"}
                            </span>

                            {quantity > 1 && (
                              <small>
                                {quantity} ×{" "}
                                {formatMoney(
                                  fee.amount
                                )}
                              </small>
                            )}
                          </div>

                          <strong>
                            {formatMoney(
                              Number(fee.amount) *
                                quantity
                            )}
                          </strong>
                        </div>
                      );
                    })
                ) : (
                  <div className="summary-empty">
                    <span>No items selected</span>

                    <small>
                      Select a fee to see it here.
                    </small>
                  </div>
                )}
              </div>

              <div className="summary-total">
                <span>Total amount</span>

                <strong>
                  {formatMoney(totalAmount)}
                </strong>
              </div>

              <button
                type="button"
                className="pay-button"
                onClick={continuePayment}
                disabled={
                  processingPayment ||
                  loadingStudents ||
                  !verifiedStudent ||
                  !selectedStudentId ||
                  !selectedFeeItems.length
                }
              >
                {processingPayment ? (
                  <>
                    <span className="button-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatMoney(totalAmount)}
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="paystack-note">
                <span className="paystack-dot" />
                Secured by Paystack
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Payment;