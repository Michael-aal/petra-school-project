async function run() {
  const url = process.env.URL || 'http://localhost:5000/api/admissions';
  const payload = {
    firstName: 'HTTP',
    lastName: 'Applicant',
    gender: 'female',
    dob: '2016-01-01',
    stateOfOrigin: 'State',
    lga: 'LGA',
    admissionClass: 'JSS 1',
    studentStatus: 'new',
    religion: 'None',
    fatherName: 'Father Name',
    fatherAddress: 'Father Address',
    fatherOccupation: 'Father Job',
    fatherEmail: 'father@example.com',
    fatherPhone1: '08011112222',
    motherName: 'Mother Name',
    motherAddress: 'Mother Address',
    motherOccupation: 'Mother Job',
    motherEmail: 'mother@example.com',
    motherPhone1: '08011113333',
    feePaymentMethod: 'bank',
    agreeTerms: 'true',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('HTTP request failed:', err);
    process.exit(1);
  }
}

run();
