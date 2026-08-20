/* SIST-ENDRET: 2026-08-20 10:51:19 */
/**
 * Madina Skole — Vipps betalingsintegrasjon (Cloud Functions)
 * ============================================================
 *
 * Denne filen inneholder TO funksjoner:
 *
 * 1) createVippsPayment
 *    Kalles fra admin-panelet (index.html) når man trykker "Send ekte
 *    Vipps-krav". Oppretter en ekte Vipps-betaling via Vipps sitt
 *    ePayment API og returnerer en lenke foresatte kan betale med.
 *
 * 2) vippsWebhook
 *    Vipps kaller DENNE funksjonen automatisk når betalingen er
 *    gjennomført. Når det skjer:
 *      - Elevens søknad blir automatisk godkjent (status: "Godkjent")
 *      - En ekte elev-post opprettes i 'students'
 *      - En ekte foresatt-post opprettes i 'guardians' (hvis den ikke
 *        finnes fra før) + en ekte portal-konto (Firebase Auth) slik at
 *        foresatte kan logge inn i Foreldreportalen med én gang.
 *      - Alt dette skjer UTEN at noen i administrasjonen trenger å gjøre
 *        noe manuelt — betalingen ER godkjenningen.
 *
 * ALT under er skrevet ferdig — du trenger bare å fylle inn dine egne
 * Vipps-nøkler i functions/.env (se egen fil / veiledning), og kjøre
 * "firebase deploy --only functions" fra datamaskinen din i kveld.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineString, defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

/** Vipps krever Idempotency-Key maks 50 tegn — referansen alene kan være ~46. */
function vippsIdempotencyKey(prefix, ...parts) {
  const hash = crypto.createHash("sha256").update(parts.map(String).join("|")).digest("hex").slice(0, 32);
  const key = `${prefix}-${hash}`;
  return key.length <= 50 ? key : key.slice(0, 50);
}

// ---------------------------------------------------------------------
// PRISER OG SØSKENRABATT — LESES FRA FIRESTORE
// ---------------------------------------------------------------------
// Tallene under er RESERVEVERDIER, ikke fasit. De brukes bare når
// databasen ikke svarer, eller når et program mangler pris.
//
// Bakgrunnen: admin-panelet gikk over til å lese prisen fra 'programs'
// (redigerbart under fanen «Programmer»), mens denne filen fortsatt leste
// sine egne faste tall. Endret man en pris i panelet, regnet panelet med
// den nye prisen mens Vipps krevde den gamle — uten at noe sa ifra.
//
// Begge sider leser nå det samme stedet. Endres en pris ett sted,
// endres den overalt.
// ---------------------------------------------------------------------
const PROGRAM_PRICES = {
  "Madina Islamske Skole — Integrert program (Lørdag)": 2750,
  "Madinabarn (Søndag)": 1500,
};

// Reserveverdier for søskenrabatt, i prosent. Endres i panelet under
// settings/priser — MERK at 20/30 fortsatt er det vedtatte. Notatet om
// medlemspris foreslår 10/20, men det er «Beregnet, ikke vedtatt».
// Reserven er 0, ikke en gammel sats. Svarer ikke basen, skal beløpet bli
// synlig FEIL — ikke se riktig ut. 20/30 var en tidligere ordning, og et
// tall som ser plausibelt ut blir fakturert uten at noen ser etter.
const RABATT_RESERVE = { barn2: 0, barn3: 0 };

// Ett kall kan regne pris for flere barn. Uten denne ville hver utregning
// slått opp de samme to dokumentene på nytt.
let _prisCache = null;
function nullstillPrisCache() { _prisCache = null; }

async function hentPrisoppsett() {
  if (_prisCache) return _prisCache;
  const oppsett = {
    programPriser: {},          // navn -> { mnd, aar }
    rabatt: { ...RABATT_RESERVE },
    tellForesatt2: false,
    antallManeder: 9,           // 4 mnd høst + 5 mnd vår
    materiellAvgift: 0,         // 0 er synlig feil; et gjettet beløp blir fakturert
    terminer: 1,
    depositum: 500,
  };

  // Prisene: samme kilde som panelet bruker.
  try {
    const snap = await db.collection("programs").get();
    snap.forEach((d) => {
      const p = d.data();
      if (!p.navn) return;
      const tall = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
      const mnd = tall(p.prisMedlemMnd);
      let aar = tall(p.prisAar);
      // Måneder hører til programmet — ulike programmer kan gå over ulikt
      // antall måneder. Samme regel som i panelet.
      const egneMnd = tall(p.antallManeder);
      // Programmer som ennå ikke har fått årsprisen: fall tilbake på det
      // gamle semesterbeløpet ganget med to, slik panelet også gjør.
      // De to MÅ regne likt — ellers viser panelet ett beløp og Vipps
      // trekker et annet.
      if (aar === 0 && tall(p.pris) > 0) aar = tall(p.pris) * 2;
      // Materiellavgiften hører også til programmet — ulike programmer
      // bruker ulike bøker. Tomt felt = fellessatsen. 0 er en ekte verdi.
      const eget = String(p.materiellAvgift === undefined || p.materiellAvgift === null ? "" : p.materiellAvgift).trim();
      oppsett.programPriser[p.navn] = {
        mnd, aar, maneder: egneMnd,
        materiell: eget !== "" ? tall(eget) : null,
      };
    });
  } catch (err) {
    logger.warn("Kunne ikke lese 'programs' — bruker reserveprisene", err);
  }

  // Rabattsatsene.
  try {
    const doc = await db.collection("settings").doc("priser").get();
    if (doc.exists) {
      const d = doc.data() || {};
      const r2 = parseFloat(d.soskenRabatt2);
      const r3 = parseFloat(d.soskenRabatt3);
      if (!isNaN(r2) && r2 >= 0 && r2 <= 100) oppsett.rabatt.barn2 = r2;
      if (!isNaN(r3) && r3 >= 0 && r3 <= 100) oppsett.rabatt.barn3 = r3;
      const mnd = parseFloat(d.antallManeder);
      if (!isNaN(mnd) && mnd >= 1 && mnd <= 12) oppsett.antallManeder = mnd;
      const mat = parseFloat(d.materiellAvgift);
      if (!isNaN(mat) && mat >= 0) oppsett.materiellAvgift = mat;
      const ter = parseFloat(d.terminer);
      if (!isNaN(ter) && ter >= 1 && ter <= 12) oppsett.terminer = ter;
      const dep = parseFloat(d.depositum);
      if (!isNaN(dep) && dep >= 0) oppsett.depositum = dep;
      // Teller barn registrert på foresatt2 som søsken? Står som false
      // fordi det er dagens oppførsel — se merknaden i computeSoskenPrice.
      oppsett.tellForesatt2 = d.tellForesatt2 === true;
    }
  } catch (err) {
    logger.warn("Kunne ikke lese settings/priser — bruker reservesatsene", err);
  }

  _prisCache = oppsett;
  return oppsett;
}

// Oversetter søknadens rå program-koder (avkrysningsbokser i
// påmeldingsskjemaet, f.eks. "sprak_arabisk,madina_islamske_skole") til
// den samme kanoniske programstrengen admin-panelet bruker som nøkkel i
// PROGRAM_PRICES over — slik at riktig avgift alltid følger med, uansett
// om eleven godkjennes manuelt av en administrator ELLER opprettes
// automatisk her når betalingen kommer inn via Vipps.
function mapRegistrationProgram(codesStr) {
  const codes = (codesStr || "").split(",").map((s) => s.trim());
  const hasMadinabarn = codes.includes("madinabarn");
  const hasIntegrert = codes.includes("madina_islamske_skole") || codes.includes("integrert")
    || codes.includes("sprak_arabisk") || codes.includes("sprak_urdu");
  if (hasIntegrert) return "Madina Islamske Skole — Integrert program (Lørdag)";
  if (hasMadinabarn) return "Madinabarn (Søndag)";
  return "";
}

function mapRegistrationSprakvalg(reg) {
  if (reg.sprakvalg) return reg.sprakvalg;
  const codes = (reg.program || "").split(",").map((s) => s.trim());
  if (codes.includes("sprak_urdu")) return "Urdu";
  if (codes.includes("sprak_arabisk")) return "Arabisk";
  return "";
}

// Søskenrabatt: 1. barn full pris, 2. barn og 3.+ barn med satsene fra
// settings/priser — basert på hvor mange barn denne foresatte allerede
// har registrert i 'students'.
//
// ⚠️ Barn registrert på foresatt2 telles IKKE som søsken med mindre
// tellForesatt2 er slått på. Det er dagens oppførsel i både panelet og
// her: står barnet under den andre foresatte, får familien ikke rabatt
// og betaler for mye. Innstillingen finnes for å kunne rette det uten
// at satsene endrer seg av seg selv.
// ═══════════════════════════════════════════════════════════════════
// PRISBEREGNING — MÅ GI NØYAKTIG SAMME BELØP SOM PANELET
// -------------------------------------------------------------------
// Denne funksjonen er tvillingen til familiePriser() i admin.html.
// Endres den ene uten den andre, viser panelet ett beløp mens Vipps
// trekker et annet — og ingen oppdager det før en familie klager.
// Det skjedde 8. august, med prisen som lå hardkodet her.
//
//   MEDLEM       fast månedspris × antall måneder. INGEN søskenrabatt.
//   IKKE MEDLEM  fast årspris, DERETTER søskenrabatt.
//
// Materiellavgiften kommer PÅ TOPPEN for alle og rabatteres aldri.
//
// Ingen beløp står i koden: alt leses fra 'programs' og
// 'settings/priser', som redigeres i panelet.
// ═══════════════════════════════════════════════════════════════════
async function computeSoskenPrice(program, guardianId, excludeId, erMedlem) {
  const oppsett = await hentPrisoppsett();
  const priserFor = (navn) => {
    const p = oppsett.programPriser[navn];
    // Gamle oppføringer kunne være et enkelt tall. Håndteres, men uten
    // å gjette hva tallet betydde — det ville gitt feil faktura.
    if (typeof p === "number") return { mnd: 0, aar: p, maneder: 0, materiell: null };
    return p || { mnd: 0, aar: 0, maneder: 0, materiell: null };
  };
  // Programmets egen materiellavgift går foran fellessatsen — samme regel
  // som i panelet. Står de to ulikt, trekker Vipps et annet beløp enn
  // panelet viser; det skjedde 8. august og skal ikke skje igjen.
  const materiellFor = (navn) => {
    const eget = priserFor(navn).materiell;
    return (eget === null || eget === undefined) ? (oppsett.materiellAvgift || 0) : eget;
  };
  const materiell = materiellFor(program);
  // Programmets egne måneder går foran. Mangler de, brukes fellesverdien.
  const manederFor = (navn) => priserFor(navn).maneder || oppsett.antallManeder || 9;
  const medlem = String(erMedlem || "").trim() === "Ja";

  // ---- Medlem: fast pris, uavhengig av hvor mange søsken som finnes ----
  if (medlem) {
    const undervisning = Math.round(priserFor(program).mnd * manederFor(program));
    return { price: undervisning + materiell, pos: 1, medlem: true,
             undervisning, materiell };
  }

  const egen = priserFor(program).aar;
  if (!guardianId) {
    return { price: egen + materiell, pos: 1, medlem: false,
             undervisning: egen, materiell };
  }

  // ---- Ikke medlem: hent søsknene for å finne plasseringen ----
  let sosken = [];
  try {
    const snap = await db.collection("students").where("foresatt", "==", guardianId).get();
    snap.forEach((d) => sosken.push({ id: d.id, ...d.data() }));
    if (oppsett.tellForesatt2) {
      const snap2 = await db.collection("students").where("foresatt2", "==", guardianId).get();
      const ider = new Set(sosken.map((s) => s.id));
      snap2.forEach((d) => { if (!ider.has(d.id)) sosken.push({ id: d.id, ...d.data() }); });
    }
  } catch (err) {
    // Full pris ved feil. Å gjette en rabatt vi ikke kan begrunne ville
    // trukket for lite, og differansen måtte kreves inn i etterkant.
    logger.warn("Kunne ikke hente søsken — regner full pris", err);
    return { price: egen + materiell, pos: 1, medlem: false,
             undervisning: egen, materiell };
  }

  // Eleven det gjelder skal telle med, men bare én gang.
  const nyId = excludeId || "__ny__";
  sosken = sosken.filter((s) => s.id !== nyId);
  sosken.push({ id: nyId, program, erMedlem: "Nei" });

  // Kun ikke-medlemmer inngår i søskenrekkefølgen — medlemmer står helt
  // utenfor rabattsystemet. Sorteres STIGENDE etter pris, så de dypeste
  // rabattene havner på de DYRESTE programmene, slik skolen har bestemt.
  // Ved lik pris avgjør id-en, nøyaktig som i panelet, slik at begge to
  // alltid fordeler likt.
  const rekke = sosken
    .filter((s) => String(s.erMedlem || "").trim() !== "Ja")
    .map((s) => ({ id: s.id, aar: priserFor(s.program).aar }))
    .sort((a, b) => (a.aar - b.aar) || String(a.id).localeCompare(String(b.id)));

  const plass = rekke.findIndex((r) => r.id === nyId) + 1;
  let undervisning = egen;
  if (plass === 2) undervisning = Math.round(egen * (1 - oppsett.rabatt.barn2 / 100));
  else if (plass >= 3) undervisning = Math.round(egen * (1 - oppsett.rabatt.barn3 / 100));

  return { price: undervisning + materiell, pos: plass, medlem: false,
           undervisning, materiell };
}

// ---------------------------------------------------------------------
// KONFIGURASJON — verdiene under leses fra functions/.env (se README).
// Aldri skriv de ekte nøklene direkte inn i denne filen.
// ---------------------------------------------------------------------
const VIPPS_ENV = defineString("VIPPS_ENV", { default: "test" }); // "test" eller "prod"
const VIPPS_CLIENT_ID = defineSecret("VIPPS_CLIENT_ID");
const VIPPS_CLIENT_SECRET = defineSecret("VIPPS_CLIENT_SECRET");
const VIPPS_SUBSCRIPTION_KEY = defineSecret("VIPPS_SUBSCRIPTION_KEY");
const VIPPS_MSN = defineString("VIPPS_MSN"); // Merchant Serial Number (sales unit ID)
const VIPPS_WEBHOOK_SECRET = defineSecret("VIPPS_WEBHOOK_SECRET"); // fra webhook-registreringen
const SITE_BASE_URL = defineString("SITE_BASE_URL", {
  default: "https://madinaskole.no",
});

function vippsApiBase() {
  return VIPPS_ENV.value() === "prod"
    ? "https://api.vipps.no"
    : "https://apitest.vipps.no";
}

// ---------------------------------------------------------------------
// Henter et Vipps access-token (gyldig i ca. 1 time). Vi ber om et nytt
// token for hvert kall her for enkelhets skyld — for skolens volum
// (noen få betalinger i uken) er dette mer enn godt nok, og unngår
// kompleksiteten med mellomlagring/cache.
// ---------------------------------------------------------------------
async function getVippsAccessToken() {
  const res = await fetch(`${vippsApiBase()}/accesstoken/get`, {
    method: "POST",
    headers: {
      "client_id": VIPPS_CLIENT_ID.value(),
      "client_secret": VIPPS_CLIENT_SECRET.value(),
      "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY.value(),
      "Merchant-Serial-Number": VIPPS_MSN.value(),
      "Vipps-System-Name": "madina-skole",
      "Vipps-System-Version": "1.0.0",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Klarte ikke å hente Vipps-token (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

function vippsJsonHeaders(accessToken, idempotencyKey) {
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY.value(),
    "Merchant-Serial-Number": VIPPS_MSN.value(),
    "Content-Type": "application/json",
    "Vipps-System-Name": "madina-skole",
    "Vipps-System-Version": "1.0.0",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return headers;
}

async function fetchVippsPayment(reference, accessToken) {
  const res = await fetch(`${vippsApiBase()}/epayment/v1/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: vippsJsonHeaders(accessToken),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Kunne ikke hente betalingsstatus (${res.status}): ${bodyText}`);
  }
  return JSON.parse(bodyText);
}

function vippsAggregateOre(payment) {
  const agg = payment?.aggregate || {};
  return {
    authorized: Number(agg.authorizedAmount?.value || 0),
    captured: Number(agg.capturedAmount?.value || 0),
    cancelled: Number(agg.cancelledAmount?.value || 0),
    refunded: Number(agg.refundedAmount?.value || 0),
  };
}

function vippsRefundableOre(agg) {
  return Math.max(0, agg.captured - agg.refunded);
}

function vippsCaptureableOre(agg) {
  return Math.max(0, agg.authorized - agg.captured - agg.cancelled);
}

function formatVippsApiError(bodyText) {
  try {
    const err = JSON.parse(bodyText);
    const code = err.extraDetails?.[0]?.reason || err.extraDetails?.[0]?.name;
    const detail = err.detail || err.title || bodyText;
    if (code === "6150" || /not enough refundable/i.test(String(detail))) {
      return "Beløpet overstiger det som kan refunderes hos Vipps. Sjekk betalingsloggen — kanskje delvis refundert, eller beløpet er autorisert men ikke capturert ennå.";
    }
    if (code === "6180") return "Betalingen er allerede refundert hos Vipps.";
    if (code === "6020") return "Betalingen er ikke reservert hos Vipps — kan ikke refundere ennå.";
    if (code === "6190" || /cannot be cancelled/i.test(String(detail))) {
      const stateMatch = String(detail).match(/Invalid state:\s*(\w+)/i);
      const state = stateMatch ? stateMatch[1].toUpperCase() : "";
      if (state === "EXPIRED") return "Kravet har utløpt hos Vipps og kan ikke avbrytes.";
      if (state) return `Kravet kan ikke avbrytes — status hos Vipps: ${state}.`;
      return "Kravet kan ikke avbrytes hos Vipps.";
    }
    return detail;
  } catch (_) {
    return bodyText;
  }
}

function parseVippsInvalidState(bodyText) {
  try {
    const err = JSON.parse(bodyText);
    const m = String(err.detail || "").match(/Invalid state:\s*(\w+)/i);
    return m ? m[1].toUpperCase() : null;
  } catch (_) {
    return null;
  }
}

async function closePendingVippsByReference(reference, newStatus, extra = {}) {
  const pendingSnap = await db.collection("pendingVippsPayments").where("reference", "==", reference).limit(1).get();
  if (!pendingSnap.empty) {
    await pendingSnap.docs[0].ref.update({
      status: newStatus,
      closedAt: new Date().toISOString(),
      ...extra,
    });
  }
}

function vippsTerminalPendingStatus(invalidState) {
  const map = {
    EXPIRED: "expired",
    TERMINATED: "expired",
    CANCELLED: "cancelled",
    AUTHORIZED: "completed",
    CAPTURED: "completed",
    REFUNDED: "completed",
  };
  return map[invalidState] || null;
}

function vippsCleanupMessage(invalidState) {
  if (invalidState === "EXPIRED" || invalidState === "TERMINATED") {
    return "Kravet hadde allerede utløpt hos Vipps — fjernet fra listen.";
  }
  if (invalidState === "CANCELLED") {
    return "Kravet var allerede avbrutt hos Vipps — fjernet fra listen.";
  }
  if (invalidState === "AUTHORIZED" || invalidState === "CAPTURED") {
    return "Kravet er allerede betalt hos Vipps — fjernet fra utestående-listen.";
  }
  return `Kravet er ${invalidState.toLowerCase()} hos Vipps — fjernet fra listen.`;
}

async function captureVippsPayment(reference, amountOre, accessToken) {
  const res = await fetch(`${vippsApiBase()}/epayment/v1/payments/${encodeURIComponent(reference)}/capture`, {
    method: "POST",
    headers: vippsJsonHeaders(accessToken, vippsIdempotencyKey("cp", reference, amountOre)),
    body: JSON.stringify({
      modificationAmount: { currency: "NOK", value: Math.round(Number(amountOre)) },
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    logger.error("Vipps capture failed", bodyText);
    throw new Error(formatVippsApiError(bodyText));
  }
  try {
    return JSON.parse(bodyText);
  } catch (_) {
    return await fetchVippsPayment(reference, accessToken);
  }
}

async function ensureVippsRefundable(reference, amountOre, accessToken) {
  let payment = await fetchVippsPayment(reference, accessToken);
  let agg = vippsAggregateOre(payment);
  let refundable = vippsRefundableOre(agg);

  if (amountOre <= refundable) {
    return { payment, agg, refundableOre: refundable };
  }

  const captureable = vippsCaptureableOre(agg);
  if (captureable > 0) {
    const toCapture = Math.min(amountOre - refundable, captureable);
    logger.info(`Capturer ${toCapture} øre før refusjon for ${reference}`);
    payment = await captureVippsPayment(reference, toCapture, accessToken);
    agg = vippsAggregateOre(payment);
    refundable = vippsRefundableOre(agg);
  }

  if (amountOre > refundable) {
    const maxKr = refundable / 100;
    throw new Error(
      `Kan maks refundere ${maxKr} kr for denne betalingen hos Vipps ` +
      `(capturert ${agg.captured / 100} kr, allerede refundert ${agg.refunded / 100} kr, status ${payment.state || "?"}).`
    );
  }

  return { payment, agg, refundableOre: refundable };
}

// =======================================================================
// 1) createVippsPayment
    //    POST { type: 'registration'|'balance', targetId, amountKr, phoneNumber }
    //    - type 'registration': targetId er en registrations-dokument-ID
    //      (depositum etter manuell godkjenning — webhooken krediterer eksisterende elev).
    //    - type 'balance': targetId er en students-dokument-ID (en allerede
//      godkjent elev som betaler ned på restbeløpet — webhooken oppdaterer
//      bare belopBetalt, oppretter INGEN ny elev).
//    Returnerer { ok:true, redirectUrl } eller { ok:false, error }
// =======================================================================

/* ══════════════════════════════════════════════════════════════════
 * INNLOGGINGSKRAV FOR VIPPS-FUNKSJONENE
 * ══════════════════════════════════════════════════════════════════
 *
 * Disse funksjonene er HTTP-endepunkter med åpen CORS. Uten en sjekk her
 * kunne hvem som helst som kjente URL-en sende et ekte Vipps-betalingskrav
 * til et hvilket som helst telefonnummer — i skolens navn, og uten å åpne
 * administrasjonspanelet i det hele tatt. URL-mønsteret er lett å gjette.
 *
 * Klienten sender nå med et Firebase ID-token i Authorization-headeren.
 * Tokenet er signert av Firebase og kan ikke forfalskes; det verifiseres
 * her før noe som helst skjer.
 *
 * Returnerer den innloggede brukeren, eller null hvis forespørselen skal
 * avvises (svaret er da allerede sendt).
 */
// Rollene som får sende Vipps-krav. Sperren i admin.html skjuler knappene,
// men den sperren lever i nettleseren og kan omgås. DENNE er den ekte —
// et Vipps-krav kan ikke opprettes uten at serveren har slått opp brukeren
// i 'adminUsers' og funnet en av disse rollene.
const OPPTAK_ROLLER = ["Eier", "Opptaksansvarlig"];
const NODKONTO = "post@madinaskole.no";
const KASSERER_LEDELSE_ROLLER = ["Øverste leder", "Eier"];

async function krevAdminPanel(bruker, res) {
  const epost = (bruker.epost || "").trim().toLowerCase();
  if (!epost) {
    res.status(403).json({ ok: false, error: "Kontoen mangler e-post." });
    return false;
  }
  if (epost === NODKONTO) return true;
  const tilgangSnap = await db.collection("tilgang").doc(epost).get();
  if (tilgangSnap.exists) {
    const t = tilgangSnap.data() || {};
    if (t.panel === true || Number(t.niva) <= 2) return true;
  }
  const adminSnap = await db.collection("adminUsers").where("epost", "==", bruker.epost).get();
  if (!adminSnap.empty) return true;
  logger.warn("Admin-kall avvist", { epost });
  res.status(403).json({ ok: false, error: "Kun for administrativt panel." });
  return false;
}

async function krevKassererLedelse(bruker, res) {
  const epost = (bruker.epost || "").trim().toLowerCase();
  if (!epost) {
    res.status(403).json({ ok: false, error: "Kontoen mangler e-post." });
    return false;
  }
  if (epost === NODKONTO) return true;
  const tilgangSnap = await db.collection("tilgang").doc(epost).get();
  if (tilgangSnap.exists && Number(tilgangSnap.data().niva) <= 1) return true;
  const adminSnap = await db.collection("adminUsers").where("epost", "==", bruker.epost).get();
  const harRolle = adminSnap.docs.some((d) => {
    const roller = String((d.data().roller || d.data().rolle || ""))
      .split(",").map((r) => r.trim());
    return roller.some((r) => KASSERER_LEDELSE_ROLLER.includes(r));
  });
  if (!harRolle) {
    logger.warn("Kasserer (Ledelse)-kall avvist", { epost });
    res.status(403).json({ ok: false, error: "Kun for øverste ledelse." });
    return false;
  }
  return true;
}

async function krevOpptaksrolle(bruker, res) {
  if (!bruker.epost) {
    res.status(403).json({ ok: false, error: "Kontoen mangler e-post." });
    return false;
  }
  const snap = await db.collection("adminUsers").where("epost", "==", bruker.epost).get();
  const harRolle = snap.docs.some((d) => {
    const roller = String((d.data().roller || d.data().rolle || ""))
      .split(",").map((r) => r.trim());
    return roller.some((r) => OPPTAK_ROLLER.includes(r));
  });
  if (!harRolle) {
    logger.warn("Vipps-krav avvist — mangler opptaksrolle", { epost: bruker.epost });
    res.status(403).json({
      ok: false,
      error: "Kun opptaksansvarlig kan sende Vipps-krav."
    });
    return false;
  }
  return true;
}

async function krevInnlogget(req, res) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    logger.warn("Vipps-kall uten token", { ip: req.ip, path: req.path });
    res.status(401).json({ ok: false, error: "Innlogging kreves." });
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, epost: decoded.email || "" };
  } catch (err) {
    logger.warn("Vipps-kall med ugyldig token", { ip: req.ip, feil: String(err && err.message) });
    res.status(401).json({ ok: false, error: "Ugyldig eller utløpt innlogging." });
    return null;
  }
}

// Foresatt som betaler fra egen telefon (Foreldreportalen) — ikke admin.
async function krevForesattTilgang(bruker, type, targetId, res) {
  if (!bruker.epost) {
    res.status(403).json({ ok: false, error: "Kontoen mangler e-post." });
    return false;
  }
  if (type !== "balance") {
    res.status(403).json({ ok: false, error: "Depositum betales via lenke fra skolen." });
    return false;
  }
  const guardianSnap = await db.collection("guardians")
    .where("epost", "==", bruker.epost)
    .limit(1)
    .get();
  if (guardianSnap.empty) {
    res.status(403).json({ ok: false, error: "Fant ingen foresatt-konto for denne brukeren." });
    return false;
  }
  const guardianId = guardianSnap.docs[0].id;
  const studentSnap = await db.collection("students").doc(targetId).get();
  if (!studentSnap.exists) {
    res.status(404).json({ ok: false, error: "Fant ikke eleven." });
    return false;
  }
  const student = studentSnap.data();
  if (student.foresatt !== guardianId && student.foresatt2 !== guardianId) {
    res.status(403).json({ ok: false, error: "Du har ikke tilgang til denne eleven." });
    return false;
  }
  return true;
}

const VIPPS_RETURN_URL = "https://madinaskole.no/foreldre?vipps=return";

function vippsPushNote(userFlow) {
  if (VIPPS_ENV.value() !== "test") {
    if (userFlow === "PUSH_MESSAGE") {
      return "Push-varsel er sendt til Vipps-appen. Foresatt kan også bruke betalingslenken i e-posten.";
    }
    return "Betalingslenke er klar. Foresatt åpner lenken på mobilen for å betale i Vipps.";
  }
  if (userFlow === "PUSH_MESSAGE") {
    return "Test-miljø: push-varsler er ofte ustabile hos Vipps. Be foresatt åpne Vipps test-appen → Betalinger → dra ned for å oppdatere. Betalingslenken i e-posten fungerer alltid som backup.";
  }
  return "Test-miljø: betalingslenken åpner Vipps test-appen direkte på mobilen.";
}

async function postVippsPayment(accessToken, { reference, normalizedPhone, amountKr, paymentDescription, userFlow, returnUrl, paymentMethodType }) {
  const method = paymentMethodType === "CARD" ? "CARD" : "WALLET";
  const payload = {
    amount: { currency: "NOK", value: Math.round(Number(amountKr) * 100) },
    paymentMethod: { type: method },
    reference,
    userFlow,
    paymentDescription,
  };
  if (method === "WALLET" && normalizedPhone) {
    payload.customer = { phoneNumber: normalizedPhone };
  }
  if (userFlow === "WEB_REDIRECT") {
    payload.returnUrl = returnUrl || VIPPS_RETURN_URL;
  }

  const paymentRes = await fetch(`${vippsApiBase()}/epayment/v1/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY.value(),
      "Merchant-Serial-Number": VIPPS_MSN.value(),
      "Content-Type": "application/json",
      "Idempotency-Key": reference,
      "Vipps-System-Name": "madina-skole",
      "Vipps-System-Version": "1.0.0",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await paymentRes.text();
  let paymentData = null;
  if (paymentRes.ok) {
    try { paymentData = JSON.parse(bodyText); } catch (_) { paymentData = {}; }
  }
  return { ok: paymentRes.ok, status: paymentRes.status, bodyText, paymentData };
}

exports.createVippsPayment = onRequest(
  { secrets: [VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY], cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }

    const bruker = await krevInnlogget(req, res);
    if (!bruker) return;

    try {
      const { type, targetId, amountKr, phoneNumber, initiatedBy, paymentMethodType } = req.body || {};
      const erForesatt = initiatedBy === "guardian";
      const method = paymentMethodType === "CARD" ? "CARD" : "WALLET";

      if (erForesatt) {
        if (!(await krevForesattTilgang(bruker, type, targetId, res))) return;
      } else if (!(await krevOpptaksrolle(bruker, res))) {
        return;
      }

      if (!type || !targetId || !amountKr) {
        res.status(400).json({ ok: false, error: "Mangler type, targetId eller amountKr." });
        return;
      }
      if (method === "WALLET" && !phoneNumber) {
        res.status(400).json({ ok: false, error: "Mangler phoneNumber for Vipps-betaling." });
        return;
      }
      // Vipps MT/UAT støtter ikke freestanding CARD — cards-mt.vipps.no viser
      // «ikke tilgjengelig». Kort virker først i produksjon (VIPPS_ENV=prod).
      if (method === "CARD" && VIPPS_ENV.value() !== "prod") {
        res.status(400).json({
          ok: false,
          error: "Kortbetaling er ikke tilgjengelig i Vipps test-miljø. Bruk «Betal med Vipps», eller aktiver kort i produksjon.",
          cardNotInTest: true,
        });
        return;
      }
      if (type !== "registration" && type !== "balance") {
        res.status(400).json({ ok: false, error: "Ugyldig type — må være 'registration' eller 'balance'." });
        return;
      }

      const sourceCollection = type === "registration" ? "registrations" : "students";
      const sourceRef = db.collection(sourceCollection).doc(targetId);
      const sourceSnap = await sourceRef.get();
      if (!sourceSnap.exists) {
        res.status(404).json({ ok: false, error: "Fant ikke " + (type === "registration" ? "søknaden" : "eleven") + "." });
        return;
      }
      const sourceData = sourceSnap.data();
      const elevNavn = sourceData.elev_navn || sourceData.navn || "elev";

      const accessToken = await getVippsAccessToken();

      const typeCode = type === "registration" ? "reg" : "bal";
      const reference = `madina-${typeCode}-${targetId}-${Date.now()}`;

      let normalizedPhone = String(phoneNumber || "").replace(/\D/g, "");
      if (normalizedPhone.length === 8) normalizedPhone = "47" + normalizedPhone;

      const paymentDescription = type === "registration"
        ? `Depositum — ${elevNavn} (Madina Skole)`
        : `Skolepenger — ${elevNavn} (Madina Skole)`;

      // Admin sender fra kontor → PUSH_MESSAGE (krever MSN-godkjenning hos Vipps).
      // Foresatt betaler fra egen telefon → WEB_REDIRECT (anbefalt av Vipps).
      // CARD = freestanding kort (Visa/Mastercard) uten Vipps-app.
      let userFlow = method === "CARD" ? "WEB_REDIRECT" : (erForesatt ? "WEB_REDIRECT" : "PUSH_MESSAGE");
      let attempt = await postVippsPayment(accessToken, {
        reference,
        normalizedPhone,
        amountKr,
        paymentDescription,
        userFlow,
        returnUrl: VIPPS_RETURN_URL,
        paymentMethodType: method,
      });

      // MSN uten PUSH_MESSAGE-godkjenning: fall tilbake til lenke i e-post.
      if (!attempt.ok && !erForesatt && userFlow === "PUSH_MESSAGE") {
        const pushAvvist = /PUSH_MESSAGE/i.test(attempt.bodyText);
        if (pushAvvist) {
          logger.warn("PUSH_MESSAGE avvist — prøver WEB_REDIRECT", { reference, body: attempt.bodyText });
          userFlow = "WEB_REDIRECT";
          attempt = await postVippsPayment(accessToken, {
            reference,
            normalizedPhone,
            amountKr,
            paymentDescription,
            userFlow,
            returnUrl: VIPPS_RETURN_URL,
          });
        }
      }

      if (!attempt.ok) {
        logger.error("Vipps create payment failed", attempt.bodyText);
        res.status(502).json({ ok: false, error: "Vipps avviste betalingen: " + attempt.bodyText });
        return;
      }

      const paymentData = attempt.paymentData || {};

      await sourceRef.update({
        vippsReference: reference,
        vippsStatus: "CREATED",
        vippsCreatedAt: new Date().toISOString(),
        vippsUserFlow: userFlow,
      });

      await db.collection("pendingVippsPayments").add({
        reference,
        type,
        targetId,
        studentId: type === "balance" ? targetId : null,
        elevNavn,
        amountKr: Number(amountKr),
        phoneNumber: normalizedPhone,
        userFlow,
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: bruker.epost || null,
        initiatedBy: erForesatt ? "guardian" : "admin",
      });

      const vippsEnv = VIPPS_ENV.value() === "prod" ? "prod" : "test";
      res.status(200).json({
        ok: true,
        redirectUrl: paymentData.redirectUrl || null,
        reference,
        userFlow,
        vippsEnv,
        pushNote: vippsPushNote(userFlow),
        usedFallback: userFlow === "WEB_REDIRECT" && !erForesatt,
      });
    } catch (err) {
      logger.error("createVippsPayment error", err);
      res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }
);

// =======================================================================
// Vipps webhook-signaturverifisering
// -----------------------------------------------------------------------
// Vipps signerer hvert webhook-kall slik at vi kan være HELT sikre på at
// det faktisk kommer fra Vipps, og ikke fra noen som prøver å late som
// en betaling gikk gjennom for å få gratis skoleplass. Dette er ikke en
// enkel HMAC-sjekk — Vipps bruker en egen oppskrift (se deres offisielle
// dokumentasjon "How to authenticate the webhook event"):
//
//   contentHash   = base64( SHA256(raw request body) )
//   signatureText = "POST\n" + pathAndQuery + "\n" + xMsDate + ";" + host + ";" + contentHash
//   signature     = base64( HMAC-SHA256(secret, signatureText) )
//
// Denne signaturen skal matche det som står i Authorization-headeren.
// =======================================================================
function verifyVippsWebhookSignature(req) {
  try {
    const authHeader = req.headers["authorization"] || "";
    const xMsDate = req.headers["x-ms-date"];
    const host = req.headers["host"];
    const rawBody = req.rawBody; // Buffer — lagt til automatisk av Firebase Functions

    if (!authHeader || !xMsDate || !host || !rawBody) {
      logger.warn("Webhook mangler nødvendige headere for signaturverifisering.");
      return false;
    }

    const match = authHeader.match(/Signature=([^&\s]+)$/);
    if (!match) {
      logger.warn("Fant ikke Signature i Authorization-headeren.");
      return false;
    }
    const receivedSignature = decodeURIComponent(match[1]);

    const contentHash = crypto.createHash("sha256").update(rawBody).digest("base64");
    const pathAndQuery = req.originalUrl || req.url;
    const signatureText = `POST\n${pathAndQuery}\n${xMsDate};${host};${contentHash}`;

    // VIKTIG: hemmeligheten skal brukes SOM DEN ER (som en vanlig UTF-8
    // streng) i HMAC-nøkkelen — IKKE base64-dekodes først. Dette var
    // årsaken til at signaturverifiseringen alltid feilet: Vipps sin egen
    // offisielle kodeeksempel bruker secret direkte i crypto.createHmac,
    // selv om strengen ser ut som base64.
    const expectedSignature = crypto
      .createHmac("sha256", VIPPS_WEBHOOK_SECRET.value())
      .update(signatureText)
      .digest("base64");

    const ok = crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
    if (!ok) logger.warn("Webhook-signatur stemmer ikke — avviser forespørselen.");
    return ok;
  } catch (err) {
    logger.error("Feil under signaturverifisering", err);
    return false;
  }
}

exports.vippsWebhook = onRequest(
  { secrets: [VIPPS_WEBHOOK_SECRET] },
  async (req, res) => {
  // Cloud Functions gjenbruker en varm instans mellom kall. Uten dette
  // ville prisene fra første kall blitt liggende i minnet, og en
  // prisendring i panelet ikke slått inn før instansen ble byttet ut.
  nullstillPrisCache();
  try {
    if (!verifyVippsWebhookSignature(req)) {
      res.status(401).send("Ugyldig signatur");
      return;
    }
    const event = req.body || {};
    logger.info("Vipps webhook mottatt", event);

    // Vi bryr oss kun om vellykkede betalinger. Andre hendelser
    // (opprettet, avbrutt, utløpt osv.) kvitteres bare med 200 OK uten
    // videre handling, slik Vipps forventer.
    const isPaymentAuthorized =
      event.name === "AUTHORIZED" || event.name === "epayments.payment.authorized.v1";
    if (!isPaymentAuthorized) {
      res.status(200).send("OK (ignorert hendelse)");
      return;
    }

    const reference = event.reference;
    if (!reference) {
      res.status(200).send("OK (mangler reference)");
      return;
    }

    // Referansen har formen "madina-{typeCode}-{targetId}-{tidsstempel}",
    // der typeCode er "reg" (registration) eller "bal" (balance) — korte
    // koder fordi Vipps krever at Idempotency-Key er maks 50 tegn totalt.
    const refParts = reference.split("-");
    const typeCode = refParts[1]; // "reg" eller "bal"
    const paymentType = typeCode === "reg" ? "registration" : (typeCode === "bal" ? "balance" : typeCode);
    const targetId = refParts[2];
    const paidAmountKr = event.amount && typeof event.amount.value === "number"
      ? event.amount.value / 100
      : null;

    if (paymentType === "balance") {
      // ---- Betaling på en ALLEREDE godkjent elevs restbeløp ----
      // Oppretter INGEN ny elev — oppdaterer bare belopBetalt på den
      // eksisterende eleven, og logger endringen i financeLog slik admin
      // allerede er vant til å se betalingsendringer.
      const studentRef = db.collection("students").doc(targetId);
      const studentSnap = await studentRef.get();
      if (!studentSnap.exists) {
        logger.warn("Fant ingen elev for Vipps-referanse (balance)", reference);
        res.status(200).send("OK (ukjent elev)");
        return;
      }
      const student = studentSnap.data();
      if (student.vippsLastReference === reference) {
        res.status(200).send("OK (allerede behandlet)");
        return;
      }
      const currentPaid = Number(student.belopBetalt || 0);
      const newPaid = currentPaid + (paidAmountKr || 0);
      await studentRef.update({
        belopBetalt: String(newPaid),
        betalt: newPaid >= Number(student.belop || 0) ? "Ja" : "Delvis",
        vippsStatus: "AUTHORIZED",
        vippsLastReference: reference,
        vippsBetaltDato: new Date().toISOString(),
      });
      // Logger DENNE spesifikke betalingen for seg selv (ikke bare den
      // oppdaterte totalsummen), slik at administrasjonen kan se hver
      // enkelt innbetaling med dato/klokkeslett i Betalingsoversikt.
      await db.collection("studentPayments").add({
        studentId: targetId,
        belop: paidAmountKr || 0,
        dato: new Date().toISOString(),
        kilde: "Vipps (automatisk)",
        reference,
      });
      await db.collection("financeLog").add({
        summary: `Vipps-betaling mottatt: ${paidAmountKr || "?"} kr for ${student.navn || "elev"} (automatisk)`,
        changedAt: new Date().toISOString(),
        changedBy: "Vipps-betaling (automatisk)",
      });
      // Fjerner/markerer det tilhørende "utestående forespørsel"-oppføringen
      // slik at Kasserer (Ledelse) ikke lenger tilbyr å avbryte noe som
      // faktisk allerede er betalt.
      const pendingSnap = await db.collection("pendingVippsPayments").where("reference", "==", reference).limit(1).get();
      if (!pendingSnap.empty) {
        await pendingSnap.docs[0].ref.update({ status: "completed", completedAt: new Date().toISOString() });
      }
      logger.info(`Elev ${student.navn} — Vipps-betaling på ${paidAmountKr} kr registrert.`);
      res.status(200).send("OK");
      return;
    }

    if (paymentType !== "registration") {
      logger.warn("Ukjent betalingstype i Vipps-referanse", reference);
      res.status(200).send("OK (ukjent type)");
      return;
    }

    // ---- Betaling på en NY søknad (depositum) — oppretter elev+foresatt ----
    const regDoc = db.collection("registrations").doc(targetId);
    const regSnap = await regDoc.get();
    if (!regSnap.exists) {
      logger.warn("Fant ingen søknad for Vipps-referanse", reference);
      res.status(200).send("OK (ukjent referanse)");
      return;
    }
    const reg = regSnap.data();

    // ---- Manuell-først-flyt: søknaden er allerede godkjent, krediter depositum ----
    if (reg.status === "Godkjent") {
      const oppsett = await hentPrisoppsett();
      const paidAmount = paidAmountKr || oppsett.depositum || 500;
      const studentSnap = await db.collection("students")
        .where("fraSoknadId", "==", targetId).limit(1).get();
      if (studentSnap.empty) {
        logger.warn("Godkjent søknad uten tilknyttet elev for Vipps-depositum", targetId);
        res.status(200).send("OK (ingen elev)");
        return;
      }
      const studentRef = studentSnap.docs[0].ref;
      const student = studentSnap.docs[0].data();
      const prevPaid = parseFloat(String(student.belopBetalt || "0").replace(/[^\d.-]/g, "")) || 0;
      const total = parseFloat(String(student.belop || "0").replace(/[^\d.-]/g, "")) || 0;
      const newPaid = prevPaid + paidAmount;
      const klasseFraSoknad = reg.klasseValg || "";
      const elevOppdatering = {
        belopBetalt: String(newPaid),
        betalt: newPaid >= total ? "Ja" : (newPaid > 0 ? "Delvis" : "Nei"),
        depositumBetalt: "Ja",
        betalingsdato: new Date().toISOString().slice(0, 10),
        sistEndretAv: "vipps-webhook",
        sistEndretDato: new Date().toISOString().slice(0, 10),
      };
      // Klassevalg kan være lagret på søknaden før betaling — bruk det
      // hvis eleven fortsatt står uten klasse etter manuell godkjenning.
      if (klasseFraSoknad && !student.klasse) {
        elevOppdatering.klasse = klasseFraSoknad;
      }

      await studentRef.update(elevOppdatering);

      await db.collection("studentPayments").add({
        studentId: studentRef.id,
        belop: paidAmount,
        dato: new Date().toISOString(),
        kilde: "Vipps — depositum",
        reference,
      });

      let pendingRef = null;
      try {
        const pendSnap = await db.collection("pendingVippsPayments")
          .where("reference", "==", reference).limit(1).get();
        if (!pendSnap.empty) pendingRef = pendSnap.docs[0].ref;
      } catch (e) {
        logger.warn("Fant ikke pending Vipps-krav for depositum", e);
      }

      await regDoc.update({
        depositumBetalt: "Ja",
        vippsStatus: "AUTHORIZED",
        vippsBetaltDato: new Date().toISOString(),
      });

      if (pendingRef) {
        try {
          await pendingRef.update({ status: "completed", completedAt: new Date().toISOString() });
        } catch (e) {
          logger.error("Kunne ikke merke Vipps-kravet som betalt", e);
        }
      }

      logger.info(`Depositum registrert for ${reg.elev_navn} (manuell-først-flyt).`);
      res.status(200).send("OK");
      return;
    }

    // ---- Legacy: betaling på NY søknad — oppretter elev+foresatt (gammel flyt) ----
    let guardianId = "";
    const guardianName = reg.foresatt1_navn || "";
    const guardianPhone = reg.foresatt1_tlf || "";
    const guardianEmail = reg.foresatt1_epost || "";
    if (guardianName) {
      const existing = guardianPhone
        ? await db.collection("guardians").where("telefon", "==", guardianPhone).limit(1).get()
        : await db.collection("guardians").where("navn", "==", guardianName).limit(1).get();
      if (!existing.empty) {
        guardianId = existing.docs[0].id;
      } else {
        const newGuardian = await db.collection("guardians").add({
          navn: guardianName,
          relasjon: reg.foresatt1_relasjon === "Annen" ? (reg.foresatt1_relasjon_annet || "Annen") : (reg.foresatt1_relasjon || ""),
          telefon: guardianPhone,
          epost: guardianEmail,
          sistEndretAv: "vipps-webhook",
          sistEndretDato: new Date().toISOString().slice(0, 10),
        });
        guardianId = newGuardian.id;

        // Gir foresatte en ekte portal-konto med det samme, og sender dem
        // en e-post for å sette sitt eget passord — akkurat som når en
        // administrator godkjenner manuelt.
        if (guardianEmail) {
          try {
            const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + "Aa1!";
            await admin.auth().createUser({ email: guardianEmail, password: tempPassword });
            const resetLink = await admin.auth().generatePasswordResetLink(guardianEmail);
            await db.collection("mail").add({
              from: "Madina Skole <post@madinaskole.no>",
              to: [guardianEmail],
              message: {
                subject: "[Madina Skole] Velkommen — sett ditt passord (" + (reg.elev_navn || "eleven") + ")",
                text:
                  `Hei ${guardianName},\n\nBetalingen din er mottatt og ${reg.elev_navn || "eleven"} har fått plass på Madina Skole!\n\n` +
                  `Trykk her for å sette ditt passord til Foreldreportalen:\n${resetLink}\n\nMed vennlig hilsen,\nMadina Skole`,
              },
            });
          } catch (authErr) {
            // Hvis kontoen allerede finnes (f.eks. en tidligere ansatt/lærer
            // med samme e-post), er ikke dette en feil vi trenger å stoppe for.
            logger.warn("Kunne ikke opprette portal-konto automatisk", authErr.message);
          }
        }
      }
    }

    // ---- Oppretter eleven ----
    // Regner ut riktig program, språkvalg og avgift (inkl. søskenrabatt)
    // fra søknadens svar — akkurat som admin-panelets "Godkjenn"-knapp
    // gjør ved manuell godkjenning. Uten dette ble "belop" (totalbeløpet
    // eleven skylder) stående tomt når en elev ble opprettet automatisk
    // via Vipps-betaling, fordi denne utregningen tidligere kun fantes
    // i admin-panelets kode og ikke her i webhooken.
    const mappedProgram = mapRegistrationProgram(reg.program);
    const mappedSprakvalg = mapRegistrationSprakvalg(reg);
    // Medlemsstatus følger med fra søknaden. Mangler den, regnes eleven
    // som IKKE medlem — det gir høyeste pris, og et for høyt beløp blir
    // oppdaget og rettet. Et for lavt blir ikke det.
    const { price: discountedPrice, pos: soskenPos } =
      await computeSoskenPrice(mappedProgram, guardianId, null, reg.erMedlem);

    const studentRecord = { ...reg };
    delete studentRecord.status;
    delete studentRecord.innsendtDato;
    delete studentRecord.behandletAv;
    delete studentRecord.vippsReference;
    delete studentRecord.vippsStatus;
    delete studentRecord.vippsCreatedAt;
    studentRecord.navn = reg.elev_navn || "";
    studentRecord.program = mappedProgram;
    studentRecord.sprakvalg = mappedSprakvalg;
    studentRecord.klasse = "";
    studentRecord.foresatt = guardianId;
    studentRecord.betalt = (paidAmountKr || 500) >= discountedPrice ? "Ja" : "Delvis";
    studentRecord.belop = String(discountedPrice);
    studentRecord.belopBetalt = String(paidAmountKr || 500);
    studentRecord.soskenrekkefolge = String(soskenPos);
    studentRecord.betalingsdato = new Date().toISOString().slice(0, 10);
    studentRecord.sistEndretAv = "vipps-webhook";
    studentRecord.fraSoknadId = regDoc.id;
    studentRecord.sistEndretDato = new Date().toISOString().slice(0, 10);

    const newStudentRef = await db.collection("students").add(studentRecord);
    await db.collection("studentPayments").add({
      studentId: newStudentRef.id,
      belop: paidAmountKr || 500,
      dato: new Date().toISOString(),
      kilde: "Vipps (automatisk) — depositum",
      reference,
    });

    // ---- Oppdaterer søknaden ----
    //
    // Vi henter fram hvem som sendte betalingskravet, og fører den personen
    // som behandler. Selve godkjenningen er automatisk, men beslutningen om
    // å be om betaling var det et menneske som tok — og det er den som skal
    // stå i sporingen.
    let sendtAv = "";
    let pendingRef = null;
    try {
      const pendSnap = await db.collection("pendingVippsPayments")
        .where("reference", "==", reference).limit(1).get();
      if (!pendSnap.empty) {
        sendtAv = pendSnap.docs[0].data().createdBy || "";
        // Referansen tas vare på. Oppslaget skjedde allerede her for å
        // finne avsenderen — uten dette måtte vi slått opp samme dokument
        // en gang til lenger nede.
        pendingRef = pendSnap.docs[0].ref;
      }
    } catch (e) {
      logger.warn("Fant ikke avsender av Vipps-kravet", e);
    }

    await regDoc.update({
      status: "Godkjent",
      behandletAv: sendtAv
        ? sendtAv + " (via Vipps-betaling)"
        : "Vipps-betaling (automatisk)",
      behandletDato: new Date().toISOString().slice(0, 16).replace("T", " "),
      vippsStatus: "AUTHORIZED",
      vippsBetaltDato: new Date().toISOString(),
    });

    // Merker det utestående kravet som betalt.
    //
    // DETTE MANGLET: betalingsgrenen for EKSISTERENDE elever gjorde det,
    // men grenen for NYE påmeldinger gjorde det ikke. Følgen var at en
    // søknad kunne stå som «Godkjent», eleven være opprettet og pengene
    // være mottatt — mens panelet fortsatt sa «venter på betaling», og
    // Kasserer (Ledelse) tilbød å avbryte et krav som alt var gjort opp.
    if (pendingRef) {
      try {
        await pendingRef.update({
          status: "completed",
          completedAt: new Date().toISOString(),
        });
      } catch (e) {
        logger.error("Kunne ikke merke Vipps-kravet som betalt", e);
      }
    } else {
      logger.warn(`Fant ingen utestående Vipps-forespørsel for ${reference} — ` +
        "kravet kan bli stående som «venter på betaling» i panelet.");
    }

    logger.info(`Elev ${reg.elev_navn} automatisk godkjent via Vipps-betaling.`);
    res.status(200).send("OK");
  } catch (err) {
    logger.error("vippsWebhook error", err);
    // Vi returnerer likevel 200 til Vipps for å unngå at de gjentar samme
    // hendelse i det uendelige — feilen er logget over for oppfølging.
    res.status(200).send("OK (med intern feil, se logger)");
  }
});

// =======================================================================
// getVippsPaymentInfo — KUN for Kasserer (Ledelse): henter capturert/
// refundert beløp fra Vipps slik refusjonsdialogen viser riktig maks.
//    POST { reference }
// =======================================================================
exports.getVippsPaymentInfo = onRequest(
  { secrets: [VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY], cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }

    const bruker = await krevInnlogget(req, res);
    if (!bruker) return;
    if (!(await krevKassererLedelse(bruker, res))) return;

    try {
      const { reference } = req.body || {};
      if (!reference) {
        res.status(400).json({ ok: false, error: "Mangler reference." });
        return;
      }
      const accessToken = await getVippsAccessToken();
      const payment = await fetchVippsPayment(reference, accessToken);
      const agg = vippsAggregateOre(payment);
      res.status(200).json({
        ok: true,
        state: payment.state || null,
        authorizedKr: agg.authorized / 100,
        capturedKr: agg.captured / 100,
        refundedKr: agg.refunded / 100,
        refundableKr: vippsRefundableOre(agg) / 100,
        captureableKr: vippsCaptureableOre(agg) / 100,
      });
    } catch (err) {
      logger.error("getVippsPaymentInfo error", err);
      res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }
);

// =======================================================================
// cancelVippsPayment — KUN for Kasserer (Ledelse): avbryter et sendt
// Vipps-krav FØR foresatte har betalt det (mens det fortsatt er "CREATED"
// hos Vipps — Vipps avviser forespørselen med en feil hvis det allerede
// er betalt). En allerede betalt innbetaling må heller refunderes — se
// refundVippsPayment under.
//    POST { reference }
// =======================================================================
exports.cancelVippsPayment = onRequest(
  { secrets: [VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY], cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }

    const bruker = await krevInnlogget(req, res);
    if (!bruker) return;
    if (!(await krevKassererLedelse(bruker, res))) return;

    try {
      const { reference } = req.body || {};
      if (!reference) {
        res.status(400).json({ ok: false, error: "Mangler reference." });
        return;
      }
      const accessToken = await getVippsAccessToken();
      const cancelRes = await fetch(`${vippsApiBase()}/epayment/v1/payments/${encodeURIComponent(reference)}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY.value(),
          "Merchant-Serial-Number": VIPPS_MSN.value(),
          "Content-Type": "application/json",
          "Idempotency-Key": vippsIdempotencyKey("cn", reference),
          "Vipps-System-Name": "madina-skole",
          "Vipps-System-Version": "1.0.0",
        },
      });
      if (!cancelRes.ok) {
        const body = await cancelRes.text();
        logger.error("Vipps cancel failed", body);
        const invalidState = parseVippsInvalidState(body);
        const terminalStatus = invalidState ? vippsTerminalPendingStatus(invalidState) : null;
        if (terminalStatus) {
          await closePendingVippsByReference(reference, terminalStatus, { vippsState: invalidState });
          res.status(200).json({
            ok: true,
            cleanedUp: true,
            vippsState: invalidState,
            message: vippsCleanupMessage(invalidState),
          });
          return;
        }
        res.status(502).json({ ok: false, error: "Vipps avviste avbrytelsen: " + formatVippsApiError(body) });
        return;
      }
      await closePendingVippsByReference(reference, "cancelled", { vippsState: "CANCELLED" });
      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("cancelVippsPayment error", err);
      res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }
);

// =======================================================================
// refundVippsPayment — KUN for Kasserer (Ledelse): refunderer en ALLEREDE
// betalt Vipps-innbetaling helt eller delvis til foresatte, og trekker
// beløpet fra elevens belopBetalt igjen siden pengene nå går tilbake.
//    POST { reference, studentId, amountKr }
// =======================================================================
exports.refundVippsPayment = onRequest(
  { secrets: [VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY], cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }

    const bruker = await krevInnlogget(req, res);
    if (!bruker) return;
    if (!(await krevKassererLedelse(bruker, res))) return;

    try {
      const { reference, studentId, amountKr } = req.body || {};
      if (!reference || !studentId || !amountKr) {
        res.status(400).json({ ok: false, error: "Mangler reference, studentId eller amountKr." });
        return;
      }
      const accessToken = await getVippsAccessToken();
      const amountOre = Math.round(Number(amountKr) * 100);
      try {
        await ensureVippsRefundable(reference, amountOre, accessToken);
      } catch (prepErr) {
        res.status(400).json({ ok: false, error: String(prepErr.message || prepErr) });
        return;
      }

      const refundRes = await fetch(`${vippsApiBase()}/epayment/v1/payments/${encodeURIComponent(reference)}/refund`, {
        method: "POST",
        headers: vippsJsonHeaders(accessToken, vippsIdempotencyKey("rf", reference, amountKr, Date.now())),
        body: JSON.stringify({
          modificationAmount: { currency: "NOK", value: amountOre },
        }),
      });
      if (!refundRes.ok) {
        const body = await refundRes.text();
        logger.error("Vipps refund failed", body);
        res.status(502).json({ ok: false, error: "Vipps avviste refusjonen: " + formatVippsApiError(body) });
        return;
      }

      const studentRef = db.collection("students").doc(studentId);
      const studentSnap = await studentRef.get();
      if (studentSnap.exists) {
        const student = studentSnap.data();
        const currentPaid = Number(student.belopBetalt || 0);
        const newPaid = Math.max(0, currentPaid - Number(amountKr));
        await studentRef.update({
          belopBetalt: String(newPaid),
          betalt: newPaid >= Number(student.belop || 0) ? "Ja" : (newPaid > 0 ? "Delvis" : "Nei"),
        });
        await db.collection("studentPayments").add({
          studentId,
          belop: -Number(amountKr),
          dato: new Date().toISOString(),
          kilde: "Vipps-refusjon (Ledelse)",
          reference,
        });
        await db.collection("financeLog").add({
          summary: `Vipps-refusjon: ${amountKr} kr tilbakebetalt for ${student.navn || "elev"}`,
          changedAt: new Date().toISOString(),
          changedBy: "Kasserer (Ledelse)",
        });
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("refundVippsPayment error", err);
      res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }
);


/* ══════════════════════════════════════════════════════════════════
 * UKENTLIG SIKKERHETSKOPI
 * ══════════════════════════════════════════════════════════════════
 *
 * Kjører automatisk hver søndag kl. 04:00 norsk tid:
 *   1) leser alle samlinger i Firestore
 *   2) skriver alt til én JSON-fil i prosjektets Storage-bøtte
 *   3) sender en e-post med filnavn og et sammendrag
 *   4) sletter kopier eldre enn 60 dager
 *
 * Hvorfor verken vedlegg eller lenke:
 *
 * Vedlegg: en e-postleverandør kutter vedlegg over ~10 MB. I dag er filen
 * bittesmå, men om noen år — med flere hundre elever, meldinger og notater
 * — ville vedlegget stille feilet uten at noen merket det.
 *
 * Lenke: en signert nedlastingslenke virker for ALLE som får tak i den,
 * uten innlogging. Filen inneholder personopplysninger om barn og
 * foresatte, så en videresendt e-post ville vært en lekkasje. Uten lenke
 * må man logge inn i Firebase Console — med totrinnsbekreftelse — for å
 * komme til filen. E-posten forteller bare hvor den ligger.
 *
 * MERK: dette erstatter ikke Firestore sin egen backup-funksjon i
 * konsollet. Denne kopien havner utenfor databasen (og kan lastes ned til
 * egen maskin), mens Firestore-backup beskytter mot feilsletting internt.
 * De to dekker hver sin risiko — behold begge.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
// Samlingene som sikkerhetskopieres. Nye samlinger må legges til her —
// ellers er de ikke med i kopien, uten at noe varsler om det.
const BACKUP_COLLECTIONS = [
  "students", "guardians", "teachers", "adminUsers", "ledelse", "classes",
  "programs", "schoolCalendar", "registrations",
  "attendance", "lessonPlans", "homework", "homeworkSubmissions",
  "absenceRequests", "studentNotes", "practiceVideos",
  "dailyPlanTemplates", "monthlyPlanTemplates", "semesterPlanTemplates",
  "monthlyPlans", "semesterPlans", "hours",
  "messages", "messageThreads", "broadcastThreads", "broadcastMessages",
  "classPosts", "classPostComments", "classPollVotes", "eventRSVPs",
  "announcements", "contactUpdateRequests",
  "finances", "financeLog", "paymentRequests", "studentPayments",
  "pendingVippsPayments", "salaryPayments", "teacherAttendance",
  "meetings", "settings", "deletionLog", "loginEvents",
  "stotteSoknader", "kafalaFond", "fagplan", "arsplan",
  "mail", "feillogg", "formAnalytics",
  // Tilgangsindeksene. Uten dem i kopien ville en gjenoppretting gitt
  // tilbake elevene, men ikke koblingen som lar foreldrene se dem —
  // og portalene ville stått tomme uten at noe så ødelagt ut.
  "roller", "tilgang", "foreldreTilgang", "laererTilgang", "endringslogg"
];

const BACKUP_EMAIL = "post@madinaskole.no";
const KEEP_DAYS = 60;

async function lagSikkerhetskopi() {
  const dump = {};
  const summary = [];
  let totalDocs = 0;

  for (const name of BACKUP_COLLECTIONS) {
    try {
      const snap = await db.collection(name).get();
      dump[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      totalDocs += snap.size;
      if (snap.size > 0) summary.push(`${name}: ${snap.size}`);
    } catch (err) {
      // En samling som feiler skal ikke stoppe hele kopien — vi noterer
      // feilen i filen og fortsetter, slik at resten blir sikret.
      logger.error(`Backup: klarte ikke lese ${name}`, err);
      dump[name] = { __error: String(err && err.message) };
      summary.push(`${name}: FEIL`);
    }
  }

  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filnavn = `backups/madina-backup-${stamp}.json`;

  const payload = {
    generert: now.toISOString(),
    prosjekt: "madina-instituttet",
    antallSamlinger: BACKUP_COLLECTIONS.length,
    antallDokumenter: totalDocs,
    data: dump
  };

  const bucket = admin.storage().bucket();
  const file = bucket.file(filnavn);
  await file.save(JSON.stringify(payload, null, 2), {
    contentType: "application/json",
    metadata: { cacheControl: "no-store" }
  });

  const sizeMb = (Buffer.byteLength(JSON.stringify(payload)) / 1048576).toFixed(2);

  await db.collection("mail").add({
    from: "Madina Skole <post@madinaskole.no>",
    to: [BACKUP_EMAIL],
    message: {
      subject: `Ukentlig sikkerhetskopi — ${now.toLocaleDateString("no-NO")} (${totalDocs} dokumenter)`,
      html: `
        <p>Sikkerhetskopien av databasen er tatt.</p>
        <p><b>${totalDocs}</b> dokumenter · <b>${sizeMb} MB</b></p>
        <p><b>Filnavn:</b><br><code>${filnavn}</code></p>
        <p>Slik laster du den ned:<br>
        Firebase Console → Storage → mappen <code>backups/</code> → velg filen over.</p>
        <p><small>Denne e-posten inneholder bevisst ingen nedlastingslenke.
        Filen har personopplysninger om barn og foresatte, og en lenke ville
        virket for alle som fikk tak i den — uten innlogging. Nå kreves det
        pålogging med totrinnsbekreftelse for å komme til filen.</small></p>
        <hr>
        <p><small>${summary.join(" · ")}</small></p>
        <p><small>Kopier eldre enn ${KEEP_DAYS} dager slettes automatisk.</small></p>`
    }
  });

  // Rydd bort gamle kopier.
  try {
    const [files] = await bucket.getFiles({ prefix: "backups/" });
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    for (const f of files) {
      const created = new Date(f.metadata.timeCreated).getTime();
      if (created < cutoff) await f.delete();
    }
  } catch (err) {
    logger.error("Backup: opprydding feilet", err);
  }

  logger.info(`Backup ferdig: ${totalDocs} dokumenter, ${sizeMb} MB`);
  return { totalDocs, sizeMb, filnavn };
}

/**
 * Rydder endringsloggen. Rader eldre enn 14 dager slettes.
 *
 * Kjører sammen med den ukentlige sikkerhetskopien i stedet for hver dag:
 * en daglig jobb ville gjort samme arbeid syv ganger for å slette de
 * samme radene noen dager tidligere. Loggen leses uansett med et
 * tidsfilter, så gamle rader vises ikke selv om de står noen dager over.
 */
const ENDRINGSLOGG_DAGER = 14;

async function ryddEndringslogg() {
  const cutoff = new Date(Date.now() - ENDRINGSLOGG_DAGER * 24 * 60 * 60 * 1000)
    .toISOString();
  try {
    const snap = await db.collection("endringslogg")
      .where("tid", "<", cutoff).limit(500).get();
    if (snap.empty) return;
    // Batch: 500 slettinger i én operasjon i stedet for 500 kall.
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    logger.info(`Endringslogg: slettet ${snap.size} rader eldre enn ${ENDRINGSLOGG_DAGER} dager`);
  } catch (err) {
    logger.error("Kunne ikke rydde endringsloggen", err);
  }
}

exports.ukentligSikkerhetskopi = onSchedule(
  {
    schedule: "0 4 * * 0",
    timeZone: "Europe/Oslo",
    timeoutSeconds: 540,
    memory: "512MiB"
  },
  async () => {
    await lagSikkerhetskopi();
    await ryddEndringslogg();
    // Puls: skriver ned at kjøringen faktisk skjedde. Uten dette finnes
    // det ingen måte å se at sikkerhetskopien har uteblitt — en jobb som
    // ikke kjører sier ingenting, den bare lar være.
    await db.collection("settings").doc("helse").set(
      { sikkerhetskopiSiste: new Date().toISOString() },
      { merge: true }
    ).catch((err) => logger.warn("Kunne ikke skrive puls for sikkerhetskopi", err));
  }
);

// Manuell kjøring — nyttig for å teste uten å vente til søndag, og for å
// ta en ekstra kopi før noe stort skal endres.
exports.taSikkerhetskopiNa = onRequest(
  { timeoutSeconds: 540, memory: "512MiB", cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    const bruker = await krevInnlogget(req, res);
    if (!bruker) return;
    if (!(await krevAdminPanel(bruker, res))) return;
    try {
      const result = await lagSikkerhetskopi();
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error("Manuell sikkerhetskopi feilet", err);
      res.status(500).json({ ok: false, error: String(err && err.message) });
    }
  }
);


// =====================================================================
// VARSEL VED NY PÅMELDING
// ---------------------------------------------------------------------
// Denne var først skrevet som en Firestore-utløser (onDocumentCreated).
// Den lot seg ikke publisere:
//
//   Location europe-north2 is not found or access is unauthorized
//   failed to create function .../europe-north2/functions/varsleNySoknad
//
// Databasen ligger i europe-north2, og en Firestore-utløser MÅ opprettes
// i samme region som databasen. Den regionen støtter foreløpig ikke
// Cloud Functions, og databasens region kan ikke endres etterpå.
// Derfor er ikke Firestore-utløsere et alternativ i dette prosjektet
// i det hele tatt — uansett hvordan de skrives.
//
// Løsningen er en planlagt kjøring i stedet, samme mønster som
// ukentligSikkerhetskopi, som publiseres uten problemer. Den ser etter
// søknader som ennå ikke er varslet om, og merker dem etterpå.
//
// Prisen er at varselet kan komme opptil to minutter etter innsendingen.
// For en påmelding som uansett behandles manuelt, spiller det ingen rolle.
// =====================================================================

// Gjør en rå programkode fra skjemaet lesbar. Uten dette sto det
// «madina_islamske_skole, sprak_arabisk» i varselet — forståelig for den
// som skrev koden, ikke for den som skal behandle søknaden.
function lesbartProgram(rå) {
  const koder = String(rå || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (koder.length === 0) return "—";
  const kanonisk = mapRegistrationProgram(rå);
  const spraak = koder.includes("sprak_urdu") ? "Urdu"
    : koder.includes("sprak_arabisk") ? "Arabisk" : "";
  if (!kanonisk) return koder.join(", ");
  return kanonisk + (spraak ? ` · språkvalg: ${spraak}` : "");
}

function feltrad(etikett, verdi) {
  return `<tr><th style="text-align:left;padding:5px 12px 5px 0;color:#5a6860;font-weight:600;">${etikett}</th>` +
         `<td style="padding:5px 0;">${verdi || "—"}</td></tr>`;
}

async function sendVarslerForSoknad(reg, id, oppsett) {
  const navn = reg.elev_navn || "Ukjent navn";

  // ---- Til administrasjonen ----
  if (oppsett.nySoknadAktiv !== false) {
    let mottakere = Array.isArray(oppsett.nySoknadMottakere) ? oppsett.nySoknadMottakere : [];
    // Er ingen valgt, går varselet til skolens hovedadresse i stedet for
    // å forsvinne i stillhet. En søknad ingen får beskjed om er verre
    // enn en e-post for mye.
    if (mottakere.length === 0) mottakere = [BACKUP_EMAIL];
    await db.collection("mail").add({
      from: "Madina Skole <post@madinaskole.no>",
      to: mottakere,
      message: {
        subject: `Ny påmelding — ${navn}`,
        html: `
          <p>Det har kommet en ny påmelding.</p>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
            ${feltrad("Elev", navn)}
            ${feltrad("Fødselsdato", reg.elev_fdato)}
            ${feltrad("Program", lesbartProgram(reg.program))}
            ${feltrad("Foresatt", reg.foresatt1_navn)}
            ${feltrad("Telefon", reg.foresatt1_tlf)}
            ${feltrad("E-post", reg.foresatt1_epost)}
            ${feltrad("Innsendt", reg.innsendtDato)}
          </table>
          <p style="margin-top:18px;">
            Behandles under <b>Registrering → Søknader</b>:<br>
            <a href="https://madinaskole.no/admin.html#fane=registrations">Åpne søknaden</a>
          </p>
          <p style="color:#8a9a90;font-size:12px;margin-top:22px;">
            Du får denne e-posten fordi du står som mottaker under
            «Oversikt → Varslinger» i panelet.
          </p>`
      }
    });
    logger.info(`Varsel sendt til ${mottakere.length} mottaker(e) for søknad ${id}.`);
  }

  // ---- Kvittering til foresatte ----
  if (oppsett.kvitteringAktiv === false) return;

  // Begge foresatte får kvittering hvis begge har oppgitt e-post — men
  // samme adresse skrevet inn to ganger skal ikke gi to e-poster.
  const adresser = [...new Set(
    [reg.foresatt1_epost, reg.foresatt2_epost]
      .map((e) => String(e || "").trim())
      .filter((e) => e.includes("@"))
      .map((e) => e.toLowerCase())
  )];
  if (adresser.length === 0) {
    logger.info(`Ingen e-post oppgitt av foresatte for søknad ${id}.`);
    return;
  }

  await db.collection("mail").add({
    from: "Madina Skole <post@madinaskole.no>",
    to: adresser,
    message: {
      subject: `Vi har mottatt påmeldingen for ${navn}`,
      html: `
        <p>Hei ${reg.foresatt1_navn || ""},</p>
        <p>Vi har mottatt påmeldingen for <b>${navn}</b>. Takk for at du sendte den inn.</p>
        <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin:14px 0;">
          ${feltrad("Elev", navn)}
          ${feltrad("Program", lesbartProgram(reg.program))}
          ${feltrad("Mottatt", reg.innsendtDato)}
        </table>
        <p>Administrasjonen går gjennom opplysningene og tar kontakt med deg
        om opptak. Du trenger ikke gjøre noe mer nå.</p>
        <p>Har du spørsmål i mellomtiden, svar gjerne på denne e-posten.</p>
        <p style="margin-top:22px;">Med vennlig hilsen,<br><b>Madina Skole</b></p>
        <p style="color:#8a9a90;font-size:12px;margin-top:22px;">
          Dette er en automatisk bekreftelse på at påmeldingen er registrert.
          Den er ikke et vedtak om skoleplass.
        </p>`
    }
  });
  logger.info(`Kvittering sendt til ${adresser.length} adresse(r) for søknad ${id}.`);
}

exports.varsleNySoknad = onSchedule(
  { schedule: "every 2 minutes", timeZone: "Europe/Oslo" },
  async () => {
    let feilet = 0;
    // Pulsen skrives ved HVER kjøring, også når det ikke er noe å varsle
    // om. Da forteller den at jobben lever — ikke bare at den hadde noe
    // å gjøre.
    await db.collection("settings").doc("helse")
      .set({ varselSisteKjoring: new Date().toISOString() }, { merge: true })
      .catch((err) => logger.warn("Kunne ikke skrive puls", err));

    // Helsesjekken går uansett hva som skjer under — den skal ikke være
    // avhengig av at det finnes nye søknader den dagen.
    await kjorHelsesjekk().catch((err) => logger.error("Helsesjekk feilet", err));

    let oppsett = {};
    try {
      const doc = await db.collection("settings").doc("varsler").get();
      oppsett = doc.exists ? (doc.data() || {}) : {};
    } catch (err) {
      logger.warn("Kunne ikke lese settings/varsler — bruker standardverdier", err);
    }

    // 🔴 KOSTNAD: her lå den dyreste linjen i hele systemet. Den leste
    // ALLE søknadene hvert andre minutt for å lete etter én ny — 720
    // ganger i døgnet. Med 50 søknader i basen ble det 36 000 lesinger
    // per dag, altså 79 % av gratiskvoten, og tallet vokste for hver
    // eneste nye søknad. Ingenting sa fra; regningen kommer fra Google
    // en gang i måneden.
    //
    // Nå spørres det etter de umerkede i stedet. Er det ingen nye, leses
    // ingenting — uansett hvor mange søknader som finnes.
    //
    // ⚠️ Feltet må være FALSE, ikke fravær: Firestore kan ikke spørre
    // etter «mangler felt». Derfor merkes hver ny søknad ved opprettelse,
    // og gamle uten feltet fanges av opprydningen under.
    const snap = await db.collection("registrations")
      .where("varselSendt", "==", false).limit(50).get();
    const uvarslede = snap.docs;
    if (uvarslede.length === 0) {
      // Ingenting står igjen — da er en eventuell tidligere feil over.
      // Uten dette ville merket blitt hengende, og helsesjekken hadde
      // fortsatt å varsle om noe som for lengst var i orden.
      await db.collection("settings").doc("helse")
        .set({ varselFastSiden: null }, { merge: true })
        .catch(() => {});
      return;
    }

    // FØRSTE KJØRING: alle søknader som allerede lå der fra før merkes
    // som håndtert UTEN at det sendes noe. Uten dette ville første
    // kjøring sendt e-post om hver eneste gamle søknad i basen.
    if (oppsett.varselInitiert !== true) {
      // Første kjøring: hent ALLE (én gang), merk dem, og la det være.
      const alle = await db.collection("registrations").get();
      const batch = db.batch();
      alle.docs.forEach((d) => batch.update(d.ref, { varselSendt: true }));
      await batch.commit();
      await db.collection("settings").doc("varsler").set(
        { varselInitiert: true, varselInitiertDato: new Date().toISOString() },
        { merge: true }
      );
      logger.info("Første kjøring: alle eksisterende søknader merket uten utsending.");
      return;
    }

    for (const d of uvarslede) {
      try {
        await sendVarslerForSoknad(d.data(), d.id, oppsett);
        // Merkes FØRST etter at e-posten er lagt i kø. Feiler utsendingen,
        // står søknaden fortsatt umerket og forsøkes igjen om to minutter
        // — heller ett varsel for mye enn ett som forsvant.
        await d.ref.update({ varselSendt: true, varselSendtDato: new Date().toISOString() });
      } catch (err) {
        logger.error(`Varsling feilet for søknad ${d.id} — prøves igjen`, err);
        feilet++;
      }
    }

    // Setter et merke første gang noe blir stående. Blir merket hengende
    // i mer enn et kvarter, sier helsesjekken fra. Går alt gjennom,
    // fjernes det igjen — ellers ville en enkelt gammel feil utløst
    // varsler i det uendelige.
    try {
      const helseRef = db.collection("settings").doc("helse");
      if (feilet > 0) {
        const doc = await helseRef.get();
        if (!doc.exists || !doc.data().varselFastSiden) {
          await helseRef.set({ varselFastSiden: new Date().toISOString() }, { merge: true });
        }
      } else {
        await helseRef.set({ varselFastSiden: null }, { merge: true });
      }
    } catch (err) {
      logger.warn("Kunne ikke oppdatere feilmerke", err);
    }
  }
);

// =====================================================================
// HELSESJEKK — får feilene til å si fra selv
// ---------------------------------------------------------------------
// Alle feilene som ble rettet 8. august hadde én ting til felles: de sa
// ingenting. App Check sto på 0 % i fire døgn, stemplene var slått ut i
// et døgn, og publiseringen av funksjonene feilet mens GitHub viste
// grønt hele veien. Systemet virket — bare uten det man trodde det
// hadde.
//
// Denne delen snur på det. Den ser etter tegn på at noe har stanset, og
// sender én e-post når den finner noe. Den venter ikke på at noen skal
// komme og se etter.
//
// TRE TING SJEKKES:
//   1. Uteblitt sikkerhetskopi  — pulsen er eldre enn 8 døgn
//   2. E-post som ikke gikk ut  — dokumenter i 'mail' med delivery ERROR
//   3. Varsler som står fast    — søknader som ikke ble merket
//
// STØYKONTROLL: varsles høyst én gang i døgnet, og bare når noe FAKTISK
// er galt. Et varsel som kommer hver dag uansett blir ignorert etter en
// uke, og da er vi like blinde som før.
// =====================================================================
// Hver andre time, ikke hver halvtime. Sjekken leser flere samlinger,
// og en feil som oppdages 90 minutter senere er like nyttig — varselet
// sendes uansett høyst én gang i døgnet.
const HELSE_SJEKK_INTERVALL_MS = 2 * 60 * 60 * 1000;
const HELSE_VARSEL_PAUSE_MS = 24 * 60 * 60 * 1000; // maks ett varsel i døgnet
const BACKUP_MAKS_ALDER_MS = 8 * 24 * 60 * 60 * 1000;
const VARSEL_FAST_GRENSE_MS = 15 * 60 * 1000;
// Vinduet for e-postfeil er en uke, ikke et døgn. Er man borte noen dager,
// skal ikke feilen ha rukket å bli «gammel» og forsvinne fra varselet før
// man er tilbake. Grensen finnes bare for at en feil som er rettet for
// lenge siden ikke skal utløse varsel i all framtid.
const HELSE_MAIL_VINDU_MS = 7 * 24 * 60 * 60 * 1000;

// Date.parse(0) leser "0" som årstallet 2000 og gir et GYLDIG tidspunkt.
// Skriver man `Date.parse(felt || 0) || 0`, blir et manglende felt derfor
// til år 2000 i stedet for null — og alt fremstår som håpløst gammelt.
// Første kjøring ville da meldt at sikkerhetskopien var 9000 døgn gammel.
function tidspunkt(verdi) {
  if (!verdi) return 0;
  const t = Date.parse(verdi);
  return isNaN(t) ? 0 : t;
}

async function kjorHelsesjekk() {
  const helseRef = db.collection("settings").doc("helse");
  let helse = {};
  try {
    const doc = await helseRef.get();
    helse = doc.exists ? (doc.data() || {}) : {};
  } catch (err) {
    logger.warn("Kunne ikke lese settings/helse", err);
    return;
  }

  const nå = Date.now();
  const sisteSjekk = tidspunkt(helse.sisteSjekk);
  if (nå - sisteSjekk < HELSE_SJEKK_INTERVALL_MS) return;

  const funn = [];

  // 1) Sikkerhetskopi
  const sisteKopi = tidspunkt(helse.sikkerhetskopiSiste);
  if (sisteKopi === 0) {
    funn.push("Ingen sikkerhetskopi er registrert ennå. Første kjøring skjer søndag 04:00 — " +
      "kommer det ingenting da, har den planlagte jobben stanset.");
  } else if (nå - sisteKopi > BACKUP_MAKS_ALDER_MS) {
    const dager = Math.floor((nå - sisteKopi) / 86400000);
    funn.push(`Sikkerhetskopien har ikke kjørt på ${dager} døgn. Siste: ` +
      new Date(sisteKopi).toLocaleString("no-NO") + ". Den skal kjøre hver søndag.");
  }

  // 2) E-post som ikke gikk ut — KUN den siste uken
  // Uten tidsgrensen ville et gammelt, allerede rettet feilslag utløst
  // varsel hver eneste dag i all framtid. Da slutter man å lese varslene,
  // og da er de verdiløse. Et varsel skal si «noe skjer nå», ikke
  // «noe skjedde en gang».
  //
  // En uke er valgt med vilje: kort nok til at rettede feil slipper taket,
  // langt nok til at en feil overlever en travel uke uten å bli glemt.
  try {
    const grense = new Date(nå - HELSE_MAIL_VINDU_MS).toISOString();
    const feilet = await db.collection("mail").where("delivery.state", "==", "ERROR").limit(25).get();
    const ferske = feilet.docs.filter((d) => {
      const dd = d.data().delivery || {};
      // Utvidelsen setter endTime når forsøket ble avsluttet. Mangler den,
      // regnes dokumentet som gammelt — heller overse et grensetilfelle
      // enn å varsle om noe som skjedde for måneder siden.
      const t = dd.endTime || dd.startTime;
      const iso = t && t.toDate ? t.toDate().toISOString() : t;
      return iso && iso > grense;
    });
    if (ferske.length > 0) {
      const første = ferske[0].data();
      const grunn = (første.delivery && første.delivery.error) || "ukjent årsak";
      funn.push(`${ferske.length} e-post${ferske.length === 1 ? "" : "er"} kom ikke fram den siste uken. ` +
        `Første feil: ${String(grunn).slice(0, 200)}`);
    } else if (feilet.size > 0) {
      // Verdt å vite, men ikke verdt å vekke noen for.
      logger.info(`${feilet.size} eldre e-postfeil i basen — utenfor varselvinduet.`);
    }
  } catch (err) {
    logger.warn("Kunne ikke sjekke mail-feil", err);
  }

  // 3) Varsler som står fast
  const fastSiden = tidspunkt(helse.varselFastSiden);
  if (fastSiden && nå - fastSiden > VARSEL_FAST_GRENSE_MS) {
    const min = Math.floor((nå - fastSiden) / 60000);
    funn.push(`En eller flere påmeldinger har ikke blitt varslet om på ${min} minutter. ` +
      "Utsendingen feiler gjentatte ganger — søknadene ligger trygt i basen, " +
      "men ingen har fått beskjed.");
  }

  // 4) Feil fanget i portalene
  // Uten dette ville feilloggen bare vært et arkiv man måtte huske å
  // åpne. En logg ingen leser er like stille som ingen logg.
  //
  // ═══════════════════════════════════════════════════════════════════
  // 🔴 VINDUET GÅR FRA SISTE VARSEL — IKKE EN FAST UKE TILBAKE.
  //
  // Slik det sto, spurte punktet «finnes det feil i loggen den siste
  // uken?». Svaret var ja hver eneste dag, for feilene ble liggende.
  // Én feil ga sju varsler. En feil som ble RETTET ga også sju: «Cannot
  // access 'lov'» ble rettet 12. august og sto fortsatt i varselet 14.
  //
  // Og det er ikke bryet som er skaden. E-posten lover: «sendes kun når
  // noe faktisk er galt — får du den ikke, er alt i orden». Kom den hver
  // dag, ble den setningen usann, og varselet sluttet å bety noe. Da er
  // det dagen sikkerhetskopien FAKTISK feiler man overser.
  //
  // De tre punktene over sier «noe er ødelagt NÅ». Dette sa «arkivet har
  // rader» — en normaltilstand, ikke en hendelse. Et varsel skal utløses
  // av en ENDRING.
  //
  // Nå: bare feil som har kommet etter forrige utsendte varsel telles.
  // Hver feil varsles nøyaktig én gang. Og fordi sisteHelseVarsel bare
  // settes NÅR en e-post faktisk går ut, blir en feil som aldri ble
  // varslet om liggende i køen til den blir det — ingenting faller ut.
  //
  // Uken beholdes som ytre grense: har det gått måneder uten varsel,
  // skal ikke det første som sendes inneholde alt som noen gang har
  // skjedd.
  // ═══════════════════════════════════════════════════════════════════
  const forrigeVarsel = tidspunkt(helse.sisteHelseVarsel);
  try {
    const gulv = Math.max(nå - HELSE_MAIL_VINDU_MS, forrigeVarsel);
    const grense = new Date(gulv).toISOString();
    const feil = await db.collection("feillogg")
      .where("tidspunkt", ">", grense).limit(50).get();
    if (!feil.empty) {
      // Grupperer på melding: tjue like feil er ÉN sak, ikke tjue.
      const grupper = new Map();
      feil.forEach((d) => {
        const m = (d.data().melding || "").slice(0, 100);
        grupper.set(m, (grupper.get(m) || 0) + 1);
      });
      const topp = [...grupper.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const periode = forrigeVarsel > nå - HELSE_MAIL_VINDU_MS
        ? "siden forrige varsel" : "den siste uken";
      funn.push(`${feil.size} nye feil er fanget i portalene ${periode}. ` +
        "Vanligste: " + topp.map(([m, n]) => `«${m}» (${n})`).join(", "));
    }
  } catch (err) {
    logger.warn("Kunne ikke lese feillogg", err);
  }

  await helseRef.set({ sisteSjekk: new Date().toISOString() }, { merge: true });
  if (funn.length === 0) return;

  // Samme verdi som vinduet over ble regnet ut fra. Leses den to ganger
  // fra samme objekt, er de like — men da må den som endrer den ene
  // huske den andre.
  const sisteVarsel = forrigeVarsel;
  if (nå - sisteVarsel < HELSE_VARSEL_PAUSE_MS) {
    logger.info(`Helsesjekk fant ${funn.length} forhold, men varsel er sendt nylig.`);
    return;
  }

  try {
    await db.collection("mail").add({
      from: "Madina Skole <post@madinaskole.no>",
      to: [BACKUP_EMAIL],
      message: {
        subject: `⚠️ Madina Skole — ${funn.length} forhold trenger tilsyn`,
        html: `
          <p>Den automatiske helsesjekken har funnet noe som ikke virker som det skal.</p>
          <ul style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
            ${funn.map((f) => `<li style="margin-bottom:10px;">${f}</li>`).join("")}
          </ul>
          <p style="margin-top:18px;">
            Full status: <a href="https://madinaskole.no/helsesjekk.html">helsesjekk.html</a>
          </p>
          <p style="color:#8a9a90;font-size:12px;margin-top:22px;">
            Denne e-posten sendes høyst én gang i døgnet, og kun når noe faktisk
            er galt. Får du den ikke, er alt i orden — det er hele poenget.
          </p>`
      }
    });
    await helseRef.set({ sisteHelseVarsel: new Date().toISOString() }, { merge: true });
    logger.warn(`Helsevarsel sendt: ${funn.join(" | ")}`);
  } catch (err) {
    logger.error("Kunne ikke sende helsevarsel", err);
  }
}
