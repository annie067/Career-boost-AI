import crypto from 'node:crypto';

const tokenSecret = process.env.EMAIL_TOKEN_SECRET || 'dev-email-token-secret';

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(payload) {
  return crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
}

export function createOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(email, code) {
  return crypto.createHmac('sha256', tokenSecret).update(`${email.toLowerCase()}:${code}`).digest('hex');
}

export function createSignedToken(payload, ttlMinutes) {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, expiresAt }));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(token) {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('Invalid token');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));

  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    throw new Error('Token expired');
  }

  return payload;
}

