
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
// const GIRepository = imports.gi.GIRepository;

const ExtensionUtils = imports.misc.extensionUtils;
const PageExtension = ExtensionUtils.getCurrentExtension();
const Page = PageExtension.imports.Page;

var page_shell = null;

// called on reload
function init() {
    global.log("[Page] init");
    page_shell = new Page.PageShell(global.display, global.screen, global.stage, global.window_manager);
}

// Called when we enter into the session
// Called when we unlock screen
function enable() {
    global.log("[Page] call enable");
    page_shell.enable()
    global.log("[Page] exit enable");
}

// Called when we leave from the session
// Called when lock screen
// TODO: preserved the context
function disable() {
    global.log("[Page] disable");
    page_shell.disable()
}


