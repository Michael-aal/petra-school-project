import { useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  Database,
  FileClock,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  School,
  Settings2,
  Shield,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { SchoolContext } from "../../../../context/SchoolContext";
import { authApi } from "../../../../services/authApi";
import { superAdminApi } from "../../../../services/superAdminApi";
import { normalizeRole } from "../../../../utils/roleAccess";
import { getDisplayName, normalizeUser } from "../../../../utils/userProfile";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import EmptyState from "../../../../components/dashboard/EmptyState";
import StatCard from "../../../../components/dashboard/StatCard";
import "../../../../components/dashboard/dashboard.css";
import "./superadmin.css";

const navItems = [
  { label: "Dashboard", href: "/dev", icon: LayoutDashboard },
  { label: "Schools", href: "/dev/schools", icon: School },
  { label: "Users", href: "/dev/users", icon: Users },
  { label: "Roles & Permissions", href: "/dev/roles", icon: Layers3 },
  { label: "System Logs", href: "/dev/logs", icon: FileClock },
  { label: "System Settings", href: "/dev/settings", icon: Settings2 },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatStatus = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "active" || normalized === "true") return "Active";
  if (normalized === "inactive" || normalized === "false") return "Inactive";
  return value || "—";
};

function Sidebar({ onLogout, mobileOpen, onNavigate }) {
  const location = useLocation();

  return (
    <aside className={`superadmin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="superadmin-brand">
        <div className="superadmin-brand-mark">
          <Shield size={18} />
        </div>
        <div>
          <strong>DEV / SUPERADMIN</strong>
          <span>System-level access</span>
        </div>
      </div>

      <nav className="superadmin-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={() => `superadmin-nav-item ${active ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="superadmin-sidebar-footer">
        <NavLink to="/dev/settings" onClick={onNavigate} className={({ isActive }) => `superadmin-footer-link ${isActive ? "active" : ""}`}>
          <UserCog size={16} /> Profile
        </NavLink>
        <button type="button" className="superadmin-footer-link danger" onClick={onLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle, onMenu, user }) {
  const { selectedSchoolId, selectedSchool, selectSchool, schoolReady } = useContext(SchoolContext);
  const [pendingSchoolId, setPendingSchoolId] = useState("");
  const [availableSchools, setAvailableSchools] = useState([]);
  const [pickerError, setPickerError] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    if (!schoolReady) return;
    superAdminApi.schools({ page: 1, limit: 100 }).then((res) => setAvailableSchools(res.data?.schools || [])).catch(() => setAvailableSchools([]));
  }, [schoolReady]);

  useEffect(() => {
    setPendingSchoolId(selectedSchoolId || "");
  }, [selectedSchoolId]);

  return (
    <header className="superadmin-topbar">
      <div className="superadmin-topbar-left">
        <button type="button" className="superadmin-menu-btn" onClick={onMenu} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div>
          <p className="superadmin-eyebrow">SuperAdmin</p>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <div className="superadmin-topbar-right">
        <label className="superadmin-school-picker">
          <span>School</span>
          <div className="superadmin-school-picker-control">
            <select
              value={pendingSchoolId}
              disabled={pickerLoading}
              onChange={(event) => {
                setPickerError("");
                setPendingSchoolId(event.target.value);
              }}
            >
              <option value="">Select School</option>
              {availableSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="superadmin-school-picker-submit"
              disabled={pickerLoading || !pendingSchoolId || pendingSchoolId === selectedSchoolId}
              onClick={async () => {
                setPickerError("");
                setPickerLoading(true);
                try {
                  await selectSchool(pendingSchoolId);
                } catch (error) {
                  setPickerError(error?.message || "Failed to select school. Please try again.");
                } finally {
                  setPickerLoading(false);
                }
              }}
            >
              Continue
            </button>
          </div>
          {pickerError ? <p className="superadmin-school-picker-error">{pickerError}</p> : null}
        </label>
        <div className="superadmin-user-pill">
          <strong>{getDisplayName(user) || "SuperAdmin"}</strong>
          <span>{selectedSchool?.name || "Select a school to continue."}</span>
        </div>
      </div>
    </header>
  );
}

function Table({ columns, rows, emptyMessage }) {
  if (!rows?.length) {
    return <EmptyState title={emptyMessage} description="No records were found." icon={Database} />;
  }

  return (
    <div className="superadmin-table-wrap">
      <table className="superadmin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function SkeletonTable({ columns = 6, rows = 4 }) {
  return (
    <div className="superadmin-skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="superadmin-skeleton-row">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <span key={colIndex} className="superadmin-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

function CreateSchoolModal({ open, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    country: "",
    state: "",
    city: "",
    timezone: "Africa/Lagos",
    logo: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm({
        name: "",
        address: "",
        email: "",
        phone: "",
        website: "",
        country: "",
        state: "",
        city: "",
        timezone: "Africa/Lagos",
        logo: "",
      });
      setError("");
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("School name is required.");
      return;
    }
    setError("");
    try {
      await onSubmit(form);
    } catch (submitError) {
      setError(submitError.data?.message || submitError.message || "Failed to create school");
    }
  };

  if (!open) return null;

  return (
    <div className="superadmin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="superadmin-modal">
        <div className="superadmin-modal-head">
          <div>
            <h3>Create School</h3>
            <p>Add a new school to the platform.</p>
          </div>
          <button type="button" className="superadmin-icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {error ? <div className="superadmin-alert error">{error}</div> : null}
        <form className="superadmin-form" onSubmit={submit}>
          <input name="name" placeholder="School name *" value={form.name} onChange={handleChange} />
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
          <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          <input name="timezone" placeholder="Timezone" value={form.timezone} onChange={handleChange} />
          <input name="logo" placeholder="Logo URL" value={form.logo} onChange={handleChange} />
          <div className="superadmin-modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              Create School
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="superadmin-detail-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { userInfo, setUserInfo, authReady } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: schoolId } = useParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSchool, setSavingSchool] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [schoolQuery, setSchoolQuery] = useState({ search: "", status: "" });
  const [userQuery, setUserQuery] = useState({ search: "", role: "", status: "", schoolId: "" });
  const [logQuery, setLogQuery] = useState({ search: "" });
  const [activeSchool, setActiveSchool] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const schoolContext = useContext(SchoolContext);

  const page = useMemo(() => {
    if (location.pathname.startsWith("/dev/schools")) return "schools";
    if (location.pathname.startsWith("/dev/users")) return "users";
    if (location.pathname.startsWith("/dev/logs")) return "logs";
    if (location.pathname.startsWith("/dev/roles")) return "roles";
    if (location.pathname.startsWith("/dev/settings")) return "settings";
    return "dashboard";
  }, [location.pathname]);

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 960) {
      setMobileOpen(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, schoolsRes, usersRes, logsRes] = await Promise.all([
        superAdminApi.stats(),
        superAdminApi.schools({ page: 1, limit: 5 }),
        superAdminApi.users({ page: 1, limit: 10 }),
        superAdminApi.logs({ page: 1, limit: 8 }),
      ]);
      setStats(statsRes.data);
      setSchools(schoolsRes.data?.schools || []);
      setUsers(usersRes.data?.users || []);
      setLogs(logsRes.data?.logs || []);
    } catch (loadError) {
      setError(loadError.data?.message || loadError.message || "Failed to load dashboard");
      if (loadError.status === 401 || loadError.status === 403) {
        navigate("/signin", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (normalizeRole(userInfo?.role) !== "super_admin") return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userInfo?.role, location.pathname]);

  useEffect(() => {
    if (!schoolId) {
      setActiveSchool(null);
      return;
    }

    superAdminApi.school(schoolId).then((res) => setActiveSchool(res.data)).catch(() => setActiveSchool(null));
  }, [schoolId]);

  useEffect(() => {
    if (activeSchool) {
      schoolContext.setSelectedSchool(activeSchool);
    }
  }, [activeSchool]);

  const refreshSchools = async (query = schoolQuery) => {
    const res = await superAdminApi.schools({ page: 1, limit: 20, ...query });
    setSchools(res.data?.schools || []);
  };

  const refreshUsers = async (query = userQuery) => {
    const res = await superAdminApi.users({ page: 1, limit: 20, ...query });
    setUsers(res.data?.users || []);
  };

  const refreshLogs = async (query = logQuery) => {
    const res = await superAdminApi.logs({ page: 1, limit: 20, ...query });
    setLogs(res.data?.logs || []);
  };

  const handleCreateSchool = async (payload) => {
    setSavingSchool(true);
    try {
      await superAdminApi.createSchool(payload);
      setCreateOpen(false);
      await refreshSchools();
      await loadAll();
    } finally {
      setSavingSchool(false);
    }
  };

  const toggleSchoolStatus = async (school) => {
    if (!window.confirm(`Are you sure you want to ${school.isActive ? "deactivate" : "activate"} ${school.name}?`)) return;
    await superAdminApi.updateSchoolStatus(school.id, !school.isActive);
    await refreshSchools();
    await loadAll();
  };

  const openSchoolDetails = async (school) => {
    const res = await superAdminApi.school(school.id);
    setActiveSchool(res.data);
    schoolContext.setSelectedSchool(res.data);
    navigate(`/dev/schools/${school.id}`);
    closeMobileSidebar();
  };

  if (!authReady) return null;
  if (normalizeRole(userInfo?.role) !== "super_admin") return <Navigate to="/signin" replace />;

  const statCards = stats
    ? [
        { label: "Total Schools", value: stats.totalSchools, icon: School, tone: "blue" },
        { label: "Active Schools", value: stats.activeSchools, icon: Building2, tone: "teal" },
        { label: "Inactive Schools", value: stats.inactiveSchools, icon: AlertTriangle, tone: "rose" },
        { label: "Total Users", value: stats.totalUsers, icon: Users, tone: "amber" },
        { label: "Total Students", value: stats.totalStudents, icon: LayoutDashboard, tone: "blue" },
        { label: "Total Teachers", value: stats.totalTeachers, icon: UserCog, tone: "teal" },
        { label: "Total Staff", value: stats.totalStaff, icon: Layers3, tone: "rose" },
      ]
    : [];

  const dashboardRows = (schools || []).map((school) => (
    <tr key={school.id}>
      <td>
        <strong>{school.name}</strong>
        <div className="superadmin-table-sub">{school.address || school.city || school.country || "—"}</div>
      </td>
      <td>{[school.city, school.state, school.country].filter(Boolean).join(", ") || "—"}</td>
      <td>{school.email || "—"}</td>
      <td>{school.phone || "—"}</td>
      <td>
        <span className={`status-badge ${school.isActive ? "active" : "inactive"}`}>{formatStatus(school.isActive)}</span>
      </td>
      <td>{formatDate(school.createdAt)}</td>
      <td className="actions-cell">
        <button type="button" onClick={() => openSchoolDetails(school)}>View</button>
        <button type="button" onClick={() => setCreateOpen(true)}>Edit</button>
      </td>
    </tr>
  ));

  const userRows = (users || []).map((user) => (
    <tr key={user.id}>
      <td>{user.fullName || user.username || "—"}</td>
      <td>{user.username || "—"}</td>
      <td>{user.email || "—"}</td>
      <td>{user.role || "—"}</td>
      <td>{user.school?.name || user.schoolName || "—"}</td>
      <td>
        <span className={`status-badge ${String(user.accountStatus).toLowerCase()}`}>{formatStatus(user.accountStatus)}</span>
      </td>
      <td>{formatDate(user.createdAt)}</td>
    </tr>
  ));

  const logRows = (logs || []).map((log) => (
    <tr key={log.id}>
      <td>{formatDate(log.date)}</td>
      <td>{log.user?.fullName || log.user?.email || "System"}</td>
      <td>{log.action}</td>
      <td>{log.entity}</td>
      <td>{log.school?.name || "System-wide"}</td>
      <td>{log.details || "—"}</td>
    </tr>
  ));

  return (
    <div className="superadmin-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={closeMobileSidebar}
        onLogout={async () => {
          try {
            await authApi.logout();
          } catch {
            // ignore logout errors
          } finally {
            setUserInfo(normalizeUser({}));
            navigate("/signin", { replace: true });
          }
        }}
      />

      {mobileOpen ? (
        <button type="button" className="superadmin-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close sidebar" />
      ) : null}

      <main className="superadmin-main">
        {schoolContext.schoolReady && !schoolContext.selectedSchoolId && normalizeRole(userInfo?.role) === "super_admin" && page !== "settings" && page !== "roles" ? (
          <div className="superadmin-alert error">Select a school to continue.</div>
        ) : null}
        <TopBar
          title={page === "dashboard" ? "SuperAdmin Dashboard" : page === "schools" ? "Schools" : page === "users" ? "Users" : page === "logs" ? "System Logs" : "System Settings"}
          subtitle={page === "dashboard" ? "System-wide overview and platform management" : page === "schools" ? "Manage all schools on the platform." : page === "users" ? "View and filter every platform user." : page === "logs" ? "Track system-wide activity." : "Configure platform settings."}
          onMenu={() => setMobileOpen((current) => !current)}
          user={userInfo}
        />

        {error ? <div className="superadmin-alert error">{error}</div> : null}

        {page === "dashboard" ? (
          <>
            <section className="dashboard-home-summary superadmin-summary-grid">
              {loading
                ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="superadmin-stat-skeleton" />)
                : statCards.map((item) => (
                    <StatCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                      description={item.label === "Inactive Schools" ? "Schools currently disabled" : "Live platform metric"}
                      trend="Live"
                    />
                  ))}
            </section>

            <section className="superadmin-grid">
              <DashboardWidget title="Recent Schools" subtitle="Latest schools added to the platform" actionLabel="View all">
                {loading ? <SkeletonTable columns={6} rows={4} /> : <Table columns={["School", "Location", "Status", "Users", "Created", "Actions"]} rows={dashboardRows} emptyMessage="No schools found" />}
              </DashboardWidget>

              <DashboardWidget title="Recent Activity" subtitle="Live system activity">
                {loading ? <SkeletonTable columns={6} rows={4} /> : <Table columns={["Date", "User", "Action", "Entity", "School", "Details"]} rows={logRows} emptyMessage="No recent system activity" />}
              </DashboardWidget>
            </section>
          </>
        ) : null}

        {page === "schools" ? (
          <section className="superadmin-section">
            <div className="superadmin-toolbar">
              <div className="superadmin-search">
                <Search size={16} />
                <input
                  placeholder="Search schools"
                  value={schoolQuery.search}
                  onChange={(event) => setSchoolQuery((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <select value={schoolQuery.status} onChange={(event) => setSchoolQuery((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="button" className="superadmin-primary-btn" onClick={() => refreshSchools()}>
                Search
              </button>
              <button type="button" className="superadmin-primary-btn ghost" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Create School
              </button>
            </div>
            <DashboardWidget title="Schools">
              {loading ? (
                <SkeletonTable columns={7} rows={5} />
              ) : (
                <Table
                  columns={["School Name", "Location", "Email", "Phone", "Status", "Created", "Actions"]}
                  rows={(schools || []).map((school) => (
                    <tr key={school.id}>
                      <td><strong>{school.name}</strong></td>
                      <td>{[school.city, school.state, school.country].filter(Boolean).join(", ") || "—"}</td>
                      <td>{school.email || "—"}</td>
                      <td>{school.phone || "—"}</td>
                      <td>
                        <span className={`status-badge ${school.isActive ? "active" : "inactive"}`}>{school.isActive ? "Active" : "Inactive"}</span>
                      </td>
                      <td>{formatDate(school.createdAt)}</td>
                      <td className="actions-cell">
                        <button type="button" onClick={() => openSchoolDetails(school)}>View</button>
                        <button type="button" onClick={() => toggleSchoolStatus(school)}>{school.isActive ? "Deactivate" : "Activate"}</button>
                      </td>
                    </tr>
                  ))}
                  emptyMessage="No schools found"
                />
              )}
            </DashboardWidget>
          </section>
        ) : null}

        {page === "users" ? (
          <section className="superadmin-section">
            <div className="superadmin-toolbar">
              <div className="superadmin-search">
                <Search size={16} />
                <input
                  placeholder="Search users"
                  value={userQuery.search}
                  onChange={(event) => setUserQuery((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <select value={userQuery.role} onChange={(event) => setUserQuery((current) => ({ ...current, role: event.target.value }))}>
                <option value="">All roles</option>
                <option value="superadmin">SuperAdmin</option>
                <option value="principal">Principal</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </select>
              <select value={userQuery.status} onChange={(event) => setUserQuery((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="button" className="superadmin-primary-btn" onClick={() => refreshUsers()}>
                Search
              </button>
            </div>
            <DashboardWidget title="Users">
              {loading ? <SkeletonTable columns={7} rows={5} /> : <Table columns={["Name", "Username", "Email", "Role", "School", "Status", "Created"]} rows={userRows} emptyMessage="No users found" />}
            </DashboardWidget>
          </section>
        ) : null}

        {page === "logs" ? (
          <section className="superadmin-section">
            <div className="superadmin-toolbar">
              <div className="superadmin-search">
                <Search size={16} />
                <input
                  placeholder="Search logs"
                  value={logQuery.search}
                  onChange={(event) => setLogQuery((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <button type="button" className="superadmin-primary-btn" onClick={() => refreshLogs()}>
                Search
              </button>
            </div>
            <DashboardWidget title="System Logs">
              {loading ? <SkeletonTable columns={6} rows={5} /> : <Table columns={["Date", "User", "Action", "Entity", "School", "Details"]} rows={logRows} emptyMessage="No system logs found" />}
            </DashboardWidget>
          </section>
        ) : null}

        {page === "roles" ? (
          <section className="superadmin-section">
            <DashboardWidget title="Roles & Permissions" subtitle="Uses the existing Role and Permission models">
              <EmptyState
                title="Role management is available in the backend"
                description="This UI is reserved for a follow-up pass once the existing role records are wired to editable forms."
                icon={Layers3}
              />
            </DashboardWidget>
          </section>
        ) : null}

        {page === "settings" ? (
          <section className="superadmin-section">
            <DashboardWidget title="System Settings" subtitle="Platform configuration">
              <EmptyState
                title="Settings panel"
                description="SuperAdmin settings can be extended here without affecting school-scoped dashboards."
                icon={Settings2}
              />
            </DashboardWidget>
          </section>
        ) : null}

        {activeSchool ? (
          <section className="superadmin-section">
            <DashboardWidget title={activeSchool.name} subtitle="School details">
              <div className="superadmin-details-grid">
                <DetailCard label="School ID" value={activeSchool.id} />
                <DetailCard label="Status" value={activeSchool.isActive ? "Active" : "Inactive"} />
                <DetailCard label="Students" value={activeSchool.stats?.students || 0} />
                <DetailCard label="Teachers" value={activeSchool.stats?.teachers || 0} />
                <DetailCard label="Staff" value={activeSchool.stats?.staff || 0} />
                <DetailCard label="Parents" value={activeSchool.stats?.parents || 0} />
                <DetailCard label="Classes" value={activeSchool.stats?.classes || 0} />
                <DetailCard label="Subjects" value={activeSchool.stats?.subjects || 0} />
              </div>
            </DashboardWidget>
          </section>
        ) : null}
      </main>

      <CreateSchoolModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreateSchool} saving={savingSchool} />
    </div>
  );
}
