var TR = $.global.MASAR || $.global.TIME_RULER;
if (typeof TR === "undefined") {
    TR = {};
    $.global.MASAR = TR;
    $.global.TIME_RULER = TR;
}
$.global.MASAR = TR;
$.global.TIME_RULER = TR;

TR.product = "MASAR";
TR.version = "1.0.0";
TR.ready = true;

// Install JSON support with pure ES3 embedded fallback (no external #include required)
if (typeof TR.JSON !== "object" || TR.JSON === null) {
    TR.JSON = (function () {
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", "\"": "\\\"", "\\": "\\\\" };

        function es3Quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string)
                ? "\"" + string.replace(escapable, function (a) {
                    var c = meta[a];
                    return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                }) + "\""
                : "\"" + string + "\"";
        }

        function es3Stringify(val) {
            var i, k, v, partial;
            if (val === null || val === undefined) return "null";
            var t = typeof val;
            if (t === "string") return es3Quote(val);
            if (t === "number") return isFinite(val) ? String(val) : "null";
            if (t === "boolean") return String(val);
            if (t === "object") {
                if (Object.prototype.toString.apply(val) === "[object Array]") {
                    partial = [];
                    for (i = 0; i < val.length; i += 1) {
                        partial[i] = (val[i] === undefined || typeof val[i] === "function") ? "null" : es3Stringify(val[i]);
                    }
                    return "[" + partial.join(",") + "]";
                }
                partial = [];
                for (k in val) {
                    if (Object.prototype.hasOwnProperty.call(val, k)) {
                        if (val[k] !== undefined && typeof val[k] !== "function") {
                            v = es3Stringify(val[k]);
                            partial.push(es3Quote(k) + ":" + v);
                        }
                    }
                }
                return "{" + partial.join(",") + "}";
            }
            return "null";
        }

        function es3Parse(text) {
            var t = String(text);
            cx.lastIndex = 0;
            if (cx.test(t)) {
                t = t.replace(cx, function (a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/.test(t
                .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                return eval("(" + t + ")");
            }
            throw new SyntaxError("JSON.parse");
        }

        function getJson() {
            if (typeof JSON !== "undefined" && JSON !== null &&
                typeof JSON.parse === "function" && typeof JSON.stringify === "function") {
                return JSON;
            }
            return null;
        }
        return {
            parse: function (s) {
                if (typeof s !== "string" || s.length === 0) return null;
                try {
                    var j = getJson();
                    return j ? j.parse(s) : es3Parse(s);
                } catch (e) { return null; }
            },
            stringify: function (o) {
                try {
                    var j = getJson();
                    return j ? j.stringify(o) : es3Stringify(o);
                } catch (e) { return "{}"; }
            }
        };
    })();
}
