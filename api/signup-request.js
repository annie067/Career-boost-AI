import { applyCors, readJsonBody } from './_http.js';
import { sendMail, getAppUrl } from './_mailer.js';
import { buildSignupVerificationEmail } from './_templates.js';
import { createOtpCode, createSignedToken, hashOtp } from './_tokens.js';

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
    const code = createOtpCode();
    const verificationToken = createSignedToken(
      {
        purpose: 'signup-verification',
        email: normalizedEmail,
        codeHash: hashOtp(normalizedEmail, code),
      },
      15
    );
    const appUrl = getAppUrl(req);
    const verifyUrl = `${appUrl}/auth?mode=verify`;

    const { subject, html, text } = buildSignupVerificationEmail({
      code,
      expiresInMinutes: 15,
      verifyUrl,
    });

    await sendMail({
      to: normalizedEmail,
      subject,
      html,
      text,
    });

    return res.status(200).json({
      verificationToken,
      expiresInMinutes: 15,
      message: 'Verification code sent.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
