export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isChefSpecial?: boolean;
  image: string;
  spiciness: number; // 0 to 3 index of chili levels
  rating: number; // e.g. 4.5 to 4.9
  ratingCount: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customization?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  description: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
}

export type KOTStatus = "New Order" | "Accepted" | "Preparing" | "Ready" | "Served" | "Cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customization?: string;
}

export interface KOT {
  id: string; // Format: KOT-0001, etc.
  orderId: string;
  tableNumber: string;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  status: KOTStatus;
  specialInstructions: string;
  createdAt: string;
  preparationTime: number; // Duration in minutes to prepare
  printed?: boolean; // Tracking thermal/POS ticket layout generation
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customization?: string;
  }[];
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  seatingArea: string;
  status: "Available" | "Occupied" | "Reserved";
}

export interface PrinterEmulatorLog {
  id: string;
  kotId: string;
  kotNumber: string;
  restaurantId: string;
  receiptText: string;
  printStatus: "Pending" | "Printing" | "Printed" | "Failed";
  createdAt: string;
}

export interface TicketReply {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: "Bug" | "Feature Request" | "Billing" | "Technical Support" | "General Feedback";
  priority: "Low" | "Medium" | "High" | "Urgent";
  description: string;
  screenshotUrl?: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  restaurantName: string;
  replies: TicketReply[];
  internalNotes?: string;
  unreadUpdate?: boolean; // Highlight if status/reply changed
}

export interface Employee {
  id: string;
  name: string;
  role: "Chef" | "Server" | "Manager" | "Cashier" | "Cleaner" | "Security";
  phone: string;
  email: string;
  branch: string; //CP, Noida, Dwarka etc.
  hourlyRate: number; // For payroll ready calculation
  overtimeMultiplier: number; // e.g. 1.5
  biometricId: string; // Link to biometric device
  status: "Active" | "Inactive";
  joinedDate: string;
  shiftId: string; // Default shift assigned
}

export interface Shift {
  id: string;
  name: string; // "Morning Shift", "Evening Shift", "Night Shift"
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  graceMinutes: number; // e.g., 15 mins before marked late
  breakMinutes: number; // e.g., 30 mins
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  shiftId: string;
  checkIn: string | null; // ISO string or null
  checkOut: string | null; // ISO string or null
  status: "Present" | "Absent" | "Late" | "Half-Day" | "On Leave";
  lateMinutes: number;
  overtimeMinutes: number;
  totalWorkingMinutes: number;
  syncSource: "Manual" | "ZKTeco Terminal" | "eSSL Terminal";
  rawLogId?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "Sick Leave" | "Casual Leave" | "Earned Leave" | "Unpaid Leave";
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export interface BiometricDevice {
  id: string;
  name: string; // e.g. "Main Kitchen Fingerprint Terminal"
  model: "ZKTeco K40" | "eSSL Identix K30" | "ZKTeco FacePass 7";
  type: "Fingerprint" | "Facial Recognition";
  ipAddress: string;
  port: number;
  branch: string;
  status: "Online" | "Offline";
  lastSyncTime: string | null;
}

export interface BiometricRawLog {
  id: string;
  deviceId: string;
  biometricId: string;
  timestamp: string; // ISO string
  verifyType: "Fingerprint" | "Face" | "PIN";
}

