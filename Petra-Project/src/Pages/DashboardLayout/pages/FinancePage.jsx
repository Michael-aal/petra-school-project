import { Link } from "react-router-dom";
import { Banknote, ChartNoAxesCombined, CreditCard, FileText, Percent, Wallet } from "lucide-react";
import "./page-styles/FinancePage.css";
import { financeApi } from "../../../services/financeApi";
import { useEffect, useState } from "react";

const cards = [
  {
    title: "Payments",
    description: "Record and manage student payments with filters, receipts, and exports.",
    to: "/dashboard/finance/payments",
    icon: CreditCard,
  },
  {
    title: "Invoices",
    description: "Review invoice records and track outstanding balances.",
    to: "/dashboard/finance/invoices",
    icon: FileText,
  },
  {
    title: "Extra Fees",
    description: "Configure levies and special charges for classes and sessions.",
    to: "/dashboard/finance/extra-fees",
    icon: Percent,
  },
  {
    title: "Wallet",
    description: "Manage wallet balances, deposits, withdrawals, and transfers.",
    to: "/dashboard/finance/wallet",
    icon: Wallet,
  },
  {
    title: "FlexPay",
    description: "Split fees into installments and follow up payment plans.",
    to: "/dashboard/finance/flexpay",
    icon: Banknote,
  },
  {
    title: "Cashflow",
    description: "Monitor revenue, expenses, and financial performance over time.",
    to: "/dashboard/finance/cashflow",
    icon: ChartNoAxesCombined,
  },
];

export default function FinancePage() {
  const [summary, setSummary] = useState({ payments: [], invoices: [], fees: [], flexpay: [], cashflow: null });

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      financeApi.payments({ limit: 5 }),
      financeApi.invoices(),
      financeApi.fees(),
      financeApi.flexpay(),
      financeApi.cashflow(),
    ]).then(([payments, invoices, fees, flexpay, cashflow]) => {
      if (!mounted) return;
      setSummary({
        payments: payments.status === "fulfilled" ? payments.value.payments || [] : [],
        invoices: invoices.status === "fulfilled" ? invoices.value.invoices || [] : [],
        fees: fees.status === "fulfilled" ? fees.value.feeStructures || [] : [],
        flexpay: flexpay.status === "fulfilled" ? flexpay.value.installmentPlans || [] : [],
        cashflow: cashflow.status === "fulfilled" ? cashflow.value : null,
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-page finance-page">
      <section className="finance-page-hero">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>School Finance Center</h1>
          <p className="dashboard-page-copy">
            Track payments, invoices, fees, wallet operations, installment plans, and cashflow from one control panel.
          </p>
        </div>
        <div className="finance-page-hero-stats">
          <div><strong>{summary.payments.length}</strong><span>Recent payments</span></div>
          <div><strong>{summary.invoices.length}</strong><span>Invoices</span></div>
          <div><strong>{summary.fees.length}</strong><span>Fee structures</span></div>
        </div>
      </section>

      <section className="finance-page-grid">
        {cards.map((card) => (
          <Link key={card.title} to={card.to} className="finance-page-card">
            <div className="finance-page-card-icon">
              <card.icon size={18} />
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="finance-page-actions">
        <Link to="/dashboard/finance/payments" className="finance-page-button">
          Open Payments
        </Link>
        <Link to="/dashboard/finance/cashflow" className="finance-page-button finance-page-button-secondary">
          View Cashflow
        </Link>
      </section>

      {summary.cashflow && (
        <section className="finance-page-summary">
          <article><span>Total Revenue</span><strong>{summary.cashflow.totalRevenue}</strong></article>
          <article><span>Total Expenses</span><strong>{summary.cashflow.totalExpenses}</strong></article>
          <article><span>Net Income</span><strong>{summary.cashflow.netIncome}</strong></article>
          <article><span>Outstanding Fees</span><strong>{summary.cashflow.outstandingFees}</strong></article>
        </section>
      )}
    </div>
  );
}
