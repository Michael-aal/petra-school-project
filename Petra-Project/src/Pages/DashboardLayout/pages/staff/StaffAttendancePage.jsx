import '../page-styles/StaffAttendancePage.css';

export default function StaffAttendancePage() {
  return (
    <div className="dashboard-home staff-attendance-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Staff Attendance</h1>
          <p>Track attendance and payroll-related staff presence through a modern attendance hub.</p>
        </div>
        <div className="dashboard-home-session-pill">Attendance</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Attendance items</span>
              <strong>Weekly overview</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <span>📊</span>
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Payroll sync</span>
              <strong>Enabled</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <span>💼</span>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel staff-attendance-panel">
        <h2>Staff attendance overview</h2>
        <p className="dashboard-page-copy">
          Use this page for attendance workflows and payroll preparation. The detailed staff attendance stream is part of the connected workforce dashboard.
        </p>
      </section>
    </div>
  );
}
