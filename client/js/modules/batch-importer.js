/**
 * TIME RULER PRO — client/js/modules/batch-importer.js
 * Batch Content Importer, Outline Parsing, Smart Textareas & Preset Applicators
 */

var TIME_RULER_BATCH_IMPORTER = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var MOTION_PALETTES = {
        cyber: { lineColor: '#00f0ff', circleFill: '#00f0ff', circleStroke: '#ffffff', numberColor: '#ec4899', titleColor: '#ffffff', descColor: '#94a3b8' },
        gold: { lineColor: '#f59e0b', circleFill: '#f59e0b', circleStroke: '#ffffff', numberColor: '#f59e0b', titleColor: '#ffffff', descColor: '#d1d5db' },
        tech: { lineColor: '#10b981', circleFill: '#059669', circleStroke: '#10b981', numberColor: '#10b981', titleColor: '#ffffff', descColor: '#94a3b8' },
        emerald: { lineColor: '#10b981', circleFill: '#065f46', circleStroke: '#6ee7b7', numberColor: '#10b981', titleColor: '#ffffff', descColor: '#a7f3d0' },
        minimal: { lineColor: '#ffffff', circleFill: '#27272a', circleStroke: '#ffffff', numberColor: '#e4e4e7', titleColor: '#ffffff', descColor: '#a1a1aa' }
    };

    function setupAutoGrowTextarea(ta, onUpdate) {
        if (!ta) return;
        function autoGrow() {
            ta.style.height = 'auto';
            var scrollH = ta.scrollHeight;
            var newH = Math.max(26, Math.min(scrollH, 120));
            ta.style.height = newH + 'px';
            ta.style.overflowY = (scrollH > 120) ? 'auto' : 'hidden';
        }
        ta.addEventListener('input', function () {
            autoGrow();
            if (typeof onUpdate === 'function') onUpdate(ta.value);
        });
        setTimeout(autoGrow, 0);
    }

    function setupSmartListTextarea(ta, onUpdate) {
        if (!ta) return;
        ta.classList.add('textarea--smart-list');
        function autoGrow() {
            ta.style.height = 'auto';
            var scrollH = ta.scrollHeight;
            var newH = Math.max(38, Math.min(scrollH, 150));
            ta.style.height = newH + 'px';
            ta.style.overflowY = (scrollH > 150) ? 'auto' : 'hidden';
        }

        ta.addEventListener('input', function () {
            autoGrow();
            if (typeof onUpdate === 'function') onUpdate(ta.value);
        });

        ta.addEventListener('focus', function () {
            if (!ta.value || ta.value.trim().length === 0) {
                ta.value = '• ';
                autoGrow();
                if (typeof onUpdate === 'function') onUpdate(ta.value);
            }
        });

        ta.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var start = ta.selectionStart;
                var end = ta.selectionEnd;
                var val = ta.value;
                var insert = '\n• ';
                ta.value = val.substring(0, start) + insert + val.substring(end);
                ta.selectionStart = ta.selectionEnd = start + insert.length;
                autoGrow();
                if (typeof onUpdate === 'function') onUpdate(ta.value);
            } else if (e.key === 'Backspace') {
                var curPos = ta.selectionStart;
                var valBefore = ta.value.substring(0, curPos);
                if (valBefore.endsWith('• ')) {
                    e.preventDefault();
                    ta.value = ta.value.substring(0, curPos - 2) + ta.value.substring(curPos);
                    ta.selectionStart = ta.selectionEnd = curPos - 2;
                    autoGrow();
                    if (typeof onUpdate === 'function') onUpdate(ta.value);
                }
            }
        });

        setTimeout(autoGrow, 0);
    }

    function initBatchImporter(state, onComplete) {
        var modal = $('modal-batch-import');
        var btnOpen = $('btn-open-batch-import');
        var btnClose = $('btn-close-batch-modal');
        var btnCancel = $('btn-cancel-batch-modal');
        var btnApply = $('btn-apply-batch-import');
        var segMode = $('seg-batch-mode');
        var txtArea = $('txt-batch-import');

        if (!modal) return;
        var mode = 'replace';

        function openModal() {
            modal.classList.add('u-visible-flex');
            modal.style.display = 'flex';
            if (txtArea) txtArea.focus();
        }

        function closeModal() {
            modal.classList.remove('u-visible-flex');
            modal.style.display = 'none';
        }

        if (btnOpen) btnOpen.addEventListener('click', openModal);
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });

        if (segMode) {
            segMode.addEventListener('click', function (e) {
                var b = e.target.closest('button[data-mode]');
                if (!b) return;
                mode = b.dataset.mode;
                segMode.querySelectorAll('button[data-mode]').forEach(function (btn) {
                    btn.classList.toggle('active', btn === b);
                });
            });
        }

        if (btnApply && txtArea) {
            btnApply.addEventListener('click', function () {
                var raw = txtArea.value.trim();
                if (!raw) {
                    closeModal();
                    return;
                }

                var lines = raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
                if (lines.length === 0) {
                    closeModal();
                    return;
                }

                var newNodes = [];
                lines.forEach(function (line, idx) {
                    var num = (idx < 9 ? '0' : '') + (idx + 1);
                    var title = '';
                    var desc = '';
                    var behindText = '';
                    var hasBehind = false;

                    if (line.indexOf('|') !== -1) {
                        var parts = line.split('|').map(function (p) { return p.trim(); });
                        if (parts.length >= 3) {
                            num = parts[0];
                            title = parts[1];
                            behindText = parts.slice(2).join(' | ');
                            hasBehind = true;
                        } else if (parts.length === 2) {
                            title = parts[0];
                            desc = parts[1];
                        }
                    } else if (line.indexOf(' - ') !== -1) {
                        var parts = line.split(' - ').map(function (p) { return p.trim(); });
                        title = parts[0];
                        desc = parts.slice(1).join(' - ');
                    } else {
                        title = line;
                    }

                    var importedNode = {
                        number: num,
                        title: title,
                        description: desc,
                        customShape: 'inherit',
                        customColor: '',
                        customSize: null,
                        customStroke: '',
                        customStrokeWidth: null,
                        isHollow: false,
                        hasGuideTick: false,
                        isCollapsed: false,
                        sources: {
                            center: {
                                type: 'shape_number',
                                shape: 'inherit',
                                value: num,
                                visible: true,
                                color: ''
                            },
                            front: {
                                type: desc ? 'title_text' : 'title',
                                title: title,
                                text: desc,
                                items: [],
                                number: '',
                                visible: true
                            },
                            behind: {
                                type: hasBehind ? 'number_text' : 'none',
                                title: '',
                                text: behindText,
                                number: hasBehind ? (behindText.indexOf(':') !== -1 ? behindText.split(':')[0].trim() : '') : '',
                                items: [],
                                visible: hasBehind
                            }
                        }
                    };
                    newNodes.push(importedNode);
                });

                if (mode === 'replace') {
                    state.nodes = newNodes;
                } else {
                    state.nodes = state.nodes.concat(newNodes);
                }

                closeModal();
                if (typeof onComplete === 'function') {
                    onComplete(newNodes.length);
                }
            });
        }
    }

    function applyQuickPattern(pattern, state, onUpdate) {
        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;
        (state.nodes || []).forEach(function (node, idx) {
            if (store) store.normalizeNodeSources(node, idx);
            if (pattern === 'num-01') {
                var v = (idx < 9 ? '0' : '') + (idx + 1);
                node.number = v;
                if (node.sources && node.sources.center) node.sources.center.value = v;
            } else if (pattern === 'years') {
                var y = String(2024 + idx);
                node.number = y;
                if (node.sources && node.sources.center) node.sources.center.value = y;
                if (node.sources && node.sources.behind && node.sources.behind.visible) {
                    node.sources.behind.number = y;
                }
            } else if (pattern === 'phases') {
                var p = 'Phase ' + (idx + 1);
                node.number = p;
                if (node.sources && node.sources.center) node.sources.center.value = p;
            } else if (pattern === 'clear-num') {
                node.number = '';
                if (node.sources && node.sources.center) node.sources.center.value = '';
            }
        });
        if (typeof onUpdate === 'function') onUpdate();
    }

    function applyPreset(key, state, onUpdate) {
        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;
        var presets = store ? store.PRESETS : {};
        var p = presets[key];
        if (!p) return;

        for (var k in p) {
            if (p.hasOwnProperty(k) && k !== 'name' && k !== 'nodes') {
                state[k] = p[k];
            }
        }
        if (p.nodes && Array.isArray(p.nodes)) {
            state.nodes = JSON.parse(JSON.stringify(p.nodes));
        }
        state.selectedNodeIndex = 0;

        if (typeof onUpdate === 'function') onUpdate(p);
    }

    function applyUserTemplate(id, state, onUpdate) {
        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;
        if (!store) return;
        var list = store.getUserTemplates();
        var tpl = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { tpl = list[i]; break; }
        }
        if (!tpl || !tpl.state) return;
        var snap = tpl.state;
        for (var k in snap) {
            if (snap.hasOwnProperty(k) && k !== 'nodes') {
                state[k] = snap[k];
            }
        }
        if (snap.nodes && Array.isArray(snap.nodes)) {
            state.nodes = JSON.parse(JSON.stringify(snap.nodes));
        }
        state.selectedNodeIndex = 0;
        if (typeof onUpdate === 'function') onUpdate(tpl);
    }

    function initColorPalettes(state, onUpdate) {
        document.querySelectorAll('.palette-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var palKey = btn.dataset.palette;
                var pal = MOTION_PALETTES[palKey];
                if (!pal) return;

                for (var k in pal) {
                    if (pal.hasOwnProperty(k)) {
                        state[k] = pal[k];
                    }
                }
                if (typeof onUpdate === 'function') onUpdate(palKey);
            });
        });
    }

    return {
        setupAutoGrowTextarea: setupAutoGrowTextarea,
        setupSmartListTextarea: setupSmartListTextarea,
        initBatchImporter: initBatchImporter,
        applyQuickPattern: applyQuickPattern,
        applyPreset: applyPreset,
        applyUserTemplate: applyUserTemplate,
        initColorPalettes: initColorPalettes
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_BATCH_IMPORTER;
}

