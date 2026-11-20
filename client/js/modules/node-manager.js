/**
 * TIME RULER PRO — client/js/modules/node-manager.js
 * Modular Node Card Renderer & Stream Interactions Controller (Phase 4)
 */

var TIME_RULER_NODE_MANAGER = (function () {
    'use strict';

    var STREAM_ICONS = {
        title_text:   { icon: 'fa-heading',      name: 'عنوان وفقرة' },
        title_list:   { icon: 'fa-list-check',   name: 'عنوان وقائمة' },
        title:        { icon: 'fa-font',         name: 'عنوان مستقل' },
        text:         { icon: 'fa-paragraph',    name: 'فقرة نصية' },
        list:         { icon: 'fa-list-ul',      name: 'قائمة نقطية' },
        badge:        { icon: 'fa-tag',          name: 'شارة مدمجة' },
        icon_title:   { icon: 'fa-icons',        name: 'أيقونة وعنوان' },
        number_text:  { icon: 'fa-arrow-down-1-9', name: 'رقم وتفصيل' }
    };

    function getStreamIconDef(type) {
        return STREAM_ICONS[type] || STREAM_ICONS.title_text;
    }

    return {
        STREAM_ICONS: STREAM_ICONS,
        getStreamIconDef: getStreamIconDef
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_NODE_MANAGER;
}

