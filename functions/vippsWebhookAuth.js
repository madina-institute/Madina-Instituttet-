/* SIST-ENDRET: 2026-08-21 22:55:00 */
/**
 * Vipps webhook HMAC-verifisering (ren logikk, uten Firebase-avhengigheter).
 * Se: https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/request-authentication/
 */
const crypto = require("crypto");

/** Offentlig callback-URL registrert hos Vipps (path + host de signerer over). */
const REGISTERED_WEBHOOK_HOST = "us-central1-madina-instituttet.cloudfunctions.net";
const REGISTERED_WEBHOOK_PATH = "/vippsWebhook";

function normalizeHost(value) {
  if (!value) return [];
  const hosts = [];
  for (const part of String(value).split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const withoutPort = trimmed.split(":")[0];
    if (withoutPort) hosts.push(withoutPort);
  }
  return hosts;
}

function pathCandidatesFromRequest(req) {
  const paths = new Set([REGISTERED_WEBHOOK_PATH]);
  for (const raw of [req.originalUrl, req.url, req.path]) {
    if (!raw) continue;
    paths.add(String(raw));
    const withoutQuery = String(raw).split("?")[0];
    if (withoutQuery) paths.add(withoutQuery);
  }
  return [...paths];
}

function hostCandidatesFromRequest(req) {
  const hosts = new Set(normalizeHost(req.headers["x-forwarded-host"]));
  for (const h of normalizeHost(req.headers["host"])) hosts.add(h);
  hosts.add(REGISTERED_WEBHOOK_HOST);
  return [...hosts];
}

function contentHashFromRequest(rawBody, xMsContentSha256) {
  const computed = crypto.createHash("sha256").update(rawBody).digest("base64");
  if (xMsContentSha256 && xMsContentSha256 !== computed) {
    return { ok: false, reason: "content-hash-mismatch", computed, header: xMsContentSha256 };
  }
  return { ok: true, hash: xMsContentSha256 || computed };
}

function extractSignatureFromAuthHeader(authHeader) {
  const match = String(authHeader || "").match(/Signature=([^&\s]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function computeVippsSignature(secret, pathAndQuery, xMsDate, host, contentHash) {
  const signatureText = `POST\n${pathAndQuery}\n${xMsDate};${host};${contentHash}`;
  return crypto.createHmac("sha256", secret).update(signatureText).digest("base64");
}

function signaturesMatch(received, expected) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifiser Vipps webhook-signatur. Prøver flere path/host-kandidater for Gen2/Cloud Run.
 * @returns {{ ok: true, path: string, host: string } | { ok: false, reason: string, debug?: object }}
 */
function verifyVippsWebhookRequest(req, secret) {
  const trimmedSecret = String(secret || "").trim();
  if (!trimmedSecret) {
    return { ok: false, reason: "missing-secret" };
  }

  const authHeader = req.headers["authorization"] || "";
  const xMsDate = req.headers["x-ms-date"];
  const rawBody = req.rawBody;

  if (!authHeader || !xMsDate || !rawBody) {
    return { ok: false, reason: "missing-headers" };
  }

  const received = extractSignatureFromAuthHeader(authHeader);
  if (!received) {
    return { ok: false, reason: "missing-signature" };
  }

  const hashResult = contentHashFromRequest(
    rawBody,
    req.headers["x-ms-content-sha256"]
  );
  if (!hashResult.ok) {
    return { ok: false, reason: hashResult.reason };
  }

  const paths = pathCandidatesFromRequest(req);
  const hosts = hostCandidatesFromRequest(req);

  for (const pathAndQuery of paths) {
    for (const host of hosts) {
      const expected = computeVippsSignature(
        trimmedSecret,
        pathAndQuery,
        xMsDate,
        host,
        hashResult.hash
      );
      if (signaturesMatch(received, expected)) {
        return { ok: true, path: pathAndQuery, host };
      }
    }
  }

  return {
    ok: false,
    reason: "signature-mismatch",
    debug: {
      paths,
      hosts,
      hasContentHashHeader: Boolean(req.headers["x-ms-content-sha256"]),
      signatureLength: received.length,
      observedPath: req.originalUrl || req.url || req.path,
      observedHost: req.headers["host"],
      forwardedHost: req.headers["x-forwarded-host"],
    },
  };
}

/** Bygg signerte headere som Vipps ville sendt (for tester). */
function buildSignedWebhookRequest({
  secret,
  body,
  pathAndQuery = REGISTERED_WEBHOOK_PATH,
  host = REGISTERED_WEBHOOK_HOST,
  xMsDate = new Date().toUTCString(),
}) {
  const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
  const contentHash = crypto.createHash("sha256").update(rawBody).digest("base64");
  const signature = computeVippsSignature(secret, pathAndQuery, xMsDate, host, contentHash);
  return {
    method: "POST",
    rawBody,
    headers: {
      authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${encodeURIComponent(signature)}`,
      "x-ms-date": xMsDate,
      "x-ms-content-sha256": contentHash,
      host: "vippswebhook-qgyf6x4aba-uc.a.run.app",
      "x-forwarded-host": host,
    },
    path: "/",
    originalUrl: "/",
    url: "/",
  };
}

module.exports = {
  REGISTERED_WEBHOOK_HOST,
  REGISTERED_WEBHOOK_PATH,
  verifyVippsWebhookRequest,
  buildSignedWebhookRequest,
  computeVippsSignature,
  pathCandidatesFromRequest,
  hostCandidatesFromRequest,
};
