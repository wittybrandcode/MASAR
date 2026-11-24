const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load required modules
const TR_SVG_SHAPES = require('../client/js/svg-shapes.js');
global.TR_SVG_SHAPES = TR_SVG_SHAPES;

// Mock window/localStorage
const storage = {};
global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
};

// Load state-store.js
const stateStoreSrc = fs.readFileSync(path.resolve(__dirname, '../client/js/modules/state-store.js'), 'utf8');
const stateStoreModule = new Function(stateStoreSrc + '\nreturn TIME_RULER_STATE_STORE;')();

let passCount = 0;
function test(name, fn) {
    try {
        fn();
        passCount++;
        console.log('[PASS] ' + name);
    } catch (err) {
        console.error('[FAIL] ' + name, err);
        process.exit(1);
    }
}

console.log('--- RUNNING SHAPES & SYNC SUITE ---');

// 1. Validation of isValidShape
test('isValidShape recognizes all built-in shapes', () => {
    const all = TR_SVG_SHAPES.getAllShapes().map(s => s.id);
    assert.strictEqual(all.length >= 15, true, 'At least 15 built-in shapes exist');
    all.forEach(sId => {
        assert.strictEqual(stateStoreModule.isValidShape(sId), true, 'Shape ' + sId + ' must be valid');
    });
    assert.strictEqual(stateStoreModule.isValidShape('inherit'), true, 'inherit is valid');
    assert.strictEqual(stateStoreModule.isValidShape('custom_my_vector'), true, 'custom SVG is valid');
    assert.strictEqual(stateStoreModule.isValidShape('invalid_unknown_shape'), false, 'unknown shape must be false');
});

// 2. normalizeNodeSources shape preservation
test('normalizeNodeSources preserves customShape across all shapes', () => {
    const all = TR_SVG_SHAPES.getAllShapes().map(s => s.id);
    all.forEach((sId, idx) => {
        const node = {
            id: 'node_' + (idx + 1),
            number: String(idx + 1),
            customShape: sId,
            sources: {}
        };
        stateStoreModule.normalizeNodeSources(node, idx);
        assert.strictEqual(node.customShape, sId, 'customShape ' + sId + ' should not be wiped to inherit');
        assert.strictEqual(node.sources.center.shape, sId, 'center.shape must match customShape ' + sId);
    });
});

// 3. Two-way sync when center.shape is updated
test('normalizeNodeSources syncs center.shape to customShape', () => {
    const node = {
        id: 'node_1',
        number: '01',
        customShape: 'inherit',
        sources: {
            center: {
                type: 'shape_number',
                shape: 'pin',
                value: '01'
            }
        }
    };
    stateStoreModule.normalizeNodeSources(node, 0);
    assert.strictEqual(node.customShape, 'pin', 'customShape must sync from center.shape');
    assert.strictEqual(node.sources.center.shape, 'pin', 'center.shape must remain pin');
});

// 4. syncLegacyNodeFields two-way lockstep
test('syncLegacyNodeFields does not clobber customShape when center.shape was inherit', () => {
    const node = {
        id: 'node_4',
        number: '04',
        customShape: 'square',
        sources: {
            center: {
                type: 'shape_number',
                shape: 'inherit',
                value: '04'
            }
        }
    };
    stateStoreModule.syncLegacyNodeFields(node, 3);
    assert.strictEqual(node.customShape, 'square', 'customShape must not be clobbered to inherit');
    assert.strictEqual(node.sources.center.shape, 'square', 'center.shape must synchronize to square');
});

// 5. Explicit revert to inherit
test('revert to inherit resets both fields', () => {
    const node = {
        id: 'node_2',
        number: '02',
        customShape: 'inherit',
        sources: {
            center: {
                type: 'shape_number',
                shape: 'inherit',
                value: '02'
            }
        }
    };
    stateStoreModule.syncLegacyNodeFields(node, 1);
    assert.strictEqual(node.customShape, 'inherit');
    assert.strictEqual(node.sources.center.shape, 'inherit');
});

// 6. Global shape persistence
test('global nodeShape survives loadSavedState for any valid shape', () => {
    const state = stateStoreModule.getDefaultState();
    state.nodeShape = 'hexagon';
    stateStoreModule.saveState(state, true);

    const reloaded = stateStoreModule.getDefaultState();
    stateStoreModule.loadSavedState(reloaded);
    assert.strictEqual(reloaded.nodeShape, 'hexagon', 'Hexagon global shape must survive reload');

    // Also test custom and non-traditional shapes
    ['pin', 'capsule', 'badge', 'star', 'cross'].forEach(sh => {
        state.nodeShape = sh;
        stateStoreModule.saveState(state, true);
        const st2 = stateStoreModule.getDefaultState();
        stateStoreModule.loadSavedState(st2);
        assert.strictEqual(st2.nodeShape, sh, 'Shape ' + sh + ' must survive reload');
    });
});

// 7. Host bridge vectorData calculation for inherited and custom nodes
test('host-bridge vector generation produces valid subpaths', () => {
    const state = stateStoreModule.getDefaultState();
    state.nodeShape = 'diamond';
    state.nodes = [
        { id: 'node_1', number: '01', customShape: 'inherit' },
        { id: 'node_2', number: '02', customShape: 'pin' },
        { id: 'node_3', number: '03', customShape: 'star' }
    ];

    state.nodes.forEach((n, idx) => stateStoreModule.normalizeNodeSources(n, idx));

    const enriched = state.nodes.map(n => {
        const effShape = (n.customShape && n.customShape !== 'inherit') ? n.customShape : state.nodeShape;
        const effRadius = 11;
        const effAnchor = 'center';
        return {
            id: n.id,
            effShape: effShape,
            vectorData: TR_SVG_SHAPES.computeAeVector(effShape, effRadius, effAnchor)
        };
    });

    assert.strictEqual(enriched[0].effShape, 'diamond', 'Node 1 inherits diamond from global');
    assert.strictEqual(enriched[0].vectorData.subPaths.length > 0, true, 'Node 1 has diamond vector path');

    assert.strictEqual(enriched[1].effShape, 'pin', 'Node 2 has custom pin shape');
    assert.strictEqual(enriched[1].vectorData.subPaths.length > 0, true, 'Node 2 has pin vector path');

    assert.strictEqual(enriched[2].effShape, 'star', 'Node 3 has custom star shape');
    assert.strictEqual(enriched[2].vectorData.subPaths.length > 0, true, 'Node 3 has star vector path');
});

console.log('SUMMARY: Passed ' + passCount + ' tests successfully.');
