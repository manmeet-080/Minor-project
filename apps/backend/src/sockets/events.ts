import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setIoInstance(io: Server) {
  ioInstance = io;
}

export function emitEvent(room: string, event: string, data: unknown) {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
}

export function notifyUser(userId: string, event: string, data: unknown) {
  emitEvent(`user:${userId}`, event, data);
}

export function notifyHostel(hostelId: string, event: string, data: unknown) {
  emitEvent(`hostel:${hostelId}`, event, data);
}

// Predefined event helpers
export const events = {
  complaintStatusChanged(studentUserId: string, hostelId: string, complaint: { id: string; title: string; status: string }) {
    notifyUser(studentUserId, 'complaint:statusChanged', complaint);
    notifyHostel(hostelId, 'complaint:updated', complaint);
  },

  gatePassDecision(studentUserId: string, pass: { id: string; status: string; type: string }) {
    notifyUser(studentUserId, 'gatePass:decision', pass);
  },

  feePaymentRecorded(hostelId: string, fee: { id: string; studentId: string; amount: number; status: string }) {
    notifyHostel(hostelId, 'fee:paymentRecorded', fee);
  },

  visitorEntry(studentUserId: string | undefined, visitor: { id: string; visitorName: string; purpose: string }) {
    if (studentUserId) {
      notifyUser(studentUserId, 'visitor:entry', visitor);
    }
  },

  broadcastNotification(hostelId: string, notification: { title: string; message: string }) {
    notifyHostel(hostelId, 'notification:broadcast', notification);
  },

  newComplaint(hostelId: string, complaint: { id: string; title: string; category: string; priority: string }) {
    notifyHostel(hostelId, 'complaint:new', complaint);
  },
};
