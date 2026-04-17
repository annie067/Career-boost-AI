import supabase from './_supabase.js';
import { applyCors, readJsonBody } from './_http.js';
import { verifySignedToken, hashOtp } from './_tokens.js';

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { verificationToken, code, password } = await readJsonBody(req);

    if (!verificationToken || !code || !password) {
      return res.status(400).json({ error: 'Verification token, code, and password are required' });
    }

    const payload = verifySignedToken(verificationToken);

    if (payload.purpose !== 'signup-verification') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const expectedCodeHash = hashOtp(payload.email, String(code).trim());

    if (expectedCodeHash !== payload.codeHash) {
      return res.status(400).json({ error: 'Incorrect verification code' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: payload.email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data?.user;

    if (!user) {
      return res.status(500).json({ error: 'Unable to create user' });
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: payload.email.split('@')[0],
    });

    return res.status(200).json({
      message: 'Email verified successfully.',
      userId: user.id,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

