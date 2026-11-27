/**
 * MASAR PRO — client/js/modules/card-source-tabs.js
 * Source Tab Renderers (Center, Front, Behind) & Explicit DOM Input Harvesting
 */

var TIME_RULER_CARD_SOURCE_TABS = (function () {
    'use strict';

    var atomicOpenMap = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

    var CENTER_OPTIONS = [
        { val: 'shape_number', text: 'شكل هندسي + رقم داخلي' },
        { val: 'shape', text: 'شكل هندسي فقط (بدون نص)' },
        { val: 'shape_icon', text: 'شكل هندسي + رمز داخلي' },
        { val: 'number', text: 'رقم صريح فقط (بلا شكل)' },
        { val: 'icon', text: 'رمز فقط (بلا شكل)' },
        { val: 'text', text: 'وسم نصي (بلا شكل)' }
    ];

    var STREAM_PRESETS = [
        { val: 'title_text', label: 'عنوان رئيسي + شرح' },
        { val: 'title_list', label: 'عنوان رئيسي + نقاط' },
        { val: 'title', label: 'عنوان رئيسي فقط' },
        { val: 'text', label: 'شرح تفصيلي فقط' },
        { val: 'list', label: 'قائمة نقطية فقط' },
        { val: 'number_title', label: 'رقم / شارة + عنوان' },
        { val: 'number_text', label: 'مؤشر / نسبة + بيان' },
        { val: 'icon_title', label: 'أيقونة / رمز + عنوان' },
        { val: 'badge', label: 'شارة فقط (Badge)' }
    ];

    function getPresetFlags(t) {
        return {
            showTitle: (t === 'title_text' || t === 'title_list' || t === 'title' || t === 'number_title' || t === 'icon_title'),
            showDesc: (t === 'title_text' || t === 'text' || t === 'number_text'),
            showList: (t === 'title_list' || t === 'list'),
            showBadge: (t === 'number_title' || t === 'number_text' || t === 'badge'),
            showIcon: (t === 'icon_title')
        };
    }

    function initStreamBlockFlags(sObj, curSType) {
        var defs = getPresetFlags(curSType);
        ['showTitle', 'showDesc', 'showList', 'showBadge', 'showIcon'].forEach(function (k) {
            if (typeof sObj[k] === 'undefined') sObj[k] = defs[k];
        });
    }

    function deduceStreamType(sObj) {
        if (sObj.showBadge && sObj.showTitle) sObj.type = 'number_title';
        else if (sObj.showBadge && sObj.showDesc) sObj.type = 'number_text';
        else if (sObj.showBadge && !sObj.showTitle && !sObj.showDesc && !sObj.showList) sObj.type = 'badge';
        else if (sObj.showIcon && sObj.showTitle) sObj.type = 'icon_title';
        else if (sObj.showTitle && sObj.showList) sObj.type = 'title_list';
        else if (sObj.showList && !sObj.showTitle) sObj.type = 'list';
        else if (sObj.showTitle && sObj.showDesc) sObj.type = 'title_text';
        else if (sObj.showTitle && !sObj.showDesc) sObj.type = 'title';
        else if (!sObj.showTitle && sObj.showDesc) sObj.type = 'text';
        else sObj.type = 'title_text';
    }

    function applyStreamPreset(sObj, v) {
        sObj.type = v;
        sObj.visible = (v !== 'none');
        var defs = getPresetFlags(v);
        ['showTitle', 'showDesc', 'showList', 'showBadge', 'showIcon'].forEach(function (k) { sObj[k] = defs[k]; });
    }

    function createCenterInput(node, index, field, className, placeholder, titleText, width, color, ctx, isIcon) {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = className;
        inp.dataset.stream = 'center';
        inp.dataset.field = field;
        if (width) inp.style.width = width;
        if (isIcon) inp.style.textAlign = 'center';
        if (color) inp.style.color = color;
        inp.placeholder = placeholder;
        inp.value = isIcon ? (node.sources.center.icon || node.sources.center.value || '★') : (node.sources.center.value || '');
        inp.title = titleText;
        if (!isIcon) inp.addEventListener('focus', function () { ctx.selectNode(index); });
        inp.addEventListener('input', function (e) {
            if (isIcon) node.sources.center.icon = e.target.value;
            node.sources.center.value = e.target.value;
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(450, 'text');
        });
        return inp;
    }

    function buildCenterSourceTab(opts) {
        var tabContent = opts.tabContent;
        var card = opts.card;
        var node = opts.node;
        var index = opts.index;
        var state = opts.state;
        var curShapeObj = opts.curShapeObj;
        var curGlobalObj = opts.curGlobalObj;
        var curGlobalShapeName = opts.curGlobalShapeName;
        var hasCustomShape = opts.hasCustomShape;
        var isCustomized = opts.isCustomized;
        var ctx = opts.ctx;
        var streamCtrl = opts.streamControls;

        var topBarC = document.createElement('div');
        topBarC.className = 'source-top-bar';

        var pickerWrapC = document.createElement('div');
        pickerWrapC.className = 'source-type-picker';

        var selTypeC = document.createElement('select');
        selTypeC.className = 'spectrum-Picker-input source-type-select';
        var curCType = node.sources.center.type || 'shape_number';
        CENTER_OPTIONS.forEach(function (opt) {
            var elOpt = document.createElement('option');
            elOpt.value = opt.val;
            elOpt.textContent = opt.text;
            if (curCType === opt.val) elOpt.selected = true;
            selTypeC.appendChild(elOpt);
        });
        selTypeC.addEventListener('change', function () {
            node.sources.center.type = selTypeC.value;
            if ((selTypeC.value === 'icon' || selTypeC.value === 'shape_icon') && node.sources.front) {
                if (node.sources.front.showIcon) node.sources.front.showIcon = false;
                if (node.sources.front.type === 'icon_title') node.sources.front.type = 'title';
            }
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(0);
        });
        pickerWrapC.appendChild(selTypeC);
        topBarC.appendChild(pickerWrapC);

        var btnToggleC = document.createElement('button');
        btnToggleC.type = 'button';
        var cVisNow = (node.sources.center.type !== 'none');
        btnToggleC.className = 'btn-icon-act vis-btn' + (cVisNow ? ' active' : ' inactive');
        btnToggleC.title = cVisNow ? 'إخفاء مركز العقدة' : 'إظهار وتفعيل مركز العقدة';
        btnToggleC.innerHTML = '<i class="fa-solid ' + (cVisNow ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
        btnToggleC.addEventListener('click', function () {
            node.sources.center.type = (node.sources.center.type === 'none') ? 'shape_number' : 'none';
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(0);
        });
        topBarC.appendChild(btnToggleC);
        tabContent.appendChild(topBarC);

        var dynControlsC = document.createElement('div');
        dynControlsC.className = 'source-dynamic-controls';
        var cDrawsShape = (curCType === 'shape_number' || curCType === 'shape' || curCType === 'shape_icon');

        if (curCType === 'none') {
            var btnActC = document.createElement('button');
            btnActC.type = 'button';
            btnActC.className = 'btn-activate-pod';
            btnActC.title = 'تفعيل مركز العقدة على المسار الزمني';
            btnActC.innerHTML = '<i class="fa-solid fa-plus"></i> <span>تفعيل مركز العقدة على المسار</span>';
            btnActC.addEventListener('click', function () {
                node.sources.center.type = 'shape_number';
                ctx.syncLegacyNodeFields(node, index);
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.renderTimelineHUD();
                ctx.requestLiveSync(0);
            });
            dynControlsC.appendChild(btnActC);
        } else {
            if (!cDrawsShape) {
                var noShapeHint = document.createElement('div');
                noShapeHint.className = 'center-noshape-banner';
                noShapeHint.innerHTML = '<span><i class="fa-solid fa-circle-info"></i> هذا الوضع يعرض المحتوى فوق الخط مباشرة بدون شكل هندسي.</span>';
                var btnEnShape = document.createElement('button');
                btnEnShape.type = 'button';
                btnEnShape.className = 'btn-enable-shape-inline';
                btnEnShape.textContent = 'تفعيل الشكل';
                btnEnShape.addEventListener('click', function () {
                    node.sources.center.type = (curCType === 'icon') ? 'shape_icon' : 'shape_number';
                    ctx.syncLegacyNodeFields(node, index);
                    ctx.saveState();
                    ctx.updateNodeCard(index);
                    ctx.renderTimelineHUD();
                    ctx.requestLiveSync(0);
                });
                noShapeHint.appendChild(btnEnShape);
                dynControlsC.appendChild(noShapeHint);
            }

            if (curCType !== 'shape') {
                var rowC = document.createElement('div');
                rowC.className = 'source-pod-inline-row';

                var effNumColor = (node.sources && node.sources.center && node.sources.center.textColor)
                    ? node.sources.center.textColor
                    : (state.numberColor || '#10b981');

                var lblC = document.createElement('span');
                lblC.className = 'field-label label--center';
                lblC.textContent = (curCType === 'icon' || curCType === 'shape_icon') ? 'الرمز' : ((curCType === 'text') ? 'الوسم' : 'الرقم');
                rowC.appendChild(lblC);

                var centerInp = null;
                if (curCType === 'shape_number' || curCType === 'number') {
                    centerInp = createCenterInput(node, index, 'value', 'field-input node-input-num', '01', 'الرقم المكتوب في مركز العقدة', '', effNumColor, ctx, false);
                } else if (curCType === 'icon' || curCType === 'shape_icon') {
                    centerInp = createCenterInput(node, index, 'icon', 'field-input node-input-num input--atomic-symbol', '★', 'رمز مركز العقدة', '50px', effNumColor, ctx, true);
                } else if (curCType === 'text') {
                    centerInp = createCenterInput(node, index, 'value', 'field-input node-input-title flex-grow', 'وسم أو نص قصير…', 'وسم نصي على المسار', '', effNumColor, ctx, false);
                }

                if (centerInp) rowC.appendChild(centerInp);

                if (streamCtrl) {
                    rowC.appendChild(streamCtrl.createStreamStylingBar(
                        'محتوى المركز',
                        'stream-name-tag--center',
                        node.sources.center,
                        '',
                        { fontSize: state.numberFontSize || 20, color: effNumColor, colorKey: 'textColor', noBox: true },
                        function (delay, rerender, scope) {
                            if (centerInp && node.sources.center.textColor) centerInp.style.color = node.sources.center.textColor;
                            ctx.syncLegacyNodeFields(node, index);
                            ctx.saveState();
                            if (rerender) ctx.updateNodeCard(index);
                            ctx.requestLiveSync(delay, scope || 'text');
                        }
                    ));
                }
                dynControlsC.appendChild(rowC);

                if ((curCType === 'icon' || curCType === 'shape_icon') && centerInp && streamCtrl) {
                    dynControlsC.appendChild(streamCtrl.createSymbolPickerRow(function (sym) {
                        node.sources.center.icon = sym;
                        node.sources.center.value = sym;
                        centerInp.value = sym;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.renderTimelineHUD();
                        ctx.requestLiveSync(0, 'text');
                    }, function () {
                        ctx.toggleCardDrawer(index);
                    }));
                }
            } else {
                var shapeOnlyNote = document.createElement('div');
                shapeOnlyNote.className = 'center-shapeonly-note';
                shapeOnlyNote.innerHTML = '<span><i class="fa-solid fa-shapes"></i> المركز يعرض الشكل الهندسي (' + ctx.escapeHtml(hasCustomShape ? curShapeObj.name : curGlobalShapeName) + ') فقط دون نص داخلي.</span>';
                dynControlsC.appendChild(shapeOnlyNote);
            }
        }
        tabContent.appendChild(dynControlsC);
    }

    function buildStreamSourceTab(opts) {
        var tabContent = opts.tabContent;
        var node = opts.node;
        var index = opts.index;
        var state = opts.state;
        var streamName = opts.streamName; // 'front' | 'behind'
        var ctx = opts.ctx;
        var streamCtrl = opts.streamControls;

        var isFront = (streamName === 'front');
        var sObj = isFront ? node.sources.front : node.sources.behind;
        var curSType = sObj.type || (isFront ? 'title_text' : 'none');

        initStreamBlockFlags(sObj, curSType);

        var topBar = document.createElement('div');
        topBar.className = 'source-top-bar';

        var selType = document.createElement('select');
        selType.className = 'spectrum-Picker-input source-type-dropdown';
        selType.title = 'اختر نموذج مخرجات جاهز للمنبع';

        var centerHasIcon = (node.sources && node.sources.center && (node.sources.center.type === 'icon' || node.sources.center.type === 'shape_icon'));
        STREAM_PRESETS.forEach(function (opt) {
            var elOpt = document.createElement('option');
            elOpt.value = opt.val;
            elOpt.textContent = opt.label;
            if (isFront && centerHasIcon && opt.val === 'icon_title') {
                elOpt.disabled = true;
                elOpt.textContent = opt.label + ' (معطل: المركز يحمل أيقونة)';
            }
            if (curSType === opt.val) elOpt.selected = true;
            selType.appendChild(elOpt);
        });
        selType.addEventListener('change', function () {
            var v = selType.value;
            if (isFront && centerHasIcon && v === 'icon_title') {
                v = 'title';
                selType.value = v;
            }
            applyStreamPreset(sObj, v);
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(0);
        });
        topBar.appendChild(selType);

        var atomicBar = document.createElement('div');
        atomicBar.className = 'atomic-blocks-bar';

        var blockDefs = [
            { key: 'title', label: 'عنوان', icon: 'fa-solid fa-heading', active: sObj.showTitle, title: 'تفعيل / تعطيل العنوان الرئيسي' },
            { key: 'desc', label: 'شرح', icon: 'fa-solid fa-align-right', active: sObj.showDesc, title: 'تفعيل / تعطيل فقرة الشرح' },
            { key: 'badge', label: 'شارة/رقم', icon: 'fa-solid fa-tag', active: sObj.showBadge, title: 'إضافة شارة / وسم / نسبة مئوية (Badge/KPI)' },
            { key: 'list', label: 'نقاط', icon: 'fa-solid fa-list-ul', active: sObj.showList, title: 'تفعيل / تعطيل القائمة النقطية' },
            { key: 'icon', label: 'رمز', icon: 'fa-solid fa-star', active: (isFront && centerHasIcon) ? false : sObj.showIcon, disabled: (isFront && centerHasIcon), title: (isFront && centerHasIcon) ? 'معطل تلقائياً لأن مركز العقدة يحمل أيقونة بالفعل' : 'إضافة أيقونة رمزية للمحطة' }
        ];

        blockDefs.forEach(function (b) {
            var btnChip = document.createElement('button');
            btnChip.type = 'button';
            btnChip.className = 'btn-atomic-chip' + (b.active ? ' active' : '') + (b.disabled ? ' is-disabled' : '');
            btnChip.title = b.title;
            if (b.disabled) btnChip.disabled = true;
            btnChip.innerHTML = '<i class="' + b.icon + '"></i><span>' + b.label + '</span>';
            btnChip.addEventListener('click', function (e) {
                e.stopPropagation();
                if (b.disabled) return;
                if (b.key === 'title') sObj.showTitle = !sObj.showTitle;
                if (b.key === 'desc') {
                    sObj.showDesc = !sObj.showDesc;
                    if (sObj.showDesc) sObj.showList = false;
                }
                if (b.key === 'list') {
                    sObj.showList = !sObj.showList;
                    if (sObj.showList) sObj.showDesc = false;
                }
                if (b.key === 'badge') sObj.showBadge = !sObj.showBadge;
                if (b.key === 'icon') sObj.showIcon = !sObj.showIcon;

                if (!sObj.showTitle && !sObj.showDesc && !sObj.showList && !sObj.showBadge && !sObj.showIcon) {
                    sObj.showTitle = true;
                }

                deduceStreamType(sObj);
                ctx.syncLegacyNodeFields(node, index);
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.requestLiveSync(0);
            });
            atomicBar.appendChild(btnChip);
        });

        var isAtomicOpen = Boolean(atomicOpenMap && atomicOpenMap.get(sObj));
        var atomicDrawer = document.createElement('div');
        atomicDrawer.className = 'atomic-drawer-row' + (isAtomicOpen ? '' : ' u-hidden');
        atomicDrawer.appendChild(atomicBar);

        var btnAtomicToggle = document.createElement('button');
        btnAtomicToggle.type = 'button';
        btnAtomicToggle.className = 'btn-atomic-toggle' + (isAtomicOpen ? ' active' : '');
        btnAtomicToggle.title = 'تخصيص عناصر المنبع (عنوان، شرح، شارة، نقاط، رمز)';
        btnAtomicToggle.innerHTML = '<i class="fa-solid fa-sliders"></i><span>عناصر</span>';
        btnAtomicToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var next = atomicDrawer.classList.contains('u-hidden');
            if (atomicOpenMap) atomicOpenMap.set(sObj, next);
            atomicDrawer.classList.toggle('u-hidden', !next);
            btnAtomicToggle.classList.toggle('active', next);
        });
        topBar.appendChild(btnAtomicToggle);

        var btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        var sVisNow = (sObj.visible !== false && sObj.type !== 'none');
        btnToggle.className = 'btn-icon-act vis-btn' + (sVisNow ? ' active' : ' inactive');
        btnToggle.title = sVisNow ? 'ظاهر بالمشهد (انقر للإخفاء)' : 'مخفي (انقر للإظهار)';
        btnToggle.innerHTML = '<i class="fa-solid ' + (sVisNow ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
        btnToggle.addEventListener('click', function () {
            sObj.visible = !sObj.visible;
            if (sObj.visible && sObj.type === 'none') {
                sObj.type = 'title_text';
                sObj.showTitle = true;
                sObj.showDesc = true;
            }
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(0);
        });
        topBar.appendChild(btnToggle);
        tabContent.appendChild(topBar);
        tabContent.appendChild(atomicDrawer);

        var dynControls = document.createElement('div');
        dynControls.className = 'source-dynamic-controls';

        function onStylingUpdate(delay, rerender, scope) {
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            if (rerender) ctx.updateNodeCard(index);
            ctx.requestLiveSync(delay, scope);
        }

        function appendStyledFieldRow(cfg) {
            var row = document.createElement('div');
            row.className = 'node-field-row' + (cfg.rowModClass ? (' ' + cfg.rowModClass) : '');

            var lbl = document.createElement('div');
            lbl.className = 'field-label ' + cfg.labelClass;
            lbl.innerHTML = '<i class="fa-solid ' + cfg.icon + '"></i> ' + cfg.label;
            row.appendChild(lbl);

            var fieldEl = document.createElement(cfg.isTextarea ? 'textarea' : 'input');
            if (!cfg.isTextarea) fieldEl.type = 'text';
            else fieldEl.rows = 2;
            fieldEl.className = cfg.inputClass;
            fieldEl.dataset.stream = streamName;
            fieldEl.dataset.field = cfg.dataField;
            fieldEl.placeholder = cfg.placeholder;
            fieldEl.value = cfg.value;
            if (cfg.title) fieldEl.title = cfg.title;
            if (cfg.bindSmartList) {
                ctx.setupSmartListTextarea(fieldEl, cfg.onInput);
            } else {
                fieldEl.addEventListener('focus', function () { ctx.selectNode(index); });
                fieldEl.addEventListener('input', function (e) { cfg.onInput(e.target.value); });
            }
            row.appendChild(fieldEl);
            if (isFront) {
                row.appendChild(streamCtrl.createStreamStylingBar(cfg.styleLabel, cfg.styleTagClass, sObj, cfg.propPrefix, cfg.defs, onStylingUpdate));
            }
            dynControls.appendChild(row);

            if (isFront) {
                var drw = streamCtrl.createStreamBoxDrawer(cfg.styleLabel, sObj, cfg.propPrefix, cfg.defs, onStylingUpdate, ctx.escapeHtml);
                if (drw) dynControls.appendChild(drw);
            }
        }

        if (!sVisNow) {
            var btnAct = document.createElement('button');
            btnAct.type = 'button';
            btnAct.className = 'btn-activate-pod';
            btnAct.title = 'تفعيل هذا المنبع';
            btnAct.innerHTML = '<i class="fa-solid fa-plus"></i> <span>تفعيل ' + (isFront ? 'المنبع الأمامي' : 'المنبع الخلفي') + '</span>';
            btnAct.addEventListener('click', function () {
                sObj.visible = true;
                if (sObj.type === 'none') sObj.type = 'title_text';
                sObj.showTitle = true;
                sObj.showDesc = true;
                ctx.syncLegacyNodeFields(node, index);
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.renderTimelineHUD();
                ctx.requestLiveSync(0);
            });
            dynControls.appendChild(btnAct);
        } else {
            if (sObj.showBadge || sObj.showIcon) {
                var rowBadge = document.createElement('div');
                rowBadge.className = 'node-field-row node-field-row--compact';

                var lblBadge = document.createElement('div');
                lblBadge.className = 'field-label label--badge';
                var bText = (sObj.showIcon && !sObj.showBadge) ? 'الرمز' : (sObj.showBadge && !sObj.showIcon) ? 'الشارة' : 'شارة ورمز';
                var bIcon = (sObj.showIcon && !sObj.showBadge) ? 'fa-star' : 'fa-tag';
                lblBadge.innerHTML = '<i class="fa-solid ' + bIcon + '"></i> ' + bText;
                rowBadge.appendChild(lblBadge);

                if (sObj.showIcon) {
                    var inpIcon = document.createElement('input');
                    inpIcon.type = 'text';
                    inpIcon.className = 'field-input';
                    inpIcon.dataset.stream = streamName;
                    inpIcon.dataset.field = 'icon';
                    inpIcon.style.width = '38px';
                    inpIcon.style.maxWidth = '38px';
                    inpIcon.style.textAlign = 'center';
                    inpIcon.value = sObj.icon || '★';
                    inpIcon.title = 'رمز أو أيقونة';
                    inpIcon.addEventListener('input', function (e) {
                        sObj.icon = e.target.value;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.requestLiveSync(450, 'text');
                    });
                    rowBadge.appendChild(inpIcon);
                }

                if (sObj.showBadge) {
                    var inpBadge = document.createElement('input');
                    inpBadge.type = 'text';
                    inpBadge.className = 'field-input node-input-num node-input-badge';
                    inpBadge.dataset.stream = streamName;
                    inpBadge.dataset.field = 'badge';
                    inpBadge.placeholder = 'شارة/رقم (مثال: #01، +85%، Q1، مرحلة 1)…';
                    inpBadge.value = sObj.number || sObj.badge || (sObj.type === 'badge' ? sObj.text : '') || '';
                    inpBadge.title = 'نص الشارة أو النسبة أو المعرّف';
                    inpBadge.addEventListener('input', function (e) {
                        sObj.number = e.target.value;
                        sObj.badge = e.target.value;
                        if (sObj.type === 'badge') sObj.text = e.target.value;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.requestLiveSync(450, 'text');
                    });
                    rowBadge.appendChild(inpBadge);
                }

                var badgeDefs = { fontSize: 13, color: '#ffffff', boxFillColor: '#10b981', boxStrokeColor: '#10b981', boxRadius: 4 };
                if (isFront) {
                    rowBadge.appendChild(streamCtrl.createStreamStylingBar(bText, 'stream-name-tag--badge', sObj, 'badge', badgeDefs, onStylingUpdate));
                }
                dynControls.appendChild(rowBadge);

                if (isFront) {
                    var drwBadge = streamCtrl.createStreamBoxDrawer('الشارة', sObj, 'badge', badgeDefs, onStylingUpdate, ctx.escapeHtml);
                    if (drwBadge) dynControls.appendChild(drwBadge);
                }

                if (sObj.showBadge) {
                    dynControls.appendChild(streamCtrl.createBadgePresetsRow(['#01', 'Q1', '+85%', 'مرحلة 1', 'VIP', 'NEW', 'DONE'], function (bp) {
                        sObj.number = bp;
                        sObj.badge = bp;
                        if (sObj.type === 'badge') sObj.text = bp;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.updateNodeCard(index);
                        ctx.renderTimelineHUD();
                        ctx.requestLiveSync(0, 'text');
                    }));
                }

                if (sObj.showIcon) {
                    dynControls.appendChild(streamCtrl.createSymbolPickerRow(function (sym) {
                        sObj.icon = sym;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.updateNodeCard(index);
                        ctx.requestLiveSync(0, 'text');
                    }));
                }
            }

            if (sObj.showTitle) {
                appendStyledFieldRow({
                    labelClass: 'label--title',
                    icon: 'fa-heading',
                    label: 'العنوان',
                    inputClass: 'field-input input--title node-input-title',
                    dataField: 'title',
                    placeholder: 'العنوان الرئيسي…',
                    value: sObj.title || '',
                    title: 'العنوان الرئيسي للمحطة',
                    styleLabel: 'العنوان',
                    styleTagClass: 'stream-name-tag--title',
                    propPrefix: 'title',
                    defs: {
                        fontSize: state.titleFontSize || 22,
                        color: state.titleColor || '#ffffff',
                        boxFillColor: state.titleBoxFillColor || '#0b1120',
                        boxStrokeColor: state.titleBoxStrokeColor || '#10b981',
                        boxRadius: state.titleBoxRadius || 6
                    },
                    onInput: function (val) {
                        sObj.title = val;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.requestLiveSync(450, 'text');
                    }
                });
            }

            var descDefs = {
                fontSize: state.descFontSize || 13,
                color: state.descColor || '#cbd5e1',
                boxFillColor: state.descBoxFillColor || '#0b1120',
                boxStrokeColor: state.descBoxStrokeColor || '#64748b',
                boxRadius: state.descBoxRadius || 6
            };

            if (sObj.showDesc && !sObj.showList) {
                appendStyledFieldRow({
                    labelClass: 'label--desc',
                    icon: 'fa-align-right',
                    label: 'الشرح',
                    inputClass: 'field-input input--desc node-input-desc',
                    dataField: 'desc',
                    placeholder: 'فقرة الشرح والتفاصيل…',
                    value: sObj.text || '',
                    title: 'فقرة الشرح والتفاصيل',
                    styleLabel: 'الشرح',
                    styleTagClass: 'stream-name-tag--desc',
                    propPrefix: 'desc',
                    defs: descDefs,
                    onInput: function (val) {
                        sObj.text = val;
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.requestLiveSync(450, 'text');
                    }
                });
            }

            if (sObj.showList) {
                var initListText = (sObj.items && sObj.items.length > 0)
                    ? sObj.items.map(function (s) { return (s.indexOf('•') === 0 ? s : '• ' + s); }).join('\n')
                    : (sObj.text ? sObj.text.split('\n').filter(Boolean).map(function (s) { return (s.indexOf('•') === 0 ? s : '• ' + s); }).join('\n') : '');
                appendStyledFieldRow({
                    rowModClass: 'node-field-row--align-top',
                    labelClass: 'label--list',
                    icon: 'fa-list-ul',
                    label: 'النقاط',
                    isTextarea: true,
                    bindSmartList: true,
                    inputClass: 'field-input smart-list-textarea textarea--smart-list',
                    dataField: 'list',
                    placeholder: 'عناصر القائمة (اضغط Enter لنقطة جديدة •)…',
                    value: initListText,
                    styleLabel: 'النقاط',
                    styleTagClass: 'stream-name-tag--desc',
                    propPrefix: 'desc',
                    defs: descDefs,
                    onInput: function (val) {
                        sObj.items = val.split('\n').map(function (s) { return s.replace(/^[\s•\-\*]+/, '').trim(); }).filter(Boolean);
                        ctx.syncLegacyNodeFields(node, index);
                        ctx.saveState();
                        ctx.requestLiveSync(450, 'text');
                    }
                });
            }

            if (!isFront && streamCtrl) {
                var behindDefs = {
                    fontSize: Math.max(10, Math.round((state.descFontSize || 13) * 0.95)),
                    color: '#ffb833',
                    boxFillColor: state.behindBoxFillColor || '#1a1408',
                    boxStrokeColor: state.behindBoxStrokeColor || '#f59e0b',
                    boxRadius: (typeof state.behindBoxRadius === 'number') ? state.behindBoxRadius : 6
                };
                var rowBehindStyle = document.createElement('div');
                rowBehindStyle.className = 'node-field-row behind-unified-style-row';
                rowBehindStyle.innerHTML = '<span class="field-label label--behind"><i class="fa-solid fa-sliders"></i> تنسيق</span><span class="behind-unified-caption">نمط ولون وصندوق الطبقة المقابلة</span>';
                rowBehindStyle.appendChild(streamCtrl.createStreamStylingBar('الوسم المقابل', 'stream-name-tag--behind', sObj, '', behindDefs, onStylingUpdate));
                dynControls.appendChild(rowBehindStyle);

                var drwBehind = streamCtrl.createStreamBoxDrawer('الوسم المقابل', sObj, '', behindDefs, onStylingUpdate, ctx.escapeHtml);
                if (drwBehind) dynControls.appendChild(drwBehind);
            }
        }

        tabContent.appendChild(dynControls);
    }

    function applyHarvestedField(node, streamKey, fieldKey, rawValue, stdDigits) {
        if (!node || !node.sources || !node.sources[streamKey]) return;
        var sObj = node.sources[streamKey];

        if (streamKey === 'center') {
            var cVal = stdDigits(rawValue);
            if (fieldKey === 'icon') {
                sObj.icon = (rawValue === null || rawValue === undefined) ? '' : String(rawValue);
                sObj.value = cVal;
            } else if (fieldKey === 'value') {
                sObj.value = cVal;
            }
            return;
        }

        if (streamKey !== 'front' && streamKey !== 'behind') return;

        if (fieldKey === 'title') {
            sObj.title = stdDigits(rawValue);
        } else if (fieldKey === 'desc') {
            sObj.text = stdDigits(rawValue);
        } else if (fieldKey === 'list') {
            var rawList = stdDigits(rawValue);
            sObj.items = rawList.split('\n').map(function (s) {
                return s.replace(/^[\s•\-\*]+/, '').trim();
            }).filter(Boolean);
        } else if (fieldKey === 'badge') {
            var rawBadge = stdDigits(rawValue);
            sObj.number = rawBadge;
            sObj.badge = rawBadge;
            if (sObj.type === 'badge') sObj.text = rawBadge;
        } else if (fieldKey === 'icon') {
            sObj.icon = (rawValue === null || rawValue === undefined) ? '' : String(rawValue);
        }
    }

    function harvestActiveInputs(state, container, deps) {
        if (!container || !state) return;
        var stdDigits = (deps && typeof deps.toStandardDigits === 'function')
            ? deps.toStandardDigits
            : function (v) { return (v === null || v === undefined) ? '' : String(v); };

        var cards = container.querySelectorAll('.node-card');
        for (var c = 0; c < cards.length; c++) {
            var card = cards[c];
            var idx = parseInt(card.dataset.nodeIndex, 10);
            if (isNaN(idx) || !state.nodes || !state.nodes[idx]) continue;
            var node = state.nodes[idx];
            if (deps && deps.normalizeNodeSources) deps.normalizeNodeSources(node, idx);

            var pod = card.querySelector('.node-source-tab-content');
            if (!pod) continue;

            var taggedFields = pod.querySelectorAll('[data-stream][data-field]');
            if (taggedFields && taggedFields.length > 0) {
                for (var f = 0; f < taggedFields.length; f++) applyHarvestedField(node, taggedFields[f].dataset.stream, taggedFields[f].dataset.field, taggedFields[f].value, stdDigits);
            } else {
                var activeTab = node.activeSourceTab || 'front';
                if (activeTab === 'center' && node.sources && node.sources.center) {
                    var cInp = pod.querySelector('input.node-input-num, input.node-input-title, input[type="text"], input:not([type="color"])');
                    if (cInp) {
                        var cT = node.sources.center.type || 'shape_number';
                        applyHarvestedField(node, 'center', (cT === 'icon' || cT === 'shape_icon') ? 'icon' : 'value', cInp.value, stdDigits);
                    }
                } else if ((activeTab === 'front' || activeTab === 'behind') && node.sources && node.sources[activeTab]) {
                    var sObj = node.sources[activeTab], tI = pod.querySelector('input.node-input-title');
                    var dI = pod.querySelector('input.node-input-desc') || pod.querySelector('textarea.node-input-desc');
                    var lI = pod.querySelector('textarea.smart-list-textarea'), nI = pod.querySelector('input.node-input-num') || pod.querySelector('input.node-input-badge');
                    if (tI) applyHarvestedField(node, activeTab, 'title', tI.value, stdDigits);
                    if (dI && !sObj.showList) applyHarvestedField(node, activeTab, 'desc', dI.value, stdDigits);
                    if (lI) applyHarvestedField(node, activeTab, 'list', lI.value, stdDigits);
                    if (nI) applyHarvestedField(node, activeTab, 'badge', nI.value, stdDigits);
                }
            }

            if (deps && deps.syncLegacyNodeFields) deps.syncLegacyNodeFields(node, idx);
        }
    }

    return {
        buildCenterSourceTab: buildCenterSourceTab,
        buildStreamSourceTab: buildStreamSourceTab,
        applyHarvestedField: applyHarvestedField,
        harvestActiveInputs: harvestActiveInputs
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_CARD_SOURCE_TABS;
}
