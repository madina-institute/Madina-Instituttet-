/* SIST-ENDRET: 2026-08-17 13:15:15 */
// ═══════════════════════════════════════════════════════════════════
// TIDSSTEMPLENE — to merker, nederst i hjørnet, på alle offentlige sider
//
// 🔴 Merket fantes ikke. index.html hadde både boksen og en fyldig
// kommentar om at det leses ved «?dev» — men koden sto ingen steder.
// Boksen viste tre punkter, og forsiden var den ene siden ingen kunne
// se om var oppdatert.
//
// Det skrives ÉN gang her, ikke i sju filer. Sju kopier av samme regel
// glir fra hverandre, og da er det ingen som merker det.
//
// Reglen:
//   første time etter endring  →  synlig for alle
//   etter det                  →  skjult
//   med ?dev i adressen        →  alltid synlig
//
// 🔴 Rekkefølgen er ikke tilfeldig. Stempelet leses FØRST, og bare hvis
// merkene faktisk skal vises, spørres GitHub om publiseringstiden. Ellers
// ville hver besøkende sin nettleser kontaktet GitHub ved hvert besøk —
// 263 besøk blir 263 kall til en tredjepart, for et merke ingen ser.
//
// ⚠️ Mangler stempelet, vises merket BARE med ?dev. Uten stempel finnes
// ingen time å regne fra, og alternativet — å vise en rød feilmelding
// til alle for alltid — er verre enn å være stille.
// ═══════════════════════════════════════════════════════════════════

// 🔴 Merkene står NEDERST PÅ SIDEN, ikke fastklistret i hjørnet.
//
// Første utgave la dem med position:fixed nede til høyre. De ble da
// liggende over innholdet hele veien — i skjemaet dekket de bunnteksten,
// og på en telefon er hjørnet nettopp der tommelen er. Et utviklermerke
// skal ikke stå i veien for det familien leser.
//
// Nå ligger de i enden av siden, midtstilt, som en del av innholdet: de
// ruller med, og man finner dem der man leter etter slikt — helt nederst.
// Samme plassering som i foreldreportalen, slik at de to ikke oppfører
// seg ulikt.
//
// ⚠️ index.html har allerede en <div id="devEditBadge"> i markupen, og
// felles.css gir den både display:none OG position:fixed. Fant vi den og
// brukte den som den var, ville forsiden fortsatt hatt et fastklistret
// merke — og faktisk ingenting, siden display:none aldri ble overstyrt.
// Derfor FLYTTES den inn i hyllen og får stilen satt her, som de andre.
// 🔴 Utgavemerket. Da merkene sluttet å virke, gikk det en halvtime med
// å finne ut HVILKEN stempler.js nettleseren egentlig kjørte: verktøyet
// sa 12:59, filen på nettstedet sa 12:46, og det var ingen måte å se det
// på uten å åpne selve filen og lese kommentarene.
//
// Med «?dev» står utgaven nå i merket. Ett blikk svarer på spørsmålet.
const STEMPLER_UTGAVE = 'B2';

function stempelHylle(){
  let hylle = document.getElementById('devStempelHylle');
  if(hylle) return hylle;
  hylle = document.createElement('div');
  hylle.id = 'devStempelHylle';
  hylle.style.cssText = 'display:block; margin:20px auto 8px; text-align:center;' +
    'padding-bottom:calc(8px + env(safe-area-inset-bottom, 0px)); width:100%;';
  document.body.appendChild(hylle);
  return hylle;
}

function stempelPille(id){
  const hylle = stempelHylle();
  let el = document.getElementById(id);
  if(!el){
    el = document.createElement('div');
    el.id = id;
  }
  if(el.parentNode !== hylle) hylle.appendChild(el);
  // Stilen settes her, ikke i felles.css — da gjelder den også for boksen
  // som lå i markupen fra før, og skjemaet slipper å laste et stilark.
  el.style.cssText = "position:static; display:inline-block; margin:3px 4px;" +
    "font-family:'Jost',sans-serif,Arial,sans-serif; font-size:10.5px; color:#6a7870;" +
    'background:rgba(255,255,255,0.92); padding:4px 10px; border-radius:20px;' +
    'border:1px solid rgba(0,0,0,0.08); pointer-events:none; letter-spacing:.01em;' +
    'max-width:92vw; white-space:normal;';
  return el;
}

function visStempler(){
  const dev = new URLSearchParams(location.search).has('dev');
  const EN_TIME = 60 * 60 * 1000;

  fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.text())
    .then(txt => {
      const m = txt.match(/SIST-ENDRET:\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);

      if(!m){
        if(!dev) return;
        const el = stempelPille('devEditBadge');
        el.style.display = 'inline-block';
        el.style.color = '#a5504a';
        el.textContent = '✏️ Uten tidsstempel — publisert utenom verktøyet';
        visUtlegging();
        return;
      }

      const endret = new Date(m[1].replace(' ', 'T'));
      const fersk = (Date.now() - endret.getTime()) < EN_TIME;
      if(!fersk && !dev) return;   // ingen merker, og ingen kall til GitHub

      const el = stempelPille('devEditBadge');
      el.style.display = 'inline-block';
      el.textContent = '✏️ Sist endret: ' +
        endret.toLocaleDateString('no-NO') + ' kl. ' +
        endret.toLocaleTimeString('no-NO', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) +
        (dev ? '  ·  merker ' + STEMPLER_UTGAVE : '');
      visUtlegging();
    })
    .catch(() => {
      if(!dev) return;
      const el = stempelPille('devEditBadge');
      el.style.display = 'inline-block';
      el.style.color = '#a5504a';
      el.textContent = '✏️ Kunne ikke lese tidsstempel';
    });
}

// Når nettstedet sist ble lagt ut. Hentet fra siste VELLYKKEDE kjøring av
// den GitHub Action-en som utfører Firebase-publiseringen — samme kilde som
// portalene bruker, slik at de to aldri kan si ulike ting.
//
// Er de to merkene like, ble siden endret i siste utlegging. Er de ulike,
// har siden stått uendret en stund — og er utleggingen NYERE enn endringen
// uten at siden ser oppdatert ut, ligger feilen et annet sted enn i filen.
function visUtlegging(){
  const el = stempelPille('devDeployBadge');
  el.style.display = 'inline-block';
  el.textContent = '⏳ Sjekker siste publisering…';
  fetch('https://api.github.com/repos/madina-institute/Madina-Instituttet-' +
        '/actions/workflows/firebase-hosting.yml/runs?status=success&per_page=1')
    .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => {
      const kj = data && data.workflow_runs;
      if(!Array.isArray(kj) || kj.length === 0) throw new Error('ingen vellykket publisering');
      const d = new Date(kj[0].updated_at || kj[0].created_at);
      el.textContent = '✓ Siste publisering: ' +
        d.toLocaleDateString('no-NO') + ' kl. ' +
        d.toLocaleTimeString('no-NO', { hour:'2-digit', minute:'2-digit' });
    })
    .catch(err => {
      el.textContent = '✓ Siste publisering: kunne ikke sjekke (' +
        (err && err.message ? err.message : 'nettverksfeil') + ')';
      el.style.color = '#a5504a';
    });
}

// Kalles av felles.js på de offentlige sidene, og direkte av
// påmeldingsskjemaet — som ikke laster de felles filene.
window.visStempler = visStempler;
