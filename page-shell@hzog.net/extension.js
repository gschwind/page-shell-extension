
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const GIRepository = imports.gi.GIRepository;

const ExtensionUtils = imports.misc.extensionUtils;
const PageExtension = ExtensionUtils.getCurrentExtension();
const Page = PageExtension.imports.Page;

var page_shell = null;

function init() {
	global.log("XXX init");

}

function enable() {
	global.log("XXX enable");
	//page_shell = new PageShell();
}

function disable() {
	global.log("XXX disable");
	//page_shell = null;
}


