import React from 'react';
import './Enrollment.css';



export default function EnrollmentPage() {
  return (

    <div className="enrollment-page">
      <header className="enrollment-header">
        <div>
          <div className="eyebrow">Enrollments</div>
          <h2 className="title">Enrollment Management</h2>
        </div>
        <button className="create-btn">+ Create New Form</button>
      </header>

      <nav className="enrollment-tabs">
        <button className="tab active">Form Templates (0)</button>
        <button className="tab">Submissions (0)</button>
      </nav>

      <section className="cards-row">
        <article className="stat-card">
          <div className="stat-left">
            <div className="stat-label">Total Templates</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-icon blue">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5C14.3431 5 13 6.34315 13 8C13 9.65685 14.3431 11 16 11Z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21C21 17.6863 18.3137 15 15 15H9C5.68629 15 3 17.6863 3 21" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-left">
            <div className="stat-label">Active Templates</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" strokeWidth="1.2"/>
              <path d="M8 12H16" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M8 16H12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-left">
            <div className="stat-label">Total Submissions</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="7" y="3" width="10" height="14" rx="2" stroke="#fff" strokeWidth="1.2"/>
              <path d="M9 7H15" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </article>
      </section>

      <div className="large-panel">
        <div className="instruction">
          There are no records to display
        </div>
      </div>

      <button className="help-fab" aria-label="help">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#5B21B6"/>
          <path d="M12 17V17.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.09 9.5C9.325 8.82 10 8.25 11 8.25C12 8.25 12.5 8.75 12.5 9.25C12.5 10.25 10.5 10.5 10.5 12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
   <div className="legalnote">
 <p>© 2026 All rights reserved by PetraSchool.com</p>
   </div>
     
    </div>
  
  );
}
