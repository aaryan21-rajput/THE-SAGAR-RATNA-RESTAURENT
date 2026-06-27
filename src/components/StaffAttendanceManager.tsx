import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  Fingerprint, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  CalendarCheck, 
  Cpu, 
  UserPlus,
  ArrowRight,
  Sparkles,
  Smartphone,
  Eye,
  Trash2,
  Lock,
  Hourglass,
  Percent,
  TrendingUp,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB } from "../lib/db";
import { Employee, Shift, AttendanceRecord, LeaveRequest, BiometricDevice, BiometricRawLog } from "../types";

// Recharts for attendance reports
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

export default function StaffAttendanceManager() {
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "employees" | "attendance" | "biometrics" | "leaves" | "payroll"
  >("dashboard");

  // State hooks
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [rawLogs, setRawLogs] = useState<BiometricRawLog[]>([]);

  // Filter and Form states
  const [branchFilter, setBranchFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);

  // Success/Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Employee state
  const [newEmp, setNewEmp] = useState({
    name: "",
    role: "Server" as Employee["role"],
    phone: "",
    email: "",
    branch: "Sagar Ratna - CP",
    hourlyRate: 100,
    overtimeMultiplier: 1.5,
    biometricId: "",
    status: "Active" as "Active" | "Inactive",
    shiftId: "S-1"
  });

  // New Device state
  const [newDevice, setNewDevice] = useState({
    name: "",
    model: "ZKTeco K40" as BiometricDevice["model"],
    type: "Fingerprint" as BiometricDevice["type"],
    ipAddress: "192.168.1.155",
    port: 4370,
    branch: "Sagar Ratna - CP",
    status: "Online" as "Online" | "Offline"
  });

  // New Leave state
  const [newLeave, setNewLeave] = useState({
    employeeId: "",
    leaveType: "Sick Leave" as LeaveRequest["leaveType"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });

  // Load Data
  const loadAllData = () => {
    setEmployees(LocalDB.getEmployees());
    setShifts(LocalDB.getShifts());
    setAttendance(LocalDB.getAttendance());
    setLeaves(LocalDB.getLeaveRequests());
    setDevices(LocalDB.getBiometricDevices());
    setRawLogs(LocalDB.getBiometricRawLogs());
  };

  useEffect(() => {
    loadAllData();
    // Listening to state changes
    const handleStorageChange = () => {
      loadAllData();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Create Employee
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.phone) {
      showToast("Please fill in required fields", "error");
      return;
    }
    // Generate bio ID if empty
    const bioId = newEmp.biometricId || `B-${Math.floor(100 + Math.random() * 900)}`;
    LocalDB.addEmployee({
      ...newEmp,
      biometricId: bioId
    });
    showToast(`Employee ${newEmp.name} hired successfully!`);
    setShowAddEmpModal(false);
    setNewEmp({
      name: "",
      role: "Server",
      phone: "",
      email: "",
      branch: "Sagar Ratna - CP",
      hourlyRate: 100,
      overtimeMultiplier: 1.5,
      biometricId: "",
      status: "Active",
      shiftId: "S-1"
    });
    loadAllData();
  };

  // Create Device
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.name || !newDevice.ipAddress) {
      showToast("Please specify device name and IP", "error");
      return;
    }
    LocalDB.addBiometricDevice(newDevice);
    showToast(`Terminal device ${newDevice.name} added!`);
    setShowAddDeviceModal(false);
    setNewDevice({
      name: "",
      model: "ZKTeco K40",
      type: "Fingerprint",
      ipAddress: "192.168.1.155",
      port: 4370,
      branch: "Sagar Ratna - CP",
      status: "Online"
    });
    loadAllData();
  };

  // Request Leave
  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.employeeId || !newLeave.reason) {
      showToast("Please select employee and provide reason", "error");
      return;
    }
    LocalDB.addLeaveRequest({
      ...newLeave,
      status: "Pending"
    });
    showToast("Leave request submitted for review!");
    setShowAddLeaveModal(false);
    setNewLeave({
      employeeId: "",
      leaveType: "Sick Leave",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: ""
    });
    loadAllData();
  };

  // Sync Biometric Logs
  const handleSyncDevice = (deviceId: string) => {
    const result = LocalDB.syncAttendanceFromBiometrics(deviceId);
    if (result.errorLogs.length > 0 && result.syncedCount === 0) {
      showToast(result.errorLogs[0], "error");
    } else {
      showToast(`Sync Complete! Synced ${result.syncedCount} scan logs into attendance records.`);
    }
    loadAllData();
  };

  // Trigger simulated biometric scan tap
  const handleSimulateScan = (employeeBiometricId: string, deviceId: string, checkType: "checkIn" | "checkOut") => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev || dev.status === "Offline") {
      showToast("Terminal is Offline. Please change device status to Online first.", "error");
      return;
    }

    const emp = employees.find(e => e.biometricId === employeeBiometricId);
    if (!emp) return;

    const todayStr = new Date().toISOString().split("T")[0];
    
    // Determine timestamp
    let logTimestamp = new Date().toISOString();
    if (checkType === "checkIn") {
      // Simulate check-in around shift start
      const shift = shifts.find(s => s.id === emp.shiftId) || shifts[0];
      const [sh, sm] = shift.startTime.split(":");
      // Set timestamp to today at sh:sm with some variation
      const logDate = new Date();
      logDate.setUTCHours(parseInt(sh, 10), parseInt(sm, 10) + (Math.random() > 0.5 ? 5 : -5), 0, 0);
      logTimestamp = logDate.toISOString();
    } else {
      // Simulate check-out around shift end
      const shift = shifts.find(s => s.id === emp.shiftId) || shifts[0];
      const [eh, em] = shift.endTime.split(":");
      const logDate = new Date();
      logDate.setUTCHours(parseInt(eh, 10), parseInt(em, 10) + (Math.random() > 0.5 ? 20 : 0), 0, 0);
      logTimestamp = logDate.toISOString();
    }

    LocalDB.addBiometricRawLog({
      deviceId,
      biometricId: employeeBiometricId,
      timestamp: logTimestamp,
      verifyType: dev.type === "Fingerprint" ? "Fingerprint" : "Face"
    });

    showToast(`Simulation Success: Registered ${checkType === "checkIn" ? "Check-In" : "Check-Out"} scan for ${emp.name} on ${dev.name}!`);
    loadAllData();
  };

  // Process Leave Decision
  const handleLeaveDecision = (leaveId: string, approve: boolean) => {
    LocalDB.updateLeaveRequest(leaveId, approve ? "Approved" : "Rejected");
    showToast(`Leave request ${approve ? 'Approved' : 'Rejected'}!`);
    loadAllData();
  };

  // Manual Attendance Overwrite
  const handleManualCheckIn = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    LocalDB.addAttendanceRecord({
      employeeId,
      date: new Date().toISOString().split("T")[0],
      shiftId: emp.shiftId,
      checkIn: new Date().toISOString(),
      checkOut: null,
      status: "Present",
      lateMinutes: 0,
      overtimeMinutes: 0,
      totalWorkingMinutes: 0,
      syncSource: "Manual"
    });

    showToast(`Manual Check-In recorded for ${emp.name}`);
    loadAllData();
  };

  const handleManualCheckOut = (recordId: string) => {
    const records = LocalDB.getAttendance();
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const checkInTime = new Date(record.checkIn!);
    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const workedMinutes = Math.floor(diffMs / 60000);

    LocalDB.updateAttendanceRecord(recordId, {
      checkOut: checkOutTime.toISOString(),
      totalWorkingMinutes: workedMinutes,
      overtimeMinutes: workedMinutes > 480 ? workedMinutes - 480 : 0 // standard 8 hours
    });

    showToast(`Manual Check-Out recorded.`);
    loadAllData();
  };

  // Filtered Lists
  const filteredEmployees = employees.filter(emp => {
    const matchesBranch = branchFilter === "All" || emp.branch === branchFilter;
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.phone.includes(searchQuery);
    return matchesBranch && matchesSearch;
  });

  const uniqueBranches = Array.from(new Set(employees.map(e => e.branch)));

  // Current Date Helper
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Daily Stats Calculations
  const todayAttendance = attendance.filter(r => r.date === todayDateStr);
  const presentTodayCount = todayAttendance.filter(r => r.status === "Present" || r.status === "Late").length;
  const lateTodayCount = todayAttendance.filter(r => r.status === "Late").length;
  const activeStaffInBranchCount = employees.filter(e => e.status === "Active" && (branchFilter === "All" || e.branch === branchFilter)).length;
  const absentTodayCount = Math.max(0, activeStaffInBranchCount - presentTodayCount);

  // Total Working Hours Today
  const totalWorkedMinutesToday = todayAttendance.reduce((sum, r) => sum + r.totalWorkingMinutes, 0);
  const totalWorkedHoursToday = (totalWorkedMinutesToday / 60).toFixed(1);

  // Generate Report Data for Chart (Attendance by Day)
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split("T")[0]);
    }
    return list;
  };

  const chartData = getLast7Days().map(dateStr => {
    const dayRecords = attendance.filter(r => r.date === dateStr);
    const present = dayRecords.filter(r => r.status === "Present" || r.status === "Late" || r.status === "Half-Day").length;
    const late = dayRecords.filter(r => r.status === "Late").length;
    const leavesCount = dayRecords.filter(r => r.status === "On Leave").length;
    
    // Formatting date label
    const parts = dateStr.split("-");
    const label = `${parts[2]}/${parts[1]}`;

    return {
      date: label,
      Present: present,
      Late: late,
      OnLeave: leavesCount,
      WorkingHours: (dayRecords.reduce((sum, r) => sum + r.totalWorkingMinutes, 0) / 60).toFixed(1)
    };
  });

  // Payroll Ready Calculation Rows
  const payrollData = filteredEmployees.map(emp => {
    const empRecords = attendance.filter(r => r.employeeId === emp.id);
    const totalMins = empRecords.reduce((sum, r) => sum + r.totalWorkingMinutes, 0);
    const overtimeMins = empRecords.reduce((sum, r) => sum + r.overtimeMinutes, 0);
    
    const regularMins = Math.max(0, totalMins - overtimeMins);
    const regularHours = regularMins / 60;
    const overtimeHours = overtimeMins / 60;

    const basePay = regularHours * emp.hourlyRate;
    const overtimePay = overtimeHours * emp.hourlyRate * emp.overtimeMultiplier;
    const grossPay = basePay + overtimePay;

    const approvedLeavesCount = leaves.filter(l => l.employeeId === emp.id && l.status === "Approved").length;

    return {
      employee: emp,
      totalHours: (totalMins / 60).toFixed(1),
      regularHours: regularHours.toFixed(1),
      overtimeHours: overtimeHours.toFixed(1),
      approvedLeaves: approvedLeavesCount,
      basePay: Math.round(basePay),
      overtimePay: Math.round(overtimePay),
      netPay: Math.round(grossPay)
    };
  });

  // Export payroll CSV function
  const triggerPayrollExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Role,Branch,Hourly Rate,Regular Hours,Overtime Hours,Approved Leaves,Base Pay (INR),Overtime Pay (INR),Net Pay (INR)\n";
    
    payrollData.forEach(row => {
      csvContent += `"${row.employee.id}","${row.employee.name}","${row.employee.role}","${row.employee.branch}",${row.employee.hourlyRate},${row.regularHours},${row.overtimeHours},${row.approvedLeaves},${row.basePay},${row.overtimePay},${row.netPay}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_Calculation_${branchFilter.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Payroll report downloaded successfully!");
  };

  return (
    <div id="staff-attendance-manager-root" className="bg-stone-50 min-h-screen text-stone-800 p-4 lg:p-6 font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-4 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Staff Attendance & Terminal Management</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time biometric terminal logging, multi-branch attendance metrics, shift calendars, leave review approvals, and payroll-ready wages.
          </p>
        </div>

        {/* Global Branch Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 text-xs font-medium border border-stone-200">
            <button 
              onClick={() => setBranchFilter("All")}
              className={`px-3 py-1.5 rounded-md transition-all ${branchFilter === "All" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"}`}
            >
              All Outlets
            </button>
            <button 
              onClick={() => setBranchFilter("Sagar Ratna - CP")}
              className={`px-3 py-1.5 rounded-md transition-all ${branchFilter === "Sagar Ratna - CP" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"}`}
            >
              CP
            </button>
            <button 
              onClick={() => setBranchFilter("Sagar Ratna - Noida")}
              className={`px-3 py-1.5 rounded-md transition-all ${branchFilter === "Sagar Ratna - Noida" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"}`}
            >
              Noida
            </button>
          </div>

          <button 
            onClick={() => {
              if (activeSubTab === "employees") setShowAddEmpModal(true);
              else if (activeSubTab === "biometrics") setShowAddDeviceModal(true);
              else if (activeSubTab === "leaves") setShowAddLeaveModal(true);
              else setShowAddEmpModal(true);
            }}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeSubTab === "biometrics" ? "Register Device" : activeSubTab === "leaves" ? "New Leave Request" : "Hire Employee"}
          </button>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="flex overflow-x-auto pb-1 gap-1 mb-6 border-b border-stone-200/80">
        {[
          { id: "dashboard", label: "Dashboard Metrics", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "employees", label: "Staff Roster", icon: <Users className="w-4 h-4" /> },
          { id: "attendance", label: "Attendance Logbook", icon: <CalendarCheck className="w-4 h-4" /> },
          { id: "biometrics", label: "Biometric Devices", icon: <Fingerprint className="w-4 h-4" /> },
          { id: "leaves", label: "Leave Requests", icon: <Calendar className="w-4 h-4" /> },
          { id: "payroll", label: "Payroll Calculator", icon: <DollarSign className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap rounded-t-xl border-b-2 transition-all ${
              activeSubTab === tab.id 
                ? "border-rose-600 text-rose-600 bg-white shadow-3xs" 
                : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="w-full">
        {/* ==================== METRICS DASHBOARD ==================== */}
        {activeSubTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-stone-400 text-xxs font-mono uppercase tracking-wider">Present Today</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-1">{presentTodayCount}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 text-xxs font-mono mt-1.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>On Premises</span>
                  </div>
                </div>
                <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Users className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-stone-400 text-xxs font-mono uppercase tracking-wider">Absent Employees</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-1">{absentTodayCount}</h3>
                  <div className="flex items-center gap-1 text-stone-500 text-xxs font-mono mt-1.5">
                    <XCircle className="w-3 h-3" />
                    <span>Not Clocked In</span>
                  </div>
                </div>
                <span className="p-2.5 bg-stone-100 rounded-xl text-stone-500">
                  <UserPlus className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-stone-400 text-xxs font-mono uppercase tracking-wider">Late Arrivals Today</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">{lateTodayCount}</h3>
                  <div className="flex items-center gap-1 text-amber-600 text-xxs font-mono mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>Outside Grace Limit</span>
                  </div>
                </div>
                <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-stone-400 text-xxs font-mono uppercase tracking-wider">Total Hours Worked Today</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-1">{totalWorkedHoursToday} hrs</h3>
                  <div className="flex items-center gap-1 text-rose-600 text-xxs font-mono mt-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Daily Cumulative</span>
                  </div>
                </div>
                <span className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                  <Cpu className="w-5 h-5" />
                </span>
              </div>

            </div>

            {/* Charts & Interactive Simulator Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recharts Attendance Bar and line Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Attendance & Working Hours History</h3>
                    <p className="text-xxs text-stone-400 mt-0.5">Last 7 operating days analysis</p>
                  </div>
                  <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded border border-stone-200">
                    Live Sync active
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="date" stroke="#a8a29e" fontSize={11} tickLine={false} />
                      <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Present" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Checked-in Staff" />
                      <Bar dataKey="Late" fill="#f59e0b" name="Late Arrivals" barSize={12} radius={[4, 4, 0, 0]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Biometric Terminal Activity Stream */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-stone-900">Live Device Audit Stream</h3>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-xxs text-stone-400 mb-4">Incoming signals from terminal hardware sockets</p>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {rawLogs.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6">No scan events received yet.</p>
                    ) : (
                      rawLogs.slice(0, 5).map((log, index) => {
                        const dev = devices.find(d => d.id === log.deviceId);
                        const emp = employees.find(e => e.biometricId === log.biometricId);
                        return (
                          <div key={log.id || index} className="flex items-start gap-2.5 p-2 bg-stone-50 rounded-lg border border-stone-150 text-xxs">
                            <span className="p-1.5 bg-stone-200 rounded-md text-stone-600 mt-0.5">
                              {log.verifyType === "Face" ? <Smartphone className="w-3.5 h-3.5 text-rose-500" /> : <Fingerprint className="w-3.5 h-3.5 text-blue-500" />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-800 truncate">{emp ? emp.name : `Biometric ID: ${log.biometricId}`}</span>
                                <span className="text-stone-400 font-mono scale-90">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-stone-500 text-xxs mt-0.5">
                                Verified via <strong className="text-stone-700">{log.verifyType}</strong> on {dev ? dev.name : "Terminal"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 mt-4">
                  <button 
                    onClick={() => setActiveSubTab("biometrics")}
                    className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 py-1"
                  >
                    Launch Terminal Simulator <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* Bottom Insight Area */}
            <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-rose-100 rounded-xl text-rose-700 mt-1">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Biometric Sync Auto-Pilot Active</h4>
                  <p className="text-xxs text-rose-700/80 mt-0.5 leading-relaxed max-w-2xl">
                    Your ZKTeco and eSSL facial recognition / fingerprint terminals are connected on their local IP addresses. Every tap automatically registers in the security ledger, tracking late times down to the minute and providing flawless monthly payroll estimates.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  devices.forEach(d => handleSyncDevice(d.id));
                  showToast("Bulk polled ZKTeco & eSSL cloud hubs successfully!");
                }}
                className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync All Devices
              </button>
            </div>

          </motion.div>
        )}

        {/* ==================== STAFF ROSTER ==================== */}
        {activeSubTab === "employees" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:max-w-xs">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Search staff, role, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs w-full bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span className="text-stone-400 text-xxs font-mono">Filter Outlet:</span>
                <select 
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs text-stone-700 font-medium focus:outline-none"
                >
                  <option value="All">All Branches</option>
                  <option value="Sagar Ratna - CP">Sagar Ratna - CP</option>
                  <option value="Sagar Ratna - Noida">Sagar Ratna - Noida</option>
                </select>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Role / Department</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Hourly wage</th>
                    <th className="p-4">Biometric link ID</th>
                    <th className="p-4">Shift assigned</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">No staff found matching the filter constraints.</td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const sh = shifts.find(s => s.id === emp.shiftId);
                      return (
                        <tr key={emp.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4">
                            <div className="font-bold text-stone-900">{emp.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{emp.email} • {emp.phone}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md font-semibold text-[10px]">
                              {emp.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-stone-600 font-semibold text-[11px]">
                              <Building2 className="w-3.5 h-3.5 text-stone-400" />
                              {emp.branch}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-stone-900 font-mono">₹{emp.hourlyRate}/hr</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">OT Multiplier: {emp.overtimeMultiplier}x</div>
                          </td>
                          <td className="p-4 font-mono text-stone-600 font-bold">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] border border-blue-100">
                              <Fingerprint className="w-3 h-3 text-blue-500" />
                              {emp.biometricId}
                            </span>
                          </td>
                          <td className="p-4 text-stone-600">
                            <div className="font-semibold text-[11px] text-stone-800">{sh ? sh.name : "No Shift"}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{sh ? `${sh.startTime} - ${sh.endTime}` : "-"}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-stone-150 text-stone-500"}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleManualCheckIn(emp.id)}
                                title="Manual Check-In Today"
                                className="p-1 hover:bg-stone-100 rounded text-stone-600 transition"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  const nextStatus = emp.status === "Active" ? "Inactive" : "Active";
                                  LocalDB.updateEmployee(emp.id, { status: nextStatus });
                                  showToast(`${emp.name} set to ${nextStatus}`);
                                  loadAllData();
                                }}
                                title="Toggle Status"
                                className="p-1 hover:bg-stone-100 rounded text-rose-600 transition"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

        {/* ==================== ATTENDANCE RECORD LOGBOOK ==================== */}
        {activeSubTab === "attendance" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Legend & Summary Info */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xxs font-mono text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Present
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Late Arrival
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> On Approved Leave
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Absent
                </span>
              </div>

              <div className="text-xxs text-stone-400 font-mono">
                Showing total {attendance.length} historically captured logbook entries
              </div>
            </div>

            {/* Attendance list */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    <th className="p-4">Staff Name</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Check-In</th>
                    <th className="p-4">Check-Out</th>
                    <th className="p-4">Shift Details</th>
                    <th className="p-4">Log Status</th>
                    <th className="p-4">Late / Overtime</th>
                    <th className="p-4">Sync Source</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-stone-400">No attendance records have been registered.</td>
                    </tr>
                  ) : (
                    attendance.map((rec) => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      const sh = shifts.find(s => s.id === rec.shiftId);
                      
                      // Skip if global branchFilter does not match employee branch
                      if (emp && branchFilter !== "All" && emp.branch !== branchFilter) {
                        return null;
                      }

                      return (
                        <tr key={rec.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4 font-bold text-stone-900">
                            {emp ? emp.name : `Unknown Staff (${rec.employeeId})`}
                            <div className="text-[10px] text-stone-400 font-mono font-normal mt-0.5">{emp?.role} • {emp?.branch}</div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-stone-600">
                            {rec.date}
                          </td>
                          <td className="p-4 font-mono">
                            {rec.checkIn ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="p-4 font-mono">
                            {rec.checkOut ? (
                              <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                                {new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : rec.checkIn ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded animate-pulse text-[10px] font-semibold">
                                Clocked-In
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-stone-600 font-medium text-[11px]">{sh ? sh.name : "Custom"}</span>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{sh ? `${sh.startTime}-${sh.endTime}` : ""}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === "Present" ? "bg-emerald-50 text-emerald-700" :
                              rec.status === "Late" ? "bg-amber-50 text-amber-700" :
                              rec.status === "On Leave" ? "bg-indigo-50 text-indigo-700" :
                              "bg-red-50 text-red-700"
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[11px]">
                            {rec.lateMinutes > 0 && (
                              <div className="text-amber-600">Late: {rec.lateMinutes} mins</div>
                            )}
                            {rec.overtimeMinutes > 0 && (
                              <div className="text-emerald-600">OT: {rec.overtimeMinutes} mins</div>
                            )}
                            {rec.lateMinutes === 0 && rec.overtimeMinutes === 0 && (
                              <span className="text-stone-400 font-normal">On Time</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-stone-500 scale-95 origin-left">
                            <span className="px-2 py-0.5 bg-stone-100 rounded-md border border-stone-200">
                              {rec.syncSource}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {rec.checkIn && !rec.checkOut && (
                              <button 
                                onClick={() => handleManualCheckOut(rec.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xxs font-semibold px-2 py-1 rounded"
                              >
                                Clock Out
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

        {/* ==================== BIOMETRIC HARDWARE INTERACTION ==================== */}
        {activeSubTab === "biometrics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Terminals list */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {devices.map(device => {
                const deviceLogsCount = rawLogs.filter(l => l.deviceId === device.id).length;
                return (
                  <div key={device.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="p-2 bg-stone-100 rounded-xl text-stone-600">
                          <Cpu className="w-5 h-5 text-rose-500" />
                        </span>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            device.status === "Online" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${device.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                            {device.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-stone-900 text-sm">{device.name}</h4>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">{device.model} • {device.type}</p>

                      <div className="space-y-2 mt-4 text-xxs text-stone-500 border-t border-stone-100 pt-3">
                        <div className="flex justify-between">
                          <span>IP Address:</span>
                          <strong className="font-mono text-stone-800">{device.ipAddress}:{device.port}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Assigned Branch:</span>
                          <strong className="text-stone-800">{device.branch}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Buffered Scan Records:</span>
                          <strong className="font-mono text-stone-800">{deviceLogsCount} scans</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Sync Audit:</span>
                          <strong className="font-mono text-stone-800">
                            {device.lastSyncTime 
                              ? new Date(device.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : "Never Synced"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-stone-100">
                      <button 
                        onClick={() => {
                          const nextStatus = device.status === "Online" ? "Offline" : "Online";
                          const updated = devices.map(d => d.id === device.id ? { ...d, status: nextStatus } : d);
                          LocalDB.saveBiometricDevices(updated);
                          showToast(`${device.name} terminal set to ${nextStatus}!`);
                        }}
                        className="text-center text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 transition text-xxs font-bold py-2 rounded-lg"
                      >
                        {device.status === "Online" ? "Disable Port" : "Enable Port"}
                      </button>
                      <button 
                        onClick={() => handleSyncDevice(device.id)}
                        className="text-center text-white bg-rose-600 hover:bg-rose-700 transition text-xxs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Pull Log Sync
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INTERACTIVE PLAYGROUND: EMULATE BIOMETRIC SCANS */}
            <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1 bg-rose-950 text-rose-400 rounded-md">
                  <Fingerprint className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">ZKTeco & eSSL Terminal Emulator Console</h3>
              </div>
              <p className="text-stone-400 text-xxs leading-relaxed max-w-3xl mb-6">
                Restaurant staff scan their finger or stand in front of facial recognition cameras to verify themselves. 
                Select an employee and device below to emulates a physical scan tap! These populate raw log queue buffers, simulating live sync from hardware to DB.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Employee Selection */}
                <div className="bg-stone-850 p-4 rounded-xl border border-stone-800">
                  <h4 className="text-xxs font-mono text-stone-400 uppercase tracking-widest mb-3">1. Select Staff Member</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {employees.filter(e => e.status === "Active").map(emp => (
                      <div key={emp.id} className="p-2.5 bg-stone-800 rounded-lg border border-stone-750 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{emp.name}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{emp.role} • Bio Credential ID: <strong className="text-rose-400">{emp.biometricId}</strong></p>
                        </div>
                        <div className="flex gap-1.5">
                          {/* Emulate Device Selector with instant simulation */}
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => {
                                // Default to first available CP or Noida device
                                const matchedDev = devices.find(d => d.branch === emp.branch) || devices[0];
                                handleSimulateScan(emp.biometricId, matchedDev.id, "checkIn");
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] text-center"
                            >
                              Tap In
                            </button>
                            <button 
                              onClick={() => {
                                const matchedDev = devices.find(d => d.branch === emp.branch) || devices[0];
                                handleSimulateScan(emp.biometricId, matchedDev.id, "checkOut");
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] text-center"
                            >
                              Tap Out
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Hardware Live Logs */}
                <div className="lg:col-span-2 bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xxs font-mono text-stone-400 uppercase tracking-widest mb-3">2. Raw Log Buffer Stack (Incoming Signal Socket)</h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xxs font-mono">
                      {rawLogs.length === 0 ? (
                        <p className="text-stone-500 text-center py-10">Waiting for simulated staff biometric scans...</p>
                      ) : (
                        rawLogs.map((log) => {
                          const emp = employees.find(e => e.biometricId === log.biometricId);
                          const dev = devices.find(d => d.id === log.deviceId);
                          return (
                            <div key={log.id} className="p-2 bg-stone-900 border border-stone-800 text-stone-300 rounded flex justify-between items-center">
                              <div>
                                <span className="text-rose-400 font-bold">[{log.verifyType.toUpperCase()}]</span>
                                <span className="ml-2 font-bold text-white">{emp ? emp.name : `Credential: ${log.biometricId}`}</span>
                                <p className="text-[10px] text-stone-500 mt-0.5">Device: {dev ? dev.name : "N/A"} ({dev?.ipAddress})</p>
                              </div>
                              <div className="text-right">
                                <span className="text-stone-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <p className="text-[9px] text-stone-500 mt-0.5">{new Date(log.timestamp).toLocaleDateString()}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-800 mt-4 justify-between items-center">
                    <p className="text-xxs text-stone-500 leading-relaxed">
                      To commit these verified biometric raw logs into standard timesheets, hit the <strong>Commits & Synchronize</strong> button below.
                    </p>
                    <button 
                      onClick={() => {
                        devices.forEach(d => {
                          LocalDB.syncAttendanceFromBiometrics(d.id);
                        });
                        showToast("All raw biometric logs synchronized with operational attendance sheets!");
                        loadAllData();
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Commits & Synchronize
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* ==================== LEAVE MANAGEMENT ==================== */}
        {activeSubTab === "leaves" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-900">Leave Applications Register</h3>
              <button 
                onClick={() => setShowAddLeaveModal(true)}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
              >
                Apply Leave For Staff
              </button>
            </div>

            {/* Leave Requests table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Type of Leave</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">End Date</th>
                    <th className="p-4">Reason Given</th>
                    <th className="p-4">Request Status</th>
                    <th className="p-4 text-right">Review Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">No leave requests logged in local store.</td>
                    </tr>
                  ) : (
                    leaves.map((req) => {
                      const emp = employees.find(e => e.id === req.employeeId);
                      return (
                        <tr key={req.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4 font-bold text-stone-900">
                            {emp ? emp.name : `Staff ID: ${req.employeeId}`}
                            <div className="text-[10px] text-stone-400 font-mono font-normal mt-0.5">{emp?.role} • {emp?.branch}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md text-[10px] font-semibold">
                              {req.leaveType}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-stone-600">{req.startDate}</td>
                          <td className="p-4 font-mono text-stone-600">{req.endDate}</td>
                          <td className="p-4 max-w-xs text-stone-600 truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                              req.status === "Rejected" ? "bg-red-50 text-red-700" :
                              "bg-amber-50 text-amber-700"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {req.status === "Pending" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleLeaveDecision(req.id, false)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded border border-red-200"
                                  title="Reject Leave"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleLeaveDecision(req.id, true)}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded border border-emerald-200"
                                  title="Approve Leave"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xxs font-mono text-stone-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

        {/* ==================== PAYROLL READY CALCULATOR ==================== */}
        {activeSubTab === "payroll" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Branch Payroll Wages Estimate Center</h3>
                <p className="text-xxs text-stone-400 mt-0.5">Calculates base hourly rate + overtime multiplier based on logbook history</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={triggerPayrollExport}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Payroll CSV
                </button>
              </div>
            </div>

            {/* Payroll Roster List */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Hourly Rate</th>
                    <th className="p-4 text-center">Total Hours Worked</th>
                    <th className="p-4 text-center">Regular Hours</th>
                    <th className="p-4 text-center">Overtime Hours (OT)</th>
                    <th className="p-4 text-center">Leaves Taken</th>
                    <th className="p-4 text-right">Base Wage</th>
                    <th className="p-4 text-right">OT Wage</th>
                    <th className="p-4 text-right bg-stone-50/50">Gross Wages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-stone-400">No staff register available for payroll analysis.</td>
                    </tr>
                  ) : (
                    payrollData.map((row) => (
                      <tr key={row.employee.id} className="hover:bg-stone-50/50 transition">
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{row.employee.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">{row.employee.role} • {row.employee.id}</div>
                        </td>
                        <td className="p-4 text-stone-600 font-semibold">{row.employee.branch}</td>
                        <td className="p-4 font-mono">₹{row.employee.hourlyRate}/hr</td>
                        <td className="p-4 text-center font-bold text-stone-900 font-mono">{row.totalHours} h</td>
                        <td className="p-4 text-center font-mono text-stone-600">{row.regularHours} h</td>
                        <td className="p-4 text-center font-mono text-stone-600">{row.overtimeHours} h</td>
                        <td className="p-4 text-center font-mono text-stone-500">{row.approvedLeaves} days</td>
                        <td className="p-4 text-right font-mono text-stone-700">₹{row.basePay.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono text-stone-700">₹{row.overtimePay.toLocaleString()}</td>
                        <td className="p-4 text-right bg-rose-50/20 font-bold text-rose-600 font-mono">
                          ₹{row.netPay.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Future Integrations Advisory */}
            <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 flex items-start gap-3 mt-4 text-stone-600">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xxs leading-relaxed">
                <strong className="text-stone-800">Branch Ledger Note:</strong> Payroll calculations are computed on hours clocked via devices using UTC timestamps. If integrating with POS terminal, payroll metrics auto-export into Tally or QuickBooks ERP formats. Leave deductions use pro-rata calculations of standard shift durations.
              </div>
            </div>

          </motion.div>
        )}
      </div>

      {/* ==================== HIRE EMPLOYEE MODAL ==================== */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 overflow-hidden shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-600" />
                Hire Staff Member
              </h3>
              <button 
                onClick={() => setShowAddEmpModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Role *</label>
                  <select 
                    value={newEmp.role}
                    onChange={e => setNewEmp({ ...newEmp, role: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-stone-800"
                  >
                    <option value="Chef">Chef</option>
                    <option value="Server">Server</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Assigned Branch</label>
                  <select 
                    value={newEmp.branch}
                    onChange={e => setNewEmp({ ...newEmp, branch: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-stone-800"
                  >
                    <option value="Sagar Ratna - CP">Sagar Ratna - CP</option>
                    <option value="Sagar Ratna - Noida">Sagar Ratna - Noida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="10 digit mobile"
                    value={newEmp.phone}
                    onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={newEmp.email}
                    onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Hourly rate (₹)</label>
                  <input 
                    type="number" 
                    value={newEmp.hourlyRate}
                    onChange={e => setNewEmp({ ...newEmp, hourlyRate: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">OT Multiplier</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={newEmp.overtimeMultiplier}
                    onChange={e => setNewEmp({ ...newEmp, overtimeMultiplier: parseFloat(e.target.value) || 1.5 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Shift Schedule</label>
                  <select 
                    value={newEmp.shiftId}
                    onChange={e => setNewEmp({ ...newEmp, shiftId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                  >
                    <option value="S-1">Morning (09-17)</option>
                    <option value="S-2">Evening (17-01)</option>
                    <option value="S-3">Night (21-05)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Biometric link ID (Auto-generated if blank)</label>
                <input 
                  type="text" 
                  placeholder="e.g. B-105"
                  value={newEmp.biometricId}
                  onChange={e => setNewEmp({ ...newEmp, biometricId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono text-stone-800 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
                >
                  Create & Assign Biometric Credential
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== REGISTER DEVICE MODAL ==================== */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 overflow-hidden shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-600" />
                Register Biometric Terminal
              </h3>
              <button 
                onClick={() => setShowAddDeviceModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Terminal Device Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Noida Main Lobby Face Reader"
                  value={newDevice.name}
                  onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Manufacturer / Model</label>
                  <select 
                    value={newDevice.model}
                    onChange={e => setNewDevice({ ...newDevice, model: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="ZKTeco K40">ZKTeco K40</option>
                    <option value="eSSL Identix K30">eSSL Identix K30</option>
                    <option value="ZKTeco FacePass 7">ZKTeco FacePass 7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Verification Modality</label>
                  <select 
                    value={newDevice.type}
                    onChange={e => setNewDevice({ ...newDevice, type: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Fingerprint">Fingerprint Scan</option>
                    <option value="Facial Recognition">Facial Recognition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Local IP Address *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 192.168.1.18"
                    value={newDevice.ipAddress}
                    onChange={e => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Port</label>
                  <input 
                    type="number" 
                    required
                    value={newDevice.port}
                    onChange={e => setNewDevice({ ...newDevice, port: parseInt(e.target.value, 10) || 4370 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Assigned Branch Branch</label>
                <select 
                  value={newDevice.branch}
                  onChange={e => setNewDevice({ ...newDevice, branch: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Sagar Ratna - CP">Sagar Ratna - CP</option>
                  <option value="Sagar Ratna - Noida">Sagar Ratna - Noida</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
                >
                  Register Device IP Socket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== SUBMIT LEAVE REQUEST MODAL ==================== */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 overflow-hidden shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-rose-600" />
                Submit Staff Leave Request
              </h3>
              <button 
                onClick={() => setShowAddLeaveModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Employee Name *</label>
                <select 
                  required
                  value={newLeave.employeeId}
                  onChange={e => setNewLeave({ ...newLeave, employeeId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none text-stone-800"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.filter(e => e.status === "Active").map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role} • {e.branch})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Leave Category</label>
                <select 
                  value={newLeave.leaveType}
                  onChange={e => setNewLeave({ ...newLeave, leaveType: e.target.value as any })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newLeave.startDate}
                    onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={newLeave.endDate}
                    onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase tracking-wider text-stone-400 mb-1">Reason / Notes *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Provide precise reason..."
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-800 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
                >
                  File Leave Application
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
