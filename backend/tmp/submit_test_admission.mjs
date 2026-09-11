const API = process.env.API_URL || 'http://localhost:5000';

const payload = {
  firstName: 'Test',
  lastName: 'Applicant',
  gender: 'male',
  dob: '2015-01-01',
  stateOfOrigin: 'Lagos',
  lga: 'Ikeja',
  admissionClass: 'JSS1',
  studentStatus: 'new',
  religion: 'Christianity',
  fatherName: 'Test Father',
  fatherAddress: '123 Father St',
  fatherOccupation: 'Engineer',
  fatherEmail: 'father@example.com',
  fatherPhone1: '08011111111',
  motherName: 'Test Mother',
  motherAddress: '123 Mother St',
  motherOccupation: 'Teacher',
  motherEmail: 'mother@example.com',
  motherPhone1: '08022222222',
  feePaymentMethod: 'offline',
  agreeTerms: 'true',
};

(async () => {
  try {
    const res = await fetch(`${API}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    console.log('Status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error', err.message);
    process.exit(1);
  }
})();
