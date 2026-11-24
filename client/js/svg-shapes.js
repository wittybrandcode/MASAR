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

    // Visual intuitive anchor mapping:
    // In AE 2D space, (0,0) is at the track node. +Y is downwards, -Y is upwards. +X is right, -X is left.
    // When user selects "Top" (أعلى), the shape must sit ABOVE the track (vy <= 0, so anchor.y = 256).
    // When user selects "Bottom" (أسفل), the shape must sit BELOW the track (vy >= 0, so anchor.y = 0).
    // When user selects "Left" (يسار), the shape must sit to the LEFT of the node (vx <= 0, so anchor.x = 256).
    // When user selects "Right" (يمين), the shape must sit to the RIGHT of the node (vx >= 0, so anchor.x = 0).
    var ANCHORS = {
        'top-left':      { id: 'top-left',      name: 'أعلى اليسار', x: 256, y: 256 },
        'top-center':    { id: 'top-center',    name: 'أعلى الوسط', x: 128, y: 256 },
        'top-right':     { id: 'top-right',     name: 'أعلى اليمين', x: 0,   y: 256 },
        'middle-left':   { id: 'middle-left',   name: 'وسط اليسار', x: 256, y: 128 },
        'center':        { id: 'center',        name: 'المركز (على المسار)', x: 128, y: 128 },
        'middle-right':  { id: 'middle-right',  name: 'وسط اليمين', x: 0,   y: 128 },
        'bottom-left':   { id: 'bottom-left',   name: 'أسفل اليسار', x: 256, y: 0 },
        'bottom-center': { id: 'bottom-center', name: 'أسفل الوسط', x: 128, y: 0 },
        'bottom-right':  { id: 'bottom-right',  name: 'أسفل اليمين', x: 0,   y: 0 }
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

    /* ------------------------------------------------------------------ */
    /* Custom Shapes Persistence (localStorage)                            */
    /* ------------------------------------------------------------------ */

    var STORAGE_CUSTOM_SHAPES_KEY = 'TIME_RULER_CUSTOM_SHAPES_V1';
    var customShapes = [];

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
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_CUSTOM_SHAPES_KEY, JSON.stringify(customShapes));
            }
        } catch (e) {
            console.error('Failed to save custom shapes:', e);
        }
    }

    // Auto-load custom shapes on initialization
    loadCustomShapes();

    function addCustomShape(shapeDef) {
        if (!shapeDef || !shapeDef.id || !shapeDef.subPaths) return null;
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
        saveCustomShapes();
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

    function parseSvgPathD(d) {
        if (!d || typeof d !== 'string') return [];

        var cmdRegex = /([a-df-z])([^a-df-z]*)/gi;
        var numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;

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
            var argsStr = match[2];
            var args = [];
            var numMatch;
            while ((numMatch = numRegex.exec(argsStr)) !== null) {
                args.push(parseFloat(numMatch[0]));
            }

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
        subPaths.forEach(function (sp) {
            sp.vertices.forEach(function (v) {
                if (v[0] < minX) minX = v[0];
                if (v[1] < minY) minY = v[1];
                if (v[0] > maxX) maxX = v[0];
                if (v[1] > maxY) maxY = v[1];
            });
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

        var dMatches = [];

        // In browser DOM environment, use DOMParser
        if (typeof DOMParser !== 'undefined') {
            try {
                var parser = new DOMParser();
                var doc = parser.parseFromString(svgString, 'image/svg+xml');
                var parserError = doc.querySelector('parsererror');
                if (!parserError) {
                    // Extract all geometry elements
                    var pathEls = doc.querySelectorAll('path');
                    for (var p = 0; p < pathEls.length; p++) {
                        var d = pathEls[p].getAttribute('d');
                        if (d) dMatches.push(d);
                    }

                    var polyEls = doc.querySelectorAll('polygon, polyline');
                    for (var pl = 0; pl < polyEls.length; pl++) {
                        var pts = polyEls[pl].getAttribute('points');
                        if (pts) {
                            dMatches.push('M ' + pts.trim().replace(/\s+/g, ' L ') + (polyEls[pl].tagName === 'polygon' ? ' Z' : ''));
                        }
                    }

                    var rectEls = doc.querySelectorAll('rect');
                    for (var r = 0; r < rectEls.length; r++) {
                        var rx = parseFloat(rectEls[r].getAttribute('x')) || 0;
                        var ry = parseFloat(rectEls[r].getAttribute('y')) || 0;
                        var rw = parseFloat(rectEls[r].getAttribute('width')) || 0;
                        var rh = parseFloat(rectEls[r].getAttribute('height')) || 0;
                        if (rw > 0 && rh > 0) {
                            dMatches.push('M ' + rx + ' ' + ry + ' h ' + rw + ' v ' + rh + ' h -' + rw + ' Z');
                        }
                    }

                    var circEls = doc.querySelectorAll('circle');
                    for (var c = 0; c < circEls.length; c++) {
                        var cx = parseFloat(circEls[c].getAttribute('cx')) || 0;
                        var cy = parseFloat(circEls[c].getAttribute('cy')) || 0;
                        var cr = parseFloat(circEls[c].getAttribute('r')) || 0;
                        if (cr > 0) {
                            var ck = cr * KAPPA;
                            dMatches.push('M ' + cx + ' ' + (cy - cr) + ' C ' + (cx + ck) + ' ' + (cy - cr) + ', ' + (cx + cr) + ' ' + (cy - ck) + ', ' + (cx + cr) + ' ' + cy + ' C ' + (cx + cr) + ' ' + (cy + ck) + ', ' + (cx + ck) + ' ' + (cy + cr) + ', ' + cx + ' ' + (cy + cr) + ' C ' + (cx - ck) + ' ' + (cy + cr) + ', ' + (cx - cr) + ' ' + (cy + ck) + ', ' + (cx - cr) + ' ' + cy + ' C ' + (cx - cr) + ' ' + (cy - ck) + ', ' + (cx - ck) + ' ' + (cy - cr) + ', ' + cx + ' ' + (cy - cr) + ' Z');
                        }
                    }
                }
            } catch (e) {
                console.warn('DOMParser failed, falling back to regex:', e);
            }
        }

        // Regex fallback if DOMParser didn't find paths
        if (dMatches.length === 0) {
            var dRegex = /<path[^>]*\bd=["']([^"']+)["'][^>]*>/gi;
            var match;
            while ((match = dRegex.exec(svgString)) !== null) {
                dMatches.push(match[1]);
            }

            var polyRegex = /<polygon[^>]*\bpoints=["']([^"']+)["'][^>]*>/gi;
            while ((match = polyRegex.exec(svgString)) !== null) {
                dMatches.push('M ' + match[1].trim().replace(/\s+/g, ' L ') + ' Z');
            }

            if (dMatches.length === 0) {
                // Check if user pasted pure d string: "M 10 10 L 90 90 Z"
                if (/^[a-df-z\s\d.,+-]+$/i.test(svgString.trim())) {
                    dMatches.push(svgString.trim());
                } else {
                    return { ok: false, error: 'لم يتم العثور على أشكال أو مسارات متجهة صالحة في كود SVG.' };
                }
            }
        }

        var allSubPaths = [];
        dMatches.forEach(function (d) {
            var sps = parseSvgPathD(d);
            sps.forEach(function (sp) {
                if (sp.vertices.length >= 2) allSubPaths.push(sp);
            });
        });

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

        return {
            shapeId: shape.id,
            anchorId: ancKey,
            isHollow: (shape.isHollow === true),
            subPaths: computedSubPaths,
            extent: maxExtent
        };
    }

    /**
     * Build SVG string for display in UI
     */
    function getSvgMarkup(shapeId, color, size) {
        var shape = shapeMap[shapeId] || shapeMap['circle'];
        var c = color || 'currentColor';
        var s = size || 22;
        return '<svg viewBox="0 0 256 256" width="' + s + '" height="' + s + '" style="color:' + c + '; fill: currentColor; display:block;">' + shape.svg + '</svg>';
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

