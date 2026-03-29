import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: `"Campusphere" <${env.SMTP_USER || 'noreply@campusphere.edu'}>`,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
  await sendMail(to, 'Reset your Campusphere password', `
    <h2>Password Reset</h2>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <p><a href="${resetUrl}" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `);
}

export async function sendGatePassDecisionEmail(to: string, studentName: string, status: string, remarks?: string) {
  await sendMail(to, `Gate Pass ${status}`, `
    <h2>Gate Pass ${status}</h2>
    <p>Hi ${studentName}, your gate pass request has been <strong>${status.toLowerCase()}</strong>.</p>
    ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
  `);
}

export async function sendOverdueFeeReminder(to: string, studentName: string, amount: number, dueDate: string) {
  await sendMail(to, 'Fee Payment Overdue', `
    <h2>Fee Payment Overdue</h2>
    <p>Hi ${studentName}, your fee payment of <strong>Rs. ${amount.toLocaleString('en-IN')}</strong> was due on ${dueDate} and is now overdue.</p>
    <p>Please make the payment at the earliest to avoid penalties.</p>
  `);
}
