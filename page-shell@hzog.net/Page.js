
const Lang = imports.lang;
const Meta = imports.gi.Meta;

var PageClientManaged = new Lang.Class({
		Name: 'PageClientManaged',
		
		_init: function(ctx, meta_window_actor) {
			
			this._ctx = ctx;
			this._meta_window_actor = meta_window_actor;
			this._meta_window = this._meta_window_actor.get_meta_window();

			this._current_owner_view = null;

			this._floating_wished_position = this.position();
			
		    this._meta_window.connect('focus',
		    		Lang.bind(this, this._handler_meta_window_focus));
		    this._meta_window.connect('position-changed',
		    		Lang.bind(this, this._handler_meta_window_position_changed));
		    this._meta_window.connect('raised',
		    		Lang.bind(this, this._handler_meta_window_raised));
		    this._meta_window.connect('size-changed',
		    		Lang.bind(this, this._handler_meta_window_size_changed));
		    this._meta_window.connect('unmanaged',
		    		Lang.bind(this, this._handler_meta_window_unmanaged));
		    this._meta_window.connect('workspace-changed',
		    		Lang.bind(this, this._handler_meta_window_workspace_changed));

			
		},
		
		destroy: function() {
			
		},
		
		position: function() {
			return this._meta_window.get_frame_rect();
		},
		
		_handler_meta_window_focus: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_focus");
		},

		_handler_meta_window_position_changed: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_position_changed");
		},

		_handler_meta_window_raised: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_raised");
		},

		_handler_meta_window_size_changed: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_size_changed");
		},

		_handler_meta_window_unmanaged: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_unmanaged");
		},

		_handler_meta_window_workspace_changed: function(meta_window) {
			global.log("[PageClientManaged] _handler_meta_window_workspace_changed");
		}

});

var PageTree = new Lang.Class({
		Name: 'PageTree',
		
		_init: function(root) {
			this._parent = null;
			this._root = root;

			this._is_visible = false;
			this._stack_is_locked = false;
		
			this._children = [];
			
		},
		
		destroy: function() {
			
		},
		
		push_back: function(t) {
			this._children.push(t);
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
		
		_init: function(ctx, meta_workspace) {
			this.parent(this);
			this._ctx =ctx;
			this._meta_workspace = meta_workspace;
			
			this._stack_is_locked = true;

			this._viewport_layer = new PageTree(this);
			this._floating_layer = new PageTree(this);
			this._fullscreen_layer = new PageTree(this);
			this._overlays_layer = new PageTree(this);

			this.push_back(this._viewport_layer);
			this.push_back(this._floating_layer);
			this.push_back(this._fullscreen_layer);
			this.push_back(this._overlays_layer);

			this._meta_workspace.connect("window-added",
					Lang.bind(this, this._handler_meta_workspace_window_added));
			this._meta_workspace.connect("window-removed",
					Lang.bind(this, this._handler_meta_workspace_window_removed));
			
		},
		
		destroy: function() {
			
		},
		
		_handler_meta_workspace_window_added: function(meta_workspace, meta_window) {
			
		},
		
		_handler_meta_workspace_window_removed: function(meta_workspace, meta_window) {
			
		},
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
   _init: function(display, screen, stage, shellwm) {
	   global.log("[PageShell] _init");
	   
	   /* map<MetaWorkspace *, workspace_p> */
	   this._workspace_map = new Map();
	   
	   /* shared_ptr<grab_handler_t> */
	   this._grab_handler = undefined;
	   
	   /* MetaDisplay * */
	   this._display = display;
	   /* MetaScreen * */
	   this._screen = screen;
	   /* ClutterStage * */
	   this._stage = stage;
	   /* theme_t * */
	   this._theme = undefined;
	   
	   /* ClutterActor * */
	   this._viewport_group = undefined;
	   /* ClutterActor * */
	   this._overlay_group = undefined;
	   
	   /* page_configuration_t */
	   this.configuration = undefined;
	   /* config_handler_t */
	   this._conf = undefined;
	   
	   /* string */
	   this.page_base_dir = undefined;
	   /* string */
	   this._theme_engine = undefined;
	   
	   /* signal_t<client_managed_p> */
	   this.on_focus_changed = undefined;
	   
	   /* list<client_managed_p> */
	   this._net_client_list = [];
	   
	   this._shellwm = shellwm;
	   
//		if (_theme_engine == "tiny") {
//			cout << "using tiny theme engine" << endl;
//			_theme = new tiny_theme_t{_conf};
//		} else {
//			/* The default theme engine */
//			cout << "using simple theme engine" << endl;
//			_theme = new simple2_theme_t{_conf};
//		}

//		log::printf("n_work_space =%d\n", meta_screen_get_n_workspaces(_screen));
//
		this._current_workspace = this.ensure_workspace(this._screen.get_active_workspace());

//		_viewport_group = clutter_actor_new();
//		clutter_actor_show(_viewport_group);
//
//		_overlay_group = clutter_actor_new();
//		clutter_actor_show(_overlay_group);
//
//		GSettings * setting_keybindings = g_settings_new("net.hzog.page.keybindings");
//		add_keybinding_helper(setting_keybindings, "make-notebook-window", &page_t::_handler_key_make_notebook_window);
//		add_keybinding_helper(setting_keybindings, "make-fullscreen-window", &page_t::_handler_key_make_fullscreen_window);
//		add_keybinding_helper(setting_keybindings, "make-floating-window", &page_t::_handler_key_make_floating_window);
//		add_keybinding_helper(setting_keybindings, "toggle-fullscreen-window", &page_t::_handler_key_toggle_fullscreen);
//
//		g_connect(CLUTTER_ACTOR(stage), "button-press-event", &page_t::_handler_stage_button_press_event);
//		g_connect(CLUTTER_ACTOR(stage), "button-release-event", &page_t::_handler_stage_button_release_event);
//		g_connect(CLUTTER_ACTOR(stage), "motion-event", &page_t::_handler_stage_motion_event);
//		g_connect(CLUTTER_ACTOR(stage), "key-press-event", &page_t::_handler_stage_key_press_event);
//		g_connect(CLUTTER_ACTOR(stage), "key-release-event", &page_t::_handler_stage_key_release_event);
//
//		g_connect(_screen, "monitors-changed", &page_t::_handler_screen_monitors_changed);
//		g_connect(_screen, "workareas-changed", &page_t::_handler_screen_workareas_changed);
//		g_connect(_screen, "workspace-added", &page_t::_handler_screen_workspace_added);
//		g_connect(_screen, "workspace-removed", &page_t::_handler_screen_workspace_removed);
//
//		g_connect(_display, "accelerator-activated", &page_t::_handler_meta_display_accelerator_activated);
//		g_connect(_display, "grab-op-begin”", &page_t::_handler_meta_display_grab_op_begin);
//		g_connect(_display, "grab-op-end", &page_t::_handler_meta_display_grab_op_end);
//		g_connect(_display, "modifiers-accelerator-activated", &page_t::_handler_meta_display_modifiers_accelerator_activated);
//		g_connect(_display, "overlay-key", &page_t::_handler_meta_display_overlay_key);
//		g_connect(_display, "restart", &page_t::_handler_meta_display_restart);
//		g_connect(_display, "window-created", &page_t::_handler_meta_display_window_created);
//
//		update_viewport_layout();
//
//		switch_to_workspace(meta_screen_get_active_workspace_index(_screen), 0);
	   
	   
	   
       this._shellwm.connect('switch-workspace', Lang.bind(this, this._switchWorkspace));
       this._shellwm.connect('minimize', Lang.bind(this, this._minimizeWindow));
       this._shellwm.connect('unminimize', Lang.bind(this, this._unminimizeWindow));
       this._shellwm.connect('size-change', Lang.bind(this, this._sizeChangeWindow));
       this._shellwm.connect('size-changed', Lang.bind(this, this._sizeChangedWindow));
       this._shellwm.connect('map', Lang.bind(this, this._mapWindow));
       this._shellwm.connect('destroy', Lang.bind(this, this._destroyWindow));
       
       this._restackedId = this._screen.connect('restacked', Lang.bind(this, this._syncKnownWindows));
      
//       Main.wm.allowKeybinding('make-notebook-window', Shell.ActionMode.ALL);
//       Main.layoutManager.uiGroup.insert_child_above(this._page.overlay_group, Main.layoutManager.modalDialogGroup);
//       Main.layoutManager._backgroundGroup.add_child(this._page.viewport_group);
              
   },
   
   destroy: function() {
       Main.layoutManager.uiGroup.remove_child(this._page.overlay_group);
       Main.layoutManager._backgroundGroup.remove_child(this._page.viewports_group);
   },

   _minimizeWindow: function(shellwm, actor) {
	   global.log("[PageShell] _minimizeWindow");
	   //this._page.minimize(actor);
   },
   
   _unminimizeWindow: function(shellwm, actor) {
	   global.log("[PageShell] _unminimizeWindow");
//	   this._page.unminimize(actor);
   },
   
   _sizeChangeWindow: function(shellwm, actor, which_change, old_frame_rect, old_buffer_rect) {
	   global.log("[PageShell] _sizeChangeWindow");
//	   this._page.size_change(actor, which_change, old_frame_rect, old_buffer_rect);
   },
   
   _sizeChangedWindow: function(shellwm, actor) {
	   global.log("[PageShell] _sizeChangedWindow");
//	   this._page.size_changed(actor);
   },
   
   _mapWindow: function(shellwm, meta_window_actor) {
	   global.log("[PageShell] _mapWindow", shellwm, meta_window_actor);
	   
	   if (this.lookup_client_managed_with_meta_window_actor(meta_window_actor))
		   return;
	   
	   var meta_window = meta_window_actor.get_meta_window();
	   var type = meta_window.get_window_type();

		if (type == Meta.WindowType.NORMAL) {
			global.log("[PageShell] _mapWindow manage normal window\n");

			let mw = new PageClientManaged(this, meta_window_actor);
			this._net_client_list.push(mw);

		    meta_window.connect('focus',
		    		Lang.bind(this, this._handler_meta_window_focus));
		    meta_window.connect('unmanaged',
		    		Lang.bind(this, this._handler_meta_window_unmanaged));
		    
			if (!meta_window.is_fullscreen()) {
				this.insert_as_notebook(mw, 0);
			} else {
				this.insert_as_fullscreen(mw);
			}

		}
   },
   
   _destroyWindow: function(shellwm, actor) {
	   global.log("[PageShell] _destroyWindow");
//	   this._page.destroy(actor);
   },
   
   _switchWorkspace: function(shellwm, from, to, direction) {
	   global.log("[PageShell] _switchWorkspace");
//	   this._page.switch_workspace(from, to, direction);
   },
   
   _syncKnownWindows: function() {
	   global.log("[PageShell] _syncKnownWindows");
       var wl = global.get_window_actors();
       for (let i = 0; i < wl.length; i++) {
    	   this._mapWindow(this._shellwm, wl[i]);
       }
       global.screen.disconnect(this._restackedId);
       this._restackedId = 0;
   },

   lookup_client_managed_with_meta_window_actor: function(w) {
		for (let i in this._net_client_list) {
			if (i._meta_window_actor === w) {
				return i;
			}
		}
		return null;
   },
   
   lookup_client_managed_with_meta_window: function(w) {
		for (let i in this._net_client_list) {
			if (i._meta_window === w) {
				return i;
			}
		}
		return null;
	},
   
   _handler_meta_window_focus: function(shellwm, actor) {
	   global.log("[PageShell] _handler_meta_window_focus");
   },
   
   _handler_meta_window_unmanaged: function(shellwm, actor) {
	   global.log("[PageShell] _handler_meta_window_unmanaged");
   },
   
   ensure_workspace: function(meta_workspace)
   {
   	if (this._workspace_map.has(meta_workspace)) {
   		return this._workspace_map.get(meta_workspace);
   	} else {
   		let d = new PageWorkspace(this, meta_workspace);
   		this._workspace_map.set(meta_workspace, d);
//   		d.disable();
//   		d.show(); // make is visible by default
//   		d.update_viewports_layout();
   		return d;
   	}
   },
   
});


