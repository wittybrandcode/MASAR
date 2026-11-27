#!/usr/bin/env node
'use strict';

/**
 * MASAR Static Quality Gate for ExtendScript ES3 Host Code (host/bootstrap.jsx)
 * Checks:
 *   1. ES6+ syntax leakage (let, const, class, =>, backtick templates, spread, for..of, trailing commas, bare reserved keys)
 *   2. AE Locale Guard: forbids English display names inside .property("...") outside authorized Match-Name helpers / custom Effects
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_AE_DISPLAY_NAMES = new Set([
    'Source Text',
    'Position',
    'Anchor Point',
    'Contents',
    'Fill Color',
    'Stroke Color',
    'Stroke Width',
    'Text Document',
    'Path'
]);

const AUTHORIZED_HELPER_FUNCTIONS = new Set([
    'getShapeLayerContents',
    'getVectorGroupContents',
    'getProp',
    'getTextDocumentProp'
]);

const CUSTOM_EFFECT_NAMES = new Set([
    'Fill Color',
    'Stroke Color'
]);

const REGEX_PREV_KEYWORDS = new Set([
    'return', 'typeof', 'void', 'delete', 'throw', 'in', 'instanceof', 'new', 'case', 'else'
]);

/**
 * Strip JS comments, string literals, and regex literals while preserving newlines
 * so character offsets and 1-based line numbers match the original file.
 */
function stripCommentsAndStrings(src) {
    const out = [];
    const stringLiterals = [];
    const n = src.length;
    let i = 0;
    let line = 1;
    let prevNonWsToken = '';

    function pushNewlinesOrSpace(ch) {
        if (ch === '\n') {
            line++;
            out.push('\n');
        } else {
            out.push(' ');
        }
    }

    while (i < n) {
        const ch = src[i];
        const next = (i + 1 < n) ? src[i + 1] : '';

        // 1. Line comment // ...
        if (ch === '/' && next === '/') {
            while (i < n && src[i] !== '\n') {
                out.push(' ');
                i++;
            }
            continue;
        }

        // 2. Block comment /* ... */
        if (ch === '/' && next === '*') {
            out.push(' ');
            out.push(' ');
            i += 2;
            while (i < n) {
                if (src[i] === '*' && i + 1 < n && src[i + 1] === '/') {
                    out.push(' ');
                    out.push(' ');
                    i += 2;
                    break;
                }
                pushNewlinesOrSpace(src[i]);
                i++;
            }
            continue;
        }

        // 3. String literal ("..." or '...')
        if (ch === '"' || ch === "'") {
            const quote = ch;
            const startOffset = i;
            const startLine = line;
            let rawVal = '';
            out.push(quote);
            i++;
            while (i < n) {
                const sc = src[i];
                if (sc === '\\' && i + 1 < n) {
                    rawVal += src[i + 1];
                    out.push(' ');
                    pushNewlinesOrSpace(src[i + 1]);
                    i += 2;
                    continue;
                }
                if (sc === quote) {
                    out.push(quote);
                    i++;
                    break;
                }
                rawVal += sc;
                pushNewlinesOrSpace(sc);
                i++;
            }
            stringLiterals.push({ value: rawVal, line: startLine, start: startOffset, end: i });
            prevNonWsToken = quote;
            continue;
        }

        // 4. Regex literal /.../flags (context-sensitive)
        if (ch === '/' && next !== '/' && next !== '*') {
            const canStartRegex = (
                prevNonWsToken === '' ||
                '=(,[{:!&|?~+-*%^;'.indexOf(prevNonWsToken) !== -1 ||
                REGEX_PREV_KEYWORDS.has(prevNonWsToken)
            );
            if (canStartRegex) {
                let inClass = false;
                out.push(' ');
                i++;
                while (i < n) {
                    const rc = src[i];
                    if (rc === '\\' && i + 1 < n) {
                        out.push(' ');
                        pushNewlinesOrSpace(src[i + 1]);
                        i += 2;
                        continue;
                    }
                    if (rc === '\n' || rc === '\r') break;
                    if (rc === '[') inClass = true;
                    else if (rc === ']') inClass = false;
                    else if (rc === '/' && !inClass) {
                        out.push(' ');
                        i++;
                        while (i < n && /[a-zA-Z]/.test(src[i])) {
                            out.push(' ');
                            i++;
                        }
                        break;
                    }
                    out.push(' ');
                    i++;
                }
                prevNonWsToken = 'regex';
                continue;
            }
        }

        // 5. Normal code character
        out.push(ch);
        if (ch === '\n') {
            line++;
        } else if (!/\s/.test(ch)) {
            if (/[a-zA-Z0-9_$]/.test(ch)) {
                let tok = ch;
                let j = i + 1;
                while (j < n && /[a-zA-Z0-9_$]/.test(src[j])) {
                    tok += src[j];
                    out.push(src[j]);
                    j++;
                }
                prevNonWsToken = tok;
                i = j;
                continue;
            }
            prevNonWsToken = ch;
        }
        i++;
    }

    return {
        stripped: out.join(''),
        stringLiterals: stringLiterals
    };
}

function getLineNumber(text, offset) {
    let line = 1;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') line++;
    }
    return line;
}

function getLineSnippet(src, lineNum) {
    const lines = src.split(/\r?\n/);
    const raw = lines[lineNum - 1] || '';
    return raw.trim().slice(0, 120);
}

/**
 * Determine which top-level or enclosing function name owns a given offset in stripped code.
 */
function findEnclosingFunctionName(stripped, offset) {
    const prefix = stripped.slice(0, offset);
    const fnRe = /\bfunction\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g;
    let lastFn = null;
    let m;
    while ((m = fnRe.exec(prefix)) !== null) {
        lastFn = { name: m[1], bodyStart: m.index + m[0].length };
    }
    if (!lastFn) return '';
    let depth = 1;
    for (let i = lastFn.bodyStart; i < offset && depth > 0; i++) {
        if (stripped[i] === '{') depth++;
        else if (stripped[i] === '}') depth--;
    }
    return (depth > 0) ? lastFn.name : '';
}

function lintSource(src, filename) {
    const label = filename || '<inline>';
    const errors = [];
    const { stripped } = stripCommentsAndStrings(src);

    function addError(rule, offsetOrLine, message) {
        const line = (typeof offsetOrLine === 'number' && offsetOrLine >= 1)
            ? getLineNumber(src, offsetOrLine)
            : 1;
        errors.push({
            file: label,
            line: line,
            rule: rule,
            message: message,
            snippet: getLineSnippet(src, line)
        });
    }

    // Check 1: Disallowed ES6+ syntax patterns (outside stripped comments/strings/regex)
    const syntaxPatterns = [
        { rule: 'ES3_NO_LET', re: /\blet\b/g, msg: 'Forbidden ES6 keyword "let" (use "var" in ExtendScript ES3)' },
        { rule: 'ES3_NO_CONST', re: /\bconst\b/g, msg: 'Forbidden ES6 keyword "const" (use "var" in ExtendScript ES3)' },
        { rule: 'ES3_NO_CLASS', re: /\bclass\b/g, msg: 'Forbidden ES6 keyword "class" in ExtendScript ES3' },
        { rule: 'ES3_NO_EXTENDS', re: /\bextends\b/g, msg: 'Forbidden ES6 keyword "extends" in ExtendScript ES3' },
        { rule: 'ES3_NO_ASYNC_AWAIT', re: /\b(?:async|await|yield)\b/g, msg: 'Forbidden ES6+ async/generator keyword in ExtendScript ES3' },
        { rule: 'ES3_NO_MODULES', re: /\b(?:import|export)\b/g, msg: 'Forbidden ES6 module keyword in ExtendScript ES3' },
        { rule: 'ES3_NO_ARROW', re: /=>/g, msg: 'Forbidden ES6 arrow function "=>" in ExtendScript ES3' },
        { rule: 'ES3_NO_TEMPLATE', re: /`/g, msg: 'Forbidden ES6 template literal backtick "`" in ExtendScript ES3' },
        { rule: 'ES3_NO_SPREAD', re: /\.\.\./g, msg: 'Forbidden ES6 spread/rest operator "..." in ExtendScript ES3' },
        { rule: 'ES3_NO_FOR_OF', re: /\bfor\s*\([^;)]*\bof\b/g, msg: 'Forbidden ES6 for..of loop in ExtendScript ES3' },
        { rule: 'ES3_NO_TRAILING_COMMA', re: /,\s*[\]\}]/g, msg: 'Forbidden trailing comma before ] or } in ExtendScript ES3' },
        {
            rule: 'ES3_NO_BARE_RESERVED_PROP',
            re: /\.\s*(?:break|case|catch|continue|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|this|throw|try|typeof|var|void|while|with|class|const|enum|export|extends|import|super)\b/g,
            msg: 'Reserved keyword accessed as unquoted dot property (use bracket notation)'
        }
    ];

    for (let p = 0; p < syntaxPatterns.length; p++) {
        const pat = syntaxPatterns[p];
        let m;
        pat.re.lastIndex = 0;
        while ((m = pat.re.exec(stripped)) !== null) {
            // Allow reserved property only if not a false numeric decimal like 1.in? Wait: dot after word/bracket/paren
            addError(pat.rule, m.index, pat.msg);
        }
    }

    // Check 2: AE Locale Guard on .property("...") calls
    const propCallRe = /([a-zA-Z0-9_$\]\)]+)\s*\.\s*property\s*\(\s*(["'])([^"']+)\2\s*\)/g;
    let pm;
    while ((pm = propCallRe.exec(src)) !== null) {
        // Ignore if inside stripped comment
        if (stripped[pm.index] === ' ') continue;
        const receiver = pm[1];
        const propName = pm[3];
        if (!FORBIDDEN_AE_DISPLAY_NAMES.has(propName)) continue;

        const fnName = findEnclosingFunctionName(stripped, pm.index);
        if (AUTHORIZED_HELPER_FUNCTIONS.has(fnName)) {
            continue;
        }
        const isEffectReceiver = /(?:^|[a-z_])fx(?:Group)?$/i.test(receiver);
        if (isEffectReceiver && CUSTOM_EFFECT_NAMES.has(propName)) {
            continue;
        }

        addError(
            'AE_LOCALE_ENGLISH_PROPERTY',
            pm.index,
            'Forbidden English AE display property "' + propName + '" via .property() outside canonical helpers (use ADBE Match Name or getProp)'
        );
    }

    return {
        ok: errors.length === 0,
        file: label,
        errors: errors
    };
}

if (require.main === module) {
    const targetArg = process.argv[2];
    const targetPath = targetArg
        ? path.resolve(process.cwd(), targetArg)
        : path.resolve(__dirname, '../host/bootstrap.jsx');

    if (!fs.existsSync(targetPath)) {
        console.error('[LINT-ES3] Target file not found: ' + targetPath);
        process.exit(1);
    }

    const source = fs.readFileSync(targetPath, 'utf8');
    const result = lintSource(source, path.relative(path.resolve(__dirname, '..'), targetPath) || targetPath);
    if (!result.ok) {
        console.error('[LINT-ES3 FAIL] ' + result.errors.length + ' violation(s) in ' + result.file + ':');
        result.errors.forEach(function (err) {
            console.error('  Line ' + err.line + ' [' + err.rule + ']: ' + err.message);
            if (err.snippet) console.error('    > ' + err.snippet);
        });
        process.exit(1);
    }
    console.log('[LINT-ES3 PASS] ' + result.file + ' passed strict ES3 & AE Locale Guard (0 violations).');
}

module.exports = {
    FORBIDDEN_AE_DISPLAY_NAMES: FORBIDDEN_AE_DISPLAY_NAMES,
    stripCommentsAndStrings: stripCommentsAndStrings,
    lintSource: lintSource
};
