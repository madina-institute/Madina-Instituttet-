/* SIST-ENDRET: 2026-08-12 21:43:46 */
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

  // Etikettene for alle fire språk ett sted. Sto de som en kjede av
  // ternærer, måtte hvert nytt språk flettes inn tre steder i denne
  // filen — og det fjerde ville før eller siden blitt glemt ett av dem.
  // Ordene er skjemaets egne. Familien møter dem to steder og skal
  // kjenne igjen de samme uttrykkene begge steder.
  const ETIKETT = {
    no: { henter:'Henter…', ukjent:'Prisen oppgis ved opptak.',
          ordinar:'Ordinær pris', medlem:'★ Medlemspris',
          perTermin:'kr per termin', terminer:'terminer',
          perMnd:'kr per måned', maneder:'måneder',
          sparer:(b)=>`Du sparer ${b} kr i året`,
          boker:(b)=>`Bøker og materiell: <strong>${b} kr per år</strong> i tillegg.`,
          bokerUkjent:'Bøker og materiell kommer i tillegg.',
          sosken:'Søskenrabatt', soskenSub:'For familier som ikke er medlemmer',
          barn1:'1. barn', barn2:'2. barn', barn3:'3. barn +', fullpris:'Full pris',
          soskenNote:'Rabatten legges på det dyreste programmet, slik at familien sparer mest.<br><br><strong>Søskenrabatt og medlemspris kombineres ikke.</strong> Medlemsprisen er allerede den laveste — uansett hvor mange barn familien har, og uansett hvilket program.',
          depositum:(b,d)=>`<b>Depositum:</b> Ved tilbud om plass betales ${b} kr innen ${d} dager. Beløpet trekkes fra totalen.` },
    ar: { henter:'جارٍ التحميل…', ukjent:'يُحدَّد السعر عند القبول.',
          ordinar:'السعر العادي', medlem:'★ سعر العضو',
          perTermin:'kr لكل قسط', terminer:'قسطين',
          perMnd:'kr شهريًا', maneder:'شهرًا',
          sparer:(b)=>`توفّر ${b} kr في السنة`,
          boker:(b)=>`الكتب والمواد: <strong>${b} kr سنويًا</strong> إضافة إلى ما سبق.`,
          bokerUkjent:'الكتب والمواد غير مشمولة.',
          sosken:'خصم الإخوة', soskenSub:'للعائلات غير الأعضاء',
          barn1:'الطفل الأول', barn2:'الطفل الثاني', barn3:'الثالث فما بعده', fullpris:'السعر الكامل',
          soskenNote:'يُطبَّق الخصم على البرنامج الأعلى سعرًا، لتوفّر العائلة أكبر قدر.<br><br><strong>خصم الإخوة وسعر العضو لا يُجمعان.</strong> سعر العضو هو الأقل أصلًا — مهما كان عدد الأطفال ومهما كان البرنامج.',
          depositum:(b,d)=>`<b>العربون:</b> عند عرض المقعد يُدفع ${b} kr خلال ${d} أيام، ويُخصم من الإجمالي.` },
    ur: { henter:'لوڈ ہو رہا ہے…', ukjent:'قیمت داخلے پر بتائی جائے گی۔',
          ordinar:'عام قیمت', medlem:'★ رکن قیمت',
          perTermin:'kr فی قسط', terminer:'اقساط',
          perMnd:'kr ماہانہ', maneder:'ماہ',
          sparer:(b)=>`آپ سال میں ${b} kr بچاتے ہیں`,
          boker:(b)=>`کتابیں اور مواد: <strong>${b} kr سالانہ</strong> اضافی۔`,
          bokerUkjent:'کتابیں اور مواد شامل نہیں۔',
          sosken:'بہن بھائی رعایت', soskenSub:'غیر رکن خاندانوں کے لیے',
          barn1:'پہلا بچہ', barn2:'دوسرا بچہ', barn3:'تیسرا اور آگے', fullpris:'پوری قیمت',
          soskenNote:'رعایت مہنگے پروگرام پر لاگو ہوتی ہے تاکہ خاندان زیادہ سے زیادہ بچائے۔<br><br><strong>بہن بھائی رعایت اور رکن قیمت اکٹھی نہیں ہوتیں۔</strong> رکن قیمت پہلے ہی سب سے کم ہے۔',
          depositum:(b,d)=>`<b>ڈپازٹ:</b> جگہ کی پیشکش پر ${d} دن کے اندر ${b} kr ادا کیے جاتے ہیں، جو کل رقم سے منہا ہوتے ہیں۔` }
  };

  // Kalles fra tegnefunksjonen. Er prisene ikke lest ennå, sier den det
  // — i stedet for å vise et tall som kanskje ikke stemmer.
  window.levendePris = function(kode){
    const P = window.__priser;
    const E = ETIKETT[window.__sprak] || ETIKETT.no;
    if(!P) return `<div class="pk-fot" style="border:0;">${E.henter}</div>`;

    const p = P.programmer[PROGRAM_NAVN[kode]];
    if(!p || (!p.aar && !p.mnd))
      return `<div class="pk-fot" style="border:0;">${E.ukjent}</div>`;

    // Nøyaktig samme regnestykke som i skjemaet: årsprisen delt på
    // antall terminer. Ikke et annet tall — det SAMME tallet.
    const perTermin = P.terminer > 1 ? Math.round(p.aar / P.terminer) : p.aar;
    const medlemAar = p.mnd * p.maneder;
    const sparer = p.aar - medlemAar;
    const mat = (p.materiell === null || p.materiell === undefined)
      ? (P.materiell || 0) : p.materiell;

    return `
      <div class="pk-priser">
        <div class="pk-pris">
          <div class="pk-etikett">${E.ordinar}</div>
          <div class="pk-tall">${kr(perTermin)}</div>
          <div class="pk-enhet">${E.perTermin}${P.terminer > 1 ? ' · ' + P.terminer + ' ' + E.terminer : ''}</div>
        </div>
        ${p.mnd ? `
        <div class="pk-pris medlem">
          <div class="pk-etikett">${E.medlem}</div>
          <div class="pk-tall">${kr(p.mnd)}</div>
          <div class="pk-enhet">${E.perMnd} · ${p.maneder} ${E.maneder}</div>
          ${sparer > 0 ? `<div class="pk-spar">${E.sparer(kr(sparer))}</div>` : ''}
        </div>` : ''}
      </div>
      <div class="pk-fot">${mat > 0 ? E.boker(kr(mat)) : E.bokerUkjent}</div>`;
  };

  // Avgiftsboksen på forsiden. Viser terminprisen for hovedprogrammet —
  // det samme tallet skjemaet viser, hentet fra samme sted.
  window.levendeAvgift = function(){
    const P = window.__priser;
    const E = ETIKETT[window.__sprak] || ETIKETT.no;
    if(!P) return E.henter;
    const p = P.programmer[PROGRAM_NAVN.hoved];
    if(!p || !p.aar) return E.ukjent;
    const perTermin = P.terminer > 1 ? Math.round(p.aar / P.terminer) : p.aar;
    return kr(perTermin) + ' ' + E.perTermin.replace(/^kr\s*/, 'kr ');
  };

  // Søskenrabatten er et eget kort i skjemaet, ikke en setning blant
  // andre. Den gjelder på tvers av programmene og fortjener samme plass.
  window.levendeSosken = function(){
    const P = window.__priser;
    const E = ETIKETT[window.__sprak] || ETIKETT.no;
    if(!P || (!P.rabatt2 && !P.rabatt3)) return '';
    return `
      <div class="sosken">
        <h3>${E.sosken}</h3>
        <div class="s-sub">${E.soskenSub}</div>
        <div class="s-rad">
          <div class="s-boks"><div class="s-barn">${E.barn1}</div><div class="s-pst s-full">${E.fullpris}</div></div>
          <div class="s-boks"><div class="s-barn">${E.barn2}</div><div class="s-pst">−${P.rabatt2} %</div></div>
          <div class="s-boks"><div class="s-barn">${E.barn3}</div><div class="s-pst">−${P.rabatt3} %</div></div>
        </div>
        <div class="s-note">${E.soskenNote}</div>
      </div>`;
  };

  window.levendeNoter = function(t){
    const P = window.__priser;
    const E = ETIKETT[window.__sprak] || ETIKETT.no;
    // De innskrevne notene i innhold.js fjernes: rabatt, bøker, termin
    // og depositum kommer alle fra basen nå. Blir de stående, står de
    // samme opplysningen to steder — og det ene stedet er alltid det
    // som blir glemt.
    const orig = (t.prisNoter || []).filter(x =>
      !/Rabatter|التخفيضات|رعایتیں|Bøker|الكتب|کتابیں|Depositum|العربون|ڈپازٹ|Betaling|الدفع|ادائیگی/.test(x));
    if(!P) return orig;

    const ut = [];
    // Rabatt og bøker står nå i selve priskortet og i søskenkortet,
    // der de hører hjemme. Her blir bare depositumet igjen — det er
    // en frist, ikke en pris, og hører ikke inne i kortet.
    if(P.depositum > 0)
      ut.push(E.depositum(kr(P.depositum), P.depositumFrist || 5));

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
