/* SIST-ENDRET: 2026-08-20 23:45:00 */
/* ═══════════════════════════════════════════════════════════════════
   skoledager.js — ÉN kilde for spørsmålet «er dette en skoledag?»

   Regelen — programmets ukedag, minus ferie, pluss ekstradag — var
   skrevet tre steder: index4 (kalenderTreff/ferieFor/ekstradagFor),
   index1 (schoolDayInfo) og inne i admin uten eget navn. Den 15.
   august ble mangelen på «Ekstra undervisningsdag» rettet i ÉN av
   dem. Kopiene glir ikke fra hverandre ved et vedtak; de glir fra
   hverandre fordi noen retter én av dem.

   Derfor: ingen som leser denne filen skal måtte skrive regelen på
   nytt. Generatoren for undervisningsplanen kaller herfra — den blir
   ikke kopi nummer fire.

   ── TO SPØRSMÅL, IKKE ETT ────────────────────────────────────────
   dagStatus()        Er DENNE datoen en skoledag? Ekstradagen vinner.
                      For oppmøte, timeplan og portalene.
   skoledagerMellom() Gi meg dagene mellom to datoer. Avgrenset av
                      skoleåret, og ekstradager holdes UTENFOR
                      nevneren. For planen.

   Grunnen til det siste: legges en ekstra lørdag inn i januar, ville
   en plan som teller den fordelt alle kapitlene på nytt — og planen
   som ble delt ut i september sluttet å stemme, med tilbakevirkende
   kraft. En ekstradag settes nesten alltid opp FORDI noe gikk tapt.
   Den er oppsamling, ikke ny undervisningstid, og skal derfor stå
   uten fastsatt innhold.

   Å MISTE en dag forskyver fortsatt planen framover. Det er bare det
   å LEGGE TIL en dag som behandles motsatt.

   ── STATUS: FØRSTE GRUNN SOM GJELDER, I DENNE REKKEFØLGEN ────────
     1 ekstradag             manuelt vedtak — slår alt under seg
     2 utenfor-skolear       før startDato eller etter sluttDato
     3 ferie                 en Fri-rad i skolekalenderen dekker datoen
     4 ikke-undervisningsdag ikke en ukedag programmet underviser på
     5 undervisningsdag

   Merk at 2 står over 3: en dato i sommerferien rapporteres som
   'utenfor-skolear'. Etiketten følger LIKEVEL med fra kalenderraden,
   slik at foreldreportalen fortsatt kan skrive «Sommerferie» og ikke
   bare «utenfor skoleåret».

   ── PROGRAM: TRE UTFALL, IKKE TO ─────────────────────────────────
   Feltet 'program' på en kalenderrad kan være en id ELLER et navn.
   Feltet 'programmer' er en liste med id-er — raden gjelder alle i
   listen. Tom liste (eller begge feltene tomme) = alle programmer.
     treff   raden gjelder dette programmet
     alle    ingen programmer valgt — gjelder alle programmer
     annet   raden gjelder andre programmer enn dette
     ukjent  enkelt 'program'-felt peker på noe ukjent (legacy)

   'ukjent' gjelder INGEN — det er dagens oppførsel og beholdes. Men
   det finnes ingen trygg retning her: en ferierad som ikke treffer
   noen åpner skolen på en fridag, og en som treffer alle stenger den
   på en skoledag. Derfor velger vi ikke i stillhet — vi roper.
   Se avviksrapport() nederst; den hører hjemme i Helsesjekk.
   ═══════════════════════════════════════════════════════════════════ */

window.Skoledager = (function () {
  'use strict';

  var UKEDAGER = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

  var programmer = [];
  var skolekalender = [];
  var skolear = {};

  /* Modulen henter ingenting selv. Hver side laster Firebase på sin
     måte, og en modul som selv abonnerer ville blitt en fjerde måte.
     Sidene mater den i stedet — også ved hver onSnapshot. */
  function settData(d) {
    d = d || {};
    if (Array.isArray(d.programmer)) programmer = d.programmer;
    if (Array.isArray(d.skolekalender)) skolekalender = d.skolekalender;
    if (d.skolear && typeof d.skolear === 'object') skolear = d.skolear;
  }

  function iso(dateObj) {
    return dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0');
  }

  /* Lokale datofelter, aldri toISOString(). Den gir UTC, og om
     sommeren ligger Norge to timer foran — datoen ble en dag feil. */
  function lesDato(isoStr) {
    return new Date(String(isoStr) + 'T00:00:00');
  }

  /* Godtar id eller navn begge veier. */
  function finnProgram(idEllerNavn) {
    var v = String(idEllerNavn || '').trim();
    if (!v) return null;
    return programmer.find(function (p) {
      return p.id === v || String(p.navn || '').trim() === v;
    }) || null;
  }

  function programTreff(feltverdi, program) {
    var v = String(feltverdi || '').trim();
    if (!v) return 'alle';
    var rad = finnProgram(v);
    if (!rad) return 'ukjent';
    var mitt = finnProgram(program);
    if (!mitt) return 'ukjent';
    return rad.id === mitt.id ? 'treff' : 'annet';
  }

  function gjelderProgram(rad, program) {
    var liste = rad && rad.programmer;
    if (Array.isArray(liste)) {
      if (liste.length === 0) return 'alle';
      var mitt = finnProgram(program);
      if (!mitt) return 'ukjent';
      var treff = liste.some(function (id) {
        var p = finnProgram(id);
        return p && p.id === mitt.id;
      });
      return treff ? 'treff' : 'annet';
    }
    return programTreff(rad.program, program);
  }

  function ukedagerFor(program) {
    var p = finnProgram(program);
    var d = p && p.dager;
    if (Array.isArray(d)) return d;
    if (typeof d === 'string' && d.trim()) {
      return d.split(/[,;]/).map(function (x) { return x.trim(); }).filter(Boolean);
    }
    return [];
  }

  /* Radene som dekker datoen og gjelder programmet. Siste rad av hver
     type vinner — som før. */
  function kalenderTreff(datoIso, program) {
    var fri = null, ekstra = null;
    skolekalender.forEach(function (k) {
      var fra = k.fraDato || '';
      if (!fra) return;
      var til = k.tilDato || fra;
      if (datoIso < fra || datoIso > til) return;
      var t = gjelderProgram(k, program);
      if (t !== 'treff' && t !== 'alle') return;
      var type = String(k.type || '');
      if (type.indexOf('Fri') === 0) fri = k;
      if (type.indexOf('Ekstra') === 0) ekstra = k;
    });
    return { fri: fri, ekstra: ekstra };
  }

  function utenforSkolear(datoIso) {
    if (skolear.startDato && datoIso < skolear.startDato) return true;
    if (skolear.sluttDato && datoIso > skolear.sluttDato) return true;
    return false;
  }

  /* { status, label, ok } — ok er kun en snarvei for kallere som ikke
     bryr seg om grunnen. */
  function dagStatus(datoIso, program) {
    var treff = kalenderTreff(datoIso, program);
    var etikett = (treff.ekstra && treff.ekstra.beskrivelse) ||
                  (treff.fri && treff.fri.beskrivelse) || '';

    if (treff.ekstra) {
      return { status: 'ekstradag', label: etikett || 'Ekstra undervisningsdag', ok: true };
    }
    if (utenforSkolear(datoIso)) {
      return { status: 'utenfor-skolear', label: etikett, ok: false };
    }
    if (treff.fri) {
      return { status: 'ferie', label: etikett || 'Fri', ok: false };
    }
    var navn = UKEDAGER[lesDato(datoIso).getDay()];
    if (ukedagerFor(program).indexOf(navn) === -1) {
      return { status: 'ikke-undervisningsdag', label: '', ok: false };
    }
    return { status: 'undervisningsdag', label: '', ok: true };
  }

  /* Alle dagene mellom to datoer som det undervises på, hver med sin
     status. Ekstradager er MED i listen, men merket — kalleren ser
     dem og bestemmer selv. Generatoren tar bare 'undervisningsdag';
     årsplanen viser 'ekstradag' som oppsamlingsdag uten innhold.

     valg.utenforSkolear = true åpner for datoer utenfor skoleåret.
     Standard er av: planen skal ikke gli fordi noen skrev 2027 der
     det skulle stått 2026. */
  function skoledagerMellom(fraIso, tilIso, program, valg) {
    valg = valg || {};
    var ut = [];
    if (!fraIso || !tilIso || fraIso > tilIso) return ut;
    var d = lesDato(fraIso);
    var slutt = lesDato(tilIso);
    var vakt = 0;
    while (d <= slutt && vakt++ < 2000) {
      var dIso = iso(d);
      var info = dagStatus(dIso, program);
      if (info.ok) {
        if (info.status !== 'ekstradag' || valg.utenforSkolear || !utenforSkolear(dIso)) {
          ut.push({ dato: dIso, dag: UKEDAGER[d.getDay()], status: info.status, label: info.label });
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return ut;
  }

  /* Kun dagene planen skal fordeles på. Ekstradager holdes utenfor
     nevneren — se toppen av filen. */
  function planDager(fraIso, tilIso, program) {
    return skoledagerMellom(fraIso, tilIso, program).filter(function (d) {
      return d.status === 'undervisningsdag';
    });
  }

  /* Første skoledag fra og med fraIso. Leter maks 120 dager: er det
     lenger, er det ikke «neste time» — det er en ny sesong, og da er
     nedtellingen svaret i stedet. */
  function nesteSkoledag(fraIso, program) {
    var start = lesDato(fraIso || iso(new Date()));
    for (var i = 0; i < 120; i++) {
      var d = new Date(start.getTime() + i * 86400000);
      var dIso = iso(d);
      var info = dagStatus(dIso, program);
      if (info.ok) return { dato: dIso, dag: UKEDAGER[d.getDay()], status: info.status, label: info.label };
      /* Vi stopper IKKE på sluttDato slik index4 gjorde: der lå testen
         før oppslaget av ekstradagen, så en oppsamlingsdag i juni var
         usynlig — mens den samme dagen før skolestart ble sett.
         Start og slutt behandles nå likt. */
    }
    return null;
  }

  /* Kompatibilitetsform for portalenes egen schoolDayInfo(iso, allowed).
     Signaturen beholdes så index1 ikke må skrives om.

     ⚠️ Denne gjør med vilje BARE halve jobben: den henter kalenderen
     herfra — det er der feilen lå, siden index1 bare tålte program-id
     og ikke navn — men lar ukedagene være kallerens ansvar.

     Grunnen: index1s getAllowedWeekdays() har tre nivåer av reserve.
     Finnes ingen programpost, leser den ukedagene ut av selve
     programnavnet. Tok vi ukedagene fra programkortets 'dager' i
     stedet, ville en klasse uten programpost stått igjen med null
     undervisningsdager — en tom skjerm, uten feilmelding.

     Skoleårets grenser følger samme rekkefølge som dagStatus(): ekstra
     vinner, deretter utenfor-skolear, ferie, ukedag. Uten det kunne
     læreren registrere oppmøte og timer på lørdager før skolestart. */
  function schoolDayInfo(datoIso, allowed, program) {
    var treff = kalenderTreff(datoIso, program || '');
    var ok = Array.isArray(allowed) && allowed.indexOf(lesDato(datoIso).getDay()) !== -1;
    var label = '';
    var status = ok ? 'undervisningsdag' : 'ikke-undervisningsdag';
    if (treff.ekstra) {
      return {
        ok: true,
        label: treff.ekstra.beskrivelse || 'Ekstra undervisningsdag',
        status: 'ekstradag'
      };
    }
    if (utenforSkolear(datoIso)) {
      label = (treff.fri && treff.fri.beskrivelse) || '';
      return { ok: false, label: label, status: 'utenfor-skolear' };
    }
    if (treff.fri) {
      ok = false;
      label = treff.fri.beskrivelse || 'Fri';
      status = 'ferie';
    }
    return { ok: ok, label: label, status: status };
  }

  /* For Helsesjekk. To funn, begge stille i dag:
       ukjentProgram  raden gjelder ingen — verken ferie eller ekstra
                      slår inn, og ingen ser hvorfor
       ekstraUtenfor  en ekstradag utenfor skoleåret. Kan være et reelt
                      vedtak, kan være 2027 skrevet der 2026 skulle stå */
  function avviksrapport() {
    var kjent = {};
    programmer.forEach(function (p) {
      kjent[p.id] = true;
      if (p.navn) kjent[String(p.navn).trim()] = true;
    });
    var ukjentProgram = [], ekstraUtenfor = [];
    skolekalender.forEach(function (k) {
      var v = String(k.program || '').trim();
      if (v && !kjent[v]) {
        ukjentProgram.push({ id: k.id, program: v, beskrivelse: k.beskrivelse || '', fraDato: k.fraDato || '' });
      }
      if (String(k.type || '').indexOf('Ekstra') === 0 && k.fraDato && utenforSkolear(k.fraDato)) {
        ekstraUtenfor.push({ id: k.id, beskrivelse: k.beskrivelse || '', fraDato: k.fraDato });
      }
    });
    return { ukjentProgram: ukjentProgram, ekstraUtenfor: ekstraUtenfor };
  }

  return {
    settData: settData,
    dagStatus: dagStatus,
    skoledagerMellom: skoledagerMellom,
    planDager: planDager,
    nesteSkoledag: nesteSkoledag,
    schoolDayInfo: schoolDayInfo,
    avviksrapport: avviksrapport,
    iso: iso,
    UKEDAGER: UKEDAGER
  };
})();
