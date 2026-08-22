/* SIST-ENDRET: 2026-08-22 02:30:00 */
/**
 * Genererer offisiell betalingskvittering som PDF (A4) for e-postvedlegg.
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");

const STEMPLE_SVG = path.join(__dirname, "assets", "stempel-madina-fullt.svg");

function fmtBelop(amountKr) {
  if (amountKr == null || amountKr === "") return "—";
  const n = Number(String(amountKr).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return String(amountKr);
  return n.toLocaleString("no-NO") + " kr";
}

function filnavnSafe(s) {
  return String(s || "elev")
    .trim()
    .replace(/[^\w\u00C0-\u024F\-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "elev";
}

async function hentStempelPng() {
  if (!fs.existsSync(STEMPLE_SVG)) return null;
  return sharp(STEMPLE_SVG).resize(220, 220).png().toBuffer();
}

/**
 * @returns {Promise<{ buffer: Buffer, base64: string, filnavn: string }>}
 */
async function genererBetalingKvitteringPdf({
  mottakerNavn = "Hei",
  elevNavn = "—",
  belopKr,
  belopFormatted,
  kanal = "—",
  paymentType = "—",
  reference = "—",
  tidspunkt,
  dokumentRef,
}) {
  const belop = belopFormatted || fmtBelop(belopKr);
  const utstedt = tidspunkt || new Date().toLocaleString("no-NO", { timeZone: "Europe/Oslo" });
  const docRef = dokumentRef || ("KV-" + String(reference || "").slice(-8).toUpperCase());
  const stempelPng = await hentStempelPng();

  const buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width - 84;
    let y = 42;

    // Header
    doc.save();
    doc.roundedRect(42, y, pageW, 62, 6).fill("#eef6fd");
    doc.fillColor("#6f93b6").fontSize(7).font("Helvetica")
      .text("MADINA SKOLE", 42, y + 10, { width: pageW, align: "center" });
    doc.fillColor("#1c5490").fontSize(20).font("Helvetica-Bold")
      .text("Betalingskvittering", 42, y + 22, { width: pageW, align: "center" });
    doc.fillColor("#4a7099").fontSize(9).font("Helvetica")
      .text("Offisiell kvittering / payment receipt", 42, y + 44, { width: pageW, align: "center" });
    doc.restore();
    y += 72;

    doc.fillColor("#5a6b7d").fontSize(8).font("Helvetica")
      .text(`Dokument: ${docRef}`, 42, y)
      .text(`Utstedt: ${utstedt}`, 42, y, { width: pageW, align: "right" });
    y += 18;

    doc.fillColor("#1c5490").fontSize(7).font("Helvetica-Bold")
      .text("KVITTERING", 42, y);
    y += 14;

    doc.fillColor("#16283a").fontSize(11).font("Helvetica")
      .text(`${mottakerNavn},`, 42, y)
      .text("Vi bekrefter at betalingen er mottatt og registrert.", 42, y + 16, { width: pageW });
    y += 44;

    // Amount highlight
    doc.roundedRect(42, y, pageW, 52, 6).fillAndStroke("#f8fbfe", "#cfe0ef");
    doc.fillColor("#6f93b6").fontSize(7).font("Helvetica-Bold")
      .text("BETALT BELØP", 56, y + 10);
    doc.fillColor("#1c5490").fontSize(22).font("Helvetica-Bold")
      .text(belop, 56, y + 22);
    y += 64;

    const row = (label, value, yy) => {
      doc.fillColor("#5a6860").fontSize(9).font("Helvetica-Bold").text(label, 48, yy, { width: 120 });
      doc.fillColor("#16283a").fontSize(10).font("Helvetica").text(String(value || "—"), 170, yy, { width: pageW - 130 });
    };

    doc.roundedRect(42, y, pageW, 108, 6).stroke("#e4edf6");
    row("Elev", elevNavn, y + 12);
    row("Betalt via", kanal, y + 32);
    row("Type", paymentType, y + 52);
    row("Referanse", reference, y + 72);
    row("Tidspunkt", utstedt, y + 92);
    y += 120;

    doc.moveTo(42, y).lineTo(42 + pageW, y).dash(3, { space: 3 }).stroke("#cfe0ef");
    doc.undash();
    y += 12;

    doc.fillColor("#16283a").fontSize(10).font("Helvetica")
      .text("Beløpet er trukket fra restsaldoen i skolens system.", 42, y, { width: pageW * 0.55 })
      .font("Helvetica-Bold").text("Med vennlig hilsen,", 42, y + 28)
      .font("Helvetica").text("Madina Skole", 42, y + 42);

    if (stempelPng) {
      doc.image(stempelPng, 42 + pageW - 100, y - 4, { width: 96, height: 96 });
    }

    y += 110;
    doc.fillColor("#7b8a93").fontSize(7.5).font("Helvetica")
      .text("Madina Skole · Hagelundveien 2b, 0963 Oslo · post@madinaskole.no", 42, y)
      .text(docRef, 42, y, { width: pageW, align: "right" });

    doc.end();
  });

  const filnavn = "Betaling-kvittering-" + filnavnSafe(elevNavn) + ".pdf";
  return { buffer, base64: buffer.toString("base64"), filnavn };
}

module.exports = { genererBetalingKvitteringPdf, fmtBelop, filnavnSafe };
