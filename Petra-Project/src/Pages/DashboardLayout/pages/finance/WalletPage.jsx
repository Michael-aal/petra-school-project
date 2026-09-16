import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const [form, setForm] = useState({
    amount: "",
    recipient: "",
    note: "",
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    pin: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [newPin, setNewPin] = useState("");
  const withdrawalRequestKeyRef = useRef(null);

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

  const handleSetPin = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPinLoading(true);
    try {
      await walletApi.setWithdrawalPin(newPin);
      setNewPin("");
      setMessage("Withdrawal PIN configured successfully.");
      await loadWallet();
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to configure withdrawal PIN.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    if (loading || withdrawalRequestKeyRef.current) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    const requestKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `withdraw_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    withdrawalRequestKeyRef.current = requestKey;

    try {
      const result = await walletApi.withdraw(
        {
          amount: form.amount,
          description: form.note,
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          pin: form.pin,
        },
        requestKey,
      );
      setMessage(
        result.duplicate
          ? "This withdrawal was already received. No second withdrawal was created."
          : "Withdrawal request created successfully and is pending processing.",
      );
      setForm((current) => ({ ...current, amount: "", note: "", pin: "" }));
      await loadWallet();
      withdrawalRequestKeyRef.current = null;
    } catch (err) {
      setError(err.data?.message || err.message || "Withdrawal failed.");
      // Keep the same key after an uncertain network failure so a retry cannot create a second withdrawal.
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
      setForm((current) => ({ ...current, amount: "", recipient: "", note: "" }));
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
      { label: "Available Balance", value: wallet?.balance ?? 0, icon: WalletIcon },
      { label: "Total Deposits", value: summary?.totalDeposits ?? 0, icon: Banknote },
      { label: "Withdrawals", value: summary?.totalWithdrawals ?? 0, icon: ArrowRightLeft },
      { label: "Transfers", value: summary?.totalTransfers ?? 0, icon: Send },
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
          <h1>{schoolName} Wallet</h1>
          <p className="dashboard-page-copy">
            Monitor balances, move funds, and review transaction history from one clean control center.
          </p>
          <div className="wallet-hero-metrics">
            <div><span>Balance</span><strong>{formatCurrency(wallet?.balance)}</strong></div>
            <div><span>Available</span><strong>{formatCurrency(summary?.availableBalance ?? wallet?.balance)}</strong></div>
            <div><span>Pending</span><strong>{formatCurrency(summary?.pendingBalance)}</strong></div>
          </div>
        </div>
        <div className="wallet-hero-meta">
          <div className="wallet-hero-chip"><ShieldCheck size={16} /><span>Bank-grade secure</span></div>
          <div className="wallet-hero-chip wallet-hero-chip-ghost"><Landmark size={16} /><span>{wallet?.bankName || `${schoolName} Bank`}</span></div>
          <div className="wallet-hero-chip wallet-hero-chip-ghost"><Clock size={16} /><span>Updated now</span></div>
        </div>
      </section>

      <div className="wallet-grid">
        <section className="wallet-panel wallet-panel-summary">
          <div className="wallet-panel-header">
            <div><p className="wallet-panel-eyebrow">Overview</p><h3>Account Snapshot</h3></div>
            <span className="wallet-panel-status">Updated now</span>
          </div>
          <div className="wallet-balance-card">
            <div className="wallet-balance-copy"><span>Current Balance</span><h2>{formatCurrency(wallet?.balance)}</h2><p>Funds available for withdrawals, transfers, and wallet operations.</p></div>
            <div className="wallet-account-id"><span>Account Number</span><strong>{wallet?.accountNumber || "XXXXXXXXXX"}</strong><small>{wallet?.bankName || `${schoolName} Bank`}</small></div>
          </div>
          <div className="wallet-summary-cards">
            {summaryCards.map((item) => <article key={item.label} className="wallet-summary-card"><div><span>{item.label}</span><strong>{formatCurrency(item.value)}</strong></div><div className="wallet-summary-icon"><item.icon size={18} /></div></article>)}
          </div>
          <div className="wallet-quick-stats">
            {quickStats.map((item) => <div key={item.label} className="wallet-quick-stat"><div className="wallet-quick-stat-icon"><item.icon size={16} /></div><div><span>{item.label}</span><strong>{item.value}</strong></div></div>)}
          </div>
        </section>

        <section className="wallet-panel wallet-panel-actions">
          <div className="wallet-panel-header">
            <div><p className="wallet-panel-eyebrow">Actions</p><h3>Quick operations</h3></div>
            <span className="wallet-panel-status">{activeTab.replace(/([A-Z])/g, " $1").trim()}</span>
          </div>
          <div className="wallet-action-buttons" role="tablist" aria-label="Wallet actions">
            {[{key:"overview",label:"Overview"},{key:"transfer",label:"Transfer"},{key:"withdraw",label:"Withdraw"},{key:"fund",label:"Fund Wallet"},{key:"history",label:"Transactions"},{key:"analytics",label:"Analytics"},{key:"settings",label:"Settings"},{key:"bank",label:"Bank Info"},{key:"refunds",label:"Refunds"},{key:"statement",label:"Statement"}].map((tab) => <button key={tab.key} type="button" className={`wallet-action-pill ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
          </div>
          {message && <div className="dashboard-alert success">{message}</div>}
          {error && <div className="dashboard-alert error">{error}</div>}

          {activeTab === "overview" && <div className="wallet-summary-stack">
            <div className="wallet-action-card"><div><h4>Available balance</h4><p>{formatCurrency(summary?.availableBalance)}</p></div><div className="wallet-action-icon"><WalletIcon size={18} /></div></div>
            <div className="wallet-action-card"><div><h4>Pending payments</h4><p>{formatCurrency(summary?.pendingBalance)}</p></div><div className="wallet-action-icon"><Clock size={18} /></div></div>
            <div className="wallet-action-card"><div><h4>Outstanding fees</h4><p>{formatCurrency(summary?.outstandingFees)}</p></div><div className="wallet-action-icon"><Banknote size={18} /></div></div>
          </div>}

          {activeTab === "history" && <div className="wallet-transaction-list"><p className="dashboard-page-copy">Recent wallet and payment activity.</p>{transactions.length === 0 ? <p className="wallet-empty-state">No recent transactions available yet.</p> : <table className="wallet-table"><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td>{item.reference || item.id}</td><td>{formatCurrency(item.amount)}</td><td>{item.status || item.type || "—"}</td><td>{new Date(item.paidAt || item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}</div>}

          {activeTab === "analytics" && <div className="wallet-summary-stack">
            <div className="wallet-action-card"><div><h4>Total revenue</h4><p>{formatCurrency(summary?.totalRevenue)}</p></div><div className="wallet-action-icon"><BarChart3 size={18} /></div></div>
            <div className="wallet-action-card"><div><h4>Today&apos;s revenue</h4><p>{formatCurrency(summary?.todaysRevenue)}</p></div><div className="wallet-action-icon"><RefreshCcw size={18} /></div></div>
            <div className="wallet-action-card"><div><h4>Monthly revenue</h4><p>{formatCurrency(summary?.monthlyRevenue)}</p></div><div className="wallet-action-icon"><ChartNoAxesCombined size={18} /></div></div>
          </div>}

          {activeTab === "settings" && <div className="wallet-action-form">
            <p className="dashboard-page-copy">Payment settings and bank transfer options managed by the school.</p>
            <form onSubmit={handleSetPin} className="wallet-action-form">
              <label><span>{summary?.withdrawalPinConfigured ? "Change withdrawal PIN" : "Create withdrawal PIN"}</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))} placeholder="4–6 digit PIN" /></label>
              <button type="submit" disabled={pinLoading || !/^\d{4,6}$/.test(newPin)}>{pinLoading ? "Saving..." : summary?.withdrawalPinConfigured ? "Change PIN" : "Set withdrawal PIN"}</button>
            </form>
            {settings.length === 0 ? <p>No payment settings configured yet.</p> : settings.map((setting) => <div key={setting.key} className="wallet-action-card"><div><h4>{setting.key}</h4><p>{setting.value}</p></div></div>)}
          </div>}

          {activeTab === "bank" && <div className="wallet-action-form"><p className="dashboard-page-copy">School bank details for direct payments and refunds.</p><div className="wallet-action-card"><div><h4>Bank name</h4><p>{bankDetails?.bankName || wallet?.bankName || `${schoolName} Bank`}</p></div></div><div className="wallet-action-card"><div><h4>Account number</h4><p>{bankDetails?.accountNumber || wallet?.accountNumber || "Not available"}</p></div></div><div className="wallet-action-card"><div><h4>Account name</h4><p>{bankDetails?.accountName || wallet?.accountName || "Not available"}</p></div></div></div>}

          {activeTab === "refunds" && <div className="wallet-transaction-list"><p className="dashboard-page-copy">Recent refunded payments.</p>{refunds.length === 0 ? <p className="wallet-empty-state">No refunded payments yet.</p> : <table className="wallet-table"><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{refunds.map((item) => <tr key={item.id}><td>{item.reference}</td><td>{formatCurrency(item.amount)}</td><td>{item.status}</td><td>{new Date(item.paidAt || item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}</div>}

          {activeTab === "withdraw" && <div className="wallet-action-form">
            {!summary?.withdrawalPinConfigured && <div className="dashboard-alert error">Set a withdrawal PIN in Wallet → Settings before making a withdrawal.</div>}
            <form className="wallet-action-form" onSubmit={handleWithdraw}>
              <label><span>Bank code</span><input name="bankCode" type="text" value={form.bankCode} onChange={handleChange} placeholder="e.g. 044" required /></label>
              <label><span>Bank name</span><input name="bankName" type="text" value={form.bankName} onChange={handleChange} placeholder="e.g. Access Bank" required /></label>
              <label><span>Destination account number</span><input name="accountNumber" type="text" inputMode="numeric" maxLength={20} value={form.accountNumber} onChange={handleChange} placeholder="Enter account number" required /></label>
              <label><span>Account name</span><input name="accountName" type="text" value={form.accountName} onChange={handleChange} placeholder="Verified account name" required /></label>
              <label><span>Withdraw amount</span><input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Enter amount" required /></label>
              <label><span>Description</span><input name="note" type="text" value={form.note} onChange={handleChange} placeholder="Optional note" /></label>
              <label><span>Withdrawal PIN</span><input name="pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} value={form.pin} onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "") }))} placeholder="4–6 digit PIN" required /></label>
              <button type="submit" disabled={loading || !summary?.withdrawalPinConfigured}>{loading ? "Processing..." : "Withdraw funds"}</button>
            </form>
          </div>}

          {activeTab === "transfer" && <form className="wallet-action-form" onSubmit={handleTransfer}><label><span>Recipient email or account</span><input name="recipient" type="text" value={form.recipient} onChange={handleChange} placeholder="Enter recipient email or account number" /></label><label><span>Transfer amount</span><input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Enter amount" /></label><label><span>Note</span><input name="note" type="text" value={form.note} onChange={handleChange} placeholder="Optional note" /></label><button type="submit" disabled={loading}>{loading ? "Processing..." : "Send transfer"}</button></form>}

          {activeTab === "fund" && <form className="wallet-action-form" onSubmit={handleFund}><label><span>Fund amount</span><input type="number" min="0" step="0.01" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} placeholder="Amount to add" /></label><button type="submit" disabled={loading || !fundAmount}>{loading ? "Opening checkout..." : "Fund wallet"}</button></form>}

          {activeTab === "statement" && <div className="wallet-transaction-list"><p className="dashboard-page-copy">Recent transaction history for your wallet.</p>{transactions.length === 0 ? <p className="wallet-empty-state">No transaction history available yet.</p> : <table className="wallet-table"><thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td>{item.type}</td><td>{formatCurrency(item.amount)}</td><td>{item.description || "—"}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}</div>}
        </section>
      </div>
    </div>
  );
}
