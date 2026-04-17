import { getAppName } from './_mailer.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderShell({ title, preview, heading, intro, ctaUrl, content }) {
  const appName = getAppName();
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(preview);
  const safeHeading = escapeHtml(heading);
  const safeIntro = escapeHtml(intro);
  const safeCtaUrl = escapeHtml(ctaUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#0f172a;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e2e8f0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#0f172a 0%,#111827 100%);padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#111827;border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(2,6,23,0.45);">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:rgba(59,130,246,0.14);color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${appName}</div>
                <h1 style="margin:24px 0 12px;font-size:30px;line-height:1.15;color:#ffffff;">${safeHeading}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#cbd5e1;">${safeIntro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 36px;color:#94a3b8;font-size:13px;line-height:1.6;">
                If the button does not work, paste this link into your browser:<br />
                <a href="${safeCtaUrl}" style="color:#93c5fd;word-break:break-all;">${safeCtaUrl}</a>
              </td>
            </tr>
          </table>
          <p style="max-width:640px;margin:16px auto 0;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
            This message was sent by ${appName}. If you did not request it, you can safely ignore it.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function codeBlock(code, note) {
  return `
    <div style="padding:24px;border-radius:18px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.16);">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">${escapeHtml(note)}</div>
      <div style="font-size:34px;letter-spacing:.28em;font-weight:800;color:#ffffff;text-align:center;">${escapeHtml(code)}</div>
    </div>`;
}

function buttonLink(label, url) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
      <tr>
        <td style="border-radius:14px;background:linear-gradient(135deg,#2563eb,#4f46e5);">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function buildSignupVerificationEmail({ code, expiresInMinutes, verifyUrl }) {
  const title = `${getAppName()} verification code`;
  const content = `
    ${codeBlock(code, 'Your one-time code')}
    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#cbd5e1;">
      Enter this code in the signup form to verify your email address. It expires in ${expiresInMinutes} minutes.
    </p>
    ${buttonLink('Open verification page', verifyUrl)}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">
      If you did not try to create a CareerBoost account, you can ignore this email.
    </p>`;

  return {
    subject: `${getAppName()} verification code`,
    html: renderShell({
      title,
      preview: `Use ${code} to verify your ${getAppName()} account.`,
      heading: 'Verify your email address',
      intro: 'We received a signup request and generated a one-time code to complete verification.',
      ctaUrl: verifyUrl,
      content,
    }),
    text: `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes. Open ${verifyUrl} to finish signup.`,
  };
}

export function buildPasswordResetEmail({ resetUrl, expiresInMinutes }) {
  const title = `${getAppName()} password reset`;
  const content = `
    <div style="padding:24px;border-radius:18px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.16);">
      <p style="margin:0;font-size:15px;line-height:1.8;color:#cbd5e1;">
        We received a request to reset your password. Use the button below to open the reset page and choose a new password.
      </p>
    </div>
    ${buttonLink('Reset password', resetUrl)}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">
      This link expires in ${expiresInMinutes} minutes. If you did not request a password reset, ignore this email.
    </p>`;

  return {
    subject: `${getAppName()} password reset`,
    html: renderShell({
      title,
      preview: 'Use the secure link to reset your password.',
      heading: 'Reset your password',
      intro: 'A password reset was requested for your account.',
      ctaUrl: resetUrl,
      content,
    }),
    text: `Reset your password by opening ${resetUrl}. The link expires in ${expiresInMinutes} minutes.`,
  };
}
