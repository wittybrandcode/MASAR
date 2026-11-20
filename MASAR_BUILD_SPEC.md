# TIME RULER — وثيقة البناء والتنفيذ المباشر لإضافة CEP

**الإصدار:** 1.0  
**نوع الوثيقة:** Master Build Specification + Implementation Prompt  
**الهدف:** تسليم هذه الوثيقة إلى Gemini ليُنشئ مشروع CEP فعلياً وقابلاً للتثبيت داخل Adobe After Effects، وليس مجرد شرح أو مخطط.  
**التوافق المستهدف:** After Effects 2023 وما بعده  
**منصة الإضافة:** Adobe CEP Panel  
**محرك After Effects:** ExtendScript JSX (ES3-compatible)  
**واجهة المستخدم:** HTML + CSS + JavaScript داخل CEP  
**الإخراج:** طبقات Shape وText أصلية وقابلة للتحرير داخل After Effects  
**نمط التشغيل:** Generator + Animation Rig

---

# 0. تعليمات مباشرة إلى Gemini — اقرأ قبل كتابة الكود

أنت مهندس برمجيات متخصص في تطوير إضافات Adobe After Effects باستخدام CEP وExtendScript. المطلوب منك **إنشاء مشروع TIME RULER كاملاً بالكود والملفات الفعلية** وفق المواصفات التالية.

## قواعد التنفيذ الإلزامية

1. لا تكتفِ بشرح المعمارية أو كتابة خطة عمل. أنشئ ملفات المشروع ومحتوياتها الفعلية.
2. لا تطرح أسئلة إضافية. عند وجود تفصيل غير محسوم، استخدم القرار الافتراضي الموضح في هذه الوثيقة، واجعل الخاصية قابلة للتغيير من الواجهة إن كان ذلك مناسباً.
3. لا تستخدم pseudocode أو `TODO` أو `IMPLEMENT LATER` أو دوال فارغة أو بيانات تجريبية بدلاً من الوظائف الحقيقية.
4. لا تدّعِ أن ميزة مكتملة ما لم تكن قد كتبت تنفيذها واختبارها. إذا تعذر اختبار وظيفة داخل After Effects في بيئة البناء، اذكر ذلك بوضوح في تقرير التسليم.
5. أنشئ جميع الملفات المطلوبة، بما فيها `CSXS/manifest.xml` وملفات الواجهة وملفات JSX وملفات التثبيت والتوثيق.
6. استخدم `CSInterface.js` الرسمي من مستودع Adobe CEP Resources. لا تكتب بديلاً وهمياً لهذه المكتبة ولا تختلق واجهات Adobe.
7. لا تعتمد على الإنترنت أو خدمة خارجية لكي تعمل الإضافة. يجب أن تعمل محلياً بعد التثبيت.
8. لا تستخدم React أو Vue أو TypeScript أو Bundler في الإصدار الأول. استخدم HTML/CSS/JavaScript بسيطاً لتقليل التعقيد ومشكلات توافق CEP. يمكن إضافة إطار لاحقاً إذا ظهرت حاجة حقيقية.
9. كود ExtendScript يجب أن يكون متوافقاً مع ES3: لا تستخدم `let` أو `const` أو arrow functions أو template literals أو `Promise` أو `Map` أو `Set` أو `Array.from` أو ميزات حديثة غير مدعومة في ExtendScript.
10. افصل كود واجهة CEP عن كود After Effects. لا تفترض أن متغيرات JavaScript في الواجهة متاحة داخل JSX؛ فهما سياقان منفصلان ويتواصلان عبر `CSInterface.evalScript` فقط أو آلية CEP موثقة.
11. استخدم `matchName` في الوصول إلى خصائص After Effects حيثما أمكن، ولا تعتمد على أسماء واجهة مترجمة. أعد الحصول على مراجع مجموعات الخصائص بعد `addProperty()` عند الحاجة، لأن إضافة خصائص إلى مجموعات AE قد تبطل بعض المراجع السابقة.
12. اجعل كل عملية إنشاء أو تحديث داخل Undo Group مناسب، مع إنهاء المجموعة دائماً حتى عند وقوع خطأ.
13. لا تحذف أو تعدّل طبقات المستخدم غير التابعة إلى TIME RULER. لا تعتبر تشابه اسم الطبقة دليلاً كافياً على أنها طبقة مولّدة من الإضافة.
14. عند انتهاء البناء، اعرض شجرة الملفات كاملة، ثم أعطِ محتوى كل ملف تم إنشاؤه أو رابطاً للملفات الفعلية، وتعليمات التثبيت والتشغيل والاختبار. لا تكتفِ بمقتطفات منتقاة.
15. إذا تجاوزت مخرجاتك حدود الجلسة، أكمل الملفات على دفعات مرقّمة دون تغيير أسماء الملفات أو حذف أجزاء سابقة، واحتفظ بسجل واضح لما أُنجز وما تبقى.

## تعريف الإنجاز المطلوب

يُعد المشروع مبنياً عندما يستطيع المستخدم تثبيت لوحة TIME RULER وفتحها داخل After Effects، إنشاء مسطرة دائرية أو مستقيمة أو قوسية، إنتاج تدريجات وأرقام وأسنان قابلة للتحرير، ثم إنشاء Rig اختياري يحرك المؤشر والتقدم والكشف. يجب أن تكون الإضافة قابلة للاستخدام في AE 2023 على الأقل، مع اختبار الإصدارات الأحدث.

---

# 1. تعريف المنتج والقرارات الثابتة

## 1.1 ما هو TIME RULER؟

TIME RULER إضافة CEP احترافية لـ After Effects لإنشاء مساطر زمنية ومقاييس متدرجة قابلة للتخصيص والتحريك. تنشئ الإضافة أشكالاً هندسية وتدريجات وعناوين وأرقاماً ومؤشرات وأسناناً ميكانيكية على هيئة عناصر After Effects أصلية، لا كصورة واحدة مسطحة.

الاستخدامات المستهدفة:

- الإنفوغرافيك الإخباري والتلفزيوني.
- الجينيريك والـ Motion Graphics.
- الخطوط الزمنية التاريخية والوثائقية.
- العدادات الدائرية والميكانيكية.
- المقاييس الرقمية والعلمية.
- عرض السنوات والأشهر والأيام والساعات والدقائق والثواني والفريمات.

## 1.2 قرارات المنتج المعتمدة

| المجال | القرار |
|---|---|
| الحد الأدنى | After Effects 2023 (23.x) |
| تقنية اللوحة | CEP HTML Panel |
| الحد الأدنى لمستوى CEP | CEP 11 / CSXS 11 كخط أساس، مع اختبار التوافق الفعلي |
| Host ID | `AEFT` |
| لغة كود الواجهة | JavaScript عادي + HTML + CSS |
| لغة Host | ExtendScript JSX متوافق مع ES3 |
| واجهة الإصدار الأول | CEP Panel مباشرة، وليست ScriptUI |
| الأشكال | Circular / Linear / Arc |
| أوضاع التشغيل | Generator Mode + Rig Mode |
| المخرجات | Editable native Shape Layers + Text Layers + Null Controls |
| التخزين | JSON Presets محلية |
| الاتصال | `CSInterface.evalScript` |
| العمل دون إنترنت | مطلوب |
| نظام التشغيل | Windows وmacOS قدر الإمكان |

**ملاحظة توافق:** لا ترفع الحد الأدنى إلى CEP 12 لمجرد أن بعض إصدارات After Effects الأحدث تستخدمه؛ فهذا قد يستبعد بيئة AE 2023. اعتمد واجهات CEP المتاحة في CEP 11، ولا تستخدم ميزة خاصة بـ CEP 12 إلا بعد اختبارها واستخدام بديل متوافق. يجب التحقق من `manifest.xml` مع مخطط Adobe المناسب للحد الأدنى المستهدف.

### نموذج Manifest ابتدائي يجب على Gemini إنشاؤه والتحقق منه

استخدم هذا النموذج كنقطة انطلاق، ثم عدّل أسماء المسارات/الأبعاد عند الحاجة مع الحفاظ على Host وRuntime والتوافق:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ExtensionManifest Version="7.0"
    ExtensionBundleId="com.timeruler.aftereffects"
    ExtensionBundleVersion="1.0.0"
    ExtensionBundleName="TIME RULER"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="com.timeruler.aftereffects.panel" Version="1.0.0" />
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            <Host Name="AEFT" Version="[23.0,99.9]" />
        </HostList>
        <LocaleList>
            <Locale Code="All" />
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="11.0" />
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="com.timeruler.aftereffects.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./client/index.html</MainPath>
                    <ScriptPath>./host/bootstrap.jsx</ScriptPath>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>TIME RULER</Menu>
                    <Geometry>
                        <Size>
                            <Width>420</Width>
                            <Height>720</Height>
                        </Size>
                        <MinSize>
                            <Width>320</Width>
                            <Height>420</Height>
                        </MinSize>
                        <MaxSize>
                            <Width>1200</Width>
                            <Height>1600</Height>
                        </MaxSize>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

تحقق من صحة XML عبر Adobe CEP Manifest XSD قبل التسليم. إذا تطلب Host إصداراً أحدث من Runtime 11، لا تغيّر القيمة عشوائياً؛ تحقق من Runtime المدمج في إصدار AE المستهدف، ثم وثّق سبب التغيير وأثره على AE 2023.

## 1.3 وضعا الإخراج

**Generator Mode:** ينشئ التصميم كعناصر Shape وText قابلة للتحرير. لا ينشئ Expressions أو Controllers غير مطلوبة.

**Rig Mode:** ينشئ التصميم نفسه، ويضيف Null Controller وSlider/Color Controls وExpressions اللازمة للتحريك المركزي.

كلا الوضعين ينتجان عناصر أصلية قابلة للتحرير. لا يوجد وضع Raster كإخراج رئيسي.

---

# 2. الوظائف الأساسية المطلوبة

## 2.1 Geometry Types

### A. Circular Ruler

مسطرة دائرية كاملة أو شبه كاملة.

الخصائص:

- Center X / Center Y.
- Radius.
- Inner Radius / Outer Radius عند الحاجة.
- Start Angle.
- Sweep Angle.
- Direction: Clockwise / Counter-clockwise.
- Seam Gap للتمييز بين بداية المجال ونهايته في المسطرة الدائرية الزمنية غير الدورية.
- Label Radius Offset.
- Tick Inner/Outer Alignment.

القيم الافتراضية:

- Start Angle = `-90°`، أي أعلى الدائرة.
- Sweep Angle = `360°`.
- Direction = `clockwise`.
- Center = مركز الـ Composition النشطة.
- Radius = قيمة افتراضية مناسبة لحجم الـ Composition، مع إمكانية التعديل.

### B. Linear Ruler

مسطرة أفقية أو عمودية.

الخصائص:

- Orientation: Horizontal / Vertical.
- Start X / Start Y.
- Length.
- Direction: Forward / Reverse.
- Tick Side: Positive / Negative / Both.
- Label Offset.
- Baseline Visibility.

### C. Arc Ruler

قوس مفتوح بزاوية قابلة للتحديد، مثل 90° أو 180° أو 270° أو أي قيمة يحددها المستخدم.

الخصائص:

- Center X / Center Y.
- Radius.
- Start Angle.
- End Angle أو Sweep Angle.
- Direction.
- Tick Alignment.
- Label Orientation.

## 2.2 قاعدة الزوايا والإحداثيات

يجب أن يكون نظام الإحداثيات موحداً في المحرك الهندسي:

- زوايا الواجهة بالدرجات.
- تتحول إلى Radians داخل الحسابات.
- في After Effects، محور Y يزداد نحو الأسفل.
- `-90°` تعني أعلى الدائرة.
- زيادة الزاوية باتجاه موجب تعني الدوران مع عقارب الساعة بصرياً وفق نظام شاشة AE.

معادلات النقطة الدائرية:

```text
radians = degrees * PI / 180
x = centerX + radius * cos(radians)
y = centerY + radius * sin(radians)
```

لا تكرر منطق هذه المعادلات في الواجهة وJSX. يجب أن يكون له مصدر واحد داخل Geometry Engine.

## 2.3 معالجة إغلاق الدائرة — قرار هندسي مهم

هناك حالتان مختلفتان ويجب ألا تختلطا:

**Cyclic Scale:** مقياس دوري مثل 12 شهراً أو 60 ثانية. نقطة النهاية حدّ دوري وليست علامة مستقلة؛ استخدم توزيعاً End-Exclusive بحيث لا تتكرر علامة البداية عند الإغلاق.

```text
position(i) = i / count
for i = 0 ... count-1
```

**Bounded Timeline:** خط زمني له بداية ونهاية حقيقيتان مثل 2000 إلى 2030. يجب إظهار البداية والنهاية كقيمتين مختلفتين دون وضعهما فوق بعضهما عند زاوية 0°/360°. في الدائرة الكاملة، استخدم `seamGapDegrees` قابل للتعديل، أو اجعل Sweep أقل من 360°. القيمة الافتراضية المقترحة للفجوة 6°، ويمكن جعلها 0 مع تحذير من تراكب الطرفين.

في Arc وLinear، يكون التوزيع شاملاً للطرفين افتراضياً:

```text
position(i) = i / (count - 1)
```

إذا كان `count = 1`، ضع العنصر في منتصف المجال ولا تقسّم على صفر.

## 2.4 Time Engine

يدعم المحرك نمطين أساسيين ونمطاً زمنياً متخصصاً:

### Numeric Mode

- Start Value.
- End Value.
- Major Step.
- Minor Divisions.
- Micro Divisions.
- Decimal Precision.
- Prefix / Suffix.
- Include End Point.
- Number Formatting.

تعريف `minorDivisions`: عدد الفواصل المتساوية بين علامتين رئيسيتين. مثلاً `minorDivisions = 4` يعني 4 أقسام و3 علامات ثانوية داخلية، وليس 4 علامات ثانوية إضافية.

احسب القيم من خلال فهرس صحيح ثم اضرب في قيمة الخطوة؛ لا تعتمد على زيادة أعداد عشرية تراكمية قد تنتج أخطاء Floating Point.

إذا لم تقبل نهاية المجال القسمة على `majorStep`، طبّق خيار Include End Point بوضوح، ولا تعرض علامة نهاية غير متطابقة مع القيمة الفعلية.

### Calendar Mode

يدعم:

- Years.
- Months.
- Days.
- Hours.
- Minutes.
- Seconds.
- Optional milliseconds عند الحاجة التقنية.

المتطلبات:

- إدخال تاريخ/وقت البداية والنهاية بصيغة ISO 8601.
- حساب الأشهر حسب طولها الحقيقي.
- دعم السنوات الكبيسة.
- عدم افتراض أن كل شهر أو سنة لهما طول ثابت.
- دعم UTC افتراضياً، مع خيار Local Time عند الحاجة.
- الحفاظ على ترتيب زمني تصاعدي أو تنازلي حسب اتجاه المقياس.
- توليد Labels حسب الوحدة واللغة/التنسيق المحدد.
- عدم استخدام تقسيم عددي متساوٍ عندما تكون الوحدة تقويمية غير متساوية المدة.

في وضع Calendar، حوّل كل قيمة زمنية إلى موضع نسبي باستخدام المدة الفعلية بين لحظة البداية والنهاية، بعد تطبيع التواريخ إلى UTC أو إلى النطاق الزمني المحدد. وثّق سياسة المناطق الزمنية والتوقيت الصيفي.

### Timecode / Frames Mode

- Use Composition Frame Rate أو Custom Frame Rate.
- دعم معدلات مثل 23.976 و24 و25 و29.97 و30 و50 و59.94 عند توفرها.
- استخدام تمثيل Rational Frame Rate داخلياً حيث يلزم لتقليل أخطاء التقريب.
- دعم Drop-Frame فقط لمعدلاته القياسية الصحيحة، وعدم تطبيقه على معدلات لا تدعمه.
- التمييز بين FPS الخاص بالـ Composition ومعدل الإطار الذي يريد المستخدم تمثيله على المسطرة.

## 2.5 Graduation System

ثلاث طبقات من العلامات:

1. Major Ticks.
2. Minor Ticks.
3. Micro Ticks.

لكل مستوى:

- Enable / Disable.
- Length.
- Width.
- Color.
- Opacity.
- Offset.
- Shape/Profile.
- Alignment.
- Distribution Interval أو Divisions.
- Optional Highlight Style.

يجب أن تبقى العلامات متوازنة هندسياً حول الدائرة أو القوس، وأن تحترم اتجاه المسطرة.

## 2.6 Typography System

أنواع التسميات:

- Numeric Labels.
- Year Labels.
- Month Labels.
- Date Labels.
- Timecode Labels.
- Custom Labels.
- Unit Labels.

خصائص النص:

- Font Family.
- Font Size.
- Font Style إن أمكن عبر TextDocument.
- Fill Color.
- Stroke/Outline اختياري.
- Tracking.
- Leading عند الحاجة.
- Text Alignment.
- Prefix / Suffix.
- Decimal Precision.
- Label Offset.
- Maximum Labels / Label Skip.
- Collision Handling.

اتجاه النص الدائري:

- Horizontal: يظل النص أفقياً.
- Radial: يتبع نصف القطر.
- Tangential: مماسي لمسار الدائرة.
- Auto Upright: يصحح دوران النص حتى لا يصبح مقلوباً في النصف السفلي من الدائرة.

التعامل مع ازدحام الأرقام:

- Allow Overlap.
- Hide Colliding Labels.
- Alternate Labels.
- Show Every Nth Label.

يجب أن تكون كل تسمية Text Layer مستقلة في الوضع الافتراضي حتى يستطيع المصمم تعديلها دون التأثير على بقية الأرقام.

## 2.7 Mechanical Teeth System

مجموعة مستقلة عن Ticks.

الخصائص:

- Enabled.
- Count.
- Width.
- Height.
- Spacing.
- Shape: Rectangle / Square / Trapezoid / Triangle.
- Alignment: Inner / Outer / Center.
- Rotation Offset.
- Color / Opacity.
- Distribution: Uniform / Time-Based.
- Major Teeth Interval عند ربط الأسنان بقيم زمنية.

يجب أن تسمح الأسنان بإنشاء شكل قرص ميكانيكي أو إطار تدريجي. لا تستخدم صوراً أو رموزاً Raster.

## 2.8 Indicators & Progress

- Static Marker.
- Moving Marker.
- Current Value Indicator.
- Progress Arc.
- Linear Progress Bar.
- Highlighted Time Point.
- Highlighted Range.
- Start / End Markers.

المؤشر يجب أن يتبع موضع القيمة وفق Time Engine وGeometry Engine؛ لا تُحسب حركته بمعادلة منفصلة في الواجهة.

---

# 3. واجهة CEP المطلوبة

## 3.1 أسلوب الواجهة

أنشئ لوحة CEP حديثة ومهنية تتناسب مع بيئة After Effects:

- Dark UI افتراضي.
- تصميم كثيف لكن منظم، مناسب لحجم Panel قابل للإرساء.
- استخدام CSS Variables للألوان والمسافات.
- حالات واضحة للأزرار: default / hover / active / disabled / loading.
- دعم تغيير حجم اللوحة Responsive.
- عدم استخدام صور أو أيقونات خارجية عبر الإنترنت.
- استخدم SVG inline للأيقونات البسيطة أو CSS icons.
- يجب أن تكون أسماء الحقول واضحة ومصحوبة بوحدات القياس.

## 3.2 أقسام اللوحة

### Header

- اسم المنتج TIME RULER.
- رقم الإصدار.
- حالة الاتصال بـ After Effects: Connected / No Active Composition / Error.
- زر Help/About.

### Tab 1 — Geometry

- Geometry Type: Circular / Linear / Arc.
- Geometry-specific controls.
- Center / Position / Radius / Length.
- Start Angle / Sweep / Direction.
- Seam Mode عند Circular.
- Tick Side وLabel Orientation.

### Tab 2 — Time

- Mode: Numeric / Calendar / Timecode.
- Start / End.
- Major Unit / Step.
- Minor Divisions.
- Micro Divisions.
- Date Format / Number Format.
- Time Zone.
- Frame Rate / Drop Frame عند Timecode.

### Tab 3 — Elements

- Major / Minor / Micro Ticks.
- Numbers / Labels.
- Mechanical Teeth.
- Base Line / Rings.
- Indicators / Progress.

### Tab 4 — Style

- ألوان مستقلة للمستويات.
- أطوال وعروض العلامات.
- Font / Size / Tracking.
- Label Offset / Orientation.
- Tooth Appearance.
- Marker Appearance.
- Highlight Color.

### Tab 5 — Animation

- Output Mode: Generator / Rig.
- Progress.
- Reveal.
- Rotation Offset.
- Highlight Position / Range.
- Current Value Display.
- وصف مختصر لوظيفة كل Controller.

### Tab 6 — Presets & Output

- Preset list.
- Save Preset.
- Load Preset.
- Duplicate Preset.
- Import JSON.
- Export JSON.
- Output Granularity.
- Generate.
- Update / Regenerate.
- Detach / Protect Generated Layers.

## 3.3 إعدادات واجهة افتراضية

عند فتح اللوحة لأول مرة، اعرض إعداداً قابلاً للتوليد:

- Geometry: Circular.
- Time Mode: Numeric.
- Start: 2000.
- End: 2030.
- Major Step: 1.
- Minor Divisions: 4.
- Major Ticks: On.
- Minor Ticks: On.
- Micro Ticks: Off.
- Numbers: On.
- Teeth: Off.
- Output: Generator.
- Center: Composition Center.
- Radius: 40% تقريباً من أصغر بُعد في الـ Composition مع حد أدنى مناسب.

هذه قيم افتراضية وليست قيوداً.

## 3.4 Preview

أنشئ Preview اختياري داخل اللوحة باستخدام SVG أو Canvas في HTML لعرض توزيع الدائرة/الخط/القوس والعلامات والنصوص تقريبياً قبل الإرسال إلى AE.

- يجب أن يعتمد Preview على نفس بيانات Configuration ونفس نتائج Geometry Engine قدر الإمكان.
- لا تعتبر Preview بديلاً عن النتيجة داخل AE.
- لا تنفذ محركاً هندسياً مختلفاً في الواجهة؛ الأفضل إرسال نتائج حسابية مشتركة أو الحفاظ على تطابق اختبارات المحركين.
- إذا تعذر تطابق قياسات النص مع AE، وضّح أن معاينة النص تقريبية.

---

# 4. المعمارية التقنية

## 4.1 فصل السياقات

هناك سياقان JavaScript منفصلان:

**CEP Client:** HTML/CSS/JS، مسؤول عن الواجهة، إدخال البيانات، التحقق الأولي، معاينة SVG، وحفظ/تحميل Presets.

**After Effects Host:** ExtendScript JSX، مسؤول عن قراءة الـ Composition، التحقق النهائي، الحسابات المعتمدة، إنشاء الطبقات، إضافة Controls وExpressions، والتحديث.

لا يمكن الوصول إلى `app.project` أو DOM الخاص بـ After Effects مباشرة من JavaScript الخاص باللوحة. كل عملية داخل AE يجب أن تمر عبر `CSInterface.evalScript` إلى دوال Host معلنة.

## 4.2 وحدات المعمارية

```text
TIME RULER CEP
│
├── CEP CLIENT
│   ├── UI / Tabs / Forms
│   ├── State & Form Binding
│   ├── Client Validation
│   ├── SVG Preview
│   ├── Preset Manager
│   └── CEP Bridge
│
├── HOST BRIDGE
│   ├── Bootstrap
│   ├── API Router
│   ├── Payload Parser
│   ├── Result Serializer
│   └── Error Normalizer
│
├── CORE ENGINE (ExtendScript ES3)
│   ├── Config Manager
│   ├── Numeric Time Engine
│   ├── Calendar Time Engine
│   ├── Timecode Engine
│   ├── Geometry Engine
│   ├── Graduation Engine
│   ├── Typography Layout Engine
│   └── Teeth Engine
│
├── AE ADAPTER
│   ├── Composition Manager
│   ├── Shape Builder
│   ├── Text Builder
│   ├── Null / Controls Builder
│   ├── Expression Builder
│   ├── Layer Organizer
│   └── Metadata Manager
│
├── RIG ENGINE
│   ├── Progress Rig
│   ├── Marker Rig
│   ├── Reveal Rig
│   ├── Counter Rig
│   ├── Calendar Label Rig
│   └── Highlight Rig
│
└── DATA
    ├── JSON Schema
    ├── Default Config
    ├── Presets
    └── Migration
```

## 4.3 قواعد التنفيذ داخل Host

- ExtendScript ES3 فقط.
- استخدم Namespace واحداً مثل `$.global.TIME_RULER` لتجنب تلويث Global Scope.
- كل وحدة تسجل وظائفها في namespace.
- لا تستخدم `eval()` مع مدخلات المستخدم.
- استخدم JSON.parse/stringify إن كانا متاحين في بيئة AE المستهدفة، مع اختبار فعلي على AE 2023. إذا لم يتوفر دعم موثوق، أضف JSON polyfill محلياً مرخصاً بدلاً من كتابة parser مرتجل.
- استخدم `try/catch/finally`.
- استخدم `app.beginUndoGroup()` و`app.endUndoGroup()` لكل عملية إنشاء أو تحديث واحدة.
- اختبر كل `matchName` مستخدم على الإصدارات المستهدفة.
- بعد إضافة Property إلى Indexed Group، أعد الحصول على المراجع من المجموعة عند الضرورة.
- لا تستخدم عمليات تعتمد على واجهة After Effects المرئية أو إحداثيات الماوس.

## 4.4 ملفات JSX وتحميلها

يوجد ملف Bootstrap واحد يحمّله CEP عبر `ScriptPath` في Manifest. يقوم Bootstrap بتحميل ملفات الوحدات المحلية بطريقة موثوقة ومختبرة، مثلاً عبر `$.evalFile()` لمسارات محسوبة من مسار ملف Bootstrap، أو `#include` إذا ثبتت صحة المسارات في بيئة الإضافة.

لا تفترض أن `#include` سيحل المسارات النسبية بالطريقة المتوقعة دون اختبار. يجب أن يكون تحميل الوحدات مستقراً بعد تثبيت الإضافة في مسار CEP.

---

# 5. هيكل المشروع المطلوب

أنشئ المشروع بهذا الهيكل أو هيكل مكافئ مع الحفاظ على الفصل والمسميات الواضحة:

```text
TIME_RULER/
│
├── CSXS/
│   └── manifest.xml
│
├── client/
│   ├── index.html
│   ├── css/
│   │   ├── tokens.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── app.js
│   │   ├── state.js
│   │   ├── bridge.js
│   │   ├── form-binding.js
│   │   ├── validators.js
│   │   ├── preview.js
│   │   ├── preset-manager.js
│   │   └── ui-feedback.js
│   └── vendor/
│       └── CSInterface.js
│
├── host/
│   ├── bootstrap.jsx
│   ├── api.jsxinc
│   ├── core/
│   │   ├── config.jsxinc
│   │   ├── validation.jsxinc
│   │   ├── numeric-time.jsxinc
│   │   ├── calendar-time.jsxinc
│   │   ├── timecode.jsxinc
│   │   ├── geometry.jsxinc
│   │   ├── graduation.jsxinc
│   │   ├── typography-layout.jsxinc
│   │   └── teeth.jsxinc
│   ├── ae/
│   │   ├── composition.jsxinc
│   │   ├── shape-builder.jsxinc
│   │   ├── text-builder.jsxinc
│   │   ├── controller-builder.jsxinc
│   │   ├── expression-builder.jsxinc
│   │   ├── layer-manager.jsxinc
│   │   └── metadata.jsxinc
│   └── rig/
│       ├── progress.jsxinc
│       ├── marker.jsxinc
│       ├── reveal.jsxinc
│       ├── counter.jsxinc
│       └── highlight.jsxinc
│
├── presets/
│   ├── circular/
│   │   ├── historical-2000-2030.json
│   │   └── clock-12-months.json
│   ├── linear/
│   │   └── clean-timeline.json
│   └── mechanical/
│       └── instrument-dial.json
│
├── tests/
│   ├── host-core-tests.jsx
│   ├── geometry-cases.json
│   ├── config-cases.json
│   └── manual-test-matrix.md
│
├── scripts/
│   ├── install-dev-windows.ps1
│   ├── install-dev-macos.sh
│   ├── enable-debug-windows.reg
│   ├── enable-debug-macos.sh
│   └── package-notes.md
│
├── README.md
├── CHANGELOG.md
└── LICENSES.md
```

مسموح إضافة ملفات جديدة عند الحاجة، لكن لا تدمج كل شيء في ملف ضخم واحد، ولا تحذف فصل Client/Host/Core.

---

# 6. CEP Manifest والربط مع After Effects

## 6.1 Manifest

أنشئ `CSXS/manifest.xml` صالحاً وفق Adobe CEP Manifest Schema. يجب أن يحتوي على:

- ExtensionBundleId فريد، مثل `com.timeruler.aftereffects`.
- Extension Id فريد، مثل `com.timeruler.aftereffects.panel`.
- Extension Bundle Version.
- Host Name = `AEFT`.
- Host Version range يبدأ من `23.0` ويغطي الإصدارات المستقبلية بصورة معقولة، مع تجنب قيمة غير صالحة للمخطط.
- RequiredRuntime يبدأ من CSXS 11.0 لضمان الحد الأدنى المناسب لـ AE 2023، مع التحقق من توافق الإصدارات الأحدث.
- MainPath يشير إلى `client/index.html`.
- ScriptPath يشير إلى `host/bootstrap.jsx`.
- Type = Panel.
- Menu = TIME RULER.
- AutoVisible = true.
- Size وMinSize وMaxSize منطقية للوحة قابلة للإرساء.

لا تفترض أن رقم `ExtensionManifest Version` هو نفسه `RequiredRuntime Version`. اختر قيمة Manifest متوافقة مع CEP 11، وتحقق من ملف XSD الرسمي. لا تضبط RequiredRuntime على 12.0 في إصدار مطلوب منه العمل على AE 2023.

## 6.2 CSInterface.js

- أدرج النسخة الرسمية من Adobe CEP Resources داخل `client/vendor/CSInterface.js`.
- حمّلها قبل `bridge.js` في HTML.
- لا تعدّل المكتبة إلا عند الضرورة القصوى، ووثّق أي تعديل.
- لا تستدعِ `evalScript` قبل اكتمال تحميل `CSInterface.js`.

## 6.3 Bridge Contract

أنشئ API ثابتاً بين Client وHost. أمثلة الدوال:

```text
TR_API.ping()
TR_API.getHostInfo()
TR_API.getActiveCompInfo()
TR_API.validateConfig(jsonString)
TR_API.generate(jsonString)
TR_API.update(instanceId, jsonString)
TR_API.regenerate(instanceId, jsonString, confirmReplace)
TR_API.detach(instanceId)
TR_API.listInstances()
TR_API.getPresetDefaults()
TR_API.version()
```

كل دالة تعيد JSON String موحداً، لا كائن JavaScript مباشراً:

```json
{
  "ok": true,
  "code": "OK",
  "message": "Generation completed",
  "data": {},
  "warnings": []
}
```

وعند الخطأ:

```json
{
  "ok": false,
  "code": "NO_ACTIVE_COMP",
  "message": "افتح Composition قبل إنشاء المسطرة.",
  "data": null,
  "warnings": []
}
```

### تمرير البيانات بأمان

- لا تدمج JSON خاماً داخل نص `evalScript` دون escaping.
- أنشئ دالة `quoteForEvalScript()` في Client تهرب backslashes والاقتباسات والأسطر الجديدة بشكل صحيح.
- استقبل النتيجة في Callback ثم نفّذ JSON.parse مع معالجة الأخطاء.
- لا تستخدم eval في Client لتحويل رد Host.
- نفّذ طلباً واحداً منظماً في كل مرة، أو أنشئ Queue لمنع تداخل الطلبات.
- لا ترسل `undefined` أو قيم JSON غير صالحة.
- ضع حدوداً لحجم Configuration المدخل.

### مثال نمطي للاتصال

```javascript
var csInterface = new CSInterface();

function callHost(functionName, payload, callback) {
    var json = JSON.stringify(payload || {});
    var safeJson = quoteForEvalScript(json);
    var script = "TIME_RULER.API." + functionName + "(" + safeJson + ")";

    csInterface.evalScript(script, function (result) {
        var parsed;
        try {
            parsed = JSON.parse(result);
        } catch (error) {
            callback({
                ok: false,
                code: "INVALID_HOST_RESPONSE",
                message: String(error),
                data: null,
                warnings: []
            });
            return;
        }
        callback(parsed);
    });
}
```

هذا مثال تعاقدي؛ يجب أن تنفذ `quoteForEvalScript()` فعلياً، وأن تتأكد من الأسماء التي تستدعيها مطابقة لواجهة Host.

---

# 7. Configuration JSON Contract

استخدم Schema Version مستقلاً عن إصدار التطبيق، واحتفظ بالتوافق الخلفي عبر Migration Functions.

مثال Configuration أساسي:

```json
{
  "schemaVersion": "1.0",
  "product": "TIME_RULER",
  "geometry": {
    "type": "circular",
    "centerMode": "compositionCenter",
    "center": [960, 540],
    "radius": 400,
    "startAngle": -90,
    "sweepAngle": 360,
    "direction": "clockwise",
    "distributionMode": "bounded",
    "seamGapDegrees": 6,
    "orientation": "radial"
  },
  "time": {
    "mode": "numeric",
    "start": 2000,
    "end": 2030,
    "majorStep": 1,
    "minorDivisions": 4,
    "microDivisions": 0,
    "includeEndPoint": true,
    "precision": 0,
    "prefix": "",
    "suffix": "",
    "timeZone": "UTC"
  },
  "graduations": {
    "major": {
      "enabled": true,
      "length": 22,
      "width": 3,
      "offset": 0,
      "color": "#2878D0",
      "opacity": 100
    },
    "minor": {
      "enabled": true,
      "length": 12,
      "width": 2,
      "offset": 0,
      "color": "#75A9E8",
      "opacity": 85
    },
    "micro": {
      "enabled": false,
      "length": 6,
      "width": 1,
      "offset": 0,
      "color": "#A9C7EA",
      "opacity": 70
    }
  },
  "typography": {
    "enabled": true,
    "fontName": "Arial",
    "fontSize": 30,
    "tracking": 0,
    "color": "#2878D0",
    "orientation": "radial",
    "radiusOffset": 52,
    "prefix": "",
    "suffix": "",
    "precision": 0,
    "collisionMode": "alternate",
    "labelEvery": 1
  },
  "teeth": {
    "enabled": false,
    "count": 120,
    "shape": "rectangle",
    "width": 3,
    "height": 8,
    "alignment": "outer",
    "distribution": "uniform",
    "rotationOffset": 0,
    "color": "#2878D0",
    "opacity": 100
  },
  "indicators": {
    "marker": true,
    "progress": false,
    "highlight": false
  },
  "output": {
    "mode": "generator",
    "granularity": "grouped",
    "editableTextLayers": true,
    "createMasterController": true
  },
  "animation": {
    "progress": 0,
    "reveal": 100,
    "rotationOffset": 0,
    "highlightStart": 0,
    "highlightEnd": 100
  }
}
```

هذه عينة عقد بيانات وليست بديلاً عن Validation Schema. يجب تعريف القيم المسموحة لكل حقل، وأنواع البيانات، والحدود الدنيا والعليا، والحقول الإلزامية، والقيم الافتراضية.

## 7.1 Validation Rules

- `geometry.type` يقبل فقط `circular`, `linear`, `arc`.
- `time.mode` يقبل فقط `numeric`, `calendar`, `timecode`.
- `output.mode` يقبل `generator` أو `rig`.
- Radius وLength وWidths لا تكون سالبة.
- Major Step أكبر من صفر.
- End لا يساوي Start إلا إذا كان نمطاً دورياً معرفاً صراحة.
- Sweep Angle محدود بقواعد واضحة، مع دعم اتجاه عقارب الساعة وعكسها.
- عدد العناصر لا يتجاوز الحدود الآمنة المحددة في التطبيق.
- الألوان بصيغة Hex صالحة أو RGB موثق.
- لا تسمح بقيم `NaN` أو `Infinity`.

---

# 8. AE Generation Engine — طريقة إنشاء الطبقات

## 8.1 مكان الإنشاء

الافتراضي: إنشاء المسطرة داخل الـ Active Composition.

- إذا لم توجد Composition نشطة، أعد Error واضحاً ولا تنشئ مشروعاً عشوائياً.
- استخدم أبعاد Composition الفعلية.
- ضع مركز النظام في مركز Composition افتراضياً.
- أضف خيارات تغيير المركز والتموضع.
- لا تغير Frame Rate أو Duration أو Dimensions للـ Composition القائمة.
- اجعل جميع الطبقات ضمن مدة Composition، مع إمكانية ضبط In/Out Points وفق إعدادات المستخدم.

## 8.2 بنية الطبقات

أنشئ لكل Instance معرفاً فريداً، ثم طبقات مثل:

```text
TR_<ID>_CTRL_MAIN
TR_<ID>_BASE_RING
TR_<ID>_MAJOR_TICKS
TR_<ID>_MINOR_TICKS
TR_<ID>_MICRO_TICKS
TR_<ID>_TEETH
TR_<ID>_LABEL_0001
TR_<ID>_LABEL_0002
...
TR_<ID>_MARKER
TR_<ID>_PROGRESS
TR_<ID>_HIGHLIGHT
```

### Grouped Output (Default)

- Shape Layer مستقل لكل فئة رئيسية/ثانوية/دقيقة، وتكون كل تدريجة Shape Group مستقلة داخل Contents مع اسم واضح.
- طبقات Text منفصلة لكل Label.
- طبقة مستقلة للأسنان إذا كانت مفعلة.
- طبقات مستقلة للمؤشر والتقدم عند الحاجة.
- Controller رئيسي واحد على الأقل في Rig Mode.

### Individual Output (Advanced)

خيار لإخراج كل Tick أو Tooth كـ Shape Layer منفصلة عند الحاجة إلى تحكم مباشر على مستوى Timeline. يجب تحذير المستخدم من زيادة عدد الطبقات وانخفاض الأداء.

### لماذا Grouped هو الافتراضي؟

لأنه يحافظ على إمكانية تعديل كل عنصر من داخل Shape Layer، ويقلل عدد الطبقات في Composition. يجب تسمية كل Shape Group بصورة مفهومة، مثل `MAJOR_0001` أو `MINOR_0012`.

## 8.3 تنظيم الـ Master Controller

- أنشئ Null Object باسم `TR_<ID>_CTRL_MAIN` في مركز Composition.
- استخدمه كجذر لتحريك/تكبير/تدوير النظام بأكمله.
- أنشئ Geometry وText في إحداثيات محلية حول مركز الـ Controller.
- اجعل الطبقات التابعة Child Layers له مع مراعاة Transform Space بدقة.
- لا تخلط إحداثيات Composition المطلقة مع إحداثيات Parent المحلية.
- اختبر نقل الـ Controller وتدويره وتكبيره دون انحراف في مواضع العناصر.

## 8.4 Shape Layer Construction

- استخدم `comp.layers.addShape()` لإنشاء Shape Layers.
- استخدم `addProperty()` مع `matchName` الصحيح لإنشاء Vector Groups وPaths وStrokes وFills وTrim Paths.
- أنشئ الخطوط/التدريجات باستخدام Shape Paths أو أشكال Vector مناسبة.
- أنشئ الدوائر باستخدام Ellipse Path أو Bezier Path بحسب الحاجة.
- لا تستخدم Illustrator أو SVG مستورد كبديل عن طبقات AE الأصلية.
- افصل Stroke Width وColor وOpacity لكل فئة.
- عند إنشاء آلاف العناصر، اختبر الأداء، واستخدم Grouped Output.

## 8.5 Text Layer Construction

- استخدم `comp.layers.addText()`.
- أنشئ/حدّث `TextDocument` عبر خاصية Source Text.
- عيّن Font وFont Size وFill Color وTracking وJustification عند دعمها.
- عيّن نقطة تموضع واضحة لكل Label.
- اضبط Anchor Point بما يضمن تمركز النص حول موضعه؛ لا تفترض أن Anchor الافتراضي صحيح.
- تعامل مع عدم وجود الخط المطلوب برسالة تحذير، وليس بإيقاف التوليد كله.
- لا تحوّل النص إلى Shapes افتراضياً؛ يجب أن يبقى النص قابلاً للتحرير.

## 8.6 Layer Metadata

لا تعتمد على أسماء الطبقات وحدها.

ضع Metadata في `layer.comment` لكل طبقة مولّدة، وفي الـ Master Controller، بصيغة موحدة مثل:

```text
TIME_RULER|1.0|INSTANCE_ID|ELEMENT_ID|ELEMENT_TYPE
```

بيانات Instance تشمل:

- Product ID.
- Schema Version.
- Generator Version.
- Instance ID.
- Element ID.
- Element Type.
- Configuration snapshot أو مرجع مختصر له.

إذا خزّنت Configuration داخل Comment، اجعلها مضغوطة ومحدودة الحجم. إذا كانت كبيرة، خزّن نسخة مختصرة في Comment واستخدم JSON Preset خارجي اختيارياً.

## 8.7 Smart Regeneration — سياسة آمنة وواقعية

المبدأ: لا تلمس طبقات المستخدم غير التابعة إلى TIME RULER.

الأوامر:

- **Generate:** إنشاء Instance جديد.
- **Update:** تحديث Instance محدد.
- **Regenerate:** إعادة بناء الطبقات التي تديرها الإضافة بعد تأكيد المستخدم.
- **Detach:** إزالة Metadata الإدارية حتى تصبح الطبقات مستقلة عن الإضافة.
- **List Instances:** اكتشاف Instances الموجودة عبر Metadata.

**قيد مهم:** لا تدّعِ القدرة على اكتشاف كل تعديل يدوي داخل Shape Groups أو Text Properties تلقائياً ما لم تطبق مقارنة موثوقة. في الإصدار الأول، أظهر تحذيراً واضحاً عند Regenerate بأن التعديلات اليدوية داخل الطبقات المُدارة قد تُستبدل. لا تحذف الطبقات غير المُدارة. وفّر خيار Detach أو انسخ التصميم قبل إعادة بنائه.

إعادة التوليد يجب أن تكون ضمن Undo Group مستقل، وأن تنظف الطبقات التي تحمل Instance ID المطابق فقط.

---

# 9. Animation Rig

## 9.1 Controllers

في Rig Mode أنشئ Null Controller مع Effects ذات أسماء ثابتة:

**Main Controls**

- `Progress` — Slider من 0 إلى 100.
- `Reveal` — Slider من 0 إلى 100.
- `Highlight Start` — Slider من 0 إلى 100.
- `Highlight End` — Slider من 0 إلى 100.
- `Rotation Offset` — Angle Control.

**Style Controls**

- Major Color.
- Minor Color.
- Micro Color.
- Label Color.
- Highlight Color.
- Marker Color.

استخدم أسماء فريدة إذا احتوى الـ Composition على أكثر من TIME RULER Instance. لا تفترض وجود Layer باسم ثابت واحد.

## 9.2 سلوك Progress

- قيمة Progress من 0 إلى 100.
- Marker يتبع موضع Progress على الدائرة/الخط/القوس.
- Progress Shape يتقدم على المسار من البداية إلى الموضع الحالي.
- Current Value في Numeric Mode يحسب القيمة من Start/End وProgress.
- في Calendar Mode، أنشئ Current Date Display من جدول قيم/تسميات زمني مسبق التوليد أو Keyframes Hold موثقة، مع حد أقصى لعدد نقاط الجدول.
- لا تستخدم حسابات تاريخية غير دقيقة داخل Expression لتوليد تواريخ التقويم.

## 9.3 Reveal

- Reveal 0% = جميع العناصر مخفية.
- Reveal 100% = جميع العناصر ظاهرة.
- يمكن ترتيب ظهور العلامات حسب Normalized Position.
- يمكن جعل الأرقام تظهر بعد العلامة الرئيسية المرتبطة بها.
- يمكن تطبيق Stagger بسيط.
- اجعل Reveal Controller قابلاً للتحريك يدوياً عبر Keyframes.

## 9.4 Marker / Sweep

- Circular وArc: احسب زاوية المؤشر من Start Angle + Progress × Sweep.
- Linear: احسب موقع المؤشر بين Start Point وEnd Point.
- احترم Direction وSeam Mode.
- `Rotation Offset` يحرك التصميم أو المؤشر وفق تعريف واضح؛ لا تجعل Controller واحداً يؤدي وظيفتين متضاربتين.

## 9.5 Counter

- Numeric: Expression على Source Text يعرض قيمة Current Value بدقة Decimal Precision المحددة.
- Calendar: استخدم lookup جدولاً مسبقاً أو Hold Keyframes لتغيير النص عند حدود الوقت؛ لا تستخدم `Date` غير مدعومة في AE Expression دون اختبار.
- اضمن إرجاع String أو TextDocument صحيح وفق Expression API.

## 9.6 Expressions

- اجعل جميع Expressions مولّدة مركزياً عبر Expression Builder.
- لا تكرر نصوص Expressions داخل ملفات متعددة.
- يجب أن تكون Expressions قصيرة ومقروءة، مع تعليقات عند الإمكان.
- استخدم أسماء Layer/Effect فريدة ومشفوعة بـ Instance ID.
- أضف فحصاً بعد إنشاء كل Expression للتحقق من عدم وجود خطأ Expression إن كانت API توفر ذلك.
- لا تستخدم Expressions في Generator Mode.
- وفّر زر Repair Rig أو Rebuild Rig إذا أصبح الربط مكسوراً بسبب تغيير اسم Controller، أو على الأقل أظهر رسالة تشخيصية واضحة.

---

# 10. Presets وملفات البيانات

## 10.1 Presets أولية

أنشئ على الأقل أربعة Presets حقيقية:

1. `Historical Circular 2000–2030`: سنوات كاملة على دائرة ذات Seam Gap.
2. `12 Months Clock`: مقياس دوري من 12 شهراً دون تكرار نقطة الإغلاق.
3. `Linear Timeline`: خط أفقي مع سنوات وتدريجات ثانوية.
4. `Mechanical Dial`: دائرة ذات أسنان وتدريجات ميكانيكية.

يجب أن تكون كل Preset صالحة وفق JSON Schema ويمكن استيرادها وتصديرها.

## 10.2 Import / Export

- استخدم JSON.
- تحقق من البيانات قبل قبولها.
- لا تنفذ نصوصاً أو JavaScript داخل Preset.
- أضف `schemaVersion`.
- أضف Migration من الإصدارات القديمة عند تغيير البنية.
- تعامل مع ملفات تالفة برسالة مفهومة.

## 10.3 التخزين

- Presets داخل مجلد Presets للإضافة كقوالب افتراضية للقراءة.
- Presets المستخدم في مجلد بيانات المستخدم المناسب عبر CEP File System API أو آلية محلية موثقة.
- لا تكتب فوق Preset افتراضي عند الحفظ؛ احفظ نسخة مستخدم.
- لا تفترض صلاحيات الكتابة في مجلد تثبيت الإضافة.

---

# 11. الأداء والاعتمادية

## 11.1 حدود أولية

استخدم حدوداً قابلة للتعديل، مع قيم ابتدائية محافظة:

- Major Ticks: حتى 500.
- Minor + Micro Ticks: حتى 2,000 إجمالاً في Grouped Mode.
- Labels: حتى 200 افتراضياً قبل إظهار تحذير كثافة.
- Teeth: حتى 1,000 في Grouped Mode.
- Individual Layer Mode: حذّر المستخدم عند تجاوز 300 طبقة إضافية.

هذه الحدود ليست قيوداً ثابتة على AE؛ هي حواجز أولية لحماية الأداء، ويجب اختبارها وتعديلها بعد قياس الأداء الفعلي.

## 11.2 تجنب تجميد الواجهة

`evalScript` ينفذ JSX في سياق After Effects وعلى الـ Main Thread. لذلك:

- لا تعد المستخدم بتحديث Progress حيّ أثناء استدعاء JSX متزامن طويل.
- اعرض Busy State قبل الاستدعاء، ثم النتيجة بعد Callback.
- قلل عدد استدعاءات Host غير الضرورية.
- اجمع عمليات التوليد في استدعاء منظم واحد قدر الإمكان.
- إذا احتاجت عملية ضخمة إلى Chunking، صمّم Job Manager واختبر جدولة الاستدعاءات وسلوك Undo قبل اعتمادها؛ لا تنفذ Chunking يسبب عشرات خطوات Undo أو حالات مشروع نصف مكتملة.
- لا تستخدم `$.sleep()` لتجميد AE في انتظار الواجهة.

## 11.3 Safety

- تحقق من Configuration في Client وHost.
- لا تستخدم `eval()` على بيانات المستخدم.
- لا تحذف طبقات غير مُدارة.
- استخدم Undo Groups.
- إذا فشل التوليد في منتصف العملية، حاول حذف الطبقات التي أنشأتها العملية الحالية فقط، مع الاحتفاظ بالطبقات السابقة.
- لا تغيّر إعدادات Composition الموجودة.
- لا تخزن أسراراً أو بيانات شخصية.

## 11.4 Logging

أنشئ Logger بسيطاً:

- DEBUG.
- INFO.
- WARN.
- ERROR.

يمكن إظهار رسائل مختصرة في لوحة CEP، مع سجل تشخيصي محلي اختياري. لا تملأ الـ Console برسائل لكل Tick أثناء الاستخدام الطبيعي.

---

# 12. الاختبارات ومعايير القبول

## 12.1 Geometry Tests

اختبر على الأقل:

- Circular عند 0° و90° و180° و270° و360°.
- Start Angle = -90°.
- Clockwise وCounter-clockwise.
- Circular Cyclic دون تكرار علامة الإغلاق.
- Circular Bounded مع Seam Gap.
- Arc بزوايا 90° و180° و270° وزاوية مخصصة.
- Linear Horizontal وVertical.
- Forward وReverse.
- Count = 1 دون قسمة على صفر.
- قيم Start/End سالبة أو عشرية.
- دقة الأعداد العشرية.

## 12.2 Time Tests

- 2000 إلى 2030 مع Major Step = 1 ينتج 31 Label زمنياً في وضع Bounded.
- 12 شهراً في Cyclic ينتج 12 موضعاً دون تكرار الشهر الأول عند الإغلاق.
- February في سنة كبيسة.
- February في سنة غير كبيسة.
- شهور ذات 30 و31 يوماً.
- الانتقال بين عامين.
- UTC وLocal Time.
- التوقيت الصيفي عند Local Time.
- Timecode عند Frame Rates معروفة.
- Drop-Frame validation.

## 12.3 AE Integration Tests

- اكتشاف Active Composition.
- إنشاء Shape Layer.
- إنشاء Vector Group وPath وStroke.
- إنشاء Ellipse/Arc.
- إنشاء Text Layer وتعديل TextDocument.
- إنشاء Null Controller وSlider/Color Controls.
- Parent Transform.
- Expressions تعمل بلا خطأ.
- Undo يعيد العملية.
- Metadata تقرأ وتكتب بشكل صحيح.

## 12.4 Regeneration Tests

- إنشاء Instance أول.
- إنشاء Instance ثانٍ في Composition نفسها.
- تحديث Instance الأول دون تغيير الثاني.
- عدم حذف طبقات المستخدم.
- كشف الطبقات المُدارة عبر Metadata.
- إلغاء Regenerate دون تعديل المشروع.
- Detach يحافظ على الطبقات ويمنع إدارتها مستقبلاً.

## 12.5 Compatibility Matrix

اختبر فعلياً، لا نظرياً:

- After Effects 2023 (23.x) — Mandatory.
- After Effects 2024 (24.x) — Target.
- After Effects 2025 (25.x) — Target.
- After Effects 2026 (26.x) — Target.
- Windows.
- macOS إذا توفرت بيئة اختبار.

لا تكتب في README أن إصداراً مدعوماً تم اختباره إذا لم يُختبر.

## 12.6 Definition of Done

الإصدار الأول لا يعتبر مكتملاً إلا بعد تحقق التالي:

1. تظهر لوحة TIME RULER في After Effects وتفتح دون أخطاء.
2. تعرض حالة الاتصال وComposition النشطة.
3. تنشئ Circular وLinear وArc.
4. تنشئ Major/Minor/Micro Ticks.
5. تنشئ Numbers وLabels كـ Text Layers قابلة للتحرير.
6. تنشئ Mechanical Teeth بأشكالها المدعومة.
7. Generator Mode يعمل دون Controllers أو Expressions غير ضرورية.
8. Rig Mode ينشئ Controllers وExpressions عاملة.
9. Progress يحرك Marker وProgress Path.
10. Reveal يتحكم في ظهور العناصر.
11. JSON Import/Export يعمل.
12. Presets الأربعة الأولية تعمل.
13. لا تتضرر طبقات المستخدم غير المُدارة.
14. Regenerate يحترم Instance ID ويعرض تحذيرات صحيحة.
15. تعمل الإضافة في AE 2023 على الأقل.
16. توجد تعليمات تثبيت وإزالة وتشخيص.

---

# 13. خطة البناء المباشرة

نفّذ المشروع بهذا الترتيب، مع الحفاظ على أن تكون كل مرحلة قابلة للتشغيل والاختبار:

## Milestone 1 — CEP Shell

- إنشاء Manifest.
- إنشاء HTML Panel.
- تضمين CSInterface.js الرسمي.
- إنشاء Bridge.
- إنشاء Host Bootstrap.
- Ping إلى AE.
- قراءة AE Version وActive Composition.

**المخرج:** لوحة تفتح داخل AE وتثبت الاتصال بالـ Host.

## Milestone 2 — Core Configuration + Geometry

- Configuration schema وvalidation.
- Numeric Time Engine.
- Circular Geometry.
- Linear Geometry.
- Arc Geometry.
- اختبار هندسي.

**المخرج:** نتائج Geometry صحيحة في بيانات قابلة للفحص.

## Milestone 3 — Native AE Generator

- Shape Builder.
- Tick Groups.
- Rings / Baseline.
- Text Builder.
- Labels.
- Master Controller.
- Metadata.

**المخرج:** إنشاء مسطرة دائرية 2000–2030 بعناصر AE قابلة للتحرير.

## Milestone 4 — Elements & Calendar

- Minor / Micro.
- Typography options.
- Teeth.
- Indicators.
- Calendar Engine.
- Timecode Engine.

**المخرج:** محرك العناصر والتدرجات الزمنية.

## Milestone 5 — Animation Rig

- Progress Controller.
- Marker.
- Progress Path.
- Reveal.
- Numeric Counter.
- Calendar Label Lookup.
- Highlight.

**المخرج:** Rig قابل للتحريك عبر Keyframes.

## Milestone 6 — Regeneration & Presets

- Instance Discovery.
- Update / Regenerate / Detach.
- JSON Presets.
- Import / Export.

**المخرج:** إدارة آمنة لتصاميم متعددة داخل الـ Composition.

## Milestone 7 — UI Completion & QA

- Tabs.
- Preview.
- Validation feedback.
- Performance limits.
- Compatibility tests.
- Install scripts.
- Documentation.

**المخرج:** TIME RULER v1.0 جاهز للاستخدام.

---

# 14. تعليمات التسليم النهائي من Gemini

عند اكتمال البناء، قدّم النتيجة وفق هذا الترتيب:

1. ملخص ما تم بناؤه فعلياً.
2. شجرة المجلدات والملفات.
3. رابط ZIP للمشروع الكامل إن كانت بيئة Gemini تسمح بإنشاء ملف قابل للتنزيل، وإلا قدّم الملفات كاملة دون إسقاط.
4. خطوات تثبيت نسخة Developer على Windows وmacOS.
5. طريقة تفعيل PlayerDebugMode للتطوير فقط، مع تحديد CSXS Runtime المناسب للنسخة المستخدمة.
6. مكان ظهور اللوحة في قائمة After Effects.
7. مسارات التثبيت اليدوي:
   - Windows للمستخدم الحالي: `%APPDATA%\Adobe\CEP\extensions\TIME_RULER\`.
   - macOS للمستخدم الحالي: `~/Library/Application Support/Adobe/CEP/extensions/TIME_RULER/`.
   يجب أن يكون `CSXS/manifest.xml` داخل مجلد الإضافة مباشرة.
8. طريقة تفعيل PlayerDebugMode للتطوير فقط:
   - AE 2023 / CEP 11: قيمة نصية `PlayerDebugMode=1` تحت `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` في Windows.
   - macOS: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`.
   - عند اختبار Host يستخدم Runtime آخر، تحقق من رقم CSXS المقابل واستخدم إعداد Debug الخاص به. أعد تشغيل After Effects بعد التغيير. لا تطلب تفعيل Debug Mode للمستخدم النهائي عند توزيع إصدار موقّع.
9. طريقة إنشاء أول Circular Timeline.
8. قائمة الاختبارات التي تم تنفيذها ونتائجها.
9. قائمة الوظائف التي لم يتم التحقق منها داخل AE، مع توضيح صريح.
10. Known Issues وقيود الإصدار.
11. لا تضع ملف تثبيت أو رابطاً وهمياً. لا تسمِّ المشروع Production Ready ما لم تنجح اختبارات القبول.

**أولوية البناء:** الوظيفة والدقة الهندسية أولاً، ثم إنشاء الطبقات، ثم Rig، ثم الواجهة والتجميل. لا تؤجل إنشاء محرك فعلي خلف واجهة شكلية.

---

# 15. ملاحظات توافق ومستقبل المنصة

- الهدف الحالي هو CEP لأن المطلوب دعم After Effects 2023+ وإنشاء Panel باستخدام HTML/CSS/JS وExtendScript.
- حافظ على استقلال Core Engine وGeometry Engine وTime Engine عن CEP وعن واجهة المستخدم.
- اجعل التواصل مع AE محصوراً في Host Adapter/Bridge.
- لا تربط الحسابات الزمنية أو الهندسية بمكونات الواجهة.
- هذا الفصل سيجعل نقل الواجهة أو Host Adapter مستقبلاً أقل تكلفة إذا انتقلت بيئة Adobe إلى UXP.
- لا تغيّر نطاق المشروع من CEP إلى UXP من تلقاء نفسك؛ المطلوب في هذه الوثيقة هو CEP.

---

# 16. مراجع تقنية أساسية

استخدم هذه المراجع الرسمية/المتخصصة للتحقق من التفاصيل ولا تخترع API:

1. Adobe CEP Resources — المستودع الرسمي لملفات وأدلة CEP وCSInterface.js وManifest وSamples:  
   https://github.com/Adobe-CEP/CEP-Resources

2. Adobe CEP 11 HTML Extension Cookbook — مرجع الحد الأدنى CEP 11 وسلوك اللوحة وManifest وبيئة Chromium/Node:  
   https://github.com/Adobe-CEP/CEP-Resources/tree/master/CEP_11.x/Documentation

3. Adobe CEP 12 HTML Extension Cookbook — مرجع الإصدارات الأحدث والتوافق والـ Bridge:  
   https://github.com/Adobe-CEP/CEP-Resources/tree/master/CEP_12.x/Documentation

4. Adobe After Effects Scripting Guide — خصائص الطبقات وProperty Match Names وواجهات ExtendScript:  
   https://ae-scripting.docsforadobe.dev/

5. Adobe Developer Blog — اتجاه الانتقال المرحلي من CEP إلى UXP (للتخطيط المستقبلي فقط، لا لتغيير نطاق المشروع الحالي):  
   https://blog.developer.adobe.com/en/publish/2026/09/investing-in-the-future-of-creative-cloud-extensibility-uxp-comes-to-our-flagship-applications

**انتهت وثيقة البناء. ابدأ بإنشاء مشروع TIME RULER CEP فعلياً وفق هذه المواصفات، ولا تكتفِ بإعادة صياغتها.**
