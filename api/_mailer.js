import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
const appName = process.env.APP_NAME || 'CareerBoost';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export async function sendMail({ to, subject, html, text, replyTo }) {
  const mailer = getTransporter();

  return mailer.sendMail({
    from: `${appName} <${smtpFrom}>`,
    to,
    subject,
    html,
    text,
    replyTo,
  });
}

export function getAppName() {
  return appName;
}

export function getAppUrl(req) {
  return process.env.APP_URL || req.headers.origin || 'http://localhost:5173';
}

