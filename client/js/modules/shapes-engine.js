/**
 * TIME RULER PRO — client/js/modules/shapes-engine.js
 * SVG Shapes Library, Modal Manager & Interactive Vector Preview Engine
 */

var TIME_RULER_SHAPES_ENGINE = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

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
                '<span class="shape-tile-label">' + sh.name + '</span>';

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

        if (!trigger._wiredModal) {
            trigger._wiredModal = true;
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
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

        var btnClose = $('btn-close-shapes-modal');
        var btnCancel = $('btn-cancel-shapes-modal');
        var btnAccept = $('btn-accept-shapes-modal');

        if (btnClose && !btnClose._wired) {
            btnClose._wired = true;
            btnClose.addEventListener('click', closeModal);
        }
        if (btnCancel && !btnCancel._wired) {
            btnCancel._wired = true;
            btnCancel.addEventListener('click', closeModal);
        }
        if (btnAccept && !btnAccept._wired) {
            btnAccept._wired = true;
            btnAccept.addEventListener('click', function () {
                closeModal();
            });
        }

        if (!modal._wiredOverlay) {
            modal._wiredOverlay = true;
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
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

        var btnTab2Import = $('btn-open-importer-tab2');
        if (btnTab2Import && !btnTab2Import._wired) {
            btnTab2Import._wired = true;
            btnTab2Import.addEventListener('click', function (e) {
                e.stopPropagation();
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

        var btnTogglePaste = $('btn-toggle-paste');
        if (btnTogglePaste) btnTogglePaste.classList.remove('open');

        var tabFile = $('btn-tab-src-file');
        var tabCode = $('btn-tab-src-code');
        var dropzone = $('svg-dropzone');
        if (tabFile && tabCode) {
            tabFile.classList.add('active');
            tabCode.classList.remove('active');
        }
        if (dropzone) dropzone.style.display = 'flex';
        if (pasteBox) pasteBox.style.display = 'none';

        var btnSolid = $('btn-import-solid');
        var btnHollow = $('btn-import-hollow');
        if (btnSolid) btnSolid.classList.add('active');
        if (btnHollow) btnHollow.classList.remove('active');

        var btnConfirm = $('btn-accept-svg-modal') || $('btn-confirm-svg-import');
        if (btnConfirm) btnConfirm.disabled = true;

        setModalAnchor('center');

        var layer = $('canvas-svg-layer');
        if (layer) {
            layer.innerHTML = '<div class="canvas-placeholder-msg"><i class="ph-bold ph-eye"></i></div>';
        }

        var stats = $('lbl-svg-sim-stats');
        if (stats) stats.textContent = '-';

        var marker = $('ruler-sim-marker');
        if (marker) marker.innerHTML = '';

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
        var overlay = $('canvas-anchor-overlay');
        if (overlay) {
            overlay.querySelectorAll('.canvas-anchor-pt').forEach(function (pt) {
                pt.classList.toggle('active', pt.getAttribute('data-anchor') === currentImportAnchor);
            });
        }
        var modalMatrix = $('modal-anchor-matrix');
        if (modalMatrix) {
            modalMatrix.querySelectorAll('button[data-anchor]').forEach(function (pt) {
                pt.classList.toggle('active', pt.getAttribute('data-anchor') === currentImportAnchor);
            });
        }
        var lbl = $('lbl-modal-anchor-name');
        if (lbl && typeof TR_SVG_SHAPES !== 'undefined' && TR_SVG_SHAPES.ANCHORS[currentImportAnchor]) {
            var aObj = TR_SVG_SHAPES.ANCHORS[currentImportAnchor];
            lbl.textContent = aObj.name;
        }
        updateLiveRulerSimulation();
    }

    function handleSvgLoaded(rawSvg, defaultName) {
        if (!rawSvg || !rawSvg.trim()) {
            setModalStatus('✕ المحتوى فارغ', 'err');
            return;
        }

        currentRawSvgContent = rawSvg;
        var isAutoFit = $('chk-import-autofit') ? $('chk-import-autofit').checked : true;
        var res = TR_SVG_SHAPES.parseSvgString(rawSvg, { autoFit: isAutoFit, padding: 26 });

        if (!res || !res.ok) {
            setModalStatus('✕ ' + (res ? res.error : 'تعذر تحليل SVG'), 'err');
            var btnConfirm = $('btn-accept-svg-modal') || $('btn-confirm-svg-import');
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

        var btnConfirm = $('btn-accept-svg-modal') || $('btn-confirm-svg-import');
        if (btnConfirm) btnConfirm.disabled = false;

        updateLiveRulerSimulation();
    }

    function renderCanvasPreview() {
        var layer = $('canvas-svg-layer');
        if (!layer || !currentImportParsed) return;

        var fillStyle = currentImportHollow ? 'none' : 'currentColor';
        var strokeStyle = currentImportHollow ? 'currentColor' : 'none';
        var strokeWidth = currentImportHollow ? '14' : '0';

        var svgHtml = '<svg viewBox="0 0 256 256" width="116" height="116" style="color: #10b981; fill: ' + fillStyle + '; stroke: ' + strokeStyle + '; stroke-width: ' + strokeWidth + '; display:block;">' +
            currentImportParsed.svgMarkup +
            '</svg>';

        layer.innerHTML = svgHtml;
    }

    function updateLiveRulerSimulation() {
        var marker = $('ruler-sim-marker');
        if (!marker || !currentImportParsed) return;

        var fillStyle = currentImportHollow ? 'none' : '#10b981';
        var strokeStyle = currentImportHollow ? '#10b981' : 'none';
        var strokeWidth = currentImportHollow ? '14' : '0';

        marker.innerHTML = '<svg viewBox="0 0 256 256" width="22" height="22" style="fill: ' + fillStyle + '; stroke: ' + strokeStyle + '; stroke-width: ' + strokeWidth + '; display:block;">' +
            currentImportParsed.svgMarkup +
            '</svg>';

        var aObj = (typeof TR_SVG_SHAPES !== 'undefined' && TR_SVG_SHAPES.ANCHORS[currentImportAnchor])
            ? TR_SVG_SHAPES.ANCHORS[currentImportAnchor]
            : { x: 128, y: 128 };

        var shiftXPct = -((aObj.x / 256) * 100);
        var shiftYPct = -((aObj.y / 256) * 100);

        marker.style.transform = 'translate(' + shiftXPct + '%, ' + shiftYPct + '%)';
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

        var anchorOverlay = $('canvas-anchor-overlay');
        if (anchorOverlay) {
            anchorOverlay.addEventListener('click', function (e) {
                var btn = e.target.closest('.canvas-anchor-pt');
                if (btn) {
                    var aKey = btn.getAttribute('data-anchor');
                    setModalAnchor(aKey);
                }
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

        var btnSolid = $('btn-import-solid');
        var btnHollow = $('btn-import-hollow');
        if (btnSolid && btnHollow) {
            btnSolid.addEventListener('click', function () {
                currentImportHollow = false;
                btnSolid.classList.add('active');
                btnHollow.classList.remove('active');
                renderCanvasPreview();
                updateLiveRulerSimulation();
            });

            btnHollow.addEventListener('click', function () {
                currentImportHollow = true;
                btnHollow.classList.add('active');
                btnSolid.classList.remove('active');
                renderCanvasPreview();
                updateLiveRulerSimulation();
            });
        }

        var chkAutofit = $('chk-import-autofit');
        if (chkAutofit) {
            chkAutofit.addEventListener('change', function () {
                if (currentRawSvgContent) {
                    handleSvgLoaded(currentRawSvgContent, $('inp-imported-name').value);
                }
            });
        }

        var btnConfirm = $('btn-confirm-svg-import');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', function () {
                if (!currentImportParsed || !currentImportParsed.ok) return;

                var rawName = $('inp-imported-name') ? $('inp-imported-name').value.trim() : '';
                var cleanName = sanitizeSvgName(rawName) || ('شكل مخصص ' + (TR_SVG_SHAPES.getCustomShapes().length + 1));

                var existingCustom = TR_SVG_SHAPES.getCustomShapes().find(function (cs) {
                    return cs.name === cleanName;
                });
                var sId = existingCustom ? existingCustom.id : ('custom_' + Date.now());

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

                TR_SVG_SHAPES.addCustomShape(newShapeDef);

                if (modalTargetNodeIndex >= 0 && state.nodes && state.nodes[modalTargetNodeIndex]) {
                    state.nodes[modalTargetNodeIndex].customShape = sId;
                    state.nodes[modalTargetNodeIndex].isHollow = currentImportHollow;
                    state.nodes[modalTargetNodeIndex].customAnchor = currentImportAnchor;
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

