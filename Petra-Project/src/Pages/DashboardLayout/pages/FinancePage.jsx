import { Link } from "react-router-dom";
import { Banknote, ChartNoAxesCombined, CreditCard, FileText, Percent, Wallet, ArrowRight } from "lucide-react";
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
    <div className="dashboard-home finance-page">
      <section className="finance-page-header">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>Finance command center</h1>
          <p className="dashboard-page-copy">Access payment workflows, wallet operations, invoicing, and cashflow insights from one premium dashboard.</p>
        </div>
      </section>

      <section className="finance-page-summary-panel">
        <article className="finance-page-metric-card">
          <span>Recent payments</span>
          <strong>{summary.payments.length}</strong>
        </article>
        <article className="finance-page-metric-card">
          <span>Invoices</span>
          <strong>{summary.invoices.length}</strong>
        </article>
        <article className="finance-page-metric-card">
          <span>Fee structures</span>
          <strong>{summary.fees.length}</strong>
        </article>
        <article className="finance-page-metric-card">
          <span>Active plans</span>
          <strong>{summary.flexpay.length}</strong>
        </article>
      </section>

      <section className="finance-page-grid">
        <article className="finance-page-panel finance-panel">
          <header className="finance-page-panel-header">
            <h2>Finance modules</h2>
            <p>Quickly navigate the most important finance workflows.</p>
          </header>
          <div className="finance-page-card-grid">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} to={card.to} className="finance-page-card">
                  <div className="finance-page-card-icon">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  <span className="finance-page-card-link">
                    Open <ArrowRight size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="finance-page-panel finance-panel">
          <header className="finance-page-panel-header">
            <h2>Cashflow snapshot</h2>
            <p>See the latest finance health metrics at a glance.</p>
          </header>
          {summary.cashflow ? (
            <div className="finance-page-summary">
              <article>
                <span>Total revenue</span>
                <strong>{summary.cashflow.totalRevenue}</strong>
              </article>
              <article>
                <span>Total expenses</span>
                <strong>{summary.cashflow.totalExpenses}</strong>
              </article>
              <article>
                <span>Net income</span>
                <strong>{summary.cashflow.netIncome}</strong>
              </article>
              <article>
                <span>Outstanding fees</span>
                <strong>{summary.cashflow.outstandingFees}</strong>
              </article>
            </div>
          ) : (
            <p className="finance-page-empty">Cashflow insights will appear once the finance data is available.</p>
          )}
          <Link to="/dashboard/finance/cashflow" className="dashboard-home-summary-action tone-blue finance-cta">
            <span>View full cashflow</span>
            <ArrowRight size={14} />
          </Link>
        </article>
      </section>
    </div>
  );
}
