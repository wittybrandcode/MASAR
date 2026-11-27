/**
 * TIME RULER PRO — client/js/modules/shapes-engine.js
 * SVG Shapes Library, Modal Manager & Interactive Vector Preview Engine
 */

var TIME_RULER_SHAPES_ENGINE = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var modalTargetNodeIndex = -1;
    var currentImportParsed = null;
    var currentImportAnchor = 'center';
    var currentImportHollow = false;
    var currentRawSvgContent = '';

    function sanitizeSvgName(str) {
        if (!str) return '';
        var s = String(str).trim()
            .replace(/\.svg$/i, '')
            .replace(/_24dp.*$/i, '')
            .replace(/_FILL.*$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim();
        if (s.toLowerCase() === 'radio button checked') return 'زر راديو دائري';
        if (s.toLowerCase() === 'toggle on') return 'مفتاح تشغيل';
        return s;
    }

    function initGlobalShapeDropdown(state, callbacks) {
        var grid = $('grid-global-shapes');
        var modal = $('modal-node-shapes');
        var trigger = $('btn-global-shape-trigger');
        if (!grid || !modal || !trigger || typeof TR_SVG_SHAPES === 'undefined') return;

        function updateModalPreview(shapeId) {
            var shMeta = TR_SVG_SHAPES.getShapeById(shapeId);
            var prevThumb = $('modal-preview-shape-thumb');
            var prevName = $('modal-preview-shape-name');
            if (prevThumb && shMeta) prevThumb.innerHTML = TR_SVG_SHAPES.getSvgMarkup(shMeta.id, 'currentColor', 20);
            if (prevName && shMeta) prevName.textContent = shMeta.name;
        }

        grid.innerHTML = '';
        var allShapes = TR_SVG_SHAPES.getAllShapes();

        allShapes.forEach(function (sh) {
            var tile = document.createElement('button');
            tile.type = 'button';
            tile.setAttribute('data-shape-id', sh.id);
            tile.className = 'shape-tile' + (state.nodeShape === sh.id ? ' active' : '');
            tile.title = sh.name + ' (' + sh.nameEn + ')';
            tile.innerHTML = 
                '<div class="shape-tile-icon">' + TR_SVG_SHAPES.getSvgMarkup(sh.id, 'currentColor', 24) + '</div>' +
                '<span class="shape-tile-label">' + escapeHtml(sh.name) + '</span>';

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
                    (state.nodes || []).forEach(function (n) {
                        if (n.customShape === sh.id) {
                            n.customShape = 'inherit';
                            if (n.sources && n.sources.center) n.sources.center.shape = 'inherit';
                        }
                    });
                    if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate();
                    initGlobalShapeDropdown(state, callbacks);
                });
                tile.appendChild(btnDel);
            }

            tile.addEventListener('click', function (e) {
                e.stopPropagation();
                state.nodeShape = sh.id;
                grid.querySelectorAll('.shape-tile').forEach(function (t) { t.classList.remove('active'); });
                tile.classList.add('active');
                updateModalPreview(sh.id);
                if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate();
            });
            grid.appendChild(tile);
        });

        var previousGlobalShape = state.nodeShape || 'circle';

        if (!trigger._wiredModal) {
            trigger._wiredModal = true;
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                previousGlobalShape = state.nodeShape || 'circle';
                modal.classList.add('u-visible-flex');
                modal.style.display = 'flex';
                updateModalPreview(state.nodeShape);
                grid.querySelectorAll('.shape-tile').forEach(function (tile) {
                    tile.classList.toggle('active', tile.getAttribute('data-shape-id') === state.nodeShape);
                });
            });
        }

        function closeModal() {
            modal.classList.remove('u-visible-flex');
            modal.style.display = 'none';
        }

        function cancelModal() {
            if (state.nodeShape !== previousGlobalShape) {
                state.nodeShape = previousGlobalShape;
                if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate();
            }
            closeModal();
        }

        var btnClose = $('btn-close-shapes-modal');
        var btnCancel = $('btn-cancel-shapes-modal');
        var btnAccept = $('btn-accept-shapes-modal');

        if (btnClose && !btnClose._wired) {
            btnClose._wired = true;
            btnClose.addEventListener('click', cancelModal);
        }
        if (btnCancel && !btnCancel._wired) {
            btnCancel._wired = true;
            btnCancel.addEventListener('click', cancelModal);
        }
        if (btnAccept && !btnAccept._wired) {
            btnAccept._wired = true;
            btnAccept.addEventListener('click', function () {
                closeModal();
                previousGlobalShape = state.nodeShape;
                if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate();
                if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined') {
                    var curShMeta = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(state.nodeShape) : null;
                    var sName = curShMeta ? curShMeta.name : state.nodeShape;
                    TIME_RULER_HOST_BRIDGE.setFeedback('✓ تم تطبيق نمط العقد العام: ' + sName, 'ok');
                }
            });
        }

        if (!modal._wiredOverlay) {
            modal._wiredOverlay = true;
            modal.addEventListener('click', function (e) {
                if (e.target === modal) cancelModal();
            });
        }

        var btnModalSvg = $('btn-modal-open-svg-import');
        if (btnModalSvg && !btnModalSvg._wired) {
            btnModalSvg._wired = true;
            btnModalSvg.addEventListener('click', function (e) {
                e.stopPropagation();
                closeModal();
                openSvgImporterModal(-1, state);
            });
        }
    }

    function openSvgImporterModal(targetNodeIdx, state) {
        modalTargetNodeIndex = (typeof targetNodeIdx === 'number') ? targetNodeIdx : -1;
        currentImportParsed = null;
        currentImportAnchor = 'center';
        currentImportHollow = false;
        currentRawSvgContent = '';

        var modal = $('modal-svg-importer');
        if (!modal) return;

        var inpName = $('inp-imported-name');
        if (inpName) inpName.value = '';

        var inpFile = $('inp-svg-file');
        if (inpFile) inpFile.value = '';

        var txtPaste = $('txt-svg-paste');
        if (txtPaste) txtPaste.value = '';

        var pasteBox = $('paste-textarea-box');
        if (pasteBox) pasteBox.style.display = 'none';

        var tabFile = $('btn-tab-src-file');
        var tabCode = $('btn-tab-src-code');
        var dropzone = $('svg-dropzone');
        if (tabFile && tabCode) {
            tabFile.classList.add('active');
            tabCode.classList.remove('active');
        }
        if (dropzone) dropzone.style.display = 'flex';
        if (pasteBox) pasteBox.style.display = 'none';

        var segModalMode = $('seg-modal-render-mode');
        if (segModalMode) {
            segModalMode.querySelectorAll('button[data-mode]').forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-mode') === 'solid');
            });
        }

        var btnConfirm = $('btn-accept-svg-modal');
        if (btnConfirm) btnConfirm.disabled = true;

        setModalAnchor('center');

        var layer = $('canvas-svg-layer');
        if (layer) {
            layer.innerHTML = '<div class="canvas-placeholder-msg"><i class="ph-bold ph-eye"></i></div>';
        }

        var stats = $('lbl-svg-sim-stats');
        if (stats) stats.textContent = '-';

        setModalStatus('اختر ملف SVG أو الصق الكود', '');

        modal.classList.add('u-visible-flex');
        modal.style.display = 'flex';
    }

    function closeSvgImporterModal() {
        var modal = $('modal-svg-importer');
        if (modal) {
            modal.classList.remove('u-visible-flex');
            modal.style.display = 'none';
        }
    }

    function setModalStatus(text, kind) {
        var el = $('modal-foot-status');
        var msg = $('txt-modal-foot-msg');
        if (!el || !msg) return;
        el.className = 'modal-foot-status' + (kind ? ' ' + kind : '');
        msg.textContent = text;
    }

    function setModalAnchor(anchorId) {
        currentImportAnchor = anchorId || 'center';
        var modalMatrix = $('modal-anchor-matrix');
        if (modalMatrix) {
            modalMatrix.querySelectorAll('button[data-anchor]').forEach(function (pt) {
                pt.classList.toggle('active', pt.getAttribute('data-anchor') === currentImportAnchor);
            });
        }
        updateLiveRulerSimulation();
    }

    function handleSvgLoaded(rawSvg, defaultName) {
        if (!rawSvg || !rawSvg.trim()) {
            setModalStatus('✕ المحتوى فارغ', 'err');
            return;
        }

        currentRawSvgContent = rawSvg;
        var res = TR_SVG_SHAPES.parseSvgString(rawSvg, { autoFit: true, padding: 26 });

        if (!res || !res.ok) {
            setModalStatus('✕ ' + (res ? res.error : 'تعذر تحليل SVG'), 'err');
            var btnConfirm = $('btn-accept-svg-modal');
            if (btnConfirm) btnConfirm.disabled = true;
            return;
        }

        currentImportParsed = res;

        var inpName = $('inp-imported-name');
        if (inpName && defaultName) {
            inpName.value = sanitizeSvgName(defaultName);
        }

        renderCanvasPreview();

        var stats = $('lbl-svg-sim-stats');
        if (stats && res.stats) {
            stats.textContent = res.stats.pathsCount + ' مسار · ' + res.stats.verticesCount + ' نقطة';
        }

        setModalStatus('✓ تم التحليل بنجاح (' + res.stats.verticesCount + ' نقطة)', 'ok');

        var btnConfirm = $('btn-accept-svg-modal');
        if (btnConfirm) btnConfirm.disabled = false;

        updateLiveRulerSimulation();
    }

    function renderCanvasPreview() {
        var layer = $('canvas-svg-layer');
        if (!layer || !currentImportParsed) return;

        var fillStyle = currentImportHollow ? 'none' : 'currentColor';
        var strokeStyle = currentImportHollow ? 'currentColor' : 'none';
        var strokeWidth = currentImportHollow ? '14' : '0';

        var aObj = (typeof TR_SVG_SHAPES !== 'undefined' && TR_SVG_SHAPES.ANCHORS[currentImportAnchor])
            ? TR_SVG_SHAPES.ANCHORS[currentImportAnchor]
            : { x: 128, y: 128 };
        var anchorDot = '<circle cx="' + aObj.x + '" cy="' + aObj.y + '" r="10" fill="#f59e0b" stroke="#0b1120" stroke-width="4" />';

        var svgHtml = '<svg viewBox="-16 -16 288 288" width="116" height="116" style="color: #10b981; fill: ' + fillStyle + '; stroke: ' + strokeStyle + '; stroke-width: ' + strokeWidth + '; display:block;">' +
            currentImportParsed.svgMarkup +
            anchorDot +
            '</svg>';

        layer.innerHTML = svgHtml;
    }

    function updateLiveRulerSimulation() {
        renderCanvasPreview();
    }

    function initSvgImporterModal(state, onShapeImported) {
        var modal = $('modal-svg-importer');
        if (!modal) return;

        var btnClose = $('btn-close-svg-modal');
        if (btnClose) btnClose.addEventListener('click', closeSvgImporterModal);

        var btnCancel = $('btn-cancel-svg-modal');
        if (btnCancel) btnCancel.addEventListener('click', closeSvgImporterModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeSvgImporterModal();
        });

        var dropzone = $('svg-dropzone');
        var inpFile = $('inp-svg-file');

        if (dropzone && inpFile) {
            dropzone.addEventListener('click', function () {
                inpFile.click();
            });

            dropzone.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');

                var files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    var file = files[0];
                    var defName = sanitizeSvgName(file.name);
                    var reader = new FileReader();
                    reader.onload = function (rev) {
                        handleSvgLoaded(rev.target.result, defName);
                    };
                    reader.readAsText(file);
                }
            });

            inpFile.addEventListener('change', function (e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var file = files[0];
                    var defName = sanitizeSvgName(file.name);
                    var reader = new FileReader();
                    reader.onload = function (rev) {
                        handleSvgLoaded(rev.target.result, defName);
                    };
                    reader.readAsText(file);
                }
            });
        }

        var tabFile = $('btn-tab-src-file');
        var tabCode = $('btn-tab-src-code');
        var pasteBox = $('paste-textarea-box');

        if (tabFile && tabCode && dropzone && pasteBox) {
            tabFile.addEventListener('click', function () {
                tabFile.classList.add('active');
                tabCode.classList.remove('active');
                dropzone.style.display = 'flex';
                pasteBox.style.display = 'none';
            });
            tabCode.addEventListener('click', function () {
                tabCode.classList.add('active');
                tabFile.classList.remove('active');
                dropzone.style.display = 'none';
                pasteBox.style.display = 'flex';
                var txtArea = $('txt-svg-paste');
                if (txtArea) txtArea.focus();
            });
        }

        var btnApplyPaste = $('btn-apply-svg-paste');
        if (btnApplyPaste) {
            btnApplyPaste.addEventListener('click', function () {
                var txt = $('txt-svg-paste') ? $('txt-svg-paste').value : '';
                handleSvgLoaded(txt, 'شكل مخصص');
            });
        }

        var modalMatrix = $('modal-anchor-matrix');
        if (modalMatrix) {
            modalMatrix.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-anchor]');
                if (btn) {
                    var aKey = btn.getAttribute('data-anchor');
                    setModalAnchor(aKey);
                }
            });
        }

        var segModalMode = $('seg-modal-render-mode');
        if (segModalMode) {
            segModalMode.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-mode]');
                if (!btn) return;
                currentImportHollow = (btn.getAttribute('data-mode') === 'hollow');
                segModalMode.querySelectorAll('button[data-mode]').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                renderCanvasPreview();
                updateLiveRulerSimulation();
            });
        }

        var btnConfirm = $('btn-accept-svg-modal');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', function () {
                if (!currentImportParsed || !currentImportParsed.ok) return;

                var rawName = $('inp-imported-name') ? $('inp-imported-name').value.trim() : '';
                var baseName = sanitizeSvgName(rawName) || ('شكل مخصص ' + (TR_SVG_SHAPES.getCustomShapes().length + 1));
                var allCustom = TR_SVG_SHAPES.getCustomShapes();
                var cleanName = baseName;
                var suffixIdx = 2;
                while (allCustom.some(function (cs) { return cs.name === cleanName; })) {
                    cleanName = baseName + ' ' + suffixIdx;
                    suffixIdx++;
                }

                var sId = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 100);

                var newShapeDef = {
                    id: sId,
                    name: cleanName,
                    nameEn: cleanName,
                    category: 'custom',
                    defaultAnchor: currentImportAnchor,
                    isHollow: currentImportHollow,
                    svg: currentImportParsed.svgMarkup,
                    subPaths: currentImportParsed.subPaths
                };

                var addRes = TR_SVG_SHAPES.addCustomShape(newShapeDef);
                if (!addRes || addRes.ok === false) {
                    setModalStatus('✕ ' + ((addRes && addRes.error) ? addRes.error : 'تعذر حفظ الشكل محلياً'), 'err');
                    return;
                }

                if (modalTargetNodeIndex >= 0 && state.nodes && state.nodes[modalTargetNodeIndex]) {
                    var targetNode = state.nodes[modalTargetNodeIndex];
                    targetNode.customShape = sId;
                    if (targetNode.sources && targetNode.sources.center) {
                        targetNode.sources.center.shape = sId;
                    }
                    targetNode.isHollow = currentImportHollow;
                    targetNode.customAnchor = currentImportAnchor;
                    if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
                        TIME_RULER_STATE_STORE.syncLegacyNodeFields(targetNode, modalTargetNodeIndex);
                    }
                } else {
                    state.nodeShape = sId;
                }

                closeSvgImporterModal();
                if (typeof onShapeImported === 'function') {
                    onShapeImported(sId, cleanName);
                }
            });
        }
    }

    return {
        sanitizeSvgName: sanitizeSvgName,
        initGlobalShapeDropdown: initGlobalShapeDropdown,
        openSvgImporterModal: openSvgImporterModal,
        closeSvgImporterModal: closeSvgImporterModal,
        setModalAnchor: setModalAnchor,
        handleSvgLoaded: handleSvgLoaded,
        initSvgImporterModal: initSvgImporterModal
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_SHAPES_ENGINE;
}

