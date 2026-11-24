/* =============================================================================
   TIME RULER PRO — client/js/app.js
   Application Coordinator & Lifecycle Orchestrator (Modular Architecture)
   ========================================================================== */

(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var state = null;
    var pollTimer = null;

    function saveState() {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
            TIME_RULER_STATE_STORE.saveState(state);
        }
    }

    function renderAll() {
        if (typeof TIME_RULER_CARD_BUILDER !== 'undefined') {
            TIME_RULER_CARD_BUILDER.renderNodesList();
        }
        if (typeof TIME_RULER_TIMELINE_HUD !== 'undefined') {
            TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
        }
        if (typeof TIME_RULER_GLOBAL_CONTROLS !== 'undefined') {
            TIME_RULER_GLOBAL_CONTROLS.syncFormValues(state);
        }
    }

    function requestLiveSync(delay) {
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') {
            TIME_RULER_HOST_BRIDGE.requestLiveSync(state, delay);
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
                '<svg width="7" height="4" viewBox="0 0 8 5" fill="currentColor"><path d="M4 0L8 5H0L4 0Z"/></svg>' +
                '</button>' +
                '<button type="button" class="prop-spin-btn prop-spin-down" tabindex="-1" title="إنقاص">' +
                '<svg width="7" height="4" viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0H8L4 5Z"/></svg>' +
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
        // Toggle All Cards
        var btnToggleAll = $('btn-toggle-all');
        if (btnToggleAll) {
            btnToggleAll.addEventListener('click', function () {
                var allCollapsed = state.nodes.every(function (n) { return n.isCollapsed; });
                state.nodes.forEach(function (n) { n.isCollapsed = !allCollapsed; });
                saveState();
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
                saveState();
                TIME_RULER_HOST_BRIDGE.setFeedback(state.liveSync ? 'تم تفعيل المزامنة الفورية' : 'المزامنة الفورية متوقفة', state.liveSync ? 'ok' : '');
                if (state.liveSync) requestLiveSync(0);
            });
        }

        // Presets Cards & Popover
        document.querySelectorAll('.preset-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var preset = card.dataset.preset;
                if (preset) {
                    TIME_RULER_BATCH_IMPORTER.applyPreset(preset, state, function (p) {
                        saveState();
                        renderAll();
                        TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, false, true, function (ok) {
                            if (ok) TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق وبناء قالب: ' + (p.name || preset), 'ok');
                        });
                    });
                    document.querySelectorAll('.preset-card').forEach(function (c) { c.classList.remove('active'); });
                    card.classList.add('active');
                }
            });
        });

        var btnPresetsMenu = $('btn-presets-menu');
        var popPresetsMenu = $('presets-popover-menu');
        if (btnPresetsMenu && popPresetsMenu) {
            btnPresetsMenu.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = (popPresetsMenu.style.display !== 'none');
                popPresetsMenu.style.display = isOpen ? 'none' : 'block';
            });
            document.addEventListener('click', function (e) {
                if (!e.target.closest('.presets-popover-wrapper')) {
                    popPresetsMenu.style.display = 'none';
                }
            });
        }

        document.querySelectorAll('.preset-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (popPresetsMenu) popPresetsMenu.style.display = 'none';
                TIME_RULER_BATCH_IMPORTER.applyPreset(btn.dataset.preset, state, function (p) {
                    saveState();
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
                    saveState();
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

    function initKeyInterests() {
        try {
            if (window.__adobe_cep__ && typeof CSInterface !== 'undefined') {
                var cs = new CSInterface();
                var interests = [
                    { keyCode: 32 }, { keyCode: 8 }, { keyCode: 46 }, { keyCode: 13 },
                    { keyCode: 27 }, { keyCode: 37 }, { keyCode: 38 }, { keyCode: 39 },
                    { keyCode: 40 }, { keyCode: 65, ctrlKey: true }, { keyCode: 67, ctrlKey: true },
                    { keyCode: 86, ctrlKey: true }, { keyCode: 88, ctrlKey: true }, { keyCode: 90, ctrlKey: true }
                ];
                cs.registerKeyEventsInterest(JSON.stringify(interests));
            }
        } catch (eKey) {}
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
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
        var btnToolbar = $('btn-open-presets-subbar');
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
                customList.innerHTML = '<div style="font-size: 11px; color: var(--text-dim); text-align: center; padding: 16px 8px; border: 1px dashed var(--border-subtle); border-radius: 6px;">لا توجد قوالب مخصصة محفوظة بعد.<br>احفظ تشكيلة خطك الزمني الحالي لتظهر هنا وتستخدمها في أي وقت.</div>';
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
                    '    <span style="font-size: 9px; color: #10b981; background: rgba(16,185,129,0.12); padding: 1px 5px; border-radius: 10px;">' + nodeCount + ' محطات</span>' +
                    '  </div>' +
                    '  <div style="font-size: 9px; color: var(--text-dim); margin-top: 2px;">' + dateStr + '</div>' +
                    '</div>' +
                    '<div style="display: flex; gap: 4px; flex-shrink: 0;">' +
                    '  <button type="button" class="ab ab-p btn-apply-custom" data-id="' + tpl.id + '" style="width: auto; padding: 3px 8px; font-size: 10px;"><i class="fa-solid fa-check"></i> تطبيق</button>' +
                    '  <button type="button" class="btn-tool btn-export-single" data-id="' + tpl.id + '" title="تصدير JSON" style="width: 24px; height: 24px; padding: 0;"><i class="fa-solid fa-download"></i></button>' +
                    '  <button type="button" class="btn-tool btn-delete-custom" data-id="' + tpl.id + '" title="حذف القالب" style="width: 24px; height: 24px; padding: 0; color: #ef4444;"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>';
                customList.appendChild(item);
            });

            // Bind actions inside list
            customList.querySelectorAll('.btn-apply-custom').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.dataset.id;
                    TIME_RULER_BATCH_IMPORTER.applyUserTemplate(id, state, function (tpl) {
                        saveState();
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
                    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
                        TIME_RULER_STATE_STORE.deleteUserTemplate(id);
                        renderCustomTemplates();
                        TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم حذف القالب', 'ok');
                    }
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
        if (btnToolbar) btnToolbar.addEventListener('click', openModal);
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
                    saveState();
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
                    alert('يرجى كتابة اسم للقالب أولاً.');
                    inpSaveName.focus();
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
                    alert(res.message || 'فشل حفظ القالب');
                }
            });
        }

        // Export All Templates
        if (btnExportAll) {
            btnExportAll.addEventListener('click', function () {
                var list = TIME_RULER_STATE_STORE.getUserTemplates();
                if (list.length === 0) {
                    alert('لا توجد قوالب مخصصة محفوظة لتصديرها.');
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
                        alert('الملف المحدد ليس ملف JSON صالحاً: ' + String(err));
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

        initTabs();
        initCollapsibles();
        initPropValSpinners();
        bindEvents();
        initPresetsModal();

        TIME_RULER_SHAPES_ENGINE.initSvgImporterModal(state, function () {
            saveState();
            renderAll();
            requestLiveSync(0);
        });

        TIME_RULER_SHAPES_ENGINE.initGlobalShapeDropdown(state, {
            onUpdate: function () {
                saveState();
                renderAll();
                requestLiveSync(0);
            }
        });

        TIME_RULER_BATCH_IMPORTER.initBatchImporter(state, function (count) {
            saveState();
            renderAll();
            requestLiveSync(0);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم استيراد ' + count + ' محطة بنجاح!', 'ok');
        });

        TIME_RULER_BATCH_IMPORTER.initColorPalettes(state, function (key) {
            saveState();
            renderAll();
            requestLiveSync(0);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق لوحة الألوان: ' + key.toUpperCase(), 'ok');
        });

        TIME_RULER_TIMELINE_HUD.initHUDInteractions(state, function (newOri) {
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تغيير اتجاه المسار إلى: ' + (newOri === 'horizontal' ? 'أفقي ↔' : 'عمودي ↕'), 'ok');
            requestLiveSync(0);
        }, function (idx) {
            var n = state.nodes[idx];
            var num = n ? (n.number || (idx + 1)) : (idx + 1);
            TIME_RULER_HOST_BRIDGE.setFeedback('✓ الانتقال إلى محطة #' + num + ': ' + (n ? (n.title || '') : ''), 'ok');
        });

        TIME_RULER_TIMELINE_HUD.initScrubbing(state, function (prop, val) {
            requestLiveSync(40);
        }, function (prop) {
            requestLiveSync(0);
        });

        TIME_RULER_GLOBAL_CONTROLS.bindAllGlobalControls(state, {
            onUpdate: function (delay, needsRerender) {
                saveState();
                TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
                if (needsRerender) {
                    TIME_RULER_CARD_BUILDER.renderNodesList();
                }
                requestLiveSync(delay);
            }
        });

        renderAll();

        TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(true);
        window.addEventListener('resize', function () {
            TIME_RULER_TIMELINE_HUD.renderTimelineHUD(state);
        });

        initKeyInterests();

        if (typeof TIME_RULER_MOGRT_EXPORTER !== 'undefined') {
            TIME_RULER_MOGRT_EXPORTER.init();
        }

        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(function () {
            TIME_RULER_HOST_BRIDGE.safeUpdateCompStatus(false);
        }, 5000);
    }

    window.TIME_RULER_APP = {
        getState: function () { return state; },
        saveState: saveState,
        renderNodesList: function () { TIME_RULER_CARD_BUILDER.renderNodesList(); },
        executeHostGenerate: function (isLive, force, cb) { TIME_RULER_HOST_BRIDGE.executeHostGenerate(state, isLive, force, cb); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
