import { applyCors, readJsonBody } from './_http.js';
import { sendMail } from './_mailer.js';

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mailApiKey = process.env.MAIL_API_KEY;

  if (mailApiKey && req.headers['x-mail-api-key'] !== mailApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { to, subject, html, text, replyTo } = await readJsonBody(req);

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'to, subject, and html are required' });
    }

    await sendMail({
      to,
      subject,
      html,
      text,
      replyTo,
    });

    return res.status(200).json({ message: 'Email sent.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
