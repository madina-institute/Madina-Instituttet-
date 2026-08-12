/* SIST-ENDRET: 2026-08-12 16:31:31 */
// ═══════════════════════════════════════════════════════════════════
// LEVENDE PRISER — leses fra basen, ikke fra teksten.
//
// Uendret fra forsiden. Kildene er 'programs' og 'settings/priser' —
// de samme som panelet og Vipps regner med.
//
// 🔴 Feiler lesingen, vises INGEN pris — ikke et gammelt tall.
// ═══════════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import { getFirestore, collection, getDocs, doc, getDoc }
    from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

  const app = initializeApp({
    apiKey: "AIzaSyAvOgrnCLlZnfBZgIm1fLb0KxlTdvkLlsM",
    authDomain: "madina-instituttet.firebaseapp.com",
    projectId: "madina-instituttet",
    storageBucket: "madina-instituttet.firebasestorage.app",
    messagingSenderId: "174564736838",
    appId: "1:174564736838:web:033f873c8b420d4bc96f47"
  });
  const db = getFirestore(app);

  const PROGRAM_NAVN = {
    hoved: 'Madina Islamske Skole — Integrert program (Lørdag)',
    barn:  'Madinabarn (Søndag)'
  };

  window.__priser = null;

  const kr = v => Math.round(v).toLocaleString('no-NO');

  // Kalles fra tegnefunksjonen. Er prisene ikke lest ennå, sier den det
  // — i stedet for å vise et tall som kanskje ikke stemmer.
  window.levendePris = function(kode){
    const P = window.__priser;
    const tekst = (window.__sprak === 'ar')
      ? { henter: 'جارٍ التحميل…', ukjent: 'يُحدَّد عند القبول', per: 'سنويًا', medlem: 'للأعضاء' }
      : (window.__sprak === 'ur')
      ? { henter: 'لوڈ ہو رہا ہے…', ukjent: 'داخلے پر بتائی جائے گی', per: 'سالانہ', medlem: 'اراکین کے لیے' }
      : { henter: 'Henter…', ukjent: 'Oppgis ved opptak', per: 'per år', medlem: 'for medlemmer' };
    if(!P) return { belop: tekst.henter, per: '' };
    const p = P.programmer[PROGRAM_NAVN[kode]];
    if(!p || (!p.aar && !p.mnd)) return { belop: tekst.ukjent, per: '' };
    const medlemAar = p.mnd * p.maneder;
    // Begge prisene vises. Familien skal se hva medlemskapet er verdt,
    // ikke bare ett tall uten sammenligning.
    return {
      belop: kr(p.aar) + ' kr',
      per: tekst.per + (medlemAar > 0 && medlemAar < p.aar
        ? ' · ' + kr(medlemAar) + ' kr ' + tekst.medlem : '')
    };
  };

  // Notene sa «satsene er ikke fastsatt ennå» — men de ER fastsatt, og
  // materiellavgiften er ulik per program. Nå skrives de fra basen.
  window.levendeNoter = function(t){
    const P = window.__priser;
    const orig = (t.prisNoter || []).filter(x =>
      !/Rabatter|التخفيضات|رعایتیں|Bøker|الكتب|کتابیں|Depositum|العربون|ڈپازٹ/.test(x));
    if(!P) return orig;
    const ar = window.__sprak === 'ar', ur = window.__sprak === 'ur';
    const ut = [];

    if(P.rabatt2 || P.rabatt3){
      ut.push(ar
        ? `<b>التخفيضات:</b> خصم الإخوة ${P.rabatt2}% للطفل الثاني و${P.rabatt3}% للثالث فما بعده — لغير الأعضاء. يُطبَّق الخصم على البرنامج الأعلى سعرًا. سعر العضو والخصم لا يُجمعان.`
        : ur
        ? `<b>رعایتیں:</b> دوسرے بچے کے لیے ${P.rabatt2}% اور تیسرے سے ${P.rabatt3}% — غیر اراکین کے لیے۔ رعایت مہنگے پروگرام پر لاگو ہوتی ہے۔`
        : `<b>Rabatter:</b> Søskenrabatt ${P.rabatt2} % for barn nummer to og ${P.rabatt3} % fra og med det tredje — for familier som ikke er medlemmer. Rabatten legges på det dyreste programmet. Medlemspris og søskenrabatt kombineres ikke.`);
    }

    // Materiellavgiften kan være ulik per program — Madinabarn og det
    // integrerte programmet bruker ikke de samme bøkene.
    const mats = Object.entries(PROGRAM_NAVN).map(([k, navn]) => {
      const p = P.programmer[navn];
      const m = (p && p.materiell !== null && p.materiell !== undefined) ? p.materiell : P.materiell;
      return { navn, m };
    }).filter(x => x.m > 0);
    const like = mats.length && mats.every(x => x.m === mats[0].m);
    if(mats.length){
      ut.push(ar
        ? (like ? `<b>الكتب:</b> المواد الدراسية إضافية وتكلفتها ${kr(mats[0].m)} كرونة سنويًا.`
                : `<b>الكتب:</b> ` + mats.map(x => `${x.navn}: ${kr(x.m)} كرونة`).join(' · '))
        : ur
        ? `<b>کتابیں:</b> ${kr(mats[0].m)} کرونر سالانہ۔`
        : (like ? `<b>Bøker:</b> Skolemateriell kommer i tillegg og koster ${kr(mats[0].m)} kr per år.`
                : `<b>Bøker:</b> ` + mats.map(x => `${x.navn}: ${kr(x.m)} kr`).join(' · ')));
    }

    // Betalingen deles i terminer. Sto det ikke her, ville tallet i
    // skjemaet sett ut som en annen pris i stedet for samme pris delt.
    if(P.terminer > 1){
      const perTermin = Object.values(PROGRAM_NAVN)
        .map(n => P.programmer[n]).filter(p => p && p.aar);
      const eks = perTermin.length
        ? ' ' + perTermin.map(p => kr(Math.round(p.aar / P.terminer)) + ' kr').join(' / ') +
          (ar ? ' لكل قسط.' : ur ? ' فی قسط۔' : ' per termin.')
        : '';
      ut.push(ar
        ? `<b>الدفع:</b> المبلغ يُقسَّم على ${P.terminer} أقساط —${eks}`
        : ur
        ? `<b>ادائیگی:</b> رقم ${P.terminer} اقساط میں تقسیم ہوتی ہے —${eks}`
        : `<b>Betaling:</b> Beløpet deles i ${P.terminer} terminer —${eks}`);
    }

    if(P.depositum > 0){
      ut.push(ar
        ? `<b>العربون:</b> عند قبول الطالب يُدفع ${kr(P.depositum)} كرونة خلال ${P.depositumFrist || 5} أيام، ويُخصم من المبلغ الإجمالي.`
        : ur
        ? `<b>ڈپازٹ:</b> ${kr(P.depositum)} کرونر، ${P.depositumFrist || 5} دن کے اندر۔`
        : `<b>Depositum:</b> Ved tilbud om plass betales ${kr(P.depositum)} kr innen ${P.depositumFrist || 5} dager. Beløpet trekkes fra totalen.`);
    }
    return [...ut, ...orig];
  };

  async function lastPriser(){
    try{
      const snap = await getDocs(collection(db, 'programs'));
      const programmer = {};
      const tall = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
      snap.forEach(d => {
        const p = d.data();
        if(!p.navn || p.aktiv === 'Nei') return;
        const eget = String(p.materiellAvgift === undefined || p.materiellAvgift === null ? '' : p.materiellAvgift).trim();
        programmer[p.navn] = {
          aar: tall(p.prisAar),
          mnd: tall(p.prisMedlemMnd),
          maneder: tall(p.antallManeder) || 9,
          materiell: eget !== '' ? tall(eget) : null
        };
      });
      let d = {};
      try{
        const sn = await getDoc(doc(db, 'settings', 'priser'));
        if(sn.exists()) d = sn.data() || {};
      } catch(e){ /* rabattene er en bonus i visningen, ikke et krav */ }
      // 🔴 'terminer' MÅ leses her. Skjemaet deler årsprisen på den og
      // viser 2 750 kr per termin. Forsiden viste 5 500 og sa «per
      // semester» — to ulike tall for det samme, og feil ord på det ene.
      // Familien møtte 5 500 her og 2 750 der, uten noe som forklarte det.
      const ter = tall(d.terminer);
      window.__priser = {
        programmer,
        rabatt2: tall(d.soskenRabatt2), rabatt3: tall(d.soskenRabatt3),
        materiell: tall(d.materiellAvgift),
        depositum: tall(d.depositum), depositumFrist: tall(d.depositumFrist),
        terminer: ter >= 1 ? ter : 2
      };
    } catch(err){
      console.error('Kunne ikke hente priser', err);
      window.__priser = null;   // ingen pris er bedre enn feil pris
    }
    // Tegn på nytt med de ekte tallene.
    if(typeof window.__tegnAlt === 'function') window.__tegnAlt();
  }
  lastPriser();
