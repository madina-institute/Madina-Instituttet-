/* SIST-ENDRET: 2026-08-22 16:45:00 */
/**
 * Signerte tokens for ekstern faktura-betaling (uten innlogging i Foreldreportalen).
 */
const crypto = require("crypto");

const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function signFakturaPayToken(studentId, secret, invoiceId = null) {
  const payload = {
    sid: String(studentId || ""),
    exp: Date.now() + TTL_MS,
  };
  if (invoiceId) payload.inv = String(invoiceId);
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return payloadB64 + "." + sig;
}

function verifyFakturaPayToken(token, secret) {
  if (!token || !secret) return null;
  const parts = String(token).split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch (_) {
    return null;
  }
  if (!payload.sid || !payload.exp || Date.now() > Number(payload.exp)) return null;
  return {
    studentId: payload.sid,
    invoiceId: payload.inv ? String(payload.inv) : null,
  };
}

module.exports = { signFakturaPayToken, verifyFakturaPayToken };
