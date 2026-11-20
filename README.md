# MASAR PRO — مسار موشن جرافيك تايم لاين 🎬
> **محرك الخطوط والمخططات الزمنية الاحترافي لبرنامج Adobe After Effects**  
> **The Professional Motion Timeline & Infographics Engine for Adobe After Effects**

---

## 🌟 نظرة عامة | Overview

**MASAR PRO (مسار)** هو إضافة برمجية متقدمة (Adobe CEP Extension) لبرنامج After Effects، مصممة خصيصاً للمصممين المحترفين وصناع المحتوى لبناء وتحريك المخططات الزمنية (Timelines)، السلاسل الإجرائية (Process Steps)، والمخططات البيانية التفاعلية بضغطة زر واحدة، مع دعم كامل للغة العربية والإنجليزية، وتصميم بصري فائق العصرية مستوحى من نظام Adobe Spectrum بلون الزمرد الاحترافي (`#10b981`).

---

## ✨ المميزات الرئيسية | Key Features

### 1. بنية المنابع الثلاثية الذكية (Triple-Source Streams)
* **المسار الأساسي (Main Front Stream):** عنوان رئيسي، شرح نصي تفصيلي، أو قوائم نقطية متعددة الأسطر.
* **المسار المقابل (Opposite/Behind Stream):** نصوص، شارات، أو تفاصيل موازية في الجهة المقابلة لخط المسار.
* **مركز العقدة (Node Core Stream):** ترقيم تسلسلي، نسب مئوية، مؤشرات إحصائية، شارات (Badges)، أو أيقونات.

### 2. تسعة قوالب إخراج جاهزة (9 Smart Output Presets)
1. 📄 **عنوان رئيسي + شرح تفصيلي** (Title + Body Description)
2. 📑 **عنوان رئيسي + قائمة نقطية** (Title + Bulleted List)
3. 🏷️ **عنوان رئيسي فقط** (Standalone Title)
4. 📝 **شرح / نص تفصيلي فقط** (Standalone Description)
5. 📋 **قائمة نقطية فقط** (Standalone Bullet List)
6. 🔢 **رقم / ترقيم + عنوان** (Numbered Title)
7. 📊 **نسبة / مؤشر + بيان** (Metric / Percentage + Label)
8. ⭐ **أيقونة / رمز + عنوان** (Icon + Title)
9. 🔖 **شارة مميزة (Badge)** (Prominent Status Pill / Badge)

### 3. نظام التخصيص الذري والدرج المستقل (Atomic Drawers & Custom Boxes)
* **صناديق نصية تلقائية القياس:** طبقات أشكال بارامترية تتغير أبعادها تلقائياً مع طول النص، مع تحكم دقيق في هوامش الحشو (Padding) والزوايا المستديرة (Corner Radius) وألوان التعبئة والإطار.
* **تخصيص فردي لكل عقدة:** إمكانية تخصيص مظهر أي عقدة بشكل منفصل عن النمط العام بضغطة زر واحدة.

### 4. تحكم عام شامل بالخط الزمني (Master Timeline Controls)
* **المحاذاة:** دعم كامل للمسار الأفقي (Horizontal) والعمودي (Vertical).
* **نمط التوزيع:** توزيع تلقائي متكافئ على طول المسار (Auto Spacing) أو فواصل ثابتة بالبيكسل (Fixed Gap).
* **تخصيص الخط الرئيسي (Baseline):** خط مصمت (Solid)، متقطع (Dashed)، أو منقط (Dotted)، مع أطراف دائرية، أسهم، أو نقاط نهائية.
* **أشكال العقد:** دوائر مصمتة، حلقات مفرغة، مربعات، معينات، مسدسات، نجوم، أو أسنان تحديد (Ticks).

### 5. تصدير مباشر إلى قوالب موشن جرافيكس (MOGRT Ready)
* إعداد مباشر لخصائص Essential Graphics بنقرة زر واحدة.
* تصدير فوري لملف `.mogrt` مع حماية مناطق البداية والنهاية عبر Responsive Time Markers لبرنامج Premiere Pro.

---

## 📁 هيكلية المشروع | Project Architecture

```text
MASAR/
├── CSXS/
│   └── manifest.xml          # تعريف إضافة CEP وهوية MASAR PRO
├── .debug                    # منفذ فحص وتطوير Chrome DevTools (8092)
├── client/                   # واجهة المستخدم (HTML5 / Modern Modular JS)
│   ├── index.html            # واجهة لوحة التحكم المتوافقة مع Spectrum
│   ├── css/
│   │   ├── flat-spectrum.css # ثيم الزمرد الاحترافي المتطور
│   │   ├── textoro-spectrum.css
│   │   └── spectrum-vars.css
│   ├── js/
│   │   ├── app.js            # منسق الواجهة والأحداث الرئيسي
│   │   ├── bridge.js         # جسر التواصل الآمن مع ExtendScript
│   │   └── modules/
│   │       ├── state-store.js    # إدارة الحالة والتخزين المحلي
│   │       ├── host-bridge.js    # مزامنة البيانات مع After Effects
│   │       ├── card-builder.js   # بناء بطاقات العقد والمنابع
│   │       ├── global-controls.js# إدارة المتحكمات العامة
│   │       ├── node-manager.js   # إدارة إضافة وحذف وترتيب العقد
│   │       ├── shapes-engine.js  # محرك معاينة ورسم الأشكال
│   │       └── batch-importer.js # استيراد البيانات دفعة واحدة
│   └── assets/               # الأيقونات والخطوط المدمجة
├── host/                     # محرك ExtendScript البرمجي لـ After Effects
│   └── bootstrap.jsx         # البناء الإجرائي للطبقات والأشكال والتعبيرات
├── presets/                  # القوالب الجاهزة المخزنة
└── README.md                 # هذا الملف
```

---

## 🚀 التثبيت والتشغيل | Installation & Setup

### المتطلبات الأساسية:
* **نظام التشغيل:** Windows 10/11 أو macOS 10.15+.
* **برنامج أدوبي:** Adobe After Effects 2020 أو أحدث (v17.0+ حتى v25+).

### 1. مسار التثبيت (Installation Path):
انسخ مجلد المشروع `MASAR` إلى مسار إضافات أدوبي:

* **Windows:**
  ```text
  C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\MASAR
  ```
  أو للمستخدم الحالي:
  ```text
  C:\Users\<UserName>\AppData\Roaming\Adobe\CEP\extensions\MASAR
  ```

* **macOS:**
  ```text
  /Library/Application Support/Adobe/CEP/extensions/MASAR
  ```
  أو للمستخدم الحالي:
  ```text
  ~/Library/Application Support/Adobe/CEP/extensions/MASAR
  ```

### 2. تفعيل وضع التطوير (Enable PlayerDebugMode):
للسماح لـ After Effects بتحميل إضافات CEP غير الموقعة رقمياً:

* **Windows (PowerShell كمسؤول):**
  ```powershell
  reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f
  reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d "1" /f
  reg add "HKCU\Software\Adobe\CSXS.9"  /v PlayerDebugMode /t REG_SZ /d "1" /f
  ```

* **macOS (Terminal):**
  ```bash
  defaults write com.adobe.CSXS.11 PlayerDebugMode 1
  defaults write com.adobe.CSXS.10 PlayerDebugMode 1
  defaults write com.adobe.CSXS.9 PlayerDebugMode 1
  ```

### 3. فتح الإضافة في After Effects:
1. أعد تشغيل Adobe After Effects.
2. من القائمة العلوية: **Window** > **Extensions** > **MASAR PRO**.
3. افتح أي كومبوزيشن نشطة وانقر على **"بناء المسار في AFTER EFFECTS"**.

---

## 🛠️ التطوير والفحص المباشر | Developer Debugging

* تدعم الإضافة فحص الويب المباشر عبر بروتوكول Chrome DevTools:
  افتح متصفح Chrome وتوجه إلى:
  ```text
  http://localhost:8092
  ```
  ستظهر نافذة فحص `MASAR PRO` التفاعلية لعرض الـ Console وتصحيح الأخطاء مباشرة.

---

## 📄 الترخيص | License

جميع الحقوق محفوظة © 2026 MASAR PRO Team.
مصمم ومطور كأداة موشن جرافيكس احترافية.
