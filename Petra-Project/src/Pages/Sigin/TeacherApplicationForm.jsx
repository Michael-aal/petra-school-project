import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import { teacherApplicationApi } from "../../services/teacherApplicationApi";
import "./TeacherApplicationForm.css";

const states = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT",
];

const initialForm = {
  firstName: "", middleName: "", lastName: "", email: "", phone: "", gender: "", dateOfBirth: "",
  nationality: "Nigerian", stateOfOrigin: "", lga: "", maritalStatus: "", address: "", nin: "",
  qualification: "", institution: "", course: "", graduationYear: "", teachingQualification: "",
  trcnNumber: "", specialization: "", majorSubject: "", minorSubject: "", experienceYears: "",
  previousSchools: "", positionApplied: "", subjects: "", classLevels: "", employmentType: "",
  availableStartDate: "", expectedSalary: "", cvUrl: "", declarationAccepted: false,
};

const steps = [
  { id: 1, title: "Personal", icon: UserRound },
  { id: 2, title: "Education", icon: GraduationCap },
  { id: 3, title: "Teaching", icon: BriefcaseBusiness },
  { id: 4, title: "Employment", icon: IdCard },
  { id: 5, title: "Declaration", icon: Check },
];

export default function TeacherApplicationForm() {
  const schoolId = useMemo(() => new URLSearchParams(window.location.search).get("schoolId"), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
        return "Please complete your name, email and phone number.";
      }
    }
    if (currentStep === 2 && !form.qualification.trim()) {
      return "Please provide your highest qualification.";
    }
    if (currentStep === 3 && (!form.positionApplied.trim() || !form.majorSubject.trim())) {
      return "Please provide the position and main subject you are applying for.";
    }
    if (currentStep === 5 && !form.declarationAccepted) {
      return "Please accept the declaration before submitting.";
    }
    return "";
  };

  const next = () => {
    const message = validateStep();
    if (message) return setError(message);
    setCurrentStep((step) => Math.min(5, step + 1));
    setError("");
  };

  const back = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = validateStep();
    if (message) return setError(message);
    if (!/^\d+$/.test(String(schoolId || ""))) {
      return setError("This application link is missing a valid school reference. Please use the school's official application link.");
    }

    setLoading(true);
    setError("");
    try {
      const response = await teacherApplicationApi.submit({
        schoolId: Number(schoolId),
        ...form,
        submissionData: form,
      });
      setSuccess(response);
      setForm(initialForm);
      setCurrentStep(1);
    } catch (requestError) {
      setError(requestError?.data?.message || requestError?.message || "Unable to submit the application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="teacher-application-page">
      <div className="teacher-application-shell">
        <header className="teacher-application-header">
          <div className="teacher-application-brand">PETRA</div>
          <div>
            <p className="teacher-application-eyebrow">STAFF RECRUITMENT</p>
            <h1>Teacher Application Form</h1>
            <p>Complete your application to join the school teaching team.</p>
          </div>
        </header>

        {success ? (
          <section className="teacher-success-card">
            <div className="teacher-success-icon"><Check size={28} /></div>
            <p className="teacher-application-eyebrow">APPLICATION RECEIVED</p>
            <h2>Thank you for applying.</h2>
            <p>{success.message || "Your application has been submitted and is awaiting review."}</p>
            {success.applicationNumber ? (
              <div className="teacher-application-number">
                <span>Application Number</span>
                <strong>{success.applicationNumber}</strong>
              </div>
            ) : null}
            <button type="button" className="teacher-primary-btn" onClick={() => setSuccess(null)}>Submit another application</button>
          </section>
        ) : (
          <>
            <div className="teacher-stepper" aria-label="Application progress">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = currentStep === step.id;
                const completed = currentStep > step.id;
                return (
                  <div className="teacher-step" key={step.id}>
                    <div className={`teacher-step-circle ${active ? "active" : ""} ${completed ? "completed" : ""}`}>
                      {completed ? <Check size={16} /> : <Icon size={17} />}
                    </div>
                    <span>{step.title}</span>
                    {index < steps.length - 1 ? <div className={`teacher-step-line ${completed ? "completed" : ""}`} /> : null}
                  </div>
                );
              })}
            </div>

            <form className="teacher-application-form" onSubmit={submit}>
              {error ? <div className="teacher-form-alert" role="alert">{error}</div> : null}

              {currentStep === 1 ? (
                <section className="teacher-form-card">
                  <div className="teacher-card-heading"><UserRound size={21} /><div><h2>Personal Information</h2><p>Tell the school about yourself.</p></div></div>
                  <div className="teacher-form-grid">
                    <Field label="First Name" name="firstName" value={form.firstName} onChange={change} required />
                    <Field label="Middle Name" name="middleName" value={form.middleName} onChange={change} />
                    <Field label="Last Name" name="lastName" value={form.lastName} onChange={change} required />
                    <Field label="Email Address" name="email" type="email" value={form.email} onChange={change} required />
                    <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={change} required />
                    <Select label="Gender" name="gender" value={form.gender} onChange={change} options={["Male", "Female"]} />
                    <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={change} />
                    <Field label="Nationality" name="nationality" value={form.nationality} onChange={change} />
                    <Select label="State of Origin" name="stateOfOrigin" value={form.stateOfOrigin} onChange={change} options={states} />
                    <Field label="LGA of Origin" name="lga" value={form.lga} onChange={change} />
                    <Select label="Marital Status" name="maritalStatus" value={form.maritalStatus} onChange={change} options={["Single", "Married", "Divorced", "Widowed"]} />
                    <Field label="NIN" name="nin" value={form.nin} onChange={change} placeholder="Optional" />
                    <Field label="Residential Address" name="address" value={form.address} onChange={change} wide />
                  </div>
                </section>
              ) : null}

              {currentStep === 2 ? (
                <section className="teacher-form-card">
                  <div className="teacher-card-heading"><GraduationCap size={21} /><div><h2>Educational Qualifications</h2><p>Provide your highest academic and teaching qualifications.</p></div></div>
                  <div className="teacher-form-grid">
                    <Field label="Highest Qualification" name="qualification" value={form.qualification} onChange={change} placeholder="e.g. B.Ed, B.Sc + PGDE, NCE" required />
                    <Field label="Institution" name="institution" value={form.institution} onChange={change} placeholder="Institution attended" />
                    <Field label="Course / Field of Study" name="course" value={form.course} onChange={change} />
                    <Field label="Year Obtained" name="graduationYear" type="number" value={form.graduationYear} onChange={change} min="1950" max="2100" />
                    <Field label="Teaching Qualification" name="teachingQualification" value={form.teachingQualification} onChange={change} placeholder="e.g. NCE, PGDE, B.Ed" wide />
                    <Field label="TRCN Number" name="trcnNumber" value={form.trcnNumber} onChange={change} placeholder="If applicable" />
                    <Field label="Area of Specialization" name="specialization" value={form.specialization} onChange={change} wide />
                  </div>
                </section>
              ) : null}

              {currentStep === 3 ? (
                <section className="teacher-form-card">
                  <div className="teacher-card-heading"><BriefcaseBusiness size={21} /><div><h2>Teaching Experience</h2><p>Help the school understand your classroom experience.</p></div></div>
                  <div className="teacher-form-grid">
                    <Field label="Years of Teaching Experience" name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={change} />
                    <Field label="Main Subject" name="majorSubject" value={form.majorSubject} onChange={change} placeholder="e.g. Mathematics" required />
                    <Field label="Other / Minor Subject" name="minorSubject" value={form.minorSubject} onChange={change} />
                    <Field label="Classes / Levels Taught" name="classLevels" value={form.classLevels} onChange={change} placeholder="e.g. JSS1–SS3" />
                    <Field label="Previous Schools / Employers" name="previousSchools" value={form.previousSchools} onChange={change} wide placeholder="List relevant previous schools and positions" />
                    <Field label="Subjects You Can Teach" name="subjects" value={form.subjects} onChange={change} wide placeholder="Separate subjects with commas" />
                    <Field label="Relevant Teaching Skills" name="specialization" value={form.specialization} onChange={change} wide placeholder="e.g. STEM, ICT, classroom management" />
                  </div>
                </section>
              ) : null}

              {currentStep === 4 ? (
                <section className="teacher-form-card">
                  <div className="teacher-card-heading"><IdCard size={21} /><div><h2>Position & Employment</h2><p>Tell us what role you are applying for and when you can start.</p></div></div>
                  <div className="teacher-form-grid">
                    <Field label="Position Applied For" name="positionApplied" value={form.positionApplied} onChange={change} placeholder="e.g. Secondary School Teacher" required />
                    <Select label="Employment Type" name="employmentType" value={form.employmentType} onChange={change} options={["Full-time", "Part-time", "Contract", "Temporary"]} />
                    <Field label="Available Start Date" name="availableStartDate" type="date" value={form.availableStartDate} onChange={change} />
                    <Field label="Expected Salary" name="expectedSalary" value={form.expectedSalary} onChange={change} placeholder="Optional" />
                    <Field label="CV Link" name="cvUrl" value={form.cvUrl} onChange={change} placeholder="Optional secure link to your CV" wide />
                  </div>
                </section>
              ) : null}

              {currentStep === 5 ? (
                <section className="teacher-form-card">
                  <div className="teacher-card-heading"><Check size={21} /><div><h2>Declaration</h2><p>Review your application before sending it to the school.</p></div></div>
                  <div className="teacher-review-grid">
                    <Review label="Applicant" value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ")} />
                    <Review label="Email" value={form.email} />
                    <Review label="Phone" value={form.phone} />
                    <Review label="Qualification" value={form.qualification} />
                    <Review label="Main Subject" value={form.majorSubject} />
                    <Review label="Position" value={form.positionApplied} />
                  </div>
                  <label className="teacher-declaration">
                    <input type="checkbox" name="declarationAccepted" checked={form.declarationAccepted} onChange={change} />
                    <span>I declare that the information supplied in this application is true and complete to the best of my knowledge. I understand that the school may verify the information provided.</span>
                  </label>
                </section>
              ) : null}

              <div className="teacher-form-actions">
                <button type="button" className="teacher-secondary-btn" onClick={back} disabled={currentStep === 1 || loading}><ChevronLeft size={18} /> Back</button>
                {currentStep < 5 ? (
                  <button type="button" className="teacher-primary-btn" onClick={next}>Continue <ChevronRight size={18} /></button>
                ) : (
                  <button type="submit" className="teacher-primary-btn" disabled={loading}><Send size={17} /> {loading ? "Submitting..." : "Submit Application"}</button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, required, wide, min, max }) {
  return (
    <label className={`teacher-field ${wide ? "wide" : ""}`}>
      <span>{label}{required ? " *" : ""}</span>
      <input name={name} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} required={required} min={min} max={max} />
    </label>
  );
}

function Select({ label, name, value, onChange, options = [] }) {
  return (
    <label className="teacher-field">
      <span>{label}</span>
      <select name={name} value={value || ""} onChange={onChange}>
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Review({ label, value }) {
  return <div className="teacher-review-item"><span>{label}</span><strong>{value || "Not provided"}</strong></div>;
}
