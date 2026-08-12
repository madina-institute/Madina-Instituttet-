/* SIST-ENDRET: 2026-08-12 18:49:03 */
// ═══════════════════════════════════════════════════════════════════
// FELLES — toppbar, bunn, språkbytte og alle tegnefunksjoner.
//
// 🔴 HVER TEGNING GÅR GJENNOM sett() OG settHtml().
//
// Bakgrunnen: forsiden kalte getElementById('bokListe') på et element
// som ikke fantes, og hele opptegningen stoppet MIDT I. Alt før linjen
// ble tegnet, alt etter ble stående tomt — priser, om oss, team,
// portaler, bunn. Ingen feilmelding noe sted.
//
// Med undersider blir dette regelen, ikke unntaket: /priser HAR ingen
// bokliste, og /program har ingen prisbokser. En felles tegnefunksjon
// som krever at alt finnes, ville stoppet på hver eneste side.
//
// Derfor: finnes ikke elementet, hopper vi over det og går videre.
// Det er ikke en feil — det er en side som ikke har det avsnittet.
// ═══════════════════════════════════════════════════════════════════

function sett(id, tekst){
  const el = document.getElementById(id);
  if(el) el.textContent = tekst;
}
function settHtml(id, html){
  const el = document.getElementById(id);
  if(el) el.innerHTML = html;
}

  function bildeHtml(nokkel, lang){
    const b = KORTBILDER[nokkel];
    if(!b) return '';
    const alt = (b.alt[lang] || b.alt.no).replace(/"/g, '&quot;');
    // <picture> gir webp der nettleseren støtter det og jpg ellers.
    // loading=lazy: bildene ligger langt nede på siden, og skal ikke
    // stjele båndbredde fra det familien leser først.
    return `<picture>
      <source srcset="${b.fil}.webp" type="image/webp">
      <img class="kort-bilde" src="${b.fil}${b.fil === 'koranstudier' ? '.jpeg' : '.jpg'}" alt="${alt}"
           loading="lazy" decoding="async" width="1200" height="800">
    </picture>`;
  }
  // 🔴 escapeHtml fantes ikke i denne filen. Den ble brukt fem steder i
  // bokListeHtml — hentet fra den frittstående siden, der den het esc().
  //
  // Følgen var en ReferenceError midt i opptegningen: alt FØR feilen ble
  // tegnet, alt ETTER forsvant. Team, Portaler og bunnen var borte, og
  // det eneste sporet var en linje i en konsoll ingen har åpen.
  //
  // Nøyaktig samme feil som currentLang tok i går. Sjekken sjekk-udefinert.py
  // finner denne typen — den må kjøres FØR levering, ikke etter.
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Bøkene tegnes under fagkortene, i samme seksjon. Emojiene fra FAG
  // brukes ikke her — kortene over har dem allerede, og to sett ikoner
  // om det samme leses som to ulike lister.
  function bokListeHtml(t, lang){
    return FAG.map(f => `
      <div class="bok-blokk">
        <div class="bok-hode">
          <h3>${escapeHtml(t.bokFag[f.id].h)}</h3>
          <p>${escapeHtml(t.bokFag[f.id].p)}</p>
        </div>
        ${f.boker.map(b => `
          <div class="bok-rad">
            ${b.fil ? `<picture>
                <source srcset="${b.fil}.webp" type="image/webp">
                <img src="${b.fil}.jpg" alt="${escapeHtml(b.tittel)}" loading="lazy" decoding="async">
              </picture>` : ''}
            <div class="bok-info">
              <h4>${escapeHtml(b.tittel)}</h4>
              ${b.niva ? `<div class="bok-niva">${escapeHtml(b.niva)}</div>` : ''}
              <p>${t.bokTekst[b.n]}</p>
              ${b.video ? `<p style="margin-top:8px;"><a href="${MUTAMMIM_VIDEO_URL}" target="_blank" rel="noopener">${escapeHtml(t.bokVideo)}</a></p>` : ''}
            </div>
          </div>`).join('')}
      </div>`).join('');
  }

  function cardsHtml(list, lang){
    return list.map(c => `<div class="card${c.bilde ? ' med-bilde' : ''}">${
      c.bilde ? bildeHtml(c.bilde, lang) : `<div class="ic">${c.ic}</div>`
    }<div class="kort-tekst"><h3>${c.h}</h3><p>${c.p}</p>${c.video ? `<p style="margin-top:10px;"><a href="${MUTAMMIM_VIDEO_URL}" target="_blank" rel="noopener" style="color:var(--emerald-d); text-decoration:none; font-weight:700;">${c.video}</a></p>` : ''}</div></div>`).join('');
  }
  function stepsHtml(list){ return list.map((s,i) => `<div class="step-card"><div class="step-num">${i+1}</div><h3>${s.h}</h3><p>${s.p}</p></div>`).join(''); }
  function datesHtml(list){ return list.map((d,i) => `<div class="date-card tone-${(i%3)+1}"><span class="when">${d.h}</span><h3>${d.h}</h3><p>${d.p}</p></div>`).join(''); }
  function mvpHtml(list){ return list.map(m => `<div class="mvp-card"><div class="eyebrow">${m.eyebrow}</div><h3>${m.h}</h3><p>${m.p}</p></div>`).join(''); }
  function teamHtml(list){
    return list.map(t => {
      const initials = t.n.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
      return `<div class="team-card"><div class="team-avatar">${initials}</div><h3>${t.n}</h3><div class="role">${t.r}</div></div>`;
    }).join('');
  }
  function portalsHtml(list){ return list.map(p => `<a class="portal-card" href="${p.href}"><div class="ic">${p.ic}</div><div class="title">${p.h}</div><div class="desc">${p.p}</div></a>`).join(''); }
  function quickFactsHtml(list){ return list.map(f => `<span class="quick-fact">${f.l}<b>${f.v}</b></span>`).join(''); }
  // To rader à fire felt, ikke åtte i én.
  //
  // Åtte felt på en telefonskjerm gir under 45 piksler hver — smalere enn
  // ordene som skal stå der. Og de arabiske og urdu-ordene er lengre enn
  // de norske, så en bredde som så vidt holder på norsk, kutter teksten
  // på de to andre språkene.
  //
  // Rekkefølgen er ikke tilfeldig: øverste rad er det en familie som ikke
  // kjenner skolen leter etter — meld på, når, hvilke timer, hva slags
  // program. Nederste rad er det man ser på etterpå.
  // ═══════════════════════════════════════════════════════════════
  // 🔴 ANKRE VIRKER BARE PÅ FORSIDEN.
  //
  // Lenkene het '#priser', '#program', '#team'. På forsiden ruller de
  // dit. På /priser peker de på avsnitt som ikke finnes der — sju av
  // åtte knapper gjorde ingenting, og det fantes ingen vei tilbake til
  // forsiden i det hele tatt.
  //
  // '/#priser' virker begge steder: på forsiden ruller nettleseren som
  // før, uten ny lasting; fra en underside går den til forsiden og
  // ruller. Når /priser og /program finnes som egne sider, byttes
  // '/#priser' ut med '/priser' — én linje per side.
  // ═══════════════════════════════════════════════════════════════
  function navHtml(t){
    const rad = (lenker) => '<div class="nav-rad">' +
      lenker.map(([href, tekst]) => `<a href="${href}">${tekst}</a>`).join('') + '</div>';
    return rad([
      ['/#register', t.nav.register],
      ['/#dates',    t.nav.dates],
      ['/timeplan',  t.nav.timeplan],
      ['/#program',  t.nav.program]
    ]) + rad([
      ['/priser',    t.nav.priser],
      ['/#who',      t.nav.who],
      ['/#team',     t.nav.team],
      ['/#portals',  t.nav.portals]
    ]);
  }



  // Medlemskortet. Står under prisene fordi det svarer på spørsmålet
  // prisene reiser: hvordan får vi den laveste?
  //
  // 🔴 Advarselen om ett medlemskap er ikke en detalj. Norsk lov gir
  // tilskudd per medlem, og ingen kan telles i to trossamfunn. Melder
  // familien seg inn her uten å melde seg ut der de sto, får det andre
  // stedet tilskudd for et medlem det ikke har — og skolen har medvirket.
  function tegnMedlemskort(t){
    const el = document.getElementById('medlemsKort');
    if(!el) return;
    const m = MEDLEM_TEKST[window.__sprak] || MEDLEM_TEKST.no;
    el.innerHTML = `
      <div class="medlem-kort">
        <div class="medlem-tittel">${m.tittel}</div>
        <p class="medlem-brod">${m.brod}</p>
        <p class="medlem-brod">${m.rekkefolge}</p>
        <div class="medlem-advarsel">
          <b>${m.advarselTittel}</b><br>${m.advarsel}
        </div>
        <div class="medlem-knapper">
          <a class="medlem-knapp primar" href="${MEDLEM_LENKER.familie}" target="_blank" rel="noopener">${m.knappFamilie}</a>
          <a class="medlem-knapp primar" href="${MEDLEM_LENKER.barn}" target="_blank" rel="noopener">${m.knappBarn}</a>
          <a class="medlem-knapp" href="${MEDLEM_LENKER.info}">${m.knappInfo}</a>
        </div>
        <div class="medlem-moske">${m.moske}<a href="${MEDLEM_LENKER.moske}" target="_blank" rel="noopener">madina.no</a></div>
      </div>`;
  }

  function quickFactsHtml(list){
    return (list || []).map(f => `<span class="quick-fact">${f.l}<b>${f.v}</b></span>`).join('');
  }

// ═══════════════════════════════════════════════════════════════════
// SPRÅKBYTTE — ett nøkkelord, ikke to.
//
// 🔴 Forsiden skrev til BÅDE 'madina_lang' og 'madinaHomeLang', og leste
// bare den siste. Så lenge alt sto på én side, merket ingen det.
//
// Med undersider blir det et hull: velger en familie arabisk på /priser
// og åpner /program, ville siden kommet opp på norsk igjen. Derfor ett
// nøkkelord — det samme som Læremidler-siden allerede bruker.
// ═══════════════════════════════════════════════════════════════════
const SPRAAK_NOKKEL = 'madina_lang';

function lesSpraak(){
  try{
    const s = localStorage.getItem(SPRAAK_NOKKEL);
    return (s === 'ar' || s === 'ur' || s === 'no') ? s : 'no';
  }catch(e){ return 'no'; }   // privat modus
}

function switchLang(lang){
  try{ localStorage.setItem(SPRAAK_NOKKEL, lang); }catch(e){}
  window.__sprak = lang;
  window.__tegnAlt = () => switchLang(lang);
  const t = TEXT[lang];
  const isRtl = (lang === 'ar' || lang === 'ur');

  const rot = document.getElementById('htmlRoot');
  if(rot){ rot.setAttribute('lang', lang); rot.setAttribute('dir', isRtl ? 'rtl' : 'ltr'); }
  ['no','ar','ur'].forEach(k => {
    const b = document.getElementById('btnLang' + k.charAt(0).toUpperCase() + k.slice(1));
    if(b) b.classList.toggle('active', lang === k);
  });

  // ---- felles topp og bunn (finnes på alle sider) ----
  sett('bannerText', t.bannerText);
  sett('bannerClose', t.bannerClose);
  sett('brandText', t.brand);
  settHtml('topbarLinks', navHtml(t));

  sett('footerBrand', t.footerBrand);
  sett('footerAddr', t.footerAddr);
  sett('footerContact', t.footerContact);
  sett('footerOrgNr', t.footerOrgNr);
  sett('footerPrivacy', t.footerPrivacy);
  sett('footerCopy', t.footerCopy);

  // ---- forside: hero og avgiftsboks ----
  // Sidetittelen står i innhold.js, ikke i <title>. En underside setter
  // sin egen i HTML-en og har ingen 'pageTitle' — da hopper sett() over.
  sett('pageTitle', t.pageTitle);
  sett('heroBadge', t.heroBadge);
  sett('heroTitle', t.heroTitle);
  sett('heroYear', t.heroYear);
  sett('heroLead', t.heroLead);
  settHtml('quickFacts', quickFactsHtml(t.quickFacts));
  sett('heroBtnPrimary', t.heroBtnPrimary);
  sett('heroBtnOutline', t.heroBtnOutline);
  settHtml('tuitionBox', t.tuitionTag ? `
      <div class="tag">${t.tuitionTag}</div>
      <div class="amt">${t.tuitionAmt}</div>
      <div class="sub">${t.tuitionSub}</div>
      <ul>${(t.tuitionList || []).map(i => '<li>' + i + '</li>').join('')}</ul>
      <a class="btn btn-primary" href="/påmelding">${t.tuitionBtn}</a>` : '');

  // ---- avsnitt: tegnes bare der de finnes ----
  sett('regEyebrow', t.regEyebrow); sett('regTitle', t.regTitle); sett('regDesc', t.regDesc);
  settHtml('stepsRow', stepsHtml(t.steps));

  sett('datesEyebrow', t.datesEyebrow); sett('datesTitle', t.datesTitle);
  sett('datesDesc', t.datesDesc); sett('datesTimeplanBtn', t.datesTimeplanBtn);
  settHtml('datesRow', datesHtml(t.dates));

  sett('programEyebrow', t.programEyebrow); sett('programTitle', t.programTitle);
  sett('programDesc', t.programDesc);
  settHtml('programCards', cardsHtml(t.programCards, lang));
  settHtml('bokListe', bokListeHtml(t, lang));

  sett('prisEyebrow', t.prisEyebrow); sett('prisTitle', t.prisTitle); sett('prisDesc', t.prisDesc);
  settHtml('prisCards', prisKortHtml(t));
  settHtml('prisNoter', prisNoterHtml(t));
  tegnMedlemskort(t);

  sett('whoEyebrow', t.whoEyebrow); sett('whoTitle', t.whoTitle); sett('whoDesc', t.whoDesc);
  settHtml('mvpRow', mvpHtml(t.mvp));
  const sted = document.getElementById('stedBilde');
  if(sted) sted.alt = ({
    no:'Inngangen til Madina Institute og Senter Oslo i Hagelundveien 2b',
    ar:'مدخل معهد ومركز مدينة أوسلو في هاغلوندفايين 2b',
    ur:'ہیگلنڈوائن 2b میں مدینہ انسٹی ٹیوٹ اور سینٹر اوسلو کا داخلی دروازہ'
  })[lang] || 'Madina Institute og Senter Oslo';

  sett('teamEyebrow', t.teamEyebrow); sett('teamTitle', t.teamTitle); sett('teamDesc', t.teamDesc);
  settHtml('teamRow', teamHtml(t.team));

  sett('portalsEyebrow', t.portalsEyebrow); sett('portalsTitle', t.portalsTitle);
  sett('portalsDesc', t.portalsDesc);
  settHtml('portalCards', portalsHtml(t.portals));

  sett('ctaTitle', t.ctaTitle); sett('ctaDesc', t.ctaDesc); sett('ctaBtn', t.ctaBtn);
}

// 🔴 levendePris bor i prismodulen, som lastes som type="module" og
// derfor ALLTID kommer etter denne filen. Kalles den bar, er den
// udefinert i det første tegnepasset — ReferenceError, og siden stopper.
// Samme familie som bokListe. Derfor sjekkes den, og modulen tegner om
// selv når de ekte tallene er inne.
function prisKortHtml(t){
  return (t.prisKort || []).map(k => {
    const pris = (typeof window.levendePris === 'function')
      ? window.levendePris(k.kode)
      : { belop: '…', per: '' };
    return `
      <div class="pris-kort">
        <div class="pris-navn">${k.navn}</div>
        <div class="pris-dag">${k.dag}</div>
        <div class="pris-belop">${pris.belop}</div>
        <div class="pris-per">${pris.per}</div>
        <div class="pris-info">${k.info}</div>
      </div>`;
  }).join('');
}
function prisNoterHtml(t){
  const noter = (typeof window.levendeNoter === 'function')
    ? window.levendeNoter(t) : (t.prisNoter || []);
  return noter.map(x => `<div class="pris-note">${x}</div>`).join('');
}

// In-app-nettlesere (WhatsApp, Instagram) — samme varsel som forsiden.
function sjekkInAppBrowser(){
  const ua = navigator.userAgent || '';
    // 🔴 Uttrykket ble forkortet under flyttingen fra forsiden: Twitter,
  // LinkedInApp og Snapchat forsvant, og skråstreken i «Line/» også.
  // Uten skråstreken treffer «Line» hvilket som helst ord som
  // inneholder det — den sto der med vilje.
  if(/FBAN|FBAV|Instagram|WhatsApp|Line\/|Twitter|LinkedInApp|Snapchat/i.test(ua)){
    const b = document.getElementById('inAppBrowserBanner');
    if(b) b.style.display = 'block';
  }
}

// Kalles nederst på hver side.
window.startSide = function(){
  switchLang(lesSpraak());
  sjekkInAppBrowser();
};
window.switchLang = switchLang;
