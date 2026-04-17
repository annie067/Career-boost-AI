import supabase from './_supabase.js';
import { applyCors, readJsonBody } from './_http.js';
import { sendMail, getAppUrl } from './_mailer.js';
import { buildPasswordResetEmail } from './_templates.js';
import { createSignedToken } from './_tokens.js';

async function findUserByEmail(email) {
  const pageSize = 100;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });

    if (error) throw error;

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email);

    if (user) return user;

    if (data.users.length < pageSize) return null;

    page += 1;
  }
}

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = await readJsonBody(req);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(200).json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const resetToken = createSignedToken(
      {
        purpose: 'password-reset',
        email: normalizedEmail,
        userId: user.id,
      },
      30
    );

    const appUrl = getAppUrl(req);
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const { subject, html, text } = buildPasswordResetEmail({
      resetUrl,
      expiresInMinutes: 30,
    });

    await sendMail({
      to: normalizedEmail,
      subject,
      html,
      text,
    });

    return res.status(200).json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

