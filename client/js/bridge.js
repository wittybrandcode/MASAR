/* =============================================================================
   TIME RULER — client/js/bridge.js
   The single client→host channel. Every evalScript call goes through here;
   no other client module may call evalScript directly.
   - Detects the CEP environment (window.cep + CSInterface).
   - Resolves extension root path and ensures host bootstrap is loaded.
   - Wraps every ExtendScript call in try/catch to guarantee a JSON envelope.
   - Offline mode: host calls resolve with a fake NO_CEP_HOST envelope.
   - FIFO queue: exactly one evalScript in flight; next call starts after
     the previous callback.
   Plain JavaScript (ES2017 max).
   ========================================================================== */

var TIME_RULER_BRIDGE = (function () {
    'use strict';

    var csInterface = null;
    var available = false;
    var initialized = false;
    var busy = false;          /* true while one evalScript is in flight */
    var queue = [];            /* FIFO of { fnName, json, callback } */
    var hostDir = '';          /* absolute path to the extension host directory */

    /* ------------------------------------------------------------------ */
    /* CEP detection & host initialization                                 */
    /* ------------------------------------------------------------------ */

    function init() {
        if (initialized) { return available; }
        initialized = true;
        try {
            if (typeof window !== 'undefined' &&
                window.cep &&
                typeof CSInterface !== 'undefined') {
                csInterface = new CSInterface();
                available = true;

                try {
                    var extPath = csInterface.getSystemPath(SystemPath.EXTENSION);
                    if (extPath) {
                        extPath = extPath.replace(/\\/g, '/');
                        if (extPath.charAt(extPath.length - 1) === '/') {
                            extPath = extPath.slice(0, extPath.length - 1);
                        }
                        hostDir = extPath + '/host';
                    }
                } catch (eInit) {}
            }
        } catch (err) {
            csInterface = null;
            available = false;
        }
        return available;
    }

    function isAvailable() { return available; }
    function isBusy() { return busy; }

    /* ------------------------------------------------------------------ */
    /* Safe JSON embedding into an evalScript literal                      */
    /* ------------------------------------------------------------------ */

    function quoteForEvalScript(jsonString) {
        return JSON.stringify(String(jsonString));
    }

    /* ------------------------------------------------------------------ */
    /* Envelope normalization                                              */
    /* ------------------------------------------------------------------ */

    function fakeEnvelope(fnName) {
        return {
            ok: false,
            code: 'NO_CEP_HOST',
            message: 'Host call "' + fnName + '" skipped: CEP host not available ' +
                     '(panel is not running inside After Effects, or CSInterface.js is missing).',
            data: null,
            warnings: []
        };
    }

    /* Host contract: every response is a JSON string envelope
       { ok, code, message, data, warnings }. Parse defensively; never eval. */
    function parseEnvelope(result) {
        if (result === undefined || result === null || (typeof result === 'string' && result.trim().length === 0)) {
            return {
                ok: false,
                code: 'EMPTY_HOST_RESPONSE',
                message: 'Host returned an empty response. (ExtendScript engine did not return a value).',
                data: null,
                warnings: []
            };
        }
        var parsed;
        try {
            parsed = JSON.parse(result);
        } catch (err) {
            return {
                ok: false,
                code: 'INVALID_HOST_RESPONSE',
                message: String(err) + ' raw:' + String(result).slice(0, 200),
                data: null,
                warnings: []
            };
        }
        if (!parsed || typeof parsed !== 'object' || typeof parsed.ok !== 'boolean') {
            return {
                ok: false,
                code: 'INVALID_HOST_RESPONSE',
                message: 'Host returned a non-envelope value. raw:' + String(result).slice(0, 200),
                data: null,
                warnings: []
            };
        }
        if (!Array.isArray(parsed.warnings)) {
            parsed.warnings = [];
        }
        return parsed;
    }

    /* ------------------------------------------------------------------ */
    /* Call queue                                                          */
    /* ------------------------------------------------------------------ */

    function callHost(fnName, payloadObject, callback) {
        var json = JSON.stringify(payloadObject || {});
        if (!available) {
            /* Offline mode: resolve immediately with an honest fake envelope. */
            if (typeof callback === 'function') {
                callback(fakeEnvelope(fnName));
            }
            return;
        }

        // Live-sync optimization: if queuing a 'generate' call while other 'generate'
        // calls are already waiting in the queue, replace them with this latest payload
        // so we never backlog After Effects during slider scrubbing or rapid typing.
        if (fnName === 'generate') {
            for (var i = queue.length - 1; i >= 0; i--) {
                if (queue[i].fnName === 'generate') {
                    queue.splice(i, 1);
                }
            }
        }

        queue.push({ fnName: fnName, json: json, callback: callback });
        pump();
    }

    function pump() {
        if (busy) { return; }
        var job = queue.shift();
        if (!job) { return; }
        busy = true;

        var hostDirArg = hostDir ? JSON.stringify(hostDir) : '""';
        var script =
            '(function() {\n' +
            '    try {\n' +
            '        if ((typeof MASAR === "undefined" || typeof MASAR.dispatch !== "function") && (typeof TIME_RULER === "undefined" || typeof TIME_RULER.dispatch !== "function")) {\n' +
            '            var bFile = new File(' + hostDirArg + ' + "/bootstrap.jsx");\n' +
            '            if (bFile.exists) {\n' +
            '                $.evalFile(bFile);\n' +
            '            }\n' +
            '        }\n' +
            '        if (typeof MASAR !== "undefined" && typeof MASAR.dispatch === "function") {\n' +
            '            return MASAR.dispatch(' + JSON.stringify(job.fnName) + ', ' + quoteForEvalScript(job.json) + ');\n' +
            '        }\n' +
            '        if (typeof TIME_RULER !== "undefined" && typeof TIME_RULER.dispatch === "function") {\n' +
            '            return TIME_RULER.dispatch(' + JSON.stringify(job.fnName) + ', ' + quoteForEvalScript(job.json) + ');\n' +
            '        }\n' +
            '        return "{\\"ok\\":false,\\"code\\":\\"HOST_NOT_READY\\",\\"message\\":\\"Host engine is not loaded.\\",\\"data\\":null,\\"warnings\\":[]}";\n' +
            '    } catch (e) {\n' +
            '        return "{\\"ok\\":false,\\"code\\":\\"HOST_EXCEPTION\\",\\"message\\":\\"" + String(e) + "\\",\\"data\\":null,\\"warnings\\":[]}";\n' +
            '    }\n' +
            '})();';

        var settled = false;
        var callTimeout = window.setTimeout(function () {
            if (settled) { return; }
            settled = true;
            if (busy) {
                busy = false;
                if (typeof job.callback === 'function') {
                    try {
                        job.callback({ ok: false, code: 'TIMEOUT', message: 'ExtendScript call timed out. Click OK on any After Effects alert dialog if visible.' });
                    } catch (eCb) {}
                }
                pump();
            }
        }, 15000);

        csInterface.evalScript(script, function (result) {
            if (settled) { return; }
            settled = true;
            window.clearTimeout(callTimeout);
            busy = false;
            var envelope = parseEnvelope(result);
            if (typeof job.callback === 'function') {
                try {
                    job.callback(envelope);
                } catch (err) {
                    /* A broken callback must never stall the queue. */
                }
            }
            pump(); /* start the next queued call */
        });
    }

    /* Public API ------------------------------------------------------- */
    return {
        init: init,
        isAvailable: isAvailable,
        isBusy: isBusy,
        callHost: callHost,
        quoteForEvalScript: quoteForEvalScript,
        parseEnvelope: parseEnvelope,
        resetQueue: function () { busy = false; queue = []; }
    };
})();
