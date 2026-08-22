/* SIST-ENDRET: 2026-08-22 08:00:00 */
/**
 * Genererer faktura som PDF (A4) for e-postvedlegg.
 */
const PDFDocument = require("pdfkit");
const { fmtBelop, filnavnSafe, hentStempelPng } = require("./betalingKvitteringPdf");

/**
 * @returns {Promise<{ buffer: Buffer, base64: string, filnavn: string }>}
 */
async function genererBetalingFakturaPdf({
  mottakerNavn = "Hei",
  elevNavn = "—",
  restKr,
  restFormatted,
  kontonummer = "—",
  iban = "—",
  studentId,
  tidspunkt,
  dokumentRef,
}) {
  const rest = restFormatted || fmtBelop(restKr);
  const utstedt = tidspunkt || new Date().toLocaleString("no-NO", { timeZone: "Europe/Oslo" });
  const docRef = dokumentRef || ("FA-" + String(studentId || elevNavn || "X").slice(-6).toUpperCase()
    + "-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const stempelPng = await hentStempelPng();

  const buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width - 84;
    let y = 42;

    doc.save();
    doc.roundedRect(42, y, pageW, 62, 6).fill("#eef6fd");
    doc.fillColor("#6f93b6").fontSize(7).font("Helvetica")
      .text("MADINA SKOLE", 42, y + 10, { width: pageW, align: "center" });
    doc.fillColor("#1c5490").fontSize(20).font("Helvetica-Bold")
      .text("Faktura", 42, y + 22, { width: pageW, align: "center" });
    doc.fillColor("#4a7099").fontSize(9).font("Helvetica")
      .text("Betalingsforespørsel / invoice", 42, y + 44, { width: pageW, align: "center" });
    doc.restore();
    y += 72;

    doc.fillColor("#5a6b7d").fontSize(8).font("Helvetica")
      .text(`Dokument: ${docRef}`, 42, y)
      .text(`Utstedt: ${utstedt}`, 42, y, { width: pageW, align: "right" });
    y += 18;

    doc.fillColor("#1c5490").fontSize(7).font("Helvetica-Bold")
      .text("FAKTURA", 42, y);
    y += 14;

    doc.fillColor("#16283a").fontSize(11).font("Helvetica")
      .text(`${mottakerNavn},`, 42, y)
      .text(`Dette er en faktura for ${elevNavn}.`, 42, y + 16, { width: pageW });
    y += 44;

    doc.roundedRect(42, y, pageW, 52, 6).fillAndStroke("#f8fbfe", "#cfe0ef");
    doc.fillColor("#6f93b6").fontSize(7).font("Helvetica-Bold")
      .text("BELØP Å BETALE", 56, y + 10);
    doc.fillColor("#1c5490").fontSize(22).font("Helvetica-Bold")
      .text(rest, 56, y + 22);
    y += 64;

    doc.fillColor("#1c5490").fontSize(8).font("Helvetica-Bold")
      .text("BETALINGSOPPLYSNINGER", 42, y);
    y += 14;

    const row = (label, value, yy) => {
      doc.fillColor("#5a6860").fontSize(9).font("Helvetica-Bold").text(label, 48, yy, { width: 120 });
      doc.fillColor("#16283a").fontSize(10).font("Helvetica").text(String(value || "—"), 170, yy, { width: pageW - 130 });
    };

    doc.roundedRect(42, y, pageW, 88, 6).stroke("#e4edf6");
    row("Elev", elevNavn, y + 12);
    row("Kontonummer", kontonummer, y + 32);
    row("IBAN", iban, y + 52);
    row("Merk betaling", "Elevens fulle navn", y + 72);
    y += 100;

    doc.moveTo(42, y).lineTo(42 + pageW, y).dash(3, { space: 3 }).stroke("#cfe0ef");
    doc.undash();
    y += 12;

    doc.fillColor("#16283a").fontSize(10).font("Helvetica")
      .text("Vennligst betal restbeløpet til kontoen over og merk betalingen med elevens fulle navn.", 42, y, { width: pageW * 0.55 })
      .font("Helvetica-Bold").text("Med vennlig hilsen,", 42, y + 36)
      .font("Helvetica").text("Madina Skole", 42, y + 50);

    if (stempelPng) {
      doc.image(stempelPng, 42 + pageW - 100, y - 4, { width: 96, height: 96 });
    }

    y += 110;
    doc.fillColor("#7b8a93").fontSize(7.5).font("Helvetica")
      .text("Madina Skole · Hagelundveien 2b, 0963 Oslo · post@madinaskole.no", 42, y)
      .text(docRef, 42, y, { width: pageW, align: "right" });

    doc.end();
  });

  const filnavn = "Faktura-" + filnavnSafe(elevNavn) + ".pdf";
  return { buffer, base64: buffer.toString("base64"), filnavn };
}

module.exports = { genererBetalingFakturaPdf };
