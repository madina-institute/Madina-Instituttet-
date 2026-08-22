/* SIST-ENDRET: 2026-08-22 03:45:00 */
/**
 * Genererer Betalingsoversikt som PDF (A4) — samme motor som betalingskvittering (PDFKit).
 */
const PDFDocument = require("pdfkit");
const { filnavnSafe, hentStempelPng } = require("./betalingKvitteringPdf");

function fmtKr(amountKr) {
  const n = Number(amountKr);
  if (!Number.isFinite(n)) return "0 kr";
  return n.toLocaleString("no-NO") + " kr";
}

function kildePdfTekst(kilde) {
  let k = String(kilde || "—").trim();
  const manuell = k.match(/^Manuell\s*\([^)]+\)/i);
  if (manuell) return manuell[0];
  if (k.includes("Vipps-refusjon")) return "Vipps-refusjon";
  if (k.includes("Vipps") && k.includes("depositum")) return "Vipps — depositum";
  if (k.includes("Vipps (automatisk)")) return "Vipps";
  if (k.includes("Bankkort")) return "Bankkort";
  if (k.length > 26) return k.slice(0, 24) + "…";
  return k;
}

function delHistorikkIKolonner(rader) {
  const n = rader.length;
  if (!n) return [[]];
  if (n <= 10) return [rader];
  if (n <= 20) {
    const half = Math.ceil(n / 2);
    return [rader.slice(0, half), rader.slice(half)];
  }
  const perCol = Math.ceil(n / 3);
  return [
    rader.slice(0, perCol),
    rader.slice(perCol, perCol * 2),
    rader.slice(perCol * 2),
  ].filter((k) => k.length);
}

function tegnHistorikkKolonne(doc, rader, x, y, colW, startY) {
  let yy = startY;
  const headH = 12;
  doc.save();
  doc.rect(x, yy, colW, headH).fill("#eef4fa");
  doc.fillColor("#1c5490").fontSize(6).font("Helvetica-Bold");
  doc.text("DATO", x + 3, yy + 3, { width: colW * 0.42 });
  doc.text("BELØP", x + colW * 0.42, yy + 3, { width: colW * 0.2, align: "right" });
  doc.text("KILDE", x + colW * 0.64, yy + 3, { width: colW * 0.34 });
  doc.restore();
  yy += headH;

  doc.fontSize(6).font("Helvetica");
  for (const p of rader) {
    const bel = Number(p.belop);
    const neg = bel < 0;
    doc.fillColor(neg ? "#a83c3c" : "#16283a");
    doc.text(String(p.dato || "—"), x + 3, yy, { width: colW * 0.42, lineGap: 0 });
    doc.text(fmtKr(bel), x + colW * 0.42, yy, { width: colW * 0.2, align: "right", lineGap: 0 });
    doc.fillColor("#16283a").text(kildePdfTekst(p.kilde), x + colW * 0.64, yy, { width: colW * 0.32, lineGap: 0 });
    yy += 9;
  }
  return yy;
}

/**
 * @returns {Promise<{ buffer: Buffer, base64: string, filnavn: string }>}
 */
async function genererBetalingRapportPdf({
  foresattNavn = "Hei",
  elevNavn = "—",
  klasseNavn = "—",
  skoleaar = "",
  belopKr = 0,
  betaltKr = 0,
  restKr = 0,
  history = [],
  dokumentRef,
}) {
  const utstedt = new Date().toLocaleString("no-NO", {
    timeZone: "Europe/Oslo",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const docRef = dokumentRef || ("BR-" + Date.now().toString(36).toUpperCase());
  const stempelPng = await hentStempelPng();
  const sortert = [...history].sort((a, b) => String(b.dato || "").localeCompare(String(a.dato || "")));
  const kolonner = delHistorikkIKolonner(sortert);

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
    doc.roundedRect(42, y, pageW, 68, 6).fill("#eef6fd");
    doc.fillColor("#6f93b6").fontSize(6.5).font("Helvetica")
      .text(skoleaar ? `SKOLEÅRET ${skoleaar}` : "MADINA SKOLE", 42, y + 8, { width: pageW, align: "center" });
    doc.fillColor("#1c5490").fontSize(20).font("Helvetica-Bold")
      .text("Betalingsoversikt", 42, y + 20, { width: pageW, align: "center" });
    doc.fillColor("#4a7099").fontSize(9).font("Helvetica")
      .text("Offisiell kvittering / payment statement", 42, y + 44, { width: pageW, align: "center" });
    doc.restore();
    y += 78;

    doc.fillColor("#5a6b7d").fontSize(8).font("Helvetica")
      .text(`Dokument: ${docRef}`, 42, y)
      .text(`Utstedt: ${utstedt}`, 42, y, { width: pageW, align: "right" });
    y += 16;

    doc.roundedRect(42, y, 72, 12, 6).fill("#1c5490");
    doc.fillColor("#ffffff").fontSize(6.5).font("Helvetica-Bold")
      .text("BETALINGSRAPPORT", 48, y + 3);
    y += 18;

    doc.fillColor("#16283a").fontSize(10).font("Helvetica")
      .text(`${foresattNavn},`, 42, y)
      .text(
        `Her er en oppdatert betalingsoversikt for ${elevNavn} (${klasseNavn}).`,
        42,
        y + 14,
        { width: pageW }
      );
    y += 36;

    // Summary boxes
    const boxW = (pageW - 12) / 3;
    const summaries = [
      { lbl: "TOTALT BELØP", val: fmtKr(belopKr), fill: "#f8fbfe", stroke: "#cfe0ef", valColor: "#1c5490" },
      { lbl: "BETALT SÅ LANGT", val: fmtKr(betaltKr), fill: "#f8fbfe", stroke: "#cfe0ef", valColor: "#1c5490" },
      { lbl: "RESTBELØP", val: fmtKr(restKr), fill: "#fdf8ec", stroke: "#e8c89a", valColor: "#9a6b1a" },
    ];
    summaries.forEach((s, i) => {
      const bx = 42 + i * (boxW + 6);
      doc.roundedRect(bx, y, boxW, 38, 4).fillAndStroke(s.fill, s.stroke);
      doc.fillColor("#6f93b6").fontSize(6).font("Helvetica-Bold").text(s.lbl, bx + 6, y + 6, { width: boxW - 12 });
      doc.fillColor(s.valColor).fontSize(12).font("Helvetica-Bold").text(s.val, bx + 6, y + 18, { width: boxW - 12 });
    });
    y += 48;

    doc.fillColor("#1c5490").fontSize(11).font("Helvetica-Bold")
      .text("Betalingshistorikk", 42, y);
    y += 14;

    if (!sortert.length) {
      doc.fillColor("#8a9a90").fontSize(9).font("Helvetica-Oblique")
        .text("Ingen registrerte betalinger ennå.", 42, y);
      y += 20;
    } else {
      const colCount = kolonner.length;
      const gap = 6;
      const colW = (pageW - gap * (colCount - 1)) / colCount;
      let maxY = y;
      kolonner.forEach((kol, i) => {
        const cx = 42 + i * (colW + gap);
        const endY = tegnHistorikkKolonne(doc, kol, cx, y, colW, y);
        if (endY > maxY) maxY = endY;
      });
      y = maxY + 6;
    }

    doc.moveTo(42, y).lineTo(42 + pageW, y).dash(3, { space: 3 }).stroke("#cfe0ef");
    doc.undash();
    y += 10;

    doc.fillColor("#16283a").fontSize(9).font("Helvetica")
      .text("Dokumentet er utstedt elektronisk av Madina Skole og gjelder per dato ovenfor.", 42, y, { width: pageW * 0.58 })
      .font("Helvetica-Bold").text("Med vennlig hilsen,", 42, y + 24)
      .font("Helvetica").text("Madina Skole", 42, y + 36);

    if (stempelPng) {
      doc.image(stempelPng, 42 + pageW - 88, y - 2, { width: 80, height: 80 });
    }

    y += 88;
    doc.moveTo(42, y).lineTo(42 + pageW, y).stroke("#e4edf6");
    y += 6;
    doc.fillColor("#7b8a93").fontSize(7.5).font("Helvetica")
      .text("Madina Skole · Hagelundveien 2b, 0963 Oslo · post@madinaskole.no", 42, y)
      .text(docRef, 42, y, { width: pageW, align: "right" });

    doc.end();
  });

  const filnavn = "Betalingsoversikt-" + filnavnSafe(elevNavn) + ".pdf";
  return { buffer, base64: buffer.toString("base64"), filnavn };
}

module.exports = { genererBetalingRapportPdf, fmtKr, kildePdfTekst };
