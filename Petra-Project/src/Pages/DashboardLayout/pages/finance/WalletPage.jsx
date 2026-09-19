import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Landmark,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { walletApi } from "../../../../services/walletApi";
import "./page-styles/WalletPage.css";

const formatCurrency = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number(value) || 0);
const formatDate = (value) => { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }); };
const maskAccount = (value) => { const account = String(value || ""); return account.length >= 4 ? `•••• ${account.slice(-4)}` : account || "Not connected"; };

export default function WalletPage() {
  const { userInfo } = useContext(UserContext);
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [settings, setSettings] = useState([]);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [withdrawal, setWithdrawal] = useState({ amount: "", bankCode: "", bankName: "", accountNumber: "", accountName: "", pin: "", note: "" });
  const [accountForm, setAccountForm] = useState({ bankCode: "", accountNumber: "", contactName: "", contactEmail: "", contactPhone: "" });
  const [transfer, setTransfer] = useState({ amount: "", recipient: "", note: "" });
  const withdrawalRequestKeyRef = useRef(null);

  const schoolName = userInfo?.institution || "School";
  const isFinanceAdmin = ["principal", "super_admin"].includes(String(userInfo?.role || "").toLowerCase());

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [data, accountData] = await Promise.all([
        walletApi.getAdminWallet(),
        isFinanceAdmin ? walletApi.getSchoolPaymentAccount() : Promise.resolve({ account: null }),
      ]);
      setWallet(data.wallet || data.summary?.wallet || null);
      setSummary(data.summary || {});
      setTransactions(data.recentPayments || data.transactions || []);
      setRefunds(data.refunds || []);
      setSettings(data.settings || []);
      setPaymentAccount(accountData.account || null);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load wallet data.");
    }
  }, [isFinanceAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const clearNotice = () => { setMessage(null); setError(null); };
  const showError = (err, fallback) => { setError(err.data?.message || err.message || fallback); setMessage(null); };

  const handleSetupAccount = async (event) => {
    event.preventDefault(); clearNotice(); setAccountLoading(true);
    try {
      const result = await walletApi.setupSchoolPaymentAccount(accountForm);
      setPaymentAccount(result.account || null); setMessage("School payment account connected successfully."); setActiveView("overview"); await loadData();
    } catch (err) { showError(err, "Unable to connect the school payment account."); }
    finally { setAccountLoading(false); }
  };

  const handleSetPin = async (event) => {
    event.preventDefault(); clearNotice(); setPinLoading(true);
    try {
      await walletApi.setWithdrawalPin(newPin); setNewPin(""); setMessage(summary?.withdrawalPinConfigured ? "Withdrawal PIN changed successfully." : "Withdrawal PIN created successfully."); await loadData();
    } catch (err) { showError(err, "Unable to configure the withdrawal PIN."); }
    finally { setPinLoading(false); }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    if (loading || withdrawalRequestKeyRef.current) return;
    clearNotice(); setLoading(true);
    const requestKey = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `withdraw_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    withdrawalRequestKeyRef.current = requestKey;
    try {
      const result = await walletApi.withdraw(withdrawal, requestKey);
      setMessage(result.duplicate ? "That withdrawal was already received; no duplicate was created." : "Withdrawal request created and is pending processing.");
      setWithdrawal((current) => ({ ...current, amount: "", pin: "", note: "" }));
      withdrawalRequestKeyRef.current = null; await loadData();
    } catch (err) { showError(err, "Withdrawal failed. The request key has been retained for a safe retry."); }
    finally { setLoading(false); }
  };

  const handleTransfer = async (event) => {
    event.preventDefault(); clearNotice(); setLoading(true);
    try { await walletApi.transfer(transfer); setMessage("Transfer completed successfully."); setTransfer({ amount: "", recipient: "", note: "" }); await loadData(); }
    catch (err) { showError(err, "Transfer failed."); }
    finally { setLoading(false); }
  };

  const downloadStatement = async () => {
    clearNotice(); setLoading(true);
    try {
      const data = await walletApi.getStatement({ limit: 100 });
      const rows = data?.transactions || data?.statement || data?.data || transactions;
      const csv = [["Reference", "Type", "Amount", "Status", "Date"], ...rows.map((item) => [item.reference || item.id || "", item.type || "", item.amount || 0, item.status || "", item.createdAt || item.paidAt || ""])].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `petra-wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); setMessage("Wallet statement downloaded.");
    } catch (err) { showError(err, "Unable to generate the wallet statement."); }
    finally { setLoading(false); }
  };

  const metrics = useMemo(() => [
    { label: "Available", value: summary?.availableBalance ?? wallet?.balance ?? 0, icon: WalletCards, tone: "primary" },
    { label: "Money received", value: summary?.totalDeposits ?? summary?.totalRevenue ?? 0, icon: ArrowDownLeft, tone: "positive" },
    { label: "Withdrawn", value: summary?.totalWithdrawals ?? 0, icon: ArrowUpRight, tone: "warning" },
    { label: "Pending", value: summary?.pendingBalance ?? 0, icon: Clock3, tone: "neutral" },
  ], [summary, wallet]);

  const recentActivity = transactions.slice(0, 5);
  const connected = paymentAccount?.status === "active";
  const navItems = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "setup", label: "Account", icon: Building2 },
    { key: "withdraw", label: "Withdraw", icon: ArrowUpRight },
    { key: "transfer", label: "Transfer", icon: Send },
    { key: "transactions", label: "Transactions", icon: ArrowRightLeft },
    { key: "security", label: "Security", icon: ShieldCheck },
  ];

  const field = (label, value, onChange, props = {}) => <label className="wallet-field"><span>{label}</span><input value={value} onChange={onChange} {...props} /></label>;

  return (
    <div className="dashboard-page wallet-page">
      <section className="wallet-hero">
        <div className="wallet-hero-orb wallet-hero-orb-one" /><div className="wallet-hero-orb wallet-hero-orb-two" />
        <div className="wallet-hero-main">
          <div className="wallet-kicker"><span className="wallet-live-dot" /> Live finance center</div>
          <h1>{schoolName} Wallet</h1>
          <p>Receive school payments, manage your balance, withdraw funds, and keep every movement visible from one place.</p>
          <div className="wallet-hero-actions"><button type="button" className="wallet-button wallet-button-light" onClick={() => setActiveView("withdraw")}><ArrowUpRight size={18} /> Withdraw</button><button type="button" className="wallet-button wallet-button-ghost" onClick={() => setActiveView("setup")}><Building2 size={18} /> {connected ? "Manage account" : "Connect account"}</button></div>
        </div>
        <div className="wallet-hero-balance"><div className="wallet-balance-top"><span>Available balance</span><WalletCards size={20} /></div><strong>{formatCurrency(summary?.availableBalance ?? wallet?.balance)}</strong><div className="wallet-balance-meta"><span>Pending {formatCurrency(summary?.pendingBalance)}</span><span>{connected ? "Account active" : "Setup required"}</span></div></div>
      </section>

      <div className="wallet-metric-grid">{metrics.map(({ label, value, icon: Icon, tone }) => <article className={`wallet-metric wallet-metric-${tone}`} key={label}><div className="wallet-metric-icon"><Icon size={19} /></div><div><span>{label}</span><strong>{formatCurrency(value)}</strong></div></article>)}</div>

      <section className="wallet-content-shell">
        <aside className="wallet-sidebar">
          <div className="wallet-sidebar-title"><div className="wallet-sidebar-logo"><WalletCards size={19} /></div><div><strong>Petra Wallet</strong><span>School finances</span></div></div>
          <nav className="wallet-nav" aria-label="Wallet sections">{navItems.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={activeView === key ? "active" : ""} onClick={() => { clearNotice(); setActiveView(key); }}><Icon size={18} /><span>{label}</span><ChevronRight size={15} /></button>)}</nav>
          <div className="wallet-sidebar-bottom"><div className="wallet-security-mini"><ShieldCheck size={17} /><div><strong>Protected</strong><span>Secure wallet controls</span></div></div><button type="button" className="wallet-refresh" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "wallet-spin" : ""} /> Refresh data</button></div>
        </aside>

        <main className="wallet-workspace">
          {message && <div className="wallet-alert wallet-alert-success"><CheckCircle2 size={18} /> <span>{message}</span></div>}
          {error && <div className="wallet-alert wallet-alert-error"><span>{error}</span></div>}

          {activeView === "overview" && <div className="wallet-view">
            {!connected && <section className="wallet-setup-banner"><div className="wallet-setup-icon"><WalletCards size={21} /></div><div className="wallet-setup-copy"><span>Finish your payment setup</span><strong>Connect the school settlement account</strong><p>Use the school's verified bank details to connect the payment account.</p></div><button type="button" className="wallet-button wallet-button-primary" onClick={() => setActiveView("setup")}>Set up <ChevronRight size={17} /></button></section>}
            <div className="wallet-section-heading"><div><span>Today</span><h2>Money at a glance</h2></div><button type="button" className="wallet-link-button" onClick={() => setActiveView("transactions")}>View all activity <ChevronRight size={16} /></button></div>
            <div className="wallet-overview-grid">
              <section className="wallet-card wallet-account-card"><div className="wallet-card-heading"><div><span className="wallet-eyebrow">School account</span><h3>{connected ? "Connected & ready" : "Not connected yet"}</h3></div><span className={`wallet-status ${connected ? "success" : "pending"}`}><i /> {connected ? "Active" : "Setup needed"}</span></div>{connected ? <><div className="wallet-account-visual"><div className="wallet-account-chip"><Landmark size={20} /><span>{paymentAccount?.dva?.bankName || "Dedicated account"}</span></div><strong>{paymentAccount?.dva?.accountNumber || "Account ready"}</strong><span>{paymentAccount?.dva?.accountName || schoolName}</span></div><div className="wallet-account-details"><div><span>Settlement bank</span><strong>{paymentAccount?.settlement?.bankName || "Configured"}</strong></div><div><span>Settlement account</span><strong>{maskAccount(paymentAccount?.settlement?.accountNumber)}</strong></div><div><span>Schedule</span><strong>{paymentAccount?.settlement?.schedule || "Automatic"}</strong></div></div></> : <div className="wallet-empty-card"><Building2 size={25} /><div><strong>Connect the school's bank account</strong><p>Connect the school's settlement account to activate the payment setup.</p></div><button type="button" onClick={() => setActiveView("setup")}><Plus size={17} /> Connect</button></div>}</section>
              <section className="wallet-card wallet-activity-card"><div className="wallet-card-heading"><div><span className="wallet-eyebrow">Recent activity</span><h3>Latest movements</h3></div><Activity size={19} /> </div>{recentActivity.length === 0 ? <div className="wallet-empty-state"><Activity size={24} /><strong>No transactions yet</strong><span>Your wallet activity will appear here.</span></div> : <div className="wallet-activity-list">{recentActivity.map((item) => <div className="wallet-activity-row" key={item.id}><div className="wallet-activity-icon"><ArrowDownLeft size={16} /></div><div className="wallet-activity-copy"><strong>{item.reference || item.type || "Wallet transaction"}</strong><span>{formatDate(item.paidAt || item.createdAt)}</span></div><div className="wallet-activity-amount"><strong>{formatCurrency(item.amount)}</strong><span>{item.status || "Recorded"}</span></div></div>)}</div>}</section>
            </div>
            <section className="wallet-card wallet-tools-card"><div><span className="wallet-eyebrow">Quick actions</span><h3>Move money with confidence</h3></div><div className="wallet-tool-grid"><button type="button" onClick={() => setActiveView("withdraw")}><ArrowUpRight size={20} /><strong>Withdraw</strong><span>Send funds to a bank account</span></button><button type="button" onClick={() => setActiveView("transfer")}><Send size={20} /><strong>Transfer</strong><span>Move funds using the wallet workflow</span></button><button type="button" onClick={downloadStatement}><Download size={20} /><strong>Statement</strong><span>Download wallet activity</span></button></div></section>
          </div>}

          {activeView === "setup" && <section className="wallet-view wallet-form-view"><div className="wallet-section-heading"><div><span>Account connection</span><h2>{connected ? "School payment account" : "Connect your school account"}</h2><p>Set the school's verified settlement account for Petra payment operations.</p></div><span className={`wallet-status ${connected ? "success" : "pending"}`}><i /> {connected ? "Active" : "Not connected"}</span></div>{connected ? <div className="wallet-connected-panel"><div className="wallet-connected-hero"><div className="wallet-connected-icon"><CheckCircle2 size={25} /></div><div><span>Dedicated payment account</span><strong>{paymentAccount?.dva?.accountNumber || "Connected"}</strong><p>{paymentAccount?.dva?.accountName || schoolName} · {paymentAccount?.dva?.bankName || "Provider account"}</p></div></div><div className="wallet-connected-grid"><div><span>Settlement bank</span><strong>{paymentAccount?.settlement?.bankName || "—"}</strong></div><div><span>Settlement account</span><strong>{maskAccount(paymentAccount?.settlement?.accountNumber)}</strong></div><div><span>Schedule</span><strong>{paymentAccount?.settlement?.schedule || "AUTO"}</strong></div><div><span>Status</span><strong>Active</strong></div></div></div> : <form className="wallet-form-card" onSubmit={handleSetupAccount}><div className="wallet-form-grid">{field("Settlement bank code", accountForm.bankCode, (e) => setAccountForm((v) => ({ ...v, bankCode: e.target.value.trim() })), { placeholder: "e.g. 044", required: true })}{field("Settlement account number", accountForm.accountNumber, (e) => setAccountForm((v) => ({ ...v, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })), { inputMode: "numeric", maxLength: 10, placeholder: "10-digit account number", required: true })}{field("Contact name", accountForm.contactName, (e) => setAccountForm((v) => ({ ...v, contactName: e.target.value })), { placeholder: "School finance contact" })}{field("Contact email", accountForm.contactEmail, (e) => setAccountForm((v) => ({ ...v, contactEmail: e.target.value })), { type: "email", placeholder: "finance@school.com" })}{field("Contact phone", accountForm.contactPhone, (e) => setAccountForm((v) => ({ ...v, contactPhone: e.target.value })), { placeholder: "080..." })}</div><div className="wallet-form-note"><ShieldCheck size={18} /><span>The school is derived from the authenticated principal account; no school ID is entered manually.</span></div><button className="wallet-button wallet-button-primary" type="submit" disabled={accountLoading || !/^\d{10}$/.test(accountForm.accountNumber) || !accountForm.bankCode}>{accountLoading ? "Connecting..." : "Connect school account"} <ChevronRight size={17} /></button></form>}</section>}

          {activeView === "withdraw" && <section className="wallet-view wallet-form-view"><div className="wallet-section-heading"><div><span>Outgoing funds</span><h2>Withdraw from wallet</h2><p>Send available funds to a bank account.</p></div><div className="wallet-balance-mini"><span>Available</span><strong>{formatCurrency(summary?.availableBalance ?? wallet?.balance)}</strong></div></div><form className="wallet-form-card" onSubmit={handleWithdraw}><div className="wallet-form-grid">{field("Amount", withdrawal.amount, (e) => setWithdrawal((v) => ({ ...v, amount: e.target.value.replace(/[^\d.]/g, "") })), { type: "number", min: "0", step: "0.01", placeholder: "0.00", required: true })}{field("Bank code", withdrawal.bankCode, (e) => setWithdrawal((v) => ({ ...v, bankCode: e.target.value })), { placeholder: "e.g. 044", required: true })}{field("Bank name", withdrawal.bankName, (e) => setWithdrawal((v) => ({ ...v, bankName: e.target.value })), { placeholder: "e.g. Access Bank", required: true })}{field("Account number", withdrawal.accountNumber, (e) => setWithdrawal((v) => ({ ...v, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })), { inputMode: "numeric", maxLength: 10, placeholder: "10-digit account number", required: true })}{field("Account name", withdrawal.accountName, (e) => setWithdrawal((v) => ({ ...v, accountName: e.target.value })), { placeholder: "Account holder name", required: true })}{field("Withdrawal PIN", withdrawal.pin, (e) => setWithdrawal((v) => ({ ...v, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })), { type: "password", inputMode: "numeric", maxLength: 6, placeholder: "4–6 digit PIN", required: true })}</div><label className="wallet-field wallet-field-full"><span>Note (optional)</span><textarea value={withdrawal.note} onChange={(e) => setWithdrawal((v) => ({ ...v, note: e.target.value }))} placeholder="Withdrawal description" /></label>{!summary?.withdrawalPinConfigured && <div className="wallet-form-warning"><LockKeyhole size={18} /><span>Create a withdrawal PIN before processing a withdrawal.</span><button type="button" onClick={() => setActiveView("security")}>Create PIN</button></div>}<button className="wallet-button wallet-button-primary" type="submit" disabled={loading || !summary?.withdrawalPinConfigured}>{loading ? "Submitting..." : "Review & withdraw"} <ArrowUpRight size={18} /></button></form></section>}

          {activeView === "transfer" && <section className="wallet-view wallet-form-view"><div className="wallet-section-heading"><div><span>Internal movement</span><h2>Transfer funds</h2><p>Move funds using the existing wallet transfer workflow.</p></div></div><form className="wallet-form-card" onSubmit={handleTransfer}><div className="wallet-form-grid">{field("Amount", transfer.amount, (e) => setTransfer((v) => ({ ...v, amount: e.target.value.replace(/[^\d.]/g, "") })), { type: "number", min: "0", step: "0.01", placeholder: "0.00", required: true })}{field("Recipient", transfer.recipient, (e) => setTransfer((v) => ({ ...v, recipient: e.target.value })), { placeholder: "Recipient wallet or account", required: true })}</div><label className="wallet-field wallet-field-full"><span>Note</span><textarea value={transfer.note} onChange={(e) => setTransfer((v) => ({ ...v, note: e.target.value }))} placeholder="Transfer description" /></label><button className="wallet-button wallet-button-primary" type="submit" disabled={loading}>{loading ? "Transferring..." : "Transfer funds"} <Send size={18} /></button></form></section>}

          {activeView === "transactions" && <section className="wallet-view"><div className="wallet-section-heading"><div><span>Ledger</span><h2>Transactions</h2><p>Every wallet movement in one place.</p></div><button type="button" className="wallet-button wallet-button-secondary" onClick={downloadStatement} disabled={loading}><Download size={17} /> Export statement</button></div><div className="wallet-card wallet-table-card"><div className="wallet-table-wrap"><table className="wallet-table"><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{transactions.length === 0 ? <tr><td colSpan="4"><div className="wallet-empty-state"><Activity size={24} /><strong>No transactions yet</strong><span>New activity will appear here.</span></div></td></tr> : transactions.map((item) => <tr key={item.id}><td><strong>{item.reference || item.id}</strong><span>{item.type || "Wallet activity"}</span></td><td>{formatCurrency(item.amount)}</td><td><span className="wallet-status success"><i /> {item.status || "Recorded"}</span></td><td>{formatDate(item.paidAt || item.createdAt)}</td></tr>)}</tbody></table></div></div><div className="wallet-card wallet-refunds-card"><div><span className="wallet-eyebrow">Refunds</span><h3>Recent refunded payments</h3></div><span>{refunds.length} recorded</span></div></section>}

          {activeView === "security" && <section className="wallet-view wallet-form-view"><div className="wallet-section-heading"><div><span>Protection</span><h2>Wallet security</h2><p>Keep withdrawals protected with a dedicated wallet PIN.</p></div><span className="wallet-status success"><i /> Protected</span></div><div className="wallet-security-grid"><div className="wallet-security-card"><div className="wallet-security-card-icon"><LockKeyhole size={22} /></div><span>Withdrawal PIN</span><strong>{summary?.withdrawalPinConfigured ? "Configured" : "Not configured"}</strong><p>{summary?.withdrawalPinConfigured ? "A PIN is required for wallet withdrawals." : "Create a PIN before anyone can withdraw from this wallet."}</p></div><div className="wallet-security-card"><div className="wallet-security-card-icon"><ShieldCheck size={22} /></div><span>School isolation</span><strong>Protected</strong><p>Wallet operations use the authenticated school context.</p></div></div><form className="wallet-form-card" onSubmit={handleSetPin}><div className="wallet-form-heading"><span>{summary?.withdrawalPinConfigured ? "Change PIN" : "Create PIN"}</span><h3>{summary?.withdrawalPinConfigured ? "Update withdrawal PIN" : "Set your withdrawal PIN"}</h3></div>{field("4–6 digit PIN", newPin, (e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)), { type: "password", inputMode: "numeric", maxLength: 6, autoComplete: "new-password", placeholder: "••••", required: true })}<button className="wallet-button wallet-button-primary" type="submit" disabled={pinLoading || !/^\d{4,6}$/.test(newPin)}>{pinLoading ? "Saving..." : summary?.withdrawalPinConfigured ? "Change PIN" : "Create PIN"} <LockKeyhole size={17} /></button></form>{settings.length > 0 && <div className="wallet-card wallet-settings-list">{settings.map((setting) => <div key={setting.key}><span>{setting.key}</span><strong>{setting.value}</strong></div>)}</div>}</section>}
        </main>
      </section>
    </div>
  );
}
