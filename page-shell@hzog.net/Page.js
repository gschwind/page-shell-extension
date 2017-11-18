
const Lang = imports.lang;

var PageClientManaged = new Lang.Class({
		Name: 'PageClientManaged',
		
		_init: function() {

		},
		
		destroy: function() {
			
		}

});

var PageTree = new Lang.Class({
		Name: 'PageTree',
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});

var PageComponent = new Lang.Class({
		Name: 'PageComponent',
		Extends: PageTree,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});


var PageWorkspace = new Lang.Class({
		Name: 'PageWorkspace',
		Extends: PageTree,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});

var PageViewport = new Lang.Class({
		Name: 'PageViewport',
		Extends: PageComponent,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});


var PageSplit = new Lang.Class({
		Name: 'PageSplit',
		Extends: PageComponent,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});


var PageNotebook = new Lang.Class({
		Name: 'PageNotebook',
		Extends: PageComponent,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});


var PageView = new Lang.Class({
		Name: 'PageView',
		Extends: PageTree,
		
		_init: function() {
			/* client_managed_p */
			this._client;
		},
		
		_is_client_owner: function() { },
		remove_this_view: function() { },
		acquire_client: function() { },
		release_client: function() { },
		
		/**
		 * tree_t API
		 **/
		
		hide: function() { },
		show: function() { },
		get_node_name: function() { },
		reconfigure: function() { }

});

var PageViewFullscreen = new Lang.Class({
		Name: 'PageViewFullscreen',
		Extends: PageView,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
});

var PageViewFloating = new Lang.Class({
		Name: 'PageViewFloating',
		Extends: PageView,
		
		_init: function() {

		},
		
		destroy: function() {
			
		}
		
	});


var PageShell = new Lang.Class({
    Name: 'PageShell',
   _init: function() {
	   print("XXXXX");
	   print(GIRepository.Repository.get_search_path());
	   
	   /* workspace_p */
	   this._current_workspace;
	   /* map<MetaWorkspace *, workspace_p> */
	   this._workspace_map;
	   /* shared_ptr<grab_handler_t> */
	   this._grab_handler;
	   
	   /* MetaDisplay * */
	   this._display;
	   /* MetaScreen * */
	   this._screen;
	   /* ClutterStage * */
	   this._stage;
	   /* theme_t * */
	   this._theme;
	   
	   /* ClutterActor * */
	   this._viewport_group;
	   /* ClutterActor * */
	   this._overlay_group;
	   
	   /* page_configuration_t */
	   this.configuration;
	   /* config_handler_t */
	   this._conf;
	   
	   /* string */
	   this.page_base_dir;
	   /* string */
	   this._theme_engine;
	   
	   /* signal_t<client_managed_p> */
	   this.on_focus_changed;
	   
	   /* list<client_managed_p> */
	   this._net_client_list = [];
	   
//	   this._page = new Page.Handler();
//	   this._page.start(global.display, global.screen, global.stage);
//	   this._shellwm = global.window_manager;
//	   
//       this._shellwm.connect('switch-workspace', Lang.bind(this, this._switchWorkspace));
//       this._shellwm.connect('minimize', Lang.bind(this, this._minimizeWindow));
//       this._shellwm.connect('unminimize', Lang.bind(this, this._unminimizeWindow));
//       this._shellwm.connect('size-change', Lang.bind(this, this._sizeChangeWindow));
//       this._shellwm.connect('size-changed', Lang.bind(this, this._sizeChangedWindow));
//       this._shellwm.connect('map', Lang.bind(this, this._mapWindow));
//       this._shellwm.connect('destroy', Lang.bind(this, this._destroyWindow));
//       this._restackedId = global.screen.connect('restacked', Lang.bind(this, this._syncKnownWindows));
//       
//       Main.wm.allowKeybinding('make-notebook-window', Shell.ActionMode.ALL);
//       Main.layoutManager.uiGroup.insert_child_above(this._page.overlay_group, Main.layoutManager.modalDialogGroup);
//       Main.layoutManager._backgroundGroup.add_child(this._page.viewport_group);
//              
   },
   
   destroy: function() {
       Main.layoutManager.uiGroup.remove_child(this._page.overlay_group);
       Main.layoutManager._backgroundGroup.remove_child(this._page.viewports_group);
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
   },
   
   _syncKnownWindows: function() {
       wl = global.get_window_actors();
       for (i = 0; i < wl.length; ++i) {
    	   this._page.map(wl[i]);
       }
       global.screen.disconnect(this._restackedId);
       this._restackedId = 0;
   },
   
   grab_start: function(handler, time) { },
   grab_stop: function(time) { },
   split_left: function(nbk, c, time) { },
   split_right: function(nbk, c, time) { },
   split_top: function(nbk, c, time) { },
   split_bottom: function(nbk, c, time) { },
   apply_focus: function(tfocus) { },
   notebook_close: function(nbk, time) { },
   schedule_repaint: function() { },
   has_grab_handler: function() { }
   
});


