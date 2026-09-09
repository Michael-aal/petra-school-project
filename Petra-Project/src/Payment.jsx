import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Payment.css";
import { financeApi } from "./services/financeApi";

const APPLICATION_FEE = 15000;

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

function Payment() {
  const navigate = useNavigate();
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      setLoadingStudents(true);
      setError("");
      try {
        const response = await financeApi.parentFees();
        const students = Array.isArray(response?.children) ? response.children : [];
        if (!active) return;

        setLinkedStudents(students);
        if (students.length) {
          const first = students[0];
          setSelectedStudentId(first?.id || "");
        }
      } catch (requestError) {
        if (!active) return;
        if (requestError.status === 401) {
          navigate("/signin", { replace: true });
          return;
        }
        setError(requestError.data?.message || requestError.message || "Unable to load your linked students.");
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, [navigate]);

  const continuePayment = async () => {
    if (!selectedStudentId) {
      setError("Select a linked student before continuing.");
      return;
    }

    setProcessingPayment(true);
    setError("");
    setSuccess("");

    try {
      const response = await financeApi.createPayment({
        studentId: selectedStudentId,
        amount: APPLICATION_FEE,
        method: "Paystack",
        note: "Admission application fee",
      });

      const checkoutUrl = response?.session?.authorization_url || response?.session?.data?.authorization_url;

      if (!checkoutUrl) {
        localStorage.setItem("petra_application_fee_paid", "true");
        localStorage.setItem("petra_application_student_id", selectedStudentId);
        setSuccess("Application payment initialized. Please check the payment status in your account.");
        return;
      }

      localStorage.setItem("petra_application_fee_paid", "true");
      localStorage.setItem("petra_application_student_id", selectedStudentId);
      window.location.assign(checkoutUrl);
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/signin", { replace: true });
        return;
      }
      setError(requestError.data?.message || requestError.message || "Unable to initialize the application payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const selectedStudent = linkedStudents.find((student) => student.id === selectedStudentId) || null;

  return (
    <div className="payment-screen">
      <div className="payment-container">
        <div className="payment-header">
          <div className="logo">PETRA</div>
          <span>School Portal</span>
        </div>

        <div className="payment-content">
          <div className="payment-title">
            <h1>Pay Application Fee</h1>
            <p>
              Complete your application fee to unlock and submit the admission form.
            </p>
          </div>

          <div className="payment-card">
            {error ? <div className="payment-error" role="alert">{error}</div> : null}
            {success ? <div className="payment-success" role="status">{success}</div> : null}

            <div className="payment-summary" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Application Fee</h3>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{formatMoney(APPLICATION_FEE)}</div>
            </div>

            <label>Linked Student</label>
            <div className="student-input" style={{ display: "block", marginTop: 8 }}>
              {loadingStudents ? (
                <p className="payment-muted">Loading linked students...</p>
              ) : linkedStudents.length ? (
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #dfe2ea" }}
                >
                  {linkedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name || "Student"} {student.className ? `(${student.className})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="payment-muted">No linked student was found for this parent account.</p>
              )}
            </div>

            {selectedStudent ? (
              <div className="student-result" style={{ marginTop: 16 }}>
                <div className="student-row">
                  <span>Student</span>
                  <strong>{selectedStudent.name}</strong>
                </div>
                <div className="student-row">
                  <span>Class</span>
                  <strong>{selectedStudent.className || "Not assigned"}</strong>
                </div>
                <div className="student-row">
                  <span>Application fee</span>
                  <strong>{formatMoney(APPLICATION_FEE)}</strong>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={continuePayment}
              disabled={processingPayment || loadingStudents || !selectedStudentId}
              className="payment-button"
              style={{ marginTop: 22, width: "100%" }}
            >
              {processingPayment ? "Processing payment..." : "Pay with Paystack"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;