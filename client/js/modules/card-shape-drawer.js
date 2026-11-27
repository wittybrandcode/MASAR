/**
 * MASAR PRO — client/js/modules/card-shape-drawer.js
 * Independent Per-Node Shape Customization Drawer (Lazy Popover Grid, Fill/Hollow, 3x3 Anchor, Guide Tick)
 */

var TIME_RULER_CARD_SHAPE_DRAWER = (function () {
    'use strict';

    var _docPopoverListenerBound = false;

    function bindGlobalShapePopoverDismiss() {
        if (_docPopoverListenerBound || typeof document === 'undefined') return;
        _docPopoverListenerBound = true;
        document.addEventListener('click', function (e) {
            var openPops = document.querySelectorAll('.shape-dropdown-popover');
            for (var i = 0; i < openPops.length; i++) {
                var pop = openPops[i];
                if (pop.style.display !== 'block') continue;
                var wrap = pop.parentElement;
                if (wrap && !wrap.contains(e.target)) {
                    pop.style.display = 'none';
                    var trg = wrap.querySelector('.shape-dropdown-trigger');
                    if (trg) trg.classList.remove('open');
                }
            }
        });
    }

    function makeColorSwatch(title, initialColor, ensureCustomized, onInputVal, onChangeVal) {
        var wrap = document.createElement('div');
        wrap.className = 'ci-wrap';
        wrap.title = title;
        wrap.style.background = initialColor;
        var inp = document.createElement('input');
        inp.type = 'color';
        inp.value = initialColor;
        inp.addEventListener('input', function (e) {
            ensureCustomized();
            wrap.style.background = e.target.value;
            onInputVal(e.target.value);
        });
        inp.addEventListener('change', function (e) {
            ensureCustomized();
            wrap.style.background = e.target.value;
            onChangeVal(e.target.value);
        });
        wrap.appendChild(inp);
        return wrap;
    }

    function makeStudioSlider(icon, label, min, max, step, initialVal, unit, ensureCustomized, onVal, extraEl, inModal) {
        var sl = document.createElement('input');
        sl.type = 'range';
        sl.className = inModal ? 'prop-slider sl' : 'sl';
        sl.min = min;
        sl.max = max;
        sl.step = step;
        sl.value = initialVal;

        var ni = document.createElement('input');
        ni.type = 'number';
        ni.className = 'ni';
        ni.min = min;
        ni.max = max * 1.5;
        ni.value = initialVal;

        function handle(v) {
            var n = parseFloat(v);
            if (isNaN(n)) return;
            ensureCustomized();
            sl.value = n;
            ni.value = n;
            onVal(n);
        }
        sl.addEventListener('input', function (e) { handle(e.target.value); });
        ni.addEventListener('input', function (e) { handle(e.target.value); });

        var u = document.createElement('span');
        u.className = 'unit';
        u.textContent = unit;

        if (inModal) {
            var row = document.createElement('div');
            row.className = 'nc-prop-row';
            row.innerHTML = '<span class="nc-prop-lbl"><i class="' + icon + '"></i> ' + label + '</span>';

            var valBox = document.createElement('div');
            valBox.className = 'prop-val-box';
            valBox.appendChild(ni);
            valBox.appendChild(u);

            var sliderUnit = document.createElement('div');
            sliderUnit.className = 'prop-slider-unit';
            sliderUnit.appendChild(sl);
            sliderUnit.appendChild(valBox);
            row.appendChild(sliderUnit);

            if (extraEl) {
                extraEl.classList.add('nc-swatch');
                row.appendChild(extraEl);
            } else {
                var sp = document.createElement('span');
                sp.className = 'nc-trailing-spacer';
                row.appendChild(sp);
            }
            return row;
        }

        var cell = document.createElement('div');
        cell.className = 'field-cell';
        cell.innerHTML = '<span class="field-label"><i class="' + icon + '"></i> ' + label + '</span>';
        var combo = document.createElement('div');
        combo.className = 'slider-stepper-combo';
        var nw = document.createElement('div');
        nw.className = 'nw';
        nw.appendChild(ni);
        combo.appendChild(sl);
        combo.appendChild(nw);
        combo.appendChild(u);
        if (extraEl) combo.appendChild(extraEl);
        cell.appendChild(combo);
        return cell;
    }

    var ANCHOR_LABELS = {
        'top-left': 'أعلى اليسار',
        'top-center': 'أعلى الوسط',
        'top-right': 'أعلى اليمين',
        'middle-left': 'وسط اليسار',
        'center': 'المركز',
        'middle-right': 'وسط اليمين',
        'bottom-left': 'أسفل اليسار',
        'bottom-center': 'أسفل الوسط',
        'bottom-right': 'أسفل اليمين'
    };

    function revertNodeCustomization(node, index, ctx) {
        if (!node) return;
        node.customShape = 'inherit';
        if (node.sources && node.sources.center) {
            node.sources.center.shape = 'inherit';
        }
        node.customColor = '';
        node.customSize = null;
        node.customStroke = '';
        node.customStrokeWidth = null;
        node.isHollow = false;
        node.hasGuideTick = false;
        node.customHeight = null;
        node.customWidth = null;
        node.customAnchor = null;
        ctx.syncLegacyNodeFields(node, index);
        ctx.saveState({ label: 'استعادة النمط العام', coalesceMs: 0 });
        ctx.updateNodeCard(index);
        ctx.renderTimelineHUD();
        ctx.requestLiveSync(0);
        ctx.setFeedback('✓ تم استعادة النمط العام للعقدة #' + (index + 1), 'ok');
    }

    function makeStudioAnchor(targetNode, shapeObj, ensureCustomized, index, ctx) {
        var ancBox = document.createElement('div');
        ancBox.className = 'anchor-matrix-3x3';

        var matrixSlots = [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'center', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
        ];
        var curAnc = targetNode.customAnchor || (shapeObj.defaultAnchor || 'center');

        matrixSlots.forEach(function (anchorKey) {
            var aBtn = document.createElement('button');
            aBtn.type = 'button';
            aBtn.className = 'tb' + (curAnc === anchorKey ? ' active' : '');
            aBtn.title = ANCHOR_LABELS[anchorKey] || anchorKey;
            aBtn.textContent = '·';
            aBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                ensureCustomized();
                targetNode.customAnchor = anchorKey;
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.requestLiveSync(0);
            });
            ancBox.appendChild(aBtn);
        });
        return ancBox;
    }

    function makeGuideTickCombo(node, shapeObj, tooltip, ensureCustomized, index, ctx, includeLabel, inModal) {
        var curAncKey = node.customAnchor || (shapeObj.defaultAnchor || 'center');
        if (inModal) {
            var studioRow = document.createElement('div');
            studioRow.className = 'nc-anchor-studio-row';

            var leftCluster = document.createElement('div');
            leftCluster.className = 'nc-anchor-left';
            leftCluster.appendChild(makeStudioAnchor(node, shapeObj, ensureCustomized, index, ctx));

            var metaCol = document.createElement('div');
            metaCol.className = 'nc-anchor-meta';
            metaCol.innerHTML =
                '<span class="nc-anchor-active-name">' + ctx.escapeHtml(ANCHOR_LABELS[curAncKey] || curAncKey) + '</span>' +
                '<span class="nc-anchor-hint">نقطة ارتكاز الشكل على المسار</span>';
            leftCluster.appendChild(metaCol);
            studioRow.appendChild(leftCluster);

            var btnGuideS = document.createElement('button');
            btnGuideS.type = 'button';
            btnGuideS.className = 'btn-guide-tick-compact btn-guide-tick-studio' + (node.hasGuideTick ? ' active' : '');
            btnGuideS.title = tooltip;
            btnGuideS.innerHTML =
                '<i class="fa-solid fa-grip-lines-vertical"></i>' +
                '<div class="nc-guide-text"><span>سن وصل</span><small>' + (node.hasGuideTick ? 'مفعل' : 'متوقف') + '</small></div>';
            btnGuideS.addEventListener('click', function () {
                ensureCustomized();
                node.hasGuideTick = !node.hasGuideTick;
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.requestLiveSync(0);
            });
            studioRow.appendChild(btnGuideS);
            return studioRow;
        }

        var cellCombo = document.createElement('div');
        cellCombo.className = 'field-cell';
        if (includeLabel !== false) {
            cellCombo.innerHTML = '<span class="field-label"><i class="fa-solid fa-crosshairs"></i> الارتكاز والتوصيل</span>';
        }

        var dualCombo = document.createElement('div');
        dualCombo.className = 'row-flex dual-control-row';
        dualCombo.appendChild(makeStudioAnchor(node, shapeObj, ensureCustomized, index, ctx));

        var btnGuide = document.createElement('button');
        btnGuide.type = 'button';
        btnGuide.className = 'btn-guide-tick-compact' + (node.hasGuideTick ? ' active' : '');
        btnGuide.title = tooltip;
        btnGuide.innerHTML = '<i class="fa-solid fa-grip-lines-vertical"></i> <span>سن وصل</span>';
        btnGuide.addEventListener('click', function () {
            ensureCustomized();
            node.hasGuideTick = !node.hasGuideTick;
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.requestLiveSync(0);
        });
        dualCombo.appendChild(btnGuide);
        cellCombo.appendChild(dualCombo);
        return cellCombo;
    }

    function buildCardShapeDrawer(opts) {
        var node = opts.node;
        var index = opts.index;
        var state = opts.state;
        var curGlobalObj = opts.curGlobalObj;
        var curGlobalShapeName = opts.curGlobalShapeName;
        var isCustomized = opts.isCustomized;
        var ctx = opts.ctx;
        var esc = ctx.escapeHtml;
        var inModal = Boolean(opts.inModal);

        var drawer = document.createElement('div');
        drawer.className = 'node-drawer open' + (inModal ? ' node-cust-studio' : '');

        // 1. Inline Drawer Header (only when not wrapped inside #modal-node-customize)
        if (!inModal) {
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
                    revertNodeCustomization(node, index, ctx);
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
        }

        // 2. Hero Shape Preview + Selector Bar
        var curShape = node.customShape || 'inherit';
        var curIsInherit = (curShape === 'inherit');
        var curShapeObj = curIsInherit ? curGlobalObj : ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(curShape) : { id: curShape, name: curShape });
        var effShapeForProps = curIsInherit ? (state.nodeShape || 'circle') : curShape;
        var curPropsShapeObj = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(effShapeForProps) : { id: effShapeForProps, name: effShapeForProps };

        var heroPreview = document.createElement('div');
        heroPreview.className = 'nc-hero-preview';
        function refreshHeroPreview() {
            if (typeof TR_SVG_SHAPES !== 'undefined') {
                var previewCol = node.customColor || state.circleFill || '#10b981';
                var previewHollow = (node.isHollow === true || effShapeForProps === 'ring');
                heroPreview.innerHTML = TR_SVG_SHAPES.getSvgMarkup(curPropsShapeObj.id, previewCol, 26, previewHollow);
            } else {
                heroPreview.innerHTML = '<i class="fa-solid fa-shapes"></i>';
            }
        }
        refreshHeroPreview();

        var curCType = (node.sources && node.sources.center && node.sources.center.type) || 'shape_number';
        var centerDrawsShape = (curCType === 'shape_number' || curCType === 'shape' || curCType === 'shape_icon');
        if (inModal && !centerDrawsShape) {
            var noShapeBanner = document.createElement('div');
            noShapeBanner.className = 'nc-noshape-banner';
            noShapeBanner.innerHTML = '<span><i class="fa-solid fa-circle-info"></i> الشكل معطل في وضع المركز الحالي.</span>';
            var btnActivateShape = document.createElement('button');
            btnActivateShape.type = 'button';
            btnActivateShape.className = 'btn-enable-shape-inline';
            btnActivateShape.textContent = 'تفعيل الشكل';
            btnActivateShape.addEventListener('click', function () {
                if (!node.sources) node.sources = {};
                if (!node.sources.center) node.sources.center = { value: node.number || '' };
                node.sources.center.type = (curCType === 'icon') ? 'shape_icon' : 'shape_number';
                ctx.syncLegacyNodeFields(node, index);
                ctx.saveState();
                ctx.updateNodeCard(index);
                ctx.renderTimelineHUD();
                ctx.requestLiveSync(0);
            });
            noShapeBanner.appendChild(btnActivateShape);
            drawer.appendChild(noShapeBanner);
        }

        var rowShapeDD = document.createElement('div');
        rowShapeDD.className = inModal ? 'nc-hero-row' : 'drawer-shape-bar';
        if (inModal) {
            rowShapeDD.appendChild(heroPreview);
        } else {
            rowShapeDD.innerHTML = '<span class="field-label"><i class="fa-solid fa-shapes"></i> شكل العقدة</span>';
        }

        var selectorCol = document.createElement('div');
        selectorCol.className = inModal ? 'nc-hero-selector' : 'shape-dropdown-wrapper';
        if (inModal) {
            selectorCol.innerHTML = '<span class="field-label"><i class="fa-solid fa-shapes"></i> شكل العقدة</span>';
        }

        var ddWrap = document.createElement('div');
        ddWrap.className = 'shape-dropdown-wrapper';
        bindGlobalShapePopoverDismiss();

        var ddTitleText = curIsInherit ? ('عام: ' + curGlobalShapeName) : curShapeObj.name;
        var ddThumbSvg = curIsInherit
            ? '<i class="fa-solid fa-globe pill-shape-global-icon"></i>'
            : ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getSvgMarkup(curShapeObj.id, 'currentColor', 16) : '');

        var ddTrigger = document.createElement('button');
        ddTrigger.type = 'button';
        if (inModal) {
            var infoBlock = document.createElement('div');
            infoBlock.className = 'nc-hero-info';
            infoBlock.innerHTML =
                '<span class="nc-hero-shape-name">' + esc(curShapeObj.name || curGlobalShapeName) + '</span>' +
                '<span class="nc-hero-shape-state">' + (!centerDrawsShape ? 'مخفي بالمشهد (وضع بلا شكل)' : (curIsInherit ? 'يتبع الشكل العام' : 'شكل مخصص للعقدة')) + '</span>';
            selectorCol.innerHTML = '';
            selectorCol.className = 'nc-hero-selector nc-hero-selector--inline';
            selectorCol.appendChild(infoBlock);

            ddTrigger.className = 'shape-dropdown-trigger nc-btn-change-shape' + (curIsInherit ? '' : ' shape-trigger--custom');
            ddTrigger.title = 'اختيار شكل العقدة من المكتبة';
            ddTrigger.innerHTML = '<i class="fa-solid fa-shapes"></i> <span>تغيير الشكل</span>';
        } else {
            ddTrigger.className = 'shape-dropdown-trigger' + (curIsInherit ? '' : ' shape-trigger--custom');
            ddTrigger.title = 'تغيير شكل هذه العقدة';
            ddTrigger.innerHTML =
                '<div class="shape-trigger-left">' +
                    '<span class="shape-thumb-mini">' + ddThumbSvg + '</span>' +
                    '<span class="shape-title-text">' + esc(ddTitleText) + '</span>' +
                '</div>' +
                '<i class="fa-solid fa-shapes"></i>';
        }

        var ddPop = document.createElement('div');
        ddPop.className = 'shape-dropdown-popover';
        ddPop.style.display = 'none';

        var popGrid = document.createElement('div');
        popGrid.className = 'shape-popover-grid';

        var popGridBuilt = false;
        function applyNodeShapeChange(shapeId, isHol, msg) {
            node.customShape = shapeId;
            if (node.sources && node.sources.center) node.sources.center.shape = shapeId;
            if (typeof isHol === 'boolean') node.isHollow = isHol;
            ctx.syncLegacyNodeFields(node, index);
            ctx.saveState();
            ctx.updateNodeCard(index);
            ctx.renderTimelineHUD();
            ctx.requestLiveSync(0);
            ctx.setFeedback(msg, 'ok');
        }

        function buildShapePopoverGrid() {
            if (popGridBuilt) return;
            popGridBuilt = true;

            var tileInherit = document.createElement('button');
            tileInherit.type = 'button';
            tileInherit.className = 'shape-tile shape-tile--inherit' + (curIsInherit ? ' active' : '');
            tileInherit.innerHTML = '<i class="fa-solid fa-globe"></i> <span>' + esc('يتبع النمط العام (' + curGlobalShapeName + ')') + '</span>';
            tileInherit.addEventListener('click', function (e) {
                e.stopPropagation();
                applyNodeShapeChange('inherit', null, '✓ العقدة #' + (index + 1) + ' تتبع النمط العام (' + curGlobalShapeName + ')');
            });
            popGrid.appendChild(tileInherit);

            if (typeof TR_SVG_SHAPES !== 'undefined') {
                TR_SVG_SHAPES.getAllShapes().forEach(function (sh) {
                    var tile = document.createElement('button');
                    tile.type = 'button';
                    tile.className = 'shape-tile' + (curShape === sh.id ? ' active' : '');
                    var dispName = ctx.sanitizeSvgName(sh.name) || sh.name;
                    tile.title = dispName;
                    tile.innerHTML = '<div class="shape-tile-icon">' + TR_SVG_SHAPES.getSvgMarkup(sh.id, 'currentColor', 22) + '</div><span class="shape-tile-label">' + esc(dispName) + '</span>';

                    if (sh.category === 'custom') {
                        tile.classList.add('is-custom-shape');
                        var btnDel = document.createElement('span');
                        btnDel.className = 'shape-tile-del-btn';
                        btnDel.title = 'حذف هذا الشكل من المكتبة';
                        btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                        btnDel.addEventListener('click', function (ev) {
                            ev.stopPropagation();
                            TR_SVG_SHAPES.removeCustomShape(sh.id);
                            if (state.nodeShape === sh.id) state.nodeShape = 'circle';
                            if (Array.isArray(state.nodes)) {
                                state.nodes.forEach(function (n, nIdx) {
                                    if (n.customShape === sh.id) n.customShape = 'inherit';
                                    if (n.sources && n.sources.center && n.sources.center.shape === sh.id) n.sources.center.shape = 'inherit';
                                    ctx.syncLegacyNodeFields(n, nIdx);
                                });
                            }
                            ctx.saveState();
                            ctx.renderNodesList();
                            if (typeof TIME_RULER_SHAPES_ENGINE !== 'undefined' && TIME_RULER_SHAPES_ENGINE.initGlobalShapeDropdown) {
                                TIME_RULER_SHAPES_ENGINE.initGlobalShapeDropdown(state, {
                                    onUpdate: function () { ctx.saveState(); ctx.renderNodesList(); ctx.renderTimelineHUD(); ctx.requestLiveSync(0); }
                                });
                            }
                            if (typeof TIME_RULER_GLOBAL_CONTROLS !== 'undefined' && TIME_RULER_GLOBAL_CONTROLS.syncFormValues) {
                                TIME_RULER_GLOBAL_CONTROLS.syncFormValues(state);
                            }
                            ctx.setFeedback('✓ تم حذف الشكل المخصص من المكتبة', '');
                        });
                        tile.appendChild(btnDel);
                    }

                    tile.addEventListener('click', function (e) {
                        e.stopPropagation();
                        applyNodeShapeChange(sh.id, (sh.isHollow === true), '✓ تم تغيير شكل العقدة #' + (index + 1) + ' إلى: ' + (ctx.sanitizeSvgName(sh.name) || sh.name));
                    });
                    popGrid.appendChild(tile);
                });
            }
        }

        ddPop.appendChild(popGrid);

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
            ctx.openSvgImporterModal(index);
        });
        ddPopFoot.appendChild(btnImportNode);
        ddPop.appendChild(ddPopFoot);

        ddTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            buildShapePopoverGrid();
            var isOpen = (ddPop.style.display === 'block');
            var allPops = document.querySelectorAll('.shape-dropdown-popover');
            for (var pi = 0; pi < allPops.length; pi++) {
                allPops[pi].style.display = 'none';
                if (allPops[pi].parentElement) {
                    var tr = allPops[pi].parentElement.querySelector('.shape-dropdown-trigger');
                    if (tr) tr.classList.remove('open');
                }
            }
            ddPop.style.display = isOpen ? 'none' : 'block';
            ddTrigger.classList.toggle('open', !isOpen);
        });

        ddWrap.appendChild(ddTrigger);
        ddWrap.appendChild(ddPop);
        if (inModal) {
            selectorCol.appendChild(ddWrap);
            rowShapeDD.appendChild(selectorCol);
        } else {
            rowShapeDD.appendChild(ddWrap);
        }
        drawer.appendChild(rowShapeDD);

        // 3. Detailed Per-Shape Controls
        function ensureNodeCustomized() {
            if (node.customShape === 'inherit' || !node.customShape) {
                node.customShape = effShapeForProps;
                if (node.sources && node.sources.center) {
                    node.sources.center.shape = effShapeForProps;
                }
            }
        }

        var propsGroup = inModal ? document.createElement('div') : null;
        if (propsGroup) {
            propsGroup.className = 'nc-studio-group';
            propsGroup.innerHTML = '<div class="nc-group-title"><span class="nc-group-title-left"><i class="fa-solid fa-sliders"></i> الهندسة والتعبئة والإطار</span></div>';
        }

        var propsContainer = document.createElement('div');
        propsContainer.className = inModal ? 'nc-prop-list' : 'row-2 pill-props-wrap';

        var anchorSectionEl = null;

        if (effShapeForProps === 'tick') {
            var cpTick = makeColorSwatch(
                'تحديد لون السن',
                node.customColor || state.tickColor || '#ffffff',
                ensureNodeCustomized,
                function (v) { node.customColor = v; refreshHeroPreview(); ctx.saveState(); ctx.renderTimelineHUD(); ctx.requestLiveSync(60); },
                function (v) { node.customColor = v; ctx.saveState(); ctx.updateNodeCard(index); ctx.renderTimelineHUD(); ctx.requestLiveSync(0); }
            );
            var curH = (node.customHeight && parseFloat(node.customHeight) > 0) ? parseFloat(node.customHeight) : state.tickHeight;
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-arrows-up-down', 'ارتفاع السن', 8, 120, 2, curH, 'px', ensureNodeCustomized, function (v) {
                node.customHeight = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, inModal ? cpTick : null, inModal));

            var curW = (node.customWidth && parseFloat(node.customWidth) > 0) ? parseFloat(node.customWidth) : state.tickWidth;
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-grip-lines-vertical', 'سماكة السن', 1, 20, 1, curW, 'px', ensureNodeCustomized, function (v) {
                node.customWidth = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, null, inModal));

            if (inModal) {
                anchorSectionEl = makeStudioAnchor(node, curPropsShapeObj, ensureNodeCustomized, index, ctx);
            } else {
                var cellCol = document.createElement('div');
                cellCol.className = 'field-cell';
                cellCol.innerHTML = '<span class="field-label"><i class="fa-solid fa-paint-brush"></i> لون السن</span>';
                cellCol.appendChild(cpTick);
                propsContainer.appendChild(cellCol);

                var cellPos = document.createElement('div');
                cellPos.className = 'field-cell';
                cellPos.innerHTML = '<span class="field-label"><i class="fa-solid fa-crosshairs"></i> الارتكاز</span>';
                cellPos.appendChild(makeStudioAnchor(node, curPropsShapeObj, ensureNodeCustomized, index, ctx));
                propsContainer.appendChild(cellPos);
            }

        } else if (effShapeForProps === 'ring') {
            var curRSize = (node.customSize && parseFloat(node.customSize) > 0) ? parseFloat(node.customSize) : state.circleRadius;
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-expand', 'القطر', 4, 60, 1, curRSize, 'px', ensureNodeCustomized, function (v) {
                node.customSize = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, null, inModal));

            var cpWrapRS = makeColorSwatch(
                'تحديد لون الحلقة',
                node.customStroke || node.customColor || state.circleStroke || '#ffffff',
                ensureNodeCustomized,
                function (v) { node.customStroke = v; node.customColor = v; refreshHeroPreview(); ctx.saveState(); ctx.renderTimelineHUD(); ctx.requestLiveSync(60); },
                function (v) { node.customStroke = v; node.customColor = v; ctx.saveState(); ctx.updateNodeCard(index); ctx.renderTimelineHUD(); ctx.requestLiveSync(0); }
            );
            var curRSW = (node.customStrokeWidth !== undefined && node.customStrokeWidth !== null)
                ? parseFloat(node.customStrokeWidth)
                : ((state.circleStrokeWidth !== undefined && state.circleStrokeWidth !== null) ? parseFloat(state.circleStrokeWidth) : 3);
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-circle-notch', 'الإطار', 1, 20, 1, curRSW, 'px', ensureNodeCustomized, function (v) {
                node.customStrokeWidth = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, cpWrapRS, inModal));

            var ringAnchor = makeGuideTickCombo(node, curPropsShapeObj, 'إظهار خط سن يربط الحلقة بالمسطرة مباشرة', ensureNodeCustomized, index, ctx, !inModal, inModal);
            if (inModal) anchorSectionEl = ringAnchor;
            else propsContainer.appendChild(ringAnchor);

        } else {
            var curSize = (node.customSize && parseFloat(node.customSize) > 0) ? parseFloat(node.customSize) : state.circleRadius;
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-expand', 'الحجم', 4, 60, 1, curSize, 'px', ensureNodeCustomized, function (v) {
                node.customSize = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, null, inModal));

            var cpWrapS = makeColorSwatch(
                'تحديد لون الإطار',
                node.customStroke || state.circleStroke || '#ffffff',
                ensureNodeCustomized,
                function (v) { node.customStroke = v; ctx.saveState(); ctx.requestLiveSync(60); },
                function (v) { node.customStroke = v; ctx.saveState(); ctx.updateNodeCard(index); ctx.requestLiveSync(0); }
            );
            var curSW = (node.customStrokeWidth !== undefined && node.customStrokeWidth !== null) ? parseFloat(node.customStrokeWidth) : state.circleStrokeWidth;
            propsContainer.appendChild(makeStudioSlider('fa-solid fa-circle', 'الإطار', 0, 15, 1, curSW, 'px', ensureNodeCustomized, function (v) {
                node.customStrokeWidth = v;
                ctx.saveState();
                ctx.requestLiveSync(60);
            }, cpWrapS, inModal));

            var isHollow = (node.isHollow === true);
            var tgFill = document.createElement('div');
            tgFill.className = 'tg';
            tgFill.style.flex = '1';

            var btnSolid = document.createElement('button');
            btnSolid.type = 'button';
            btnSolid.className = 'tb' + (!isHollow ? ' active' : '');
            btnSolid.innerHTML = '<i class="fa-solid fa-circle"></i> مصمت';
            btnSolid.addEventListener('click', function () {
                if (isHollow) {
                    ensureNodeCustomized();
                    node.isHollow = false;
                    ctx.saveState();
                    ctx.updateNodeCard(index);
                    ctx.requestLiveSync(0);
                }
            });

            var btnHollow = document.createElement('button');
            btnHollow.type = 'button';
            btnHollow.className = 'tb' + (isHollow ? ' active' : '');
            btnHollow.innerHTML = '<i class="fa-solid fa-circle-notch"></i> مفرغ';
            btnHollow.addEventListener('click', function () {
                if (!isHollow) {
                    ensureNodeCustomized();
                    node.isHollow = true;
                    if (!node.customStrokeWidth || parseFloat(node.customStrokeWidth) < 2) node.customStrokeWidth = 3;
                    if (!node.customStroke && node.customColor) node.customStroke = node.customColor;
                    ctx.saveState();
                    ctx.updateNodeCard(index);
                    ctx.requestLiveSync(0);
                }
            });
            tgFill.appendChild(btnSolid);
            tgFill.appendChild(btnHollow);

            var cpWrapFill = makeColorSwatch(
                'تحديد لون التعبئة',
                node.customColor || state.circleFill || '#10b981',
                ensureNodeCustomized,
                function (v) {
                    node.customColor = v;
                    if (node.sources && node.sources.center) node.sources.center.color = v;
                    refreshHeroPreview();
                    ctx.saveState();
                    ctx.renderTimelineHUD();
                    ctx.requestLiveSync(60);
                },
                function (v) {
                    node.customColor = v;
                    if (node.sources && node.sources.center) node.sources.center.color = v;
                    ctx.saveState();
                    ctx.updateNodeCard(index);
                    ctx.renderTimelineHUD();
                    ctx.requestLiveSync(0);
                }
            );

            if (inModal) {
                var fillRow = document.createElement('div');
                fillRow.className = 'nc-prop-row';
                fillRow.innerHTML = '<span class="nc-prop-lbl"><i class="fa-solid fa-fill-drip"></i> التعبئة</span>';
                fillRow.appendChild(tgFill);
                cpWrapFill.classList.add('nc-swatch');
                fillRow.appendChild(cpWrapFill);
                propsContainer.appendChild(fillRow);
            } else {
                var cellFill = document.createElement('div');
                cellFill.className = 'field-cell';
                cellFill.innerHTML = '<span class="field-label"><i class="fa-solid fa-fill-drip"></i> التعبئة واللون</span>';
                var fillCombo = document.createElement('div');
                fillCombo.className = 'row-flex dual-fill-combo';
                fillCombo.appendChild(tgFill);
                fillCombo.appendChild(cpWrapFill);
                cellFill.appendChild(fillCombo);
                propsContainer.appendChild(cellFill);
            }

            var genAnchor = makeGuideTickCombo(node, curPropsShapeObj, 'إظهار خط سن يربط هذا الشكل بالمسار مباشرة', ensureNodeCustomized, index, ctx, !inModal, inModal);
            if (inModal) anchorSectionEl = genAnchor;
            else propsContainer.appendChild(genAnchor);
        }

        if (inModal && propsGroup) {
            propsGroup.appendChild(propsContainer);
            drawer.appendChild(propsGroup);

            if (anchorSectionEl) {
                var curAncKey = node.customAnchor || (curPropsShapeObj.defaultAnchor || 'center');
                var ancGroup = document.createElement('div');
                ancGroup.className = 'nc-studio-group';
                ancGroup.innerHTML =
                    '<div class="nc-group-title">' +
                        '<span class="nc-group-title-left"><i class="fa-solid fa-crosshairs"></i> الارتكاز والتوصيل بالمسار</span>' +
                        '<span class="nc-anchor-status">' + esc(ANCHOR_LABELS[curAncKey] || curAncKey) + '</span>' +
                    '</div>';
                ancGroup.appendChild(anchorSectionEl);
                drawer.appendChild(ancGroup);
            }
        } else {
            drawer.appendChild(propsContainer);
        }
        return drawer;
    }

    return {
        bindGlobalShapePopoverDismiss: bindGlobalShapePopoverDismiss,
        buildCardShapeDrawer: buildCardShapeDrawer,
        revertNodeCustomization: revertNodeCustomization
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_CARD_SHAPE_DRAWER;
}

