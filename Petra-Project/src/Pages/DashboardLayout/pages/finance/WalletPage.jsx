import { useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Banknote,
  ChartNoAxesCombined,
  Clock,
  CreditCard,
  Landmark,
  RefreshCcw,
  Send,
  ShieldCheck,
  Wallet as WalletIcon,
  BarChart3,
} from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { walletApi } from "../../../../services/walletApi";
import "./page-styles/WalletPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function WalletPage() {
  const { userInfo } = useContext(UserContext);
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [bankDetails, setBankDetails] = useState({});
  const [refunds, setRefunds] = useState([]);
  const [settings, setSettings] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState({ amount: "", recipient: "", note: "" });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  // DYNAMIC: Get school name for wallet branding
  const schoolName = userInfo?.institution || "School";

  const loadWallet = async () => {
    setError(null);
    try {
      const data = await walletApi.getAdminWallet();
      setWallet(data.wallet || data.summary?.wallet || null);
      setSummary(data.summary || {});
      setTransactions(data.recentPayments || data.transactions || []);
      setBankDetails(data.bankDetails || {});
      setRefunds(data.refunds || []);
      setSettings(data.settings || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load wallet data.");
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await walletApi.withdraw({ amount: form.amount, description: form.note });
      setMessage("Withdrawal successful. Your balance has been updated.");
      setForm({ amount: "", recipient: "", note: "" });
      await loadWallet();
    } catch (err) {
      setError(err.data?.message || err.message || "Withdrawal failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await walletApi.transfer({ recipient: form.recipient, amount: form.amount, note: form.note });
      setMessage("Transfer completed successfully.");
      setForm({ amount: "", recipient: "", note: "" });
      await loadWallet();
    } catch (err) {
      setError(err.data?.message || err.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const data = await walletApi.initializePaystack(fundAmount);
      if (data?.session?.authorization_url) {
        window.location.href = data.session.authorization_url;
        return;
      }
      setError("Unable to start payment flow.");
    } catch (err) {
      setError(err.data?.message || err.message || "Fund wallet failed.");
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: "Available Balance", value: wallet?.balance ?? 0, accent: "indigo", icon: WalletIcon },
      { label: "Total Deposits", value: summary?.totalDeposits ?? 0, accent: "emerald", icon: Banknote },
      { label: "Withdrawals", value: summary?.totalWithdrawals ?? 0, accent: "rose", icon: ArrowRightLeft },
      { label: "Transfers", value: summary?.totalTransfers ?? 0, accent: "amber", icon: Send },
    ],
    [wallet, summary],
  );

  const quickStats = useMemo(
    () => [
      { label: "Wallet ID", value: wallet?.accountNumber || "XXXXXXXXXX", icon: CreditCard },
      { label: "Bank", value: bankDetails?.bankName || wallet?.bankName || `${schoolName} Bank`, icon: Landmark },
      { label: "Status", value: "Live analytics", icon: ShieldCheck },
    ],
    [wallet, bankDetails, schoolName],
  );

  return (
    <div className="dashboard-page wallet-page">
      <section className="wallet-hero">
        <div className="wallet-hero-copy">
          <p className="dashboard-page-label">Wallet Dashboard</p>
          {/* DYNAMIC: Uses school name */}
          <h1>{schoolName} Wallet</h1>
          <p className="dashboard-page-copy">
            Monitor balances, move funds, and review transaction history from one clean control center.
          </p>
        </div>
        <div className="wallet-hero-meta">
          <div className="wallet-hero-chip">
            <ShieldCheck size={15} />
            <span>Bank-grade secure</span>
          </div>
          <div className="wallet-hero-chip wallet-hero-chip-ghost">
            <Landmark size={15} />
            {/* DYNAMIC: Uses school name */}
            <span>{wallet?.bankName || `${schoolName} Bank`}</span>
          </div>
        </div>
      </section>

      <div className="wallet-grid">
        <section className="wallet-panel wallet-panel-summary">
          <div className="wallet-panel-header">
            <div>
              <p className="wallet-panel-eyebrow">Overview</p>
              <h3>Account Snapshot</h3>
            </div>
            <span className="wallet-panel-status">Updated now</span>
          </div>

          <div className="wallet-balance-card">
            <div className="wallet-balance-copy">
              <span>Current Balance</span>
              <h2>{formatCurrency(wallet?.balance)}</h2>
              <p>Funds available for withdrawals and transfers.</p>
            </div>
            <div className="wallet-account-id">
              <span>Account Number</span>
              <strong>{wallet?.accountNumber || "XXXXXXXXXX"}</strong>
              <small>{wallet?.bankName || `${schoolName} Bank`}</small>
            </div>
          </div>

          <div className="wallet-summary-cards">
            {summaryCards.map((item) => (
              <article key={item.label} className={`wallet-summary-card tone-${item.accent}`}>
                <div className="wallet-summary-copy">
                  <p>{item.label}</p>
                  <strong>{formatCurrency(item.value)}</strong>
                </div>
                <div className={`wallet-summary-icon tone-${item.accent}`}>
                  <item.icon size={16} />
                </div>
              </article>
            ))}
          </div>

          <div className="wallet-quick-stats">
            {quickStats.map((item) => (
              <div key={item.label} className="wallet-quick-stat">
                <div className="wallet-quick-stat-icon">
                  <item.icon size={16} />
                </div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wallet-panel wallet-panel-actions">
          <div className="wallet-panel-header">
            <div>
              <p className="wallet-panel-eyebrow">Actions</p>
              <h3>Quick Operations</h3>
            </div>
            <span className="wallet-panel-status">{activeTab.toUpperCase()}</span>
          </div>

              <div className="wallet-action-buttons" role="tablist" aria-label="Wallet actions">
            <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
            <button type="button" className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Transaction History</button>
            <button type="button" className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>Revenue Analytics</button>
            <button type="button" className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Payment Settings</button>
            <button type="button" className={activeTab === "bank" ? "active" : ""} onClick={() => setActiveTab("bank")}>Bank Details</button>
            <button type="button" className={activeTab === "refunds" ? "active" : ""} onClick={() => setActiveTab("refunds")}>Refunds</button>
          </div>

          {message && <div className="dashboard-alert success">{message}</div>}
          {error && <div className="dashboard-alert error">{error}</div>}

          {activeTab === "overview" && (
            <div className="wallet-summary-stack">
              <div className="wallet-action-card">
                <div>
                  <h4>Available balance</h4>
                  <p>{formatCurrency(summary?.availableBalance)}</p>
                </div>
                <div className="wallet-action-icon"><WalletIcon size={18} /></div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Pending payments</h4>
                  <p>{formatCurrency(summary?.pendingBalance)}</p>
                </div>
                <div className="wallet-action-icon"><Clock size={18} /></div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Outstanding fees</h4>
                  <p>{formatCurrency(summary?.outstandingFees)}</p>
                </div>
                <div className="wallet-action-icon"><Banknote size={18} /></div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="wallet-transaction-list">
              <p className="dashboard-page-copy">Recent wallet and payment activity.</p>
              {transactions.length === 0 ? (
                <p className="wallet-empty-state">No recent transactions available yet.</p>
              ) : (
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.reference || item.id}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.status || item.type || "—"}</td>
                        <td>{new Date(item.paidAt || item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="wallet-summary-stack">
              <div className="wallet-action-card">
                <div>
                  <h4>Total revenue</h4>
                  <p>{formatCurrency(summary?.totalRevenue)}</p>
                </div>
                <div className="wallet-action-icon"><BarChart3 size={18} /></div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Today's revenue</h4>
                  <p>{formatCurrency(summary?.todaysRevenue)}</p>
                </div>
                <div className="wallet-action-icon"><RefreshCcw size={18} /></div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Monthly revenue</h4>
                  <p>{formatCurrency(summary?.monthlyRevenue)}</p>
                </div>
                <div className="wallet-action-icon"><ChartNoAxesCombined size={18} /></div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="wallet-action-form">
              <p className="dashboard-page-copy">Payment settings and bank transfer options managed by the school.</p>
              {settings.length === 0 ? (
                <p>No payment settings configured yet.</p>
              ) : (
                settings.map((setting) => (
                  <div key={setting.key} className="wallet-action-card">
                    <div>
                      <h4>{setting.key}</h4>
                      <p>{setting.value}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "bank" && (
            <div className="wallet-action-form">
              <p className="dashboard-page-copy">School bank details for direct payments and refunds.</p>
              <div className="wallet-action-card">
                <div>
                  <h4>Bank name</h4>
                  <p>{bankDetails?.bankName || wallet?.bankName || `${schoolName} Bank`}</p>
                </div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Account number</h4>
                  <p>{bankDetails?.accountNumber || wallet?.accountNumber || "Not available"}</p>
                </div>
              </div>
              <div className="wallet-action-card">
                <div>
                  <h4>Account name</h4>
                  <p>{bankDetails?.accountName || wallet?.accountName || "Petra School Wallet"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "refunds" && (
            <div className="wallet-transaction-list">
              <p className="dashboard-page-copy">Recent refunded payments.</p>
              {refunds.length === 0 ? (
                <p className="wallet-empty-state">No refunded payments yet.</p>
              ) : (
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((item) => (
                      <tr key={item.id}>
                        <td>{item.reference}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.status}</td>
                        <td>{new Date(item.paidAt || item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "withdraw" && (
            <form className="wallet-action-form" onSubmit={handleWithdraw}>
              <label>
                Withdraw amount
                <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Enter amount" />
              </label>
              <label>
                Description
                <input name="note" type="text" value={form.note} onChange={handleChange} placeholder="Optional note" />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Withdraw funds"}
              </button>
            </form>
          )}

          {activeTab === "transfer" && (
            <form className="wallet-action-form" onSubmit={handleTransfer}>
              <label>
                Recipient email or account
                <input name="recipient" type="text" value={form.recipient} onChange={handleChange} placeholder="Enter recipient email or account number" />
              </label>
              <label>
                Transfer amount
                <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Enter amount" />
              </label>
              <label>
                Note
                <input name="note" type="text" value={form.note} onChange={handleChange} placeholder="Optional note" />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Send transfer"}
              </button>
            </form>
          )}

          {activeTab === "fund" && (
            <form className="wallet-action-form" onSubmit={handleFund}>
              <label>
                Fund amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fundAmount}
                  onChange={(event) => setFundAmount(event.target.value)}
                  placeholder="Amount to add"
                />
              </label>
              <button type="submit" disabled={loading || !fundAmount}>
                {loading ? "Opening checkout..." : "Fund wallet"}
              </button>
            </form>
          )}

          {activeTab === "statement" && (
            <div className="wallet-transaction-list">
              <p className="dashboard-page-copy">Recent transaction history for your wallet.</p>
              {transactions.length === 0 ? (
                <p className="wallet-empty-state">No transaction history available yet.</p>
              ) : (
                <table className="wallet-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.type}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.description || "—"}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}