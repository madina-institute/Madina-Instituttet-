// ═══════════════════════════════════════════════════════════════════
// sjekk-sider.mjs — KJØRES FØR LEVERING, ikke etter.
//
// Denne finnes fordi den samme feilen har tatt siden tre ganger:
//   currentLang   — udefinert variabel
//   escapeHtml    — funksjon som het esc() i filen den ble hentet fra
//   bokListe      — element som ikke fantes i HTML-en
//
// Alle tre stanset opptegningen MIDT I, og alt etter linjen ble stående
// tomt. `node --check` fanger ingen av dem: den leser formen, ikke
// kjøringen.
//
// Denne KJØRER tegnefunksjonene mot hver sides faktiske id-er, på alle
// tre språk, og faller hvis noe blir tomt eller inneholder «undefined».
//
//   node sjekk-sider.mjs
// ═══════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync } from 'fs';

const les = f => readFileSync(new URL(f, import.meta.url), 'utf8');

// Hvilke id-er hver side faktisk har. Leses ut av HTML-en, ikke skrevet
// inn her — ellers ville listen sagt noe annet enn filen.
function idErI(html){
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
}

const sider = readdirSync(new URL('.', import.meta.url))
  .filter(f => f.endsWith('.html'));

if(sider.length === 0){ console.error('Fant ingen .html-filer.'); process.exit(1); }

// Et minimalt DOM: nok til at felles.js kan kjøre uten nettleser.
function lagDom(ider){
  const skrevet = new Map();
  return {
    skrevet,
    document: {
      getElementById(id){
        if(!ider.has(id)) return null;
        const el = {
          _id: id,
          set textContent(v){ skrevet.set(id, String(v)); },
          set innerHTML(v){ skrevet.set(id, String(v)); },
          setAttribute(){}, classList: { toggle(){} }, style: {},
          set alt(v){ skrevet.set(id, String(v)); }
        };
        return el;
      }
    }
  };
}

const innhold = les('./innhold.js');
const felles  = les('./felles.js');

// Id-ene felles.js faktisk skriver til — hentet ut av koden, ikke
// skrevet inn her. Legges et nytt avsnitt til, følger listen med av seg
// selv.
const maalIder = new Set([
  ...[...felles.matchAll(/\bsett(?:Html)?\(\s*'([^']+)'/g)].map(m => m[1]),
  'stedBilde', 'medlemsKort'
]);
if(maalIder.size < 10){ console.error('Fant nesten ingen mål-id-er i felles.js — sjekk uttrykket.'); process.exit(1); }

let feil = 0;

for(const fil of sider){
  const html = les('./' + fil);
  const ider = idErI(html);

  for(const lang of ['no','ar','ur']){
    const dom = lagDom(ider);
    const sandbox = {
      document: dom.document,
      navigator: { userAgent: '' },
      localStorage: { getItem: () => lang, setItem(){} },
      window: {}
    };
    sandbox.window = sandbox;

    try{
      const fn = new Function('document','navigator','localStorage','window',
        innhold + '\n' + felles + '\n; switchLang(' + JSON.stringify(lang) + ');');
      fn(sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.window);
    }catch(err){
      console.error(`✗ ${fil} [${lang}] KASTET: ${err.message}`);
      feil++; continue;
    }

    // Sjekken går på SNITTET: id-er som både står i HTML-en og som
    // felles.js vet hvordan den skal fylle. Rene ankre (section id="priser")
    // skal ikke tegnes, og skal derfor ikke telle som mangel.
    const tomme = [];
    for(const id of ider){
      if(!maalIder.has(id)) continue;
      const v = dom.skrevet.get(id);
      if(v === undefined) tomme.push(id + ' (aldri tegnet)');
      else if(v.trim() === '') tomme.push(id + ' (tom)');
      else if(v.includes('undefined')) tomme.push(id + ' (inneholder undefined)');
    }

    if(tomme.length){
      console.error(`✗ ${fil} [${lang}] — ${tomme.length} problem:`);
      tomme.forEach(x => console.error('     ' + x));
      feil++;
    } else {
      console.log(`✓ ${fil} [${lang}]  ${ider.size} elementer tegnet`);
    }
  }
}

// Versjonsnummeret på script-taggene må følge med når de felles filene
// endres — ellers viser nettleseren gammel tekst på en side som ser
// nyoppdatert ut, og stempelsystemet merker ingenting.
for(const fil of sider){
  const html = les('./' + fil);
  const v = [...html.matchAll(/\?v=([0-9-]+)/g)].map(m => m[1]);
  if(new Set(v).size > 1){
    console.error(`✗ ${fil} — ulike ?v= på samme side: ${[...new Set(v)].join(', ')}`);
    feil++;
  }
}

console.log(feil ? `\n${feil} feil.` : '\nAlt tegnet.');
process.exit(feil ? 1 : 0);
