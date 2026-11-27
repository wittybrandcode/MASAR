/**
 * MASAR PRO — client/js/modules/card-builder.js
 * Node Card Coordinator, List Management & Drag-Drop Reordering
 * Delegates UI tabs, styling controls, and shape drawer to card-stream-controls.js,
 * card-source-tabs.js, and card-shape-drawer.js.
 */

var TIME_RULER_CARD_BUILDER = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var openDrawerIndex = -1;
    var modalEventsBound = false;
    var state = null;

    function syncState() {
        state = (window.TR_APP && window.TR_APP.state)
            ? window.TR_APP.state
            : (window.state || (typeof TIME_RULER_STATE_STORE !== 'undefined' ? TIME_RULER_STATE_STORE.getDefaultState() : {}));
        return state;
    }

    function saveState(opts) { syncState(); if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.saveState(state, false, opts); }
    function renderTimelineHUD() { syncState(); if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state); }
    function requestLiveSync(delay, dirtyScope) { syncState(); if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') TIME_RULER_HOST_BRIDGE.requestLiveSync(state, delay, dirtyScope); }
    function setFeedback(msg, type) { if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') TIME_RULER_HOST_BRIDGE.setFeedback(msg, type); }
    function selectNode(index) { syncState(); if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') TIME_RULER_TIMELINE_HUD.selectNode(index, state); }
    function openSvgImporterModal(index) { syncState(); if (typeof TIME_RULER_SHAPES_ENGINE !== 'undefined') TIME_RULER_SHAPES_ENGINE.openSvgImporterModal(index, state); }
    function setupSmartListTextarea(ta, cb) { if (typeof TIME_RULER_BATCH_IMPORTER !== 'undefined') TIME_RULER_BATCH_IMPORTER.setupSmartListTextarea(ta, cb); }
    function setupAutoGrowTextarea(ta, cb) { if (typeof TIME_RULER_BATCH_IMPORTER !== 'undefined') TIME_RULER_BATCH_IMPORTER.setupAutoGrowTextarea(ta, cb); }
    function normalizeNodeSources(node, index) { if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.normalizeNodeSources(node, index); }
    function syncLegacyNodeFields(node, index) { if (typeof TIME_RULER_STATE_STORE !== 'undefined') TIME_RULER_STATE_STORE.syncLegacyNodeFields(node, index); }
    function sanitizeSvgName(s) { return (typeof TIME_RULER_SHAPES_ENGINE !== 'undefined') ? TIME_RULER_SHAPES_ENGINE.sanitizeSvgName(s) : (s || ''); }
    function escapeHtml(str) {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined' && typeof TIME_RULER_STATE_STORE.escapeHtml === 'function') return TIME_RULER_STATE_STORE.escapeHtml(str);
        return (str === null || str === undefined) ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function getStreamControls() { return (typeof TIME_RULER_CARD_STREAM_CONTROLS !== 'undefined') ? TIME_RULER_CARD_STREAM_CONTROLS : null; }
    function getShapeDrawer() { return (typeof TIME_RULER_CARD_SHAPE_DRAWER !== 'undefined') ? TIME_RULER_CARD_SHAPE_DRAWER : null; }
    function getSourceTabs() { return (typeof TIME_RULER_CARD_SOURCE_TABS !== 'undefined') ? TIME_RULER_CARD_SOURCE_TABS : null; }

    function createStreamStylingBar(streamLabel, streamTagClass, streamObj, propPrefix, defaults, onUpdate) {
        var mod = getStreamControls();
        return mod ? mod.createStreamStylingBar(streamLabel, streamTagClass, streamObj, propPrefix, defaults, onUpdate) : document.createElement('div');
    }

    function createStreamBoxDrawer(streamLabel, streamObj, propPrefix, defaults, onUpdate) {
        var mod = getStreamControls();
        return mod ? mod.createStreamBoxDrawer(streamLabel, streamObj, propPrefix, defaults, onUpdate, escapeHtml) : null;
    }

    function buildDepsContext() {
        return {
            saveState: saveState,
            renderNodesList: renderNodesList,
            updateNodeCard: updateNodeCard,
            toggleCardDrawer: toggleCardDrawer,
            renderTimelineHUD: renderTimelineHUD,
            requestLiveSync: requestLiveSync,
            setFeedback: setFeedback,
            selectNode: selectNode,
            openSvgImporterModal: openSvgImporterModal,
            setupSmartListTextarea: setupSmartListTextarea,
            setupAutoGrowTextarea: setupAutoGrowTextarea,
            normalizeNodeSources: normalizeNodeSources,
            syncLegacyNodeFields: syncLegacyNodeFields,
            sanitizeSvgName: sanitizeSvgName,
            escapeHtml: escapeHtml,
            toStandardDigits: (typeof toStandardDigits === 'function')
                ? toStandardDigits
                : (typeof TIME_RULER_STATE_STORE !== 'undefined' && TIME_RULER_STATE_STORE.toStandardDigits)
        };
    }

    function getNodeCustomizationMeta(node) {
        var curGlobalObj = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(state.nodeShape) : { id: 'circle', name: 'دائرة' };
        var curGlobalShapeName = curGlobalObj.name;
        var hasCustomShape = (node.customShape && node.customShape !== 'inherit');
        var isCustomized = Boolean(
            hasCustomShape ||
            (node.customColor && node.customColor.length > 0) ||
            (node.customStroke && node.customStroke.length > 0) ||
            (node.customSize && parseFloat(node.customSize) > 0) ||
            node.isHollow === true ||
            node.hasGuideTick === true ||
            (node.customAnchor && node.customAnchor !== 'center')
        );
        var curShapeObj = hasCustomShape
            ? ((typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(node.customShape) : { id: node.customShape, name: node.customShape })
            : curGlobalObj;
        return {
            curGlobalObj: curGlobalObj,
            curGlobalShapeName: curGlobalShapeName,
            hasCustomShape: hasCustomShape,
            isCustomized: isCustomized,
            curShapeObj: curShapeObj
        };
    }

    function hasCustomizeModalDOM() {
        return Boolean($('modal-node-customize') && $('node-customize-modal-body'));
    }

    function setCustomizeIndex(nextIdx) {
        openDrawerIndex = nextIdx;
        if (nextIdx >= 0) selectNode(nextIdx);
        syncNodeCustomizeModal();
    }

    function bindCustomizeModalEvents() {
        if (modalEventsBound) return;
        var modal = $('modal-node-customize');
        if (!modal) return;
        modalEventsBound = true;
        var closeFn = function () { setCustomizeIndex(-1); };
        if ($('btn-close-node-cust-modal')) $('btn-close-node-cust-modal').addEventListener('click', closeFn);
        if ($('nc-modal-done')) $('nc-modal-done').addEventListener('click', closeFn);
        modal.addEventListener('click', function (e) { if (e.target === modal) closeFn(); });
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('keydown', function (e) {
                if ((e.key === 'Escape' || e.keyCode === 27) && modal.style.display === 'flex') {
                    var topOpen = ['modal-system-dialog', 'modal-color-picker', 'modal-svg-importer'].some(function (id) {
                        var el = $(id);
                        return el && el.style && el.style.display === 'flex';
                    });
                    if (!topOpen) closeFn();
                }
            });
        }
        if ($('nc-modal-prev')) {
            $('nc-modal-prev').addEventListener('click', function () {
                syncState();
                if (openDrawerIndex > 0) setCustomizeIndex(openDrawerIndex - 1);
            });
        }
        if ($('nc-modal-next')) {
            $('nc-modal-next').addEventListener('click', function () {
                syncState();
                if (state.nodes && openDrawerIndex >= 0 && openDrawerIndex < state.nodes.length - 1) setCustomizeIndex(openDrawerIndex + 1);
            });
        }
    }

    function syncNodeCustomizeModal() {
        syncState();
        var modal = $('modal-node-customize'), modalBody = $('node-customize-modal-body');
        if (!modal || !modalBody) return false;
        bindCustomizeModalEvents();

        if (openDrawerIndex < 0 || !state.nodes || openDrawerIndex >= state.nodes.length) {
            openDrawerIndex = -1;
            modal.style.display = 'none';
            modalBody.innerHTML = '';
            return true;
        }
        var idx = openDrawerIndex, node = state.nodes[idx];
        normalizeNodeSources(node, idx);
        var meta = getNodeCustomizationMeta(node), ctx = buildDepsContext(), drawerMod = getShapeDrawer();

        if ($('nc-modal-badge')) $('nc-modal-badge').textContent = (idx < 9 ? '0' : '') + (idx + 1);
        if ($('nc-modal-title')) $('nc-modal-title').textContent = 'تخصيص العقدة #' + (idx + 1);
        if ($('nc-modal-sub')) $('nc-modal-sub').textContent = (node.sources && node.sources.front && node.sources.front.title) || node.title || 'الشكل والأبعاد والارتكاز';

        var btnRev = $('nc-modal-btn-revert'), inhBadge = $('nc-modal-inherit-badge');
        if (btnRev && btnRev.classList) {
            btnRev.classList.toggle('u-hidden', !meta.isCustomized);
            btnRev.onclick = function () { if (drawerMod && drawerMod.revertNodeCustomization) drawerMod.revertNodeCustomization(node, idx, ctx); };
        }
        if (inhBadge && inhBadge.classList) inhBadge.classList.toggle('u-hidden', meta.isCustomized);
        if ($('nc-modal-prev')) $('nc-modal-prev').disabled = (idx <= 0);
        if ($('nc-modal-next')) $('nc-modal-next').disabled = (idx >= state.nodes.length - 1);

        modalBody.innerHTML = '';
        if (drawerMod) {
            modalBody.appendChild(drawerMod.buildCardShapeDrawer({
                node: node, index: idx, state: state, inModal: true, ctx: ctx,
                curGlobalObj: meta.curGlobalObj, curGlobalShapeName: meta.curGlobalShapeName, isCustomized: meta.isCustomized
            }));
        }
        modal.style.display = 'flex';
        return true;
    }

    function updateNodeCard(index) {
        syncState();
        var container = $('nodes-container');
        if (!container || !state.nodes || index < 0 || index >= state.nodes.length) return;
        var oldCard = container.querySelector('.node-card[data-node-index="' + index + '"]');
        if (!oldCard) {
            renderNodesList();
            return;
        }
        var newCard = buildNodeCard(state.nodes[index], index, state.nodes.length);
        container.replaceChild(newCard, oldCard);
        if (hasCustomizeModalDOM() && openDrawerIndex === index) {
            syncNodeCustomizeModal();
        }
    }

    function toggleCardDrawer(index) {
        if (hasCustomizeModalDOM()) {
            var prev = openDrawerIndex;
            openDrawerIndex = (prev === index) ? -1 : index;
            if (openDrawerIndex !== -1) selectNode(openDrawerIndex);
            syncNodeCustomizeModal();
            return;
        }
        var prevInline = openDrawerIndex;
        openDrawerIndex = (prevInline === index) ? -1 : index;
        if (prevInline !== -1 && prevInline !== index) {
            updateNodeCard(prevInline);
        }
        updateNodeCard(index);
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

        var frag = document.createDocumentFragment();
        state.nodes.forEach(function (node, index) {
            frag.appendChild(buildNodeCard(node, index, nLen));
        });
        container.appendChild(frag);
        if (container && savedScrollTop) container.scrollTop = savedScrollTop;
        if (hasCustomizeModalDOM() && openDrawerIndex !== -1) {
            syncNodeCustomizeModal();
        }
    }

    function buildNodeCard(node, index, nLen) {
        var card = document.createElement('div');
        var isSel = (index === (state.selectedNodeIndex || 0));
        card.className = 'node-card' + (isSel ? ' node-card--selected selected' : '');
        card.dataset.nodeIndex = String(index);

        card.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (btn && (btn.classList.contains('btn-node-act') || btn.classList.contains('node-btn-del') || btn.classList.contains('node-btn-dup') || btn.classList.contains('node-btn-up') || btn.classList.contains('node-btn-down'))) {
                return;
            }
            selectNode(index);
        });

        card.addEventListener('dragstart', function (e) {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                e.preventDefault();
                return;
            }
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

        normalizeNodeSources(node, index);

        var meta = getNodeCustomizationMeta(node);
        var curGlobalObj = meta.curGlobalObj;
        var curGlobalShapeName = meta.curGlobalShapeName;
        var hasCustomShape = meta.hasCustomShape;
        var isCustomized = meta.isCustomized;
        var curShapeObj = meta.curShapeObj;

        var centerTypeNow = (node.sources && node.sources.center && node.sources.center.type) || 'shape_number';
        var centerDrawsShape = (centerTypeNow === 'shape_number' || centerTypeNow === 'shape' || centerTypeNow === 'shape_icon');
        var pillText = !centerDrawsShape ? 'بلا شكل' : (hasCustomShape ? curShapeObj.name : 'تخصيص');
        var pillThumb = (typeof TR_SVG_SHAPES !== 'undefined')
            ? TR_SVG_SHAPES.getSvgMarkup(curShapeObj.id, (node.customColor || 'currentColor'), 13)
            : '<i class="fa-solid fa-circle"></i>';

        var btnShapePill = document.createElement('button');
        btnShapePill.type = 'button';
        btnShapePill.className = 'node-shape-pill btn-node-cust-icon'
            + (isCustomized && centerDrawsShape ? ' node-shape-pill--custom' : '')
            + (!centerDrawsShape ? ' node-shape-pill--no-shape' : '');
        btnShapePill.title = !centerDrawsShape
            ? 'الشكل الهندسي معطل في وضع المركز الحالي — انقر لتفعيله أو تعديل العقدة'
            : ('تخصيص العقدة (الشكل، الحجم، اللون، الارتكاز) — الحالي: ' + (hasCustomShape ? curShapeObj.name : ('عام: ' + curGlobalShapeName)));

        var pillInner = '<span class="pill-thumb">' + pillThumb + '</span><span class="pill-btn-text">' + escapeHtml(pillText) + '</span>';
        if (isCustomized && (node.customColor || node.customStroke)) {
            var dotCol = node.customColor || node.customStroke;
            pillInner += '<span class="pill-color-dot" style="background:' + escapeHtml(dotCol) + '"></span>';
        }
        pillInner += '<i class="fa-solid fa-sliders pill-edit-ico"></i>';
        btnShapePill.innerHTML = pillInner;

        // 1. Card Master Header
        var masterHeader = document.createElement('div');
        masterHeader.className = 'node-card-master-header';

        var headerRight = document.createElement('div');
        headerRight.className = 'node-header-right';

        var btnUp = document.createElement('button');
        btnUp.type = 'button';
        btnUp.className = 'btn-node-act btn-node-move';
        btnUp.title = 'تحريك العقدة لأعلى';
        btnUp.disabled = (index === 0);
        btnUp.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        btnUp.addEventListener('click', function (e) {
            e.stopPropagation();
            moveNode(index, index - 1);
        });

        var btnDown = document.createElement('button');
        btnDown.type = 'button';
        btnDown.className = 'btn-node-act btn-node-move';
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
            saveState({ skipHistory: true });
            updateNodeCard(index);
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
        var isHoriz = (state.orientation === 'horizontal');
        var curNodeSide = node.contentSide || 'inherit';
        btnFlip.title = (curNodeSide === 'inherit')
            ? 'جهة التموضع: يتبع العام (انقر للتبديل)'
            : ('جهة التموضع: ' + (curNodeSide === 'left' ? 'يسار المسار' : (curNodeSide === 'right' ? 'يمين المسار' : (curNodeSide === 'top' ? 'أعلى المسار' : 'أسفل المسار'))));
        var sideIcon = (curNodeSide === 'right') ? 'ph-bold ph-arrow-right'
            : ((curNodeSide === 'left') ? 'ph-bold ph-arrow-left'
            : ((curNodeSide === 'top') ? 'ph-bold ph-arrow-up'
            : ((curNodeSide === 'bottom') ? 'ph-bold ph-arrow-down'
            : (isHoriz ? 'ph-bold ph-arrows-down-up' : 'ph-bold ph-arrows-left-right'))));
        btnFlip.innerHTML = '<i class="' + sideIcon + '"></i>';
        if (curNodeSide !== 'inherit') btnFlip.classList.add('active');
        btnFlip.addEventListener('click', function (e) {
            e.stopPropagation();
            var cur = node.contentSide || 'inherit';
            if (state.orientation === 'horizontal') {
                var effGlobalH = (state.contentSide === 'bottom') ? 'bottom' : 'top';
                node.contentSide = (cur === 'inherit') ? (effGlobalH === 'top' ? 'bottom' : 'top') : (cur === 'top' ? 'bottom' : 'inherit');
            } else {
                var effGlobalV = (state.contentSide === 'right') ? 'right' : 'left';
                node.contentSide = (cur === 'inherit') ? (effGlobalV === 'left' ? 'right' : 'left') : (cur === 'left' ? 'right' : 'inherit');
            }
            saveState();
            updateNodeCard(index);
            renderTimelineHUD();
            requestLiveSync(0);
        });

        headerLeft.appendChild(btnCollapse);
        headerLeft.appendChild(btnFlip);
        headerLeft.appendChild(btnDup);
        headerLeft.appendChild(btnDel);

        var activeSourceTab = node.activeSourceTab || 'front';
        var headerTabs = document.createElement('div');
        headerTabs.className = 'node-header-tabs';

        var tabDefs = [
            {
                key: 'center',
                title: 'مركز العقدة (على مسار الخط الزمني)',
                isActive: (activeSourceTab === 'center'),
                isInactive: (node.sources.center.type === 'none'),
                svg: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><rect x="6" y="6" width="8" height="8" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="#141414"/></svg>'
            },
            {
                key: 'front',
                title: isHoriz ? 'المحتوى الأساسي (فوق / تحت المسار)' : 'المحتوى الأساسي (يمين / يسار المسار)',
                isActive: (activeSourceTab === 'front'),
                isInactive: (!node.sources.front.visible || node.sources.front.type === 'none'),
                svg: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><line x1="2" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><line x1="10" y1="15" x2="10" y2="9" stroke="currentColor" stroke-width="1.5"/><rect x="3.5" y="3" width="13" height="6" fill="currentColor"/></svg>'
            },
            {
                key: 'behind',
                title: 'الوسم المقابل (الجهة العكسية على المسار)',
                isActive: (activeSourceTab === 'behind'),
                isInactive: (!node.sources.behind.visible || node.sources.behind.type === 'none'),
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
                saveState({ skipHistory: true });
                updateNodeCard(index);
            });
            headerTabs.appendChild(btnTab);
        });

        if (!node.isCollapsed) headerRight.appendChild(headerTabs);
        masterHeader.appendChild(headerRight);
        masterHeader.appendChild(headerLeft);
        card.appendChild(masterHeader);

        // 2. Source Tab Content Pod (Lazy when collapsed)
        var ctx = buildDepsContext();
        var tabsMod = getSourceTabs();
        var streamCtrl = getStreamControls();
        if (!node.isCollapsed && tabsMod) {
            var tabContent = document.createElement('div');
            tabContent.className = 'node-source-tab-content';

            if (activeSourceTab === 'center') {
                tabsMod.buildCenterSourceTab({
                    tabContent: tabContent,
                    card: card,
                    node: node,
                    index: index,
                    state: state,
                    curShapeObj: curShapeObj,
                    curGlobalObj: curGlobalObj,
                    curGlobalShapeName: curGlobalShapeName,
                    hasCustomShape: hasCustomShape,
                    isCustomized: isCustomized,
                    ctx: ctx,
                    streamControls: streamCtrl
                });
            } else if (activeSourceTab === 'front' || activeSourceTab === 'behind') {
                tabsMod.buildStreamSourceTab({
                    tabContent: tabContent,
                    node: node,
                    index: index,
                    state: state,
                    streamName: activeSourceTab,
                    ctx: ctx,
                    streamControls: streamCtrl
                });
            }
            card.appendChild(tabContent);
        }

        // 3. Individual Shape Customization Drawer (Inline fallback when modal DOM absent)
        var drawerMod = getShapeDrawer();
        if (!hasCustomizeModalDOM() && openDrawerIndex === index && drawerMod) {
            card.appendChild(drawerMod.buildCardShapeDrawer({
                node: node,
                index: index,
                state: state,
                curGlobalObj: curGlobalObj,
                curGlobalShapeName: curGlobalShapeName,
                isCustomized: isCustomized,
                ctx: ctx
            }));
        }

        btnShapePill.addEventListener('click', function () {
            toggleCardDrawer(index);
        });

        return card;
    }

    function moveNode(fromIdx, toIdx) {
        syncState();
        if (toIdx < 0 || toIdx >= state.nodes.length) return;
        var item = state.nodes.splice(fromIdx, 1)[0];
        state.nodes.splice(toIdx, 0, item);
        state.selectedNodeIndex = toIdx;
        if (openDrawerIndex === fromIdx) {
            openDrawerIndex = toIdx;
        } else if (openDrawerIndex !== -1) {
            if (fromIdx < openDrawerIndex && toIdx >= openDrawerIndex) openDrawerIndex--;
            else if (fromIdx > openDrawerIndex && toIdx <= openDrawerIndex) openDrawerIndex++;
        }
        saveState({ label: 'نقل عقدة', coalesceMs: 0 });
        renderNodesList();
        requestLiveSync(0);
    }

    function duplicateNode(index) {
        syncState();
        var orig = state.nodes[index];
        normalizeNodeSources(orig, index);
        var clone = {
            id: 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            number: orig.number ? (orig.number + '+') : '',
            title: orig.title ? (orig.title + ' (نسخة)') : '',
            description: orig.description || '',
            contentSide: orig.contentSide || 'inherit',
            activeSourceTab: orig.activeSourceTab || 'front',
            customShape: orig.customShape || 'inherit',
            customAnchor: orig.customAnchor || null,
            customColor: orig.customColor || '',
            customTextColor: orig.customTextColor || '',
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
        if (clone.sources && clone.sources.center) {
            clone.sources.center.shape = clone.customShape;
        }
        if (clone.sources && clone.sources.front && clone.sources.front.title) {
            clone.sources.front.title = clone.sources.front.title + ' (نسخة)';
        }
        syncLegacyNodeFields(clone, index + 1);
        state.nodes.splice(index + 1, 0, clone);
        state.selectedNodeIndex = index + 1;
        if (openDrawerIndex !== -1) openDrawerIndex = index + 1;
        saveState({ label: 'تكرار عقدة', coalesceMs: 0 });
        renderNodesList();
        requestLiveSync(0);
    }

    function deleteNode(index) {
        syncState();
        if (state.nodes.length <= 2) return;
        state.nodes.splice(index, 1);
        if (openDrawerIndex === index) openDrawerIndex = -1;
        else if (openDrawerIndex > index) openDrawerIndex--;
        if (state.selectedNodeIndex >= state.nodes.length) state.selectedNodeIndex = Math.max(0, state.nodes.length - 1);
        saveState({ label: 'حذف عقدة', coalesceMs: 0 });
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
                center: { type: 'shape_number', shape: 'inherit', value: nextNum, visible: true, color: '' },
                front: { type: 'title_text', title: 'عنوان ' + nextIdx, text: 'شرح وتفاصيل المرحلة ' + nextIdx, items: [], number: '', visible: true },
                behind: { type: 'none', title: '', text: '', number: '', items: [], visible: false }
            }
        };
        state.nodes.push(newNode);
        saveState({ label: 'إضافة عقدة', coalesceMs: 0 });
        renderNodesList();
        renderTimelineHUD();
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined' && TIME_RULER_HOST_BRIDGE.hasRulerInComp()) {
            TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, false);
        }
        var cont = $('nodes-container');
        if (cont) cont.scrollTop = cont.scrollHeight;
        setFeedback('✓ تمت إضافة العقدة #' + nextIdx + ' بنجاح', 'ok');
    }

    function harvestActiveInputs() {
        syncState();
        var tabsMod = getSourceTabs();
        if (tabsMod && typeof tabsMod.harvestActiveInputs === 'function') {
            tabsMod.harvestActiveInputs(state, $('nodes-container'), buildDepsContext());
        }
    }

    function reverseNodesOrder() {
        syncState();
        if (!state.nodes || state.nodes.length <= 1) {
            setFeedback('⚠️ يلزم وجود عقدتين على الأقل لعكس الترتيب', 'warn');
            return;
        }
        harvestActiveInputs();
        state.nodes.forEach(function (node, idx) { normalizeNodeSources(node, idx); });

        var reversedNodes = [];
        for (var i = state.nodes.length - 1; i >= 0; i--) {
            reversedNodes.push(JSON.parse(JSON.stringify(state.nodes[i])));
        }
        state.nodes = reversedNodes;

        if (openDrawerIndex >= 0 && openDrawerIndex < state.nodes.length) {
            openDrawerIndex = (state.nodes.length - 1) - openDrawerIndex;
        }
        if (state.selectedNodeIndex >= 0 && state.selectedNodeIndex < state.nodes.length) {
            state.selectedNodeIndex = (state.nodes.length - 1) - state.selectedNodeIndex;
        }

        state.sortOrder = (state.sortOrder === 'desc') ? 'asc' : 'desc';
        saveState({ label: 'عكس ترتيب العقد', coalesceMs: 0 });
        renderNodesList();
        renderTimelineHUD();
        updateReverseButtonUI();

        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined' && TIME_RULER_HOST_BRIDGE.executeHostGenerate) {
            TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, true, false, function () {
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

        if (icon) icon.className = isDesc ? 'ph-bold ph-sort-descending' : 'ph-bold ph-sort-ascending';
        if (txt) txt.textContent = isDesc ? 'تنازلي' : 'قلب الترتيب';
        btn.title = isDesc ? 'الترتيب الحالي: تنازلي (انقر للقلب إلى تصاعدي)' : 'عكس ترتيب العقد (تصاعدي ↔ تنازلي)';
        btn.classList.toggle('active', isDesc);
    }

    return {
        createStreamStylingBar: createStreamStylingBar,
        createStreamBoxDrawer: createStreamBoxDrawer,
        renderNodesList: renderNodesList,
        updateNodeCard: updateNodeCard,
        buildNodeCard: buildNodeCard,
        moveNode: moveNode,
        duplicateNode: duplicateNode,
        deleteNode: deleteNode,
        addNode: addNode,
        reverseNodesOrder: reverseNodesOrder,
        updateReverseButtonUI: updateReverseButtonUI,
        harvestActiveInputs: harvestActiveInputs,
        syncStateFromDOM: harvestActiveInputs,
        getOpenDrawerIndex: function () { return openDrawerIndex; },
        setOpenDrawerIndex: function (idx) { openDrawerIndex = idx; },
        syncNodeCustomizeModal: syncNodeCustomizeModal,
        syncState: syncState
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_CARD_BUILDER;
}
