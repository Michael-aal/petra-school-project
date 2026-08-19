import { useState } from "react";
import { 
  CheckCircle2, Clock, XCircle, CreditCard, GraduationCap, 
  FileText, ArrowRight, Download, AlertTriangle, Sparkles 
} from "lucide-react";
import "./ApplicationStatusPage.css";

export default function ApplicationStatusPage() {
  // TODO: Replace this with real data from your backend API (e.g., userInfo.applicationStatus)
  const [currentStatus, setCurrentStatus] = useState("pending"); 

  // Mock Application Data (Will come from backend)
  const applicationData = {
    applicantName: "Ayo Ogunleye",
    appliedClass: "JSS 1",
    applicationDate: "Oct 24, 2024",
    applicationId: "ADM-2024-88392",
    parentEmail: "ogunleye.k@gmail.com"
  };

  // Status Configurations
  const statusConfig = {
    pending: {
      label: "Under Review",
      icon: Clock,
      colorClass: "status-pending",
      title: "Your application is being reviewed",
      description: "Thank you for submitting your application. Our admissions team is currently reviewing the details. You will be notified via email when the entrance exam schedule is released.",
      actionText: "View Exam Schedule",
      actionIcon: FileText,
      showTimelineStep: 2 // Exam is the current pending step
    },
    passed: {
      label: "Passed Exam",
      icon: Sparkles,
      colorClass: "status-passed",
      title: "Congratulations! You passed the entrance exam.",
      description: "Your ward has successfully met the academic requirements for admission. To secure this spot, please proceed to pay the school fees for the upcoming term.",
      actionText: "Pay School Fees Now",
      actionIcon: CreditCard,
      showTimelineStep: 3 // Fees is the current pending step
    },
    failed: {
      label: "Not Selected",
      icon: XCircle,
      colorClass: "status-failed",
      title: "Application Unsuccessful",
      description: "We regret to inform you that your ward did not meet the cut-off mark for the selected class this session. We encourage you to apply again next academic year.",
      actionText: "Contact Admissions Office",
      actionIcon: AlertTriangle,
      showTimelineStep: 2 // Stopped at Exam
    },
    completed: {
      label: "Fully Admitted",
      icon: GraduationCap,
      colorClass: "status-completed",
      title: "Admission Confirmed & Activated!",
      description: "All payments have been received and your ward's account is fully active. You can now access the Parent Portal to view the dashboard, timetable, and school announcements.",
      actionText: "Go to Parent Portal",
      actionIcon: ArrowRight,
      showTimelineStep: 4 // All steps complete
    }
  };

  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;
  const ActionIcon = config.actionIcon;

  // Timeline Steps
  const timelineSteps = [
    { id: 1, title: "Form Submitted", desc: applicationData.applicationDate },
    { id: 2, title: "Entrance Exam", desc: config.showTimelineStep > 2 ? "Completed" : (config.showTimelineStep === 2 ? "In Progress" : "Pending") },
    { id: 3, title: "School Fees", desc: config.showTimelineStep > 3 ? "Paid" : (config.showTimelineStep === 3 ? "Awaiting Payment" : "Pending") },
    { id: 4, title: "Account Activated", desc: config.showTimelineStep === 4 ? "Active" : "Pending" },
  ];

  return (
    <div className="app-status-page">
      
      {/* Developer Preview Tool (Remove this when connecting to backend) */}
      <div className="preview-bar">
        <span>Preview Status:</span>
        <select value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
          <option value="pending">Pending (Under Review)</option>
          <option value="passed">Passed (Needs Fees)</option>
          <option value="failed">Failed</option>
          <option value="completed">Completed (Active)</option>
        </select>
      </div>

      <div className="status-container">
        
        {/* 1. Main Status Hero Card */}
        <div className={`status-hero ${config.colorClass}`}>
          <div className="status-hero-icon">
            <StatusIcon size={32} />
          </div>
          <div className="status-hero-content">
            <span className="status-badge">{config.label}</span>
            <h2>{config.title}</h2>
            <p>{config.description}</p>
          </div>
          <button className="status-action-btn">
            <ActionIcon size={18} />
            {config.actionText}
          </button>
        </div>

        <div className="status-grid">
          
          {/* 2. Visual Timeline */}
          <div className="status-card timeline-card">
            <h3 className="card-title">Application Progress</h3>
            <div className="timeline">
              {timelineSteps.map((step, index) => {
                const isCompleted = step.id < config.showTimelineStep;
                const isCurrent = step.id === config.showTimelineStep;
                
                return (
                  <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="timeline-node">
                      {isCompleted ? <CheckCircle2 size={16} /> : <span>{step.id}</span>}
                    </div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                    {index < timelineSteps.length - 1 && <div className="timeline-line" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Application Summary & Receipt */}
          <div className="status-card summary-card">
            <h3 className="card-title">Application Summary</h3>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">Applicant Name</span>
                <span className="summary-value">{applicationData.applicantName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Class Applied For</span>
                <span className="summary-value">{applicationData.appliedClass}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Parent Email</span>
                <span className="summary-value">{applicationData.parentEmail}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Application ID</span>
                <span className="summary-value mono">{applicationData.applicationId}</span>
              </div>
            </div>
            
            <button className="download-receipt-btn">
              <Download size={16} />
              Download Application Receipt
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}