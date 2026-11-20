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
        bindEvents();

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
