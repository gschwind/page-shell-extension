
const St = imports.gi.St;
const Page = imports.gi.Page;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Lang = imports.lang;
const Shell = imports.gi.Shell;

var page_shell = null;

function init() {

}

var PageShell = new Lang.Class({
    Name: 'WindowManager',
   _init: function() {
	   this._page = new Page.Handler();
	   this._page.start(global.display, global.screen, global.stage);
	   this._shellwm = global.window_manager;
	   
       this._shellwm.connect('switch-workspace', Lang.bind(this, this._switchWorkspace));
       this._shellwm.connect('minimize', Lang.bind(this, this._minimizeWindow));
       this._shellwm.connect('unminimize', Lang.bind(this, this._unminimizeWindow));
       this._shellwm.connect('size-change', Lang.bind(this, this._sizeChangeWindow));
       this._shellwm.connect('size-changed', Lang.bind(this, this._sizeChangedWindow));
       this._shellwm.connect('map', Lang.bind(this, this._mapWindow));
       this._shellwm.connect('destroy', Lang.bind(this, this._destroyWindow));

       Main.wm.allowKeybinding('make-notebook-window', Shell.ActionMode.ALL);
       Main.layoutManager.uiGroup.insert_child_above(this._page.overlay_group, Main.layoutManager.modalDialogGroup);
       Main.layoutManager._backgroundGroup.add_child(this._page.viewport_group);

   },
   
   destroy: function() {
       Main.layoutManager.uiGroup.remove_child(this._page.overlay_group);
       Main.layoutManager._backgroundGroup.remove_child(this._page.viewports_group);

       //this._shellwm.disconnect('switch-workspace', Lang.bind(this, this._switchWorkspace));
       //this._shellwm.disconnect('minimize', Lang.bind(this, this._minimizeWindow));
       //this._shellwm.disconnect('unminimize', Lang.bind(this, this._unminimizeWindow));
       //this._shellwm.disconnect('size-change', Lang.bind(this, this._sizeChangeWindow));
       //this._shellwm.disconnect('size-changed', Lang.bind(this, this._sizeChangedWindow));
       //this._shellwm.disconnect('map', Lang.bind(this, this._mapWindow));
       //this._shellwm.disconnect('destroy', Lang.bind(this, this._destroyWindow));

   },

   _minimizeWindow: function(shellwm, actor) {
	   this._page.minimize(actor);
   },
   
   _unminimizeWindow: function(shellwm, actor) {
	   this._page.unminimize(actor);
   },
   
   _sizeChangeWindow: function(shellwm, actor, which_change, old_frame_rect, old_buffer_rect) {
	   this._page.size_change(actor, which_change, old_frame_rect, old_buffer_rect);
   },
   
   _sizeChangedWindow: function(shellwm, actor) {
	   this._page.size_changed(actor);
   },
   
   _mapWindow: function(shellwm, actor) {
	   this._page.map(actor);
   },
   
   _destroyWindow: function(shellwm, actor) {
	   this._page.destroy(actor);
   },
   
   _switchWorkspace: function(shellwm, from, to, direction) {
	   this._page.switch_workspace(from, to, direction);
   }
   
});


function enable() {
	page_shell = new PageShell();
}

function disable() {
	page_shell = null;
}


