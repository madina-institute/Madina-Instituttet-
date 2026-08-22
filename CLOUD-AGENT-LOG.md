# سجل Cloud Agent — Madina Skole

> **الغرض:** توثيق كل ما نفّذه الوكيل السحابي (Cloud Agent) — أعمال، أخطاء، إصلاحات، نصائح، ومهام متبقية.  
> **المستودع:** `madina-institute/Madina-Instituttet-`  
> **آخر تحديث يدوي:** 2026-08-20 11:30 (Oslo)  
> **آخر تحديث آلي:** <!-- AUTO-LOG-LAST-SYNC: 2026-08-22T03:10:01.843Z -->

---

## كيف يُحدَّث هذا الملف

| النوع | متى | من |
|--------|-----|-----|
| **يدوي** | بعد مهام كبيرة أو جلسة عمل | Cloud Agent (Cursor) |
| **آلي** | كل **10 ساعات** | GitHub Actions → `scripts/update-cloud-agent-log.js` |

التحديث الآلي يضيف **commits جديدة** إلى قسم «سجل التحديثات الآلية» أسفل الملف.  
الأقسام 1–4 يحدّثها الوكيل يدوياً عند إنجاز عمل مهم.

---

## 1. ملخص الأعمال (20 أغسطس 2026)

### Kasserer — تصميم الأزرار (أغسطس 22)

| العمل | التفاصيل |
|--------|-----------|
| خيار 1: بطاقة + Mer | لكل طالب يظهر فقط `Vipps-krav` + `Historikk` + `⋯ Mer`؛ باقي الإجراءات داخل درج «Flere handlinger» |

### بوابة الأولياء (`index4.html`)

| PR | العمل |
|----|--------|
| #36 | توحيد التصميم مع لوحة الإدارة (header، rail، stat-cards) |
| #37 | تجميع القائمة (14→7 hubs)، بطاقات Hjem فقط، شبكة 4 أعمدة |
| #39 | تقسيم حسب **المادة** لبرنامج السبت (Koran / Islam / Arabisk-Urdu) |
| #40–#41 | إصلاح بطاقات مواد **يوم السبت** + **تسطيح التنقل** (4 أزرار مباشرة لكل مادة، تبويبات فوق المحتوى) |
| #42 | توضيح ظهور Vipps عندما Gjenstår = 0 + بanner على Hjem عند وجود restbeløp |

### لوحة الإدارة (`admin.html`)

| PR | العمل |
|----|--------|
| #43 | إصلاح أزرار Kasserer على الجوال (`.actions-col width:1%` → grid كامل) |
| #47 | تنسيق أزرار **Avbryt** لطلبات Vipps المعلّقة (`btn-cancel-vipps`) |
| #48 | إصلاح ختم `SIST-ENDRET` بعد #47 |
| #50 | إيميل طلب الدفع **لكلا الوالدين** + إشعار الإدارة عند الدفع |

### Vipps / Cloud Functions (`functions/index.js`)

| PR | العمل |
|----|--------|
| #44 | إصلاح `Idempotency-Key` (حد Vipps 50 حرف) — SHA-256 قصير |
| #46 | Capture تلقائي قبل الاسترداد + `getVippsPaymentInfo` + dialog محسّن |
| #49 | تنظيف طلبات **EXPIRED** من `pendingVippsPayments` |
| #50 | إيميل admin عند AUTHORIZED + تحديد Foresatt 1/2 + `profile.scope` |
| #51 | إصلاح صيغة `profile.scope` (string وليس array) |

### الرسائل — حذف/إخفاء (قيد الدمج)

| المكان | السلوك |
|--------|--------|
| بوابة المعلم (`index1.html`) | إخفاء محادثة/رسالة للمستخدم (`skjultFor`)؛ حذف نهائي لرسائل الإدارة من صندوق المستخدم |
| بوابة الأولياء (`index4.html`) | نفس المنطق للمحادثات مع المعلم ورسائل الإدارة |
| لوحة الإدارة (`admin.html`) | حذف دائم لأرشيف lærer↔foresatt + Meldingssenter (مجموعة أو م recipient) مع `logDeletion` |
| `firestore.rules` | قواعد `skjultFor` + حذف broadcast للمستلم |

### Fagplan / Årsplan في بوابة المعلم (مدمج)

| المكان | السلوك |
|--------|--------|
| `index1.html` | Fagplan + Årsplan للقراءة فقط — نفس محتوى الإدارة، بدون تعديل أو حذف |
| Undervisning hub | بطاقتا Fagplan و Årsplan — كل المعلمين يرون كل خطط المواد |

### عطلات متعددة البرامج (مدمج — PR #69)

| المكان | السلوك |
|--------|--------|
| `admin.html` | حقل **Gjelder programmer** — checklist مع «Alle programmer» أو اختيار عدة برامج |
| `skoledager.js` | `programmer[]` — قائمة فارغة = كل البرامج؛ دعم `program` القديم |
| `index1.html` / `index4.html` | قراءة `programmer[]` في تقويم العطلات |

### إصلاح تسجيل دخول بوابة المعلم (PR #70)

| المشكلة | الحل |
|---------|------|
| زر «Logg inn» لا يعمل ولا يظهر خطأ | قوس `}` زائد بعد `finishLessonPlanSubmission` (من PR #68) منع تحميل ES-module بالكامل — `doLogin` لم يُعرَّف |

### بنية تحتية / عمليات

| PR | العمل |
|----|--------|
| #45 | `AGENTS.md` — قاعدة إلزامية لختم `SIST-ENDRET` |
| #32 | إصلاح CI لـ Cloud Functions (`.env` لـ `VIPPS_ENV`…) |
| #33–#34 | إصلاح admin عالق على «Henter økten din» + bootstrap `tilgang` |
| #38 | توحيد تصميم بوابة المعلّم (`index1.html`) |

---

## 2. الأخطاء التي وقعنا فيها وكيف أُصلحت

### ADM-VIP-01 — Idempotency-Key طويل جداً (#44)

- **الخطأ:** `Idempotency-Key must have a maximum length of '50'`
- **السبب:** `refund-{reference}-{timestamp}` ≈ 66 حرف
- **الإصلاح:** `vippsIdempotencyKey(prefix, ...parts)` → `rf-{hash32}` (~35 حرف)
- **الملف:** `functions/index.js`

### ADM-VIP-01 — Not enough refundable / 6150 (#46)

- **الخطأ:** `Cannot refund more than the available amount`
- **السبب:** Webhook يسجّل AUTHORIZED لكن Vipps يسترد من **captured** فقط (`capturedAmount = 0`)
- **الإصلاح:** `ensureVippsRefundable()` — capture تلقائي قبل refund + dialog يعرض refunderbart beløp
- **الملفات:** `functions/index.js`, `admin.html`

### ADM-VIP-03 — EXPIRED / 6190 (#49)

- **الخطأ:** `Invalid state: EXPIRED` عند Avbryt
- **السبب:** طلب منتهٍ عند Vipps لكن `pendingVippsPayments.status = pending`
- **الإصلاح:** عند حالات terminal (EXPIRED, CANCELLED, …) → إغلاق السجل + رسالة نجاح للمستخدم
- **الملف:** `functions/index.js`

### Vipps create payment — profile.scope (#51)

- **الخطأ:** `400 Bad Request` — `Unexpected character [ in profile.scope`
- **السبب:** أرسلنا `scope: ["phoneNumber", "name"]` (مصفوفة JSON)
- **الإصلاح:** `scope: "phoneNumber name"` (نص مفصول بمسافات حسب وثائق Vipps)
- **الملف:** `functions/index.js`

### ختم SIST-ENDRET ناقص (#45, #48)

- **المشكلة:** Cloud Agent ينشر عبر git بدون `publish-tool.html` → «Sist endret» قديم أو «Uten tidsstempel»
- **الإصلاح:** تحديث يدوي + قاعدة في `AGENTS.md`
- **الصيغة:** `<!-- SIST-ENDRET: YYYY-MM-DD HH:MM:SS -->` (Oslo) بعد `<!DOCTYPE html>`

### Kasserer — أزرار «عارية» على الجوال (#47)

- **المشكلة:** Avbryt بخلفية شفافة وحدود باهتة
- **الإصلاح:** class `btn-cancel-vipps` + grid أبيض لباقي الأزرار

### إيميل Vipps — والد واحد فقط (#50)

- **المشكلة:** `sendStudentVippsRequest` يرسل لـ foresatt 1 فقط (depositum كان يرسل للاثنين)
- **الإصلاح:** `epostTilBeggeForesatteForElev()` — portal + copy fields

### بوابة الأولياء — مواد السبت (#40–#41)

- **المشكلة:** قائمة مسطحة Lekser/Plan/Videoer بدل بطاقات المواد
- **السبب:** `hours` لم تُحمّل أو عدم تطابق klasse id/name
- **الإصلاح:** `erIntegrertLordagProgram()`, `standardLordagFag()`, `elevKlasseKeys()`, تنقل مسطّح

---

## 3. نصائح وتوصيات مستقبلية

### للوكيل (Cloud Agent)

1. **دائماً** حدّث `SIST-ENDRET` في نفس commit مع تعديل HTML/JS — راجع `AGENTS.md`
2. **دائماً** حدّث هذا الملف (`CLOUD-AGENT-LOG.md`) بعد جلسة عمل كبيرة (القسم 1–4)
3. **Vipps Idempotency-Key:** never > 50 chars — use `vippsIdempotencyKey()`
4. **Vipps profile.scope:** string `"phoneNumber name"` — NOT array
5. **Refund:** check captured vs authorized — may need capture first
6. **Pending Vipps:** sync terminal states (EXPIRED) — don't leave stale `pending`
7. **Email both guardians** for balance requests — mirror depositum logic
8. **Deploy paths:** `functions/**` → Functions CI; `*.html` → Hosting CI; `*.md` ignored by hosting

### للإدارة (Yasser / الفريق)

1. **Varslinger** (`admin → Varslinger`): حدّد ممن يستلم إشعار **Vipps-betaling mottatt** (نفس قائمة ny påmelding)
2. **تأكد** من إيميلات foresatt 1 و 2 في بطاقة الطالب قبل Send Vipps-krav
3. **Push Vipps** يذهب لرقم foresatt 1 — الرابط في الإيميل يصلح للوالد الثاني
4. **profile.scope** يضيف شاشة موافقة في Vipps — طبيعي لمعرفة من دفع
5. **بعد merge:** انتظر 2–5 دقائق لـ Hosting + Functions deploy
6. **helsesjekk.html** — راقب فشل إرسال `mail` collection

### Vipps — قيود معروفة

| الموضوع | الواقع |
|---------|--------|
| Push | رقم واحد (foresatt 1) |
| CARD في test | غير متاح — #35 |
| Capture | مطلوب قبل refund |
| EXPIRED | لا cancel — نظّف Firestore |
| profile.scope | consent screen — قلل scopes إن أمكن |

---

## 4. مهام متبقية

- [ ] **اختبار live:** استرداد Adam Nasser بعد #46 + #44
- [ ] **اختبار live:** Send Vipps-krav لـ Omar Karim بعد #51
- [ ] **اختبار:** إيميل admin عند دفع Vipps (Varslinger مفعّلة؟)
- [ ] **اختبار:** إيميل لكلا الوالدين عند Send Vipps-krav (balance)
- [ ] **UX (اقتراح سابق):** معاينة الواجب مباشرة تحت كل مادة في hub Undervisning
- [ ] **Capture في webhook:** consider auto-capture on AUTHORIZED (بدل capture عند refund فقط)
- [ ] **vippsBetalingAktiv:** toggle منفصل في Varslinger (حالياً يستخدم nySoknadMottakere)
- [ ] **تنظيف pending قديم:** job دوري لمزامنة EXPIRED/CANCELLED مع Vipps API
- [ ] **sendVippsPaymentLink** (legacy): لا يزال foresatt1-only — unifier أو deprecate
- [ ] **sendGuardianInvoice / sendCashierReport:** foresatt 1 only — consider both parents

---

## 5. سجل PRs المدمجة (مرجع سريع)

| # | العنوان | merged (UTC) |
|---|---------|--------------|
| 51 | Fix Vipps profile.scope format | 2026-08-20 09:23 |
| 50 | Vipps: email both guardians + admin notification | 2026-08-20 09:16 |
| 49 | Clean up expired Vipps pending (6190) | 2026-08-20 09:05 |
| 48 | SIST-ENDRET stamp admin | 2026-08-20 09:03 |
| 47 | Fix naked Avbryt buttons (mobile) | 2026-08-20 09:00 |
| 46 | Vipps refund auto-capture (6150) | 2026-08-20 08:53 |
| 45 | SIST-ENDRET + AGENTS.md | 2026-08-20 08:43 |
| 44 | Idempotency-Key max 50 | 2026-08-20 08:33 |
| 43 | Kasserer mobile buttons | 2026-08-20 08:29 |
| 42 | Vipps visibility balance=0 | 2026-08-20 08:11 |
| 41 | Saturday subjects + flat nav | 2026-08-20 08:03 |
| 40 | Saturday subject cards | 2026-08-20 07:44 |
| 39 | Parent portal by subject | 2026-08-20 07:27 |
| 38 | Teacher portal design | 2026-08-20 07:05 |
| 37 | Parent grouped nav | 2026-08-20 06:42 |
| 36 | Parent admin shell design | 2026-08-20 03:21 |

---

## 6. سجل التحديثات الآلية (commits)

<!-- AUTO-LOG-ENTRIES-BEGIN -->
- `2026-08-22T01:48:13Z` · `a552220` · Merge pull request #106 from madina-institute/cursor/kvittering-pdfkit-c9a0
- `2026-08-22T01:47:49Z` · `2baadae` · Fix payment receipt PDF: use PDFKit server endpoint like Vipps email
- `2026-08-22T03:42:22+02:00` · `09bd2d5` · Slett madinabarn-arsplan-2026-2027-tospraklig.html via publiseringsverktøy
- `2026-08-22T01:42:09Z` · `13a86f1` · Merge pull request #105 from madina-institute/cursor/betalingsrapport-pdfkit-c9a0
- `2026-08-22T01:41:39Z` · `21b20d7` · Generate Betalingsoversikt PDF with PDFKit (same as payment receipt)
- `2026-08-22T01:34:10Z` · `559b179` · Merge pull request #104 from madina-institute/cursor/betalingsrapport-pdf-fix2-c9a0
- `2026-08-22T01:33:33Z` · `84e0982` · Fix Betalingsoversikt PDF: embedded stamp, iframe render, no empty pages
- `2026-08-22T01:24:44Z` · `25a900f` · Merge pull request #103 from madina-institute/cursor/betalingsrapport-stempel-fix-c9a0
- `2026-08-22T01:24:20Z` · `6812202` · Fix Betalingsoversikt PDF: stamp, date, and page width
- `2026-08-22T01:15:23Z` · `309b43f` · Merge pull request #102 from madina-institute/cursor/betalingsrapport-one-page-c9a0
- `2026-08-22T01:14:54Z` · `045f568` · Fix Betalingsoversikt PDF: fit footer on single A4 page
- `2026-08-22T01:08:04Z` · `d8c019f` · Merge pull request #101 from madina-institute/cursor/betalingsrapport-gap-fix-c9a0
- `2026-08-22T01:07:42Z` · `d077c56` · Fix Betalingsoversikt PDF middle gap in html2pdf output
- `2026-08-22T01:00:59Z` · `fabffe4` · Merge pull request #100 from madina-institute/cursor/cashier-historikk-knapper-c9a0
- `2026-08-22T01:00:36Z` · `cfef1c0` · Add per-payment Send/Vis kvittering and Vis rapport in Kasserer
- `2026-08-22T00:53:03Z` · `f3fc19f` · Merge pull request #99 from madina-institute/cursor/betalingsrapport-html2pdf-fix-c9a0
- `2026-08-22T00:52:33Z` · `9af56e0` · Fix Betalingsoversikt PDF layout for html2pdf rendering
- `2026-08-22T00:47:32Z` · `7095c8c` · Merge pull request #98 from madina-institute/cursor/varsel-betaling-fixes-c9a0
- `2026-08-22T00:47:25Z` · `8c7dcf7` · Merge main and keep all-guardians email dedup logic
- `2026-08-22T00:44:17Z` · `68c6206` · Send payment confirmation to all guardians with deduplicated emails
- `2026-08-22T02:43:37+02:00` · `583f7d4` · Fix varsel checkboxes, duplicate betaling emails, and Betalingsoversikt PDF layout (#97)
- `2026-08-22T00:42:21Z` · `ee07da3` · Fix varsel checkboxes, duplicate payment emails, and PDF layout
- `2026-08-22T00:33:06Z` · `dc9ab2b` · Fix missing PDF attachment on payment confirmation emails
- `2026-08-22T00:25:19Z` · `50ba245` · Merge pull request #94 from madina-institute/cursor/betaling-kvittering-pdf-c9a0
- `2026-08-22T00:24:58Z` · `0d446d0` · Merge main into betaling-kvittering: combine PDF rapport format fix with per-payment kvittering
- `2026-08-22T00:23:50Z` · `c96613f` · Merge pull request #95 from madina-institute/cursor/betalingsrapport-format-fix-c9a0
- `2026-08-22T00:21:05Z` · `e6984fb` · Fix betalingsrapport PDF layout to match agreed format
- `2026-08-22T00:14:28Z` · `7301b40` · Send PDF betalingskvittering ved hver betaling
- `2026-08-22T02:12:40+02:00` · `4d92112` · Fix betalingsrapport PDF: én side med flerspalte historikk (#93)
- `2026-08-22T00:09:22Z` · `e0ebcae` · Merge origin/main into cursor/betalingsrapport-pdf-c9a0
- `2026-08-22T00:06:37Z` · `77f0af7` · Fix betalingsrapport PDF layout: én side, flerspalte historikk
- `2026-08-22T01:55:49+02:00` · `db4c4ac` · Send betalingsrapport som PDF med Madina-stempel (#92)
- `2026-08-21T23:48:49Z` · `c092fa2` · Send betalingsrapport som PDF med Madina-stempel
- `2026-08-21T23:24:19Z` · `12d80e6` · Admin: tydelig melding når Vipps avviser PUSH_MESSAGE (5080)
- `2026-08-21T23:13:23Z` · `93baf38` · Fix Vipps PUSH: e-post om Betalinger + diagnostikk redirectUrl
- `2026-08-21T23:11:33Z` · `c7d3ab3` · Fix Vipps PUSH: ren payload for app + tydelig admin-diagnostikk
- `2026-08-22T00:58:29+02:00` · `f009659` · Fix admin panel stuck on mobile Safari session loading (#90)
- `2026-08-22T00:52:36+02:00` · `967d62e` · Fix Vipps test: admin PUSH alltid synlig i app + WEB-lenke til e-post (#89)
- `2026-08-22T00:36:26+02:00` · `a8e9abb` · Admin Kasserer: skill skolens Vipps-krav fra foresatt-forsøk (#88)
- `2026-08-22T00:18:46+02:00` · `9ff5ed3` · Foreldreportal: Vipps-krav-fiks + betalings-UX (beløp først, tydelig kort/Vipps) (#87)
- `2026-08-21T21:49:30Z` · `c207bd6` · Merge pull request #86 from madina-institute/cursor/vipps-payment-emails-fix-c9a0
- `2026-08-21T21:45:08Z` · `de45226` · Fix payment emails: restore admin notifications and add parent receipts
- `2026-08-21T21:36:21Z` · `f7b74af` · Merge pull request #85 from madina-institute/cursor/vipps-card-email-label-c9a0
- `2026-08-21T21:31:20Z` · `6c2fef8` · Fix payment confirmation email: show bankkort instead of Vipps for CARD payments
- `2026-08-21T23:24:23+02:00` · `ca1cc29` · Fix CARD payment: omit profile.scope for Vipps ePayment (#84)
- `2026-08-21T23:09:16+02:00` · `c0eb524` · Restrict Vipps card payment toggle to øverste leder only (#83)
- `2026-08-21T20:55:32Z` · `62c9f5b` · chore: auto-update CLOUD-AGENT-LOG (10h sync)
- `2026-08-21T22:47:09+02:00` · `f434b79` · Enhance webhook signature verification process
- `2026-08-21T18:16:28Z` · `2acbb60` · Merge pull request #81 from madina-institute/cursor/varsel-duplikat-rydd-c9a0
- `2026-08-21T18:16:00Z` · `b14e794` · Fix duplicate recipients in Varslinger settings list
- `2026-08-21T18:08:16Z` · `e95a9d9` · Merge pull request #80 from madina-institute/cursor/first-login-varsel-c9a0
- `2026-08-21T18:03:53Z` · `c43dfcd` · Add first-login email notification for admin and teacher portals
- `2026-08-21T18:37:42+02:00` · `32258c6` · Oppdater madinabarn-arsplan-2026-2027-tospraklig.html via publiseringsverktøy
- `2026-08-21T18:18:58+02:00` · `6f34cb9` · Oppdater madinabarn-arsplan-2026-2027-tospraklig.html via publiseringsverktøy
- `2026-08-21T18:04:53+02:00` · `76ac671` · Oppdater madinabarn-arsplan-2026-2027-tospraklig.html via publiseringsverktøy
- `2026-08-21T11:02:45Z` · `0be1128` · chore: auto-update CLOUD-AGENT-LOG (10h sync)
- `2026-08-21T03:31:55Z` · `6a91086` · chore: auto-update CLOUD-AGENT-LOG (10h sync)
- `2026-08-21T00:36:19+02:00` · `3c65ab3` · fix(portals): restore page after refresh in teacher and parent portals (#78)
- `2026-08-21T00:27:03+02:00` · `c5b3890` · fix(admin): restore tab after page refresh (#77)
- `2026-08-20T23:59:06+02:00` · `c9f7fc0` · fix(teacher): class students as main sidebar tab (#76)
- `2026-08-20T23:54:56+02:00` · `4bada07` · Merge pull request #75 from madina-institute/cursor/teacher-class-students-c9a0
- `2026-08-20T21:39:04Z` · `c6d7180` · feat(teacher): class students tab and homework delete on edit
- `2026-08-20T21:25:05Z` · `6554477` · fix(teacher): tell riktige uleste meldinger på hjem-skjerm
- `2026-08-20T21:24:50Z` · `1b7cbed` · Merge pull request #73 from madina-institute/cursor/teacher-hide-old-msgs-c9a0
- `2026-08-20T21:24:28Z` · `6865eac` · fix(teacher): skjul forgjengerens private meldinger
- `2026-08-20T21:15:44Z` · `933b2a0` · Merge pull request #72 from madina-institute/cursor/teacher-homework-edit-delete-c9a0
- `2026-08-20T21:15:23Z` · `50a8e2f` · feat(teacher): rediger og slett egne lekser i portalen
- `2026-08-20T21:15:23Z` · `5904f8a` · fix(rules): la lærere slette og redigere egne lekser
- `2026-08-20T21:09:56Z` · `972a338` · fix(teacher): oppdater læreplanregler ved språkbytte
- `2026-08-20T21:09:40Z` · `dbc31e9` · Merge pull request #71 from madina-institute/cursor/teacher-laereplanregler-c9a0
- `2026-08-20T21:06:45Z` · `cb0c250` · feat(teacher): vis læreplanregler read-only i lærerportalen
- `2026-08-20T21:03:37Z` · `f6c18ac` · chore: auto-update CLOUD-AGENT-LOG (10h sync)
- `2026-08-20T20:59:07Z` · `1c00a67` · docs: logg lærerportal innloggingsfix i CLOUD-AGENT-LOG
- `2026-08-20T20:59:01Z` · `0925f54` · Merge pull request #70 from madina-institute/cursor/teacher-login-fix-c9a0
- `2026-08-20T20:58:38Z` · `07d563a` · fix(teacher): reparer syntaksfeil som blokkerte innlogging
- `2026-08-20T20:43:16Z` · `239be95` · Merge pull request #69 from madina-institute/cursor/holiday-multi-program-c9a0
- `2026-08-20T20:42:42Z` · `eb6054c` · docs: logg ferie flere programmer i CLOUD-AGENT-LOG
- `2026-08-20T20:42:36Z` · `1e20579` · feat: velg flere programmer for skolekalender-ferier
- `2026-08-20T20:37:44Z` · `7b50351` · Merge pull request #68 from madina-institute/cursor/teacher-fagplan-arsplan-c9a0
- `2026-08-20T20:37:16Z` · `ef7bb82` · Add read-only fagplan and årsplan to teacher portal
- `2026-08-20T20:24:04Z` · `0e7a1d9` · Merge pull request #67 from madina-institute/cursor/message-delete-c9a0
- `2026-08-20T20:23:46Z` · `8f0ec8a` · Update CLOUD-AGENT-LOG with message delete feature notes
- `2026-08-20T20:23:39Z` · `a06dd49` · Add message delete/hide in teacher, parent, and admin portals
- `2026-08-20T20:05:16Z` · `664690c` · Merge pull request #66 from madina-institute/cursor/assistent-portal-c9a0
- `2026-08-20T20:05:13Z` · `cce1671` · Merge pull request #65 from madina-institute/cursor/reset-data-ux-fix-c9a0
- `2026-08-20T19:58:49Z` · `85b858e` · Add Assistent role: multi-class assignment, read-only plans, own identity
- `2026-08-20T19:36:11Z` · `0ce7a66` · Use single two-step modal for reset: password then SLETT TESTDATA
- `2026-08-20T19:32:59Z` · `c1b0ef7` · Add danger zone hint for owner password and confirmation text
- `2026-08-20T19:32:50Z` · `1616cf0` · Fix reset UX: clarify owner password and SLETT TESTDATA step
- `2026-08-20T17:57:42+02:00` · `53c3afb` · feat(admin): complete reset keeping registrations only (#64)
- `2026-08-20T17:07:03+02:00` · `c8031ad` · Merge pull request #63 from madina-institute/cursor/teacher-portal-ui-polish-c9a0
- `2026-08-20T15:04:07Z` · `340b2b5` · style(teacher): polish UI without changing portal flow
- `2026-08-20T16:55:31+02:00` · `05d3748` · prototype: interactive teacher portal fag-UX variants A/B/C (#62)
- `2026-08-20T14:17:48Z` · `22700d2` · Merge pull request #61 from madina-institute/cursor/vipps-prod-setup-c9a0
- `2026-08-20T14:14:26+02:00` · `e55a668` · Oppdater salgsvilkar.html via publiseringsverktøy
- `2026-08-20T11:22:54Z` · `54f5a97` · docs(functions): document GitHub secrets for Vipps prod deploy
- `2026-08-20T11:22:45Z` · `3d3d810` · feat(vipps): prod CI secrets, admin card toggle, setup script
- `2026-08-20T11:03:49Z` · `0cf76ed` · chore: auto-update CLOUD-AGENT-LOG (10h sync)
- `2026-08-20T12:51:46+02:00` · `00c3b38` · Fix admin panel logout and red sync badge after rules change (#59)
- `2026-08-20T12:43:28+02:00` · `ce73c8e` · Sync admin Vipps requests, cancel, and refunds in parent portal (#58)
- `2026-08-20T10:32:44Z` · `49db831` · Merge pull request #57 from madina-institute/cursor/vipps-email-card-buttons-c9a0
- `2026-08-20T10:32:23Z` · `04d73e0` · Add Vipps + card payment buttons in parent payment emails
- `2026-08-20T10:05:44Z` · `965d0cd` · Merge pull request #56 from madina-institute/cursor/vipps-dual-push-email-c9a0
- `2026-08-20T10:05:11Z` · `4bda70a` · Dual Vipps payment: PUSH for app + WEB for email link
- `2026-08-20T09:57:01Z` · `c4f2f14` · Merge pull request #55 from madina-institute/cursor/vipps-push-and-dialog-fix-c9a0
- `2026-08-20T09:56:42Z` · `dcc12cd` · Restore Vipps push, fix ABORTED cancel, shorten admin dialog
- `2026-08-20T09:44:48Z` · `9927036` · Merge pull request #54 from madina-institute/cursor/vipps-email-link-guard-c9a0
- `2026-08-20T09:42:38Z` · `7b38c5d` · Block Vipps parent email when payment link is missing
- `2026-08-20T11:33:39+02:00` · `eb591b9` · Fix missing Vipps payment link in parent emails (#53)
- `2026-08-20T09:26:58Z` · `6bfb834` · Merge pull request #52 from madina-institute/cursor/cloud-agent-log-c9a0
- `2026-08-20T09:26:31Z` · `88189bf` · Add CLOUD-AGENT-LOG with 10h auto-update via GitHub Actions
_يُملأ تلقائياً كل 10 ساعات من GitHub Actions._
<!-- AUTO-LOG-ENTRIES-END -->

---

## 7. ملفات مرجعية

| الملف | الغرض |
|-------|--------|
| `AGENTS.md` | قواعد Cloud Agent (SIST-ENDRET، deploy) |
| `CLOUD-AGENT-LOG.md` | هذا الملف |
| `scripts/update-cloud-agent-log.js` | سكربت التحديث الآلي |
| `.github/workflows/cloud-agent-log.yml` | Cron كل 10 ساعات |
| `publish-tool.html` | `stemplFil()` — مرجع الختم |
| `functions/README.md` | Vipps setup |

---

*نهاية السجل — يُحدَّث يدوياً + آلياً.*
