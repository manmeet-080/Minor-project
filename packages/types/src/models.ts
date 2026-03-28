import {
  Role, Gender, RoomStatus, RoomType, BedStatus,
  ComplaintStatus, ComplaintPriority, ComplaintCategory,
  FeeType, FeeStatus, PaymentMethod, MealType, DayOfWeek,
  GatePassStatus, GatePassType, NotificationType, StudentStatus,
} from './enums';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  hostelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  rollNumber: string;
  department: string;
  year: number;
  gender: Gender;
  parentName: string;
  parentPhone: string;
  permanentAddress: string;
  status: StudentStatus;
  bedId?: string;
  joinDate?: string;
  checkoutDate?: string;
  user?: User;
  bed?: Bed & { room?: Room };
}

export interface Hostel {
  id: string;
  name: string;
  code: string;
  address: string;
  totalBlocks: number;
  gender: Gender;
  wardenId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Block {
  id: string;
  name: string;
  hostelId: string;
  floors: number;
  createdAt: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  blockId: string;
  floor: number;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  amenities: string[];
  block?: Block;
  beds?: Bed[];
}

export interface Bed {
  id: string;
  bedNumber: string;
  roomId: string;
  status: BedStatus;
  room?: Room;
  student?: StudentProfile;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  images: string[];
  studentId: string;
  hostelId: string;
  roomId?: string;
  assignedToId?: string;
  resolvedAt?: string;
  student?: StudentProfile;
  assignedTo?: User;
  updates?: ComplaintUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  userId: string;
  message: string;
  status: ComplaintStatus;
  user?: User;
  createdAt: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  hostelId: string;
  type: FeeType;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  receiptUrl?: string;
  remarks?: string;
  student?: StudentProfile;
  createdAt: string;
  updatedAt: string;
}

export interface MessMenu {
  id: string;
  hostelId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  items: string[];
  isActive: boolean;
}

export interface MessBooking {
  id: string;
  studentId: string;
  hostelId: string;
  date: string;
  mealType: MealType;
  isBooked: boolean;
  feedback?: string;
  rating?: number;
  student?: StudentProfile;
  createdAt: string;
}

export interface GatePass {
  id: string;
  studentId: string;
  hostelId: string;
  type: GatePassType;
  reason: string;
  destination: string;
  exitDate: string;
  expectedReturn: string;
  actualReturn?: string;
  status: GatePassStatus;
  approvedById?: string;
  remarks?: string;
  student?: StudentProfile;
  approvedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  hostelId: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  studentId?: string;
  entryTime: string;
  exitTime?: string;
  idProof: string;
  loggedById: string;
  student?: StudentProfile;
  loggedBy?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser extends User {
  studentProfile?: StudentProfile;
}
