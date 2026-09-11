import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Download, FileText, Wallet } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import { API_BASE_URL, readAuthToken } from "../../../../services/authApi";
import { getStudentDisplayName } from "../../../../utils/studentDisplay";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import "../page-styles/ParentDashboard.css";
import "./page-styles/ParentFeesPage.css";
import "../../../../components/dashboard/dashboard.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value || 0);

const statusBadge = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "successful") return "status-success";
  if (normalized === "pending") return "status-pending";
  if (normalized === "failed") return "status-failed";
  if (normalized === "refunded") return "status-refunded";
  return "status-default";
};

export default function ParentFeesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState(null);
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [payAmount, setPayAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const loadFees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.parentFees();
      setData(response);
      setSelectedFeeIds([]);
      setSelectedInvoiceIds([]);
      setPayAmount("");
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load fee data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const studentName = getStudentDisplayName(data?.student || {}) || "Student";
  const childCount = data?.children?.length || 0;

  const outstandingFees = useMemo(() => {
    if (!data?.fees) return 0;
    return data.fees.reduce((sum, fee) => sum + Number(fee.outstandingBalance || 0), 0);
  }, [data]);

  const paidAmount = useMemo(() => {
    if (!data?.payments) return 0;
    return data.payments.reduce((sum, payment) => (payment.status === "Successful" ? sum + Number(payment.amount || 0) : sum), 0);
  }, [data]);

  const totalDue = useMemo(() => outstandingFees, [outstandingFees]);

  const selectedAmount = useMemo(() => {
    const feeAmount = data?.fees
      ? data.fees
          .filter((fee) => selectedFeeIds.includes(fee.id))
          .reduce((sum, fee) => sum + Number(fee.outstandingBalance || 0), 0)
      : 0;
    const invoiceAmount = data?.invoices
      ? data.invoices
          .filter((invoice) => selectedInvoiceIds.includes(invoice.id))
          .reduce((sum, invoice) => sum + Number(invoice.outstandingBalance || 0), 0)
      : 0;
    return feeAmount + invoiceAmount;
  }, [data, selectedFeeIds, selectedInvoiceIds]);

  const toggleFeeSelection = (feeId) => {
    setSelectedFeeIds((current) =>
      current.includes(feeId) ? current.filter((id) => id !== feeId) : [...current, feeId],
    );
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoiceIds((current) =>
      current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId],
    );
  };

  const handlePay = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsPaying(true);
    try {
      const payload = {
        studentId: data.student.id,
        studentFeeIds: selectedFeeIds,
        invoiceIds: selectedInvoiceIds,
        amount: payAmount ? Number(payAmount) : selectedAmount || totalDue,
      };
      if (!payload.amount || payload.amount <= 0) {
        throw new Error("Enter an amount to pay or select fees/invoices.");
      }
      const response = await financeApi.createPayment(payload);
      if (response?.session?.authorization_url) {
        setMessage("Redirecting to Paystack checkout...");
        window.location.href = response.session.authorization_url;
        return;
      }
      setMessage("Payment session created successfully. Please complete the checkout.");
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to start payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const downloadReceipt = async (paymentId, receiptNumber) => {
    setError("");
    setMessage("");
    try {
      const token = readAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/finance/payments/${encodeURIComponent(paymentId)}/receipt`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to download receipt.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${receiptNumber || paymentId}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Receipt download started.");
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to download receipt.");
    }
  };

  const resetSelections = () => {
    setSelectedFeeIds([]);
    setSelectedInvoiceIds([]);
    setPayAmount("");
  };

  return (
    <div className="parent-dashboard dashboard-home">
      <DashboardHeader
        eyebrow="Parent Portal"
        title="School fees"
        subtitle="Review assigned fees, see outstanding balances, and pay securely with Paystack."
        badge={`${childCount} linked child${childCount === 1 ? "" : "ren"}`}
      />

      <div className="parent-chip-row">
        <span className="parent-chip">{studentName || "Student details unavailable"}</span>
        <span className="parent-chip">{formatCurrency(totalDue)} due</span>
        <span className="parent-chip">{formatCurrency(paidAmount)} paid</span>
      </div>

      {(message || error) && (
        <div className={`dashboard-alert ${error ? "error" : "success"}`}>
          {error || message}
        </div>
      )}

      <section className="parent-summary-grid">
        <StatCard label="Outstanding" value={formatCurrency(totalDue)} icon={Wallet} tone="blue" description="Current balance due" trend="Live" />
        <StatCard label="Paid" value={formatCurrency(paidAmount)} icon={CheckCircle2} tone="teal" description="Payments received" trend="Updated" />
        <StatCard label="Selected" value={formatCurrency(selectedAmount)} icon={FileText} tone="amber" description="Amount currently chosen" trend="Ready" />
        <StatCard label="Remaining" value={formatCurrency(Math.max(totalDue - paidAmount, 0))} icon={Clock} tone="rose" description="Balance still open" trend="Today" />
      </section>

      <section className="parent-grid">
        <div className="parent-section-stack">
          <DashboardWidget title="Assigned fees" subtitle="Learner balance">
            {loading ? (
              <p className="dashboard-page-copy">Loading assigned fees...</p>
            ) : !data?.fees?.length ? (
              <p className="dashboard-page-copy">No assigned fees were found for this learner.</p>
            ) : (
              <div className="parent-list">
                {data.fees.map((fee) => (
                  <div key={fee.id} className="parent-list-item">
                    <div>
                      <strong>{fee.feeStructure?.feeCategory?.name || fee.feeStructure?.className || "Fee"}</strong>
                      <p>{fee.feeStructure?.session || "Session unavailable"} • {fee.feeStructure?.term || "Term unavailable"}</p>
                      <p>{fee.feeStructure?.className ? `Class: ${fee.feeStructure.className}` : "All classes"}</p>
                    </div>
                    <div className="dashboard-home-account-row parent-list-item-actions">
                      <label className="parent-action-btn">
                        <input
                          type="checkbox"
                          checked={selectedFeeIds.includes(fee.id)}
                          onChange={() => toggleFeeSelection(fee.id)}
                        />
                        {formatCurrency(Number(fee.outstandingBalance || 0))}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget title="Invoices & fee breakdown" subtitle="Open charges">
            {loading ? (
              <p className="dashboard-page-copy">Loading invoices...</p>
            ) : !data?.invoices?.length ? (
              <p className="dashboard-page-copy">No invoices found for this student.</p>
            ) : (
              <div className="parent-list">
                {data.invoices.map((invoice) => (
                  <div key={invoice.id} className="parent-list-item">
                    <div>
                      <strong>{invoice.invoiceNumber}</strong>
                      <p>{invoice.status} • Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</p>
                      <p>{invoice.items?.map((item) => item.description).join(", ")}</p>
                    </div>
                    <div className="dashboard-home-account-row">
                      <button type="button" className="module-button ghost" onClick={() => toggleInvoiceSelection(invoice.id)}>
                        {selectedInvoiceIds.includes(invoice.id) ? "Unselect" : "Select"}
                      </button>
                      <span>{formatCurrency(Number(invoice.outstandingBalance || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>

        <div className="parent-section-stack">
          <DashboardWidget title="Pay selected fees" subtitle="Secure checkout">
            <form className="fees-form" onSubmit={handlePay}>
              <label>
                Amount to pay
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={selectedAmount ? `Selected fees total ${formatCurrency(selectedAmount)}` : "Enter amount or select fees"}
                />
              </label>
              <div className="fees-actions">
                <button type="submit" className="module-button" disabled={isPaying || loading}>
                  {isPaying ? "Processing..." : "Pay with Paystack"}
                </button>
                <button type="button" className="module-button ghost" onClick={resetSelections} disabled={isPaying || loading}>
                  Reset selections
                </button>
              </div>
              <p className="dashboard-page-copy fees-notice">
                The system records the payment as pending, redirects you to Paystack, then verifies the transaction on webhook callback.
              </p>
            </form>
          </DashboardWidget>

          <DashboardWidget title="Payment history" subtitle="Recent activity">
            {loading ? (
              <p className="dashboard-page-copy">Loading history...</p>
            ) : !data?.payments?.length ? (
              <p className="dashboard-page-copy">No payments have been processed yet.</p>
            ) : (
              <div className="parent-list">
                {data.payments.slice(0, 8).map((payment) => (
                  <div key={payment.id} className="parent-list-item">
                    <div>
                      <strong>{payment.reference}</strong>
                      <p>{payment.method} • {new Date(payment.paidAt).toLocaleDateString()}</p>
                    </div>
                    <div className="dashboard-home-account-row">
                      <span className={`parent-pill ${statusBadge(payment.status)}`}>{payment.status}</span>
                      {payment.receiptNumber ? (
                        <button
                          type="button"
                          className="module-button ghost"
                          onClick={() => downloadReceipt(payment.id, payment.receiptNumber)}
                        >
                          <Download size={14} /> Receipt
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>
      </section>
    </div>
  );
}
