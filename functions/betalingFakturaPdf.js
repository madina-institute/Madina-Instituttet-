/* SIST-ENDRET: 2026-08-22 16:45:00 */
/**
 * Genererer faktura som PDF (A4) for e-postvedlegg — kun digital betaling.
 */
const PDFDocument = require("pdfkit");
const { fmtBelop, filnavnSafe, hentStempelPng } = require("./betalingKvitteringPdf");

function tegnBetalingsmetode(doc, x, y, w, label, bg, fg) {
  doc.save();
  doc.roundedRect(x, y, w, 28, 5).fill(bg);
  doc.fillColor(fg).fontSize(label.length > 6 ? 9 : 11).font("Helvetica-Bold")
    .text(label, x, y + 8, { width: w, align: "center" });
  doc.restore();
}

/**
 * @returns {Promise<{ buffer: Buffer, base64: string, filnavn: string }>}
 */
async function genererBetalingFakturaPdf({
  mottakerNavn = "Hei",
  elevNavn = "—",
  belopKr,
  belopFormatted,
  dokumentRef,
  utstedtDato,
  betalingsfrist,
  kategoriLabel = "Skoleavgift",
  opprettetAvNavn = "—",
  sistSendtAvNavn = null,
  payUrl = "",
  studentId,
}) {
  const belop = belopFormatted || fmtBelop(belopKr);
  const utstedt = utstedtDato || new Date().toLocaleDateString("no-NO", { timeZone: "Europe/Oslo" });
  const frist = betalingsfrist || "—";
  const docRef = dokumentRef || ("FA-" + String(studentId || elevNavn || "X").slice(-6).toUpperCase());
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
      .text("Digital betaling — Madina Skole", 42, y + 44, { width: pageW, align: "center" });
    doc.restore();
    y += 72;

    doc.fillColor("#5a6b7d").fontSize(8).font("Helvetica")
      .text(`Referanse: ${docRef}`, 42, y)
      .text(`Utstedt: ${utstedt}`, 42, y, { width: pageW, align: "right" });
    y += 16;
    doc.fillColor("#8a2a2a").fontSize(8).font("Helvetica-Bold")
      .text(`Betalingsfrist: ${frist}`, 42, y, { width: pageW, align: "right" });
    y += 20;

    const row = (label, value, yy) => {
      doc.fillColor("#5a6860").fontSize(8).font("Helvetica-Bold").text(label, 48, yy, { width: 130 });
      doc.fillColor("#16283a").fontSize(9).font("Helvetica").text(String(value || "—"), 178, yy, { width: pageW - 140 });
    };

    doc.roundedRect(42, y, pageW, 118, 6).stroke("#e4edf6");
    row("Elev", elevNavn, y + 10);
    row("Posttype", kategoriLabel, y + 28);
    row("Opprettet av", opprettetAvNavn, y + 46);
    if (sistSendtAvNavn && sistSendtAvNavn !== opprettetAvNavn) {
      row("Sist sendt av", sistSendtAvNavn, y + 64);
    }
    row("Mottaker", mottakerNavn, y + (sistSendtAvNavn && sistSendtAvNavn !== opprettetAvNavn ? 82 : 64));
    y += 128;

    doc.roundedRect(42, y, pageW, 52, 6).fillAndStroke("#f8fbfe", "#cfe0ef");
    doc.fillColor("#6f93b6").fontSize(7).font("Helvetica-Bold")
      .text("BELØP Å BETALE", 56, y + 10);
    doc.fillColor("#1c5490").fontSize(22).font("Helvetica-Bold")
      .text(belop, 56, y + 22);
    y += 64;

    doc.fillColor("#1c5490").fontSize(8).font("Helvetica-Bold")
      .text("BETALINGSMÅTER", 42, y);
    y += 12;
    doc.fillColor("#5a6860").fontSize(8).font("Helvetica")
      .text("Betaling skjer kun digitalt via lenken under (ikke bankoverføring).", 42, y, { width: pageW });
    y += 18;

    const pillW = (pageW - 16) / 3;
    tegnBetalingsmetode(doc, 42, y, pillW, "Vipps", "#ff5b24", "#ffffff");
    tegnBetalingsmetode(doc, 42 + pillW + 8, y, pillW, "VISA", "#1a1f71", "#ffffff");
    tegnBetalingsmetode(doc, 42 + (pillW + 8) * 2, y, pillW, "Mastercard", "#252525", "#ffffff");
    y += 40;

    if (payUrl) {
      const btnH = 44;
      doc.roundedRect(42, y, pageW, btnH, 8).fill("#1c5490");
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold")
        .text("▶  FOR BETALING — TRYKK HER", 42, y + 14, { width: pageW, align: "center" });
      doc.link(42, y, pageW, btnH, payUrl);
      y += btnH + 8;
      doc.fillColor("#5a6860").fontSize(7).font("Helvetica")
        .text(payUrl, 42, y, { width: pageW, align: "center", link: payUrl });
      y += 20;
    } else {
      doc.fillColor("#8a2a2a").fontSize(9).font("Helvetica-Bold")
        .text("Betalingslenke ikke tilgjengelig — kontakt skolen.", 42, y);
      y += 20;
    }

    doc.moveTo(42, y).lineTo(42 + pageW, y).dash(3, { space: 3 }).stroke("#cfe0ef");
    doc.undash();
    y += 12;

    doc.fillColor("#16283a").fontSize(9).font("Helvetica")
      .text(`${mottakerNavn},`, 42, y)
      .text(`Vennligst betal innen ${frist}. Beløpet gjelder ${kategoriLabel.toLowerCase()} for ${elevNavn}.`, 42, y + 14, { width: pageW * 0.58 })
      .font("Helvetica-Bold").text("Med vennlig hilsen,", 42, y + 44)
      .font("Helvetica").text("Madina Skole", 42, y + 58);

    if (stempelPng) {
      doc.image(stempelPng, 42 + pageW - 100, y - 4, { width: 96, height: 96 });
    }

    y += 110;
    doc.fillColor("#7b8a93").fontSize(7.5).font("Helvetica")
      .text("Madina Skole · Hagelundveien 2b, 0963 Oslo · post@madinaskole.no", 42, y)
      .text(docRef, 42, y, { width: pageW, align: "right" });

    doc.end();
  });

  const filnavn = "Faktura-" + filnavnSafe(elevNavn) + "-" + docRef + ".pdf";
  return { buffer, base64: buffer.toString("base64"), filnavn };
}

module.exports = { genererBetalingFakturaPdf };
