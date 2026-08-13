import { BarChart3, BellRing, Check, GraduationCap, Sparkles, WalletCards } from "lucide-react";

const NuvoraLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <title>Nuvora</title>
    <path d="M12 3 2 8l10 5 10-5-10-5Z" fill="currentColor" />
    <path d="M6.5 11.2c-.2.1-.5.3-.5.6v2.2c0 .7.9 1.6 2.8 2.6 1.8.9 4.2 1.4 6.2 1.4s4.4-.5 6.2-1.4c1.9-1 2.8-1.9 2.8-2.6v-2.2c0-.3-.3-.5-.5-.6L12 15l-5.5-3.8Z" fill="currentColor" opacity=".92" />
    <path d="M12 4.2v6.2m0-.6 3 1" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Reuses the landing page's dashboard language so authentication feels native to Nuvora.
function ProductPreview() {
  return (
    <div className="auth-dashboard-preview" aria-label="Nuvora school dashboard preview">
      <div className="auth-dashboard-orbit" />
      <div className="auth-preview-topline">
        <div className="auth-preview-brand"><span /><strong>Nuvora OS</strong></div>
        <div className="auth-preview-actions"><span /><span /><b>AD</b></div>
      </div>
      <div className="auth-preview-body">
        <aside className="auth-preview-sidebar">
          <div className="auth-preview-sidebar-mark"><Sparkles size={14} /></div><i /><i /><i /><i /><i />
        </aside>
        <div className="auth-preview-content">
          <div className="auth-preview-heading">
            <div><small>MONDAY · 10 FEBRUARY</small><h3>Your school at a glance.</h3></div>
            <span>2024/2025</span>
          </div>
          <div className="auth-preview-stats">
            <div><small>ACTIVE LEARNERS</small><strong>2,841</strong><em>+8.4%</em></div>
            <div><small>COLLECTED</small><strong>₦48.6m</strong><em>+12.8%</em></div>
          </div>
          <div className="auth-preview-lower">
            <div className="auth-preview-chart">
              <div className="auth-preview-chart-head"><span>School momentum</span><small>LAST 6 MONTHS</small></div>
              <div className="auth-preview-line" />
              <div className="auth-preview-labels"><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span></div>
            </div>
            <div className="auth-preview-feed">
              <strong>Latest activity</strong>
              <p><BellRing size={13} /> 42 fee reminders sent</p>
              <p><Check size={13} /> 18 admissions approved</p>
              <p><BarChart3 size={13} /> Weekly report ready</p>
            </div>
          </div>
          <div className="auth-preview-insight">
            <span className="auth-preview-insight-icon"><WalletCards size={15} /></span>
            <div><b>Fees are moving</b><small>+18.4% this month</small></div>
            <span className="auth-preview-insight-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-layout" aria-label="Nuvora authentication">
        <div className="auth-main">
          <div className="auth-content">
            <a className="auth-brand" href="/" aria-label="Nuvora home">
              <span className="auth-brand-mark"><NuvoraLogo size={20} /></span><span>Nuvora</span>
            </a>
            <div className="auth-form-area">
              <div className="auth-intro">
                <span className="auth-kicker">The school operating system</span>
                <h1>Welcome back to your <em>school room.</em></h1>
                <p>Sign in to keep operations, finance, and learning moving from one calm workspace.</p>
              </div>
              <div className="auth-form-card">{children}</div>
            </div>
            <div className="auth-footer-note"><GraduationCap size={15} /><span>Built for ambitious Nigerian schools.</span></div>
          </div>
        </div>
        <aside className="auth-visual" aria-label="Nuvora platform preview">
          <div className="auth-visual-copy">
            <span className="auth-visual-kicker"><i /> Nuvora OS</span>
            <h2>See the whole school.<br /><em>Move with clarity.</em></h2>
            <p>Admissions, fees, people, and learning signals—connected in one operating rhythm.</p>
          </div>
          <ProductPreview />
          <div className="auth-visual-caption"><span>LIVE SCHOOL SIGNALS</span><strong>Built for the everyday work.</strong></div>
        </aside>
      </section>
    </main>
  );
}
