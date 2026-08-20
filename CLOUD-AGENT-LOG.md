# سجل Cloud Agent — Madina Skole

> **الغرض:** توثيق كل ما نفّذه الوكيل السحابي (Cloud Agent) — أعمال، أخطاء، إصلاحات، نصائح، ومهام متبقية.  
> **المستودع:** `madina-institute/Madina-Instituttet-`  
> **آخر تحديث يدوي:** 2026-08-20 11:30 (Oslo)  
> **آخر تحديث آلي:** <!-- AUTO-LOG-LAST-SYNC: 2026-08-20T09:26:24.030Z -->

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
