const BASE = 'http://localhost:5000';

const api = async (path, { method = 'GET', token, schoolId, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (schoolId) headers['x-school-id'] = String(schoolId);
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  console.log('\nREQ', path, { status: res.status, schoolId, hasToken: !!token });
  console.log(JSON.stringify(data, null, 2));
  return { status: res.status, data };
};

const password = 'Passw0rd!23';
const suffix = Date.now().toString(36);

const run = async () => {
  const regA = await api('/api/auth/register', { method: 'POST', body: {
    firstName: 'Ada', lastName: 'Obi', username: `ada_${suffix}`,
    email: `ada_${suffix}@petra.dev`, password, confirmPassword: password, role: 'principal',
    institution: `Petra School ${suffix}`, institutionType: 'secondary', state: 'Lagos', city: 'Ikeja'
  }});
  const schoolA = regA.data.user.schoolId;
  const regB = await api('/api/auth/register', { method: 'POST', body: {
    firstName: 'Bola', lastName: 'Ade', username: `bola_${suffix}`,
    email: `bola_${suffix}@sunrise.dev`, password, confirmPassword: password, role: 'principal',
    institution: `Sunrise Academy ${suffix}`, institutionType: 'primary', state: 'Oyo', city: 'Ibadan'
  }});
  const schoolB = regB.data.user.schoolId;
  const sa = await api('/api/auth/login', { method: 'POST', body: { email: 'superadmin@petraschools.dev', password: 'SuperAdmin#2026' } });
  const saToken = sa.data.token;
  const selectA = await api('/api/auth/select-school', { method: 'POST', token: saToken, body: { schoolId: schoolA } });
  const listA = await api('/api/students', { token: saToken, schoolId: schoolA });
  const listB = await api('/api/students', { token: saToken, schoolId: schoolB });
  console.log('\nSESSION STATE', { schoolA, schoolB, selectAStatus: selectA.status, listAStatus: listA.status, listBStatus: listB.status, listAStudents: listA.data?.students?.length, listBStudents: listB.data?.students?.length });
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
