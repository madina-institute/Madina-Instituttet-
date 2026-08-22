/* SIST-ENDRET: 2026-08-22 16:45:00 */
/**
 * Faktura — kategorier, dokumentreferanse, status.
 */
const FAKTURA_KATEGORIER = {
  skoleavgift: { label: "Skoleavgift", erDepositum: false },
  materiell: { label: "Materiell", erDepositum: false },
  boker: { label: "Bøker", erDepositum: false },
  depositum: { label: "Depositum (skoleplass)", erDepositum: true },
  annet: { label: "Annet", erDepositum: false },
};

function fakturaKategoriLabel(kategori) {
  return FAKTURA_KATEGORIER[kategori]?.label || FAKTURA_KATEGORIER.annet.label;
}

function erGyldigFakturaKategori(kategori) {
  return Boolean(FAKTURA_KATEGORIER[kategori]);
}

function osloDatoIso(d = new Date()) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Oslo" });
}

function addDaysIso(isoDate, days) {
  const base = new Date(isoDate + "T12:00:00");
  base.setDate(base.getDate() + Number(days || 0));
  return osloDatoIso(base);
}

async function allocateFakturaDokumentRef(db) {
  const datePart = osloDatoIso().replace(/-/g, "");
  const ref = db.collection("settings").doc("fakturaSeq");
  const seq = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const next = (Number(data[datePart]) || 0) + 1;
    tx.set(ref, { [datePart]: next, sistOppdatert: new Date().toISOString() }, { merge: true });
    return next;
  });
  return `FA-${datePart}-${String(seq).padStart(3, "0")}`;
}

function fakturaStatusFarge(inv, opts = {}) {
  const gulDager = Number(opts.gulVarselDager ?? 3);
  if (inv.status === "betalt") return "betalt";
  if (inv.status === "kansellert") return "kansellert";
  const frist = inv.betalingsfrist || "";
  if (!frist) return "ok";
  const today = osloDatoIso();
  if (today > frist) return "forfalt";
  const msPerDay = 86400000;
  const daysLeft = Math.round((new Date(frist + "T23:59:59").getTime() - Date.now()) / msPerDay);
  if (daysLeft <= gulDager) return "snart";
  return "ok";
}

module.exports = {
  FAKTURA_KATEGORIER,
  fakturaKategoriLabel,
  erGyldigFakturaKategori,
  osloDatoIso,
  addDaysIso,
  allocateFakturaDokumentRef,
  fakturaStatusFarge,
};
