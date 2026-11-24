/**
 * TIME RULER PRO — client/js/modules/card-builder.js
 * Modular Card DOM Renderer, Atomic Blocks Engine, Stream Drawers & Drag-Drop Reordering
 */

var TIME_RULER_CARD_BUILDER = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var openDrawerIndex = -1;
    var state = null;

    function syncState() {
        state = (window.TR_APP && window.TR_APP.state) ? window.TR_APP.state : (window.state || (typeof TIME_RULER_STATE_STORE !== 'undefined' ? TIME_RULER_STATE_STORE.getDefaultState() : {}));
        return state;
    }

    function saveState() {
        syncState();
        if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.saveState(state);
    }
    function renderTimelineHUD() {
        syncState();
        if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
    }
    function requestLiveSync(delay) {
        syncState();
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') TIME_RULER_HOST_BRIDGE.requestLiveSync(state, delay);
    }
    function setFeedback(msg, type) {
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') TIME_RULER_HOST_BRIDGE.setFeedback(msg, type);
    }
    function selectNode(index) {
        syncState();
        if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') TIME_RULER_TIMELINE_HUD.selectNode(index, state);
    }
    function openSvgImporterModal(index) {
        syncState();
        if (typeof TIME_RULER_SHAPES_ENGINE !== 'undefined') TIME_RULER_SHAPES_ENGINE.openSvgImporterModal(index, state);
    }
    function setupSmartListTextarea(ta, cb) {
        if (typeof TIME_RULER_BATCH_IMPORTER !== 'undefined') TIME_RULER_BATCH_IMPORTER.setupSmartListTextarea(ta, cb);
    }
    function setupAutoGrowTextarea(ta, cb) {
        if (typeof TIME_RULER_BATCH_IMPORTER !== 'undefined') TIME_RULER_BATCH_IMPORTER.setupAutoGrowTextarea(ta, cb);
    }
    function normalizeNodeSources(node, index) {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.normalizeNodeSources(node, index);
    }
    function syncLegacyNodeFields(node, index) {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.syncLegacyNodeFields(node, index);
    }
    function sanitizeSvgName(s) {
        if (typeof TIME_RULER_SHAPES_ENGINE !== 'undefined') return TIME_RULER_SHAPES_ENGINE.sanitizeSvgName(s);
        return s || '';
    }
    function createFieldHeader(iconClass, labelText) {
        var row = document.createElement('div');
        row.className = 'field-meta-row';
        row.innerHTML = '<span class="field-meta-tag"><i class="' + iconClass + '"></i> ' + labelText + '</span>';
        return row;
    }

    function createStreamStylingBar(streamLabel, streamTagClass, streamObj, propPrefix, defaults, onUpdate) {
        var cluster = document.createElement('div');
        cluster.className = 'inline-tools-cluster';

        // 1. Font Size Box (e.g. 22 pt)
        var sizeBox = document.createElement('div');
        sizeBox.className = 'micro-size-box';
        sizeBox.title = 'حجم خط ' + streamLabel + ' (بالنقاط)';
        var inpSize = document.createElement('input');
        inpSize.type = 'number';
        inpSize.min = 8;
        inpSize.max = 120;
        var sizeKey = propPrefix ? propPrefix + 'FontSize' : 'fontSize';
        inpSize.value = (typeof streamObj[sizeKey] === 'number' && streamObj[sizeKey] > 0) ? streamObj[sizeKey] : (defaults.fontSize || 22);
        inpSize.addEventListener('change', function (e) {
            var v = parseInt(e.target.value, 10);
            streamObj[sizeKey] = (isNaN(v) || v <= 0) ? undefined : v;
            onUpdate(300, false);
        });
        sizeBox.appendChild(inpSize);
        var szUnit = document.createElement('span');
        szUnit.className = 'unit';
        szUnit.textContent = 'pt';
        sizeBox.appendChild(szUnit);
        cluster.appendChild(sizeBox);

        // 2. Color Swatch
        var swatch = document.createElement('div');
        swatch.className = 'micro-color-swatch';
        var colorKey = propPrefix ? propPrefix + 'Color' : 'color';
        var curColor = streamObj[colorKey] || defaults.color || '#ffffff';
        swatch.style.background = curColor;
        swatch.title = 'لون خط ' + streamLabel;
        var inpColor = document.createElement('input');
        inpColor.type = 'color';
        inpColor.value = curColor;
        inpColor.addEventListener('input', function (e) {
            swatch.style.background = e.target.value;
            streamObj[colorKey] = e.target.value;
            onUpdate(300, false);
        });
        swatch.appendChild(inpColor);
        cluster.appendChild(swatch);

        // 3. 3-State Icon Box Toggle
        var boxKey = propPrefix ? propPrefix + 'Box' : 'box';
        var curBox = streamObj[boxKey] || 'inherit';
        var btnBox = document.createElement('button');
        btnBox.type = 'button';
        btnBox.className = 'btn-box-toggle' + (curBox === 'on' ? ' active' : (curBox === 'off' ? ' disabled' : ''));
        var boxIcon = (curBox === 'on') ? 'fa-solid fa-square' : ((curBox === 'off') ? 'fa-solid fa-ban' : 'fa-regular fa-square');
        var boxTitle = (curBox === 'on') ? 'صندوق مخصص ومفعل (انقر للتعطيل)' : ((curBox === 'off') ? 'الصندوق معطل تماماً (انقر للعودة لاتباع العام)' : 'صندوق النص: يتبع النمط العام (انقر للتخصيص)');
        btnBox.innerHTML = '<i class="' + boxIcon + '"></i>';
        btnBox.title = boxTitle;
        btnBox.addEventListener('click', function (e) {
            e.stopPropagation();
            var next = (curBox === 'inherit') ? 'on' : ((curBox === 'on') ? 'off' : 'inherit');
            streamObj[boxKey] = next;
            onUpdate(0, true);
        });
        cluster.appendChild(btnBox);

        return cluster;
    }

    function createStreamBoxDrawer(streamLabel, streamObj, propPrefix, defaults, onUpdate) {
        var boxKey = propPrefix ? propPrefix + 'Box' : 'box';
        if (streamObj[boxKey] !== 'on') return null;

        var drawer = document.createElement('div');
        drawer.className = 'inline-box-drawer';

        var boxFillKey = propPrefix ? propPrefix + 'BoxColor' : 'boxFillColor';
        var boxStrokeKey = propPrefix ? propPrefix + 'BoxStroke' : 'boxStrokeColor';
        var boxRadKey = propPrefix ? propPrefix + 'BoxRadius' : 'boxRadius';

        var curFill = streamObj[boxFillKey] || defaults.boxFillColor || '#0b1120';
        var curStroke = streamObj[boxStrokeKey] || defaults.boxStrokeColor || '#10b981';
        var curRad = (typeof streamObj[boxRadKey] === 'number') ? streamObj[boxRadKey] : (defaults.boxRadius || 6);

        drawer.innerHTML = '<span class="stream-box-drawer-title"><i class="fa-solid fa-turn-up" class="stream-box-drawer-icon"></i> تخصيص صندوق ' + streamLabel + ':</span>' +
            '<span class="stream-box-drawer-label">تعبئة:</span>' +
            '<div class="micro-color-swatch sw-fill" style="background: ' + curFill + ';"><input type="color" class="inp-drw-fill" value="' + curFill + '"></div>' +
            '<span class="stream-box-drawer-label-spaced">إطار:</span>' +
            '<div class="micro-color-swatch sw-stroke" style="background: ' + curStroke + ';"><input type="color" class="inp-drw-stroke" value="' + curStroke + '"></div>' +
            '<span class="stream-box-drawer-label-spaced">زوايا:</span>' +
            '<div class="micro-size-box"><input type="number" class="inp-drw-rad" min="0" max="40" value="' + curRad + '"><span class="unit">px</span></div>';

        drawer.querySelector('.inp-drw-fill').addEventListener('input', function (e) {
            drawer.querySelector('.sw-fill').style.background = e.target.value;
            streamObj[boxFillKey] = e.target.value;
            onUpdate(300, false);
        });
        drawer.querySelector('.inp-drw-stroke').addEventListener('input', function (e) {
            drawer.querySelector('.sw-stroke').style.background = e.target.value;
            streamObj[boxStrokeKey] = e.target.value;
            onUpdate(300, false);
        });
        drawer.querySelector('.inp-drw-rad').addEventListener('input', function (e) {
            var v = parseInt(e.target.value, 10);
            streamObj[boxRadKey] = isNaN(v) ? 0 : Math.max(0, v);
            onUpdate(300, false);
        });

        return drawer;
    }

    function renderNodesList() {
        syncState();
        var container = $('nodes-container');
        var savedScrollTop = container ? container.scrollTop : 0;
        var tabBadge = $('txt-tab-count');
        if (!container) return;

        container.innerHTML = '';
        var nLen = state.nodes.length;
        if (tabBadge) tabBadge.textContent = nLen;
        renderTimelineHUD();

        state.nodes.forEach(function (node, index) {
            var card = document.createElement('div');
            var isSel = (index === (state.selectedNodeIndex || 0));
            card.className = 'node-card' + (isSel ? ' node-card--selected selected' : '');
            card.setAttribute('draggable', 'true');
            card.dataset.nodeIndex = String(index);

            card.addEventListener('click', function (e) {
                var btn = e.target.closest('button');
                if (btn && (btn.classList.contains('node-btn-del') || btn.classList.contains('node-btn-dup') || btn.classList.contains('node-btn-up') || btn.classList.contains('node-btn-down'))) {
                    return;
                }
                selectNode(index);
            });

            // Drag and Drop event handlers
            card.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/plain', String(index));
                card.classList.add('is-dragging');
            });
            card.addEventListener('dragend', function () {
                card.classList.remove('is-dragging', 'drag-over-top', 'drag-over-bottom');
            });
            card.addEventListener('dragover', function (e) {
                e.preventDefault();
                card.classList.add('drag-over-top');
            });
            card.addEventListener('dragleave', function () {
                card.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                card.classList.remove('drag-over-top', 'drag-over-bottom');
                var srcIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(srcIdx) && srcIdx !== index) {
                    moveNode(srcIdx, index);
                }
            });

            var isCustomized = (node.customShape && node.customShape !== 'inherit') || (node.customColor && node.customColor.length > 0);

            // Normalize node sources to ensure complete data integrity
            normalizeNodeSources(node, index);

            // Shape Selector Pill Button (Sharp SGD Chip with SVG Icon)
            var curGlobalObj = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(state.nodeShape) : { id: 'circle', name: 'دائرة' };
            var curGlobalShapeName = curGlobalObj.name;
            var isCustomized = (node.customShape && node.customShape !== 'inherit');
            var curShapeObj = isCustomized 
                ? ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(node.customShape) : { id: node.customShape, name: node.customShape })
                : curGlobalObj;

            var pillText = isCustomized ? curShapeObj.name : 'عام (' + curGlobalShapeName + ')';
            var pillThumb = (typeof TR_SVG_SHAPES !== 'undefined')
                ? TR_SVG_SHAPES.getSvgMarkup(curShapeObj.id, (node.customColor || 'currentColor'), 15)
                : '<i class="fa-solid fa-circle"></i>';

            var btnShapePill = document.createElement('button');
            btnShapePill.type = 'button';
            btnShapePill.className = 'node-shape-pill' + (isCustomized ? ' node-shape-pill--custom' : '');
            btnShapePill.title = 'تخصيص شكل وحجم ولون هذه العقدة بشكل مستقل';

            var pillInner = '<span class="pill-thumb">' + pillThumb + '</span><span>' + pillText + '</span>';
            if (isCustomized && (node.customColor || node.customStroke)) {
                var dotCol = node.customColor || node.customStroke;
                pillInner += '<span class="pill-color-dot" style="background:' + dotCol + '"></span>';
            }
            pillInner += '<i class="fa-solid fa-chevron-down" class="pill-dropdown-caret"></i>';
            btnShapePill.innerHTML = pillInner;

            // =================================================================
            // 1. CARD MASTER HEADER (Clean Iconic Bar: Reorder + Badge Right, Tabs Middle, Actions Left)
            // =================================================================
            var masterHeader = document.createElement('div');
            masterHeader.className = 'node-card-master-header';

            // Right Group: Move Arrows (replacing 6 dots) + Node Badge
            var headerRight = document.createElement('div');
            headerRight.className = 'node-header-right';

            var btnUp = document.createElement('button');
            btnUp.type = 'button';
            btnUp.className = 'btn-node-act';
            btnUp.title = 'تحريك العقدة لأعلى';
            btnUp.disabled = (index === 0);
            btnUp.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
            btnUp.addEventListener('click', function (e) {
                e.stopPropagation();
                moveNode(index, index - 1);
            });

            var btnDown = document.createElement('button');
            btnDown.type = 'button';
            btnDown.className = 'btn-node-act';
            btnDown.title = 'تحريك العقدة لأسفل';
            btnDown.disabled = (index === nLen - 1);
            btnDown.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
            btnDown.addEventListener('click', function (e) {
                e.stopPropagation();
                moveNode(index, index + 1);
            });

            var badge = document.createElement('span');
            badge.className = 'node-badge';
            badge.textContent = String(index + 1);

            headerRight.appendChild(btnUp);
            headerRight.appendChild(btnDown);
            headerRight.appendChild(badge);
            headerRight.appendChild(btnShapePill);

            // Left Group: Collapse/Expand + Duplicate + Delete
            var headerLeft = document.createElement('div');
            headerLeft.className = 'node-header-actions';

            var btnCollapse = document.createElement('button');
            btnCollapse.type = 'button';
            btnCollapse.className = 'btn-node-act btn-card-collapse';
            btnCollapse.title = node.isCollapsed ? 'توسيع تفاصيل العقدة والمنابع' : 'طي العقدة';
            btnCollapse.innerHTML = '<i class="fa-solid ' + (node.isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up') + '"></i>';
            btnCollapse.addEventListener('click', function (e) {
                e.stopPropagation();
                node.isCollapsed = !node.isCollapsed;
                saveState();
                renderNodesList();
            });

            var btnDup = document.createElement('button');
            btnDup.type = 'button';
            btnDup.className = 'btn-node-act';
            btnDup.title = 'تكرار هذه العقدة';
            btnDup.innerHTML = '<i class="fa-solid fa-clone"></i>';
            btnDup.addEventListener('click', function (e) {
                e.stopPropagation();
                duplicateNode(index);
            });

            var btnDel = document.createElement('button');
            btnDel.type = 'button';
            btnDel.className = 'btn-node-act btn-node-act--del';
            btnDel.title = 'حذف العقدة';
            btnDel.disabled = (nLen <= 2);
            btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            btnDel.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteNode(index);
            });

            var btnFlip = document.createElement('button');
            btnFlip.type = 'button';
            btnFlip.className = 'btn-node-act btn-node-flip';
            var curNodeSide = node.contentSide || 'inherit';
            var sideTitle = (curNodeSide === 'inherit')
                ? 'جهة التموضع: يتبع العام (انقر للتبديل)'
                : ('جهة التموضع: ' + (curNodeSide === 'left' ? 'يسار المسار' : (curNodeSide === 'right' ? 'يمين المسار' : (curNodeSide === 'top' ? 'أعلى المسار' : 'أسفل المسار'))));
            btnFlip.title = sideTitle;
            var sideIcon = (curNodeSide === 'right') ? 'ph-bold ph-arrow-right' : ((curNodeSide === 'left') ? 'ph-bold ph-arrow-left' : 'ph-bold ph-arrows-left-right');
            btnFlip.innerHTML = '<i class="' + sideIcon + '"></i>';
            if (curNodeSide !== 'inherit') btnFlip.classList.add('active');
            btnFlip.addEventListener('click', function (e) {
                e.stopPropagation();
                var cur = node.contentSide || 'inherit';
                if (cur === 'inherit') {
                    node.contentSide = (state.contentSide === 'left' || (!state.contentSide && state.orientation === 'vertical')) ? 'right' : 'left';
                } else if (cur === 'left') {
                    node.contentSide = 'right';
                } else if (cur === 'right') {
                    node.contentSide = 'inherit';
                } else {
                    node.contentSide = 'inherit';
                }
                saveState();
                renderNodesList();
                renderTimelineHUD();
                requestLiveSync(0);
            });

            headerLeft.appendChild(btnCollapse);
            headerLeft.appendChild(btnFlip);
            headerLeft.appendChild(btnDup);
            headerLeft.appendChild(btnDel);

            // Middle Group: Pure Iconic Source Tabs (Center, Front, Behind) - Visible only when not collapsed
            var activeSourceTab = node.activeSourceTab || 'front';

            var headerTabs = document.createElement('div');
            headerTabs.className = 'node-header-tabs';

            var isCenterInactive = (node.sources.center.type === 'none');
            var isFrontInactive = (!node.sources.front.visible || node.sources.front.type === 'none');
            var isBehindInactive = (!node.sources.behind.visible || node.sources.behind.type === 'none');

            var tabDefs = [
                {
                    key: 'center',
                    title: 'مركز العقدة (على مسار الخط الزمني)',
                    isActive: (activeSourceTab === 'center'),
                    isInactive: isCenterInactive,
                    svg: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><rect x="6" y="6" width="8" height="8" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="#141414"/></svg>'
                },
                {
                    key: 'front',
                    title: 'المنبع الأمامي / العلوي (فوق المسار)',
                    isActive: (activeSourceTab === 'front'),
                    isInactive: isFrontInactive,
                    svg: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><line x1="2" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><line x1="10" y1="15" x2="10" y2="9" stroke="currentColor" stroke-width="1.5"/><rect x="3.5" y="3" width="13" height="6" fill="currentColor"/></svg>'
                },
                {
                    key: 'behind',
                    title: 'المنبع الخلفي / السفلي (تحت المسار)',
                    isActive: (activeSourceTab === 'behind'),
                    isInactive: isBehindInactive,
                    svg: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><line x1="2" y1="5" x2="18" y2="5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><line x1="10" y1="5" x2="10" y2="11" stroke="currentColor" stroke-width="1.5"/><rect x="3.5" y="11" width="13" height="6" fill="currentColor"/></svg>'
                }
            ];

            tabDefs.forEach(function (t) {
                var btnTab = document.createElement('button');
                btnTab.type = 'button';
                btnTab.className = 'btn-header-tab' + (t.isActive ? ' active' : '') + (t.isInactive ? ' is-inactive' : '');
                btnTab.title = t.title;
                btnTab.innerHTML = t.svg;
                btnTab.addEventListener('click', function (e) {
                    e.stopPropagation();
                    node.activeSourceTab = t.key;
                    saveState();
                    renderNodesList();
                });
                headerTabs.appendChild(btnTab);
            });

            if (!node.isCollapsed) {
                headerRight.appendChild(headerTabs);
            }

            masterHeader.appendChild(headerRight);
            masterHeader.appendChild(headerLeft);

            // Helper: Quick symbol picker chips (Icon-only with tooltip)
            function createSymbolPickerRow(onSelect) {
                var row = document.createElement('div');
                row.className = 'symbol-picker-row';
                var lbl = document.createElement('span');
                lbl.className = 'symbol-picker-label';
                lbl.title = 'رموز سريعة بنقرة واحدة';
                lbl.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
                row.appendChild(lbl);
                var symbols = ['★', '✓', '✦', '⚡', '🚀', '🎯', '📌', '🔥', '💎', '⚙'];
                symbols.forEach(function (sym) {
                    var btnChip = document.createElement('button');
                    btnChip.type = 'button';
                    btnChip.className = 'btn-symbol-chip';
                    btnChip.textContent = sym;
                    btnChip.title = 'اختيار رمز: ' + sym;
                    btnChip.addEventListener('click', function (e) {
                        e.stopPropagation();
                        onSelect(sym);
                    });
                    row.appendChild(btnChip);
                });
                return row;
            }

            // Helper: Quick status badge chips (Icon-only label with tooltip)
            function createBadgePresetsRow(presets, onSelect) {
                var row = document.createElement('div');
                row.className = 'badge-presets-row';
                var lbl = document.createElement('span');
                lbl.className = 'badge-presets-label';
                lbl.title = 'نماذج شارات جاهزة بنقرة واحدة';
                lbl.innerHTML = '<i class="fa-solid fa-tags"></i>';
                row.appendChild(lbl);
                presets.forEach(function (p) {
                    var btnChip = document.createElement('button');
                    btnChip.type = 'button';
                    btnChip.className = 'btn-badge-chip';
                    btnChip.textContent = p;
                    btnChip.title = 'تطبيق وسم: ' + p;
                    btnChip.addEventListener('click', function (e) {
                        e.stopPropagation();
                        onSelect(p);
                    });
                    row.appendChild(btnChip);
                });
                return row;
            }

            // --- Tab Content Pod ---
            var tabContent = document.createElement('div');
            tabContent.className = 'node-source-tab-content';

            if (activeSourceTab === 'center') {
                var topBarC = document.createElement('div');
                topBarC.className = 'source-top-bar';

                var pickerWrapC = document.createElement('div');
                pickerWrapC.className = 'source-type-picker';

                var lblPickerC = document.createElement('span');
                lblPickerC.className = 'source-type-label';
                // lblPickerC omitted for sleek flat toolbar

                var selTypeC = document.createElement('select');
                selTypeC.className = 'spectrum-Picker-input source-type-select';
                var centerOptions = [
                    { val: 'shape_number', text: '🔷 شكل هندسي + رقم' },
                    { val: 'shape', text: '🔷 شكل هندسي فقط' },
                    { val: 'number', text: '🔢 رقم فقط' },
                    { val: 'icon', text: '⭐ أيقونة فقط' },
                    { val: 'shape_icon', text: '🔷 شكل هندسي + أيقونة' },
                    { val: 'text', text: '🔤 نص أو وسم كودي' }
                ];
                var curCType = node.sources.center.type || 'shape_number';
                centerOptions.forEach(function (opt) {
                    var elOpt = document.createElement('option');
                    elOpt.value = opt.val;
                    elOpt.textContent = opt.text;
                    if (curCType === opt.val) elOpt.selected = true;
                    selTypeC.appendChild(elOpt);
                });
                selTypeC.addEventListener('change', function () {
                    node.sources.center.type = selTypeC.value;
                    syncLegacyNodeFields(node, index);
                    saveState();
                    renderNodesList();
                    requestLiveSync(0);
                });
                pickerWrapC.appendChild(selTypeC);
                topBarC.appendChild(pickerWrapC);

                var btnToggleC = document.createElement('button');
                btnToggleC.type = 'button';
                var cVisNow = (node.sources.center.type !== 'none');
                btnToggleC.className = 'btn-source-vis-toggle' + (cVisNow ? ' active' : '');
                btnToggleC.title = cVisNow ? 'إخفاء مركز العقدة' : 'إظهار وتفعيل مركز العقدة';
                btnToggleC.className = 'btn-icon-act vis-btn' + (cVisNow ? ' active' : ' inactive'); btnToggleC.innerHTML = '<i class="fa-solid ' + (cVisNow ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
                btnToggleC.addEventListener('click', function () {
                    if (node.sources.center.type === 'none') {
                        node.sources.center.type = 'shape_number';
                    } else {
                        node.sources.center.type = 'none';
                    }
                    syncLegacyNodeFields(node, index);
                    saveState();
                    renderNodesList();
                    requestLiveSync(0);
                });
                topBarC.appendChild(btnToggleC);
                tabContent.appendChild(topBarC);

                // 2. Dynamic Controls
                var dynControlsC = document.createElement('div');
                dynControlsC.className = 'source-dynamic-controls';

                var cType = node.sources.center.type || 'shape_number';
                if (cType === 'none') {
                    var btnActC = document.createElement('button');
                    btnActC.type = 'button';
                    btnActC.className = 'btn-activate-pod';
                    btnActC.title = 'تفعيل مركز العقدة على المسار الزمني';
                    btnActC.innerHTML = '<i class="fa-solid fa-plus"></i> <span>تفعيل مركز العقدة على المسار</span>';
                    btnActC.addEventListener('click', function () {
                        node.sources.center.type = 'shape_number';
                        syncLegacyNodeFields(node, index);
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    dynControlsC.appendChild(btnActC);
                } else {
                    var rowC = document.createElement('div');
                    rowC.className = 'source-pod-inline-row';

                    // Center color picker
                    var cpWrapC = document.createElement('div');
                    cpWrapC.className = 'ci-wrap';
                    cpWrapC.title = 'لون المركز المستقل';
                    var inpColC = document.createElement('input');
                    inpColC.type = 'color';
                    inpColC.value = node.customColor || state.circleFill || '#ffffff';
                    inpColC.addEventListener('input', function (e) {
                        node.customColor = e.target.value;
                        node.sources.center.color = e.target.value;
                        saveState();
                        renderTimelineHUD();
                        requestLiveSync(60);
                    });
                    inpColC.addEventListener('change', function (e) {
                        node.customColor = e.target.value;
                        node.sources.center.color = e.target.value;
                        saveState();
                        renderNodesList();
                        renderTimelineHUD();
                        requestLiveSync(0);
                    });
                    cpWrapC.appendChild(inpColC);

                    if (cType === 'shape_number') {
                        var btnEditShape = document.createElement('button');
                        btnEditShape.type = 'button';
                        btnEditShape.className = 'btn-source-shape-edit';
                        btnEditShape.innerHTML = '<i class="fa-solid fa-shapes"></i> <span>تخصيص الشكل</span>';
                        btnEditShape.title = 'تخصيص شكل وحجم ولون هذه العقدة بشكل مستقل';
                        btnEditShape.addEventListener('click', function () {
                            openDrawerIndex = (openDrawerIndex === index) ? -1 : index;
                            renderNodesList();
                        });
                        rowC.appendChild(btnEditShape);
                        var inpNum = document.createElement('input');
                        inpNum.type = 'text';
                        inpNum.className = 'node-input-num';
                        inpNum.placeholder = '01';
                        inpNum.value = node.sources.center.value || '';
                        inpNum.title = 'الرقم المكتوب داخل أو بجانب مركز العقدة';
                        inpNum.addEventListener('focus', function () { selectNode(index); });
                        inpNum.addEventListener('input', function (e) {
                            node.sources.center.value = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(450);
                        });
                        rowC.appendChild(inpNum);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);

                    } else if (cType === 'shape') {
                        var btnEditShape = document.createElement('button');
                        btnEditShape.type = 'button';
                        btnEditShape.className = 'btn-source-shape-edit';
                        btnEditShape.innerHTML = '<i class="fa-solid fa-shapes"></i> <span>تخصيص الشكل</span>';
                        btnEditShape.title = 'تخصيص شكل وحجم ولون هذه العقدة بشكل مستقل';
                        btnEditShape.addEventListener('click', function () {
                            openDrawerIndex = (openDrawerIndex === index) ? -1 : index;
                            renderNodesList();
                        });
                        rowC.appendChild(btnEditShape);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);

                    } else if (cType === 'number') {
                        var inpNumOnly = document.createElement('input');
                        inpNumOnly.type = 'text';
                        inpNumOnly.className = 'node-input-num';
                        inpNumOnly.style.width = '85px';
                        inpNumOnly.placeholder = '01';
                        inpNumOnly.value = node.sources.center.value || '';
                        inpNumOnly.title = 'رقم العقدة الصريح على المسار';
                        inpNumOnly.addEventListener('focus', function () { selectNode(index); });
                        inpNumOnly.addEventListener('input', function (e) {
                            node.sources.center.value = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(450);
                        });
                        rowC.appendChild(inpNumOnly);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);

                    } else if (cType === 'icon') {
                        var inpIcon = document.createElement('input');
                        inpIcon.type = 'text';
                        inpIcon.className = 'node-input-num';
                        inpIcon.style.width = '55px';
                        inpIcon.style.textAlign = 'center';
                        inpIcon.placeholder = '★';
                        inpIcon.value = node.sources.center.icon || node.sources.center.value || '★';
                        inpIcon.title = 'رمز أو أيقونة المركز';
                        inpIcon.addEventListener('input', function (e) {
                            node.sources.center.icon = e.target.value;
                            node.sources.center.value = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(450);
                        });
                        rowC.appendChild(inpIcon);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);

                        var symRow = createSymbolPickerRow(function (sym) {
                            node.sources.center.icon = sym;
                            node.sources.center.value = sym;
                            inpIcon.value = sym;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(0);
                        });
                        dynControlsC.appendChild(symRow);

                    } else if (cType === 'shape_icon') {
                        var btnEditShape = document.createElement('button');
                        btnEditShape.type = 'button';
                        btnEditShape.className = 'btn-source-shape-edit';
                        btnEditShape.innerHTML = '<i class="fa-solid fa-shapes"></i> <span>تخصيص الشكل</span>';
                        btnEditShape.title = 'تخصيص شكل وحجم ولون هذه العقدة بشكل مستقل';
                        btnEditShape.addEventListener('click', function () {
                            openDrawerIndex = (openDrawerIndex === index) ? -1 : index;
                            renderNodesList();
                        });
                        rowC.appendChild(btnEditShape);
                        var inpShapeIcon = document.createElement('input');
                        inpShapeIcon.type = 'text';
                        inpShapeIcon.className = 'node-input-num';
                        inpShapeIcon.style.width = '50px';
                        inpShapeIcon.style.textAlign = 'center';
                        inpShapeIcon.placeholder = '★';
                        inpShapeIcon.value = node.sources.center.icon || node.sources.center.value || '★';
                        inpShapeIcon.title = 'رمز أو أيقونة المركز داخل الإطار';
                        inpShapeIcon.addEventListener('input', function (e) {
                            node.sources.center.icon = e.target.value;
                            node.sources.center.value = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(450);
                        });
                        rowC.appendChild(inpShapeIcon);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);

                        var symRowSI = createSymbolPickerRow(function (sym) {
                            node.sources.center.icon = sym;
                            node.sources.center.value = sym;
                            inpShapeIcon.value = sym;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(0);
                        });
                        dynControlsC.appendChild(symRowSI);

                    } else if (cType === 'text') {
                        var inpText = document.createElement('input');
                        inpText.type = 'text';
                        inpText.className = 'node-input-title flex-grow';
                        inpText.placeholder = 'نص أو كود المركز…';
                        inpText.value = node.sources.center.value || '';
                        inpText.title = 'نص أو كود المركز على المسار';
                        inpText.addEventListener('focus', function () { selectNode(index); });
                        inpText.addEventListener('input', function (e) {
                            node.sources.center.value = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            renderTimelineHUD();
                            requestLiveSync(450);
                        });
                        rowC.appendChild(inpText);
                        rowC.appendChild(cpWrapC);
                        dynControlsC.appendChild(rowC);
                    }
                }
                tabContent.appendChild(dynControlsC);

            } else if (activeSourceTab === 'front' || activeSourceTab === 'behind') {
                var isFront = (activeSourceTab === 'front');
                var sObj = isFront ? node.sources.front : node.sources.behind;
                var curSType = sObj.type || (isFront ? 'title_text' : 'none');

                // Initialize atomic block flags if not present
                if (typeof sObj.showTitle === 'undefined') {
                    sObj.showTitle = (curSType === 'title_text' || curSType === 'title_list' || curSType === 'title' || curSType === 'number_title' || curSType === 'icon_title');
                }
                if (typeof sObj.showDesc === 'undefined') {
                    sObj.showDesc = (curSType === 'title_text' || curSType === 'text' || curSType === 'number_text');
                }
                if (typeof sObj.showList === 'undefined') {
                    sObj.showList = (curSType === 'title_list' || curSType === 'list');
                }
                if (typeof sObj.showBadge === 'undefined') {
                    sObj.showBadge = (curSType === 'number_title' || curSType === 'number_text' || curSType === 'badge');
                }
                if (typeof sObj.showIcon === 'undefined') {
                    sObj.showIcon = (curSType === 'icon_title');
                }

                function syncDeduceStreamType() {
                    if (sObj.showBadge && sObj.showTitle) {
                        sObj.type = 'number_title';
                    } else if (sObj.showBadge && sObj.showDesc) {
                        sObj.type = 'number_text';
                    } else if (sObj.showBadge && !sObj.showTitle && !sObj.showDesc && !sObj.showList) {
                        sObj.type = 'badge';
                    } else if (sObj.showIcon && sObj.showTitle) {
                        sObj.type = 'icon_title';
                    } else if (sObj.showTitle && sObj.showList) {
                        sObj.type = 'title_list';
                    } else if (sObj.showList && !sObj.showTitle) {
                        sObj.type = 'list';
                    } else if (sObj.showTitle && sObj.showDesc) {
                        sObj.type = 'title_text';
                    } else if (sObj.showTitle && !sObj.showDesc) {
                        sObj.type = 'title';
                    } else if (!sObj.showTitle && sObj.showDesc) {
                        sObj.type = 'text';
                    } else {
                        sObj.type = 'title_text';
                    }
                }

                // 1. Source Top Bar (Output Preset Dropdown + Modular Atomic Blocks)
                var topBar = document.createElement('div');
                topBar.className = 'source-top-bar';

                // Output Preset Dropdown (9 Standard Types)
                var selType = document.createElement('select');
                selType.className = 'spectrum-Picker-input source-type-dropdown';
                selType.title = 'اختر نموذج مخرجات جاهز للمنبع';
                var typePresets = [
                    { val: 'title_text', label: '📄 عنوان رئيسي + شرح تفصيلي' },
                    { val: 'title_list', label: '📑 عنوان رئيسي + قائمة نقاط' },
                    { val: 'title', label: '🔤 عنوان رئيسي فقط' },
                    { val: 'text', label: '📝 شرح / نص تفصيلي فقط' },
                    { val: 'list', label: '📋 قائمة نقطية فقط' },
                    { val: 'number_title', label: '🔢 رقم / ترقيم + عنوان' },
                    { val: 'number_text', label: '📊 نسبة / مؤشر + بيان' },
                    { val: 'icon_title', label: '⭐ أيقونة / رمز + عنوان' },
                    { val: 'badge', label: '🏷️ شارة مميزة (Badge)' }
                ];
                typePresets.forEach(function (opt) {
                    var elOpt = document.createElement('option');
                    elOpt.value = opt.val;
                    elOpt.textContent = opt.label;
                    if (curSType === opt.val) elOpt.selected = true;
                    selType.appendChild(elOpt);
                });
                selType.addEventListener('change', function () {
                    var v = selType.value;
                    sObj.type = v;
                    sObj.visible = (v !== 'none');
                    if (v === 'title_text') {
                        sObj.showTitle = true; sObj.showDesc = true; sObj.showList = false; sObj.showBadge = false; sObj.showIcon = false;
                    } else if (v === 'title_list') {
                        sObj.showTitle = true; sObj.showDesc = false; sObj.showList = true; sObj.showBadge = false; sObj.showIcon = false;
                    } else if (v === 'title') {
                        sObj.showTitle = true; sObj.showDesc = false; sObj.showList = false; sObj.showBadge = false; sObj.showIcon = false;
                    } else if (v === 'text') {
                        sObj.showTitle = false; sObj.showDesc = true; sObj.showList = false; sObj.showBadge = false; sObj.showIcon = false;
                    } else if (v === 'list') {
                        sObj.showTitle = false; sObj.showDesc = false; sObj.showList = true; sObj.showBadge = false; sObj.showIcon = false;
                    } else if (v === 'number_title') {
                        sObj.showTitle = true; sObj.showDesc = false; sObj.showList = false; sObj.showBadge = true; sObj.showIcon = false;
                    } else if (v === 'number_text') {
                        sObj.showTitle = false; sObj.showDesc = true; sObj.showList = false; sObj.showBadge = true; sObj.showIcon = false;
                    } else if (v === 'icon_title') {
                        sObj.showTitle = true; sObj.showDesc = false; sObj.showList = false; sObj.showBadge = false; sObj.showIcon = true;
                    } else if (v === 'badge') {
                        sObj.showTitle = false; sObj.showDesc = false; sObj.showList = false; sObj.showBadge = true; sObj.showIcon = false;
                    }
                    syncLegacyNodeFields(node, index);
                    saveState();
                    renderNodesList();
                    renderTimelineHUD();
                    requestLiveSync(0);
                });
                topBar.appendChild(selType);

                var atomicBar = document.createElement('div');
                atomicBar.className = 'atomic-blocks-bar';

                var blockDefs = [
                    { key: 'title', label: 'عنوان', icon: 'fa-solid fa-heading', active: sObj.showTitle, title: 'تفعيل / تعطيل العنوان الرئيسي' },
                    { key: 'desc', label: 'شرح', icon: 'fa-solid fa-align-right', active: sObj.showDesc, title: 'تفعيل / تعطيل فقرة الشرح' },
                    { key: 'badge', label: 'شارة/رقم', icon: 'fa-solid fa-tag', active: sObj.showBadge, title: 'إضافة شارة / وسم / نسبة مئوية (Badge/KPI)' },
                    { key: 'list', label: 'نقاط', icon: 'fa-solid fa-list-ul', active: sObj.showList, title: 'تفعيل / تعطيل القائمة النقطية' },
                    { key: 'icon', label: 'رمز', icon: 'fa-solid fa-star', active: sObj.showIcon, title: 'إضافة أيقونة رمزية للمحطة' }
                ];

                blockDefs.forEach(function (b) {
                    var btnChip = document.createElement('button');
                    btnChip.type = 'button';
                    btnChip.className = 'btn-atomic-chip' + (b.active ? ' active' : '');
                    btnChip.title = b.title;
                    btnChip.innerHTML = '<i class="' + b.icon + '"></i><span>' + b.label + '</span>';
                    btnChip.addEventListener('click', function (e) {
                        e.stopPropagation();
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

                        if (!sObj.showTitle && !sObj.showDesc && !sObj.showList && !sObj.showBadge) {
                            sObj.showTitle = true;
                        }

                        syncDeduceStreamType();
                        syncLegacyNodeFields(node, index);
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    atomicBar.appendChild(btnChip);
                });

                topBar.appendChild(atomicBar);

                // Visibility Toggle Button
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
                    saveState();
                    renderNodesList();
                    requestLiveSync(0);
                });
                topBar.appendChild(btnToggle);
                tabContent.appendChild(topBar);

                // 2. Dynamic Controls Container
                var dynControls = document.createElement('div');
                dynControls.className = 'source-dynamic-controls';

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
                        syncLegacyNodeFields(node, index);
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    dynControls.appendChild(btnAct);
                } else {
                    // Block 1: Badge & Icon Row (if active)
                    if (sObj.showBadge || sObj.showIcon) {
                        var rowBadge = document.createElement('div');
                        rowBadge.className = 'node-field-row';
                        rowBadge.classList.add('node-field-row--compact');

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
                            inpIcon.style.width = '38px';
                            inpIcon.style.maxWidth = '38px';
                            inpIcon.style.textAlign = 'center';
                            inpIcon.value = sObj.icon || '★';
                            inpIcon.title = 'رمز أو أيقونة';
                            inpIcon.addEventListener('input', function (e) {
                                sObj.icon = e.target.value;
                                syncLegacyNodeFields(node, index);
                                saveState();
                                requestLiveSync(450);
                            });
                            rowBadge.appendChild(inpIcon);
                        }

                        if (sObj.showBadge) {
                            var inpBadge = document.createElement('input');
                            inpBadge.type = 'text';
                            inpBadge.className = 'field-input node-input-num node-input-badge';
                            inpBadge.placeholder = 'شارة/رقم (مثال: #01، +85%، Q1، مرحلة 1)…';
                            inpBadge.value = sObj.number || sObj.badge || (sObj.type === 'badge' ? sObj.text : '') || '';
                            inpBadge.title = 'نص الشارة أو النسبة أو المعرّف';
                            inpBadge.addEventListener('input', function (e) {
                                sObj.number = e.target.value;
                                sObj.badge = e.target.value;
                                if (sObj.type === 'badge') sObj.text = e.target.value;
                                syncLegacyNodeFields(node, index);
                                saveState();
                                requestLiveSync(450);
                            });
                            rowBadge.appendChild(inpBadge);
                        }

                        var clusterBadge = createStreamStylingBar(
                            bText,
                            'stream-name-tag--badge',
                            sObj,
                            'badge',
                            {
                                fontSize: 13,
                                color: '#ffffff',
                                boxFillColor: '#10b981',
                                boxStrokeColor: '#10b981',
                                boxRadius: 4
                            },
                            function (delay, rerender) {
                                syncLegacyNodeFields(node, index);
                                saveState();
                                if (rerender) renderNodesList();
                                requestLiveSync(delay);
                            }
                        );
                        rowBadge.appendChild(clusterBadge);
                        dynControls.appendChild(rowBadge);

                        var drwBadge = createStreamBoxDrawer('الشارة', sObj, 'badge', {
                            boxFillColor: '#10b981',
                            boxStrokeColor: '#10b981',
                            boxRadius: 4
                        }, function (delay, rerender) {
                            syncLegacyNodeFields(node, index);
                            saveState();
                            if (rerender) renderNodesList();
                            requestLiveSync(delay);
                        });
                        if (drwBadge) dynControls.appendChild(drwBadge);

                        if (sObj.showBadge) {
                            var badgePresetsRow = createBadgePresetsRow(['#01', 'Q1', '+85%', 'مرحلة 1', 'VIP', 'NEW', 'DONE'], function (bp) {
                                sObj.number = bp;
                                syncLegacyNodeFields(node, index);
                                saveState();
                                renderNodesList();
                                requestLiveSync(0);
                            });
                            dynControls.appendChild(badgePresetsRow);
                        }

                        if (sObj.showIcon) {
                            var symRowIcon = createSymbolPickerRow(function (sym) {
                                sObj.icon = sym;
                                syncLegacyNodeFields(node, index);
                                saveState();
                                renderNodesList();
                                requestLiveSync(0);
                            });
                            dynControls.appendChild(symRowIcon);
                        }
                    }

                    // Block 2: Title Row (if active)
                    if (sObj.showTitle) {
                        var rowTitle = document.createElement('div');
                        rowTitle.className = 'node-field-row';

                        var lblTitle = document.createElement('div');
                        lblTitle.className = 'field-label label--title';
                        lblTitle.innerHTML = '<i class="fa-solid fa-heading"></i> العنوان';
                        rowTitle.appendChild(lblTitle);

                        var inpTitle = document.createElement('input');
                        inpTitle.type = 'text';
                        inpTitle.className = 'field-input input--title node-input-title';
                        inpTitle.placeholder = 'العنوان الرئيسي…';
                        inpTitle.value = sObj.title || '';
                        inpTitle.title = 'العنوان الرئيسي للمحطة';
                        inpTitle.addEventListener('focus', function () { selectNode(index); });
                        inpTitle.addEventListener('input', function (e) {
                            sObj.title = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            requestLiveSync(450);
                        });
                        rowTitle.appendChild(inpTitle);

                        var clusterTitle = createStreamStylingBar(
                            'العنوان',
                            'stream-name-tag--title',
                            sObj,
                            'title',
                            {
                                fontSize: state.titleFontSize || 22,
                                color: state.titleColor || '#ffffff',
                                boxFillColor: state.titleBoxFillColor || '#0b1120',
                                boxStrokeColor: state.titleBoxStrokeColor || '#10b981',
                                boxRadius: state.titleBoxRadius || 6
                            },
                            function (delay, rerender) {
                                syncLegacyNodeFields(node, index);
                                saveState();
                                if (rerender) renderNodesList();
                                requestLiveSync(delay);
                            }
                        );
                        rowTitle.appendChild(clusterTitle);
                        dynControls.appendChild(rowTitle);

                        var drwTitle = createStreamBoxDrawer('العنوان', sObj, 'title', {
                            boxFillColor: state.titleBoxFillColor || '#0b1120',
                            boxStrokeColor: state.titleBoxStrokeColor || '#10b981',
                            boxRadius: state.titleBoxRadius || 6
                        }, function (delay, rerender) {
                            syncLegacyNodeFields(node, index);
                            saveState();
                            if (rerender) renderNodesList();
                            requestLiveSync(delay);
                        });
                        if (drwTitle) dynControls.appendChild(drwTitle);
                    }

                    // Block 3: Description Row (if active and not list)
                    if (sObj.showDesc && !sObj.showList) {
                        var rowDesc = document.createElement('div');
                        rowDesc.className = 'node-field-row';

                        var lblDesc = document.createElement('div');
                        lblDesc.className = 'field-label label--desc';
                        lblDesc.innerHTML = '<i class="fa-solid fa-align-right"></i> الشرح';
                        rowDesc.appendChild(lblDesc);

                        var inpDesc = document.createElement('input');
                        inpDesc.type = 'text';
                        inpDesc.className = 'field-input input--desc node-input-desc';
                        inpDesc.placeholder = 'فقرة الشرح والتفاصيل…';
                        inpDesc.value = sObj.text || '';
                        inpDesc.title = 'فقرة الشرح والتفاصيل';
                        inpDesc.addEventListener('focus', function () { selectNode(index); });
                        inpDesc.addEventListener('input', function (e) {
                            sObj.text = e.target.value;
                            syncLegacyNodeFields(node, index);
                            saveState();
                            requestLiveSync(450);
                        });
                        rowDesc.appendChild(inpDesc);

                        var clusterDesc = createStreamStylingBar(
                            'الشرح',
                            'stream-name-tag--desc',
                            sObj,
                            'desc',
                            {
                                fontSize: state.descFontSize || 13,
                                color: state.descColor || '#cbd5e1',
                                boxFillColor: state.descBoxFillColor || '#0b1120',
                                boxStrokeColor: state.descBoxStrokeColor || '#64748b',
                                boxRadius: state.descBoxRadius || 6
                            },
                            function (delay, rerender) {
                                syncLegacyNodeFields(node, index);
                                saveState();
                                if (rerender) renderNodesList();
                                requestLiveSync(delay);
                            }
                        );
                        rowDesc.appendChild(clusterDesc);
                        dynControls.appendChild(rowDesc);

                        var drwDesc = createStreamBoxDrawer('الشرح', sObj, 'desc', {
                            boxFillColor: state.descBoxFillColor || '#0b1120',
                            boxStrokeColor: state.descBoxStrokeColor || '#64748b',
                            boxRadius: state.descBoxRadius || 6
                        }, function (delay, rerender) {
                            syncLegacyNodeFields(node, index);
                            saveState();
                            if (rerender) renderNodesList();
                            requestLiveSync(delay);
                        });
                        if (drwDesc) dynControls.appendChild(drwDesc);
                    }

                    // Block 4: Bullet List Row (if active)
                    if (sObj.showList) {
                        var rowList = document.createElement('div');
                        rowList.className = 'node-field-row';
                        rowList.classList.add('node-field-row--align-top');

                        var lblList = document.createElement('div');
                        lblList.className = 'field-label label--list';
                        lblList.innerHTML = '<i class="fa-solid fa-list-ul"></i> النقاط';
                        rowList.appendChild(lblList);

                        var taList = document.createElement('textarea');
                        taList.className = 'field-input smart-list-textarea';
                        taList.rows = 2;
                        taList.classList.add('textarea--smart-list');
                        taList.placeholder = 'عناصر القائمة (اضغط Enter لنقطة جديدة •)…';
                        var initListText = (sObj.items && sObj.items.length > 0)
                            ? sObj.items.map(function (s) { return (s.indexOf('•') === 0 ? s : '• ' + s); }).join('\n')
                            : (sObj.text ? '• ' + sObj.text : '');
                        taList.value = initListText;
                        setupSmartListTextarea(taList, function (val) {
                            sObj.text = val;
                            sObj.items = val.split('\n').map(function (s) { return s.replace(/^[\s•\-\*]+/, '').trim(); }).filter(Boolean);
                            syncLegacyNodeFields(node, index);
                            saveState();
                            requestLiveSync(450);
                        });
                        rowList.appendChild(taList);

                        var clusterList = createStreamStylingBar(
                            'النقاط',
                            'stream-name-tag--desc',
                            sObj,
                            'desc',
                            {
                                fontSize: state.descFontSize || 13,
                                color: state.descColor || '#cbd5e1',
                                boxFillColor: state.descBoxFillColor || '#0b1120',
                                boxStrokeColor: state.descBoxStrokeColor || '#64748b',
                                boxRadius: state.descBoxRadius || 6
                            },
                            function (delay, rerender) {
                                syncLegacyNodeFields(node, index);
                                saveState();
                                if (rerender) renderNodesList();
                                requestLiveSync(delay);
                            }
                        );
                        rowList.appendChild(clusterList);
                        dynControls.appendChild(rowList);

                        var drwList = createStreamBoxDrawer('النقاط', sObj, 'desc', {
                            boxFillColor: state.descBoxFillColor || '#0b1120',
                            boxStrokeColor: state.descBoxStrokeColor || '#64748b',
                            boxRadius: state.descBoxRadius || 6
                        }, function (delay, rerender) {
                            syncLegacyNodeFields(node, index);
                            saveState();
                            if (rerender) renderNodesList();
                            requestLiveSync(delay);
                        });
                        if (drwList) dynControls.appendChild(drwList);
                    }
                }

                tabContent.appendChild(dynControls);
            }

            // --- Row 3: Individual Customization Drawer (Spectrum Accordion Grid) ---
            var drawer = document.createElement('div');
            drawer.className = 'node-drawer' + (openDrawerIndex === index ? ' open' : ' collapsed');

            // 1. Drawer Header (Clean Title + Actions)
            var drawerHead = document.createElement('div');
            drawerHead.className = 'node-drawer-head';

            var headTitle = document.createElement('div');
            headTitle.className = 'drawer-head-title';
            headTitle.innerHTML = '<i class="fa-solid fa-sliders"></i> <span>تخصيص العقدة #' + (index + 1) + '</span>';
            drawerHead.appendChild(headTitle);

            var headActions = document.createElement('div');
            headActions.className = 'drawer-head-actions';
            if (isCustomized) {
                var btnRevert = document.createElement('button');
                btnRevert.type = 'button';
                btnRevert.className = 'btn-drawer-revert';
                btnRevert.title = 'إلغاء التخصيص المستقل والعودة لاتباع النمط العام';
                btnRevert.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i> <span>استعادة النمط العام</span>';
                btnRevert.addEventListener('click', function () {
                    node.customShape = 'inherit';
                    node.customColor = '';
                    node.customSize = null;
                    node.customStroke = '';
                    node.customStrokeWidth = null;
                    node.isHollow = false;
                    node.hasGuideTick = false;
                    node.customHeight = null;
                    node.customWidth = null;
                    node.customAnchor = null;
                    saveState();
                    renderNodesList();
                    requestLiveSync(0);
                });
                headActions.appendChild(btnRevert);
            } else {
                var badgeInherit = document.createElement('span');
                badgeInherit.className = 'drawer-badge-inherit';
                badgeInherit.innerHTML = '<i class="fa-solid fa-globe"></i> <span>تتبع النمط العام</span>';
                headActions.appendChild(badgeInherit);
            }
            drawerHead.appendChild(headActions);
            drawer.appendChild(drawerHead);

            // 2. Shape Selector Bar (Full-Width Clean Row)
            var rowShapeDD = document.createElement('div');
            rowShapeDD.className = 'drawer-shape-bar';
            rowShapeDD.innerHTML = '<span class="field-label"><i class="fa-solid fa-shapes"></i> شكل العقدة</span>';

            var ddWrap = document.createElement('div');
            ddWrap.className = 'shape-dropdown-wrapper';

            var curShape = node.customShape || 'inherit';
            var curIsInherit = (curShape === 'inherit');
            var curShapeObj = curIsInherit ? curGlobalObj : ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(curShape) : { id: curShape, name: curShape });
            var ddTitleText = curIsInherit ? 'يتبع النمط العام (' + curGlobalShapeName + ')' : curShapeObj.name;
            var ddThumbSvg = curIsInherit 
                ? '<i class="fa-solid fa-globe" class="pill-shape-global-icon"></i>'
                : ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getSvgMarkup(curShapeObj.id, 'currentColor', 18) : '');

            var ddTrigger = document.createElement('button');
            ddTrigger.type = 'button';
            ddTrigger.className = 'shape-dropdown-trigger' + (curIsInherit ? '' : ' shape-trigger--custom');
            ddTrigger.title = 'تغيير شكل هذه العقدة';
            ddTrigger.innerHTML = 
                '<div class="shape-trigger-left">' +
                    '<span class="shape-thumb-mini">' + ddThumbSvg + '</span>' +
                    '<span class="shape-title-text">' + ddTitleText + '</span>' +
                '</div>' +
                '<i class="fa-solid fa-chevron-down"></i>';

            var ddPop = document.createElement('div');
            ddPop.className = 'shape-dropdown-popover';
            ddPop.style.display = 'none';

            var popGrid = document.createElement('div');
            popGrid.className = 'shape-popover-grid';

            // Inherit Option Tile
            var tileInherit = document.createElement('button');
            tileInherit.type = 'button';
            tileInherit.className = 'shape-tile shape-tile--inherit' + (curIsInherit ? ' active' : '');
            tileInherit.innerHTML = '<i class="fa-solid fa-globe"></i> <span>يتبع النمط العام (' + curGlobalShapeName + ')</span>';
            tileInherit.addEventListener('click', function (e) {
                e.stopPropagation();
                node.customShape = 'inherit';
                saveState();
                renderNodesList();
                requestLiveSync(0);
            });
            popGrid.appendChild(tileInherit);

            // All Shapes in Grid (Standard + Custom)
            if (typeof TR_SVG_SHAPES !== 'undefined') {
                TR_SVG_SHAPES.getAllShapes().forEach(function (sh) {
                    var tile = document.createElement('button');
                    tile.type = 'button';
                    tile.className = 'shape-tile' + (curShape === sh.id ? ' active' : '');
                    var dispName = sanitizeSvgName(sh.name) || sh.name;
                    tile.title = dispName;
                    tile.innerHTML = 
                        '<div class="shape-tile-icon">' + TR_SVG_SHAPES.getSvgMarkup(sh.id, 'currentColor', 22) + '</div>' +
                        '<span class="shape-tile-label">' + dispName + '</span>';

                    if (sh.category === 'custom') {
                        tile.classList.add('is-custom-shape');
                        var btnDel = document.createElement('span');
                        btnDel.className = 'shape-tile-del-btn';
                        btnDel.title = 'حذف هذا الشكل من المكتبة';
                        btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                        btnDel.addEventListener('click', function (ev) {
                            ev.stopPropagation();
                            TR_SVG_SHAPES.removeCustomShape(sh.id);
                            if (node.customShape === sh.id) node.customShape = 'inherit';
                            saveState();
                            renderNodesList();
                            initGlobalShapeDropdown();
                            setFeedback('✓ تم حذف الشكل المخصص من المكتبة', '');
                        });
                        tile.appendChild(btnDel);
                    }

                    tile.addEventListener('click', function (e) {
                        e.stopPropagation();
                        node.customShape = sh.id;
                        node.isHollow = (sh.isHollow === true);
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    popGrid.appendChild(tile);
                });
            }

            ddPop.appendChild(popGrid);

            // Import Custom SVG Button at Bottom of Popover
            var ddPopFoot = document.createElement('div');
            ddPopFoot.className = 'shape-popover-foot';
            var btnImportNode = document.createElement('button');
            btnImportNode.type = 'button';
            btnImportNode.className = 'btn-popover-import';
            btnImportNode.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>استيراد شكل SVG جديد…</span>';
            btnImportNode.addEventListener('click', function (e) {
                e.stopPropagation();
                ddPop.style.display = 'none';
                ddTrigger.classList.remove('open');
                openSvgImporterModal(index);
            });
            ddPopFoot.appendChild(btnImportNode);
            ddPop.appendChild(ddPopFoot);

            ddTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = (ddPop.style.display === 'block');
                ddPop.style.display = isOpen ? 'none' : 'block';
                ddTrigger.classList.toggle('open', !isOpen);
            });

            document.addEventListener('click', function (e) {
                if (!ddTrigger.contains(e.target) && !ddPop.contains(e.target)) {
                    ddPop.style.display = 'none';
                    ddTrigger.classList.remove('open');
                }
            });

            ddWrap.appendChild(ddTrigger);
            ddWrap.appendChild(ddPop);
            rowShapeDD.appendChild(ddWrap);
            drawer.appendChild(rowShapeDD);

            // Detailed Per-Shape Controls (Always Accessible Directly)
            var effShapeForProps = (curShape === 'inherit') ? (state.nodeShape || 'circle') : curShape;
            var curPropsShapeObj = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(effShapeForProps) : { id: effShapeForProps, name: effShapeForProps };

            function ensureNodeCustomized() {
                if (node.customShape === 'inherit' || !node.customShape) {
                    node.customShape = effShapeForProps;
                }
            }

            var propsContainer = document.createElement('div');
            propsContainer.className = 'row-2';
            propsContainer.classList.add('pill-props-wrap');

                // Helper to create a standard Spectrum slider cell (.field-cell)
                function makeStudioSlider(icon, label, min, max, step, initialVal, unit, onVal, extraEl) {
                    var cell = document.createElement('div');
                    cell.className = 'field-cell';
                    cell.innerHTML = '<span class="field-label"><i class="' + icon + '"></i> ' + label + '</span>';

                    var combo = document.createElement('div');
                    combo.className = 'slider-stepper-combo';

                    var sl = document.createElement('input');
                    sl.type = 'range';
                    sl.className = 'sl';
                    sl.min = min;
                    sl.max = max;
                    sl.step = step;
                    sl.value = initialVal;

                    var nw = document.createElement('div');
                    nw.className = 'nw';
                    var ni = document.createElement('input');
                    ni.type = 'number';
                    ni.className = 'ni';
                    ni.min = min;
                    ni.max = max * 1.5;
                    ni.value = initialVal;
                    nw.appendChild(ni);

                    var u = document.createElement('span');
                    u.className = 'unit';
                    u.textContent = unit;

                    function handle(v) {
                        var n = parseFloat(v);
                        if (isNaN(n)) return;
                        ensureNodeCustomized();
                        sl.value = n;
                        ni.value = n;
                        onVal(n);
                    }
                    sl.addEventListener('input', function (e) { handle(e.target.value); });
                    ni.addEventListener('input', function (e) { handle(e.target.value); });

                    combo.appendChild(sl);
                    combo.appendChild(nw);
                    combo.appendChild(u);
                    if (extraEl) combo.appendChild(extraEl);

                    cell.appendChild(combo);
                    return cell;
                }

                // Helper to create compact 3x3 anchor matrix matching Spectrum
                function makeStudioAnchor(targetNode, shapeObj) {
                    var ancBox = document.createElement('div');
                    ancBox.className = 'anchor-matrix-3x3';

                    // Direct visual placement mapping
                    var matrixSlots = [
                        { anchor: 'top-left', label: 'أعلى اليسار' },
                        { anchor: 'top-center', label: 'أعلى الوسط' },
                        { anchor: 'top-right', label: 'أعلى اليمين' },
                        { anchor: 'middle-left', label: 'وسط اليسار' },
                        { anchor: 'center', label: 'المركز' },
                        { anchor: 'middle-right', label: 'وسط اليمين' },
                        { anchor: 'bottom-left', label: 'أسفل اليسار' },
                        { anchor: 'bottom-center', label: 'أسفل الوسط' },
                        { anchor: 'bottom-right', label: 'أسفل اليمين' }
                    ];
                    var curAnc = targetNode.customAnchor || (shapeObj.defaultAnchor || 'center');

                    matrixSlots.forEach(function (slot) {
                        var aBtn = document.createElement('button');
                        aBtn.type = 'button';
                        aBtn.className = 'tb' + (curAnc === slot.anchor ? ' active' : '');
                        aBtn.title = slot.label;
                        aBtn.textContent = '·';
                        aBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            targetNode.customAnchor = slot.anchor;
                            saveState();
                            renderNodesList();
                            requestLiveSync(0);
                        });
                        ancBox.appendChild(aBtn);
                    });
                    return ancBox;
                }

                if (effShapeForProps === 'tick') {
                    // Tick Row 1, Cell 1: ارتفاع السن
                    var curH = (node.customHeight && parseFloat(node.customHeight) > 0) ? parseFloat(node.customHeight) : state.tickHeight;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-arrows-up-down', 'ارتفاع السن', 8, 120, 2, curH, 'px', function (v) {
                        node.customHeight = v;
                        saveState();
                        requestLiveSync(60);
                    }));

                    // Tick Row 1, Cell 2: سماكة السن
                    var curW = (node.customWidth && parseFloat(node.customWidth) > 0) ? parseFloat(node.customWidth) : state.tickWidth;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-grip-lines-vertical', 'سماكة السن', 1, 20, 1, curW, 'px', function (v) {
                        node.customWidth = v;
                        saveState();
                        requestLiveSync(60);
                    }));

                    // Tick Row 2, Cell 1: لون السن
                    var cellCol = document.createElement('div');
                    cellCol.className = 'field-cell';
                    cellCol.innerHTML = '<span class="field-label"><i class="fa-solid fa-paint-brush"></i> لون السن</span>';
                    var cpWrapCol = document.createElement('div');
                    cpWrapCol.className = 'ci-wrap';
                    cpWrapCol.title = 'تحديد لون السن';
                    var inpCol = document.createElement('input');
                    inpCol.type = 'color';
                    inpCol.value = node.customColor || state.tickColor;
                    inpCol.addEventListener('input', function (e) {
                        node.customColor = e.target.value;
                        saveState();
                        requestLiveSync(60);
                    });
                    inpCol.addEventListener('change', function (e) {
                        node.customColor = e.target.value;
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    cpWrapCol.appendChild(inpCol);
                    cellCol.appendChild(cpWrapCol);
                    propsContainer.appendChild(cellCol);

                    // Tick Row 2, Cell 2: موقع السن (3x3 Matrix)
                    var cellPos = document.createElement('div');
                    cellPos.className = 'field-cell';
                    cellPos.innerHTML = '<span class="field-label"><i class="fa-solid fa-crosshairs"></i> الارتكاز</span>';
                    cellPos.appendChild(makeStudioAnchor(node, curShapeObj));
                    propsContainer.appendChild(cellPos);

                } else if (effShapeForProps === 'ring') {
                    // Ring Row 1, Cell 1: القطر
                    var curRSize = (node.customSize && parseFloat(node.customSize) > 0) ? parseFloat(node.customSize) : state.circleRadius;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-expand', 'القطر', 4, 60, 1, curRSize, 'px', function (v) {
                        node.customSize = v;
                        saveState();
                        requestLiveSync(60);
                    }));

                    // Ring Row 1, Cell 2: سمك ولون الحلقة
                    var cpWrapRS = document.createElement('div');
                    cpWrapRS.className = 'ci-wrap';
                    cpWrapRS.title = 'تحديد لون الحلقة';
                    var inpColRS = document.createElement('input');
                    inpColRS.type = 'color';
                    inpColRS.value = node.customStroke || node.customColor || state.circleStroke;
                    inpColRS.addEventListener('input', function (e) {
                        node.customStroke = e.target.value;
                        node.customColor = e.target.value;
                        saveState();
                        requestLiveSync(60);
                    });
                    inpColRS.addEventListener('change', function (e) {
                        node.customStroke = e.target.value;
                        node.customColor = e.target.value;
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    cpWrapRS.appendChild(inpColRS);

                    var curRSW = (node.customStrokeWidth !== undefined && node.customStrokeWidth !== null) ? parseFloat(node.customStrokeWidth) : 3;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-circle-notch', 'الإطار', 1, 20, 1, curRSW, 'px', function (v) {
                        node.customStrokeWidth = v;
                        saveState();
                        requestLiveSync(60);
                    }, cpWrapRS));

                    // Ring Row 2: سن الوصل والارتكاز
                    var cellRCombo = document.createElement('div');
                    cellRCombo.className = 'field-cell';
                    cellRCombo.innerHTML = '<span class="field-label"><i class="fa-solid fa-crosshairs"></i> الارتكاز والتوصيل</span>';
                    var dualR = document.createElement('div');
                    dualR.className = 'row-flex';
                    dualR.classList.add('dual-control-row');

                    dualR.appendChild(makeStudioAnchor(node, curShapeObj));

                    var btnRGuide = document.createElement('button');
                    btnRGuide.type = 'button';
                    btnRGuide.className = 'btn-guide-tick-compact' + (node.hasGuideTick ? ' active' : '');
                    btnRGuide.title = 'إظهار خط سن يربط الحلقة بالمسطرة مباشرة';
                    btnRGuide.innerHTML = '<i class="fa-solid fa-grip-lines-vertical"></i> <span>سن وصل</span>';
                    btnRGuide.addEventListener('click', function () {
                        node.hasGuideTick = !node.hasGuideTick;
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    dualR.appendChild(btnRGuide);
                    cellRCombo.appendChild(dualR);
                    propsContainer.appendChild(cellRCombo);

                } else {
                    // Branch C: Standard 2D & SVG Shapes (Perfect 2x2 Grid)
                    // Row 1, Cell 1 (Right): الحجم
                    var curSize = (node.customSize && parseFloat(node.customSize) > 0) ? parseFloat(node.customSize) : state.circleRadius;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-expand', 'الحجم', 4, 60, 1, curSize, 'px', function (v) {
                        node.customSize = v;
                        saveState();
                        requestLiveSync(60);
                    }));

                    // Row 1, Cell 2: التعبئة واللون
                    var isHollow = (node.isHollow === true);
                    var cellFill = document.createElement('div');
                    cellFill.className = 'field-cell';
                    cellFill.innerHTML = '<span class="field-label"><i class="fa-solid fa-fill-drip"></i> التعبئة واللون</span>';

                    var fillCombo = document.createElement('div');
                    fillCombo.className = 'row-flex';
                    fillCombo.classList.add('dual-fill-combo');

                    var tgFill = document.createElement('div');
                    tgFill.className = 'tg';
                    tgFill.style.flex = '1';

                    var btnSolid = document.createElement('button');
                    btnSolid.type = 'button';
                    btnSolid.className = 'tb' + (!isHollow ? ' active' : '');
                    btnSolid.innerHTML = '<i class="fa-solid fa-circle"></i> مصمت';
                    btnSolid.addEventListener('click', function () {
                        if (isHollow) {
                            node.isHollow = false;
                            saveState();
                            renderNodesList();
                            requestLiveSync(0);
                        }
                    });

                    var btnHollow = document.createElement('button');
                    btnHollow.type = 'button';
                    btnHollow.className = 'tb' + (isHollow ? ' active' : '');
                    btnHollow.innerHTML = '<i class="fa-solid fa-circle-notch"></i> مفرغ';
                    btnHollow.addEventListener('click', function () {
                        if (!isHollow) {
                            node.isHollow = true;
                            if (!node.customStrokeWidth || parseFloat(node.customStrokeWidth) < 2) {
                                node.customStrokeWidth = 3;
                            }
                            if (!node.customStroke && node.customColor) {
                                node.customStroke = node.customColor;
                            }
                            saveState();
                            renderNodesList();
                            requestLiveSync(0);
                        }
                    });

                    tgFill.appendChild(btnSolid);
                    tgFill.appendChild(btnHollow);
                    fillCombo.appendChild(tgFill);

                    var cpWrapFill = document.createElement('div');
                    cpWrapFill.className = 'ci-wrap';
                    cpWrapFill.title = 'تحديد لون التعبئة';
                    var inpColFill = document.createElement('input');
                    inpColFill.type = 'color';
                    inpColFill.value = node.customColor || state.circleFill;
                    inpColFill.addEventListener('input', function (e) {
                        node.customColor = e.target.value;
                        saveState();
                        requestLiveSync(60);
                    });
                    inpColFill.addEventListener('change', function (e) {
                        node.customColor = e.target.value;
                        saveState();
                        requestLiveSync(0);
                    });
                    cpWrapFill.appendChild(inpColFill);
                    fillCombo.appendChild(cpWrapFill);

                    cellFill.appendChild(fillCombo);
                    propsContainer.appendChild(cellFill);

                    // Row 2, Cell 1 (Right): سمك ولون الإطار
                    var cpWrapS = document.createElement('div');
                    cpWrapS.className = 'ci-wrap';
                    cpWrapS.title = 'تحديد لون الإطار';
                    var inpColS = document.createElement('input');
                    inpColS.type = 'color';
                    inpColS.value = node.customStroke || state.circleStroke;
                    inpColS.addEventListener('input', function (e) {
                        node.customStroke = e.target.value;
                        saveState();
                        requestLiveSync(60);
                    });
                    inpColS.addEventListener('change', function (e) {
                        node.customStroke = e.target.value;
                        saveState();
                        requestLiveSync(0);
                    });
                    cpWrapS.appendChild(inpColS);

                    var curSW = (node.customStrokeWidth !== undefined && node.customStrokeWidth !== null) ? parseFloat(node.customStrokeWidth) : state.circleStrokeWidth;
                    propsContainer.appendChild(makeStudioSlider('fa-solid fa-circle', 'الإطار', 0, 15, 1, curSW, 'px', function (v) {
                        node.customStrokeWidth = v;
                        saveState();
                        requestLiveSync(60);
                    }, cpWrapS));

                    // Row 2, Cell 2 (Left): نقطة الارتكاز وسن الوصل
                    var cellCombo = document.createElement('div');
                    cellCombo.className = 'field-cell';
                    cellCombo.innerHTML = '<span class="field-label"><i class="fa-solid fa-crosshairs"></i> الارتكاز والتوصيل</span>';

                    var dualCombo = document.createElement('div');
                    dualCombo.className = 'row-flex';
                    dualCombo.classList.add('dual-control-row');

                    // 3x3 Matrix
                    dualCombo.appendChild(makeStudioAnchor(node, curShapeObj));

                    // Guide Tick Button
                    var btnGuide = document.createElement('button');
                    btnGuide.type = 'button';
                    btnGuide.className = 'btn-guide-tick-compact' + (node.hasGuideTick ? ' active' : '');
                    btnGuide.title = 'إظهار خط سن يربط هذا الشكل بالمسار مباشرة';
                    btnGuide.innerHTML = '<i class="fa-solid fa-grip-lines-vertical"></i> <span>سن وصل</span>';
                    btnGuide.addEventListener('click', function () {
                        node.hasGuideTick = !node.hasGuideTick;
                        saveState();
                        renderNodesList();
                        requestLiveSync(0);
                    });
                    dualCombo.appendChild(btnGuide);

                    cellCombo.appendChild(dualCombo);
                    propsContainer.appendChild(cellCombo);
                }

                drawer.appendChild(propsContainer);

            // Toggle Drawer when shape pill is clicked
            btnShapePill.addEventListener('click', function () {
                openDrawerIndex = (openDrawerIndex === index) ? -1 : index;
                renderNodesList();
            });

            card.appendChild(masterHeader);
            if (!node.isCollapsed) {
                card.appendChild(tabContent);
            }
            if (openDrawerIndex === index) {
                card.appendChild(drawer);
            }
            container.appendChild(card);
        });
        if (container && savedScrollTop) container.scrollTop = savedScrollTop;
    }

    function moveNode(fromIdx, toIdx) {
        if (toIdx < 0 || toIdx >= state.nodes.length) return;
        var item = state.nodes.splice(fromIdx, 1)[0];
        state.nodes.splice(toIdx, 0, item);
        state.selectedNodeIndex = toIdx;
        openDrawerIndex = toIdx;
        saveState();
        renderNodesList();
        requestLiveSync(0);
    }

    function duplicateNode(index) {
        syncState();
        var orig = state.nodes[index];
        normalizeNodeSources(orig, index);
        var clone = {
            number: orig.number ? (orig.number + '+') : '',
            title: orig.title ? (orig.title + ' (نسخة)') : '',
            description: orig.description || '',
            customShape: orig.customShape || 'inherit',
            customColor: orig.customColor || '',
            customBoxColor: orig.customBoxColor || '',
            box: orig.box || 'inherit',
            boxRadius: (orig.boxRadius !== undefined) ? orig.boxRadius : null,
            customSize: orig.customSize || null,
            customStroke: orig.customStroke || '',
            customStrokeWidth: (orig.customStrokeWidth !== undefined) ? orig.customStrokeWidth : null,
            isHollow: (orig.isHollow === true),
            hasGuideTick: (orig.hasGuideTick === true),
            customHeight: orig.customHeight || null,
            customWidth: orig.customWidth || null,
            isCollapsed: false,
            sources: JSON.parse(JSON.stringify(orig.sources || {}))
        };
        if (clone.sources && clone.sources.front) {
            clone.sources.front.title = (clone.sources.front.title || '') + ' (نسخة)';
        }
        state.nodes.splice(index + 1, 0, clone);
        state.selectedNodeIndex = index + 1;
        openDrawerIndex = index + 1;
        saveState();
        renderNodesList();
        requestLiveSync(0);
    }

    function deleteNode(index) {
        syncState();
        if (state.nodes.length <= 2) return;
        state.nodes.splice(index, 1);
        if (openDrawerIndex === index) openDrawerIndex = -1;
        if (state.selectedNodeIndex >= state.nodes.length) state.selectedNodeIndex = Math.max(0, state.nodes.length - 1);
        saveState();
        renderNodesList();
        requestLiveSync(0);
    }

    function addNode() {
        syncState();
        var nextIdx = state.nodes.length + 1;
        state.selectedNodeIndex = state.nodes.length;
        var nextNum = (nextIdx < 10 ? '0' : '') + nextIdx;
        var newNode = {
            number: nextNum,
            title: 'عنوان ' + nextIdx,
            description: 'شرح وتفاصيل المرحلة ' + nextIdx,
            customShape: 'inherit',
            customColor: '',
            isCollapsed: false,
            sources: {
                center: {
                    type: 'shape_number',
                    shape: 'inherit',
                    value: nextNum,
                    visible: true,
                    color: ''
                },
                front: {
                    type: 'title_text',
                    title: 'عنوان ' + nextIdx,
                    text: 'شرح وتفاصيل المرحلة ' + nextIdx,
                    items: [],
                    number: '',
                    visible: true
                },
                behind: {
                    type: 'none',
                    title: '',
                    text: '',
                    number: '',
                    items: [],
                    visible: false
                }
            }
        };
        state.nodes.push(newNode);
        saveState();
        renderNodesList();
        renderTimelineHUD();
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined' && TIME_RULER_HOST_BRIDGE.hasRulerInComp()) {
            TIME_RULER_HOST_BRIDGE.executeHostGenerate(false, false);
        }
        var cont = $('nodes-container');
        if (cont) cont.scrollTop = cont.scrollHeight;
        setFeedback('✓ تمت إضافة العقدة #' + nextIdx + ' بنجاح', 'ok');
    }

    /* ------------------------------------------------------------------ */
    /* Harvest Active Uncommitted Input Values from DOM                  */
    /* ------------------------------------------------------------------ */
    function harvestActiveInputs() {
        var container = $('nodes-container');
        if (!container) return;
        var cards = container.querySelectorAll('.node-card');
        for (var c = 0; c < cards.length; c++) {
            var card = cards[c];
            var idx = parseInt(card.dataset.nodeIndex, 10);
            if (isNaN(idx) || !state.nodes || !state.nodes[idx]) continue;
            var node = state.nodes[idx];
            normalizeNodeSources(node, idx);

            var activeTab = node.activeSourceTab || 'front';
            var pod = card.querySelector('.node-source-tab-content');
            if (!pod) continue;

            if (activeTab === 'center' && node.sources && node.sources.center) {
                var cInps = pod.querySelectorAll('input');
                if (cInps.length > 0) {
                    var val = toStandardDigits(cInps[0].value);
                    var cType = node.sources.center.type || 'shape_number';
                    if (cType === 'icon' || cType === 'shape_icon') {
                        node.sources.center.icon = val;
                        node.sources.center.value = val;
                    } else {
                        node.sources.center.value = val;
                    }
                }
            } else if (activeTab === 'front' && node.sources && node.sources.front) {
                var fInps = pod.querySelectorAll('input.node-input-title');
                var fDescInp = pod.querySelector('input.node-input-desc') || pod.querySelector('textarea.node-input-desc') || pod.querySelector('textarea.smart-list-textarea') || pod.querySelector('textarea');
                var fNumInp = pod.querySelector('input.node-input-num') || pod.querySelector('input.node-input-badge');
                var fIconInp = pod.querySelector('input[title*="رمز"]');

                if (fInps.length > 0) {
                    node.sources.front.title = toStandardDigits(fInps[0].value);
                }
                if (fDescInp) {
                    var rawDesc = toStandardDigits(fDescInp.value);
                    node.sources.front.text = rawDesc;
                    if (node.sources.front.showList || node.sources.front.type === 'list' || node.sources.front.type === 'title_list') {
                        node.sources.front.items = rawDesc.split('\n').map(function (s) { return s.replace(/^•\s*/, '').trim(); }).filter(Boolean);
                    }
                }
                if (fNumInp) {
                    var rawNum = toStandardDigits(fNumInp.value);
                    node.sources.front.number = rawNum;
                    node.sources.front.badge = rawNum;
                    if (node.sources.front.type === 'badge') node.sources.front.text = rawNum;
                }
                if (fIconInp) {
                    node.sources.front.icon = fIconInp.value;
                }
            } else if (activeTab === 'behind' && node.sources && node.sources.behind) {
                var bInps = pod.querySelectorAll('input.node-input-title');
                var bDescInp = pod.querySelector('input.node-input-desc') || pod.querySelector('textarea.node-input-desc') || pod.querySelector('textarea.smart-list-textarea') || pod.querySelector('textarea');
                var bNumInp = pod.querySelector('input.node-input-num') || pod.querySelector('input.node-input-badge');
                var bIconInp = pod.querySelector('input[title*="رمز"]');

                if (bInps.length > 0) {
                    node.sources.behind.title = toStandardDigits(bInps[0].value);
                }
                if (bDescInp) {
                    var rawBDesc = toStandardDigits(bDescInp.value);
                    node.sources.behind.text = rawBDesc;
                    if (node.sources.behind.showList || node.sources.behind.type === 'list') {
                        node.sources.behind.items = rawBDesc.split('\n').map(function (s) { return s.replace(/^•\s*/, '').trim(); }).filter(Boolean);
                    }
                }
                if (bNumInp) {
                    var rawBNum = toStandardDigits(bNumInp.value);
                    node.sources.behind.number = rawBNum;
                    node.sources.behind.badge = rawBNum;
                    if (node.sources.behind.type === 'badge') node.sources.behind.text = rawBNum;
                }
                if (bIconInp) {
                    node.sources.behind.icon = bIconInp.value;
                }
            }

            syncLegacyNodeFields(node, idx);

            syncLegacyNodeFields(node, idx);
        }
    }

    function reverseNodesOrder() {
        syncState();
        if (!state.nodes || state.nodes.length <= 1) {
            setFeedback('⚠️ يلزم وجود عقدتين على الأقل لعكس الترتيب', 'warn');
            return;
        }

        // 1. Harvest any active uncommitted input values before reversing
        harvestActiveInputs();

        // 2. Ensure each node has complete, normalized triple sources
        state.nodes.forEach(function (node, idx) {
            normalizeNodeSources(node, idx);
        });

        // 3. Deep-clone the array in reversed order
        var reversedNodes = [];
        for (var i = state.nodes.length - 1; i >= 0; i--) {
            var n = state.nodes[i];
            var cloned = JSON.parse(JSON.stringify(n));
            reversedNodes.push(cloned);
        }
        state.nodes = reversedNodes;

        // 4. Adjust active/open drawer index
        if (openDrawerIndex >= 0 && openDrawerIndex < state.nodes.length) {
            openDrawerIndex = (state.nodes.length - 1) - openDrawerIndex;
        }
        if (state.selectedNodeIndex >= 0 && state.selectedNodeIndex < state.nodes.length) {
            state.selectedNodeIndex = (state.nodes.length - 1) - state.selectedNodeIndex;
        }

        // 5. Toggle sort order indicator ('asc' <-> 'desc')
        state.sortOrder = (state.sortOrder === 'desc') ? 'asc' : 'desc';

        // 6. Save state to localStorage immediately
        saveState();

        // 7. Re-render UI cards and HUD
        renderNodesList();
        renderTimelineHUD();
        updateReverseButtonUI();

        // 8. Execute in-place host update directly without forceRebuild (preserves AE comp layers)
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined' && TIME_RULER_HOST_BRIDGE.executeHostGenerate) {
            TIME_RULER_HOST_BRIDGE.executeHostGenerate(true, false, function (ok) {
                var orderText = (state.sortOrder === 'desc') ? 'تنازلي (N ➔ 1)' : 'تصاعدي (1 ➔ N)';
                setFeedback('✓ تم عكس ترتيب العقد: ' + orderText + ' (تحديث موضعي محفوظ)', 'ok');
            });
        }
    }

    function updateReverseButtonUI() {
        var btn = $('btn-reverse-nodes');
        if (!btn) return;
        var icon = $('icon-reverse-nodes');
        var txt = $('txt-reverse-nodes');
        var isDesc = (state.sortOrder === 'desc');

        if (icon) {
            icon.className = isDesc 
                ? 'ph-bold ph-sort-descending' 
                : 'ph-bold ph-sort-ascending';
        }
        if (txt) {
            txt.textContent = isDesc ? 'تنازلي' : 'قلب الترتيب';
        }
        btn.title = isDesc 
            ? 'الترتيب الحالي: تنازلي (انقر للقلب إلى تصاعدي)' 
            : 'عكس ترتيب العقد (تصاعدي ↔ تنازلي)';
        if (isDesc) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    return {
        createFieldHeader: createFieldHeader,
        createStreamStylingBar: createStreamStylingBar,
        createStreamBoxDrawer: createStreamBoxDrawer,
        renderNodesList: renderNodesList,
        moveNode: moveNode,
        duplicateNode: duplicateNode,
        deleteNode: deleteNode,
        addNode: addNode,
        reverseNodesOrder: reverseNodesOrder,
        updateReverseButtonUI: updateReverseButtonUI,
        harvestActiveInputs: harvestActiveInputs,
        getOpenDrawerIndex: function () { return openDrawerIndex; },
        setOpenDrawerIndex: function (idx) { openDrawerIndex = idx; },
        syncState: syncState
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_CARD_BUILDER;
}
