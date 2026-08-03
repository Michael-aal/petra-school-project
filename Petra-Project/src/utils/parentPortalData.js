const parentPortalStorageKey = "petra_parent_portal_records";

export const parentPortalProfiles = [
  {
    id: 1,
    parentName: "Mr. Ogunleye Kayode",
    email: "ogunleye.k@gmail.com",
    phoneNumber: "+234 801 234 5678",
    linkedStudents: 2,
    inviteStatus: "Active",
    lastInvited: "2 days ago",
    children: [
      {
        id: 101,
        name: "Ayo Ogunleye",
        class: "JSS 2",
        teacher: "Mrs. Adeyemi",
        status: "On Track",
        attendance: {
          average: "92%",
          present: "18/20",
          late: "2",
          absent: "0",
          note: "Strong term attendance",
        },
        results: {
          average: "81%",
          subjects: [
            { name: "English", score: "81%", trend: "Up" },
            { name: "Math", score: "74%", trend: "Steady" },
            { name: "Biology", score: "79%", trend: "Up" },
          ],
        },
        assignments: [
          { title: "Science Homework", due: "Tomorrow", status: "Pending" },
          { title: "Reading Log", due: "Friday", status: "Pending" },
        ],
        fees: [
          { title: "School Fees", amount: "₦48,000", status: "Pending" },
          { title: "Transport", amount: "₦7,500", status: "Pending" },
        ],
        announcements: [
          { title: "Parent-Teacher Meeting", detail: "Thursday • 10:00" },
        ],
        messages: [
          { from: "Mrs. Adeyemi", note: "Ayo improved in reading this week." },
        ],
      },
      {
        id: 102,
        name: "Tolu Ogunleye",
        class: "Primary 5",
        teacher: "Mr. Bamidele",
        status: "Needs Support",
        attendance: {
          average: "85%",
          present: "17/20",
          late: "3",
          absent: "0",
          note: "Needs support on punctuality",
        },
        results: {
          average: "74%",
          subjects: [
            { name: "English", score: "76%", trend: "Steady" },
            { name: "Math", score: "71%", trend: "Needs Review" },
          ],
        },
        assignments: [
          { title: "Math Practice", due: "Monday", status: "Pending" },
          { title: "Reading Task", due: "Wednesday", status: "Pending" },
        ],
        fees: [{ title: "School Fees", amount: "₦32,000", status: "Pending" }],
        announcements: [
          { title: "Mid-Term Revision", detail: "Friday • 14:00" },
        ],
        messages: [
          {
            from: "Mr. Bamidele",
            note: "Tolu needs extra practice in mathematics.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    parentName: "Mrs. Adebayo Vitor",
    email: "vitor.adebayo@yahoo.com",
    phoneNumber: "+234 802 345 6789",
    linkedStudents: 1,
    inviteStatus: "Pending",
    lastInvited: "5 hours ago",
    children: [
      {
        id: 201,
        name: "Dare Adebayo",
        class: "SS 1",
        teacher: "Mrs. Chika",
        status: "Excellent",
        attendance: {
          average: "96%",
          present: "19/20",
          late: "1",
          absent: "0",
          note: "Excellent attendance",
        },
        results: {
          average: "88%",
          subjects: [
            { name: "English", score: "88%", trend: "Excellent" },
            { name: "Economics", score: "85%", trend: "Up" },
          ],
        },
        assignments: [
          { title: "Essay Submission", due: "Today", status: "Completed" },
        ],
        fees: [{ title: "School Fees", amount: "₦56,000", status: "Paid" }],
        announcements: [{ title: "Open Day", detail: "Saturday • 09:00" }],
        messages: [
          { from: "Mrs. Chika", note: "Dare is performing well in class." },
        ],
      },
    ],
  },
  {
    id: 3,
    parentName: "Chief Fakorade",
    email: "fakorade.chief@outlook.com",
    phoneNumber: "+234 803 456 7890",
    linkedStudents: 3,
    inviteStatus: "Active",
    lastInvited: "1 week ago",
    children: [
      {
        id: 301,
        name: "Emeka Fakorade",
        class: "SS 3",
        teacher: "Mr. Yusuf",
        status: "On Track",
        attendance: {
          average: "90%",
          present: "18/20",
          late: "2",
          absent: "0",
          note: "Stable performance",
        },
        results: {
          average: "82%",
          subjects: [
            { name: "Physics", score: "80%", trend: "Steady" },
            { name: "Math", score: "84%", trend: "Up" },
          ],
        },
        assignments: [
          { title: "Physics Revision", due: "Tomorrow", status: "Pending" },
        ],
        fees: [{ title: "School Fees", amount: "₦60,000", status: "Pending" }],
        announcements: [{ title: "Exam Timetable", detail: "Next week" }],
        messages: [
          { from: "Mr. Yusuf", note: "Emeka is preparing well for exams." },
        ],
      },
      {
        id: 302,
        name: "Ife Fakorade",
        class: "JSS 1",
        teacher: "Mrs. Nwosu",
        status: "Improving",
        attendance: {
          average: "89%",
          present: "17/20",
          late: "3",
          absent: "0",
          note: "Improving attendance",
        },
        results: {
          average: "77%",
          subjects: [
            { name: "English", score: "77%", trend: "Up" },
            { name: "Science", score: "76%", trend: "Steady" },
          ],
        },
        assignments: [
          { title: "Science Worksheet", due: "Wednesday", status: "Pending" },
        ],
        fees: [{ title: "Transport", amount: "₦5,000", status: "Pending" }],
        announcements: [{ title: "Library Day", detail: "Friday • 13:00" }],
        messages: [
          { from: "Mrs. Nwosu", note: "Ife is progressing steadily." },
        ],
      },
      {
        id: 303,
        name: "Kemi Fakorade",
        class: "Primary 4",
        teacher: "Miss Tunde",
        status: "Stable",
        attendance: {
          average: "94%",
          present: "19/20",
          late: "1",
          absent: "0",
          note: "Very good attendance",
        },
        results: {
          average: "79%",
          subjects: [
            { name: "English", score: "79%", trend: "Good" },
            { name: "Art", score: "81%", trend: "Excellent" },
          ],
        },
        assignments: [
          { title: "Reading Task", due: "Friday", status: "Completed" },
        ],
        fees: [{ title: "School Fees", amount: "₦24,000", status: "Paid" }],
        announcements: [{ title: "School Picnic", detail: "Next month" }],
        messages: [
          { from: "Miss Tunde", note: "Kemi is doing well in class." },
        ],
      },
    ],
  },
  {
    id: 4,
    parentName: "Alhaji Ibrahim",
    email: "ibrahim.a@gmail.com",
    phoneNumber: "+234 804 567 8901",
    linkedStudents: 2,
    inviteStatus: "Pending",
    lastInvited: "Just now",
    children: [
      {
        id: 401,
        name: "Rabi Ibrahim",
        class: "Primary 6",
        teacher: "Mrs. Bello",
        status: "On Track",
        attendance: {
          average: "91%",
          present: "18/20",
          late: "2",
          absent: "0",
          note: "Good attendance",
        },
        results: {
          average: "80%",
          subjects: [
            { name: "English", score: "80%", trend: "Good" },
            { name: "Math", score: "78%", trend: "Steady" },
          ],
        },
        assignments: [
          { title: "Homework Book", due: "Tomorrow", status: "Pending" },
        ],
        fees: [{ title: "School Fees", amount: "₦36,000", status: "Pending" }],
        announcements: [{ title: "Assembly Notice", detail: "Monday • 08:00" }],
        messages: [
          { from: "Mrs. Bello", note: "Rabi is showing steady improvement." },
        ],
      },
      {
        id: 402,
        name: "Musa Ibrahim",
        class: "JSS 3",
        teacher: "Mr. Okafor",
        status: "Needs Support",
        attendance: {
          average: "84%",
          present: "17/20",
          late: "3",
          absent: "0",
          note: "Needs improvement",
        },
        results: {
          average: "71%",
          subjects: [
            { name: "English", score: "73%", trend: "Needs Review" },
            { name: "Math", score: "69%", trend: "Needs Review" },
          ],
        },
        assignments: [
          { title: "Revision Notes", due: "Friday", status: "Pending" },
        ],
        fees: [{ title: "Transport", amount: "₦3,500", status: "Pending" }],
        announcements: [
          { title: "Guidance Session", detail: "Thursday • 15:00" },
        ],
        messages: [
          {
            from: "Mr. Okafor",
            note: "Musa needs more support in core subjects.",
          },
        ],
      },
    ],
  },
];

function getDefaultChildProfile(studentName, fallbackChild = null) {
  const baseName = String(studentName || "").trim();
  const childName = baseName || fallbackChild?.name || "Assigned Student";
  const matchedChild = fallbackChild || parentPortalProfiles.flatMap((profile) => profile.children || []).find((child) => child.name.toLowerCase() === childName.toLowerCase());

  return {
    id: `${childName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name: childName,
    class: matchedChild?.class || "Assigned Class",
    teacher: matchedChild?.teacher || "Assigned Teacher",
    status: matchedChild?.status || "On Track",
    attendance: matchedChild?.attendance || { average: "—", present: "—", late: "0", absent: "0", note: "Updated by admin" },
    results: matchedChild?.results || { average: "—", subjects: [] },
    assignments: matchedChild?.assignments || [],
    fees: matchedChild?.fees || [],
    announcements: matchedChild?.announcements || [],
    messages: matchedChild?.messages || [],
  };
}

function buildProfileFromRecord(record, baseProfile = null) {
  const profile = baseProfile || {};
  const baseChildren = Array.isArray(profile.children) ? profile.children : [];
  const assignedStudents = Array.isArray(record.assignedStudents) ? record.assignedStudents.filter(Boolean) : [];
  const children = [];
  const seen = new Set();

  assignedStudents.forEach((studentName, index) => {
    const matchedChild = baseChildren.find((child) => child.name.toLowerCase() === String(studentName).toLowerCase());
    const child = getDefaultChildProfile(studentName, matchedChild);
    child.id = `${profile.id || record.id || "parent"}-${index + 1}`;
    children.push(child);
    seen.add(String(studentName).toLowerCase());
  });

  baseChildren.forEach((child) => {
    if (!seen.has(child.name.toLowerCase())) {
      children.push({ ...child, id: child.id || `${profile.id || record.id || "parent"}-${children.length + 1}` });
    }
  });

  return {
    ...profile,
    ...record,
    id: Number(record.id ?? profile.id ?? 0),
    parentName: record.parentName || profile.parentName || "Parent",
    email: record.email || profile.email || "",
    phoneNumber: record.phoneNumber || profile.phoneNumber || "",
    linkedStudents: Number(record.linkedStudents ?? (assignedStudents.length || children.length || 0)),
    inviteStatus: record.inviteStatus || profile.inviteStatus || "Pending",
    lastInvited: record.lastInvited || profile.lastInvited || "Just now",
    assignedStudents,
    children,
  };
}

export function getStoredParentPortalRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(parentPortalStorageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveParentPortalRecords(records) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(parentPortalStorageKey, JSON.stringify(records));
  } catch {
    // Ignore storage write issues in the browser
  }
}

export function getParentPortalProfiles() {
  const savedRecords = getStoredParentPortalRecords();
  const baseProfiles = parentPortalProfiles.map((profile) => buildProfileFromRecord({}, profile));
  const savedProfiles = savedRecords.map((record) => {
    const matchedBase = baseProfiles.find((profile) => Number(profile.id) === Number(record.id));
    return buildProfileFromRecord(record, matchedBase || null);
  });

  const mergedProfiles = [...baseProfiles];
  savedProfiles.forEach((profile) => {
    const existingIndex = mergedProfiles.findIndex((item) => Number(item.id) === Number(profile.id));
    if (existingIndex >= 0) {
      mergedProfiles[existingIndex] = profile;
    } else {
      mergedProfiles.push(profile);
    }
  });

  return mergedProfiles;
}

export function getParentPortalProfile(parentIdOrEmail) {
  const value = String(parentIdOrEmail ?? "").trim();

  if (!value) {
    return null;
  }

  const profiles = getParentPortalProfiles();

  return (
    profiles.find((profile) => {
      if (Number.isInteger(Number(value)) && Number(value) > 0) {
        return Number(profile.id) === Number(value);
      }

      return String(profile.email || "").toLowerCase() === value.toLowerCase();
    }) || null
  );
}

export function getSavedParentPortalId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem("petra_selected_parent_id") || "";
  } catch {
    return "";
  }
}

export function setSavedParentPortalId(parentId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("petra_selected_parent_id", String(parentId));
  } catch {
    // Ignore storage write issues in the browser
  }
}
