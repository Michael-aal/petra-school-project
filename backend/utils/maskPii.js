export const maskEmail = (email) => {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return `${name[0]}***@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return null;
  // Masks all but the last 4 digits: *******1234
  return phone.replace(/.(?=.{4})/g, '*');
};

export const maskStudentData = (student) => {
  return {
    ...student,
    email: student.email ? maskEmail(student.email) : student.email,
    phone: student.phone ? maskPhone(student.phone) : student.phone,
    nationalId: student.nationalId ? '***-**-****' : student.nationalId,
  };
};