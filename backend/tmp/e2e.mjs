// End-to-end multi-school flow test against the running backend.
const BASE = "http://localhost:5000";

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

const api = async (path, { method = "GET", token, schoolId, body } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (schoolId) headers["x-school-id"] = String(schoolId);
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const suffix = Date.now().toString(36);
const password = "Passw0rd!23";

const main = async () => {
  console.log("== 1. Health ==");
  const health = await api("/health");
  ok("health", health.status === 200);

  console.log("== 2. Register principal A (Petra School) ==");
  const regA = await api("/api/auth/register", { method: "POST", body: {
    firstName: "Ada", lastName: "Obi", username: `ada_${suffix}`, email: `ada_${suffix}@petra.dev`,
    password, confirmPassword: password, role: "principal",
    institution: `Petra School ${suffix}`, institutionType: "secondary", state: "Lagos", city: "Ikeja",
  }});
  ok("register A returns 201", regA.status === 201, JSON.stringify(regA.data));
  const schoolA = regA.data?.user?.schoolId;
  ok("register A has schoolId", Boolean(schoolA), JSON.stringify(regA.data?.user));
  const tokenA = regA.data?.token;

  console.log("== 3. Login A + /me (session restore) ==");
  const loginA = await api("/api/auth/login", { method: "POST", body: { email: `ada_${suffix}@petra.dev`, password } });
  ok("login A ok", loginA.status === 200);
  ok("login A schoolId matches", loginA.data?.user?.schoolId === schoolA, `got ${loginA.data?.user?.schoolId}`);
  const meA = await api("/api/auth/me", { token: loginA.data?.token });
  ok("/me A ok", meA.status === 200);
  ok("/me A schoolId", meA.data?.user?.schoolId === schoolA, `got ${meA.data?.user?.schoolId}`);
  ok("/me A school name", (meA.data?.user?.school?.name || "").startsWith("Petra School"), JSON.stringify(meA.data?.user?.school));

  console.log("== 4. A creates two students ==");
  const studentBody = (name, parent, cls, gender, mail) => ({
    name, parentName: parent, className: cls, gender,
    parentRelationship: "Mother", parentEmail: mail, parentPhone: "+2348012345678",
  });
  const s1 = await api("/api/students", { method: "POST", token: tokenA, body: studentBody("Student One", "Parent One", "JSS1", "male", `p1_${suffix}@x.dev`) });
  ok("create student 1", s1.status === 201, JSON.stringify(s1.data));
  const s2 = await api("/api/students", { method: "POST", token: tokenA, body: studentBody("Student Two", "Parent Two", "JSS2", "female", `p2_${suffix}@x.dev`) });
  ok("create student 2", s2.status === 201);
  const listA1 = await api("/api/students", { token: tokenA });
  ok("A sees 2 students", listA1.data?.students?.length === 2, `got ${listA1.data?.students?.length}`);

  console.log("== 5. Register principal B (new school) ==");
  const regB = await api("/api/auth/register", { method: "POST", body: {
    firstName: "Bola", lastName: "Ade", username: `bola_${suffix}`, email: `bola_${suffix}@sunrise.dev`,
    password, confirmPassword: password, role: "principal",
    institution: `Sunrise Academy ${suffix}`, institutionType: "primary", state: "Oyo", city: "Ibadan",
  }});
  ok("register B 201", regB.status === 201, JSON.stringify(regB.data));
  const schoolB = regB.data?.user?.schoolId;
  const tokenB = regB.data?.token;
  ok("B has different schoolId", Boolean(schoolB) && schoolB !== schoolA, `A=${schoolA} B=${schoolB}`);

  console.log("== 6. Isolation: B sees no Petra data ==");
  const listB0 = await api("/api/students", { token: tokenB });
  ok("B sees 0 students", listB0.status === 200 && listB0.data?.students?.length === 0, `status ${listB0.status} got ${listB0.data?.students?.length}`);
  const s3 = await api("/api/students", { method: "POST", token: tokenB, body: studentBody("Sunrise Kid", "Sunrise Parent", "P1", "female", `p3_${suffix}@x.dev`) });
  ok("B creates student", s3.status === 201, JSON.stringify(s3.data));
  const listB1 = await api("/api/students", { token: tokenB });
  ok("B sees exactly 1", listB1.data?.students?.length === 1, `got ${listB1.data?.students?.length}`);
  const listA2 = await api("/api/students", { token: tokenA });
  ok("A still sees 2", listA2.data?.students?.length === 2, `got ${listA2.data?.students?.length}`);

  console.log("== 7. Cross-school access blocked ==");
  const bStudentId = s3.data?.student?.id;
  const crossGet = await api(`/api/students/${bStudentId}`, { token: tokenA });
  ok("A cannot read B's student", crossGet.status === 404 || crossGet.status === 403, `status ${crossGet.status}`);
  const crossUpd = await api(`/api/students/${bStudentId}`, { method: "PATCH", token: tokenA, body: { name: "Hacked" } });
  ok("A cannot update B's student", crossUpd.status === 404 || crossUpd.status === 403, `status ${crossUpd.status}`);
  const crossDel = await api(`/api/students/${bStudentId}`, { method: "DELETE", token: tokenA });
  ok("A cannot delete B's student", crossDel.status === 404 || crossDel.status === 403, `status ${crossDel.status}`);

  console.log("== 8. Announcements isolation ==");
  const annA = await api("/api/announcements", { method: "POST", token: tokenA, body: { title: "Petra Only", body: "Petra announcement", audience: "TEACHERS_AND_PARENTS" } });
  ok("A creates announcement", annA.status === 200 || annA.status === 201, JSON.stringify(annA.data).slice(0, 200));
  const annListB = await api("/api/announcements", { token: tokenB });
  const bTitles = (annListB.data?.announcements || []).map(a => a.title);
  ok("B does not see Petra announcement", !bTitles.includes("Petra Only"), JSON.stringify(bTitles));

  console.log("== 9. Duplicate school name rejected ==");
  const regDup = await api("/api/auth/register", { method: "POST", body: {
    firstName: "Dup", lastName: "User", username: `dup_${suffix}`, email: `dup_${suffix}@x.dev`,
    password, confirmPassword: password, role: "principal", institution: `Petra School ${suffix}`,
  }});
  ok("duplicate school 409", regDup.status === 409, `status ${regDup.status}`);

  console.log("== 10. Super admin flow ==");
  const saLogin = await api("/api/auth/login", { method: "POST", body: { email: "superadmin@petraschools.dev", password: "SuperAdmin#2026" } });
  ok("superadmin login", saLogin.status === 200, JSON.stringify(saLogin.data).slice(0, 200));
  const saToken = saLogin.data?.token;
  const saNoSchool = await api("/api/students", { token: saToken });
  // 403 on a fresh superadmin; 200 if a school selection persisted from an earlier session.
  ok("superadmin without header handled", saNoSchool.status === 403 || saNoSchool.status === 200, `status ${saNoSchool.status}`);
  const saSelect = await api("/api/auth/select-school", { method: "POST", token: saToken, body: { schoolId: schoolA } });
  ok("superadmin select school", saSelect.status === 200, JSON.stringify(saSelect.data).slice(0, 200));
  const saList = await api("/api/students", { token: saToken, schoolId: schoolA });
  ok("superadmin sees Petra students via header", saList.data?.students?.length === 2, `got ${saList.data?.students?.length}`);
  const saListB = await api("/api/students", { token: saToken, schoolId: schoolB });
  ok("superadmin switches to school B via header", saListB.data?.students?.length === 1, `got ${saListB.data?.students?.length}`);
  const saSchools = await api("/api/superadmin/schools", { token: saToken });
  ok("superadmin lists schools", saSchools.status === 200 && (saSchools.data?.data?.schools?.length >= 2 || saSchools.data?.schools?.length >= 2), JSON.stringify(saSchools.data).slice(0, 300));

  console.log("== 11. Staff invitation inherits school ==");
  const inv = await api("/api/auth/staff/invitations", { method: "POST", token: tokenA, body: { staffName: "Teach Er", email: `teach_${suffix}@petra.dev`, role: "teacher", department: "Science" } });
  ok("A creates staff invitation", inv.status === 201, JSON.stringify(inv.data).slice(0, 300));
  const code = inv.data?.invitation?.registrationCode;
  const act = await api("/api/auth/staff/activate", { method: "POST", body: { email: `teach_${suffix}@petra.dev`, password, code } });
  ok("staff activates", act.status === 200, JSON.stringify(act.data).slice(0, 300));
  ok("staff has school A", act.data?.user?.schoolId === schoolA, `got ${act.data?.user?.schoolId}`);

  console.log("== 12. Superadmin-created school adopted by first principal ==");
  const saCreate = await api("/api/superadmin/schools", { method: "POST", token: saToken, body: { name: `Precreated School ${suffix}`, country: "Nigeria" } });
  ok("superadmin creates school", saCreate.status === 200 || saCreate.status === 201, JSON.stringify(saCreate.data).slice(0, 200));
  const preId = saCreate.data?.data?.id || saCreate.data?.school?.id || saCreate.data?.id;
  const regC = await api("/api/auth/register", { method: "POST", body: {
    firstName: "Chidi", lastName: "Eze", username: `chidi_${suffix}`, email: `chidi_${suffix}@pre.dev`,
    password, confirmPassword: password, role: "principal", institution: `Precreated School ${suffix}`,
  }});
  ok("first principal adopts precreated school", regC.status === 201 && regC.data?.user?.schoolId === preId, `status ${regC.status} schoolId ${regC.data?.user?.schoolId} expected ${preId}`);
  const regC2 = await api("/api/auth/register", { method: "POST", body: {
    firstName: "Late", lastName: "Comer", username: `late_${suffix}`, email: `late_${suffix}@pre.dev`,
    password, confirmPassword: password, role: "principal", institution: `Precreated School ${suffix}`,
  }});
  ok("second principal for same school rejected", regC2.status === 409, `status ${regC2.status}`);

  console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
};

main().catch((e) => { console.error("E2E crashed:", e); process.exit(1); });
