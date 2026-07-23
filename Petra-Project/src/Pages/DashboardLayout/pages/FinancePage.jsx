import { Link } from "react-router-dom";
import './page-styles/FinancePage.css';

export default function FinancePage() {
  return (
    <div className="dashboard-page">
      <h1>Finance</h1>
      <p>Monitor payments, invoices, extra fees, flexpay, wallet services, and cashflow.</p>
      <div className="finance-page-actions">
        <Link to="/dashboard/finance/wallet" className="finance-page-button">
          Open Petra Wallet
        </Link>
      </div>
    </div>
  );
}
