#!/usr/bin/env node
'use strict';

/**
 * MASAR Host Bundler (host/src/*.jsx -> host/bootstrap.jsx)
 * Concatenates modular ExtendScript ES3 files into a single AE-ready bootstrap.jsx
 * and validates the bundle with lint-es3-host.js.
 */

const fs = require('fs');
const path = require('path');
const { lintSource } = require('./lint-es3-host.js');

const MASAR_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(MASAR_ROOT, 'host', 'src');
const OUT_FILE = path.join(MASAR_ROOT, 'host', 'bootstrap.jsx');

function buildHost(options) {
    options = options || {};
    if (!fs.existsSync(SRC_DIR)) {
        throw new Error('Missing host/src directory: ' + SRC_DIR);
    }

    const files = fs.readdirSync(SRC_DIR)
        .filter(function (f) { return f.endsWith('.jsx'); })
        .sort();

    if (files.length === 0) {
        throw new Error('No .jsx source modules found in host/src');
    }

    const header = [
        '/**',
        ' * MASAR PRO - host/bootstrap.jsx (Built from host/src/*.jsx)',
        ' * Generated automatically by scripts/build-host.js — edit modules in host/src/.',
        ' * Strictly ES3 + Canonical Adobe Match Names (no #include required).',
        ' */',
        ''
    ].join('\n');

    const chunks = [header];
    for (let i = 0; i < files.length; i++) {
        const fname = files[i];
        const fullPath = path.join(SRC_DIR, fname);
        const content = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n').trim();
        chunks.push('// ============================================================================');
        chunks.push('// MODULE: host/src/' + fname);
        chunks.push('// ============================================================================');
        chunks.push(content);
        chunks.push('');
    }

    const bundled = chunks.join('\n');
    const lintRes = lintSource(bundled, 'host/bootstrap.jsx');
    if (!lintRes.ok) {
        const msg = lintRes.errors.map(function (e) {
            return 'Line ' + e.line + ' [' + e.rule + ']: ' + e.message;
        }).join('\n');
        throw new Error('ES3 / AE Locale Lint failed on generated host/bootstrap.jsx:\n' + msg);
    }

    if (!options.dryRun) {
        fs.writeFileSync(OUT_FILE, bundled.replace(/\n/g, '\r\n'), 'utf8');
    }

    return {
        ok: true,
        modules: files,
        lineCount: bundled.split('\n').length,
        outFile: OUT_FILE,
        lintResult: lintRes,
        content: bundled
    };
}

if (require.main === module) {
    try {
        const isCheckOnly = process.argv.indexOf('--check') !== -1;
        const res = buildHost({ dryRun: isCheckOnly });
        if (isCheckOnly) {
            if (!fs.existsSync(OUT_FILE)) {
                console.error('[BUILD-HOST CHECK FAIL] host/bootstrap.jsx is missing. Run node scripts/build-host.js');
                process.exit(1);
            }
            const existing = fs.readFileSync(OUT_FILE, 'utf8').replace(/\r\n/g, '\n');
            if (existing !== res.content) {
                console.error('[BUILD-HOST CHECK FAIL] host/bootstrap.jsx is out of sync with host/src/*.jsx. Run node scripts/build-host.js');
                process.exit(1);
            }
            console.log('[BUILD-HOST CHECK PASS] host/bootstrap.jsx is in sync with ' + res.modules.length + ' modules.');
        } else {
            console.log('[BUILD-HOST PASS] Bundled ' + res.modules.length + ' modules (' + res.lineCount + ' lines) -> host/bootstrap.jsx');
            console.log('[LINT-ES3 PASS] host/bootstrap.jsx passed strict ES3 & AE Locale Guard (0 violations).');
        }
    } catch (err) {
        console.error('[BUILD-HOST FAIL] ' + (err && err.message ? err.message : err));
        process.exit(1);
    }
}

module.exports = {
    SRC_DIR: SRC_DIR,
    OUT_FILE: OUT_FILE,
    buildHost: buildHost
};
