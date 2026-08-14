import { useState } from "react";
import { 
  UserPlus, Heart, Users, Wallet, ChevronRight, ChevronLeft, 
  CheckCircle2, AlertCircle 
} from "lucide-react";
import { admissionApi } from "./../../../services/admissionApi";
import { useToasts } from "../../../context/ToastContext";
import "./AdmissionForm.css";

// List of 36 States + FCT
const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", 
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", 
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

export default function AdmissionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showLin, setShowLin] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");
  const { success: showSuccess, error: showError } = useToasts();
  
  // Single state object for the entire massive form
  const [formData, setFormData] = useState({
    // Step 1: Student Info
    email: "", firstName: "", middleName: "", lastName: "", gender: "", dob: "",
    placeOfBirth: "", nationality: "Nigerian", stateOfOrigin: "", lga: "", lin: "",
    admissionClass: "", studentStatus: "", previousSchool: "", religion: "",
    // Step 2: Health
    ailments: "None", challenges: "None", bloodGroup: "", genotype: "",
    // Step 3: Parents
    maritalStatus: "",
    fatherName: "", fatherDob: "", fatherAddress: "", fatherOccupation: "", fatherJobTitle: "", fatherEmail: "", fatherPhone1: "", fatherPhone2: "",
    motherName: "", motherDob: "", motherAddress: "", motherOccupation: "", motherJobTitle: "", motherEmail: "", motherPhone1: "", motherPhone2: "",
    // Step 4: Finance
    financialAwareness: false, feePaymentMethod: "", referredBy: "", agreeTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    // LIN Logic: Show only if Ogun State is selected
    if (name === 'stateOfOrigin') {
      setShowLin(value === "Ogun");
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      showError("Submission blocked", "Please agree to the terms and conditions to submit.");
      return;
    }

    try {const payload = {
  applicationCode: null,

  // Applicant
  applicantName: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
  firstName: formData.firstName,
  middleName: formData.middleName,
  lastName: formData.lastName,
  gender: formData.gender,
  dob: formData.dob,
  placeOfBirth: formData.placeOfBirth,
  nationality: formData.nationality,
  stateOfOrigin: formData.stateOfOrigin,
  lga: formData.lga,
  lin: formData.lin,

  // Admission / academic information
  admissionClass: formData.admissionClass,
  studentStatus: formData.studentStatus,
  previousSchool: formData.previousSchool,
  religion: formData.religion,

  // Health information
  ailments: formData.ailments,
  challenges: formData.challenges,
  bloodGroup: formData.bloodGroup,
  genotype: formData.genotype,
  maritalStatus: formData.maritalStatus,

  // Father
  fatherName: formData.fatherName,
  fatherDob: formData.fatherDob,
  fatherAddress: formData.fatherAddress,
  fatherOccupation: formData.fatherOccupation,
  fatherJobTitle: formData.fatherJobTitle,
  fatherEmail: formData.fatherEmail,
  fatherPhone1: formData.fatherPhone1,
  fatherPhone2: formData.fatherPhone2,

  // Mother
  motherName: formData.motherName,
  motherDob: formData.motherDob,
  motherAddress: formData.motherAddress,
  motherOccupation: formData.motherOccupation,
  motherJobTitle: formData.motherJobTitle,
  motherEmail: formData.motherEmail,
  motherPhone1: formData.motherPhone1,
  motherPhone2: formData.motherPhone2,

  // Application/payment
  parentEmail: formData.fatherEmail || formData.motherEmail,
  parentPhone1: formData.fatherPhone1,
  parentPhone2: formData.fatherPhone2,
  feePaymentMethod: formData.feePaymentMethod,
  referredBy: formData.referredBy,
  financialAwareness: formData.financialAwareness,
  agreeTerms: formData.agreeTerms,

  // Keep the complete original form data
  submissionData: formData,
};

      const response = await admissionApi.submit(payload);
      // Response contains safe `admission` with admissionCode/applicationCode
      const admission = response?.admission;
      const safeRemarks = (() => {
        try {
          return admission?.remarks ? JSON.parse(admission.remarks) : {};
        } catch {
          return {};
        }
      })();
      const applicantId = admission?.applicantId || safeRemarks.applicantId;
      const admCode = admission?.admissionCode || admission?.applicationCode || safeRemarks.admissionCode || safeRemarks.applicationCode;
      setSubmissionSummary({
        message: response.message || "Application submitted successfully.",
        applicantId: applicantId || "",
        admissionCode: admCode || "",
      });
      showSuccess(
        "Application submitted",
        applicantId
          ? `Applicant ID: ${applicantId}${admCode ? ` • Admission Code: ${admCode}` : ""}`
          : "The applicant was saved successfully."
      );
      if (admCode || applicantId) {
        const startNow = window.confirm("Admission submitted successfully.\n\nOpen CBT page now?");
        if (startNow) {
          const params = new URLSearchParams();
          if (applicantId) params.set("applicantId", applicantId);
          window.location.href = `/dashboard/examination/cbt${params.toString() ? `?${params.toString()}` : ""}`;
          return;
        }
      }
      setCurrentStep(1);
      setFormData({
        email: "", firstName: "", middleName: "", lastName: "", gender: "", dob: "",
        placeOfBirth: "", nationality: "Nigerian", stateOfOrigin: "", lga: "", lin: "",
        admissionClass: "", studentStatus: "", previousSchool: "", religion: "",
        ailments: "None", challenges: "None", bloodGroup: "", genotype: "",
        maritalStatus: "", fatherName: "", fatherDob: "", fatherAddress: "", fatherOccupation: "", fatherJobTitle: "", fatherEmail: "", fatherPhone1: "", fatherPhone2: "",
        motherName: "", motherDob: "", motherAddress: "", motherOccupation: "", motherJobTitle: "", motherEmail: "", motherPhone1: "", motherPhone2: "",
        financialAwareness: false, feePaymentMethod: "", referredBy: "", agreeTerms: false,
      });
      setShowLin(false);
    } catch (error) {
      console.error(error);
      showError("Submission failed", error.data?.message || error.message || "Application submission failed. Please try again.");
    }
  };

  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCode(value);
      window.setTimeout(() => setCopiedCode(""), 1500);
    } catch {
      setCopiedCode("");
    }
  };

  const steps = [
    { id: 1, title: "Student Info", icon: UserPlus },
    { id: 2, title: "Health", icon: Heart },
    { id: 3, title: "Parents", icon: Users },
    { id: 4, title: "Finance", icon: Wallet },
  ];

  return (
    <div className="admission-page">
      <div className="admission-container">
        <div className="admission-header">
          <h1>New Student Admission</h1>
          <p>Complete the form below to apply for enrollment at Nuvora.</p>
        </div>

        {submissionSummary ? (
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h2 className="card-title">Submission Complete</h2>
            <p>{submissionSummary.message}</p>
            {submissionSummary.applicantId ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                <strong>Applicant ID: {submissionSummary.applicantId}</strong>
                <button type="button" className="btn-secondary" onClick={() => copyText(submissionSummary.applicantId)}>
                  {copiedCode === submissionSummary.applicantId ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
            {submissionSummary.admissionCode ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                <strong>Admission Code: {submissionSummary.admissionCode}</strong>
                <button type="button" className="btn-secondary" onClick={() => copyText(submissionSummary.admissionCode)}>
                  {copiedCode === submissionSummary.admissionCode ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Progress Stepper */}
        <div className="stepper">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span className="step-title">{step.title}</span>
                {index < steps.length - 1 && <div className="step-line" />}
              </div>
            );
          })}
        </div>

        <form className="admission-form" onSubmit={handleSubmit}>
          
          {/* ================= STEP 1: STUDENT INFO ================= */}
          {currentStep === 1 && (
            <div className="form-card">
              <h2 className="card-title">Student Information</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="parent@email.com" />
                </div>

                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="First name" />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="Middle name (Optional)" />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Last name" />
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Place of Birth</label>
                  <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} placeholder="e.g. Lagos (Optional)" />
                </div>

                <div className="form-group">
                  <label>Nationality *</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>State of Origin *</label>
                  <select name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} required>
                    <option value="">Select State</option>
                    {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Local Govt Area (LGA) *</label>
                  <input type="text" name="lga" value={formData.lga} onChange={handleChange} required placeholder="e.g. Ikeja" />
                </div>

                {/* LIN LOGIC: Only shows if State is Ogun */}
                {showLin && (
                  <div className="form-group full-width highlight-field">
                    <label>LIN (Learner Identification Number) *</label>
                    <input type="text" name="lin" value={formData.lin} onChange={handleChange} required placeholder="Enter Ogun State LIN" />
                    <small>Required for students originating from Ogun State.</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Class Seeking Admission *</label>
                  <select name="admissionClass" value={formData.admissionClass} onChange={handleChange} required>
                    <option value="">Select Class</option>
                    <option value="JSS1">JSS 1</option><option value="JSS2">JSS 2</option><option value="JSS3">JSS 3</option>
                    <option value="SS1">SS 1</option><option value="SS2">SS 2</option><option value="SS3">SS 3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Student Status *</label>
                  <select name="studentStatus" value={formData.studentStatus} onChange={handleChange} required>
                    <option value="">Select Status</option>
                    <option value="Day">Day Student</option>
                    <option value="Boarding">Boarding Student</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Name of Previous School</label>
                  <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="e.g. Grace Nursery & Primary" />
                </div>
                <div className="form-group">
                  <label>Religion *</label>
                  <select name="religion" value={formData.religion} onChange={handleChange} required>
                    <option value="">Select Religion</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Islam">Islam</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: HEALTH ================= */}
          {currentStep === 2 && (
            <div className="form-card">
              <h2 className="card-title">Health Details</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Common Ailments & Treatment Given</label>
                  <textarea name="ailments" value={formData.ailments} onChange={handleChange} rows={3} placeholder="Write 'None' if the student has no known ailments." />
                </div>
                <div className="form-group">
                  <label>Challenges Impacting Ability</label>
                  <select name="challenges" value={formData.challenges} onChange={handleChange}>
                    <option value="None">None</option>
                    <option value="Visually Challenged">Visually Challenged</option>
                    <option value="Hearing Impaired">Hearing Impaired</option>
                    <option value="Learning Disability">Learning Disability</option>
                    <option value="Physical Disability">Physical Disability</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group *</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Genotype *</label>
                  <select name="genotype" value={formData.genotype} onChange={handleChange} required>
                    <option value="">Select Genotype</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                    <option value="SC">SC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PARENTS ================= */}
          {currentStep === 3 && (
            <div className="form-card">
              <h2 className="card-title">Parent / Guardian Details</h2>
              
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>Marital Status *</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required>
                  <option value="">Select Status</option>
                  <option value="Married">Married</option>
                  <option value="Single">Single</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Father and Mother Side-by-Side Grid */}
              <div className="parent-grid">
                {/* FATHER COLUMN */}
                <div className="parent-col">
                  <h3 className="parent-title">Father / Guardian 1</h3>
                  <div className="form-group"><label>Full Name *</label><input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Date of Birth</label><input type="date" name="fatherDob" value={formData.fatherDob} onChange={handleChange} /></div>
                  <div className="form-group"><label>Home Address *</label><textarea name="fatherAddress" value={formData.fatherAddress} onChange={handleChange} required rows={2} /></div>
                  <div className="form-group"><label>Occupation *</label><input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Job Title</label><input type="text" name="fatherJobTitle" value={formData.fatherJobTitle} onChange={handleChange} /></div>
                  <div className="form-group"><label>Email Address *</label><input type="email" name="fatherEmail" value={formData.fatherEmail} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Phone Number 1 *</label><input type="tel" name="fatherPhone1" value={formData.fatherPhone1} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Phone Number 2</label><input type="tel" name="fatherPhone2" value={formData.fatherPhone2} onChange={handleChange} /></div>
                </div>

                {/* MOTHER COLUMN */}
                <div className="parent-col">
                  <h3 className="parent-title">Mother / Guardian 2</h3>
                  <div className="form-group"><label>Full Name *</label><input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Date of Birth</label><input type="date" name="motherDob" value={formData.motherDob} onChange={handleChange} /></div>
                  <div className="form-group"><label>Home Address *</label><textarea name="motherAddress" value={formData.motherAddress} onChange={handleChange} required rows={2} /></div>
                  <div className="form-group"><label>Occupation *</label><input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Job Title</label><input type="text" name="motherJobTitle" value={formData.motherJobTitle} onChange={handleChange} /></div>
                  <div className="form-group"><label>Email Address *</label><input type="email" name="motherEmail" value={formData.motherEmail} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Phone Number 1 *</label><input type="tel" name="motherPhone1" value={formData.motherPhone1} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Phone Number 2</label><input type="tel" name="motherPhone2" value={formData.motherPhone2} onChange={handleChange} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FINANCE ================= */}
          {currentStep === 4 && (
            <div className="form-card">
              <h2 className="card-title">Financial & Declaration</h2>
              <div className="form-grid">
                <div className="form-group full-width checkbox-group">
                  <input type="checkbox" id="financialAwareness" name="financialAwareness" checked={formData.financialAwareness} onChange={handleChange} required />
                  <label htmlFor="financialAwareness">
                    I am fully aware of the financial implications and obligations of enrolling my ward in this school, and I accept responsibility for all fees. *
                  </label>
                </div>

                <div className="form-group full-width">
                  <label>How will the school fees be paid? *</label>
                  <select name="feePaymentMethod" value={formData.feePaymentMethod} onChange={handleChange} required>
                    <option value="">Select Payment Method</option>
                    <option value="Both Parents">By Both Parents</option>
                    <option value="One Parent">By One of the Parents</option>
                    <option value="Scholarship">Scholarship / Sponsor</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Who referred you to Nuvora, or how did you hear about us?</label>
                  <input type="text" name="referredBy" value={formData.referredBy} onChange={handleChange} placeholder="e.g. Mr. Adebayo, Social Media, etc." />
                </div>

                <div className="form-group full-width checkbox-group highlight-checkbox">
                  <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} required />
                  <label htmlFor="agreeTerms">
                    <AlertCircle size={16} style={{flexShrink: 0, marginTop: "2px"}} />
                    <span>I understand and agree that admission is only guaranteed after the student successfully passes the entrance examination. *</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={prevStep}>
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {currentStep < 4 ? (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn-primary btn-submit">
                <CheckCircle2 size={18} /> Submit Application
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
