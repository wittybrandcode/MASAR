/**
 * TIME RULER PRO — Complete Masterclass Prototype Controller
 * Covers 100% of the extension's components with expert, flat, zero-nested-box UI architecture
 */

(function () {
    'use strict';

    // Built-in SVG shapes for the Shapes Library
    const BUILTIN_SHAPES = [
        { id: 'circle_solid', name: 'دائرة مصمتة', icon: 'fa-circle' },
        { id: 'circle_ring', name: 'دائرة مفرغة', icon: 'fa-circle-notch' },
        { id: 'square_solid', name: 'مربع مصمت', icon: 'fa-square' },
        { id: 'diamond', name: 'معين تقني', icon: 'fa-diamond' },
        { id: 'hexagon', name: 'مسدس هندسي', icon: 'fa-cube' },
        { id: 'pin', name: 'دبوس موقع', icon: 'fa-location-dot' },
        { id: 'star', name: 'نجمة خماسية', icon: 'fa-star' },
        { id: 'shield', name: 'درع أمني', icon: 'fa-shield-halved' },
        { id: 'tick', name: 'سن مسطرة', icon: 'fa-grip-lines-vertical' }
    ];

    // Master Application State
    const state = {
        activeTab: 'nodes',
        orientation: 'vertical', // 'vertical' | 'horizontal'
        spacing: 'auto',
        lineStyle: 'solid',
        lineCap: 'round',
        length: 1500,
        gap: 250,
        lineWidth: 4,
        lineColor: '#ffffff',
        startTerminal: 'none',
        endTerminal: 'none',
        selectedShape: BUILTIN_SHAPES[0],
        markerRadius: 11,
        markerFill: '#10b981',
        markerStrokeW: 3,
        markerStrokeColor: '#ffffff',
        markerNumSize: 20,
        markerNumColor: '#059669',
        globalTitleSize: 22,
        globalTitleColor: '#ffffff',
        globalDescSize: 13,
        globalDescColor: '#cbd5e1',
        contentSide: 'left',
        textAlign: 'auto',
        topOffset: 26,
        botOffset: 26,
        boxMasterMode: 'off', // 'off' | 'glass' | 'solid'
        titleBoxFillOp: 85,
        titleBoxFillColor: '#091510',
        titleBoxRadius: 6,
        titleBoxStrokeColor: '#10b981',
        descBoxFillOp: 85,
        descBoxFillColor: '#091510',
        descBoxRadius: 6,
        descBoxStrokeColor: '#52525b',
        behindBoxFillOp: 85,
        behindBoxFillColor: '#1a1408',
        behindBoxRadius: 6,
        behindBoxStrokeColor: '#f59e0b',
        boxPaddingH: 14,
        boxPaddingV: 6,
        liveSync: true,
        selectedIndex: 0,
        nodes: [
            {
                id: 'node-1',
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'البحث والتحليل',
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'inherit',
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 6,
                desc: 'دراسة السوق وتحديد متطلبات المشروع والجمهور المستهدف بدقة',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#181820',
                descBoxBorder: '#52525b',
                descBoxRadius: 6
            },
            {
                id: 'node-2',
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'كتابة السيناريو',
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'on', // Demonstrates active inline custom box
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 8,
                desc: 'صياغة الأفكار والنص الإبداعي وبناء تسلسل الأحداث الدرامي',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#181820',
                descBoxBorder: '#52525b',
                descBoxRadius: 6
            },
            {
                id: 'node-3',
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'التصميم والرسم',
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'inherit',
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 6,
                desc: 'رسم الستوري بورد وتصميم الهوية البصرية والمشاهد الفنية',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#181820',
                descBoxBorder: '#52525b',
                descBoxRadius: 6
            },
            {
                id: 'node-4',
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'التحريك والمؤثرات',
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'off', // Demonstrates explicitly disabled box
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 6,
                desc: 'موشن جرافيك احترافي مع ضبط الإيقاع والمؤثرات الصوتية',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#181820',
                descBoxBorder: '#52525b',
                descBoxRadius: 6
            },
            {
                id: 'node-5',
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'التسليم النهائي',
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'inherit',
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 6,
                desc: 'مراجعة الملاحظات وتصدير العمل النهائي بأعلى جودة بدقة 4K',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#181820',
                descBoxBorder: '#52525b',
                descBoxRadius: 6
            }
        ]
    };

    // DOM Elements
    const nodesContainer = document.getElementById('nodes-container');
    const badgeNodeCount = document.getElementById('badge-node-count');
    const headerNodeCount = document.getElementById('header-node-count');
    const tabBtnNodes = document.getElementById('tab-btn-nodes');
    const tabBtnControls = document.getElementById('tab-btn-controls');
    const viewNodes = document.getElementById('view-nodes');
    const viewControls = document.getElementById('view-controls');
    const btnAddNode = document.getElementById('btn-add-node');
    const btnReverse = document.getElementById('btn-reverse');
    const btnToggleAll = document.getElementById('btn-toggle-all');
    const btnImport = document.getElementById('btn-import');
    const btnHudCorner = document.getElementById('btn-hud-corner');
    const hudOrientLabel = document.getElementById('hud-orient-label');
    const canvasH = document.getElementById('timeline-hud-canvas');
    const canvasV = document.getElementById('timeline-hud-vertical-canvas');
    const footerStatusText = document.getElementById('footer-status-text');
    const btnLiveSync = document.getElementById('btn-live-sync');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnApplyAe = document.getElementById('btn-apply-ae');

    // Modals
    const modalBatch = document.getElementById('modal-batch-import');
    const btnCloseBatch = document.getElementById('btn-close-batch-modal');
    const btnCancelBatch = document.getElementById('btn-cancel-batch-modal');
    const btnApplyBatch = document.getElementById('btn-apply-batch-import');
    const txtBatchImport = document.getElementById('txt-batch-import');

    const modalShapes = document.getElementById('modal-node-shapes');
    const btnGlobalShapeTrigger = document.getElementById('btn-global-shape-trigger');
    const btnCloseShapes = document.getElementById('btn-close-shapes-modal');
    const btnCancelShapes = document.getElementById('btn-cancel-shapes-modal');
    const btnAcceptShapes = document.getElementById('btn-accept-shapes-modal');
    const gridGlobalShapes = document.getElementById('grid-global-shapes');
    const txtGlobalShapeName = document.getElementById('txt-global-shape-name');
    const modalPreviewShapeThumb = document.getElementById('modal-preview-shape-thumb');
    const modalPreviewShapeName = document.getElementById('modal-preview-shape-name');

    let tempSelectedShape = state.selectedShape;
    let hudHorizontalHits = [];
    let hudVerticalHits = [];

    // Box toggle helper (Icon-first architecture)
    function getBoxPillConfig(mode) {
        if (mode === 'on') {
            return {
                icon: '<i class="fa-solid fa-square"></i>',
                className: 'btn-box-toggle active',
                title: 'صندوق مخصص ومفعل لهذه العقدة (انقر للتعطيل)'
            };
        } else if (mode === 'off') {
            return {
                icon: '<i class="fa-solid fa-ban"></i>',
                className: 'btn-box-toggle disabled',
                title: 'الصندوق معطل تماماً (انقر للعودة لاتباع العام)'
            };
        } else {
            return {
                icon: '<i class="fa-regular fa-square"></i>',
                className: 'btn-box-toggle',
                title: 'صندوق النص: يتبع النمط العام (' + (state.boxMasterMode === 'off' ? 'بدون صناديق' : state.boxMasterMode) + ') - انقر للتخصيص'
            };
        }
    }

    // Dual-Axis HUD Framework Logic
    function updateCornerButton() {
        if (btnHudCorner) {
            const isV = (state.orientation === 'vertical');
            btnHudCorner.innerHTML = `<i class="fa-solid ${isV ? 'fa-arrows-up-down' : 'fa-arrows-left-right'}"></i><span class="hud-corner-dot"></span>`;
            btnHudCorner.title = isV 
                ? 'المسار الحالي: عمودي ↕ (انقر للتبديل الفوري إلى أفقي ↔)' 
                : 'المسار الحالي: أفقي ↔ (انقر للتبديل الفوري إلى عمودي ↕)';
        }
        if (hudOrientLabel) {
            hudOrientLabel.textContent = (state.orientation === 'vertical' ? 'المسار: عمودي ↕' : 'المسار: أفقي ↔');
        }
    }

    function renderHorizontalHUD() {
        if (!canvasH) return;
        const ctx = canvasH.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const parentW = canvasH.parentElement ? canvasH.parentElement.clientWidth : 600;
        const cssW = parentW > 0 ? parentW : 600;
        const cssH = 38;

        canvasH.style.width = cssW + 'px';
        canvasH.style.height = cssH + 'px';
        canvasH.width = Math.round(cssW * dpr);
        canvasH.height = Math.round(cssH * dpr);

        if (ctx.resetTransform) ctx.resetTransform();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cssW, cssH);
        hudHorizontalHits = [];

        const isH = (state.orientation === 'horizontal');
        const pad = 48;
        const lineY = 19;

        if (isH) {
            // White Baseline Track
            ctx.strokeStyle = state.lineColor || '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(pad, lineY);
            ctx.lineTo(cssW - pad, lineY);
            ctx.stroke();

            // Terminals
            ctx.fillStyle = state.lineColor || '#ffffff';
            ctx.beginPath();
            ctx.arc(pad - 10, lineY, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cssW - pad + 14, lineY);
            ctx.lineTo(cssW - pad + 6, lineY - 4.5);
            ctx.lineTo(cssW - pad + 6, lineY + 4.5);
            ctx.closePath();
            ctx.fill();

            // Square Nodes
            const count = state.nodes.length;
            const span = cssW - (2 * pad);
            const step = count > 1 ? (span / (count - 1)) : 0;
            const nodeSize = 22;
            const half = 11;

            for (let i = 0; i < count; i++) {
                const x = (count === 1) ? (cssW / 2) : (pad + (i * step));
                const y = lineY;
                const isSel = (i === state.selectedIndex);
                const nNum = String(i + 1);

                ctx.save();
                if (isSel) {
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(x - half - 1, y - half - 1, nodeSize + 2, nodeSize + 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - half - 0.5, y - half - 0.5, nodeSize + 1, nodeSize + 1);
                    ctx.fillStyle = '#052e16';
                    ctx.font = '900 12px "Cairo", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);
                    ctx.fillStyle = '#000000';
                    ctx.font = '800 12px "Cairo", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);
                }
                ctx.restore();

                hudHorizontalHits.push({ index: i, x: x, y: y, r: half + 3 });
            }
        } else {
            // Subtle guide when vertical
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pad, lineY);
            ctx.lineTo(cssW - pad, lineY);
            ctx.stroke();

            ctx.font = '9px "Cairo", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('المسار النشط: عمودي ↕ (انظر المسار الجانبي الأيمن)', cssW / 2, lineY);
            ctx.restore();
        }
    }

    function renderVerticalHUD() {
        if (!canvasV) return;
        const ctx = canvasV.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const parentH = canvasV.parentElement ? canvasV.parentElement.clientHeight : 450;
        const cssW = 44;
        const cssH = parentH > 80 ? parentH : 450;

        canvasV.style.width = cssW + 'px';
        canvasV.style.height = cssH + 'px';
        canvasV.width = Math.round(cssW * dpr);
        canvasV.height = Math.round(cssH * dpr);

        if (ctx.resetTransform) ctx.resetTransform();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cssW, cssH);
        hudVerticalHits = [];

        const isV = (state.orientation === 'vertical');
        const padY = 32;
        const lineX = 22;

        if (isV) {
            // White Vertical Baseline Track
            ctx.strokeStyle = state.lineColor || '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(lineX, padY);
            ctx.lineTo(lineX, cssH - padY);
            ctx.stroke();

            // Terminals
            ctx.fillStyle = state.lineColor || '#ffffff';
            ctx.beginPath();
            ctx.arc(lineX, padY - 10, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(lineX, cssH - padY + 14);
            ctx.lineTo(lineX - 4.5, cssH - padY + 6);
            ctx.lineTo(lineX + 4.5, cssH - padY + 6);
            ctx.closePath();
            ctx.fill();

            // Square Nodes
            const count = state.nodes.length;
            const span = cssH - (2 * padY);
            const step = count > 1 ? (span / (count - 1)) : 0;
            const nodeSize = 22;
            const half = 11;

            for (let i = 0; i < count; i++) {
                const y = (count === 1) ? (cssH / 2) : (padY + (i * step));
                const x = lineX;
                const isSel = (i === state.selectedIndex);
                const nNum = String(i + 1);

                ctx.save();
                if (isSel) {
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(x - half - 1, y - half - 1, nodeSize + 2, nodeSize + 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - half - 0.5, y - half - 0.5, nodeSize + 1, nodeSize + 1);
                    ctx.fillStyle = '#052e16';
                    ctx.font = '900 12px "Cairo", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);
                    ctx.fillStyle = '#000000';
                    ctx.font = '800 12px "Cairo", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);
                }
                ctx.restore();

                hudVerticalHits.push({ index: i, x: x, y: y, r: half + 3 });
            }
        } else {
            // Subtle guide when horizontal
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(lineX, padY);
            ctx.lineTo(lineX, cssH - padY);
            ctx.stroke();
            ctx.restore();
        }
    }

    function renderTimelineHUD() {
        updateCornerButton();
        renderHorizontalHUD();
        renderVerticalHUD();
    }

    // Render All Nodes (Tab 1)
    function render() {
        if (!nodesContainer) return;
        nodesContainer.innerHTML = '';
        if (badgeNodeCount) badgeNodeCount.textContent = state.nodes.length;
        if (headerNodeCount) headerNodeCount.textContent = state.nodes.length;

        state.nodes.forEach((node, index) => {
            const card = document.createElement('article');
            card.className = `node-card ${state.selectedIndex === index ? 'selected' : ''} ${node.collapsed ? 'collapsed' : ''}`;
            card.dataset.index = index;

            // 1. Integrated Header
            const headRow = document.createElement('div');
            headRow.className = 'node-head-row';

            const headRight = document.createElement('div');
            headRight.className = 'node-head-right';

            // Western Numeral Badge
            const numBadge = document.createElement('span');
            numBadge.className = 'node-number-badge';
            numBadge.textContent = index + 1;
            headRight.appendChild(numBadge);

            // Output Type Selector
            const typeSelect = document.createElement('select');
            typeSelect.className = 'source-type-dropdown';
            const options = [
                { val: 'title_text', label: '📄 عنوان رئيسي + شرح تفصيلي' },
                { val: 'title_list', label: '📑 عنوان رئيسي + قائمة نقاط' },
                { val: 'title', label: '🔤 عنوان رئيسي فقط' },
                { val: 'text', label: '📝 نص أو فقرة فقط' },
                { val: 'svg', label: '🔷 شكل مخصص SVG' },
                { val: 'image', label: '🖼️ صورة أو وسائط' }
            ];
            options.forEach(opt => {
                const elOpt = document.createElement('option');
                elOpt.value = opt.val;
                elOpt.textContent = opt.label;
                if (node.type === opt.val) elOpt.selected = true;
                typeSelect.appendChild(elOpt);
            });
            typeSelect.addEventListener('change', (e) => {
                node.type = e.target.value;
                render();
            });
            headRight.appendChild(typeSelect);

            // Sub-Source Tabs Segment (Icons: المركز | الأمامي | الخلفي)
            const segWrap = document.createElement('div');
            segWrap.className = 'source-segment-tabs';
            const segs = [
                { id: 'center', icon: '<i class="fa-solid fa-circle-dot"></i>', title: 'الموضع: المركز' },
                { id: 'front', icon: '<i class="fa-solid fa-angles-up"></i>', title: 'الموضع: الأمامي' },
                { id: 'behind', icon: '<i class="fa-solid fa-angles-down"></i>', title: 'الموضع: الخلفي' }
            ];
            segs.forEach(s => {
                const btnSeg = document.createElement('button');
                btnSeg.type = 'button';
                btnSeg.className = `segment-btn ${node.activeSegment === s.id ? 'active' : ''}`;
                btnSeg.dataset.tab = s.id;
                btnSeg.title = s.title;
                btnSeg.innerHTML = s.icon;
                btnSeg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    node.activeSegment = s.id;
                    render();
                });
                segWrap.appendChild(btnSeg);
            });
            headRight.appendChild(segWrap);

            // Head Actions (Left)
            const headActions = document.createElement('div');
            headActions.className = 'node-head-actions';

            // Visibility Toggle
            const btnVis = document.createElement('button');
            btnVis.type = 'button';
            btnVis.className = `btn-icon-act vis-btn ${node.visible ? 'active' : 'inactive'}`;
            btnVis.title = node.visible ? 'ظاهر بالمشهد' : 'مخفي بالمشهد';
            btnVis.innerHTML = `<i class="fa-solid ${node.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>`;
            btnVis.addEventListener('click', (e) => {
                e.stopPropagation();
                node.visible = !node.visible;
                render();
            });

            // Collapse Toggle
            const btnCol = document.createElement('button');
            btnCol.type = 'button';
            btnCol.className = 'btn-icon-act';
            btnCol.title = node.collapsed ? 'توسيع' : 'طي';
            btnCol.innerHTML = `<i class="fa-solid ${node.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>`;
            btnCol.addEventListener('click', (e) => {
                e.stopPropagation();
                node.collapsed = !node.collapsed;
                render();
            });

            // Duplicate
            const btnDup = document.createElement('button');
            btnDup.type = 'button';
            btnDup.className = 'btn-icon-act';
            btnDup.title = 'تكرار العقدة';
            btnDup.innerHTML = '<i class="fa-regular fa-clone"></i>';
            btnDup.addEventListener('click', (e) => {
                e.stopPropagation();
                const copy = JSON.parse(JSON.stringify(node));
                copy.id = 'node-' + Date.now();
                copy.title += ' (نسخة)';
                state.nodes.splice(index + 1, 0, copy);
                state.selectedIndex = index + 1;
                render();
            });

            // Delete
            const btnDel = document.createElement('button');
            btnDel.type = 'button';
            btnDel.className = 'btn-icon-act btn-del';
            btnDel.title = 'حذف العقدة';
            btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.nodes.length <= 1) {
                    alert('يجب الإبقاء على عقدة واحدة على الأقل');
                    return;
                }
                state.nodes.splice(index, 1);
                if (state.selectedIndex >= state.nodes.length) {
                    state.selectedIndex = state.nodes.length - 1;
                }
                render();
            });

            headActions.appendChild(btnVis);
            headActions.appendChild(btnCol);
            headActions.appendChild(btnDup);
            headActions.appendChild(btnDel);

            headRow.appendChild(headRight);
            headRow.appendChild(headActions);
            card.appendChild(headRow);

            // 2. Direct Body (Zero nested boxes)
            const body = document.createElement('div');
            body.className = 'node-body';

            // Row 1: Title Input + Micro-Controls
            const titleRow = document.createElement('div');
            titleRow.className = 'node-field-row';

            const titleLabel = document.createElement('div');
            titleLabel.className = 'field-label label--title';
            titleLabel.innerHTML = '<i class="fa-solid fa-heading"></i> العنوان';

            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.className = 'field-input input--title';
            titleInput.value = node.title;
            titleInput.placeholder = 'أدخل العنوان الرئيسي...';
            titleInput.addEventListener('input', (e) => {
                node.title = e.target.value;
            });

            const titleCluster = document.createElement('div');
            titleCluster.className = 'inline-tools-cluster';

            // Size
            const titleSizeBox = document.createElement('div');
            titleSizeBox.className = 'micro-size-box';
            titleSizeBox.title = 'حجم خط العنوان (بالنقاط)';
            titleSizeBox.innerHTML = `<input type="number" value="${node.titleSize}" /><span class="unit">pt</span>`;
            const sizeInput = titleSizeBox.querySelector('input');
            sizeInput.addEventListener('change', (e) => {
                node.titleSize = parseInt(e.target.value, 10) || 22;
            });

            // Color
            const titleColorSwatch = document.createElement('div');
            titleColorSwatch.className = 'micro-color-swatch';
            titleColorSwatch.style.background = node.titleColor;
            titleColorSwatch.title = 'لون خط العنوان';
            const colInp = document.createElement('input');
            colInp.type = 'color';
            colInp.value = node.titleColor;
            colInp.addEventListener('input', (e) => {
                node.titleColor = e.target.value;
                titleColorSwatch.style.background = e.target.value;
            });
            titleColorSwatch.appendChild(colInp);

            // Box Pill Toggle (Icon Only)
            const titleBoxCfg = getBoxPillConfig(node.titleBox);
            const titleBoxBtn = document.createElement('button');
            titleBoxBtn.type = 'button';
            titleBoxBtn.className = titleBoxCfg.className;
            titleBoxBtn.title = titleBoxCfg.title;
            titleBoxBtn.innerHTML = titleBoxCfg.icon;
            titleBoxBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (node.titleBox === 'inherit') {
                    node.titleBox = 'on';
                } else if (node.titleBox === 'on') {
                    node.titleBox = 'off';
                } else {
                    node.titleBox = 'inherit';
                }
                render();
            });

            titleCluster.appendChild(titleSizeBox);
            titleCluster.appendChild(titleColorSwatch);
            titleCluster.appendChild(titleBoxBtn);

            titleRow.appendChild(titleLabel);
            titleRow.appendChild(titleInput);
            titleRow.appendChild(titleCluster);
            body.appendChild(titleRow);

            // Inline Drawer for Title Box (if on)
            if (node.titleBox === 'on') {
                const drawer = document.createElement('div');
                drawer.className = 'inline-box-drawer';
                drawer.innerHTML = `
                    <span style="font-size: 10px; color: var(--accent-light); font-weight: 700;">
                        <i class="fa-solid fa-turn-up" style="transform: rotate(90deg);"></i> تخصيص صندوق العنوان:
                    </span>
                    <div class="box-param-group">
                        <span class="param-lbl">تعبئة:</span>
                        <div class="micro-color-swatch" style="background: ${node.titleBoxBg};" title="لون خلفية الصندوق">
                            <input type="color" value="${node.titleBoxBg}">
                        </div>
                    </div>
                    <div class="box-param-group">
                        <span class="param-lbl">إطار:</span>
                        <div class="micro-color-swatch" style="background: ${node.titleBoxBorder};" title="لون إطار الصندوق">
                            <input type="color" value="${node.titleBoxBorder}">
                        </div>
                    </div>
                    <div class="box-param-group">
                        <span class="param-lbl">زوايا:</span>
                        <input type="number" class="inp-rad" value="${node.titleBoxRadius}" title="تدوير الزوايا بالبكسل">
                        <span style="font-size: 9px; color: var(--text-dim)">px</span>
                    </div>
                `;

                const bgInp = drawer.querySelectorAll('input[type="color"]')[0];
                const borderInp = drawer.querySelectorAll('input[type="color"]')[1];
                const radInp = drawer.querySelector('.inp-rad');

                bgInp.addEventListener('input', (e) => {
                    node.titleBoxBg = e.target.value;
                    bgInp.parentElement.style.background = e.target.value;
                });
                borderInp.addEventListener('input', (e) => {
                    node.titleBoxBorder = e.target.value;
                    borderInp.parentElement.style.background = e.target.value;
                });
                radInp.addEventListener('change', (e) => {
                    node.titleBoxRadius = parseInt(e.target.value, 10) || 0;
                });

                body.appendChild(drawer);
            }

            // Row 2: Description Input + Micro-Controls
            const descRow = document.createElement('div');
            descRow.className = 'node-field-row';

            const descLabel = document.createElement('div');
            descLabel.className = 'field-label label--desc';
            descLabel.innerHTML = '<i class="fa-solid fa-align-right"></i> الشرح';

            const descInput = document.createElement('input');
            descInput.type = 'text';
            descInput.className = 'field-input input--desc';
            descInput.value = node.desc;
            descInput.placeholder = 'أدخل تفاصيل وشرح العقدة...';
            descInput.addEventListener('input', (e) => {
                node.desc = e.target.value;
            });

            const descCluster = document.createElement('div');
            descCluster.className = 'inline-tools-cluster';

            // Size
            const descSizeBox = document.createElement('div');
            descSizeBox.className = 'micro-size-box';
            descSizeBox.title = 'حجم خط الشرح';
            descSizeBox.innerHTML = `<input type="number" value="${node.descSize}" /><span class="unit">pt</span>`;
            const dSizeInput = descSizeBox.querySelector('input');
            dSizeInput.addEventListener('change', (e) => {
                node.descSize = parseInt(e.target.value, 10) || 13;
            });

            // Color
            const descColorSwatch = document.createElement('div');
            descColorSwatch.className = 'micro-color-swatch';
            descColorSwatch.style.background = node.descColor;
            descColorSwatch.title = 'لون خط الشرح';
            const dColInp = document.createElement('input');
            dColInp.type = 'color';
            dColInp.value = node.descColor;
            dColInp.addEventListener('input', (e) => {
                node.descColor = e.target.value;
                descColorSwatch.style.background = e.target.value;
            });
            descColorSwatch.appendChild(dColInp);

            // Box Pill Toggle (Icon Only)
            const descBoxCfg = getBoxPillConfig(node.descBox);
            const descBoxBtn = document.createElement('button');
            descBoxBtn.type = 'button';
            descBoxBtn.className = descBoxCfg.className;
            descBoxBtn.title = descBoxCfg.title;
            descBoxBtn.innerHTML = descBoxCfg.icon;
            descBoxBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (node.descBox === 'inherit') {
                    node.descBox = 'on';
                } else if (node.descBox === 'on') {
                    node.descBox = 'off';
                } else {
                    node.descBox = 'inherit';
                }
                render();
            });

            descCluster.appendChild(descSizeBox);
            descCluster.appendChild(descColorSwatch);
            descCluster.appendChild(descBoxBtn);

            descRow.appendChild(descLabel);
            descRow.appendChild(descInput);
            descRow.appendChild(descCluster);
            body.appendChild(descRow);

            // Inline Drawer for Desc Box (if on)
            if (node.descBox === 'on') {
                const drawerD = document.createElement('div');
                drawerD.className = 'inline-box-drawer';
                drawerD.innerHTML = `
                    <span style="font-size: 10px; color: var(--accent-light); font-weight: 700;">
                        <i class="fa-solid fa-turn-up" style="transform: rotate(90deg);"></i> تخصيص صندوق الشرح:
                    </span>
                    <div class="box-param-group">
                        <span class="param-lbl">تعبئة:</span>
                        <div class="micro-color-swatch" style="background: ${node.descBoxBg};">
                            <input type="color" value="${node.descBoxBg}">
                        </div>
                    </div>
                    <div class="box-param-group">
                        <span class="param-lbl">إطار:</span>
                        <div class="micro-color-swatch" style="background: ${node.descBoxBorder};">
                            <input type="color" value="${node.descBoxBorder}">
                        </div>
                    </div>
                    <div class="box-param-group">
                        <span class="param-lbl">زوايا:</span>
                        <input type="number" class="inp-rad" value="${node.descBoxRadius}">
                        <span style="font-size: 9px; color: var(--text-dim)">px</span>
                    </div>
                `;
                body.appendChild(drawerD);
            }

            card.appendChild(body);

            // Selection Handler
            card.addEventListener('click', () => {
                state.selectedIndex = index;
                document.querySelectorAll('.node-card').forEach((c, i) => {
                    c.classList.toggle('selected', i === index);
                });
                renderTimelineHUD();
            });

            nodesContainer.appendChild(card);
        });

        // Always re-render dual-axis HUD after nodes update
        renderTimelineHUD();
    }

    // Tab Switching
    function setTab(tabName) {
        state.activeTab = tabName;
        if (tabName === 'nodes') {
            tabBtnNodes.classList.add('active');
            tabBtnControls.classList.remove('active');
            viewNodes.style.display = 'flex';
            viewControls.style.display = 'none';
        } else {
            tabBtnControls.classList.add('active');
            tabBtnNodes.classList.remove('active');
            viewNodes.style.display = 'none';
            viewControls.style.display = 'flex';
        }
    }

    // Attach Event Listeners
    if (tabBtnNodes) tabBtnNodes.addEventListener('click', () => setTab('nodes'));
    if (tabBtnControls) tabBtnControls.addEventListener('click', () => setTab('controls'));

    if (btnAddNode) {
        btnAddNode.addEventListener('click', () => {
            const newIndex = state.nodes.length + 1;
            state.nodes.push({
                id: 'node-' + Date.now(),
                type: 'title_text',
                activeSegment: 'center',
                visible: true,
                collapsed: false,
                title: 'محطة جديدة ' + newIndex,
                titleSize: 22,
                titleColor: '#ffffff',
                titleBox: 'inherit',
                titleBoxBg: '#091510',
                titleBoxBorder: '#10b981',
                titleBoxRadius: 6,
                desc: 'وصف تفصيلي للمحطة الجديدة...',
                descSize: 13,
                descColor: '#cbd5e1',
                descBox: 'inherit',
                descBoxBg: '#1e293b',
                descBoxBorder: '#64748b',
                descBoxRadius: 6
            });
            state.selectedIndex = state.nodes.length - 1;
            render();
            if (nodesContainer) nodesContainer.scrollTop = nodesContainer.scrollHeight;
        });
    }

    if (btnReverse) {
        btnReverse.addEventListener('click', () => {
            state.nodes.reverse();
            render();
        });
    }

    if (btnToggleAll) {
        btnToggleAll.addEventListener('click', () => {
            const anyExpanded = state.nodes.some(n => !n.collapsed);
            state.nodes.forEach(n => n.collapsed = anyExpanded);
            render();
        });
    }

    // Pattern Chips (Auto-Numbering)
    document.querySelectorAll('.pattern-chip, .btn-pattern-icon').forEach(btn => {
        btn.addEventListener('click', () => {
            const pattern = btn.dataset.pattern;
            state.nodes.forEach((node, i) => {
                const baseTitle = node.title.replace(/^(Phase\s+\d+|[0-9]{2,4})\s*[-|:]\s*/i, '').trim();
                if (pattern === 'num-01') {
                    const num = String(i + 1).padStart(2, '0');
                    node.title = `${num} - ${baseTitle}`;
                } else if (pattern === 'years') {
                    const yr = 2024 + i;
                    node.title = `${yr} - ${baseTitle}`;
                } else if (pattern === 'phases') {
                    node.title = `Phase ${i + 1}: ${baseTitle}`;
                } else if (pattern === 'clear-num') {
                    node.title = baseTitle;
                }
            });
            render();
        });
    });

    // Modals Handling
    if (btnImport && modalBatch) {
        btnImport.addEventListener('click', () => {
            modalBatch.style.display = 'flex';
        });
    }

    if (btnCloseBatch && modalBatch) {
        btnCloseBatch.addEventListener('click', () => modalBatch.style.display = 'none');
    }
    if (btnCancelBatch && modalBatch) {
        btnCancelBatch.addEventListener('click', () => modalBatch.style.display = 'none');
    }

    if (btnApplyBatch && txtBatchImport && modalBatch) {
        btnApplyBatch.addEventListener('click', () => {
            const raw = txtBatchImport.value.trim();
            if (raw) {
                const lines = raw.split('\n').filter(l => l.trim().length > 0);
                const newNodes = lines.map((line, idx) => {
                    const parts = line.split('|').map(p => p.trim());
                    return {
                        id: 'node-' + Date.now() + '-' + idx,
                        type: 'title_text',
                        activeSegment: 'center',
                        visible: true,
                        collapsed: false,
                        title: parts[1] || parts[0] || `محطة ${idx + 1}`,
                        titleSize: 22,
                        titleColor: '#ffffff',
                        titleBox: 'inherit',
                        titleBoxBg: '#091510',
                        titleBoxBorder: '#10b981',
                        titleBoxRadius: 6,
                        desc: parts[2] || (parts[1] ? parts[0] : 'وصف المحطة...'),
                        descSize: 13,
                        descColor: '#cbd5e1',
                        descBox: 'inherit',
                        descBoxBg: '#1e293b',
                        descBoxBorder: '#64748b',
                        descBoxRadius: 6
                    };
                });
                state.nodes = newNodes;
                state.selectedIndex = 0;
                render();
            }
            modalBatch.style.display = 'none';
        });
    }

    // Shapes Modal
    function populateShapesGrid() {
        if (!gridGlobalShapes) return;
        gridGlobalShapes.innerHTML = '';
        BUILTIN_SHAPES.forEach(shape => {
            const tile = document.createElement('div');
            tile.className = `shape-tile ${tempSelectedShape.id === shape.id ? 'active' : ''}`;
            tile.innerHTML = `
                <i class="fa-solid ${shape.icon}"></i>
                <span>${shape.name}</span>
            `;
            tile.addEventListener('click', () => {
                tempSelectedShape = shape;
                if (modalPreviewShapeThumb) modalPreviewShapeThumb.innerHTML = `<i class="fa-solid ${shape.icon}"></i>`;
                if (modalPreviewShapeName) modalPreviewShapeName.textContent = shape.name;
                gridGlobalShapes.querySelectorAll('.shape-tile').forEach(t => t.classList.remove('active'));
                tile.classList.add('active');
            });
            gridGlobalShapes.appendChild(tile);
        });
    }

    if (btnGlobalShapeTrigger && modalShapes) {
        btnGlobalShapeTrigger.addEventListener('click', () => {
            tempSelectedShape = state.selectedShape;
            populateShapesGrid();
            if (modalPreviewShapeThumb) modalPreviewShapeThumb.innerHTML = `<i class="fa-solid ${tempSelectedShape.icon}"></i>`;
            if (modalPreviewShapeName) modalPreviewShapeName.textContent = tempSelectedShape.name;
            modalShapes.style.display = 'flex';
        });
    }

    if (btnCloseShapes && modalShapes) {
        btnCloseShapes.addEventListener('click', () => modalShapes.style.display = 'none');
    }
    if (btnCancelShapes && modalShapes) {
        btnCancelShapes.addEventListener('click', () => modalShapes.style.display = 'none');
    }

    if (btnAcceptShapes && modalShapes) {
        btnAcceptShapes.addEventListener('click', () => {
            state.selectedShape = tempSelectedShape;
            if (txtGlobalShapeName) txtGlobalShapeName.textContent = state.selectedShape.name;
            const thumb = document.getElementById('thumb-global-shape');
            if (thumb) thumb.innerHTML = `<i class="fa-solid ${state.selectedShape.icon}"></i>`;
            modalShapes.style.display = 'none';
        });
    }

    // Collapsible boxes in Tab 2
    document.querySelectorAll('.box-fold-btn, .flat-section-header').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.flat-section') || btn.closest('.soga-box');
            if (section) {
                section.classList.toggle('collapsed');
                const chev = section.querySelector('.flat-section-header i.fa-chevron-up, .flat-section-header i.fa-chevron-down');
                if (chev) {
                    if (section.classList.contains('collapsed')) {
                        chev.className = 'fa-solid fa-chevron-down';
                    } else {
                        chev.className = 'fa-solid fa-chevron-up';
                    }
                }
            }
        });
    });

    // Synchronize Range Sliders and Number Steppers across Tab 2
    const sliderPairs = [
        { sl: 'rng-length', num: 'inp-length', key: 'length' },
        { sl: 'rng-gap', num: 'inp-gap', key: 'gap' },
        { sl: 'rng-line-w', num: 'inp-line-w', key: 'lineWidth' },
        { sl: 'rng-circ-r', num: 'inp-circ-r', key: 'markerRadius' },
        { sl: 'rng-circ-sw', num: 'inp-circ-sw', key: 'markerStrokeW' },
        { sl: 'rng-num-size', num: 'inp-num-size', key: 'markerNumSize' },
        { sl: 'rng-title-size', num: 'inp-title-size', key: 'globalTitleSize' },
        { sl: 'rng-desc-size', num: 'inp-desc-size', key: 'globalDescSize' },
        { sl: 'rng-top-offset', num: 'inp-top-offset', key: 'topOffset' },
        { sl: 'rng-bot-offset', num: 'inp-bot-offset', key: 'botOffset' },
        { sl: 'rng-title-box-fill-op', num: 'inp-title-box-fill-op', key: 'titleBoxFillOp' },
        { sl: 'rng-title-box-radius', num: 'inp-title-box-radius', key: 'titleBoxRadius' },
        { sl: 'rng-desc-box-fill-op', num: 'inp-desc-box-fill-op', key: 'descBoxFillOp' },
        { sl: 'rng-desc-box-radius', num: 'inp-desc-box-radius', key: 'descBoxRadius' },
        { sl: 'rng-behind-box-fill-op', num: 'inp-behind-box-fill-op', key: 'behindBoxFillOp' },
        { sl: 'rng-behind-box-radius', num: 'inp-behind-box-radius', key: 'behindBoxRadius' },
        { sl: 'rng-box-padding-h', num: 'inp-box-padding-h', key: 'boxPaddingH' },
        { sl: 'rng-box-padding-v', num: 'inp-box-padding-v', key: 'boxPaddingV' }
    ];

    sliderPairs.forEach(p => {
        const elSl = document.getElementById(p.sl);
        const elNum = document.getElementById(p.num);
        if (elSl && elNum) {
            elSl.addEventListener('input', () => {
                elNum.value = elSl.value;
                state[p.key] = parseFloat(elSl.value);
                if (p.key === 'length') renderTimelineHUD();
            });
            elNum.addEventListener('change', () => {
                elSl.value = elNum.value;
                state[p.key] = parseFloat(elNum.value);
                if (p.key === 'length') renderTimelineHUD();
            });
        }
    });

    // Color Inputs Synchronization
    const colorBindings = [
        { id: 'inp-line-color', key: 'lineColor', cb: () => renderTimelineHUD() },
        { id: 'inp-circ-fill', key: 'markerFill' },
        { id: 'inp-circ-stroke', key: 'markerStrokeColor' },
        { id: 'inp-num-color', key: 'markerNumColor' },
        { id: 'inp-title-color', key: 'globalTitleColor' },
        { id: 'inp-desc-color', key: 'globalDescColor' },
        { id: 'inp-title-box-fill-color', key: 'titleBoxFillColor' },
        { id: 'inp-title-box-stroke-color', key: 'titleBoxStrokeColor' },
        { id: 'inp-desc-box-fill-color', key: 'descBoxFillColor' },
        { id: 'inp-desc-box-stroke-color', key: 'descBoxStrokeColor' },
        { id: 'inp-behind-box-fill-color', key: 'behindBoxFillColor' },
        { id: 'inp-behind-box-stroke-color', key: 'behindBoxStrokeColor' }
    ];

    colorBindings.forEach(b => {
        const inp = document.getElementById(b.id);
        if (inp) {
            inp.addEventListener('input', (e) => {
                state[b.key] = e.target.value;
                if (inp.parentElement) inp.parentElement.style.background = e.target.value;
                if (b.cb) b.cb();
            });
        }
    });

    // Tab 2 Segmented Toggles (Flat Icon-First Architecture)
    function bindSegmentGroup(containerId, callback) {
        const group = document.getElementById(containerId);
        if (!group) return;
        group.querySelectorAll('.icon-seg-btn, .tb').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.icon-seg-btn, .tb').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                callback(btn);
            });
        });
    }

    bindSegmentGroup('seg-orientation', (btn) => {
        state.orientation = btn.dataset.orientation;
        const orientLbl = document.getElementById('hud-orient-label');
        if (orientLbl) orientLbl.textContent = state.orientation === 'vertical' ? 'المسار: عمودي ↕' : 'المسار: أفقي ↔';
        renderTimelineHUD();
    });

    bindSegmentGroup('seg-spacing', (btn) => {
        state.spacing = btn.dataset.spacing;
        const cellGap = document.getElementById('cell-gap');
        if (cellGap) cellGap.style.display = (state.spacing === 'fixed') ? 'flex' : 'none';
    });

    bindSegmentGroup('seg-line-style', (btn) => {
        state.lineStyle = btn.dataset.style;
        const dashRow = document.getElementById('row-dash-settings');
        if (dashRow) dashRow.style.display = (state.lineStyle === 'dashed') ? 'grid' : 'none';
        renderTimelineHUD();
    });

    bindSegmentGroup('seg-line-cap', (btn) => {
        state.lineCap = btn.dataset.cap;
        renderTimelineHUD();
    });

    bindSegmentGroup('seg-start-terminal', (btn) => {
        state.startTerminal = btn.dataset.term;
        renderTimelineHUD();
    });

    bindSegmentGroup('seg-end-terminal', (btn) => {
        state.endTerminal = btn.dataset.term;
        renderTimelineHUD();
    });

    bindSegmentGroup('seg-content-side', (btn) => {
        state.contentSide = btn.dataset.side;
    });

    bindSegmentGroup('seg-text-align', (btn) => {
        state.textAlign = btn.dataset.align;
    });

    bindSegmentGroup('seg-box-mode', (btn) => {
        state.boxMasterMode = btn.dataset.boxMode;
        render();
    });

    // Palettes Strip
    document.querySelectorAll('.palette-btn, .palette-btn-mini').forEach(btn => {
        btn.addEventListener('click', () => {
            const pal = btn.dataset.palette;
            if (pal === 'cyber') {
                state.lineColor = '#00f0ff';
                state.markerFill = '#00f0ff';
                state.markerStrokeColor = '#ffffff';
            } else if (pal === 'gold') {
                state.lineColor = '#f59e0b';
                state.markerFill = '#f59e0b';
                state.markerStrokeColor = '#ffffff';
            } else if (pal === 'tech') {
                state.lineColor = '#38bdf8';
                state.markerFill = '#0e71eb';
                state.markerStrokeColor = '#ffffff';
            } else if (pal === 'emerald') {
                state.lineColor = '#10b981';
                state.markerFill = '#10b981';
                state.markerStrokeColor = '#ffffff';
            } else if (pal === 'minimal') {
                state.lineColor = '#ffffff';
                state.markerFill = '#ffffff';
                state.markerStrokeColor = '#222222';
            }
            // Update line color swatch input
            const lineColInp = document.getElementById('inp-line-color');
            if (lineColInp) {
                lineColInp.value = state.lineColor;
                if (lineColInp.parentElement) lineColInp.parentElement.style.background = state.lineColor;
            }
            renderTimelineHUD();
        });
    });

    // Theme Presets Strip (Icon-Only Chips)
    const THEME_PRESETS = {
        roadmap: { lineColor: '#38bdf8', markerFill: '#0284c7', titleColor: '#38bdf8', boxMode: 'off' },
        pipeline: { lineColor: '#f59e0b', markerFill: '#d97706', titleColor: '#fbbf24', boxMode: 'off' },
        history: { lineColor: '#10b981', markerFill: '#059669', titleColor: '#34d399', boxMode: 'off' },
        cyber: { lineColor: '#ec4899', markerFill: '#db2777', titleColor: '#f472b6', boxMode: 'glass' },
        minimal: { lineColor: '#cbd5e1', markerFill: '#64748b', titleColor: '#f1f5f9', boxMode: 'off' },
        corporate_en: { lineColor: '#60a5fa', markerFill: '#2563eb', titleColor: '#93c5fd', boxMode: 'solid' }
    };

    document.querySelectorAll('.preset-chip-icon, .preset-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const pKey = btn.dataset.preset;
            const p = THEME_PRESETS[pKey];
            if (p) {
                document.querySelectorAll('.preset-chip-icon').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                state.lineColor = p.lineColor;
                state.markerFill = p.markerFill;
                state.globalTitleColor = p.titleColor;
                state.boxMasterMode = p.boxMode;

                // Sync inputs
                const lineCol = document.getElementById('inp-line-color');
                if (lineCol) { lineCol.value = p.lineColor; if (lineCol.parentElement) lineCol.parentElement.style.background = p.lineColor; }
                const circFill = document.getElementById('inp-circ-fill');
                if (circFill) { circFill.value = p.markerFill; if (circFill.parentElement) circFill.parentElement.style.background = p.markerFill; }

                // Sync box mode
                const segBox = document.getElementById('seg-box-mode');
                if (segBox) {
                    segBox.querySelectorAll('.icon-seg-btn, .tb').forEach(b => {
                        b.classList.toggle('active', b.dataset.boxMode === p.boxMode);
                    });
                }

                renderTimelineHUD();
                render();
            }
        });
    });

    // Corner Orientation Toggle Button (Vertical ↕ vs Horizontal ↔)
    if (btnHudCorner) {
        btnHudCorner.addEventListener('click', () => {
            state.orientation = (state.orientation === 'vertical') ? 'horizontal' : 'vertical';
            const segOrientation = document.getElementById('seg-orientation');
            if (segOrientation) {
                segOrientation.querySelectorAll('.icon-seg-btn, .tb').forEach(b => {
                    b.classList.toggle('active', b.dataset.orientation === state.orientation);
                });
            }
            const orientLbl = document.getElementById('hud-orient-label');
            if (orientLbl) orientLbl.textContent = state.orientation === 'vertical' ? 'المسار: عمودي ↕' : 'المسار: أفقي ↔';
            renderTimelineHUD();
        });
    }

    // Canvas click to select node from HUD
    function handleCanvasClick(e, hits, canvas) {
        if (!hits || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        for (const hit of hits) {
            const dist = Math.hypot(clickX - hit.x, clickY - clickY);
            if (dist <= hit.r) {
                state.selectedIndex = hit.index;
                render();
                const cards = document.querySelectorAll('.node-card');
                if (cards[hit.index]) {
                    cards[hit.index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                break;
            }
        }
    }

    if (canvasH) canvasH.addEventListener('click', (e) => handleCanvasClick(e, hudHorizontalHits, canvasH));
    if (canvasV) canvasV.addEventListener('click', (e) => handleCanvasClick(e, hudVerticalHits, canvasV));
    window.addEventListener('resize', () => renderTimelineHUD());

    // Footer Actions
    if (btnLiveSync) {
        btnLiveSync.addEventListener('click', () => {
            state.liveSync = !state.liveSync;
            btnLiveSync.classList.toggle('active', state.liveSync);
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const icon = btnRefresh.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            setTimeout(() => {
                if (icon) icon.classList.remove('fa-spin');
                if (footerStatusText) footerStatusText.textContent = '✓ تمت إعادة التوسيط والتحديث بنجاح';
            }, 600);
        });
    }

    if (btnApplyAe) {
        btnApplyAe.addEventListener('click', () => {
            if (footerStatusText) {
                footerStatusText.innerHTML = '<span style="color: var(--success); font-weight: 700;">✓ تم تطبيق وتحديث المسطرة بنجاح في After Effects (' + state.nodes.length + ' محطات)!</span>';
            }
        });
    }

    // Initial render
    render();

    // Export global prototype object for automation & testing
    window.TIME_RULER_PROTOTYPE = {
        state,
        render,
        setTab,
        renderTimelineHUD
    };
})();
