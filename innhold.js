/* SIST-ENDRET: 2026-08-12 21:42:10 */
// ═══════════════════════════════════════════════════════════════════
// INNHOLD — all tekst og alle data, på tre språk, ETT sted.
//
// Forsiden og undersidene leser herfra. Endres en pris-note eller en
// boktittel her, endres den samtidig overalt — det er hele poenget.
// Skulle hver side hatt sin kopi, ville de før eller siden glidd fra
// hverandre, nøyaktig som prisene gjorde.
// ═══════════════════════════════════════════════════════════════════

const TEXT = {
    no: {
      pageTitle: 'Madina Skole', brand: 'Madina Skole',
      bannerText: '⚠️ Du åpnet denne siden inne i en app (f.eks. WhatsApp eller Instagram) — innlogging kan da feile. Trykk ⋯ eller del-ikonet og velg «Åpne i Safari».', bannerClose: 'Skjul',
      nav: { hjem:'Hjem', register:'Påmelding', dates:'Datoer', program:'Program', priser:'Priser', who:'Om oss', team:'Team', portals:'Portaler', timeplan:'Timeplan' },

      heroBadge: '📝 Påmelding er åpen', heroTitle: 'Koranundervisning, arabisk og urdu for barna våre', heroYear: 'Skoleåret 2026/2027',
      heroLead: 'Barna lærer å lese og memorere Koranen, får undervisning i arabisk og urdu, og en islamsk oppdragelse å vokse med. Vi holder til i Madina Grorud moske og er en del av Madina Institute Norway.',
      quickFacts: [
        { l:'Første skoledag', v:'Lørdag 5. september' },
        { l:'Undervisning', v:'Lørdager 09:30–13:30' },
        { l:'Madinabarn (3–6 år)', v:'Søndager 09:30–11:00' }
      ],
      heroBtnPrimary: '📝 Meld på nå', heroBtnOutline: 'Se programmet',

      regEyebrow: 'Påmelding', regTitle: 'Slik melder du deg på', regDesc: 'Tre enkle steg fra søknad til bekreftet plass.',
      steps: [
        { ic:'📝', h:'Fyll ut søknadsskjemaet', p:'Åpne påmeldingssiden og fyll inn opplysninger om eleven, foresatte og ønsket program.' },
        { ic:'✅', h:'Velg program og fag', p:'Velg hovedprogrammet eller Madinabarn, og eventuelt språkspor (arabisk eller urdu).' },
        { ic:'💳', h:'Bekreft plassen din', p:'Ved tilbud om plass betaler du et depositum på 500 kr innen 5 dager for å bekrefte plassen.' }
      ],
      tuitionTag: 'Skolepenger', tuitionSub: 'Hovedprogrammet (Lørdag). Madinabarn har egen pris.',
      tuitionBtn: '📝 Meld på nå', tuitionMer: 'Se alle priser og rabatter',

      datesEyebrow: 'Skoleår', datesTitle: 'Viktige datoer', datesDesc: 'Nøkkeldatoer for høstsemesteret 2026.', datesTimeplanBtn: 'Se hele ukentlige timeplanen →',
      dates: [
        { h:'5. september 2026', p:'Skolestart — oppstart høstsemesteret.' },
        { h:'3. oktober 2026', p:'Fri — høstferie.' },
        { h:'19. desember 2026', p:'Siste skoledag i høstsemesteret.' },
        { h:'26. desember 2026', p:'Fri — juleferie.' },
        { h:'2. januar 2027', p:'Fri — nyttårsferie.' },
        { h:'Vårsemesteret', p:'Fortsetter fra januar til slutten av mai 2027 (nøyaktige datoer kommer).' }
      ],

      prisEyebrow: 'Skolepenger', prisTitle: 'Priser',
      prisDesc: 'Beløpene under er full pris for hele skoleåret. Bøker kommer i tillegg.',
      prisKort: [
        { kode:'hoved', navn:'Madina Skole — Integrert program', dag:'Lørdag · 09:30–13:30',
          info:'Koran, islam og valgt språk (arabisk eller urdu) — samlet i ett program.' },
        { kode:'barn', navn:'Madinabarn', dag:'Søndag · 09:30–11:00 · 3–6 år',
          info:'Introduksjonsprogram for de yngste barna.' }
      ],
      prisNoter: [],
      programEyebrow: 'Fagtilbud', programTitle: 'Vårt program', programDesc: 'Tre kjernefag, undervist med omsorg tilpasset elevens nivå.',
      bokFag:{
        koran:{ h:'Koran og tajwid', p:'Fra bokstavene til flytende lesing.' },
        islam:{ h:'Islam', p:'Tro, praksis og historie — på norsk.' },
        urdu:{ h:'Urdu', p:'Lesing, skriving og ordforråd.' },
        arabisk:{ h:'Arabisk', p:'Lesing, skriving og muntlig kommunikasjon.' }
      },
      bokTekst:{
        koranQaidah:'Tar eleven fra alfabetet og artikulasjonspunktene (makharij) til sammenhengende lesing, nivå for nivå. Hvert nivå avsluttes med øvelser.',
        koranTajweed:'Reglene for hvordan Koranen leses — lengder, sammensmelting og stopp — forklart på norsk med eksempler fra teksten.',
        islamHoved:'Seks bøker om tro, praksis og islamsk historie. Hver bok bygger på den forrige, med tema tilpasset alderstrinnet.',
        islamDua:'Bønnene barnet bruker i hverdagen, med lyd via QR-kode i boka.',
        islamHadith:'Tjue hadith med oppgaver som spør: hvordan bruker jeg dette i mitt eget liv?',
        urduHoved:'Alfabetet, ord og enkle setninger — med bilder, dikt og oppgaver.',
        urduSkriv:'Skrivebok i fem nivåer. Eleven trekker bokstavene, fargelegger og skriver selv.',
        arabiskRawda:'Første møte med arabisk, for de yngste. Lek, farger og lyder — før bokstavene.',
        arabiskHarf:'Lesing, skriving og enkle samtaler, i to deler. Tilsvarer A1 (CEFR) og Novice Mid (ACTFL).<br><br>Al-Mutammim er utviklet av dr. Muhammad Mutlaq etter over 30 års erfaring, brukes av over 150 utdanningsinstitusjoner i Europa og Nord-Amerika, og er koblet til CEFR og ACTFL. Det betyr at nivået barnet ditt står på kan sammenlignes med enhver annen språkopplæring — ikke bare med vår egen.'
      },
      bokVideo:'▶️ Se introduksjonsvideo om Al-Mutammim',
      programCards: [
        { bilde:'koran', ic:'📖', h:'Koranstudier', p:'Koranlesing, memorering og tajwīd-regler. Vi bruker «Jeg lærer Qaidah» fra Misbah — som tar eleven fra bokstavene og artikulasjonspunktene til flytende lesing, nivå for nivå. Programmet er strukturert slik at hver elev, uansett utgangspunkt, utvikler sin evne til å lese og forstå Koranen.' },
        { bilde:'sprak', ic:'✏️', h:'Arabisk og urdu', p:'Strukturert opplæring i lesing, skriving og muntlig kommunikasjon. Arabisk følger læreverket Al-Mutammim — en anerkjent metodikk utviklet etter over 30 års erfaring, brukt av over 150 utdanningsinstitusjoner i Europa og Nord-Amerika, og i tråd med de internasjonale rammeverkene CEFR og ACTFL. Urdu følger Misbah bokserien, utviklet i Norge og nivådelt fra første bokstav.', video:'▶️ Se introduksjonsvideo om Al-Mutammim' },
        { ic:'🕌', h:'Islam undervisning', p:'De grunnleggende søylene i islam, samt etiske verdier som bygger en trygg og selvsikker muslimsk identitet. Undervisningen følger Misbah bokserien — utviklet i samarbeid med fagpersoner i Norge, på norsk, og delt inn etter tema og alderstrinn.' }
      ],

      whoEyebrow: 'Om oss', whoTitle: 'Forankret i tro, bygget på fellesskap', whoDesc: 'Madina Skole er en del av Madina Institute Norway (Madina Grorud moske) — en internasjonal islamsk utdanningsinstitusjon.',
      mvp: [
        { eyebrow:'Misjon', h:'Vårt formål', p:'Å gi barn og unge kunnskap i Koranen, arabisk og urdu, samt en islamsk oppdragelse bygget på kjærlighet og respekt, som en del av Madina Institute Norway.' },
        { eyebrow:'Visjon', h:'Hvor vi vil', p:'Instituttet fremmer en forståelse av islam basert på kjærlighet, toleranse og respekt for alle mennesker, som en del av et globalt nettverk grunnlagt av Shaykh Muhammad bin Yahya al-Ninowy.' },
        { eyebrow:'Filosofi', h:'Hvordan vi jobber', p:'Vi tror på et trygt og støttende læringsmiljø der hvert barn møtes med omsorg, og der tett samarbeid mellom lærere og foresatte står sentralt.' }
      ],

      teamEyebrow: 'Ledelse', teamTitle: 'Vårt team', teamDesc: 'Menneskene som leder Madina Skole.',
      team: [
        { n:'Mohamed Ameer Ali', r:'Eier / Styreleder' },
        { n:'Usman', r:'Skoleleder' },
        { n:'Mariam Hamdan', r:'Daglig leder' },
        { n:'Yasser Sharaf', r:'Faglig og pedagogisk leder' },
        { n:'Tulin Hamdan', r:'Fagkoordinator' }
      ],

      portalsEyebrow: 'Portaler', portalsTitle: 'Innganger til portalene', portalsDesc: 'Hver gruppe har sin egen portal for oppfølging og kommunikasjon.',
      portals: [
        { ic:'🛡️', h:'Administrativ', p:'For skolens administrasjon', href:'/kontor' },
        { ic:'📖', h:'Lærerportal', p:'Kun for lærere', href:'/lærer' },
        { ic:'👨‍👩‍👧', h:'Foreldreportal', p:'Oppfølging og betaling', href:'/foreldre' },
        { ic:'📝', h:'Påmelding', p:'Meld på barnet ditt', href:'/påmelding' }
      ],

      ctaTitle: 'Klar til å bli med oss?', ctaDesc: 'Plassene fylles opp — meld på barnet ditt i dag.', ctaBtn: '📝 Meld på nå',

      footerBrand: 'Madina Skole — Madina Institute Norway', footerAddr: '📍 Hagelundveien 2B, 0963 Oslo', footerContact: '✉️ info@madinaskole.no',
      footerOrgNr: 'Org. nummer: 919674431', footerPrivacy: 'Personvernerklæring', footerCopy: '© Madina Skole — Alle rettigheter forbeholdt'
    },
    en: {
      pageTitle: 'Madina Skole', brand: 'Madina Skole',
      bannerText: '⚠️ You opened this page inside an app (e.g. WhatsApp or Instagram) — signing in may fail. Tap ⋯ or the share icon and choose «Open in Safari».', bannerClose: 'Hide',
      nav: { hjem:'Home', register:'Admission', dates:'Dates', program:'Programme', priser:'Fees', who:'About us', team:'Team', portals:'Portals', timeplan:'Timetable' },

      heroBadge: '📝 Admission is open', heroTitle: 'Quran, Arabic and Urdu for our children', heroYear: 'School year 2026/2027',
      heroLead: 'Children learn to read and memorise the Quran, are taught Arabic and Urdu, and receive an Islamic upbringing to grow with. We are based at Madina Grorud mosque and are part of Madina Institute Norway.',
      quickFacts: [
        { l:'First day of school', v:'Saturday 5 September' },
        { l:'Teaching', v:'Saturdays 09:30–13:30' },
        { l:'Madinabarn (ages 3–6)', v:'Sundays 09:30–11:00' }
      ],
      heroBtnPrimary: '📝 Apply now', heroBtnOutline: 'See the programme',

      regEyebrow: 'Admission', regTitle: 'How to apply', regDesc: 'Three steps from application to a confirmed place.',
      steps: [
        { ic:'📝', h:'Fill in the application form', p:'Open the admission page and enter details about the child, the guardians and the programme you want. Please note that the form itself is in Norwegian.' },
        { ic:'✅', h:'Choose programme and subjects', p:'Choose the main programme or Madinabarn, and a language track (Arabic or Urdu) if relevant.' },
        { ic:'💳', h:'Confirm your place', p:'When a place is offered, you pay a deposit within the given deadline to confirm it.' }
      ],
      tuitionTag: 'Tuition', tuitionSub: 'The main programme (Saturday). Madinabarn has its own price.',
      tuitionBtn: '📝 Apply now', tuitionMer: 'See all fees and discounts',

      datesEyebrow: 'School year', datesTitle: 'Key dates', datesDesc: 'Key dates for the autumn term 2026.', datesTimeplanBtn: 'See the full weekly timetable →',
      dates: [
        { h:'5 September 2026', p:'First day — the autumn term begins.' },
        { h:'3 October 2026', p:'No school — autumn break.' },
        { h:'19 December 2026', p:'Last day of the autumn term.' },
        { h:'26 December 2026', p:'No school — Christmas break.' },
        { h:'2 January 2027', p:'No school — New Year break.' },
        { h:'Spring term', p:'Runs from January to the end of May 2027 (exact dates to follow).' }
      ],

      prisEyebrow: 'Tuition', prisTitle: 'Fees',
      prisDesc: 'The amounts below are the full price for the whole school year. Books come in addition.',
      prisKort: [
        { kode:'hoved', navn:'Madina Skole — Integrated programme', dag:'Saturday · 09:30–13:30',
          info:'Quran, Islam and a chosen language (Arabic or Urdu) — combined in one programme.' },
        { kode:'barn', navn:'Madinabarn', dag:'Sunday · 09:30–11:00 · ages 3–6',
          info:'Introductory programme for the youngest children.' }
      ],
      prisNoter: [],
      programEyebrow: 'Subjects', programTitle: 'Our programme', programDesc: 'Three core subjects, taught with care and matched to the pupil\u2019s level.',
      bokFag:{
        koran:{ h:'Quran and tajwid', p:'From the letters to fluent reading.' },
        islam:{ h:'Islam', p:'Belief, practice and history — taught in Norwegian.' },
        urdu:{ h:'Urdu', p:'Reading, writing and vocabulary.' },
        arabisk:{ h:'Arabic', p:'Reading, writing and speaking.' }
      },
      bokTekst:{
        koranQaidah:'Takes the pupil from the alphabet and the points of articulation (makharij) to connected reading, level by level. Each level ends with exercises.',
        koranTajweed:'The rules for how the Quran is recited — lengths, merging and stopping — explained with examples from the text.',
        islamHoved:'Six books on belief, practice and Islamic history. Each book builds on the previous one, with topics matched to the age group.',
        islamDua:'The supplications a child uses day to day, with audio via a QR code in the book.',
        islamHadith:'Twenty hadith with tasks that ask: how do I apply this in my own life?',
        urduHoved:'The alphabet, words and simple sentences — with pictures, poems and exercises.',
        urduSkriv:'A writing book in five levels. The pupil traces the letters, colours them in and writes them independently.',
        arabiskRawda:'A first encounter with Arabic, for the youngest. Play, colours and sounds — before the letters.',
        arabiskHarf:'Reading, writing and simple conversation, in two parts. Corresponds to A1 (CEFR) and Novice Mid (ACTFL).<br><br>Al-Mutammim was developed by Dr Muhammad Mutlaq over more than 30 years, is used by over 150 educational institutions across Europe and North America, and is aligned with CEFR and ACTFL. That means the level your child reaches can be compared with any other language education — not only with our own.'
      },
      bokVideo:'▶️ Watch the introduction video about Al-Mutammim',
      programCards: [
        { bilde:'koran', ic:'📖', h:'Quran studies', p:'Quran reading, memorisation and the rules of tajwīd. We use «Jeg lærer Qaidah» from Misbah — which takes the pupil from the letters and points of articulation to fluent reading, level by level. The programme is structured so that every pupil, whatever their starting point, develops the ability to read and understand the Quran.' },
        { bilde:'sprak', ic:'✏️', h:'Arabic and Urdu', p:'Structured teaching in reading, writing and speaking. Arabic follows the Al-Mutammim curriculum — an established method developed over more than 30 years, used by over 150 educational institutions in Europe and North America, and aligned with the international CEFR and ACTFL frameworks. Urdu follows the Misbah book series, developed in Norway and graded from the very first letter.', video:'▶️ Watch the introduction video about Al-Mutammim' },
        { ic:'🕌', h:'Islamic studies', p:'The fundamental pillars of Islam, along with the ethical values that build a secure and confident Muslim identity. Teaching follows the Misbah book series — developed together with specialists in Norway, in Norwegian, and organised by theme and age group.' }
      ],

      whoEyebrow: 'About us', whoTitle: 'Rooted in faith, built on community', whoDesc: 'Madina Skole is part of Madina Institute Norway (Madina Grorud mosque) — an international Islamic educational institution.',
      mvp: [
        { eyebrow:'Mission', h:'Our purpose', p:'To give children and young people knowledge of the Quran, Arabic and Urdu, along with an Islamic upbringing built on love and respect, as part of Madina Institute Norway.' },
        { eyebrow:'Vision', h:'Where we are going', p:'The institute promotes an understanding of Islam based on love, tolerance and respect for all people, as part of a global network founded by Shaykh Muhammad bin Yahya al-Ninowy.' },
        { eyebrow:'Philosophy', h:'How we work', p:'We believe in a safe and supportive learning environment where every child is met with care, and where close cooperation between teachers and guardians is central.' }
      ],

      teamEyebrow: 'Leadership', teamTitle: 'Our team', teamDesc: 'The people who lead Madina Skole.',
      team: [
        { n:'Mohamed Ameer Ali', r:'Owner / Chair of the board' },
        { n:'Usman', r:'Head of school' },
        { n:'Mariam Hamdan', r:'Managing director' },
        { n:'Yasser Sharaf', r:'Head of academics and pedagogy' },
        { n:'Tulin Hamdan', r:'Subject coordinator' }
      ],

      portalsEyebrow: 'Portals', portalsTitle: 'Entrances to the portals', portalsDesc: 'Each group has its own portal for follow-up and communication. Please note that the portals are in Norwegian.',
      portals: [
        { ic:'🛡️', h:'Administration', p:'For the school administration', href:'/kontor' },
        { ic:'📖', h:'Teacher portal', p:'For teachers only', href:'/lærer' },
        { ic:'👨‍👩‍👧', h:'Guardian portal', p:'Follow-up and payment', href:'/foreldre' },
        { ic:'📝', h:'Admission', p:'Apply for your child', href:'/påmelding' }
      ],

      ctaTitle: 'Ready to join us?', ctaDesc: 'Places fill up — apply for your child today.', ctaBtn: '📝 Apply now',

      footerBrand: 'Madina Skole — Madina Institute Norway', footerAddr: '📍 Hagelundveien 2B, 0963 Oslo', footerContact: '✉️ info@madinaskole.no',
      footerOrgNr: 'Org. number: 919674431', footerPrivacy: 'Privacy policy', footerCopy: '© Madina Skole — All rights reserved'
    },

    ar: {
      pageTitle: 'مدرسة مدينة', brand: 'مدرسة مدينة',
      bannerText: '⚠️ فتحت الصفحة من داخل تطبيق (مثل واتساب أو انستجرام) — تسجيل الدخول قد لا يعمل بشكل صحيح. اضغط ⋯ أو أيقونة المشاركة واختر «فتح في المتصفح».', bannerClose: 'إخفاء',
      nav: { hjem:'الرئيسية', register:'التسجيل', dates:'المواعيد', program:'البرنامج', priser:'الأسعار', who:'من نحن', team:'الفريق', portals:'البوابات', timeplan:'الجدول الدراسي' },

      heroBadge: '📝 التسجيل مفتوح الآن', heroTitle: 'تعليم القرآن الكريم واللغة العربية والأردية لأبنائنا', heroYear: 'العام الدراسي 2026/2027',
      heroLead: 'يتعلّم الأطفال قراءة القرآن وحفظه، ويدرسون العربية والأردية، وينشأون على تربية إسلامية. مقرّنا في مسجد مدينة غرود، ونحن جزء من معهد مدينة النرويج.',
      quickFacts: [
        { l:'أول يوم دراسي', v:'السبت 5 سبتمبر' },
        { l:'التدريس', v:'السبت 09:30–13:30' },
        { l:'مدينة بارن (3–6 سنوات)', v:'الأحد 09:30–11:00' }
      ],
      heroBtnPrimary: '📝 سجّل الآن', heroBtnOutline: 'شاهد البرنامج',

      regEyebrow: 'التسجيل', regTitle: 'خطوات التسجيل', regDesc: 'ثلاث خطوات بسيطة من التقديم لتأكيد المكان.',
      steps: [
        { ic:'📝', h:'املأ استمارة التسجيل', p:'افتح صفحة التسجيل واملأ بيانات الطالب وولي الأمر والبرنامج المطلوب.' },
        { ic:'✅', h:'اختر البرنامج والمادة', p:'اختر البرنامج الأساسي أو مدينة بارن، ومسار اللغة إن وجد (عربي أو أردو).' },
        { ic:'💳', h:'أكّد مكانك', p:'عند قبول الطالب، يُدفع عربون 500 كرون خلال 5 أيام لتأكيد المكان.' }
      ],
      tuitionTag: 'الرسوم الدراسية', tuitionSub: 'البرنامج الأساسي (السبت). مدينة بارن له سعره الخاص.',
      tuitionBtn: '📝 سجّل الآن', tuitionMer: 'كل الأسعار والتخفيضات',

      datesEyebrow: 'العام الدراسي', datesTitle: 'المواعيد المهمة', datesDesc: 'المواعيد الرئيسية للفصل الأول 2026.', datesTimeplanBtn: 'مشاهدة الجدول الأسبوعي الكامل ←',
      dates: [
        { h:'5 سبتمبر 2026', p:'بداية الدراسة — انطلاق الفصل الأول.' },
        { h:'3 أكتوبر 2026', p:'إجازة — عطلة الخريف.' },
        { h:'19 ديسمبر 2026', p:'آخر يوم دراسي في الفصل الأول.' },
        { h:'26 ديسمبر 2026', p:'إجازة — عطلة الكريسماس.' },
        { h:'2 يناير 2027', p:'إجازة — عطلة رأس السنة.' },
        { h:'الفصل الثاني', p:'يستمر من يناير حتى نهاية مايو 2027 (المواعيد الدقيقة قريبًا).' }
      ],

      prisEyebrow: 'الرسوم الدراسية', prisTitle: 'الأسعار',
      prisDesc: 'المبالغ أدناه هي السعر الكامل للعام الدراسي كامل. الكتب غير مشمولة.',
      prisKort: [
        { kode:'hoved', navn:'مدرسة مدينة — البرنامج المتكامل', dag:'السبت · ٠٩:٣٠–١٣:٣٠',
          info:'القرآن والتربية الإسلامية واللغة المختارة (العربية أو الأردية) — في برنامج واحد.' },
        { kode:'barn', navn:'أطفال مدينة', dag:'الأحد · ٠٩:٣٠–١١:٠٠ · ٣–٦ سنوات',
          info:'برنامج تمهيدي لأصغر الأطفال.' }
      ],
      prisNoter: [],
      programEyebrow: 'البرامج الدراسية', programTitle: 'برنامجنا', programDesc: 'ثلاث مواد أساسية، تُدرَّس بعناية تناسب مستوى كل طالب.',
      bokFag:{
        koran:{ h:'القرآن والتجويد', p:'من الحروف إلى القراءة المتّصلة.' },
        islam:{ h:'التربية الإسلامية', p:'العقيدة والعبادة والتاريخ — بالنرويجية.' },
        urdu:{ h:'اللغة الأردية', p:'القراءة والكتابة والمفردات.' },
        arabisk:{ h:'اللغة العربية', p:'القراءة والكتابة والمحادثة.' }
      },
      bokTekst:{
        koranQaidah:'تأخذ الطالب من الحروف ومخارجها إلى القراءة المتّصلة، مستوى بعد مستوى. وكل مستوى يُختم بتمارين.',
        koranTajweed:'أحكام تلاوة القرآن — المدود والإدغام والوقف — مشروحة بالنرويجية بأمثلة من النص.',
        islamHoved:'ستة كتب في العقيدة والعبادة والتاريخ الإسلامي. كل كتاب يبني على سابقه، بموضوعات تناسب المرحلة العمرية.',
        islamDua:'الأدعية التي يستخدمها الطفل في يومه، مع تسجيل صوتي عبر رمز QR في الكتاب.',
        islamHadith:'عشرون حديثًا مع تمارين تسأل: كيف أطبّق هذا في حياتي؟',
        urduHoved:'الحروف والكلمات والجمل البسيطة — بالصور والأناشيد والتمارين.',
        urduSkriv:'كرّاسة كتابة في خمسة مستويات. الطالب يتتبّع الحروف ويلوّن ويكتب بنفسه.',
        arabiskRawda:'أول لقاء مع العربية، للأصغر سنًا. لعب وألوان وأصوات — قبل الحروف.',
        arabiskHarf:'القراءة والكتابة والمحادثات البسيطة، في جزأين. يعادل A1 (CEFR) وNovice Mid (ACTFL).<br><br>منهج المتمم من تأليف د. محمد مطلق، ثمرة أكثر من 30 عامًا من الخبرة، تعتمده أكثر من 150 مؤسسة تعليمية في أوروبا وأمريكا الشمالية، ومربوط بمعياري CEFR وACTFL. أي أن المستوى الذي يقف عنده طفلك يمكن مقارنته بأي تعليم لغوي آخر — لا بمقياسنا وحده.'
      },
      bokVideo:'▶️ شاهد الفيديو التعريفي عن منهج المتمم',
      programCards: [
        { bilde:'koran', ic:'📖', h:'الدراسات القرآنية', p:'تلاوة القرآن، الحفظ، وأحكام التجويد. نستخدم «أتعلّم القاعدة» من سلسلة المصباح — تأخذ الطالب من الحروف ومخارجها إلى القراءة المتّصلة، مستوى بعد مستوى. البرنامج مصمم بحيث ينمو كل طالب، مهما كانت نقطة بدايته، في قدرته على قراءة القرآن وفهمه.' },
        { bilde:'sprak', ic:'✏️', h:'العربية والأردية', p:'تعليم منظم في القراءة والكتابة والمحادثة. العربية وفق منهج المتمم — منهج معتمد ثمرة أكثر من 30 عامًا من الخبرة، تعتمده أكثر من 150 مؤسسة تعليمية في أوروبا وأمريكا الشمالية، ومتوافق مع المعايير الدولية CEFR وACTFL. والأردية وفق سلسلة المصباح، المطوَّرة في النرويج والمقسَّمة بالمستويات من أول حرف.', video:'▶️ شاهد الفيديو التعريفي عن منهج المتمم' },
        { ic:'🕌', h:'التربية الإسلامية', p:'أركان الإسلام الأساسية، إلى جانب القيم الأخلاقية التي تبني هوية إسلامية واثقة وآمنة. التدريس وفق سلسلة المصباح — المطوَّرة بالتعاون مع مختصين في النرويج، باللغة النرويجية، ومقسَّمة حسب الموضوع والمرحلة العمرية.' }
      ],

      whoEyebrow: 'من نحن', whoTitle: 'متجذرون في الإيمان، مبنيون على المجتمع', whoDesc: 'مدرسة مدينة جزء من معهد مدينة النرويج (مسجد مدينة غرود) — مؤسسة تعليمية إسلامية عالمية.',
      mvp: [
        { eyebrow:'رسالتنا', h:'هدفنا', p:'تزويد الأطفال والناشئة بمعرفة القرآن الكريم والعربية والأردية، وتربية إسلامية قائمة على المحبة والاحترام، كجزء من معهد مدينة النرويج.' },
        { eyebrow:'رؤيتنا', h:'إلى أين نتجه', p:'يُعنى المعهد بترسيخ فهم للإسلام قائم على المحبة والتسامح واحترام كل البشر، كجزء من شبكة عالمية أسسها الشيخ محمد بن يحيى النينوي.' },
        { eyebrow:'فلسفتنا', h:'كيف نعمل', p:'نؤمن ببيئة تعليمية آمنة وداعمة يُقابَل فيها كل طفل بالرعاية، وتقوم على تعاون وثيق بين المعلمين وأولياء الأمور.' }
      ],

      teamEyebrow: 'الإدارة', teamTitle: 'فريقنا', teamDesc: 'الأشخاص الذين يقودون مدرسة مدينة.',
      team: [
        { n:'محمد أمير علي', r:'المالك / رئيس مجلس الإدارة' },
        { n:'عثمان', r:'مدير المدرسة' },
        { n:'مريم حمدان', r:'المدير التنفيذي' },
        { n:'ياسر شرف', r:'المدير الأكاديمي والتربوي' },
        { n:'تولين حمدان', r:'منسقة المواد الدراسية' }
      ],

      portalsEyebrow: 'البوابات الإلكترونية', portalsTitle: 'بوابات الدخول', portalsDesc: 'لكل فئة بوابتها الخاصة للمتابعة والتواصل.',
      portals: [
        { ic:'🛡️', h:'الإدارة', p:'لإدارة المدرسة', href:'/kontor' },
        { ic:'📖', h:'بوابة المعلم', p:'للمعلمين فقط', href:'/lærer' },
        { ic:'👨‍👩‍👧', h:'بوابة أولياء الأمور', p:'المتابعة والدفع', href:'/foreldre' },
        { ic:'📝', h:'التسجيل', p:'سجّل طفلك الآن', href:'/påmelding' }
      ],

      ctaTitle: 'جاهز تنضم لينا؟', ctaDesc: 'الأماكن محدودة — سجّل طفلك اليوم.', ctaBtn: '📝 سجّل الآن',

      footerBrand: 'مدرسة مدينة — معهد مدينة النرويج', footerAddr: '📍 Hagelundveien 2B, 0963 Oslo', footerContact: '✉️ info@madinaskole.no',
      footerOrgNr: 'الرقم التنظيمي الرسمي: 919674431', footerPrivacy: 'سياسة الخصوصية', footerCopy: '© مدرسة مدينة — جميع الحقوق محفوظة'
    },
    ur: {
      pageTitle: 'مدینہ اسکول', brand: 'مدینہ اسکول',
      bannerText: '⚠️ آپ نے یہ صفحہ کسی ایپ کے اندر کھولا ہے — لاگ اِن کام نہیں کر سکتا۔ ⋯ یا شیئر آئیکن پر ٹیپ کریں اور «Safari میں کھولیں» منتخب کریں۔', bannerClose: 'چھپائیں',
      nav: { hjem:'ہوم', register:'داخلہ', dates:'تاریخیں', program:'پروگرام', priser:'قیمتیں', who:'ہمارے بارے میں', team:'ٹیم', portals:'پورٹلز', timeplan:'ٹائم ٹیبل' },

      heroBadge: '📝 داخلہ کھلا ہے', heroTitle: 'ہمارے بچوں کے لیے قرآن کریم، عربی اور اردو کی تعلیم', heroYear: 'تعلیمی سال 2026/2027',
      heroLead: 'بچے قرآن پڑھنا اور حفظ کرنا سیکھتے ہیں، عربی اور اردو کی تعلیم پاتے ہیں، اور اسلامی تربیت کے ساتھ پروان چڑھتے ہیں۔ ہم مدینہ گرورود مسجد میں ہیں اور مدینہ انسٹی ٹیوٹ ناروے کا حصہ ہیں۔',
      quickFacts: [
        { l:'پہلا اسکول دن', v:'ہفتہ 5 ستمبر' },
        { l:'تدریس', v:'ہفتہ 09:30–13:30' },
        { l:'مدینہ بارن (3–6 سال)', v:'اتوار 09:30–11:00' }
      ],
      heroBtnPrimary: '📝 ابھی داخلہ لیں', heroBtnOutline: 'پروگرام دیکھیں',

      regEyebrow: 'داخلہ', regTitle: 'داخلے کا طریقہ', regDesc: 'درخواست سے لے کر تصدیق شدہ جگہ تک تین آسان مراحل۔',
      steps: [
        { ic:'📝', h:'داخلہ فارم پُر کریں', p:'داخلہ صفحہ کھولیں اور طالب علم، والدین اور مطلوبہ پروگرام کی معلومات درج کریں۔' },
        { ic:'✅', h:'پروگرام اور مضمون منتخب کریں', p:'بنیادی پروگرام یا مدینہ بارن منتخب کریں، اور زبان کا انتخاب کریں (عربی یا اردو)۔' },
        { ic:'💳', h:'اپنی جگہ کی تصدیق کریں', p:'داخلے کی پیشکش پر، جگہ کی تصدیق کے لیے 5 دن کے اندر 500 کرون کا ڈپازٹ ادا کریں۔' }
      ],
      tuitionTag: 'فیس', tuitionSub: 'بنیادی پروگرام (ہفتہ)۔ مدینہ بارن کی الگ قیمت ہے۔',
      tuitionBtn: '📝 ابھی داخلہ لیں', tuitionMer: 'تمام قیمتیں اور رعایتیں',

      datesEyebrow: 'تعلیمی سال', datesTitle: 'اہم تاریخیں', datesDesc: 'خزاں کے سمسٹر 2026 کی اہم تاریخیں۔', datesTimeplanBtn: 'مکمل ہفتہ وار ٹائم ٹیبل دیکھیں ←',
      dates: [
        { h:'5 ستمبر 2026', p:'تعلیم کا آغاز — خزاں سمسٹر کی شروعات۔' },
        { h:'3 اکتوبر 2026', p:'چھٹی — خزاں کی تعطیلات۔' },
        { h:'19 دسمبر 2026', p:'خزاں سمسٹر کا آخری تعلیمی دن۔' },
        { h:'26 دسمبر 2026', p:'چھٹی — کرسمس کی تعطیلات۔' },
        { h:'2 جنوری 2027', p:'چھٹی — نئے سال کی تعطیل۔' },
        { h:'بہار کا سمسٹر', p:'جنوری سے مئی 2027 کے اختتام تک جاری رہے گا (تفصیلی تاریخیں جلد بتائی جائیں گی)۔' }
      ],

      prisEyebrow: 'اسکول فیس', prisTitle: 'قیمتیں',
      prisDesc: 'نیچے دی گئی رقم پورے تعلیمی سال کی مکمل قیمت ہے۔ کتابیں شامل نہیں۔',
      prisKort: [
        { kode:'hoved', navn:'مدینہ اسکول — مربوط پروگرام', dag:'ہفتہ · 09:30–13:30',
          info:'قرآن، اسلام اور منتخب زبان (عربی یا اردو) — ایک ہی پروگرام میں۔' },
        { kode:'barn', navn:'مدینہ بچے', dag:'اتوار · 09:30–11:00 · 3–6 سال',
          info:'چھوٹے بچوں کے لیے تعارفی پروگرام۔' }
      ],
      prisNoter: [],
      programEyebrow: 'تعلیمی پروگرام', programTitle: 'ہمارا پروگرام', programDesc: 'تین بنیادی مضامین، ہر طالب علم کی سطح کے مطابق نگہداشت کے ساتھ پڑھائے جاتے ہیں۔',
      bokFag:{
        koran:{ h:'قرآن اور تجوید', p:'حروف سے روانی سے پڑھنے تک۔' },
        islam:{ h:'اسلامی تعلیم', p:'عقیدہ، عبادت اور تاریخ — نارویجن زبان میں۔' },
        urdu:{ h:'اردو', p:'پڑھنا، لکھنا اور الفاظ۔' },
        arabisk:{ h:'عربی', p:'پڑھنا، لکھنا اور بول چال۔' }
      },
      bokTekst:{
        koranQaidah:'طالب علم کو حروف اور مخارج سے مسلسل پڑھنے تک، سطح بہ سطح لے جاتی ہے۔ ہر سطح مشقوں پر ختم ہوتی ہے۔',
        koranTajweed:'قرآن پڑھنے کے اصول — مدات، ادغام اور وقف — نارویجن میں متن سے مثالوں کے ساتھ سمجھائے گئے۔',
        islamHoved:'عقیدہ، عبادت اور اسلامی تاریخ پر چھ کتابیں۔ ہر کتاب پچھلی پر بنتی ہے، عمر کے مطابق موضوعات کے ساتھ۔',
        islamDua:'وہ دعائیں جو بچہ روزمرہ استعمال کرتا ہے، کتاب میں QR کوڈ کے ذریعے آواز کے ساتھ۔',
        islamHadith:'بیس احادیث، مشقوں کے ساتھ جو پوچھتی ہیں: میں اسے اپنی زندگی میں کیسے استعمال کروں؟',
        urduHoved:'حروف، الفاظ اور آسان جملے — تصاویر، نظموں اور مشقوں کے ساتھ۔',
        urduSkriv:'پانچ سطحوں میں لکھائی کی کتاب۔ طالب علم حروف پر لکیر کھینچتا، رنگ بھرتا اور خود لکھتا ہے۔',
        arabiskRawda:'سب سے چھوٹے بچوں کے لیے عربی سے پہلا تعارف۔ کھیل، رنگ اور آوازیں — حروف سے پہلے۔',
        arabiskHarf:'پڑھنا، لکھنا اور آسان گفتگو، دو حصوں میں۔ A1 (CEFR) اور Novice Mid (ACTFL) کے برابر۔<br><br>المتمم ڈاکٹر محمد مطلق کا تیار کردہ ہے، 30 سال سے زیادہ تجربے کا نتیجہ، یورپ اور شمالی امریکہ کے 150 سے زائد اداروں میں رائج، اور CEFR اور ACTFL سے منسلک۔ یعنی آپ کے بچے کی سطح کا موازنہ کسی بھی دوسری زبان کی تعلیم سے کیا جا سکتا ہے۔'
      },
      bokVideo:'▶️ المتمم کے تعارفی ویڈیو دیکھیں',
      programCards: [
        { bilde:'koran', ic:'📖', h:'قرآنی علوم', p:'قرآن کی تلاوت، حفظ، اور تجوید کے اصول۔ ہم مصباح کی «Jeg lærer Qaidah» استعمال کرتے ہیں — جو طالب علم کو حروف اور مخارج سے روانی سے پڑھنے تک، سطح بہ سطح لے جاتی ہے۔ پروگرام اس طرح ترتیب دیا گیا ہے کہ ہر طالب علم، چاہے اس کی ابتدائی سطح کچھ بھی ہو، ترقی کرے۔' },
        { bilde:'sprak', ic:'✏️', h:'عربی اور اردو', p:'پڑھنے، لکھنے اور بول چال میں منظم تعلیم۔ عربی المتمم نصاب کے مطابق پڑھائی جاتی ہے — ایک تسلیم شدہ طریقہ کار جو 30 سال سے زیادہ تجربے کے بعد تیار ہوا، یورپ اور شمالی امریکہ کے 150 سے زائد تعلیمی اداروں میں رائج ہے، اور بین الاقوامی معیارات CEFR اور ACTFL کے مطابق ہے۔ اردو مصباح سیریز کے مطابق پڑھائی جاتی ہے، جو ناروے میں تیار ہوئی اور پہلے حرف سے سطح بہ سطح ترتیب دی گئی ہے۔', video:'▶️ المتمم کے تعارفی ویڈیو دیکھیں' },
        { ic:'🕌', h:'اسلامی تربیت', p:'اسلام کے بنیادی ارکان، ساتھ ہی اخلاقی اقدار جو ایک پراعتماد اور محفوظ اسلامی شناخت بناتی ہیں۔ تدریس مصباح سیریز کے مطابق ہے — جو ناروے میں ماہرین کے تعاون سے، نارویجن زبان میں، موضوع اور عمر کے لحاظ سے مرتب کی گئی ہے۔' }
      ],

      whoEyebrow: 'ہمارے بارے میں', whoTitle: 'ایمان میں جڑے، برادری پر استوار', whoDesc: 'مدینہ اسکول، مدینہ انسٹی ٹیوٹ ناروے (مدینہ گرورود مسجد) کا حصہ ہے — ایک بین الاقوامی اسلامی تعلیمی ادارہ۔',
      mvp: [
        { eyebrow:'مشن', h:'ہمارا مقصد', p:'بچوں اور نوجوانوں کو قرآن کریم، عربی اور اردو کا علم فراہم کرنا، اور محبت اور احترام پر مبنی اسلامی تربیت دینا، مدینہ انسٹی ٹیوٹ ناروے کے حصے کے طور پر۔' },
        { eyebrow:'وژن', h:'ہماری منزل', p:'ادارہ محبت، رواداری اور تمام انسانوں کے احترام پر مبنی اسلام کی سمجھ کو فروغ دیتا ہے، شیخ محمد بن یحییٰ النینوی کے قائم کردہ عالمی نیٹ ورک کے حصے کے طور پر۔' },
        { eyebrow:'فلسفہ', h:'ہم کیسے کام کرتے ہیں', p:'ہم ایک محفوظ اور معاون تعلیمی ماحول پر یقین رکھتے ہیں جہاں ہر بچے کے ساتھ نگہداشت سے پیش آیا جائے، اور اساتذہ و والدین کے درمیان قریبی تعاون مرکزی حیثیت رکھے۔' }
      ],

      teamEyebrow: 'انتظامیہ', teamTitle: 'ہماری ٹیم', teamDesc: 'وہ لوگ جو مدینہ اسکول کی قیادت کرتے ہیں۔',
      team: [
        { n:'محمد امیر علی', r:'مالک / بورڈ چیئرمین' },
        { n:'عثمان', r:'اسکول لیڈر' },
        { n:'مریم حمدان', r:'ڈائریکٹر' },
        { n:'یاسر شرف', r:'تعلیمی و تدریسی سربراہ' },
        { n:'تولین حمدان', r:'مضمون کوآرڈینیٹر' }
      ],

      portalsEyebrow: 'الیکٹرانک پورٹلز', portalsTitle: 'پورٹلز تک رسائی', portalsDesc: 'ہر گروپ کے لیے اپنا مخصوص پورٹل موجود ہے۔',
      portals: [
        { ic:'🛡️', h:'انتظامیہ', p:'اسکول کے انتظامی امور کے لیے', href:'/kontor' },
        { ic:'📖', h:'اساتذہ کا پورٹل', p:'صرف اساتذہ کے لیے', href:'/lærer' },
        { ic:'👨‍👩‍👧', h:'والدین کا پورٹل', p:'نگرانی اور ادائیگی', href:'/foreldre' },
        { ic:'📝', h:'داخلہ', p:'ابھی اپنے بچے کا داخلہ کروائیں', href:'/påmelding' }
      ],

      ctaTitle: 'ہمارے ساتھ شامل ہونے کے لیے تیار ہیں؟', ctaDesc: 'جگہیں محدود ہیں — آج ہی اپنے بچے کا داخلہ کروائیں۔', ctaBtn: '📝 ابھی داخلہ لیں',

      footerBrand: 'مدینہ اسکول — مدینہ انسٹی ٹیوٹ ناروے', footerAddr: '📍 Hagelundveien 2B, 0963 Oslo', footerContact: '✉️ info@madinaskole.no',
      footerOrgNr: 'سرکاری رجسٹریشن نمبر: 919674431', footerPrivacy: 'رازداری کی پالیسی', footerCopy: '© مدینہ اسکول — جملہ حقوق محفوظ ہیں'
    }
  };
  const MUTAMMIM_VIDEO_URL = 'https://youtu.be/AwgsxvVi5Mw';
  // Læremidlene. Bøkene står ETT sted, med bildefil og nivå; bare
  // teksten oversettes. En bok heter det samme på alle tre språk, og tre
  // kopier av samme liste ville før eller siden blitt tre ulike lister.
  const FAG = [
    {
      id:'koran', ikon:'📖',
      boker:[
        { fil:'bok-qaidah', tittel:'Jeg lærer Qaidah', niva:'Nivå 1–4', n:'koranQaidah' },
        { fil:'bok-tajweed', tittel:'Jeg lærer Tajweed', niva:null, n:'koranTajweed' }
      ]
    },
    {
      id:'islam', ikon:'🕌',
      boker:[
        { fil:'bok-islam', tittel:'Innføring i islamsk tro og praksis', niva:'Nivå 1–6', n:'islamHoved' },
        { fil:'bok-dua', tittel:'Dua bok', niva:'Nivå 1–6', n:'islamDua' },
        { fil:'bok-hadith', tittel:'20 Hadith for barn og ungdom', niva:null, n:'islamHadith' }
      ]
    },
    {
      id:'urdu', ikon:'✍️',
      boker:[
        { fil:'bok-urdu', tittel:'Jeg lærer urdu', niva:'Nivå 1', n:'urduHoved' },
        { fil:'bok-skriv', tittel:'Lær å skrive urdu', niva:'Nivå 1–5', n:'urduSkriv' }
      ]
    },
    {
      id:'arabisk', ikon:'🗣️',
      boker:[
        { fil:'bok-arabisk', tittel:'Rawdat Al-Mutammim — روضة المتمم', niva:'Nivå 0 · barnehage', n:'arabiskRawda' },
        { fil:'bok-harf', tittel:'Kitab Al-Harf — كتاب الحرف', niva:'Nivå 1 · A1 · Novice Mid', n:'arabiskHarf', video:true }
      ]
    }
  ];
  // Bildene ligger på KORTET, ikke i språktabellene: motivet er det
  // samme uansett hvilket språk siden vises på, og en fil som står tre
  // steder blir før eller siden tre ulike filer.
  //
  // 📌 Ingen ansikter. Bildene er beskåret slik at ansiktene faller
  // utenfor rammen — ikke slørt. En slørt flekk trekker blikket til seg
  // og får siden til å se ut som noe skjules; her ser man arbeidet på
  // bordet, som er det bildet faktisk handler om.
  const KORTBILDER = {
    'koran':   { fil:'koranstudier', alt:{ no:'Åpen mushaf, Qaida Baghdadia og lærebok i arabisk lesing på et bord',
                                           ar:'مصحف مفتوح والقاعدة البغدادية وكتاب تعليم القراءة العربية على طاولة',
                                           ur:'میز پر کھلا قرآن، قاعدہ بغدادیہ اور عربی پڑھائی کی کتاب' } },
    'sprak':   { fil:'arabisk',      alt:{ no:'Åpen arabisk lærebok med skriveøvelser og en penn',
                                           ar:'كتاب عربي مفتوح فيه تمارين كتابة وقلم',
                                           ur:'کھلی عربی درسی کتاب، تحریری مشقیں اور قلم' } },
    'skriving':{ fil:'skriving',     alt:{ no:'Et barn skriver arabiske bokstaver i en arbeidsbok med rød blyant',
                                           ar:'طفل يكتب حروفًا عربية في كراسة بقلم أحمر',
                                           ur:'ایک بچہ سرخ پنسل سے کاپی میں عربی حروف لکھ رہا ہے' } }
  };
  const MEDLEM_LENKER = {
    familie: 'https://registrering.solidus.no/smartform/83DEE9B5-754D-4784-9B21-B7B2BF8177ED',
    barn:    'https://registrering.solidus.no/smartform/06B56592-BC3B-483A-AFCB-E1F9B22FA908',
    info:    '/medlemskap',
    moske:   'https://madina.no'
  };

  const MEDLEM_TEKST = {
    no: {
      tittel: '💳 Medlemskap i Madina Institute — gratis',
      brod: 'Medlemsprisen er alltid den laveste, og medlemmer har fortrinnsrett ved opptak. Medlemskapet koster ingenting.',
      rekkefolge: '<b>Rekkefølgen:</b> familien registreres først, deretter barnet.',
      advarselTittel: '⚠️ Du kan bare være medlem ett sted',
      advarsel: 'Norsk lov gir tilskudd per medlem, og ingen kan telles i to trossamfunn samtidig. Er dere medlemmer et annet sted, må dere melde dere ut der så snart som mulig etter å ha registrert dere her.',
      knappFamilie: '👤 Medlemskap for familien',
      knappBarn: '🧒 Medlemskap for barn',
      knappInfo: 'Les mer om medlemskap',
      moske: 'Mer om Madina Institute (Madina Grorud moské): '
    },
    en: {
      tittel: '💳 Membership of Madina Institute — free',
      brod: 'The member price is always the lowest, and members have priority at admission. Membership costs nothing.',
      rekkefolge: '<b>The order:</b> the family registers first, then the child.',
      advarselTittel: '⚠️ You can only be a member in one place',
      advarsel: 'Norwegian law grants public funding per member, and no one can be counted in two religious communities at the same time. If you are members elsewhere, you must withdraw there as soon as possible after registering here.',
      knappFamilie: '👤 Membership for the family',
      knappBarn: '🧒 Membership for a child',
      knappInfo: 'Read more about membership',
      moske: 'More about Madina Institute (Madina Grorud mosque): '
    },
    ar: {
      tittel: '💳 عضوية معهد المدينة — مجانية',
      brod: 'سعر العضو دائمًا هو الأقل، وللأعضاء أولوية في القبول. العضوية بلا أي رسوم.',
      rekkefolge: '<b>الترتيب:</b> تُسجَّل العائلة أولًا، ثم الطفل.',
      advarselTittel: '⚠️ لا يجوز أن تكون عضوًا في أكثر من مكان',
      advarsel: 'القانون النرويجي يمنح الدعم لكل عضو، ولا يُحتسب الشخص في جماعتين دينيتين في وقت واحد. إذا كنتم أعضاء في مكان آخر، يجب سحب العضوية من هناك في أقرب فرصة بعد التسجيل هنا.',
      knappFamilie: '👤 عضوية العائلة',
      knappBarn: '🧒 عضوية طفل',
      knappInfo: 'اقرأ المزيد عن العضوية',
      moske: 'لمزيد من المعلومات عن معهد المدينة (مسجد جرورود): '
    },
    ur: {
      tittel: '💳 مدینہ انسٹی ٹیوٹ کی رکنیت — مفت',
      brod: 'اراکین کے لیے قیمت ہمیشہ کم ہوتی ہے اور داخلے میں ترجیح ملتی ہے۔ رکنیت بالکل مفت ہے۔',
      rekkefolge: '<b>ترتیب:</b> پہلے خاندان، پھر بچہ۔',
      advarselTittel: '⚠️ آپ صرف ایک جگہ رکن ہو سکتے ہیں',
      advarsel: 'ناروے کا قانون فی رکن امداد دیتا ہے، اور کوئی بھی بیک وقت دو مذہبی جماعتوں میں شمار نہیں ہو سکتا۔ اگر آپ کہیں اور رکن ہیں تو یہاں رجسٹر ہونے کے بعد جلد از جلد وہاں سے رکنیت ختم کریں۔',
      knappFamilie: '👤 خاندان کی رکنیت',
      knappBarn: '🧒 بچے کی رکنیت',
      knappInfo: 'رکنیت کے بارے میں مزید',
      moske: 'مدینہ انسٹی ٹیوٹ کے بارے میں مزید: '
    }
  };
