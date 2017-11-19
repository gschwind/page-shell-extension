
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
//const GIRepository = imports.gi.GIRepository;

const ExtensionUtils = imports.misc.extensionUtils;
const PageExtension = ExtensionUtils.getCurrentExtension();
const Page = PageExtension.imports.Page;

var page_shell = null;

function init() {
	global.log("XXX init");

}

function enable() {
	global.log("[Page] call enable");
	page_shell = new Page.PageShell(global.display, global.screen, global.stage, global.window_manager);
	global.log("[Page] exit enable");
}

function disable() {
	global.log("XXX disable");
	page_shell.disconnect_all();
	page_shell = null;
}


