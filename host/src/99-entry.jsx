TR.boot = function () {
    TR.ready = true;
    return true;
};

TR.dispatch = function (fnName, jsonArg) {
    try {
        if (!TR.API || typeof TR.API[fnName] !== "function") {
            return '{"ok":false,"code":"HOST_NOT_READY","message":"Method ' + String(fnName) + ' not found.","data":null}';
        }
        return TR.API[fnName](jsonArg);
    } catch (e) {
        return '{"ok":false,"code":"HOST_EXCEPTION","message":"' + String(e && e.message ? e.message : e) + '","data":null}';
    }
};
