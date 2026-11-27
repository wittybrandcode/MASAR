/* =============================================================================
   TIME RULER PRO — client/js/app.js
   Application Coordinator & Lifecycle Orchestrator (Modular Architecture)
   ========================================================================== */

(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var state = null;
    var pollTimer = null;
    var _keysBound = false;

    function saveState(immediate, opts) {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
            TIME_RULER_STATE_STORE.saveState(state, immediate, opts);
        }
    }

    function updateHistoryUI(info) {
        if (!info && typeof TIME_RULER_STATE_STORE !== 'undefined' && typeof TIME_RULER_STATE_STORE.getHistoryInfo === 'function') {
            info = TIME_RULER_STATE_STORE.getHistoryInfo();
        }
        if (!info) return;
        var btnUndo = $('btn-undo');
        var btnRedo = $('btn-redo');
        if (btnUndo) {
            btnUndo.disabled = !info.canUndo;
            btnUndo.title = info.canUndo ? ('تراجع (Ctrl+Z): ' + (info.undoLabel || 'تعديل')) : 'تراجع (Ctrl+Z)';
        }
        if (btnRedo) {
            btnRedo.disabled = !info.canRedo;
            btnRedo.title = info.canRedo ? ('إعادة (Ctrl+Y): ' + (info.redoLabel || 'تعديل')) : 'إعادة (Ctrl+Y)';
        }
    }

    function performUndo() {
        if (typeof TIME_RULER_STATE_STORE === 'undefined' || typeof TIME_RULER_STATE_STORE.undoState !== 'function') return false;
        var res = TIME_RULER_STATE_STORE.undoState(state);
        if (!res || !res.ok) return false;
        renderAll();
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') {
            TIME_RULER_HOST_BRIDGE.setFeedback('↶ تم التراجع: ' + (res.label || 'تعديل'), 'ok');
        }
        requestLiveSync(0);
        return true;
    }

    function performRedo() {
        if (typeof TIME_RULER_STATE_STORE === 'undefined' || typeof TIME_RULER_STATE_STORE.redoState !== 'function') return false;
        var res = TIME_RULER_STATE_STORE.redoState(state);
        if (!res || !res.ok) return false;
        renderAll();
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') {
            TIME_RULER_HOST_BRIDGE.setFeedback('↷ تمت الإعادة: ' + (res.label || 'تعديل'), 'ok');
        }
        requestLiveSync(0);
        return true;
    }

    function renderAll() {
        if (typeof TIME_RULER_CARD_BUILDER !== 'undefined') {
            TIME_RULER_CARD_BUILDER.renderNodesList();
            if (typeof TIME_RULER_CARD_BUILDER.updateReverseButtonUI === 'function') {
                TIME_RULER_CARD_BUILDER.updateReverseButtonUI();
            }
        }
        if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') {
            TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
        }
        if (typeof TIME_RULER_GLOBAL_CONTROLS !== 'undefined') {
            TIME_RULER_GLOBAL_CONTROLS.syncFormValues(state);
        }
    }

    function requestLiveSync(delay, dirtyScope) {
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') {
            TIME_RULER_HOST_BRIDGE.requestLiveSync(state, delay, dirtyScope);
        }
    }

    function initTabs() {
        var tabsBar = $('main-tabs');
        if (!tabsBar) return;

        function switchTab(tabName) {
            var targetTabBtn = tabsBar.querySelector('.tab[data-tab="' + tabName + '"]');
            var targetPanel = $('panel-' + tabName);
            if (!targetTabBtn || !targetPanel) {
                targetTabBtn = tabsBar.querySelector('.tab[data-tab="nodes"]');
                targetPanel = $('panel-nodes');
                tabName = 'nodes';
            }
            if (!targetTabBtn || !targetPanel) return;

            tabsBar.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
            document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });

            targetTabBtn.classList.add('active');
            targetPanel.classList.add('active');
            try {
                localStorage.setItem('TIME_RULER_ACTIVE_TAB', tabName);
            } catch (e) {}
        }

        tabsBar.addEventListener('click', function (e) {
            var btn = e.target.closest('.tab');
            if (!btn || !btn.dataset.tab) return;
            switchTab(btn.dataset.tab);
        });

        var savedTab = 'nodes';
        try {
            savedTab = localStorage.getItem('TIME_RULER_ACTIVE_TAB') || 'nodes';
            if (savedTab === 'track' || savedTab === 'shapes' || savedTab === 'typography' || savedTab === 'presets') {
                savedTab = 'controls';
            } else if (savedTab !== 'nodes' && savedTab !== 'controls') {
                savedTab = 'nodes';
            }
        } catch (e) {}
        switchTab(savedTab);
    }

    function initCollapsibles() {
        document.querySelectorAll('.flat-section-header').forEach(function (hdr) {
            hdr.addEventListener('click', function () {
                var sec = hdr.closest('.flat-section');
                if (sec) sec.classList.toggle('collapsed');
            });
        });

        document.querySelectorAll('.collapsible-header').forEach(function (hdr) {
            hdr.addEventListener('click', function () {
                var isCollapsed = hdr.classList.toggle('collapsed');
                var content = hdr.nextElementSibling;
                if (content && content.classList.contains('collapsible-content')) {
                    content.classList.toggle('collapsed', isCollapsed);
                }
            });
        });

        document.querySelectorAll('.soga-box').forEach(function (box) {
            var foldBtn = box.querySelector('.box-fold-btn');
            if (foldBtn) {
                foldBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    box.classList.toggle('collapsed');
                });
            }
        });
    }

    function initPropValSpinners() {
        document.querySelectorAll('.prop-val-box').forEach(function (box) {
            if (box.querySelector('.prop-spin-btns')) return;
            var inp = box.querySelector('input[type="number"]');
            if (!inp) return;

            var spinWrap = document.createElement('div');
            spinWrap.className = 'prop-spin-btns';
            spinWrap.innerHTML =
                '<button type="button" class="prop-spin-btn prop-spin-up" tabindex="-1" title="زيادة">' +
                '<svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4L4 1L7 4"/></svg>' +
                '</button>' +
                '<button type="button" class="prop-spin-btn prop-spin-down" tabindex="-1" title="إنقاص">' +
                '<svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1L4 4L7 1"/></svg>' +
                '</button>';
            box.appendChild(spinWrap);

            var upBtn = spinWrap.querySelector('.prop-spin-up');
            var downBtn = spinWrap.querySelector('.prop-spin-down');

            function doStep(direction) {
                var step = parseFloat(inp.step) || 1;
                var val = parseFloat(inp.value) || 0;
                var min = inp.min !== '' ? parseFloat(inp.min) : -Infinity;
                var max = inp.max !== '' ? parseFloat(inp.max) : Infinity;
                var stepStr = inp.getAttribute('step') || '';
                var decimals = (stepStr.indexOf('.') !== -1) ? stepStr.split('.')[1].length : 0;

                var newVal;
                if (direction > 0) {
                    newVal = Math.min(max, val + step);
                } else {
                    newVal = Math.max(min, val - step);
                }

                if (decimals > 0) {
                    inp.value = newVal.toFixed(decimals);
                } else {
                    inp.value = Math.round(newVal);
                }

                inp.dispatchEvent(new Event('input', { bubbles: true }));
                inp.dispatchEvent(new Event('change', { bubbles: true }));
            }

            function attachHold(btn, dir) {
                var holdTimer = null;
                var repeatInterval = null;
                function clearHold() {
                    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
                    if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null; }
                }
                btn.addEventListener('mousedown', function (e) {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    doStep(dir);
                    clearHold();
                    holdTimer = setTimeout(function () {
                        repeatInterval = setInterval(function () { doStep(dir); }, 50);
                    }, 280);
                });
                btn.addEventListener('mouseup', clearHold);
                btn.addEventListener('mouseleave', clearHold);
            }

            attachHold(upBtn, 1);
            attachHold(downBtn, -1);

            // Wheel scrub on prop-val-box for swift adjustments
            box.addEventListener('wheel', function (e) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    doStep(1);
                } else {
                    doStep(-1);
                }
            }, { passive: false });
        });
    }

    window.initPropValSpinners = initPropValSpinners;

    function bindEvents() {
        // Undo / Redo History Toolbar Buttons
        var btnUndo = $('btn-undo');
        if (btnUndo) {
            btnUndo.addEventListener('click', function () {
                performUndo();
            });
        }
        var btnRedo = $('btn-redo');
        if (btnRedo) {
            btnRedo.addEventListener('click', function () {
                performRedo();
            });
        }

        // Toggle All Cards
        var btnToggleAll = $('btn-toggle-all');
        if (btnToggleAll) {
            btnToggleAll.addEventListener('click', function () {
                var allCollapsed = state.nodes.every(function (n) { return n.isCollapsed; });
                state.nodes.forEach(function (n) { n.isCollapsed = !allCollapsed; });
                saveState(false, { skipHistory: true });
                if (typeof TIME_RULER_CARD_BUILDER !== 'undefined') {
                    TIME_RULER_CARD_BUILDER.renderNodesList();
                }
            });
        }

        // Live Sync Toggle
        var btnLive = $('btn-live-sync');
        if (btnLive) {
            btnLive.addEventListener('click', function () {
                state.liveSync = !state.liveSync;
                btnLive.classList.toggle('active', state.liveSync);
                saveState(false, { skipHistory: true });
                TIME_RULER_HOST_BRIDGE.setFeedback(state.liveSync ? 'تم تفعيل المزامنة الفورية' : 'المزامنة الفورية متوقفة', state.liveSync ? 'ok' : '');
                if (state.liveSync) requestLiveSync(0);
            });
        }

        // Inline Quick Presets Chips
        document.querySelectorAll('.preset-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                TIME_RULER_BATCH_IMPORTER.applyPreset(btn.dataset.preset, state, function (p) {
                    saveState(false, { label: 'تطبيق قالب', coalesceMs: 0 });
                    renderAll();
                    TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, true, function (ok) {
                        if (ok) TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق وبناء قالب: ' + (p.name || btn.dataset.preset), 'ok');
                    });
                });
            });
        });

        document.querySelectorAll('.pattern-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                TIME_RULER_BATCH_IMPORTER.applyQuickPattern(btn.dataset.pattern, state, function () {
                    saveState(false, { label: 'ترقيم تلقائي', coalesceMs: 0 });
                    renderAll();
                    requestLiveSync(0);
                });
            });
        });

        // Add & Reverse Nodes
        var btnAdd = $('btn-add-node');
        if (btnAdd) {
            btnAdd.addEventListener('click', function () {
                TIME_RULER_CARD_BUILDER.addNode();
            });
        }

        var btnRev = $('btn-reverse-nodes');
        if (btnRev) {
            btnRev.addEventListener('click', function () {
                TIME_RULER_CARD_BUILDER.reverseNodesOrder();
            });
        }

        // Global Digit Normalizer: Eastern Arabic / Hindi -> 0-9
        document.addEventListener('input', function (e) {
            var target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                if (/[\u0660-\u0669\u06F0-\u06F9]/.test(target.value)) {
                    var start = target.selectionStart;
                    var end = target.selectionEnd;
                    target.value = TIME_RULER_STATE_STORE.toStandardDigits(target.value);
                    if (start !== null && end !== null) {
                        try { target.setSelectionRange(start, end); } catch (err) {}
                    }
                }
            }
        }, true);

        // Telemetry Status click
        var pill = $('status-pill');
        if (pill) pill.addEventListener('click', function () { TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(true); });
        window.addEventListener('focus', function () { TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(false); });

        var btnSyncComp = $('btn-sync-from-comp');
        if (btnSyncComp) {
            btnSyncComp.addEventListener('click', function () {
                btnSyncComp.disabled = true;
                TIME_RULER_HOST_BRIDGE.readCompState(function (env) {
                    btnSyncComp.disabled = false;
                    if (env && env.ok && env.data && env.data.state) {
                        var applied = TIME_RULER_HOST_BRIDGE.applyCompStateToPanel(state, env.data.state, {
                            source: env.data.source,
                            stateHash: env.data.stateHash
                        });
                        if (applied) {
                            renderAll();
                            var srcMsg = (env.data.source === 'comment')
                                ? '✓ تمت مزامنة اللوحة من الكومبوزيشن بنجاح'
                                : '✓ تم استنتاج واستيراد العقد من الكومبوزيشن بنجاح';
                            TIME_RULER_HOST_BRIDGE.setFeedback(srcMsg, 'ok');
                            return;
                        }
                    }
                    TIME_RULER_HOST_BRIDGE.setFeedback('⚠️ تعذر قراءة حالة المسار من الكومبوزيشن', 'warn');
                });
            });
        }

        // Master Generation Buttons
        var btnGen = $('btn-generate');
        if (btnGen) {
            btnGen.addEventListener('click', function () {
                if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
                    try { TIME_RULER_CARD_BUILDER.syncStateFromDOM(); } catch (eSync) {}
                }
                btnGen.disabled = true;
                TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, false, function () {
                    btnGen.disabled = false;
                });
            });
        }

        var btnRebuild = $('btn-rebuild');
        if (btnRebuild) {
            btnRebuild.addEventListener('click', function () {
                if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
                    try { TIME_RULER_CARD_BUILDER.syncStateFromDOM(); } catch (eSync) {}
                }
                btnRebuild.disabled = true;
                TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, true, function () {
                    btnRebuild.disabled = false;
                });
            });
        }
    }

    function isEditableTextFocus(target) {
        if (!target) return false;
        var tag = (target.tagName || '').toUpperCase();
        if (tag === 'TEXTAREA' || target.isContentEditable) return true;
        if (tag === 'INPUT') {
            var tp = (target.type || 'text').toLowerCase();
            return (
                tp === 'text' || tp === 'number' || tp === 'search' ||
                tp === 'url' || tp === 'tel' || tp === 'email' || tp === 'password'
            );
        }
        return false;
    }

    function initKeyInterests() {
        try {
            if (window.__adobe_cep__ && typeof CSInterface !== 'undefined') {
                var cs = new CSInterface();
                var interests = [
                    { keyCode: 32 }, { keyCode: 8 }, { keyCode: 46 }, { keyCode: 13 },
                    { keyCode: 27 }, { keyCode: 37 }, { keyCode: 38 }, { keyCode: 39 },
                    { keyCode: 40 },
                    { keyCode: 65, ctrlKey: true }, { keyCode: 67, ctrlKey: true },
                    { keyCode: 86, ctrlKey: true }, { keyCode: 88, ctrlKey: true },
                    { keyCode: 89, ctrlKey: true }, { keyCode: 90, ctrlKey: true },
                    { keyCode: 90, ctrlKey: true, shiftKey: true },
                    { keyCode: 89, metaKey: true }, { keyCode: 90, metaKey: true },
                    { keyCode: 90, metaKey: true, shiftKey: true }
                ];
                cs.registerKeyEventsInterest(JSON.stringify(interests));
            }
        } catch (eKey) {}

        if (!_keysBound) {
            _keysBound = true;
            document.addEventListener('keydown', function (e) {
                if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
                if (isEditableTextFocus(e.target || document.activeElement)) return;

                var k = (e.key || '').toLowerCase();
                var isUndo = ((k === 'z' || e.keyCode === 90) && !e.shiftKey);
                var isRedo = (((k === 'y' || e.keyCode === 89) && !e.shiftKey) || ((k === 'z' || e.keyCode === 90) && e.shiftKey));

                if (isUndo) {
                    if (performUndo()) e.preventDefault();
                } else if (isRedo) {
                    if (performRedo()) e.preventDefault();
                }
            });
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function downloadJSON(filename, data) {
        var jsonStr = JSON.stringify(data, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function initPresetsModal() {
        var modal = $('modal-presets');
        var btnHeader = $('btn-header-presets');
        var btnClose = $('btn-close-presets-modal');
        var tabBuiltin = $('tab-presets-builtin');
        var tabCustom = $('tab-presets-custom');
        var viewBuiltin = $('view-presets-builtin');
        var viewCustom = $('view-presets-custom');
        var customCount = $('txt-custom-tpl-count');
        var customList = $('custom-templates-list');
        var btnSaveCurrent = $('btn-save-current-as-template');
        var inpSaveName = $('inp-save-template-name');
        var btnExportAll = $('btn-export-all-templates');
        var fileImport = $('file-import-template');

        function updateCustomCount() {
            if (!customCount) return;
            var list = TIME_RULER_STATE_STORE.getUserTemplates();
            customCount.textContent = list.length;
        }

        function renderCustomTemplates() {
            if (!customList) return;
            var list = TIME_RULER_STATE_STORE.getUserTemplates();
            updateCustomCount();
            if (list.length === 0) {
                customList.innerHTML = '<div style="font-size: 11px; color: var(--text-dim); text-align: center; padding: 16px 8px; border: 1px dashed var(--border-subtle); border-radius: 0px;">لا توجد قوالب مخصصة محفوظة بعد.<br>احفظ تشكيلة خطك الزمني الحالي لتظهر هنا وتستخدمها في أي وقت.</div>';
                return;
            }
            customList.innerHTML = '';
            list.forEach(function (tpl) {
                var item = document.createElement('div');
                item.className = 'custom-tpl-item';
                var dateStr = '';
                try {
                    var d = new Date(tpl.createdAt);
                    dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    dateStr = '';
                }
                var nodeCount = (tpl.state && Array.isArray(tpl.state.nodes)) ? tpl.state.nodes.length : 0;

                item.innerHTML =
                    '<div style="flex: 1; overflow: hidden;">' +
                    '  <div style="display: flex; align-items: center; gap: 6px;">' +
                    '    <span style="font-weight: 700; font-size: 11px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(tpl.name) + '</span>' +
                    '    <span style="font-size: 9px; color: #10b981; background: rgba(16,185,129,0.12); padding: 1px 5px; border-radius: 0px;">' + nodeCount + ' محطات</span>' +
                    '  </div>' +
                    '  <div style="font-size: 9px; color: var(--text-dim); margin-top: 2px;">' + escapeHtml(dateStr) + '</div>' +
                    '</div>' +
                    '<div style="display: flex; gap: 4px; flex-shrink: 0;">' +
                    '  <button type="button" class="ab ab-p btn-apply-custom" data-id="' + escapeHtml(tpl.id) + '" style="width: auto; padding: 3px 8px; font-size: 10px;"><i class="fa-solid fa-check"></i> تطبيق</button>' +
                    '  <button type="button" class="btn-tool btn-export-single" data-id="' + escapeHtml(tpl.id) + '" title="تصدير JSON" style="width: 24px; height: 24px; padding: 0;"><i class="fa-solid fa-download"></i></button>' +
                    '  <button type="button" class="btn-tool btn-delete-custom" data-id="' + escapeHtml(tpl.id) + '" title="حذف القالب" style="width: 24px; height: 24px; padding: 0; color: #ef4444;"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>';
                customList.appendChild(item);
            });

            // Bind actions inside list
            customList.querySelectorAll('.btn-apply-custom').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.dataset.id;
                    TIME_RULER_BATCH_IMPORTER.applyUserTemplate(id, state, function (tpl) {
                        saveState(false, { label: 'تطبيق قالب مخصص', coalesceMs: 0 });
                        renderAll();
                        TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, true, function (ok) {
                            if (ok) TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق وبناء القالب المخصص: ' + tpl.name, 'ok');
                        });
                        closeModal();
                    });
                });
            });

            customList.querySelectorAll('.btn-export-single').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.dataset.id;
                    var list = TIME_RULER_STATE_STORE.getUserTemplates();
                    var found = null;
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].id === id) { found = list[i]; break; }
                    }
                    if (!found) return;
                    downloadJSON(found.name.replace(/\s+/g, '_') + '.json', found);
                });
            });

            customList.querySelectorAll('.btn-delete-custom').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.dataset.id;
                    TIME_RULER_UI_DIALOG.showConfirm('حذف قالب مخصص', 'هل أنت متأكد من حذف هذا القالب؟', function () {
                        TIME_RULER_STATE_STORE.deleteUserTemplate(id);
                        renderCustomTemplates();
                        TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم حذف القالب', 'ok');
                    });
                });
            });
        }

        function openModal() {
            if (!modal) return;
            modal.style.display = 'flex';
            updateCustomCount();
            renderCustomTemplates();
        }

        function closeModal() {
            if (!modal) return;
            modal.style.display = 'none';
        }

        if (btnHeader) btnHeader.addEventListener('click', openModal);
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });
        }

        // Subtabs
        if (tabBuiltin && tabCustom) {
            tabBuiltin.addEventListener('click', function () {
                tabBuiltin.classList.add('active');
                tabCustom.classList.remove('active');
                if (viewBuiltin) viewBuiltin.style.display = 'flex';
                if (viewCustom) viewCustom.style.display = 'none';
            });
            tabCustom.addEventListener('click', function () {
                tabCustom.classList.add('active');
                tabBuiltin.classList.remove('active');
                if (viewBuiltin) viewBuiltin.style.display = 'none';
                if (viewCustom) viewCustom.style.display = 'flex';
                renderCustomTemplates();
            });
        }

        // Apply Builtin Presets in Modal
        document.querySelectorAll('.btn-apply-builtin').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var pKey = btn.dataset.preset;
                TIME_RULER_BATCH_IMPORTER.applyPreset(pKey, state, function (p) {
                    saveState(false, { label: 'تطبيق قالب', coalesceMs: 0 });
                    renderAll();
                    TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, true, function (ok) {
                        if (ok) TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق وبناء قالب: ' + (p.name || pKey), 'ok');
                    });
                    closeModal();
                });
            });
        });

        // Save Current Work as Template
        if (btnSaveCurrent && inpSaveName) {
            btnSaveCurrent.addEventListener('click', function () {
                var name = inpSaveName.value.trim();
                if (!name) {
                    TIME_RULER_UI_DIALOG.showAlert('اسم القالب مطلوب', 'يرجى كتابة اسم للقالب أولاً.', 'warn', function () {
                        inpSaveName.focus();
                    });
                    return;
                }
                if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
                    TIME_RULER_CARD_BUILDER.syncStateFromDOM();
                }
                var res = TIME_RULER_STATE_STORE.saveUserTemplate(name, state);
                if (res.ok) {
                    inpSaveName.value = '';
                    renderCustomTemplates();
                    TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم حفظ القالب المخصص: ' + name, 'ok');
                } else {
                    TIME_RULER_UI_DIALOG.showAlert('تعذر حفظ القالب', res.message || 'فشل حفظ القالب', 'error');
                }
            });
        }

        // Export All Templates
        if (btnExportAll) {
            btnExportAll.addEventListener('click', function () {
                var list = TIME_RULER_STATE_STORE.getUserTemplates();
                if (list.length === 0) {
                    TIME_RULER_UI_DIALOG.showAlert('تصدير القوالب', 'لا توجد قوالب مخصصة محفوظة لتصديرها.', 'info');
                    return;
                }
                downloadJSON('masar_custom_templates.json', list);
            });
        }

        // Import Template JSON
        if (fileImport) {
            fileImport.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        var parsed = JSON.parse(evt.target.result);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(function (item) { TIME_RULER_STATE_STORE.importUserTemplate(item); });
                        } else {
                            TIME_RULER_STATE_STORE.importUserTemplate(parsed);
                        }
                        renderCustomTemplates();
                        TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم استيراد القالب بنجاح!', 'ok');
                    } catch (err) {
                        TIME_RULER_UI_DIALOG.showAlert('خطأ في الاستيراد', 'الملف المحدد ليس ملف JSON صالحاً: ' + String(err), 'error');
                    }
                    fileImport.value = '';
                };
                reader.readAsText(file);
            });
        }

        updateCustomCount();
    }

    function init() {
        state = TIME_RULER_STATE_STORE.getState();

        window.state = state;
        window.toStandardDigits = TIME_RULER_STATE_STORE.toStandardDigits;
        window.saveState = saveState;
        window.requestLiveSync = requestLiveSync;
        window.renderNodesList = function () { TIME_RULER_CARD_BUILDER.renderNodesList(); };
        window.renderTimelineHUD = function () { TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state); };
        window.executeHostGenerate = function (isLive, force, cb) { TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, isLive, force, cb); };
        window.syncFormValues = function () { TIME_RULER_GLOBAL_CONTROLS.syncFormValues(state); };

        window.TR_APP = {
            state: state,
            toStandardDigits: TIME_RULER_STATE_STORE.toStandardDigits,
            saveState: saveState,
            undo: performUndo,
            redo: performRedo,
            renderNodesList: window.renderNodesList,
            renderTimelineHUD: window.renderTimelineHUD,
            syncFormValues: window.syncFormValues,
            requestLiveSync: requestLiveSync,
            selectNode: function (idx) { TIME_RULER_TIMELINE_HUD.selectNode(idx, state); },
            reverseNodesOrder: function () { TIME_RULER_CARD_BUILDER.reverseNodesOrder(); },
            safeUpdateCompStatus: TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus,
            applyPreset: function (k) { TIME_RULER_BATCH_IMPORTER.applyPreset(k, state, renderAll); },
            executeHostGenerate: window.executeHostGenerate
        };

        if (typeof TIME_RULER_BRIDGE !== 'undefined') {
            TIME_RULER_BRIDGE.init();
        }

        if (typeof TIME_RULER_STATE_STORE !== 'undefined' && typeof TIME_RULER_STATE_STORE.onHistoryChange === 'function') {
            TIME_RULER_STATE_STORE.onHistoryChange(updateHistoryUI);
        }

        initTabs();
        initCollapsibles();
        initPropValSpinners();
        bindEvents();
        initPresetsModal();

        TIME_RULER_SHAPES_ENGINE.initSvgImporterModal(state, function () {
            saveState(false, { label: 'استيراد شكل SVG', coalesceMs: 0 });
            renderAll();
            requestLiveSync(0);
        });

        TIME_RULER_SHAPES_ENGINE.initGlobalShapeDropdown(state, {
            onUpdate: function () {
                saveState(false, { label: 'تغيير الشكل العام', coalesceMs: 0 });
                renderAll();
                requestLiveSync(0);
            }
        });

        TIME_RULER_BATCH_IMPORTER.initBatchImporter(state, function (count) {
            saveState(false, { label: 'استيراد دفعي', coalesceMs: 0 });
            renderAll();
            requestLiveSync(0);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم استيراد ' + count + ' محطة بنجاح!', 'ok');
        });

        TIME_RULER_BATCH_IMPORTER.initColorPalettes(state, function (key) {
            saveState(false, { label: 'تغيير لوحة الألوان', coalesceMs: 0 });
            renderAll();
            requestLiveSync(0);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق لوحة الألوان: ' + key.toUpperCase(), 'ok');
        });

        TIME_RULER_TIMELINE_HUD.initHUDInteractions(state, function (newOri) {
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تغيير اتجاه المسار إلى: ' + (newOri === 'horizontal' ? 'أفقي ↔' : 'عمودي ↕'), 'ok');
            if (typeof TIME_RULER_CARD_BUILDER !== 'undefined') TIME_RULER_CARD_BUILDER.renderNodesList();
            requestLiveSync(0);
        }, function (idx) {
            var n = state.nodes[idx];
            var num = n ? (n.number || (idx + 1)) : (idx + 1);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ الانتقال إلى محطة #' + num + ': ' + (n ? (n.title || '') : ''), 'ok');
        });

        var CTRL_SCRUB_PROPS = { topOffset: 1, bottomOffset: 1, lineWidth: 1, lineOpacity: 1, boxPaddingH: 1, boxPaddingV: 1 };
        TIME_RULER_TIMELINE_HUD.initScrubbing(state, function (prop, val) {
            requestLiveSync(40, CTRL_SCRUB_PROPS[prop] ? 'ctrl' : undefined);
        }, function (prop) {
            requestLiveSync(0, CTRL_SCRUB_PROPS[prop] ? 'ctrl' : undefined);
        });

        TIME_RULER_GLOBAL_CONTROLS.bindAllGlobalControls(state, {
            onUpdate: function (delay, needsRerender, scope) {
                saveState();
                TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
                if (needsRerender) {
                    TIME_RULER_CARD_BUILDER.renderNodesList();
                }
                requestLiveSync(delay, scope);
            }
        });

        renderAll();
        updateHistoryUI();

        TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(true);
        window.addEventListener('resize', function () {
            TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
        });
        window.addEventListener('beforeunload', function () {
            saveState(true, { skipHistory: true });
        });
        window.addEventListener('blur', function () {
            saveState(true, { skipHistory: true });
        });
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(false);
            }
        });

        initKeyInterests();

        if (typeof TIME_RULER_MOGRT_EXPORTER !== 'undefined') {
            TIME_RULER_MOGRT_EXPORTER.init();
        }

        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(function () {
            if (typeof document === 'undefined' || !document.hidden) {
                TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(false);
            }
        }, 5000);
    }

    window.TIME_RULER_APP = {
        getState: function () { return state; },
        saveState: saveState,
        undo: performUndo,
        redo: performRedo,
        renderNodesList: function () { TIME_RULER_CARD_BUILDER.renderNodesList(); },
        executeHostGenerate: function (isLive, force, cb) { TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, isLive, force, cb); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
