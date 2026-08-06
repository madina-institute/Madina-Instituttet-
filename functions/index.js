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

// ---------------------------------------------------------------------
// PRISER PER PROGRAM — samme tall og samme søskenrabatt-logikk som
// admin-panelet (Elever-skjemaet) bruker. Holdt i sync manuelt siden
// dette er en egen kodebase (Cloud Functions), men MÅ oppdateres begge
// steder samtidig hvis prisene endres.
// Begge programmer prises som ett flatt beløp tilsvarende én termin.
// ---------------------------------------------------------------------
const PROGRAM_PRICES = {
  "Madina Islamske Skole — Integrert program (Lørdag)": 2750,
  "Madinabarn (Søndag)": 1500,
};

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

// Søskenrabatt: 1. barn = full pris, 2. barn = 20% rabatt, 3. barn (og
// alle senere barn) = 30% rabatt — basert på hvor mange barn denne
// foresatte allerede har registrert i 'students'.
async function computeSoskenPrice(program, guardianId) {
  const basePrice = PROGRAM_PRICES[program] || 0;
  if (!guardianId) return { price: basePrice, pos: 1 };
  const siblingsSnap = await db.collection("students").where("foresatt", "==", guardianId).get();
  const pos = siblingsSnap.size + 1;
  let price = basePrice;
  if (pos === 2) price = Math.round(basePrice * 0.8);
  else if (pos >= 3) price = Math.round(basePrice * 0.7);
  return { price, pos };
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
  default: "https://madina-institute.github.io/Madina-Instituttet-",
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

// =======================================================================
// 1) createVippsPayment
//    POST { type: 'registration'|'balance', targetId, amountKr, phoneNumber }
//    - type 'registration': targetId er en registrations-dokument-ID
//      (depositum ved en ny søknad — webhooken oppretter elev+foresatt).
//    - type 'balance': targetId er en students-dokument-ID (en allerede
//      godkjent elev som betaler ned på restbeløpet — webhooken oppdaterer
//      bare belopBetalt, oppretter INGEN ny elev).
//    Returnerer { ok:true, redirectUrl } eller { ok:false, error }
// =======================================================================
exports.createVippsPayment = onRequest(
  { secrets: [VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }
    try {
      const { type, targetId, amountKr, phoneNumber } = req.body || {};
      if (!type || !targetId || !amountKr || !phoneNumber) {
        res.status(400).json({ ok: false, error: "Mangler type, targetId, amountKr eller phoneNumber." });
        return;
      }
      if (type !== "registration" && type !== "balance") {
        res.status(400).json({ ok: false, error: "Ugyldig type — må være 'registration' eller 'balance'." });
        return;
      }

      // Henter riktig dokument avhengig av betalingstype, kun for å hente
      // et navn til betalingsbeskrivelsen i Vipps-appen — selve
      // godkjenningslogikken skjer i webhooken.
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

      // "reference" må være unik per salgsenhet (MSN) hos Vipps, og Vipps
      // krever at Idempotency-Key (som vi setter lik denne) er MAKS 50
      // tegn. Vi bruker derfor korte kode-forkortelser ("reg"/"bal") i
      // stedet for de fulle ordene "registration"/"balance" — ellers blir
      // strengen for lang og Vipps avviser betalingen med en 400-feil.
      const typeCode = type === "registration" ? "reg" : "bal";
      const reference = `madina-${typeCode}-${targetId}-${Date.now()}`;

      // Vipps forventer telefonnummeret i MSISDN-format MED landkode
      // (f.eks. 4791507350), ikke bare de 8 sifrene nordmenn er vant til å
      // skrive. Legger på "47" foran automatisk hvis det mangler.
      let normalizedPhone = String(phoneNumber).replace(/\D/g, "");
      if (normalizedPhone.length === 8) normalizedPhone = "47" + normalizedPhone;

      const paymentDescription = type === "registration"
        ? `Depositum — ${elevNavn} (Madina Skole)`
        : `Skolepenger — ${elevNavn} (Madina Skole)`;

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
        body: JSON.stringify({
          amount: { currency: "NOK", value: Math.round(Number(amountKr) * 100) },
          paymentMethod: { type: "WALLET" },
          customer: { phoneNumber: normalizedPhone },
          reference,
          // PUSH_MESSAGE sender et ekte push-varsel rett inn i Vipps-appen
          // til foresatte (siden administrasjonen — ikke foresatte selv —
          // starter betalingen på en enhet foresatte ikke sitter ved), i
          // stedet for WEB_REDIRECT som bare gir en lenke vi må sende på
          // e-post. E-posten sendes fortsatt i tillegg, som en backup.
          userFlow: "PUSH_MESSAGE",
          paymentDescription,
        }),
      });

      if (!paymentRes.ok) {
        const body = await paymentRes.text();
        logger.error("Vipps create payment failed", body);
        // Sender det faktiske Vipps-feilsvaret tilbake til admin-panelet
        // (i stedet for en generisk melding) — gjør det mulig å se nøyaktig
        // hva Vipps klager på, uten å måtte lete i Cloud Functions-loggene.
        res.status(502).json({ ok: false, error: "Vipps avviste betalingen: " + body });
        return;
      }
      const paymentData = await paymentRes.json();

      // Lagrer referansen på selve kilde-dokumentet, slik at man kan se i
      // Firestore at en betaling er igangsatt (nyttig for feilsøking), selv
      // om webhooken selv finner alt den trenger fra reference-strengen.
      await sourceRef.update({
        vippsReference: reference,
        vippsStatus: "CREATED",
        vippsCreatedAt: new Date().toISOString(),
      });

      // Egen "utestående forespørsel"-logg — kun Kasserer (Ledelse) bruker
      // denne, til å vise/avbryte krav som er sendt men ikke betalt ennå.
      // Vanlig Kasserer trenger den ikke og skriver ikke til den.
      await db.collection("pendingVippsPayments").add({
        reference,
        type,
        targetId,
        studentId: type === "balance" ? targetId : null,
        elevNavn,
        amountKr: Number(amountKr),
        phoneNumber: normalizedPhone,
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: null, // settes av admin.html rett før dette kallet om ønskelig
      });

      res.status(200).json({ ok: true, redirectUrl: paymentData.redirectUrl, reference });
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

    // Unngår dobbel-godkjenning hvis Vipps skulle sende samme hendelse
    // flere ganger (dette skjer i praksis av og til — helt normalt).
    if (reg.status === "Godkjent") {
      res.status(200).send("OK (allerede godkjent)");
      return;
    }

    // ---- Oppretter foresatt (hvis den ikke finnes fra før) ----
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
    const { price: discountedPrice, pos: soskenPos } = await computeSoskenPrice(mappedProgram, guardianId);

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
    await regDoc.update({
      status: "Godkjent",
      behandletAv: "Vipps-betaling (automatisk)",
      vippsStatus: "AUTHORIZED",
      vippsBetaltDato: new Date().toISOString(),
    });

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
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }
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
          "Idempotency-Key": `cancel-${reference}`,
          "Vipps-System-Name": "madina-skole",
          "Vipps-System-Version": "1.0.0",
        },
      });
      if (!cancelRes.ok) {
        const body = await cancelRes.text();
        logger.error("Vipps cancel failed", body);
        res.status(502).json({ ok: false, error: "Vipps avviste avbrytelsen (kanskje allerede betalt?): " + body });
        return;
      }
      const pendingSnap = await db.collection("pendingVippsPayments").where("reference", "==", reference).limit(1).get();
      if (!pendingSnap.empty) {
        await pendingSnap.docs[0].ref.update({ status: "cancelled", cancelledAt: new Date().toISOString() });
      }
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
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Kun POST er tillatt." });
      return;
    }
    try {
      const { reference, studentId, amountKr } = req.body || {};
      if (!reference || !studentId || !amountKr) {
        res.status(400).json({ ok: false, error: "Mangler reference, studentId eller amountKr." });
        return;
      }
      const accessToken = await getVippsAccessToken();
      const refundRes = await fetch(`${vippsApiBase()}/epayment/v1/payments/${encodeURIComponent(reference)}/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Ocp-Apim-Subscription-Key": VIPPS_SUBSCRIPTION_KEY.value(),
          "Merchant-Serial-Number": VIPPS_MSN.value(),
          "Content-Type": "application/json",
          "Idempotency-Key": `refund-${reference}-${Date.now()}`,
          "Vipps-System-Name": "madina-skole",
          "Vipps-System-Version": "1.0.0",
        },
        body: JSON.stringify({
          modificationAmount: { currency: "NOK", value: Math.round(Number(amountKr) * 100) },
        }),
      });
      if (!refundRes.ok) {
        const body = await refundRes.text();
        logger.error("Vipps refund failed", body);
        res.status(502).json({ ok: false, error: "Vipps avviste refusjonen: " + body });
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
  "meetings", "settings", "deletionLog", "loginEvents"
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

exports.ukentligSikkerhetskopi = onSchedule(
  {
    schedule: "0 4 * * 0",
    timeZone: "Europe/Oslo",
    timeoutSeconds: 540,
    memory: "512MiB"
  },
  async () => {
    await lagSikkerhetskopi();
  }
);

// Manuell kjøring — nyttig for å teste uten å vente til søndag, og for å
// ta en ekstra kopi før noe stort skal endres.
exports.taSikkerhetskopiNa = onRequest(
  { timeoutSeconds: 540, memory: "512MiB" },
  async (req, res) => {
    try {
      const result = await lagSikkerhetskopi();
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      logger.error("Manuell sikkerhetskopi feilet", err);
      res.status(500).json({ ok: false, error: String(err && err.message) });
    }
  }
);
