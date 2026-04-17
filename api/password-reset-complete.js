import supabase from './_supabase.js';
import { applyCors, readJsonBody } from './_http.js';
import { verifySignedToken } from './_tokens.js';

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = await readJsonBody(req);

    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and password are required' });
    }

    const payload = verifySignedToken(token);

    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(payload.userId, {
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Password updated successfully.',
      userId: data.user.id,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

