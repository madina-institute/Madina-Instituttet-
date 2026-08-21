/* SIST-ENDRET: 2026-08-21 22:55:00 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  verifyVippsWebhookRequest,
  buildSignedWebhookRequest,
  REGISTERED_WEBHOOK_HOST,
  REGISTERED_WEBHOOK_PATH,
} = require("../vippsWebhookAuth");

describe("vippsWebhookAuth", () => {
  it("godkjenner signatur når Cloud Run viser / og .run.app men Vipps signerte cloudfunctions-URL", () => {
    const secret = "test-webhook-secret-090a478d";
    const body = '{"name":"epayments.payment.authorized.v1","reference":"madina-reg-x-1"}';
    const req = buildSignedWebhookRequest({ secret, body });
    const result = verifyVippsWebhookRequest(req, secret);
    assert.equal(result.ok, true);
    assert.equal(result.path, REGISTERED_WEBHOOK_PATH);
    assert.equal(result.host, REGISTERED_WEBHOOK_HOST);
  });

  it("avviser feil hemmelighet", () => {
    const secret = "riktig-hemmelighet";
    const req = buildSignedWebhookRequest({ secret, body: "{}" });
    const result = verifyVippsWebhookRequest(req, "feil-hemmelighet");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "signature-mismatch");
  });

  it("trimmer hemmelighet med linjeskift fra Secret Manager", () => {
    const secret = "hemmelighet-med-newline";
    const req = buildSignedWebhookRequest({ secret, body: "{}" });
    const result = verifyVippsWebhookRequest(req, `${secret}\n`);
    assert.equal(result.ok, true);
  });

  it("avviser når innholdshash er endret", () => {
    const secret = "abc";
    const req = buildSignedWebhookRequest({ secret, body: '{"a":1}' });
    req.rawBody = Buffer.from('{"a":2}');
    const result = verifyVippsWebhookRequest(req, secret);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "content-hash-mismatch");
  });
});
