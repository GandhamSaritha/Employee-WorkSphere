
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: "http://localhost:8183",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const initialEmployees = [
  { employeeId: 101, name: "Aarav Sharma", email: "aarav@worksphere.com", department: "Engineering", designation: "Java Developer", status: "Active" },
  { employeeId: 102, name: "Priya Reddy", email: "priya@worksphere.com", department: "Human Resources", designation: "HR Executive", status: "Active" },
  { employeeId: 103, name: "Rahul Verma", email: "rahul@worksphere.com", department: "Design", designation: "UI/UX Designer", status: "Active" },
  { employeeId: 104, name: "Ananya Rao", email: "ananya@worksphere.com", department: "Finance", designation: "Accountant", status: "On Leave" },
  { employeeId: 105, name: "Vikram Kumar", email: "vikram@worksphere.com", department: "Engineering", designation: "Software Engineer", status: "Active" },
];

const initialLeaves = [
  { id: 1, employeeName: "Priya Reddy", type: "Casual Leave", from: "2026-10-19", to: "2026-10-20", reason: "Personal work", status: "Pending" },
  { id: 2, employeeName: "Ananya Rao", type: "Sick Leave", from: "2026-10-14", to: "2026-10-14", reason: "Not feeling well", status: "Approved" },
  { id: 3, employeeName: "Rahul Verma", type: "Earned Leave", from: "2026-10-22", to: "2026-10-23", reason: "Family function", status: "Pending" },
];

const initialAttendance = [
  { id: 1, name: "Aarav Sharma", department: "Engineering", checkIn: "09:02 AM", checkOut: "—", status: "Present" },
  { id: 2, name: "Priya Reddy", department: "Human Resources", checkIn: "08:54 AM", checkOut: "—", status: "Present" },
  { id: 3, name: "Rahul Verma", department: "Design", checkIn: "09:18 AM", checkOut: "—", status: "Late" },
  { id: 4, name: "Ananya Rao", department: "Finance", checkIn: "—", checkOut: "—", status: "On Leave" },
];

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { id: "overview", icon: "▦", label: "Overview" },
      { id: "employees", icon: "♙", label: "Employees" },
      { id: "attendance", icon: "◷", label: "Attendance" },
      { id: "leaves", icon: "▤", label: "Leave Management" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { id: "reports", icon: "▥", label: "Reports" },
      { id: "settings", icon: "⚙", label: "Settings" },
    ],
  },
];

function getErrorMessage(error) {
  return error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong.";
}

function getInitials(name = "WS") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("overview");
  const [employees, setEmployees] = useState(initialEmployees);
  const [leaves, setLeaves] = useState(initialLeaves);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [employeeModal, setEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [leaveModal, setLeaveModal] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [employeeForm, setEmployeeForm] = useState({
    name: "", email: "", department: "Engineering", designation: "", status: "Active",
  });
  const [leaveForm, setLeaveForm] = useState({
    type: "Casual Leave", from: todayString(), to: todayString(), reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/auth/me")
      .then((response) => {
        if (!active) return;
        setUser(response.data.user || response.data);
        setDemoMode(false);
      })
      .catch(() => {
        // Keep the sign-in screen visible if no authenticated session exists.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user || demoMode) return;

    let active = true;

    Promise.allSettled([
      api.get("/admin/employees"),
      api.get("/admin/leaves"),
      api.get("/leaves/my"),
    ]).then(([employeeResult, adminLeaveResult, myLeaveResult]) => {
      if (!active) return;

      if (employeeResult.status === "fulfilled" && Array.isArray(employeeResult.value.data)) {
        setEmployees(employeeResult.value.data.map((item, index) => ({
          ...item,
          employeeId: item.employeeId ?? item.id ?? index + 1,
          name: item.name ?? item.fullName ?? item.username ?? "Employee",
          email: item.email ?? "",
          department: item.department ?? "Unassigned",
          designation: item.designation ?? item.position ?? "Employee",
          status: item.status ?? "Active",
        })));
      }

      const leaveResult = user.role === "ADMIN" || user.role === "HR"
        ? adminLeaveResult : myLeaveResult;

      if (leaveResult.status === "fulfilled" && Array.isArray(leaveResult.value.data)) {
        setLeaves(leaveResult.value.data.map((item, index) => ({
          ...item,
          id: item.id ?? item.leaveId ?? index + 1,
          employeeName: item.employeeName ?? item.name ?? user.name ?? "Employee",
          type: item.type ?? item.leaveType ?? "Casual Leave",
          from: item.from ?? item.startDate ?? "",
          to: item.to ?? item.endDate ?? "",
          reason: item.reason ?? "",
          status: item.status ?? "Pending",
        })));
      }
    });

    return () => { active = false; };
  }, [user, demoMode]);

  const isAdmin = demoMode || ["ADMIN", "HR", "ROLE_ADMIN", "ROLE_HR"].includes(
    String(user?.role || user?.authorities?.[0]?.authority || "").toUpperCase()
  );

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const term = search.toLowerCase();
    const matchesSearch = [
      employee.name, employee.email, employee.department, employee.designation,
    ].some((value) => String(value || "").toLowerCase().includes(term));
    const matchesDepartment = departmentFilter === "All" || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  }), [employees, search, departmentFilter]);

  const departments = useMemo(
    () => ["All", ...new Set(employees.map((employee) => employee.department).filter(Boolean))],
    [employees]
  );

  const presentCount = attendance.filter((item) => item.status === "Present" || item.status === "Late").length;
  const pendingLeaves = leaves.filter((item) => item.status === "Pending").length;
  const activeEmployees = employees.filter((item) => item.status === "Active").length;

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  
async function handleLogin(event) {
  event.preventDefault();
  setBusy(true);

  try {
    if (loginMode === "register") {
      await api.post("/auth/register", {
        name: loginForm.name?.trim(),
        username: loginForm.email.trim(),
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      setLoginMode("login");
      setLoginForm((old) => ({ ...old, password: "" }));
      showNotice("Registration completed. Please sign in.");
    } else {
      const response = await api.post("/auth/login", {
        username: loginForm.email.trim(),
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      setUser(response.data.user || response.data);
      setDemoMode(false);
      showNotice("Welcome to WorkSphere.");
    }
  } catch (error) {
    showNotice(getErrorMessage(error));
  } finally {
    setBusy(false);
  }
}


  function enterDemo() {
    setUser({ name: "Demo Administrator", email: "admin@worksphere.com", role: "ADMIN" });
    setDemoMode(true);
    setPage("overview");
    showNotice("Demo mode enabled. Changes are stored in this session only.");
  }

  async function handleLogout() {
    if (!demoMode) {
      try { await api.post("/auth/logout"); } catch { /* Clear local session regardless. */ }
    }
    setUser(null);
    setDemoMode(false);
    setPage("overview");
    setLoginForm({ email: "", password: "" });
  }

  function openAddEmployee() {
    setEditingEmployee(null);
    setEmployeeForm({ name: "", email: "", department: "Engineering", designation: "", status: "Active" });
    setEmployeeModal(true);
  }

  function openEditEmployee(employee) {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "Engineering",
      designation: employee.designation || "",
      status: employee.status || "Active",
    });
    setEmployeeModal(true);
  }

  async function saveEmployee(event) {
    event.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.email.trim()) {
      showNotice("Employee name and email are required.");
      return;
    }

    setBusy(true);
    const payload = { ...employeeForm, name: employeeForm.name.trim(), email: employeeForm.email.trim() };

    try {
      if (!demoMode) {
        if (editingEmployee) {
          await api.put(`/admin/employees/${editingEmployee.employeeId}`, payload);
        } else {
          await api.post("/admin/employees", payload);
        }
      }

      if (editingEmployee) {
        setEmployees((old) => old.map((item) =>
          item.employeeId === editingEmployee.employeeId ? { ...item, ...payload } : item
        ));
        showNotice(demoMode ? "Demo employee updated." : "Employee updated.");
      } else {
        setEmployees((old) => [...old, { ...payload, employeeId: Date.now() }]);
        showNotice(demoMode ? "Demo employee added." : "Employee added.");
      }
      setEmployeeModal(false);
    } catch (error) {
      showNotice(`Could not save employee: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name}?`)) return;

    try {
      if (!demoMode) await api.delete(`/admin/employees/${employee.employeeId}`);
      setEmployees((old) => old.filter((item) => item.employeeId !== employee.employeeId));
      showNotice("Employee removed.");
    } catch (error) {
      showNotice(`Could not delete employee: ${getErrorMessage(error)}`);
    }
  }

  async function submitLeave(event) {
    event.preventDefault();
    if (leaveForm.to < leaveForm.from) {
      showNotice("The end date cannot be before the start date.");
      return;
    }

    setBusy(true);
    const payload = {
      ...leaveForm,
      employeeName: user?.name || user?.fullName || user?.email || "Employee",
      status: "Pending",
    };

    try {
      if (!demoMode) await api.post("/leaves", payload);
      setLeaves((old) => [...old, { ...payload, id: Date.now() }]);
      setLeaveModal(false);
      setLeaveForm({ type: "Casual Leave", from: todayString(), to: todayString(), reason: "" });
      showNotice("Leave request submitted.");
    } catch (error) {
      showNotice(`Could not submit leave: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function updateLeave(leave, status) {
    try {
      if (!demoMode) {
        await api.patch(`/admin/leaves/${leave.id}/status`, { status });
      }
      setLeaves((old) => old.map((item) => item.id === leave.id ? { ...item, status } : item));
      showNotice(`Leave request ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(`Could not update leave: ${getErrorMessage(error)}`);
    }
  }

  function toggleAttendance() {
    const today = new Date();
    const time = today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const existing = attendance.find((item) => item.name === (user?.name || user?.fullName));

    if (!existing) {
      setAttendance((old) => [{
        id: Date.now(),
        name: user?.name || user?.fullName || user?.email || "You",
        department: "My Department",
        checkIn: time,
        checkOut: "—",
        status: "Present",
      }, ...old]);
      showNotice("Checked in successfully.");
    } else if (existing.checkOut === "—") {
      setAttendance((old) => old.map((item) => item.id === existing.id ? { ...item, checkOut: time } : item));
      showNotice("Checked out successfully.");
    } else {
      showNotice("You have already checked out today.");
    }
  }

  if (loading) {
    return <div className="loading-screen"><div className="brand-mark">W</div><p>Preparing your workspace…</p></div>;
  }

  if (!user) {
    return (
      <div className="login-shell">
        <div className="login-brand-panel">
          <div className="brand-lockup">
            <div className="brand-mark">W</div>
            <span>Work<span className="brand-accent">Sphere</span></span>
          </div>
          <div className="login-message">
            <span className="eyebrow light">SMART WORKFORCE PLATFORM</span>
            <h1>Great teams.<br />Better workdays.</h1>
            <p>One connected workspace for your people, attendance, leave and workforce insights.</p>
            <div className="login-feature"><span>✓</span> Employee lifecycle management</div>
            <div className="login-feature"><span>✓</span> Smarter attendance and leave tracking</div>
            <div className="login-feature"><span>✓</span> Actionable workforce insights</div>
          </div>
          <div className="login-footnote">WORK BETTER, TOGETHER.</div>
        </div>

        <div className="login-form-panel">
          <form className="login-card" onSubmit={handleLogin}>
            <span className="eyebrow">WELCOME TO WORKSPHERE</span>
            <h2>{loginMode === "login" ? "Sign in to your account" : "Create your account"}</h2>
            <p className="muted">Enter your company credentials to continue.</p>

            {loginMode === "register" && (
              <label>Full name<input required placeholder="Your full name" onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })} /></label>
            )}
            <label>Work email<input required type="email" placeholder="you@company.com" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></label>
            <label>Password<input required type="password" placeholder="Enter your password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /></label>

            <button className="primary-btn full-btn" disabled={busy}>
              {busy ? "Please wait…" : loginMode === "login" ? "Sign in →" : "Register →"}
            </button>
            {loginMode === "login" && (
              <button type="button" className="text-btn full-btn" onClick={async () => {
                const email = loginForm.email.trim();
                if (!email) return showNotice("Enter your email address first.");
                try {
                  await api.post("/auth/forgot-password", { email });
                  showNotice("If the account exists, password reset instructions have been sent.");
                } catch (error) {
                  showNotice(getErrorMessage(error));
                }
              }}>Forgot password?</button>
            )}
            <div className="login-divider"><span>OR</span></div>
            <button type="button" className="secondary-btn full-btn" onClick={enterDemo}>Explore demo dashboard</button>
            <p className="login-switch">
              {loginMode === "login" ? "New to WorkSphere?" : "Already registered?"}{" "}
              <button type="button" className="inline-link" onClick={() => setLoginMode(loginMode === "login" ? "register" : "login")}>
                {loginMode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
            <p className="tiny-note">Demo changes are temporary. Live features require matching backend APIs.</p>
          </form>
        </div>
        {notice && <div className="toast">{notice}</div>}
      </div>
    );
  }

  const pageTitles = {
    overview: ["Overview", "Here’s what’s happening across your workforce."],
    employees: ["Employee directory", "Manage your people and their information."],
    attendance: ["Attendance", "Keep track of daily attendance and working hours."],
    leaves: ["Leave management", "Review requests and plan time away."],
    reports: ["Workforce reports", "A snapshot of your people and operations."],
    settings: ["Workspace settings", "Manage your WorkSphere preferences."],
  };

  const [title, subtitle] = pageTitles[page] || pageTitles.overview;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup sidebar-brand">
          <div className="brand-mark">W</div>
          <span>Work<span className="brand-accent">Sphere</span></span>
        </div>
        <div className="company-label"><span className="company-dot" /> ACME CORPORATION</div>

        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.filter((item) => item.id !== "employees" || isAdmin).map((item) => (
                <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                  <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
                  {item.id === "leaves" && pendingLeaves > 0 && <span className="nav-count">{pendingLeaves}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>Check your workspace resources.</p><button onClick={() => showNotice("Contact your HR administrator for support.")}>Get support ↗</button></div>
          <button className="user-card" onClick={() => setPage("settings")}>
            <div className="avatar">{getInitials(user.name || user.fullName || user.email)}</div>
            <div className="user-card-text"><strong>{user.name || user.fullName || user.email}</strong><span>{isAdmin ? "Administrator" : "Employee"}</span></div>
            <span className="user-menu">•••</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-actions">
            <span className={`connection-pill ${demoMode ? "demo-pill" : ""}`}><span />{demoMode ? "Demo mode" : "Workspace"}</span>
            <button className="icon-button notification-button" title="Notifications" onClick={() => showNotice(`${pendingLeaves} leave request(s) pending review.`)}>♧<i /></button>
            <div className="topbar-avatar">{getInitials(user.name || user.fullName || user.email)}</div>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="inline-notice"><span>ⓘ</span>{notice}<button onClick={() => setNotice("")}>×</button></div>}
          <div className="page-heading">
            <div><div className="eyebrow">YOUR WORKSPACE</div><h1>{title}</h1><p>{subtitle}</p></div>
            {page === "employees" && isAdmin && <button className="primary-btn" onClick={openAddEmployee}>＋ Add employee</button>}
            {page === "leaves" && <button className="primary-btn" onClick={() => setLeaveModal(true)}>＋ Apply for leave</button>}
          </div>

          {page === "overview" && (
            <>
              <div className="welcome-banner">
                <div><span className="welcome-tag">WEDNESDAY · WORKSPACE UPDATE</span><h2>Welcome back, {(user.name || user.fullName || user.email || "there").split(" ")[0]} <span>✦</span></h2><p>Your people are your greatest asset. Here’s your team at a glance.</p></div>
                <div className="welcome-art"><div className="art-circle circle-one" /><div className="art-circle circle-two" /><div className="art-person">✦</div><div className="art-caption">PEOPLE FIRST</div></div>
              </div>

              <div className="stats-grid">
                <StatCard label="Total employees" value={employees.length} detail="Across all departments" icon="♙" tone="purple" />
                <StatCard label="Active employees" value={activeEmployees} detail={`${employees.length - activeEmployees} inactive or away`} icon="✓" tone="green" />
                <StatCard label="Present today" value={presentCount} detail="Based on attendance records" icon="◷" tone="blue" />
                <StatCard label="Pending leave" value={pendingLeaves} detail="Awaiting review" icon="▤" tone="orange" />
              </div>

              <div className="dashboard-grid">
                <section className="panel department-panel">
                  <div className="panel-heading"><div><h3>Department overview</h3><p>How your workforce is distributed</p></div><button className="small-link" onClick={() => setPage("employees")}>View directory ↗</button></div>
                  <div className="department-list">
                    {departments.filter((d) => d !== "All").map((department, index) => {
                      const count = employees.filter((employee) => employee.department === department).length;
                      const percent = employees.length ? Math.round(count / employees.length * 100) : 0;
                      return <div className="department-row" key={department}><div className={`department-symbol symbol-${index % 4}`}>{department[0]}</div><div className="department-info"><div className="department-name"><strong>{department}</strong><span>{count} {count === 1 ? "person" : "people"}</span></div><div className="progress-track"><div className={`progress-fill fill-${index % 4}`} style={{ width: `${percent}%` }} /></div></div></div>;
                    })}
                  </div>
                </section>

                <section className="panel attendance-panel">
                  <div className="panel-heading"><div><h3>Today’s attendance</h3><p>Team check-in overview</p></div><button className="small-link" onClick={() => setPage("attendance")}>View all ↗</button></div>
                  <div className="attendance-summary"><div className="attendance-ring" style={{ "--ring-percent": `${attendance.length ? presentCount / attendance.length * 100 : 0}%` }}><div><strong>{attendance.length ? Math.round(presentCount / attendance.length * 100) : 0}%</strong><span>Present</span></div></div><div className="attendance-legend"><div><i className="legend-green" />Present <strong>{presentCount}</strong></div><div><i className="legend-orange" />On leave <strong>{attendance.filter((a) => a.status === "On Leave").length}</strong></div><div><i className="legend-gray" />Other <strong>{Math.max(0, attendance.length - presentCount - attendance.filter((a) => a.status === "On Leave").length)}</strong></div></div></div>
                  <button className="secondary-btn full-btn" onClick={toggleAttendance}>◷ {attendance.some((a) => a.name === (user.name || user.fullName) && a.checkOut === "—") ? "Check out" : "Check in"}</button>
                </section>
              </div>

              <section className="panel table-panel">
                <div className="panel-heading"><div><h3>Recent leave requests</h3><p>Latest team requests and their status</p></div><button className="small-link" onClick={() => setPage("leaves")}>View requests ↗</button></div>
                <LeaveTable leaves={leaves.slice(0, 4)} isAdmin={isAdmin} onUpdate={updateLeave} />
              </section>
            </>
          )}

          {page === "employees" && (
            <section className="panel table-panel">
              <div className="directory-toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or role…" /></div><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>{departments.map((department) => <option key={department}>{department}</option>)}</select><span className="result-count">{filteredEmployees.length} employees</span></div>
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>JOB TITLE</th><th>STATUS</th>{isAdmin && <th>ACTIONS</th>}</tr></thead><tbody>
                {filteredEmployees.map((employee) => <tr key={employee.employeeId}><td><div className="employee-cell"><div className="avatar employee-avatar">{getInitials(employee.name)}</div><div><strong>{employee.name}</strong><span>{employee.email}</span></div></div></td><td>{employee.department}</td><td>{employee.designation}</td><td><StatusPill status={employee.status} /></td>{isAdmin && <td><div className="action-buttons"><button title="Edit employee" onClick={() => openEditEmployee(employee)}>✎</button><button title="Delete employee" onClick={() => deleteEmployee(employee)}>×</button></div></td>}</tr>)}
                {filteredEmployees.length === 0 && <tr><td colSpan={isAdmin ? 5 : 4} className="empty-cell">No employees match your search.</td></tr>}
              </tbody></table></div>
            </section>
          )}

          {page === "attendance" && (
            <>
              <div className="stats-grid two-stats"><StatCard label="Present / late" value={presentCount} detail="Employees checked in" icon="✓" tone="green" /><StatCard label="On leave" value={attendance.filter((a) => a.status === "On Leave").length} detail="Away today" icon="◷" tone="orange" /></div>
              <section className="panel table-panel">
                <div className="panel-heading"><div><h3>Daily attendance log</h3><p>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div><button className="primary-btn" onClick={toggleAttendance}>◷ Check in / out</button></div>
                <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>CHECK IN</th><th>CHECK OUT</th><th>STATUS</th></tr></thead><tbody>{attendance.map((item) => <tr key={item.id}><td><div className="employee-cell"><div className="avatar employee-avatar">{getInitials(item.name)}</div><strong>{item.name}</strong></div></td><td>{item.department}</td><td>{item.checkIn}</td><td>{item.checkOut}</td><td><StatusPill status={item.status} /></td></tr>)}</tbody></table></div>
                <p className="tiny-note table-footnote">Attendance changes are session-only unless you connect a backend attendance endpoint.</p>
              </section>
            </>
          )}

          {page === "leaves" && (
            <section className="panel table-panel">
              <div className="leave-filters"><div><h3>Leave requests</h3><p>{pendingLeaves} requests are waiting for a decision.</p></div><div className="leave-balance"><span>PERSONAL REMINDER</span><strong>Plan time off early</strong><small>Keep your team informed.</small></div></div>
              <LeaveTable leaves={leaves} isAdmin={isAdmin} onUpdate={updateLeave} />
            </section>
          )}

          {page === "reports" && (
            <>
              <div className="stats-grid"><StatCard label="Headcount" value={employees.length} detail="Current directory records" icon="♙" tone="purple" /><StatCard label="Departments" value={departments.length - 1} detail="Unique departments" icon="▦" tone="blue" /><StatCard label="Active workforce" value={`${employees.length ? Math.round(activeEmployees / employees.length * 100) : 0}%`} detail="Active employee share" icon="↗" tone="green" /><StatCard label="Leave requests" value={leaves.length} detail="All available requests" icon="▤" tone="orange" /></div>
              <section className="panel report-panel"><div className="panel-heading"><div><h3>Workforce distribution</h3><p>Employees by department</p></div><button className="secondary-btn" onClick={() => {
                const rows = [["Name", "Email", "Department", "Designation", "Status"], ...employees.map((e) => [e.name, e.email, e.department, e.designation, e.status])];
                const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
                const link = document.createElement("a"); link.href = url; link.download = "worksphere-employees.csv"; link.click(); URL.revokeObjectURL(url);
              }}>↓ Export employee CSV</button></div>
                {departments.filter((d) => d !== "All").map((department, index) => { const count = employees.filter((e) => e.department === department).length; return <div className="report-bar-row" key={department}><div><span>{department}</span><strong>{count}</strong></div><div className="progress-track"><div className={`progress-fill fill-${index % 4}`} style={{ width: `${employees.length ? count / employees.length * 100 : 0}%` }} /></div></div>; })}
              </section>
            </>
          )}

          {page === "settings" && (
            <div className="settings-grid">
              <section className="panel settings-card"><div className="settings-icon">♙</div><h3>My account</h3><p>Review the account currently signed in to WorkSphere.</p><div className="settings-field"><span>Name</span><strong>{user.name || user.fullName || "Not provided"}</strong></div><div className="settings-field"><span>Email</span><strong>{user.email || "Not provided"}</strong></div><div className="settings-field"><span>Access level</span><strong>{isAdmin ? "Administrator / HR" : "Employee"}</strong></div></section>
              <section className="panel settings-card"><div className="settings-icon">⚙</div><h3>Workspace preferences</h3><p>Portal information and connection status.</p><div className="settings-field"><span>Application</span><strong>WorkSphere HRMS</strong></div><div className="settings-field"><span>Backend URL</span><strong>localhost:8183</strong></div><div className="settings-field"><span>Environment</span><strong>{demoMode ? "Demo — temporary data" : "Connected session"}</strong></div><button className="secondary-btn full-btn" onClick={() => showNotice("For security and role changes, contact your system administrator.")}>Account support</button></section>
            </div>
          )}
        </div>
        <footer className="app-footer"><span>© 2026 WorkSphere</span><span>PEOPLE · PURPOSE · PROGRESS</span></footer>
      </main>

      {employeeModal && <div className="modal-backdrop" onClick={() => setEmployeeModal(false)}><form className="modal-card" onSubmit={saveEmployee} onClick={(e) => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">PEOPLE DIRECTORY</span><h2>{editingEmployee ? "Edit employee" : "Add employee"}</h2></div><button type="button" className="modal-close" onClick={() => setEmployeeModal(false)}>×</button></div><label>Full name<input required value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} placeholder="Employee name" /></label><label>Work email<input required type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} placeholder="name@company.com" /></label><label>Department<select value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}>{["Engineering", "Human Resources", "Design", "Finance", "Marketing", "Operations", "Sales"].map((d) => <option key={d}>{d}</option>)}</select></label><label>Job title<input value={employeeForm.designation} onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })} placeholder="e.g. Software Engineer" /></label><label>Employment status<select value={employeeForm.status} onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEmployeeModal(false)}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving…" : "Save employee"}</button></div></form></div>}

      {leaveModal && <div className="modal-backdrop" onClick={() => setLeaveModal(false)}><form className="modal-card" onSubmit={submitLeave} onClick={(e) => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">TIME OFF</span><h2>Apply for leave</h2></div><button type="button" className="modal-close" onClick={() => setLeaveModal(false)}>×</button></div><label>Leave type<select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Unpaid Leave</option></select></label><div className="form-row"><label>From<input type="date" required value={leaveForm.from} onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })} /></label><label>To<input type="date" required min={leaveForm.from} value={leaveForm.to} onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })} /></label></div><label>Reason<textarea required rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Briefly describe the reason…" /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setLeaveModal(false)}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button></div></form></div>}
    </div>
  );
}

function StatCard({ label, value, detail, icon, tone }) {
  return <div className="stat-card"><div className={`stat-icon tone-${tone}`}>{icon}</div><span className="stat-label">{label}</span><div className="stat-value">{value}</div><p>{detail}</p></div>;
}

function StatusPill({ status }) {
  const normalized = String(status || "Active").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-pill status-${normalized}`}>{status || "Active"}</span>;
}

function LeaveTable({ leaves, isAdmin, onUpdate }) {
  if (!leaves.length) return <div className="empty-state"><div>▤</div><strong>No leave requests yet</strong><p>New requests will appear here.</p></div>;

  return <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>LEAVE TYPE</th><th>DATES</th><th>REASON</th><th>STATUS</th>{isAdmin && <th>ACTIONS</th>}</tr></thead><tbody>{leaves.map((leave) => <tr key={leave.id}><td><div className="employee-cell"><div className="avatar employee-avatar">{getInitials(leave.employeeName)}</div><strong>{leave.employeeName}</strong></div></td><td>{leave.type}</td><td>{leave.from}{leave.to && leave.to !== leave.from ? ` – ${leave.to}` : ""}</td><td className="reason-cell">{leave.reason || "—"}</td><td><StatusPill status={leave.status} /></td>{isAdmin && <td>{leave.status === "Pending" ? <div className="leave-actions"><button className="approve-btn" onClick={() => onUpdate(leave, "Approved")}>Approve</button><button className="reject-btn" onClick={() => onUpdate(leave, "Rejected")}>Reject</button></div> : <span className="muted">Reviewed</span>}</td>}</tr>)}</tbody></table></div>;
}

export default App;
