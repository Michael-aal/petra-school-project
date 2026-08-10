import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentApi } from '../../../../services/enrollmentApi';
import { studentApi } from '../../../../services/studentApi';
import './Enrollment.css';

export default function EnrollmentCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dob: '',
    admissionNumber: '',
    className: '',
    arm: '',
    session: '',
    admissionDate: '',
    parentName: '',
    parentRelationship: '',
    parentEmail: '',
    parentPhone: '',
    previousSchool: '',
    bloodGroup: '',
    genotype: '',
    allergies: '',
    notes: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const studentPayloadRequired = (f) => {
    const name = [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ").trim();
    return !!(name && f.parentName && f.parentRelationship && f.parentEmail && f.parentPhone);
  };

  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]); // { id, file, preview, type, name, size }
  const [uploading, setUploading] = useState(false);

  const validateFields = (f) => {
    const errors = {};
    const name = [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ").trim();
    if (!name) errors.name = 'Student name is required';
    if (!f.parentName) errors.parentName = 'Parent name is required';
    if (!f.parentRelationship) errors.parentRelationship = 'Relationship is required';
    if (!f.parentEmail) errors.parentEmail = 'Valid parent email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.parentEmail)) errors.parentEmail = 'Email looks invalid';
    if (!f.parentPhone) errors.parentPhone = 'Parent phone is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFieldErrors((s) => ({ ...s, documents: `File too large (max 5MB): ${file.name}` }));
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      setFieldErrors((s) => ({ ...s, documents: 'Unsupported file type. Use images or PDF.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result || '');
      setDocuments((cur) => [
        ...cur.filter((d) => d.documentType !== type),
        { id: `${Date.now()}-${type}`, file, preview, documentType: type, name: file.name, size: file.size },
      ]);
      setFieldErrors((s) => ({ ...s, documents: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (type) => {
    setDocuments((cur) => cur.filter((d) => d.documentType !== type));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Validate fields
      if (!validateFields(form)) {
        setError('Please fix validation errors');
        setLoading(false);
        return;
      }
        setUploading(true);
      const studentPayload = {
        name: [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ").trim(),
        admissionNumber: form.admissionNumber || undefined,
        gender: form.gender || undefined,
        dob: form.dob || undefined,
        className: form.className || undefined,
        parentName: form.parentName || undefined,
        parentEmail: form.parentEmail || undefined,
        parentPhone: form.parentPhone || undefined,
        parentRelationship: form.parentRelationship || undefined,
        studentAddress: form.homeAddress || undefined,
        bloodGroup: form.bloodGroup || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        documents: documents.map((d) => ({ documentType: d.documentType, fileName: d.name, fileData: d.preview })),
      };

      const createdStudentResp = await studentApi.create(studentPayload);
      // backend returns { success: true, student }
      const createdStudent = createdStudentResp?.student || createdStudentResp;
      const studentId = createdStudent?.id || createdStudentResp?.id;
      if (!studentId) throw new Error('Failed to create student');

      await enrollmentApi.create({ studentId });

      setSuccess('Student enrolled successfully');
      setTimeout(() => navigate('/dashboard/students/enrollment'), 900);
    } catch (err) {
      setError(err.message || 'Failed to create enrollment');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="enrollment-page">
      <header className="enrollment-header">
        <div>
          <div className="eyebrow">Enrollments</div>
          <h2 className="title">Create Enrollment</h2>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button className="btn-muted" onClick={() => navigate('/dashboard/students/enrollment')}>Cancel</button>
          <button className="create-btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Create Enrollment'}</button>
        </div>
      </header>

      <form className="enrollment-form" onSubmit={handleSubmit} noValidate>
        {success && <div className="success-banner">{success}</div>}
        {error && <div className="form-error">{error}</div>}
        <section className="form-section">
          <h3>Student Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required />
              {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Middle Name</label>
              <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle name" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input name="dob" type="date" value={form.dob} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Number</label>
              <input name="admissionNumber" value={form.admissionNumber} onChange={handleChange} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">Class</label>
              <input name="className" value={form.className} onChange={handleChange} placeholder="Class" />
            </div>
            <div className="form-group">
              <label className="form-label">Arm / Section</label>
              <input name="arm" value={form.arm} onChange={handleChange} placeholder="Arm / Section" />
            </div>
            <div className="form-group">
              <label className="form-label">Session</label>
              <input name="session" value={form.session} onChange={handleChange} placeholder="e.g., 2025/2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Date</label>
              <input name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Parent / Guardian Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Parent Name</label>
              <input name="parentName" value={form.parentName} onChange={handleChange} />
              {fieldErrors.parentName && <div className="field-error">{fieldErrors.parentName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input name="parentRelationship" value={form.parentRelationship} onChange={handleChange} />
              {fieldErrors.parentRelationship && <div className="field-error">{fieldErrors.parentRelationship}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="parentEmail" type="email" value={form.parentEmail} onChange={handleChange} />
              {fieldErrors.parentEmail && <div className="field-error">{fieldErrors.parentEmail}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="parentPhone" value={form.parentPhone} onChange={handleChange} />
              {fieldErrors.parentPhone && <div className="field-error">{fieldErrors.parentPhone}</div>}
            </div>
            <div className="form-group full">
              <label className="form-label">Home Address</label>
              <textarea name="homeAddress" value={form.homeAddress} onChange={handleChange} rows={2} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Academic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Previous School</label>
              <input name="previousSchool" value={form.previousSchool} onChange={handleChange} placeholder="Previous school (if any)" />
            </div>
            <div className="form-group">
              <label className="form-label">Class / Level</label>
              <input name="className" value={form.className} onChange={handleChange} placeholder="e.g., JSS1" />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Date</label>
              <input name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Optional notes about the student's admission" />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Medical Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} placeholder="e.g., O+" />
            </div>
            <div className="form-group">
              <label className="form-label">Genotype</label>
              <input name="genotype" value={form.genotype} onChange={handleChange} placeholder="e.g., AA" />
            </div>
            <div className="form-group full">
              <label className="form-label">Allergies / Medical Notes</label>
              <textarea name="allergies" value={form.allergies} onChange={handleChange} rows={3} placeholder="List allergies, medical conditions, medications" />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Emergency Contact</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input name="emergencyContactName" value={form.emergencyContactName || ''} onChange={handleChange} placeholder="Emergency contact name" />
            </div>
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input name="emergencyContactRelationship" value={form.emergencyContactRelationship || ''} onChange={handleChange} placeholder="e.g., Parent, Uncle" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="emergencyContactPhone" value={form.emergencyContactPhone || ''} onChange={handleChange} placeholder="Emergency phone number" />
            </div>
          </div>
        </section>

        <section className="form-section docs">
          <h3>Documents</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Passport Photo</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'passportPhoto')} />
              {documents.find(d => d.documentType === 'passportPhoto') && (
                <div className="file-preview">
                  <img src={documents.find(d => d.documentType === 'passportPhoto').preview} alt="passport" />
                  <div className="file-meta">
                    <span>{documents.find(d => d.documentType === 'passportPhoto').name}</span>
                    <button type="button" className="btn-ghost" onClick={() => removeDocument('passportPhoto')}>Remove</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Birth Certificate</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileSelect(e, 'birthCertificate')} />
              {documents.find(d => d.documentType === 'birthCertificate') && (
                <div className="file-preview">
                  <img src={documents.find(d => d.documentType === 'birthCertificate').preview} alt="birth" />
                  <div className="file-meta">
                    <span>{documents.find(d => d.documentType === 'birthCertificate').name}</span>
                    <button type="button" className="btn-ghost" onClick={() => removeDocument('birthCertificate')}>Remove</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Previous Result / Records</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileSelect(e, 'previousResult')} />
              {documents.find(d => d.documentType === 'previousResult') && (
                <div className="file-preview">
                  <img src={documents.find(d => d.documentType === 'previousResult').preview} alt="result" />
                  <div className="file-meta">
                    <span>{documents.find(d => d.documentType === 'previousResult').name}</span>
                    <button type="button" className="btn-ghost" onClick={() => removeDocument('previousResult')}>Remove</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group full">
              <label className="form-label">Other Documents (Medical, etc.)</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileSelect(e, 'other')} />
              {documents.find(d => d.documentType === 'other') && (
                <div className="file-preview">
                  <img src={documents.find(d => d.documentType === 'other').preview} alt="other" />
                  <div className="file-meta">
                    <span>{documents.find(d => d.documentType === 'other').name}</span>
                    <button type="button" className="btn-ghost" onClick={() => removeDocument('other')}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {fieldErrors.documents && <div className="field-error">{fieldErrors.documents}</div>}
        </section>

        <div className="form-actions" style={{marginTop: 6}}>
          <button type="button" className="btn-muted" onClick={() => navigate('/dashboard/students/enrollment')}>Cancel</button>
          <button type="submit" className="create-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{marginRight:8, borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.2)'}} /> Saving...
              </>
            ) : 'Create Enrollment'}
          </button>
        </div>
      </form>
    </div>
  );
}
