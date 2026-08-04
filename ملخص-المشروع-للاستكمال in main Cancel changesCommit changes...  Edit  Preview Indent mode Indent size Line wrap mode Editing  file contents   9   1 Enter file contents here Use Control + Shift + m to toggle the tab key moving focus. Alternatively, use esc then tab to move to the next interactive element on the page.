# ملخص مشروع مدرسة مدينة — نقطة الاستكمال

**آخر تحديث: 4 أغسطس 2026**

الصق الملف ده في أول رسالة في محادثة جديدة مع Claude عشان يفهم السياق كامل.

---

## 1) نظرة عامة

- **المدرسة**: Madina Skole — مدرسة إسلامية في النرويج (قرآن/إسلام/عربي/أردو)
- **الدومين**: madinaskole.no
- **مشروع Firebase**: `madina-instituttet`
- **الريبو**: `madina-institute/Madina-Instituttet-` (فرع `main`)
- **البنية**: ملفات HTML مستقلة (بدون framework) + Firestore + Cloud Functions + Firebase Hosting
- **المجلد المحلي**: `C:\Users\yasse\iCloudDrive\Disktop\madina-vipps`

## 2) الملفات

| الملف | الوظيفة |
|---|---|
| `admin.html` | لوحة التحكم الكاملة (~7000 سطر) |
| `functions/index.js` | Cloud Functions: فيبس + إيميلات |
| `index.html` | الصفحة الرئيسية (3 لغات) — لا تلمس Firestore |
| `index1.html` | بوابة المعلمين |
| `index2.html` | استمارة التسجيل العامة — **الوحيدة اللي بتكتب بدون تسجيل دخول** |
| `index3.html` | البوابة الرئيسية — لا تلمس Firestore |
| `index4.html` | بوابة أولياء الأمور |
| `foreldreinnsyn.html` / `larerinnsyn.html` | بوابات استعلام |
| `timeplan.html` / `kunngjoring.html` | الجدول / الإعلانات — لا تلمس Firestore |
| `publish-tool.html` | أداة النشر (ترفع على GitHub API) |
| `slettelogg.html` / `statistikk.html` / `personvern.html` | سجل حذف / إحصائيات / خصوصية |
| `firestore.rules` | **توثيق فقط** — القواعد الفعلية في Firebase Console |
| `firebase.json` | إعدادات النشر والكاش |
| `.github/workflows/firebase-hosting.yml` | نشر تلقائي للموقع |
| `.github/workflows/firebase-functions.yml` | نشر تلقائي للـFunctions |

## 3) البنية التحتية والنشر ✅

الموقع على **Firebase Hosting** (اتحوّل من GitHub Pages).

- DNS: سجل A → `199.36.158.100` + TXT verification. سجلات GitHub Pages القديمة اتمسحت
- SSL شغال
- `firebase.json` فيه `no-cache` لملفات HTML — حل مشكلة الكاش المزمنة
- **GitHub Pages اتقفل نهائيًا** (Unpublish site) في 4 أغسطس — بقى Firebase Hosting هو المصدر الوحيد

**النشر التلقائي:**
- أي ملف HTML على `main` → `firebase-hosting.yml` ينشره
- أي تعديل جوه `functions/` → `firebase-functions.yml` ينشره
- Secret اسمه `FIREBASE_TOKEN` في GitHub → Settings → Secrets and variables → Actions
- النشر شغال من أي جهاز حتى الموبايل، بدون CMD وبدون VPS

**⚠️ مهم — الـ workflow اتغيّر في 4 أغسطس:**
`FirebaseExtended/action-hosting-deploy` شال دعم `firebaseToken` وبقى يطلب `firebaseServiceAccount`، فكان النشر بيفشل بعد 9 ثواني برسالة:
`Error: Input required and not supplied: firebaseServiceAccount`

الحل المطبّق: الـ workflow بقى يستخدم `firebase-tools` مباشرة بنفس التوكن:
```yaml
- run: npm install -g firebase-tools
- run: firebase deploy --only hosting --project madina-instituttet --non-interactive
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

**لو النشر فشل مستقبلًا بمشكلة صلاحيات:** غالبًا التوكن انتهى — `firebase login:ci` من الكمبيوتر وحدّث الـSecret.

## 4) نظام الإيميلات ✅

- **Brevo** (SMTP) مربوطة بإضافة Firebase "Trigger Email" (مجموعة `mail`)
- دومين madinaskole.no موثّق في Brevo (DKIM + DMARC مدموج مع سجل Zoho)
- كل إيميلات النظام من: `Madina Skole <post@madinaskole.no>`
- عنوان كل إيميل بيتضاف له اسم المستلم بين قوسين
- **Firebase Auth**: Email verification → `post@madinaskole.no` | Password reset → `noreply@madinaskole.no` (بقرار المستخدم)
- ⏸️ **مؤجل**: استقبال ردود الإيميلات تلقائيًا (Inbound Parsing)

## 5) الميزات المبنية في admin.html

1. **الكاشير**: المستحق/المدفوع/المتبقي لكل طالب، سجل دفعات، دفعة يدوية، رابور، تصدير CSV
2. **حساب المستحق تلقائيًا**: 2750 كرونة (المدرسة الإسلامية) / 1500 (مدينابارن) + خصم إخوة (20% للتاني، 30% للثالث+)
3. **Kasserer (Ledelse)** — لدور "Eier" فقط: استرجاع دفعة فيبس، إلغاء طلب معلّق، خصم مخصص، فاتورة
4. **حذف هرمي**: "Eier" فقط يحذف حسابات الموظفين
5. **تصميم الكروت**: صف أفقي عريض + كارت تفاصيل موسّع + طباعة مخصصة
6. **الربط المتبادل**: أي اسم مرتبط قابل للضغط ويفتح سجله
7. **تحضير الدروس**: نموذج 60 دقيقة (شوطين) + حقول لكل مادة + ربط بخطة الشهر
8. **المجلدات**: الطلبات (4 مجلدات) / الطلاب (مجلد لكل صف + بدون صف + منسحب)
9. **رصيد المدرسة**: تحصيل الطلاب + دخل يدوي − مصروفات، بفلتر شهري
10. **نظام الرواتب**: رقم حساب + حالة (متطوع/بأجر)، ساعات ذاتية من بوابة المعلم (منتظر موافقة)، موافقة أو تعديل-مع-سبب، حساب من الساعات المعتمدة فقط (200/ساعة معلم، 150 مساعد، 0 متطوع)، دفع يسجّل المصروف تلقائيًا
11. **جلسة دائمة للمالك**: `PERSISTENT_SESSION_EMAILS = ['yasser.m.s.abdelrahim@gmail.com']` — يفضل داخل بعد قفل المتصفح ومعفى من قفل الخمول. باقي الحسابات لم تتغير. 🔒 الجهاز لازم يكون محمي بقفل قوي

## 6) مجموعات Firestore

`students` · `guardians` · `teachers` · `adminUsers` · `ledelse` · `classes` · `registrations` · `attendance` · `lessonPlans` · `homework` · `homeworkSubmissions` · `absenceRequests` · `studentNotes` · `practiceVideos` · `dailyPlanTemplates` · `monthlyPlanTemplates` · `semesterPlanTemplates` · `monthlyPlans` · `semesterPlans` · `hours` · `messages` · `messageThreads` · `broadcastThreads` · `broadcastMessages` · `classPosts` · `classPostComments` · `classPollVotes` · `eventRSVPs` · `announcements` · `contactUpdateRequests` · `finances` · `financeLog` · `paymentRequests` · `studentPayments` · `pendingVippsPayments` · `salaryPayments` · `teacherAttendance` · `meetings` · `settings` · `deletionLog` · `loginEvents` · `formAnalytics` · `mail`

## 7) 🔒 الأمان — اتصلح في 4 أغسطس 2026

### المشكلة اللي كانت موجودة
حوالي **25 مجموعة** كان فيها `allow read: if true` — يعني **أي حد على النت بدون أي تسجيل دخول** كان يقدر يقرا بيانات الطلاب، أولياء الأمور، المعلمين، الرسائل الخاصة، وملاحظات الطلاب. ده كان خطر GDPR حقيقي (بيانات أطفال في النرويج).

### الحل المطبّق
كل `read: if true` بقت `read: if request.auth != null`، ماعدا:
- `registrations` → `create: if true` (الاستمارة العامة)
- `formAnalytics` → `create: if true` (عداد الزيارات)

واتضاف `match /{document=**} { allow read, write: if false; }` في الآخر عشان يقفل أي مجموعة جديدة تتنسى.

**القواعد الفعلية موجودة في Firebase Console → Firestore → Rules.**
ملف `firestore.rules` في الريبو **توثيق فقط، مش بينشر نفسه.**

### 🐛 المشكلة اللي ظهرت بعد تطبيق القواعد
البوابات وقعت فورًا برسالة "الحساب غير موجود". السبب اتنين:
1. `index1` و `index4` كانوا بيدوّروا على المعلم/ولي الأمر في القايمة **قبل** تسجيل الدخول
2. كل الـ`onSnapshot` كانت بتتربط عند تحميل الصفحة — يعني قبل الدخول، فبترفض بصلاحيات بشكل دائم (**Firestore SDK لا يعيد المحاولة أبدًا**)

### الحل المطبّق في 4 ملفات
`index1.html` · `index4.html` · `foreldreinnsyn.html` · `larerinnsyn.html`

1. **دالة `watch()`** بديلة عن `onSnapshot` المباشر — بتأجّل كل مستمع لحد `startDataListeners()` اللي بتتنادى بعد تأكيد الدخول. اتحوّل 57 مستمع
2. **ترتيب الدخول اتعكس** في `index1`/`index4`: تسجيل الدخول الأول → `getDocs` للبحث عن السجل → لو مش موجود يعمل `signOut` فورًا
3. **`foreldreinnsyn`/`larerinnsyn`**: المستمعين بيبدأوا من جوه `onAuthStateChanged`
4. **تسجيل الخروج بقى بيعمل `location.reload()`** — بدونه المستمعين بيموتوا بعد الخروج ومش بيرجعوا لو دخلت تاني في نفس التبويب

**فايدة أمنية جانبية**: قبل كده صفحة الدخول كانت تقول "لا يوجد حساب بهذا الإيميل" قبل التحقق من الباسورد، فكان أي حد يقدر يعرف مين مسجّل في المدرسة. دلوقتي مبقاش ينفع.

**✅ تم اختبار الأربع بوابات + الاستمارة العامة + admin.html بعد التعديل — كلها شغالة.**

## 8) 🐛 أخطاء تانية اتصلحت (مرجعية)

**أ) الكاشير كان بيعرض 0 دايمًا**
نفس سبب مشكلة البوابات: `onSnapshot` قبل تأكيد الدخول. الحل: نقله لدالة بعد الدخول.

**ب) إيميلات إعداد الحساب مكانتش توصل للمستخدمين الجدد**
الكود كان بينشئ الحساب في جلسة مؤقتة ويبعت الإيميل من نفس الجلسة، وبعدين يقفلها فورًا → الطلب بيتقطع (فشل صامت). الحل: إنشاء الحساب → قفل الجلسة المؤقتة → إرسال من الجلسة الأساسية.

**ج) شارة "آخر نشر" كانت مضللة**
كانت بتقرا من GitHub Pages Deployments API (اللي مبقاش شغال). الحل: بقت تقرا آخر تشغيل ناجح لـ`firebase-hosting.yml`. اتعدلت في 9 ملفات.
⚠️ **حدود معروفة**: (1) مبتقيسش النشر من `firebase deploy` المباشر (2) مبتقيسش نشر الـFunctions. **التوصية: انشر دايمًا عبر GitHub**.

## 9) ⏳ المتبقي قبل الإطلاق الحقيقي

1. `VIPPS_ENV=production` في `functions/.env.madina-instituttet`
2. مفاتيح فيبس الحقيقية في **Firebase Secret Manager** (مش في ملف الـenv) — الكود بيستخدم `defineSecret` بالفعل. أي سر جديد يحتاج deploy تاني عشان يترتبط
3. رقم التاجر الحقيقي (`VIPPS_MSN=465281` الحالي رقم اختبار)
4. **المرحلة 2 من الأمان (لسه ما اتعملتش)**: حاليًا أي حساب مسجّل يقدر تقنيًا يقرا/يكتب أي حاجة — بما فيها `salaryPayments` و`teacherAttendance` (معلم يقدر يوافق على ساعات نفسه).

   ⚠️ **ملاحظة معمارية مهمة**: التقييد حسب الدور **مش شغل قواعد بس** — البوابات بتحمّل المجموعات كاملة وتفلتر في المتصفح (`index1` بيحمّل 24 مجموعة، `index4` بيحمّل 20). و Firestore بيرفض الاستعلام كله لو فيه ولا مستند واحد ممكن يتعارض مع القاعدة. فقاعدة "ولي الأمر يشوف ابنه بس" هتخلي البوابة تطلع **فاضية** مش تفلتر. يعني ده محتاج إعادة كتابة الاستعلامات في الكود، مش تعديل قواعد.

## 10) ملف الإعدادات الحالي

`functions/.env.madina-instituttet`:
```
VIPPS_ENV=test
VIPPS_MSN=465281
SITE_BASE_URL=https://madinaskole.no
```

📌 **قاعدة**: أي قيمة فيها SECRET/KEY/PASSWORD **متتحطش هنا أبدًا** (الريبو عام) — تروح لـSecret Manager.

## 11) ملاحظات تقنية دائمة

1. أي كود JS جديد لازم يتفحص syntax قبل التسليم (`node --check` على محتوى `<script type="module">`)
2. **أي `onSnapshot` جديد لازم يمر عبر `watch()`** في البوابات الأربعة — لو اتكتب مباشر هيترفض بالصلاحيات ويفضل ميت
3. الروتين الآمن قبل أي نشر من الكمبيوتر: `git pull` → التعديل → `firebase deploy`
4. عند إرسال ملفات لـClaude في محادثة جديدة، تأكد إنها آخر نسخة — حصل أكتر من مرة إن نسخ قديمة اترفعت بالغلط
