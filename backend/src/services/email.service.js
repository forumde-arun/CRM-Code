
import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.EMAIL_API_KEY
  ? new Resend(env.EMAIL_API_KEY)
  : null;

const requireResend = () => {
  if (!resend) {
    throw new Error('Email service is not configured.');
  }
};

// ============================================
// WELCOME EMAIL
// ============================================

export const sendWelcomeEmail = async (name, email) => {
  requireResend();

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [email],
    subject: 'Welcome to CRM!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#1f2937;">
        <h2 style="color:#047857;">Welcome to CRM!</h2>

        <p>Hello ${escapeHtml(name || 'there')},</p>

        <p>
          Thank you for creating your CRM account.
          We're excited to help you manage your WhatsApp Business
          conversations and customer relationships.
        </p>

        <p>
          Your account is ready. You can now sign in and start
          setting up your workspace.
        </p>

        <p style="margin-top:28px;">
          Regards,<br />
          <strong>CRM Team</strong>
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

        <p style="font-size:12px;color:#6b7280;">
          CRM · WhatsApp Business Management
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Unable to send welcome email.');
  }

  return data;
};

// ============================================
// PASSWORD RESET EMAIL
// ============================================

export const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}) => {
  requireResend();

  const expiryMinutes = env.PASSWORD_RESET_TTL_MIN || 30;

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [email],
    subject: 'Reset your CRM password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#1f2937;">
        <h2 style="color:#047857;">CRM Password Reset</h2>

        <p>Hello ${escapeHtml(name || 'there')},</p>

        <p>
          We received a request to reset your CRM account password.
          Click the button below to create a new password.
        </p>

        <p style="margin:28px 0;">
          <a
            href="${escapeHtml(resetUrl)}"
            style="background:#047857;color:#ffffff;padding:13px 22px;text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Reset Password
          </a>
        </p>

        <p>
          This link expires in ${expiryMinutes} minutes and can only
          be used once.
        </p>

        <p>
          If you did not request this, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

        <p style="font-size:12px;color:#6b7280;">
          CRM · WhatsApp Business Management
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(
      error.message || 'Unable to send password reset email.'
    );
  }

  return data;
};

// ============================================
// HTML ESCAPING
// ============================================

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}
