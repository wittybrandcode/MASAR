/**
 * TIME RULER PRO — client/js/modules/state-store.js
 * Central State Management, Schema Migration, Legacy Sync & Local Persistence
 */

var TIME_RULER_STATE_STORE = (function () {
    'use strict';

    var STORAGE_KEY = 'MASAR_PRO_STATE_V1';

    var activeState = null;

    var SHAPE_NAMES = {
        'inherit': 'يتبع العام',
        'circle': 'دائرة',
        'ring': 'حلقة',
        'square': 'مربع',
        'diamond': 'معين',
        'triangle': 'مثلث',
        'hexagon': 'مسدس',
        'star': 'نجمة',
        'tick': 'سن'
    };

    var defaultState = {
        liveSync: true,
        selectedNodeIndex: 0,
        orientation: 'horizontal',
        spacingMode: 'auto',
        length: 1500,
        spacingGap: 250,
        endMargin: 60,            // px: Distance between outer nodes and baseline terminals
        lineWidth: 4,
        lineColor: '#ffffff',
        lineOpacity: 100,         // % (10 - 100)

        // Baseline Line Customization
        lineStyle: 'solid',       // 'solid' | 'dashed' | 'dotted'
        lineCap: 'round',         // 'butt' | 'round' | 'projecting'
        dashSize: 16,             // px
        dashGap: 12,              // px
        startTerminal: 'none',    // 'none' | 'arrow' | 'dot' | 'bar'
        endTerminal: 'none',      // 'none' | 'arrow' | 'dot' | 'bar'
        terminalSize: 14,         // px: Size of terminal shapes
        terminalColor: '',        // Independent color override (empty = match lineColor)

        // Global Shape: 'circle' | 'square' | 'diamond' | 'tick' (Default is single Circle)
        nodeShape: 'circle',
        circleRadius: 11,
        circleFill: '#10b981',
        circleStroke: '#ffffff',
        circleStrokeWidth: 3,

        tickHeight: 40,
        tickWidth: 4,
        tickColor: '#ffffff',

        titleFontSize: 22,
        titleColor: '#ffffff',
        topOffset: 26,

        descFontSize: 13,
        descColor: '#cbd5e1',

        numberFontSize: 20,
        numberColor: '#059669',
        bottomOffset: 26,

        contentSide: 'left', // 'left' | 'right' | 'alternate' (or 'top' | 'bottom' | 'alternate')
        textAlign: 'auto',   // 'auto' | 'left' | 'center' | 'right'

        boxEnabled: false,
        boxMode: 'off',        // 'off' | 'glass' | 'solid'

        titleBoxEnabled: true,
        titleBoxFillColor: '#0b1120',
        titleBoxFillOpacity: 85,
        titleBoxStrokeColor: '#10b981',
        titleBoxStrokeWidth: 1.5,
        titleBoxRadius: 6,

        descBoxEnabled: true,
        descBoxFillColor: '#0b1120',
        descBoxFillOpacity: 85,
        descBoxStrokeColor: '#64748b',
        descBoxStrokeWidth: 1.5,
        descBoxRadius: 6,

        behindBoxEnabled: true,
        behindBoxFillColor: '#1a1408',
        behindBoxFillOpacity: 85,
        behindBoxStrokeColor: '#f59e0b',
        behindBoxStrokeWidth: 1.5,
        behindBoxRadius: 6,

        frontBoxEnabled: true,
        frontBoxFillColor: '#0b1120',
        frontBoxFillOpacity: 85,
        frontBoxStrokeColor: '#10b981',
        frontBoxStrokeWidth: 1.5,
        frontBoxRadius: 6,

        boxFillColor: '#0b1120',
        boxFillOpacity: 85,
        boxStrokeColor: '#10b981',
        boxStrokeWidth: 1.5,
        boxStrokeOpacity: 90,
        boxRadius: 6,
        boxPaddingH: 14,
        boxPaddingV: 6,

        sortOrder: 'asc', // 'asc' | 'desc'

        nodes: [
            { number: '01', title: 'البحث والتحليل', description: 'دراسة السوق وتحديد متطلبات المشروع والجمهور المستهدف', customShape: 'inherit', customColor: '' },
            { number: '02', title: 'كتابة السيناريو', description: 'صياغة الأفكار والنص الإبداعي وبناء تسلسل الأحداث', customShape: 'inherit', customColor: '' },
            { number: '03', title: 'التصميم والرسم', description: 'رسم الستوري بورد وتصميم الهوية البصرية والمشاهد', customShape: 'inherit', customColor: '' },
            { number: '04', title: 'التحريك والمؤثرات', description: 'موشن جرافيك احترافي مع ضبط الإيقاع والمؤثرات الصوتية', customShape: 'inherit', customColor: '' },
            { number: '05', title: 'التسليم النهائي', description: 'مراجعة الملاحظات وتصدير العمل النهائي بأعلى جودة', customShape: 'inherit', customColor: '' }
        ]
    };

    /* ------------------------------------------------------------------ */
    /* Presets Definitions                                                */
    /* ------------------------------------------------------------------ */

    var PRESETS = {
        roadmap: {
            name: 'خارطة إطلاق منتج تقني',
            spacingMode: 'auto',
            lineColor: '#10b981',
            lineWidth: 4,
            lineStyle: 'solid',
            lineCap: 'round',
            startTerminal: 'none',
            endTerminal: 'arrow',
            nodeShape: 'circle',
            circleRadius: 12,
            circleFill: '#059669',
            circleStroke: '#10b981',
            circleStrokeWidth: 3,
            tickHeight: 40,
            tickWidth: 4,
            tickColor: '#10b981',
            titleColor: '#ffffff',
            titleFontSize: 21,
            descColor: '#94a3b8',
            descFontSize: 12.5,
            numberColor: '#10b981',
            numberFontSize: 20,
            topOffset: 26,
            bottomOffset: 26,
            nodes: [
                { number: 'Q1', title: 'أبحاث السوق والـ MVP', description: 'دراسة متطلبات شريحة العملاء الأولى واختبار نموذج العمل الأولي وتحليله بدقة', customShape: 'inherit', customColor: '' },
                { number: 'Q2', title: 'إطلاق النسخة التجريبية', description: 'إتاحة الإصدار التجريبي المغلق واستقبال التغذية الراجعة من أول 5,000 مستخدم', customShape: 'inherit', customColor: '' },
                { number: 'Q3', title: 'جولة التمويل Seed', description: 'إغلاق جولة استثمارية مبكرة بقيمة 3 ملايين دولار للتوسع وتوظيف الكفاءات البرمجية', customShape: 'inherit', customColor: '' },
                { number: 'Q4', title: 'التوسع في المنطقة', description: 'افتتاح العمليات الإقليمية وتطوير البنية السحابية لمواكبة تضاعف حجم العمليات', customShape: 'inherit', customColor: '' },
                { number: '2027', title: 'الريادة والذكاء الاصطناعي', description: 'دمج وكلاء الذكاء الاصطناعي المستقلة والوصول إلى نقطة التعادل والربحية المستدامة', customShape: 'star', customColor: '#f59e0b', customStroke: '#fef08a', customAnchor: 'center', customSize: 16 }
            ]
        },
        pipeline: {
            name: 'خط إنتاج موشن جرافيك برودكاست',
            spacingMode: 'auto',
            lineColor: '#f59e0b',
            lineWidth: 5,
            lineStyle: 'dashed',
            lineCap: 'butt',
            dashSize: 18,
            dashGap: 8,
            startTerminal: 'none',
            endTerminal: 'bar',
            nodeShape: 'diamond',
            circleRadius: 13,
            circleFill: '#d97706',
            circleStroke: '#fbbf24',
            circleStrokeWidth: 3,
            tickHeight: 46,
            tickWidth: 5,
            tickColor: '#ffffff',
            titleColor: '#ffffff',
            titleFontSize: 22,
            descColor: '#fde68a',
            descFontSize: 13,
            numberColor: '#f59e0b',
            numberFontSize: 22,
            topOffset: 28,
            bottomOffset: 28,
            contentSide: 'left',
            textAlign: 'auto',
            boxEnabled: true,
            boxMode: 'solid',
            boxFillColor: '#1c1306',
            boxFillOpacity: 90,
            boxStrokeColor: '#f59e0b',
            boxStrokeWidth: 1.5,
            boxRadius: 6,
            boxPaddingH: 14,
            boxPaddingV: 6,
            nodes: [
                { number: '01', title: 'استلام البريف', description: 'تحديد الرسالة الأساسية والمخرجات المطلوبة مع العميل', customShape: 'square', customColor: '#f59e0b', customStroke: '#ffffff', customSize: 13 },
                { number: '02', title: 'الستوري بورد', description: 'رسم المشاهد وتحديد زوايا الكاميرا وحركة العناصر', customShape: 'inherit', customColor: '' },
                { number: '03', title: 'التحريك المبدئي', description: 'ضبط الإيقاع الزمني والـ Keyframes وتزامن الصوت', customShape: 'inherit', customColor: '' },
                { number: '04', title: 'المؤثرات والألوان', description: 'إضافة الإضاءات والتلوين السينمائي والرندرة بجودة عالية', customShape: 'inherit', customColor: '' },
                { number: '05', title: 'التسليم النهائي', description: 'مراجعة العميل والتصدير بصيغ برودكاست متعددة', customShape: 'tick', customColor: '#10b981', customStroke: '#ffffff', customSize: 15 }
            ]
        },
        scientific: {
            name: 'خط زمني أكاديمي / تاريخي دقيق',
            spacingMode: 'auto',
            lineColor: '#e2e8f0',
            lineWidth: 3,
            lineStyle: 'dotted',
            lineCap: 'round',
            dashGap: 10,
            startTerminal: 'dot',
            endTerminal: 'arrow',
            nodeShape: 'ring',
            circleRadius: 10,
            circleFill: '#0b1120',
            circleStroke: '#10b981',
            circleStrokeWidth: 3,
            tickHeight: 34,
            tickWidth: 3,
            tickColor: '#10b981',
            titleColor: '#f8fafc',
            titleFontSize: 20,
            descColor: '#94a3b8',
            descFontSize: 12,
            numberColor: '#10b981',
            numberFontSize: 18,
            topOffset: 24,
            bottomOffset: 24,
            contentSide: 'left',
            textAlign: 'auto',
            boxEnabled: true,
            boxMode: 'glass',
            boxFillColor: '#0b1120',
            boxFillOpacity: 85,
            boxStrokeColor: '#1e293b',
            boxStrokeWidth: 1.5,
            boxRadius: 6,
            boxPaddingH: 12,
            boxPaddingV: 6,
            nodes: [
                { number: '1969', title: 'الهبوط على القمر', description: 'مهمة أبولو 11 التاريخية وأول خطوة بشرية على سطح القمر', customShape: 'circle', customColor: '#10b981', customStroke: '#ffffff', customSize: 11 },
                { number: '1977', title: 'إطلاق فوياجر 1', description: 'بدء أطول رحلة استكشافية إلى أطراف المجموعة الشمسية وما وراءها', customShape: 'inherit', customColor: '' },
                { number: '1990', title: 'تلسكوب هابل الفضائي', description: 'وضع هابل في المدار وبدء عصر جديد من الرصد الفلكي فائق الدقة', customShape: 'inherit', customColor: '' },
                { number: '2021', title: 'تلسكوب جيمس ويب', description: 'إطلاق أقوى مرصد فضائي في التاريخ لرصد أقدم المجرات في الكون', customShape: 'hexagon', customColor: '#fbbf24', customStroke: '#ffffff', customSize: 14 }
            ]
        },
        tech_dark: {
            name: 'نظام تقني داكن مع شارات ملونة',
            spacingMode: 'auto',
            lineColor: '#334155',
            lineWidth: 4,
            lineStyle: 'solid',
            lineCap: 'round',
            startTerminal: 'none',
            endTerminal: 'dot',
            nodeShape: 'square',
            circleRadius: 10,
            circleFill: '#0f172a',
            circleStroke: '#10b981',
            circleStrokeWidth: 2.5,
            tickHeight: 36,
            tickWidth: 4,
            tickColor: '#10b981',
            titleColor: '#ffffff',
            titleFontSize: 21,
            descColor: '#94a3b8',
            descFontSize: 12,
            numberColor: '#10b981',
            numberFontSize: 20,
            topOffset: 26,
            bottomOffset: 26,
            contentSide: 'left',
            textAlign: 'auto',
            boxEnabled: true,
            boxMode: 'glass',
            boxFillColor: '#0b1120',
            boxFillOpacity: 85,
            boxStrokeColor: '#1e293b',
            boxStrokeWidth: 1.5,
            boxRadius: 6,
            boxPaddingH: 14,
            boxPaddingV: 6,
            nodes: [
                { number: 'API', title: 'واجهة برمجية سحابية', description: 'توفير خدمات المزامنة اللحظية والتحقق من الهوية والأذونات', customShape: 'hexagon', customColor: '#10b981', customStroke: '#ffffff', customSize: 13 },
                { number: 'DB', title: 'قاعدة بيانات موزعة', description: 'تخزين بيانات المحطات والخطوط الزمنية مع نسخ احتياطي فوري', customShape: 'inherit', customColor: '' },
                { number: 'UI', title: 'لوحة تحكم احترافية', description: 'تصميم مسطح عالي الأداء مع دعم الشاشات فائقة الدقة', customShape: 'diamond', customColor: '#10b981', customStroke: '#ffffff', customSize: 13 },
                { number: 'AI', title: 'محرك التحليل الذكي', description: 'اقتراح أفضل التوزيعات والألوان المناسبة للمشروع تلقائياً', customShape: 'star', customColor: '#f59e0b', customStroke: '#ffffff', customSize: 15 }
            ]
        },
        retro_neon: {
            name: 'نيون سينمائي مشع (Cyberpunk Glow)',
            spacingMode: 'auto',
            lineColor: '#f43f5e',
            lineWidth: 5,
            lineStyle: 'solid',
            lineCap: 'round',
            startTerminal: 'arrow',
            endTerminal: 'arrow',
            nodeShape: 'diamond',
            circleRadius: 13,
            circleFill: '#881337',
            circleStroke: '#fb7185',
            circleStrokeWidth: 3,
            tickHeight: 44,
            tickWidth: 5,
            tickColor: '#f43f5e',
            titleColor: '#ffffff',
            titleFontSize: 22,
            descColor: '#fecdd3',
            descFontSize: 13,
            numberColor: '#fb7185',
            numberFontSize: 22,
            topOffset: 28,
            bottomOffset: 28,
            contentSide: 'left',
            textAlign: 'auto',
            boxEnabled: true,
            boxMode: 'solid',
            boxFillColor: '#1a050d',
            boxFillOpacity: 90,
            boxStrokeColor: '#f43f5e',
            boxStrokeWidth: 1.5,
            boxRadius: 6,
            boxPaddingH: 14,
            boxPaddingV: 6,
            nodes: [
                { number: '01', title: 'المرحلة النيونية الأولى', description: 'إطلاق الطابع البصري التفاعلي المستوحى من الثمانينات', customShape: 'diamond', customColor: '#f43f5e', customStroke: '#ffe4e6', customSize: 14 },
                { number: '02', title: 'التوهج والمؤثرات', description: 'دمج طبقات الـ Glow والـ Chromatic Aberration في الكومبوزيشن', customShape: 'inherit', customColor: '' },
                { number: '03', title: 'السرعة والإيقاع', description: 'حركات كاميرا سريعة متزامنة مع الإيقاع الموسيقي الصاخب', customShape: 'star', customColor: '#fbbf24', customStroke: '#ffffff', customSize: 15 }
            ]
        },
        minimal_clean: {
            name: 'بسيط وهادئ (Minimal Monochrome)',
            spacingMode: 'auto',
            lineColor: '#e2e8f0',
            lineWidth: 3,
            lineStyle: 'solid',
            lineCap: 'round',
            startTerminal: 'none',
            endTerminal: 'none',
            nodeShape: 'circle',
            circleRadius: 9,
            circleFill: '#ffffff',
            circleStroke: '#94a3b8',
            circleStrokeWidth: 2,
            tickHeight: 32,
            tickWidth: 3,
            tickColor: '#cbd5e1',
            titleColor: '#ffffff',
            titleFontSize: 20,
            descColor: '#94a3b8',
            descFontSize: 12,
            numberColor: '#e2e8f0',
            numberFontSize: 18,
            topOffset: 24,
            bottomOffset: 24,
            contentSide: 'left',
            textAlign: 'auto',
            boxEnabled: false,
            boxMode: 'off',
            nodes: [
                { number: '1', title: 'البداية الهادئة', description: 'تخطيط بسيط بدون تعقيدات بصرية للمشاريع التوثيقية', customShape: 'inherit', customColor: '' },
                { number: '2', title: 'المسار الواضح', description: 'تسلسل زمني متزن يركز على المحتوى المكتوب أولاً', customShape: 'inherit', customColor: '' },
                { number: '3', title: 'الخاتمة الأنيقة', description: 'نهاية طبيعية للخط الزمني بألوان حيادية راقية', customShape: 'circle', customColor: '#e2e8f0', customStroke: '#ffffff', customSize: 10 }
            ]
        }
    };

    // Backward-compatibility and UI key aliases
    PRESETS.history = PRESETS.scientific;
    PRESETS.cyber = PRESETS.retro_neon;
    PRESETS.minimal = PRESETS.minimal_clean;
    PRESETS.corporate_en = PRESETS.roadmap;

    /* ------------------------------------------------------------------ */
    /* User Custom Templates Persistence Engine                           */
    /* ------------------------------------------------------------------ */
    var USER_TEMPLATES_KEY = 'MASAR_USER_PRESETS_V1';

    function getUserTemplates() {
        try {
            var raw = localStorage.getItem(USER_TEMPLATES_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveUserTemplate(name, stateObj) {
        if (!name || typeof name !== 'string') return { ok: false, message: 'اسم القالب غير صالح' };
        var cleanName = name.trim();
        if (!cleanName) return { ok: false, message: 'يرجى إدخال اسم للقالب' };
        try {
            var list = getUserTemplates();
            var snapshot = JSON.parse(JSON.stringify(stateObj));
            var newTpl = {
                id: 'tpl_' + Date.now(),
                name: cleanName,
                createdAt: new Date().toISOString(),
                state: snapshot
            };
            list.unshift(newTpl);
            localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(list));
            return { ok: true, template: newTpl };
        } catch (err) {
            return { ok: false, message: String(err) };
        }
    }

    function deleteUserTemplate(id) {
        try {
            var list = getUserTemplates();
            var filtered = list.filter(function (t) { return t.id !== id; });
            localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(filtered));
            return { ok: true };
        } catch (err) {
            return { ok: false, message: String(err) };
        }
    }

    function importUserTemplate(tplObj) {
        if (!tplObj || typeof tplObj !== 'object' || !tplObj.state) {
            return { ok: false, message: 'ملف القالب غير صالح' };
        }
        try {
            var list = getUserTemplates();
            var newTpl = {
                id: 'tpl_' + Date.now(),
                name: tplObj.name || 'قالب مستورد',
                createdAt: new Date().toISOString(),
                state: tplObj.state
            };
            list.unshift(newTpl);
            localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(list));
            return { ok: true, template: newTpl };
        } catch (err) {
            return { ok: false, message: String(err) };
        }
    }

    /* ------------------------------------------------------------------ */
    /* Digit Normalizer: Eastern Arabic / Hindi / Persian -> Standard 0-9 */
    /* ------------------------------------------------------------------ */
    function toStandardDigits(str) {
        if (str === null || str === undefined) return '';
        var s = String(str);
        var eastern = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
        var persian = ['\u06F0', '\u06F1', '\u06F2', '\u06F3', '\u06F4', '\u06F5', '\u06F6', '\u06F7', '\u06F8', '\u06F9'];
        for (var d = 0; d < 10; d++) {
            s = s.split(eastern[d]).join(String(d));
            s = s.split(persian[d]).join(String(d));
        }
        return s;
    }

    /* ------------------------------------------------------------------ */
    /* Triple-Source Schema Normalizer & Backward Compatibility Adapter   */
    /* ------------------------------------------------------------------ */

    function normalizeNodeSources(node, index) {
        var blueList = ['#38bdf8', '#0e71eb', '#1473e6', '#0284c7', '#2680eb', '#141c28'];
        if (node.customColor && blueList.indexOf(node.customColor.toLowerCase()) !== -1) {
            node.customColor = '#10b981';
        }
        if (node.sources && node.sources.front) {
            if (node.sources.front.titleBoxStroke && blueList.indexOf(node.sources.front.titleBoxStroke.toLowerCase()) !== -1) {
                node.sources.front.titleBoxStroke = '#10b981';
            }
            if (node.sources.front.descBoxStroke && blueList.indexOf(node.sources.front.descBoxStroke.toLowerCase()) !== -1) {
                node.sources.front.descBoxStroke = '#64748b';
            }
        }
        if (!node || typeof node !== 'object') return;
        node.id = node.id || ('node_' + (index + 1));
        if (node.isCollapsed === undefined) node.isCollapsed = false;

        if (!node.customShape || (!SHAPE_NAMES[node.customShape] && node.customShape !== 'inherit')) {
            node.customShape = 'inherit';
        }
        if (node.customColor === undefined) node.customColor = '';

        if (!node.sources || typeof node.sources !== 'object') {
            node.sources = {};
        }

        // 1. Center Source (on the timeline path)
        if (!node.sources.center) {
            var rawNum = (node.number !== undefined && node.number !== null) ? toStandardDigits(node.number) : ((index < 9 ? '0' : '') + (index + 1));
            node.sources.center = {
                type: 'shape_number', // 'shape_number' | 'shape' | 'number' | 'icon' | 'text' | 'none'
                shape: node.customShape || 'inherit',
                value: rawNum,
                visible: true,
                color: node.customColor || ''
            };
        } else {
            if (!node.sources.center.type) node.sources.center.type = 'shape_number';
            if (node.sources.center.value === undefined) node.sources.center.value = (node.number || String(index + 1));
            node.sources.center.value = toStandardDigits(node.sources.center.value);
            if (node.sources.center.shape === undefined) node.sources.center.shape = (node.customShape || 'inherit');
            if (node.sources.center.visible === undefined) node.sources.center.visible = true;
            if (node.sources.center.color === undefined) node.sources.center.color = (node.customColor || '');
        }

        // 2. Front Source (Top in horizontal, Right/Front in vertical)
        if (!node.sources.front) {
            node.sources.front = {
                type: 'title_text',
                title: toStandardDigits(node.title || ('المحطة ' + (index + 1))),
                text: toStandardDigits(node.description || ''),
                items: [],
                number: '',
                visible: true,
                box: 'inherit'
            };
        } else {
            if (!node.sources.front.type) node.sources.front.type = 'title_text';
            if (node.sources.front.title === undefined) node.sources.front.title = (node.title || '');
            node.sources.front.title = toStandardDigits(node.sources.front.title);
            if (node.sources.front.text === undefined) node.sources.front.text = (node.description || '');
            node.sources.front.text = toStandardDigits(node.sources.front.text);
            if (!Array.isArray(node.sources.front.items)) node.sources.front.items = [];
            node.sources.front.items = node.sources.front.items.map(function (item) { return toStandardDigits(item); });
            if (node.sources.front.number !== undefined) node.sources.front.number = toStandardDigits(node.sources.front.number);
            if (node.sources.front.visible === undefined) node.sources.front.visible = true;
            if (node.sources.front.box === undefined) node.sources.front.box = 'inherit';
        }

        // 3. Behind Source (Bottom in horizontal, Left/Behind in vertical)
        if (!node.sources.behind) {
            node.sources.behind = {
                type: 'none',
                title: '',
                text: '',
                number: '',
                items: [],
                visible: false,
                box: 'inherit'
            };
        } else {
            if (!node.sources.behind.type) node.sources.behind.type = 'none';
            if (node.sources.behind.title !== undefined) node.sources.behind.title = toStandardDigits(node.sources.behind.title);
            if (node.sources.behind.text !== undefined) node.sources.behind.text = toStandardDigits(node.sources.behind.text);
            if (node.sources.behind.number !== undefined) node.sources.behind.number = toStandardDigits(node.sources.behind.number);
            if (!Array.isArray(node.sources.behind.items)) node.sources.behind.items = [];
            node.sources.behind.items = node.sources.behind.items.map(function (item) { return toStandardDigits(item); });
            if (node.sources.behind.visible === undefined) node.sources.behind.visible = (node.sources.behind.type !== 'none');
            if (node.sources.behind.box === undefined) node.sources.behind.box = 'inherit';
        }

        if (node.box === undefined) node.box = 'inherit';
        if (node.number !== undefined) node.number = toStandardDigits(node.number);
        if (node.title !== undefined) node.title = toStandardDigits(node.title);
        if (node.description !== undefined) node.description = toStandardDigits(node.description);

        syncLegacyNodeFields(node, index);
    }

    function syncLegacyNodeFields(node, index) {
        if (!node || !node.sources) return;
        var c = node.sources.center;
        var f = node.sources.front;
        var b = node.sources.behind;

        if (c && (c.type === 'shape_number' || c.type === 'number')) {
            node.number = c.value || '';
        } else if (c && (c.type === 'icon' || c.type === 'shape_icon')) {
            node.number = c.icon || c.value || '';
        } else if (c && c.type === 'text') {
            node.number = c.value || '';
        } else if (f && (f.type === 'number_title' || f.type === 'number_text')) {
            node.number = f.number || '';
        } else if (b && (b.type === 'number_text' || b.type === 'number' || b.type === 'number_title')) {
            node.number = b.number || '';
        }

        if (f) {
            if (f.type === 'title_text' || f.type === 'title_list' || f.type === 'title') {
                node.title = f.title || '';
            } else if (f.type === 'number_title') {
                node.title = (f.number ? ('#' + f.number + ' ') : '') + (f.title || '');
            } else if (f.type === 'icon_title') {
                node.title = (f.icon ? (f.icon + ' ') : '') + (f.title || '');
            } else if (f.type === 'badge') {
                node.title = f.badge || f.number || f.text || '';
            } else if (f.type === 'text') {
                node.title = '';
            }

            if (f.type === 'title_list' || f.type === 'list') {
                node.description = (f.items && f.items.length > 0) ? f.items.join('\n') : (f.text || '');
            } else if (f.type === 'title_text' || f.type === 'text') {
                node.description = f.text || '';
            } else if (f.type === 'number_text') {
                node.description = (f.number ? (f.number + ': ') : '') + (f.text || '');
            }
        }

        if (b) {
            if (b.type === 'title') {
                if (!node.title) node.title = b.title || '';
            }
        }

        if (c) {
            node.customShape = c.shape || 'inherit';
            if (c.color) node.customColor = c.color;
        }
    }

    function saveState(stateObj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
        } catch (e) {}
    }

    function loadSavedState(stateObj) {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) raw = localStorage.getItem('TIME_RULER_PRO_STATE_V5');
            if (!raw) raw = localStorage.getItem('TIME_RULER_PRO_STATE_V3');
            if (!raw) raw = localStorage.getItem('TIME_RULER_STATE_V2');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    for (var k in parsed) {
                        if (parsed.hasOwnProperty(k)) {
                            stateObj[k] = parsed[k];
                        }
                    }
                }
            }
        } catch (e) {}

        if (!stateObj.nodeShape || !SHAPE_NAMES[stateObj.nodeShape] || stateObj.nodeShape === 'inherit') {
            stateObj.nodeShape = 'circle';
        }

        if (Array.isArray(stateObj.nodes)) {
            stateObj.nodes.forEach(function (n, idx) {
                normalizeNodeSources(n, idx);
            });
        }
    }

    function getState() {
        if (!activeState) {
            activeState = JSON.parse(JSON.stringify(defaultState));
            loadSavedState(activeState);
        }
        return activeState;
    }

    return {
        STORAGE_KEY: STORAGE_KEY,
        SHAPE_NAMES: SHAPE_NAMES,
        PRESETS: PRESETS,
        getDefaultState: function () {
            return JSON.parse(JSON.stringify(defaultState));
        },
        getState: getState,
        saveState: saveState,
        loadSavedState: loadSavedState,
        toStandardDigits: toStandardDigits,
        normalizeNodeSources: normalizeNodeSources,
        syncLegacyNodeFields: syncLegacyNodeFields,
        getUserTemplates: getUserTemplates,
        saveUserTemplate: saveUserTemplate,
        deleteUserTemplate: deleteUserTemplate,
        importUserTemplate: importUserTemplate
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_STATE_STORE;
}

