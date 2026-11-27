/**
 * TIME RULER PRO — Broadcast SVG Vector Shapes Registry
 * Standard 256x256 ViewBox & 9-Point Anchor System
 */

(function (root, factory) {
    var exp = factory();
    if (root) {
        root.TR_SVG_SHAPES = exp;
    }
    if (typeof define === 'function' && define.amd) {
        define([], function () { return exp; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = exp;
    }
}(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this), function () {

    var KAPPA = 0.5522847498307936;

    // Standard 256x256 Reference Point / Anchor Locator on the shape itself.
    // The chosen point on the shape snaps to (0,0) on the track in both AE vector space and CSS preview:
    // bottom-center (128,256) snaps the shape's bottom tip to the track so it sits ABOVE the track (-Y in AE).
    // top-center (128,0) snaps the shape's top edge to the track so it hangs BELOW the track (+Y in AE).
    var ANCHORS = {
        'top-left':      { id: 'top-left',      name: 'أعلى اليسار', x: 0,   y: 0 },
        'top-center':    { id: 'top-center',    name: 'أعلى الوسط', x: 128, y: 0 },
        'top-right':     { id: 'top-right',     name: 'أعلى اليمين', x: 256, y: 0 },
        'middle-left':   { id: 'middle-left',   name: 'وسط اليسار', x: 0,   y: 128 },
        'center':        { id: 'center',        name: 'المركز (على المسار)', x: 128, y: 128 },
        'middle-right':  { id: 'middle-right',  name: 'وسط اليمين', x: 256, y: 128 },
        'bottom-left':   { id: 'bottom-left',   name: 'أسفل اليسار', x: 0,   y: 256 },
        'bottom-center': { id: 'bottom-center', name: 'أسفل الوسط', x: 128, y: 256 },
        'bottom-right':  { id: 'bottom-right',  name: 'أسفل اليمين', x: 256, y: 256 }
    };

    var SHAPES = [
        {
            id: 'circle',
            name: 'دائرة مصمتة',
            nameEn: 'Circle',
            category: 'basic',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<circle cx="128" cy="128" r="120"/>',
            subPaths: [{
                vertices: [[128, 0], [256, 128], [128, 256], [0, 128]],
                inTangents: [[-128 * KAPPA, 0], [0, -128 * KAPPA], [128 * KAPPA, 0], [0, 128 * KAPPA]],
                outTangents: [[128 * KAPPA, 0], [0, 128 * KAPPA], [-128 * KAPPA, 0], [0, -128 * KAPPA]],
                closed: true
            }]
        },
        {
            id: 'ring',
            name: 'حلقة مفرغة',
            nameEn: 'Ring',
            category: 'basic',
            defaultAnchor: 'center',
            isHollow: true,
            svg: '<circle cx="128" cy="128" r="114" fill="none" stroke="currentColor" stroke-width="28"/>',
            subPaths: [{
                vertices: [[128, 0], [256, 128], [128, 256], [0, 128]],
                inTangents: [[-128 * KAPPA, 0], [0, -128 * KAPPA], [128 * KAPPA, 0], [0, 128 * KAPPA]],
                outTangents: [[128 * KAPPA, 0], [0, 128 * KAPPA], [-128 * KAPPA, 0], [0, -128 * KAPPA]],
                closed: true
            }]
        },
        {
            id: 'square',
            name: 'مربع حاد',
            nameEn: 'Square',
            category: 'basic',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<rect x="16" y="16" width="224" height="224"/>',
            subPaths: [{
                vertices: [[0, 0], [256, 0], [256, 256], [0, 256]],
                inTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                outTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                closed: true
            }]
        },
        {
            id: 'diamond',
            name: 'معين بلوري',
            nameEn: 'Diamond',
            category: 'basic',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<polygon points="128,16 240,128 128,240 16,128"/>',
            subPaths: [{
                vertices: [[128, 0], [256, 128], [128, 256], [0, 128]],
                inTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                outTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                closed: true
            }]
        },
        {
            id: 'pin',
            name: 'دبوس موقع',
            nameEn: 'Map Pin',
            category: 'markers',
            defaultAnchor: 'bottom-center',
            labelCenter: [128, 106],
            isHollow: false,
            svg: '<path d="M 128 244 C 110 206 68 152 68 106 A 60 60 0 1 1 188 106 C 188 152 146 206 128 244 Z"/>',
            subPaths: [{
                vertices: [
                    [128, 244],
                    [68, 106],
                    [128, 46],
                    [188, 106]
                ],
                inTangents: [
                    [20, -38],
                    [-4, 38],
                    [-60 * KAPPA, 0],
                    [4, -38]
                ],
                outTangents: [
                    [-20, -38],
                    [4, -38],
                    [60 * KAPPA, 0],
                    [-4, 38]
                ],
                closed: true
            }]
        },
        {
            id: 'triangle_down',
            name: 'مؤشر سفلي',
            nameEn: 'Pointer Down',
            category: 'markers',
            defaultAnchor: 'bottom-center',
            labelCenter: [128, 116],
            isHollow: false,
            svg: '<polygon points="40,56 216,56 128,236"/>',
            subPaths: [{
                vertices: [[40, 56], [216, 56], [128, 236]],
                inTangents: [[0, 0], [0, 0], [0, 0]],
                outTangents: [[0, 0], [0, 0], [0, 0]],
                closed: true
            }]
        },
        {
            id: 'triangle_up',
            name: 'مؤشر علوي',
            nameEn: 'Pointer Up',
            category: 'markers',
            defaultAnchor: 'top-center',
            labelCenter: [128, 140],
            isHollow: false,
            svg: '<polygon points="128,20 216,200 40,200"/>',
            subPaths: [{
                vertices: [[128, 20], [216, 200], [40, 200]],
                inTangents: [[0, 0], [0, 0], [0, 0]],
                outTangents: [[0, 0], [0, 0], [0, 0]],
                closed: true
            }]
        },
        {
            id: 'hexagon',
            name: 'مسدس تكنولوجي',
            nameEn: 'Hexagon',
            category: 'geometric',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<polygon points="228,128 178,214 78,214 28,128 78,42 178,42"/>',
            subPaths: [{
                vertices: [[228, 128], [178, 214], [78, 214], [28, 128], [78, 42], [178, 42]],
                inTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                outTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                closed: true
            }]
        },
        {
            id: 'star',
            name: 'نجمة وميض',
            nameEn: 'Sparkle Star',
            category: 'geometric',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<polygon points="128,20 148,108 236,128 148,148 128,236 108,148 20,128 108,108"/>',
            subPaths: [{
                vertices: [
                    [128, 20], [148, 108], [236, 128], [148, 148],
                    [128, 236], [108, 148], [20, 128], [108, 108]
                ],
                inTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                outTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                closed: true
            }]
        },
        {
            id: 'badge',
            name: 'درع محطة',
            nameEn: 'Milestone Badge',
            category: 'markers',
            defaultAnchor: 'bottom-center',
            labelCenter: [128, 120],
            isHollow: false,
            svg: '<path d="M 48 38 L 208 38 L 208 130 C 208 175 168 215 128 238 C 88 215 48 175 48 130 Z"/>',
            subPaths: [{
                vertices: [
                    [48, 38],
                    [208, 38],
                    [208, 130],
                    [128, 238],
                    [48, 130]
                ],
                inTangents: [[0, 0], [0, 0], [0, -25], [30, -22], [0, 30]],
                outTangents: [[0, 0], [0, 25], [0, 30], [-30, -22], [0, -25]],
                closed: true
            }]
        },
        {
            id: 'flag',
            name: 'راية علامة',
            nameEn: 'Flag',
            category: 'markers',
            defaultAnchor: 'bottom-center',
            labelCenter: [134, 76],
            isHollow: false,
            svg: '<rect x="68" y="24" width="12" height="218"/><polygon points="80,24 224,76 80,128"/>',
            subPaths: [
                {
                    vertices: [[68, 242], [80, 242], [80, 24], [68, 24]],
                    inTangents: [[0,0],[0,0],[0,0],[0,0]],
                    outTangents: [[0,0],[0,0],[0,0],[0,0]],
                    closed: true
                },
                {
                    vertices: [[80, 24], [224, 76], [80, 128]],
                    inTangents: [[0,0],[0,0],[0,0]],
                    outTangents: [[0,0],[0,0],[0,0]],
                    closed: true
                }
            ]
        },
        {
            id: 'cross',
            name: 'علامة زائد +',
            nameEn: 'Cross / Plus',
            category: 'geometric',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<polygon points="98,32 158,32 158,98 224,98 224,158 158,158 158,224 98,224 98,158 32,158 32,98 98,98"/>',
            subPaths: [{
                vertices: [
                    [98, 32], [158, 32], [158, 98], [224, 98],
                    [224, 158], [158, 158], [158, 224], [98, 224],
                    [98, 158], [32, 158], [32, 98], [98, 98]
                ],
                inTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                outTangents: [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                closed: true
            }]
        },
        {
            id: 'hud_bracket',
            name: 'أقواس HUD',
            nameEn: 'HUD Target',
            category: 'tech',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<path d="M 76 52 L 48 52 L 48 204 L 76 204" fill="none" stroke="currentColor" stroke-width="20"/><path d="M 180 52 L 208 52 L 208 204 L 180 204" fill="none" stroke="currentColor" stroke-width="20"/><rect x="114" y="114" width="28" height="28"/>',
            subPaths: [
                {
                    vertices: [[76, 52], [48, 52], [48, 204], [76, 204]],
                    inTangents: [[0,0],[0,0],[0,0],[0,0]],
                    outTangents: [[0,0],[0,0],[0,0],[0,0]],
                    closed: false
                },
                {
                    vertices: [[180, 52], [208, 52], [208, 204], [180, 204]],
                    inTangents: [[0,0],[0,0],[0,0],[0,0]],
                    outTangents: [[0,0],[0,0],[0,0],[0,0]],
                    closed: false
                },
                {
                    vertices: [[114, 114], [142, 114], [142, 142], [114, 142]],
                    inTangents: [[0,0],[0,0],[0,0],[0,0]],
                    outTangents: [[0,0],[0,0],[0,0],[0,0]],
                    closed: true
                }
            ]
        },
        {
            id: 'capsule',
            name: 'كبسولة بيضاوية',
            nameEn: 'Capsule',
            category: 'geometric',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<rect x="32" y="68" width="192" height="120" rx="60"/>',
            subPaths: [{
                vertices: [
                    [82, 68],
                    [174, 68],
                    [224, 128],
                    [174, 188],
                    [82, 188],
                    [32, 128]
                ],
                inTangents: [
                    [-25 * KAPPA, 0],
                    [0, 0],
                    [0, -30 * KAPPA],
                    [25 * KAPPA, 0],
                    [0, 0],
                    [0, 30 * KAPPA]
                ],
                outTangents: [
                    [0, 0],
                    [25 * KAPPA, 0],
                    [0, 30 * KAPPA],
                    [0, 0],
                    [-25 * KAPPA, 0],
                    [0, -30 * KAPPA]
                ],
                closed: true
            }]
        },
        {
            id: 'tick',
            name: 'سن متعامد',
            nameEn: 'Vertical Tick',
            category: 'tech',
            defaultAnchor: 'center',
            isHollow: false,
            svg: '<line x1="128" y1="20" x2="128" y2="236" stroke="currentColor" stroke-width="28" stroke-linecap="square"/>',
            subPaths: [{
                vertices: [[128, 20], [128, 236]],
                inTangents: [[0, 0], [0, 0]],
                outTangents: [[0, 0], [0, 0]],
                closed: false
            }]
        }
    ];

    var shapeMap = {};
    SHAPES.forEach(function (s) {
        shapeMap[s.id] = s;
    });
    if (!shapeMap['triangle'] && shapeMap['triangle_down']) {
        shapeMap['triangle'] = shapeMap['triangle_down'];
    }

    /* ------------------------------------------------------------------ */
    /* Custom Shapes Persistence (localStorage)                            */
    /* ------------------------------------------------------------------ */

    var STORAGE_CUSTOM_SHAPES_KEY = 'TIME_RULER_CUSTOM_SHAPES_V1';
    var customShapes = [];
    var lastStorageError = null;

    function loadCustomShapes() {
        try {
            if (typeof localStorage !== 'undefined') {
                var raw = localStorage.getItem(STORAGE_CUSTOM_SHAPES_KEY);
                if (raw) {
                    var list = JSON.parse(raw);
                    if (Array.isArray(list)) {
                        customShapes = list;
                        list.forEach(function (cs) {
                            if (cs && cs.id) {
                                shapeMap[cs.id] = cs;
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load custom shapes:', e);
        }
    }

    function saveCustomShapes() {
        lastStorageError = null;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_CUSTOM_SHAPES_KEY, JSON.stringify(customShapes));
            }
            return { ok: true };
        } catch (e) {
            lastStorageError = (e && e.name === 'QuotaExceededError')
                ? 'تم تجاوز سعة التخزين المحلية (QuotaExceededError)'
                : String(e);
            console.error('Failed to save custom shapes:', e);
            return { ok: false, error: lastStorageError };
        }
    }

    // Auto-load custom shapes on initialization
    loadCustomShapes();

    function addCustomShape(shapeDef) {
        if (!shapeDef || !shapeDef.id || !shapeDef.subPaths) return null;
        var prevCustom = customShapes.slice();
        var prevMap = shapeMap[shapeDef.id];
        var existsIdx = -1;
        for (var i = 0; i < customShapes.length; i++) {
            if (customShapes[i].id === shapeDef.id) {
                existsIdx = i;
                break;
            }
        }
        if (existsIdx >= 0) {
            customShapes[existsIdx] = shapeDef;
        } else {
            customShapes.unshift(shapeDef); // newest first
        }
        shapeMap[shapeDef.id] = shapeDef;
        var saved = saveCustomShapes();
        if (!saved.ok) {
            customShapes = prevCustom;
            if (prevMap) shapeMap[shapeDef.id] = prevMap;
            else delete shapeMap[shapeDef.id];
            return { ok: false, error: saved.error };
        }
        return shapeDef;
    }

    function removeCustomShape(shapeId) {
        customShapes = customShapes.filter(function (cs) { return cs.id !== shapeId; });
        delete shapeMap[shapeId];
        saveCustomShapes();
        return true;
    }

    /* ------------------------------------------------------------------ */
    /* Robust SVG Vector Path Parser & Normalizer                         */
    /* Supports: M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t, A/a, Z/z         */
    /* Compound sub-paths with fill-rule="evenodd" for holes/cutouts      */
    /* ------------------------------------------------------------------ */

    function arcToBezier(x1, y1, rx, ry, phi, largeArc, sweep, x2, y2) {
        if (rx === 0 || ry === 0) {
            return [{
                x: x2, y: y2,
                cp1x: x1, cp1y: y1,
                cp2x: x2, cp2y: y2
            }];
        }

        var rad = (phi * Math.PI) / 180;
        var cosPhi = Math.cos(rad);
        var sinPhi = Math.sin(rad);

        rx = Math.abs(rx);
        ry = Math.abs(ry);

        var dx = (x1 - x2) / 2;
        var dy = (y1 - y2) / 2;

        var x1p = cosPhi * dx + sinPhi * dy;
        var y1p = -sinPhi * dx + cosPhi * dy;

        var prx = rx * rx;
        var pry = ry * ry;
        var px1 = x1p * x1p;
        var py1 = y1p * y1p;

        var radiiCheck = px1 / prx + py1 / pry;
        if (radiiCheck > 1) {
            var sq = Math.sqrt(radiiCheck);
            rx *= sq;
            ry *= sq;
        }

        var sign = (largeArc === sweep) ? -1 : 1;
        var numer = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
        var denom = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
        var sqVal = Math.max(0, numer / Math.max(1e-9, denom));
        var coef = sign * Math.sqrt(sqVal);

        var cxp = coef * ((rx * y1p) / ry);
        var cyp = coef * (-(ry * x1p) / rx);

        var cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
        var cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

        function angle(ux, uy, vx, vy) {
            var dot = ux * vx + uy * vy;
            var len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
            var ang = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
            if (ux * vy - uy * vx < 0) ang = -ang;
            return ang;
        }

        var ux = (x1p - cxp) / rx;
        var uy = (y1p - cyp) / ry;
        var vx = (-x1p - cxp) / rx;
        var vy = (-y1p - cyp) / ry;

        var theta1 = angle(1, 0, ux, uy);
        var deltaTheta = angle(ux, uy, vx, vy);

        if (sweep === 0 && deltaTheta > 0) {
            deltaTheta -= 2 * Math.PI;
        } else if (sweep === 1 && deltaTheta < 0) {
            deltaTheta += 2 * Math.PI;
        }

        var segments = Math.max(1, Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2)));
        var segDelta = deltaTheta / segments;
        var curves = [];

        var curTheta = theta1;
        for (var s = 0; s < segments; s++) {
            var nextTheta = curTheta + segDelta;
            var alpha = (4 / 3) * Math.tan(segDelta / 4);

            var cosCur = Math.cos(curTheta);
            var sinCur = Math.sin(curTheta);
            var cosNext = Math.cos(nextTheta);
            var sinNext = Math.sin(nextTheta);

            var p0x = rx * cosCur;
            var p0y = ry * sinCur;
            var p3x = rx * cosNext;
            var p3y = ry * sinNext;

            var cp1xTrans = cosPhi * (p0x - alpha * rx * sinCur) - sinPhi * (p0y + alpha * ry * cosCur) + cx;
            var cp1yTrans = sinPhi * (p0x - alpha * rx * sinCur) + cosPhi * (p0y + alpha * ry * cosCur) + cy;
            var cp2xTrans = cosPhi * (p3x + alpha * rx * sinNext) - sinPhi * (p3y - alpha * ry * cosNext) + cx;
            var cp2yTrans = sinPhi * (p3x + alpha * rx * sinNext) + cosPhi * (p3y - alpha * ry * cosNext) + cy;
            var endPtX = (s === segments - 1) ? x2 : (cosPhi * p3x - sinPhi * p3y + cx);
            var endPtY = (s === segments - 1) ? y2 : (sinPhi * p3x + cosPhi * p3y + cy);

            curves.push({
                cp1x: cp1xTrans, cp1y: cp1yTrans,
                cp2x: cp2xTrans, cp2y: cp2yTrans,
                x: endPtX, y: endPtY
            });

            curTheta = nextTheta;
        }

        return curves;
    }

    function tokenizePathArgs(upperCmd, argsStr) {
        if (!argsStr) return [];
        if (upperCmd !== 'A') {
            var numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
            var out = [];
            var m;
            while ((m = numRegex.exec(argsStr)) !== null) {
                out.push(parseFloat(m[0]));
            }
            return out;
        }
        // Arc commands encode 7-argument tuples where largeArc (index 3) and sweep (index 4) are single flags (0|1) without mandatory whitespace after them
        var args = [];
        var pos = 0;
        var len = argsStr.length;
        var singleNumRe = /^[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/;
        while (pos < len) {
            var argSlot = args.length % 7;
            while (pos < len && (argsStr[pos] === ',' || /\s/.test(argsStr[pos]))) pos++;
            if (pos >= len) break;
            if (argSlot === 3 || argSlot === 4) {
                var ch = argsStr[pos];
                if (ch === '0' || ch === '1') {
                    args.push(parseInt(ch, 10));
                    pos += 1;
                } else {
                    break;
                }
            } else {
                var nm = singleNumRe.exec(argsStr.slice(pos));
                if (!nm) break;
                args.push(parseFloat(nm[0]));
                pos += nm[0].length;
            }
        }
        return args;
    }

    function parseSvgPathD(d) {
        if (!d || typeof d !== 'string') return [];

        var cmdRegex = /([a-df-z])([^a-df-z]*)/gi;

        var subPaths = [];
        var curSubPath = { vertices: [], inTangents: [], outTangents: [], closed: false };
        var curX = 0, curY = 0;
        var startX = 0, startY = 0;
        var lastCubicCpX = 0, lastCubicCpY = 0;
        var lastQuadCpX = 0, lastQuadCpY = 0;
        var lastCmd = '';

        var match;
        while ((match = cmdRegex.exec(d)) !== null) {
            var cmd = match[1];
            var isRel = (cmd === cmd.toLowerCase());
            var upper = cmd.toUpperCase();
            var args = tokenizePathArgs(upper, match[2]);

            var i = 0;
            switch (upper) {
                case 'M':
                    while (i < args.length) {
                        var x = (isRel && curSubPath.vertices.length > 0) ? curX + args[i] : (isRel ? curX + args[i] : args[i]);
                        var y = (isRel && curSubPath.vertices.length > 0) ? curY + args[i + 1] : (isRel ? curY + args[i + 1] : args[i + 1]);
                        i += 2;

                        if (i === 2 && curSubPath.vertices.length > 0) {
                            subPaths.push(curSubPath);
                            curSubPath = { vertices: [], inTangents: [], outTangents: [], closed: false };
                        }

                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([0, 0]);
                        curSubPath.outTangents.push([0, 0]);
                        curX = x; curY = y;
                        if (i === 2) {
                            startX = x; startY = y;
                        }
                        lastCubicCpX = x; lastCubicCpY = y;
                        lastQuadCpX = x; lastQuadCpY = y;
                    }
                    break;

                case 'L':
                    while (i < args.length) {
                        var x = isRel ? curX + args[i] : args[i];
                        var y = isRel ? curY + args[i + 1] : args[i + 1];
                        i += 2;
                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([0, 0]);
                        curSubPath.outTangents.push([0, 0]);
                        curX = x; curY = y;
                        lastCubicCpX = x; lastCubicCpY = y;
                        lastQuadCpX = x; lastQuadCpY = y;
                    }
                    break;

                case 'H':
                    while (i < args.length) {
                        var x = isRel ? curX + args[i] : args[i];
                        i += 1;
                        curSubPath.vertices.push([x, curY]);
                        curSubPath.inTangents.push([0, 0]);
                        curSubPath.outTangents.push([0, 0]);
                        curX = x;
                        lastCubicCpX = x; lastCubicCpY = curY;
                        lastQuadCpX = x; lastQuadCpY = curY;
                    }
                    break;

                case 'V':
                    while (i < args.length) {
                        var y = isRel ? curY + args[i] : args[i];
                        i += 1;
                        curSubPath.vertices.push([curX, y]);
                        curSubPath.inTangents.push([0, 0]);
                        curSubPath.outTangents.push([0, 0]);
                        curY = y;
                        lastCubicCpX = curX; lastCubicCpY = y;
                        lastQuadCpX = curX; lastQuadCpY = y;
                    }
                    break;

                case 'C':
                    while (i + 5 < args.length) {
                        var cp1x = isRel ? curX + args[i]     : args[i];
                        var cp1y = isRel ? curY + args[i + 1] : args[i + 1];
                        var cp2x = isRel ? curX + args[i + 2] : args[i + 2];
                        var cp2y = isRel ? curY + args[i + 3] : args[i + 3];
                        var x    = isRel ? curX + args[i + 4] : args[i + 4];
                        var y    = isRel ? curY + args[i + 5] : args[i + 5];
                        i += 6;

                        var lastIdx = curSubPath.vertices.length - 1;
                        if (lastIdx >= 0) {
                            curSubPath.outTangents[lastIdx] = [cp1x - curX, cp1y - curY];
                        }

                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([cp2x - x, cp2y - y]);
                        curSubPath.outTangents.push([0, 0]);

                        curX = x; curY = y;
                        lastCubicCpX = cp2x; lastCubicCpY = cp2y;
                    }
                    break;

                case 'S':
                    while (i + 3 < args.length) {
                        var cp1x = curX;
                        var cp1y = curY;
                        if (lastCmd === 'C' || lastCmd === 'S') {
                            cp1x = 2 * curX - lastCubicCpX;
                            cp1y = 2 * curY - lastCubicCpY;
                        }
                        var cp2x = isRel ? curX + args[i]     : args[i];
                        var cp2y = isRel ? curY + args[i + 1] : args[i + 1];
                        var x    = isRel ? curX + args[i + 2] : args[i + 2];
                        var y    = isRel ? curY + args[i + 3] : args[i + 3];
                        i += 4;

                        var lastIdx = curSubPath.vertices.length - 1;
                        if (lastIdx >= 0) {
                            curSubPath.outTangents[lastIdx] = [cp1x - curX, cp1y - curY];
                        }

                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([cp2x - x, cp2y - y]);
                        curSubPath.outTangents.push([0, 0]);

                        curX = x; curY = y;
                        lastCubicCpX = cp2x; lastCubicCpY = cp2y;
                    }
                    break;

                case 'Q':
                    while (i + 3 < args.length) {
                        var qx = isRel ? curX + args[i]     : args[i];
                        var qy = isRel ? curY + args[i + 1] : args[i + 1];
                        var x  = isRel ? curX + args[i + 2] : args[i + 2];
                        var y  = isRel ? curY + args[i + 3] : args[i + 3];
                        i += 4;

                        var cp1x = curX + (2 / 3) * (qx - curX);
                        var cp1y = curY + (2 / 3) * (qy - curY);
                        var cp2x = x + (2 / 3) * (qx - x);
                        var cp2y = y + (2 / 3) * (qy - y);

                        var lastIdx = curSubPath.vertices.length - 1;
                        if (lastIdx >= 0) {
                            curSubPath.outTangents[lastIdx] = [cp1x - curX, cp1y - curY];
                        }

                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([cp2x - x, cp2y - y]);
                        curSubPath.outTangents.push([0, 0]);

                        curX = x; curY = y;
                        lastQuadCpX = qx; lastQuadCpY = qy;
                    }
                    break;

                case 'T':
                    while (i + 1 < args.length) {
                        var qx = curX;
                        var qy = curY;
                        if (lastCmd === 'Q' || lastCmd === 'T') {
                            qx = 2 * curX - lastQuadCpX;
                            qy = 2 * curY - lastQuadCpY;
                        }
                        var x = isRel ? curX + args[i]     : args[i];
                        var y = isRel ? curY + args[i + 1] : args[i + 1];
                        i += 2;

                        var cp1x = curX + (2 / 3) * (qx - curX);
                        var cp1y = curY + (2 / 3) * (qy - curY);
                        var cp2x = x + (2 / 3) * (qx - x);
                        var cp2y = y + (2 / 3) * (qy - y);

                        var lastIdx = curSubPath.vertices.length - 1;
                        if (lastIdx >= 0) {
                            curSubPath.outTangents[lastIdx] = [cp1x - curX, cp1y - curY];
                        }

                        curSubPath.vertices.push([x, y]);
                        curSubPath.inTangents.push([cp2x - x, cp2y - y]);
                        curSubPath.outTangents.push([0, 0]);

                        curX = x; curY = y;
                        lastQuadCpX = qx; lastQuadCpY = qy;
                    }
                    break;

                case 'A':
                    while (i + 6 < args.length) {
                        var rx       = args[i];
                        var ry       = args[i + 1];
                        var phi      = args[i + 2];
                        var largeArc = Math.round(args[i + 3]);
                        var sweep    = Math.round(args[i + 4]);
                        var x        = isRel ? curX + args[i + 5] : args[i + 5];
                        var y        = isRel ? curY + args[i + 6] : args[i + 6];
                        i += 7;

                        var curves = arcToBezier(curX, curY, rx, ry, phi, largeArc, sweep, x, y);
                        for (var c = 0; c < curves.length; c++) {
                            var curve = curves[c];
                            var lastIdx = curSubPath.vertices.length - 1;
                            if (lastIdx >= 0) {
                                curSubPath.outTangents[lastIdx] = [curve.cp1x - curX, curve.cp1y - curY];
                            }
                            curSubPath.vertices.push([curve.x, curve.y]);
                            curSubPath.inTangents.push([curve.cp2x - curve.x, curve.cp2y - curve.y]);
                            curSubPath.outTangents.push([0, 0]);
                            curX = curve.x;
                            curY = curve.y;
                        }
                    }
                    break;

                case 'Z':
                    curSubPath.closed = true;
                    // Deduplicate closing point if identical to starting point
                    if (curSubPath.vertices.length > 1) {
                        var firstPt = curSubPath.vertices[0];
                        var lastPt = curSubPath.vertices[curSubPath.vertices.length - 1];
                        var dist = Math.hypot(lastPt[0] - firstPt[0], lastPt[1] - firstPt[1]);
                        if (dist < 0.05) {
                            var lastInT = curSubPath.inTangents[curSubPath.vertices.length - 1];
                            if (lastInT && (lastInT[0] !== 0 || lastInT[1] !== 0)) {
                                curSubPath.inTangents[0] = [lastInT[0], lastInT[1]];
                            }
                            curSubPath.vertices.pop();
                            curSubPath.inTangents.pop();
                            curSubPath.outTangents.pop();
                        }
                    }
                    curX = startX; curY = startY;
                    lastCubicCpX = startX; lastCubicCpY = startY;
                    lastQuadCpX = startX; lastQuadCpY = startY;
                    break;
            }
            lastCmd = upper;
        }

        if (curSubPath.vertices.length > 0) {
            subPaths.push(curSubPath);
        }
        return subPaths;
    }

    function calculateBounds(subPaths) {
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        function includePt(x, y) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
        function sampleSeg(p0, outT, p1, inT) {
            includePt(p0[0], p0[1]);
            includePt(p1[0], p1[1]);
            var hasCurve = (outT[0] !== 0 || outT[1] !== 0 || inT[0] !== 0 || inT[1] !== 0);
            if (!hasCurve) return;
            var c1x = p0[0] + outT[0], c1y = p0[1] + outT[1];
            var c2x = p1[0] + inT[0], c2y = p1[1] + inT[1];
            for (var step = 1; step < 16; step++) {
                var t = step / 16;
                var mt = 1 - t;
                var x = mt * mt * mt * p0[0] + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p1[0];
                var y = mt * mt * mt * p0[1] + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p1[1];
                includePt(x, y);
            }
        }
        subPaths.forEach(function (sp) {
            if (!sp.vertices || sp.vertices.length === 0) return;
            for (var i = 0; i < sp.vertices.length; i++) {
                includePt(sp.vertices[i][0], sp.vertices[i][1]);
                if (i > 0) {
                    sampleSeg(sp.vertices[i - 1], sp.outTangents[i - 1] || [0, 0], sp.vertices[i], sp.inTangents[i] || [0, 0]);
                }
            }
            if (sp.closed && sp.vertices.length > 1) {
                var last = sp.vertices.length - 1;
                sampleSeg(sp.vertices[last], sp.outTangents[last] || [0, 0], sp.vertices[0], sp.inTangents[0] || [0, 0]);
            }
        });
        if (minX === Infinity) {
            return { minX: 0, minY: 0, maxX: 256, maxY: 256 };
        }
        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    }

    function normalizeTo256(subPaths, bounds, padding) {
        var pad = (typeof padding === 'number') ? padding : 28;
        var targetSize = 256 - (pad * 2);
        var origW = bounds.maxX - bounds.minX || 1;
        var origH = bounds.maxY - bounds.minY || 1;
        var scale = targetSize / Math.max(origW, origH);

        var midX = (bounds.minX + bounds.maxX) / 2;
        var midY = (bounds.minY + bounds.maxY) / 2;
        var targetCenterX = 128;
        var targetCenterY = 128;

        return subPaths.map(function (sp) {
            return {
                closed: sp.closed,
                vertices: sp.vertices.map(function (v) {
                    return [
                        Math.round((targetCenterX + (v[0] - midX) * scale) * 10) / 10,
                        Math.round((targetCenterY + (v[1] - midY) * scale) * 10) / 10
                    ];
                }),
                inTangents: sp.inTangents.map(function (t) {
                    return [
                        Math.round(t[0] * scale * 10) / 10,
                        Math.round(t[1] * scale * 10) / 10
                    ];
                }),
                outTangents: sp.outTangents.map(function (t) {
                    return [
                        Math.round(t[0] * scale * 10) / 10,
                        Math.round(t[1] * scale * 10) / 10
                    ];
                })
            };
        });
    }

    function subPathToD(sp) {
        if (!sp.vertices || sp.vertices.length === 0) return '';
        var d = 'M ' + sp.vertices[0][0] + ' ' + sp.vertices[0][1];
        for (var i = 1; i < sp.vertices.length; i++) {
            var prev = sp.vertices[i - 1];
            var cur = sp.vertices[i];
            var outT = sp.outTangents[i - 1] || [0, 0];
            var inT = sp.inTangents[i] || [0, 0];

            var hasCurves = (outT[0] !== 0 || outT[1] !== 0 || inT[0] !== 0 || inT[1] !== 0);
            if (hasCurves) {
                var cp1x = prev[0] + outT[0];
                var cp1y = prev[1] + outT[1];
                var cp2x = cur[0] + inT[0];
                var cp2y = cur[1] + inT[1];
                d += ' C ' + cp1x.toFixed(2) + ' ' + cp1y.toFixed(2) + ', ' + cp2x.toFixed(2) + ' ' + cp2y.toFixed(2) + ', ' + cur[0].toFixed(2) + ' ' + cur[1].toFixed(2);
            } else {
                d += ' L ' + cur[0].toFixed(2) + ' ' + cur[1].toFixed(2);
            }
        }
        if (sp.closed) {
            var lastIdx = sp.vertices.length - 1;
            var lastV = sp.vertices[lastIdx];
            var firstV = sp.vertices[0];
            var outT = sp.outTangents[lastIdx] || [0, 0];
            var inT = sp.inTangents[0] || [0, 0];
            if (outT[0] !== 0 || outT[1] !== 0 || inT[0] !== 0 || inT[1] !== 0) {
                var cp1x = lastV[0] + outT[0];
                var cp1y = lastV[1] + outT[1];
                var cp2x = firstV[0] + inT[0];
                var cp2y = firstV[1] + inT[1];
                d += ' C ' + cp1x.toFixed(2) + ' ' + cp1y.toFixed(2) + ', ' + cp2x.toFixed(2) + ' ' + cp2y.toFixed(2) + ', ' + firstV[0].toFixed(2) + ' ' + firstV[1].toFixed(2) + ' Z';
            } else {
                d += ' Z';
            }
        }
        return d;
    }

    function subPathToSvgPath(sp) {
        var d = subPathToD(sp);
        return d ? ('<path fill-rule="evenodd" d="' + d + '" />') : '';
    }

    function polyPointsToPathD(ptsStr, closed) {
        if (!ptsStr || typeof ptsStr !== 'string') return '';
        var nums = ptsStr.match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
        if (!nums || nums.length < 4) return '';
        var d = 'M ' + nums[0] + ' ' + nums[1];
        for (var i = 2; i + 1 < nums.length; i += 2) {
            d += ' L ' + nums[i] + ' ' + nums[i + 1];
        }
        return closed ? (d + ' Z') : d;
    }

    function mulMat(m1, m2) {
        return [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
        ];
    }

    function parseTransformAttr(tfStr) {
        var mat = [1, 0, 0, 1, 0, 0];
        if (!tfStr || typeof tfStr !== 'string') return mat;
        var fnRe = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/gi;
        var m;
        while ((m = fnRe.exec(tfStr)) !== null) {
            var fn = m[1].toLowerCase();
            var nums = (m[2].match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || []).map(parseFloat);
            var cur = [1, 0, 0, 1, 0, 0];
            if (fn === 'translate' && nums.length >= 1) {
                cur = [1, 0, 0, 1, nums[0] || 0, nums[1] || 0];
            } else if (fn === 'scale' && nums.length >= 1) {
                var sx = nums[0];
                var sy = (nums.length >= 2) ? nums[1] : sx;
                cur = [sx, 0, 0, sy, 0, 0];
            } else if (fn === 'rotate' && nums.length >= 1) {
                var ang = (nums[0] * Math.PI) / 180;
                var cos = Math.cos(ang), sin = Math.sin(ang);
                if (nums.length >= 3) {
                    var cx = nums[1], cy = nums[2];
                    cur = mulMat([1, 0, 0, 1, cx, cy], mulMat([cos, sin, -sin, cos, 0, 0], [1, 0, 0, 1, -cx, -cy]));
                } else {
                    cur = [cos, sin, -sin, cos, 0, 0];
                }
            } else if (fn === 'matrix' && nums.length >= 6) {
                cur = nums.slice(0, 6);
            }
            mat = mulMat(mat, cur);
        }
        return mat;
    }

    function getCumulativeMatrix(el) {
        var chain = [];
        var cur = el;
        while (cur && cur.getAttribute) {
            var tf = cur.getAttribute('transform');
            if (tf) chain.unshift(parseTransformAttr(tf));
            cur = cur.parentNode;
        }
        var mat = [1, 0, 0, 1, 0, 0];
        for (var i = 0; i < chain.length; i++) {
            mat = mulMat(mat, chain[i]);
        }
        return mat;
    }

    function applyMatrixToSubPaths(subPaths, mat) {
        if (!mat || (mat[0] === 1 && mat[1] === 0 && mat[2] === 0 && mat[3] === 1 && mat[4] === 0 && mat[5] === 0)) {
            return subPaths;
        }
        var a = mat[0], b = mat[1], c = mat[2], d = mat[3], e = mat[4], f = mat[5];
        return subPaths.map(function (sp) {
            return {
                closed: sp.closed,
                vertices: sp.vertices.map(function (v) { return [a * v[0] + c * v[1] + e, b * v[0] + d * v[1] + f]; }),
                inTangents: sp.inTangents.map(function (t) { return [a * t[0] + c * t[1], b * t[0] + d * t[1]]; }),
                outTangents: sp.outTangents.map(function (t) { return [a * t[0] + c * t[1], b * t[0] + d * t[1]]; })
            };
        });
    }

    function rectToPathD(rx, ry, rw, rh, radX, radY) {
        var rrx = Math.min(Math.max(0, radX || radY || 0), rw / 2);
        var rry = Math.min(Math.max(0, radY || radX || 0), rh / 2);
        if (rrx > 0 && rry > 0) {
            return 'M ' + (rx + rrx) + ' ' + ry +
                ' h ' + (rw - 2 * rrx) +
                ' a ' + rrx + ' ' + rry + ' 0 0 1 ' + rrx + ' ' + rry +
                ' v ' + (rh - 2 * rry) +
                ' a ' + rrx + ' ' + rry + ' 0 0 1 ' + (-rrx) + ' ' + rry +
                ' h ' + (-(rw - 2 * rrx)) +
                ' a ' + rrx + ' ' + rry + ' 0 0 1 ' + (-rrx) + ' ' + (-rry) +
                ' v ' + (-(rh - 2 * rry)) +
                ' a ' + rrx + ' ' + rry + ' 0 0 1 ' + rrx + ' ' + (-rry) + ' Z';
        }
        return 'M ' + rx + ' ' + ry + ' h ' + rw + ' v ' + rh + ' h -' + rw + ' Z';
    }

    function ellipseToPathD(cx, cy, rx, ry) {
        return 'M ' + (cx + rx) + ' ' + cy +
            ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0' +
            ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0 Z';
    }

    /**
     * High-Level SVG Markup Parser: Converts raw SVG XML or path string to normalized subpaths
     */
    function parseSvgString(svgString, options) {
        options = options || {};
        var autoFit = (options.autoFit !== false);
        var padding = (typeof options.padding === 'number') ? options.padding : 28;

        if (!svgString || typeof svgString !== 'string') {
            return { ok: false, error: 'النص المدخل فارغ' };
        }

        var allSubPaths = [];
        var usedDomParser = false;

        // In browser DOM environment, use DOMParser for full nested groups + transforms
        if (typeof DOMParser !== 'undefined') {
            try {
                var parser = new DOMParser();
                var doc = parser.parseFromString(svgString, 'image/svg+xml');
                var parserError = doc.querySelector('parsererror');
                if (!parserError) {
                    usedDomParser = true;
                    var shapesSelector = 'path, polygon, polyline, rect, circle, ellipse, line';
                    var els = doc.querySelectorAll(shapesSelector);
                    for (var idx = 0; idx < els.length; idx++) {
                        var el = els[idx];
                        var tag = el.tagName ? el.tagName.toLowerCase() : '';
                        var dStr = '';
                        if (tag === 'path') {
                            dStr = el.getAttribute('d') || '';
                        } else if (tag === 'polygon' || tag === 'polyline') {
                            dStr = polyPointsToPathD(el.getAttribute('points'), tag === 'polygon');
                        } else if (tag === 'rect') {
                            var rx = parseFloat(el.getAttribute('x')) || 0;
                            var ry = parseFloat(el.getAttribute('y')) || 0;
                            var rw = parseFloat(el.getAttribute('width')) || 0;
                            var rh = parseFloat(el.getAttribute('height')) || 0;
                            var radX = parseFloat(el.getAttribute('rx')) || 0;
                            var radY = parseFloat(el.getAttribute('ry')) || 0;
                            if (rw > 0 && rh > 0) dStr = rectToPathD(rx, ry, rw, rh, radX, radY);
                        } else if (tag === 'circle') {
                            var cx = parseFloat(el.getAttribute('cx')) || 0;
                            var cy = parseFloat(el.getAttribute('cy')) || 0;
                            var cr = parseFloat(el.getAttribute('r')) || 0;
                            if (cr > 0) dStr = ellipseToPathD(cx, cy, cr, cr);
                        } else if (tag === 'ellipse') {
                            var ecx = parseFloat(el.getAttribute('cx')) || 0;
                            var ecy = parseFloat(el.getAttribute('cy')) || 0;
                            var erx = parseFloat(el.getAttribute('rx')) || 0;
                            var ery = parseFloat(el.getAttribute('ry')) || 0;
                            if (erx > 0 && ery > 0) dStr = ellipseToPathD(ecx, ecy, erx, ery);
                        } else if (tag === 'line') {
                            var lx1 = parseFloat(el.getAttribute('x1')) || 0;
                            var ly1 = parseFloat(el.getAttribute('y1')) || 0;
                            var lx2 = parseFloat(el.getAttribute('x2')) || 0;
                            var ly2 = parseFloat(el.getAttribute('y2')) || 0;
                            dStr = 'M ' + lx1 + ' ' + ly1 + ' L ' + lx2 + ' ' + ly2;
                        }
                        if (dStr) {
                            var parsed = parseSvgPathD(dStr);
                            var mat = getCumulativeMatrix(el);
                            parsed = applyMatrixToSubPaths(parsed, mat);
                            parsed.forEach(function (sp) {
                                if (sp.vertices.length >= 2) allSubPaths.push(sp);
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('DOMParser failed, falling back to regex:', e);
            }
        }

        // Regex fallback if DOMParser unavailable or produced no subPaths
        if (allSubPaths.length === 0) {
            var dMatches = [];
            var dRegex = /<path[^>]*\bd=["']([^"']+)["'][^>]*>/gi;
            var match;
            while ((match = dRegex.exec(svgString)) !== null) {
                dMatches.push(match[1]);
            }

            var polyRegex = /<(polygon|polyline)[^>]*\bpoints=["']([^"']+)["'][^>]*>/gi;
            while ((match = polyRegex.exec(svgString)) !== null) {
                var pd = polyPointsToPathD(match[2], match[1].toLowerCase() === 'polygon');
                if (pd) dMatches.push(pd);
            }

            var circRegex = /<circle[^>]*>/gi;
            while ((match = circRegex.exec(svgString)) !== null) {
                var cmx = /\bcx=["']([^"']+)["']/i.exec(match[0]);
                var cmy = /\bcy=["']([^"']+)["']/i.exec(match[0]);
                var cmr = /\br=["']([^"']+)["']/i.exec(match[0]);
                var ccx = cmx ? parseFloat(cmx[1]) : 0, ccy = cmy ? parseFloat(cmy[1]) : 0, ccr = cmr ? parseFloat(cmr[1]) : 0;
                if (ccr > 0) dMatches.push(ellipseToPathD(ccx, ccy, ccr, ccr));
            }

            var ellRegex = /<ellipse[^>]*>/gi;
            while ((match = ellRegex.exec(svgString)) !== null) {
                var emx = /\bcx=["']([^"']+)["']/i.exec(match[0]);
                var emy = /\bcy=["']([^"']+)["']/i.exec(match[0]);
                var erxM = /\brx=["']([^"']+)["']/i.exec(match[0]);
                var eryM = /\bry=["']([^"']+)["']/i.exec(match[0]);
                var ecxR = emx ? parseFloat(emx[1]) : 0, ecyR = emy ? parseFloat(emy[1]) : 0;
                var erxR = erxM ? parseFloat(erxM[1]) : 0, eryR = eryM ? parseFloat(eryM[1]) : 0;
                if (erxR > 0 && eryR > 0) dMatches.push(ellipseToPathD(ecxR, ecyR, erxR, eryR));
            }

            var rectRegex = /<rect[^>]*>/gi;
            while ((match = rectRegex.exec(svgString)) !== null) {
                var rmx = /\bx=["']([^"']+)["']/i.exec(match[0]);
                var rmy = /\by=["']([^"']+)["']/i.exec(match[0]);
                var rmw = /\bwidth=["']([^"']+)["']/i.exec(match[0]);
                var rmh = /\bheight=["']([^"']+)["']/i.exec(match[0]);
                var rmrx = /\brx=["']([^"']+)["']/i.exec(match[0]);
                var rmry = /\bry=["']([^"']+)["']/i.exec(match[0]);
                var rrxV = rmx ? parseFloat(rmx[1]) : 0, rryV = rmy ? parseFloat(rmy[1]) : 0;
                var rrwV = rmw ? parseFloat(rmw[1]) : 0, rrhV = rmh ? parseFloat(rmh[1]) : 0;
                if (rrwV > 0 && rrhV > 0) {
                    dMatches.push(rectToPathD(rrxV, rryV, rrwV, rrhV, rmrx ? parseFloat(rmrx[1]) : 0, rmry ? parseFloat(rmry[1]) : 0));
                }
            }

            var lineRegex = /<line[^>]*>/gi;
            while ((match = lineRegex.exec(svgString)) !== null) {
                var lx1M = /\bx1=["']([^"']+)["']/i.exec(match[0]);
                var ly1M = /\by1=["']([^"']+)["']/i.exec(match[0]);
                var lx2M = /\bx2=["']([^"']+)["']/i.exec(match[0]);
                var ly2M = /\by2=["']([^"']+)["']/i.exec(match[0]);
                dMatches.push('M ' + (lx1M ? parseFloat(lx1M[1]) : 0) + ' ' + (ly1M ? parseFloat(ly1M[1]) : 0) + ' L ' + (lx2M ? parseFloat(lx2M[1]) : 0) + ' ' + (ly2M ? parseFloat(ly2M[1]) : 0));
            }

            if (dMatches.length === 0) {
                var trimmed = svgString.trim();
                // Allow valid SVG path commands including scientific notation (e.g. 1e-5)
                if (/^[a-z\s\d.,+-]+$/i.test(trimmed) && /[ml]/i.test(trimmed)) {
                    dMatches.push(trimmed);
                } else {
                    return { ok: false, error: 'لم يتم العثور على أشكال أو مسارات متجهة صالحة في كود SVG.' };
                }
            }

            dMatches.forEach(function (d) {
                var sps = parseSvgPathD(d);
                sps.forEach(function (sp) {
                    if (sp.vertices.length >= 2) allSubPaths.push(sp);
                });
            });
        }

        if (allSubPaths.length === 0) {
            return { ok: false, error: 'تعذر استخراج نقاط التحكم من مسارات SVG.' };
        }

        var bounds = calculateBounds(allSubPaths);
        var normalized = allSubPaths;

        if (autoFit) {
            normalized = normalizeTo256(allSubPaths, bounds, padding);
            bounds = calculateBounds(normalized);
        }

        var combinedD = normalized.map(function (sp) {
            return subPathToD(sp);
        }).filter(function (d) { return Boolean(d); }).join(' ');

        var svgMarkup = '<path fill-rule="evenodd" d="' + combinedD + '" />';

        var totalVertices = normalized.reduce(function (acc, sp) { return acc + sp.vertices.length; }, 0);

        return {
            ok: true,
            subPaths: normalized,
            svgMarkup: svgMarkup,
            bounds: bounds,
            stats: {
                pathsCount: normalized.length,
                verticesCount: totalVertices,
                width: Math.round(bounds.maxX - bounds.minX),
                height: Math.round(bounds.maxY - bounds.minY)
            }
        };
    }

    /**
     * Compute AE Vector payload with 256x256 scaling and anchor shift
     */
    function computeAeVector(shapeId, targetRadius, anchorId) {
        var shape = shapeMap[shapeId] || shapeMap['circle'];
        var ancKey = anchorId || shape.defaultAnchor || 'center';
        var anchor = ANCHORS[ancKey] || ANCHORS['center'];

        // In our system targetRadius represents the half-size (e.g. radius for circle, half-extent)
        // Full dimension = targetRadius * 2
        var scale = (targetRadius * 2) / 256;

        var computedSubPaths = [];
        var maxExtent = targetRadius;

        shape.subPaths.forEach(function (sp) {
            var newVerts = [];
            var newInT = [];
            var newOutT = [];

            for (var v = 0; v < sp.vertices.length; v++) {
                var vx = (sp.vertices[v][0] - anchor.x) * scale;
                var vy = (sp.vertices[v][1] - anchor.y) * scale;
                newVerts.push([vx, vy]);

                var dist = Math.sqrt(vx * vx + vy * vy);
                if (dist > maxExtent) maxExtent = dist;

                newInT.push([
                    sp.inTangents[v][0] * scale,
                    sp.inTangents[v][1] * scale
                ]);
                newOutT.push([
                    sp.outTangents[v][0] * scale,
                    sp.outTangents[v][1] * scale
                ]);
            }

            computedSubPaths.push({
                vertices: newVerts,
                inTangents: newInT,
                outTangents: newOutT,
                closed: (sp.closed !== false)
            });
        });

        var scaledBounds = calculateBounds(computedSubPaths);
        var b256 = calculateBounds(shape.subPaths);
        var lcX = (shape.labelCenter && shape.labelCenter.length === 2) ? shape.labelCenter[0] : ((b256.minX + b256.maxX) / 2);
        var lcY = (shape.labelCenter && shape.labelCenter.length === 2) ? shape.labelCenter[1] : ((b256.minY + b256.maxY) / 2);
        var centerOffset = [(lcX - anchor.x) * scale, (lcY - anchor.y) * scale];

        return {
            shapeId: shape.id,
            anchorId: ancKey,
            isHollow: (shape.isHollow === true),
            subPaths: computedSubPaths,
            bounds: scaledBounds,
            centerOffset: centerOffset,
            extent: maxExtent
        };
    }

    /**
     * Build SVG string for display in UI
     */
    function getSvgMarkup(shapeId, color, size, isHollowOverride) {
        var shape = shapeMap[shapeId] || shapeMap['circle'];
        var c = color || 'currentColor';
        var s = size || 22;
        var hollow = (isHollowOverride !== undefined) ? Boolean(isHollowOverride) : (shape.isHollow === true);
        var styleStr = (hollow && shape.id !== 'ring' && shape.id !== 'tick' && shape.id !== 'hud_bracket')
            ? ('color:' + c + '; fill: none; stroke: currentColor; stroke-width: 18; stroke-linecap: round; stroke-linejoin: round; display:block;')
            : ('color:' + c + '; fill: currentColor; display:block;');
        return '<svg viewBox="0 0 256 256" width="' + s + '" height="' + s + '" style="' + styleStr + '">' + shape.svg + '</svg>';
    }

    return {
        ANCHORS: ANCHORS,
        SHAPES: SHAPES,
        getShapeById: function (id) {
            return shapeMap[id] || shapeMap['circle'];
        },
        getAllShapes: function () {
            return SHAPES.concat(customShapes);
        },
        getCustomShapes: function () {
            return customShapes.slice();
        },
        addCustomShape: addCustomShape,
        removeCustomShape: removeCustomShape,
        parseSvgString: parseSvgString,
        getSvgMarkup: getSvgMarkup,
        computeAeVector: computeAeVector
    };
}));

