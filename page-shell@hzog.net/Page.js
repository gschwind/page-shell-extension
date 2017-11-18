
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;

var make_rect = function(x, y, width, height) {
	return new Meta.Rectangle({'x':x,'y':y,'width':width,'height':height});
};

var PageConnectable = new Lang.Class({
	Name: 'PageConnectable',
	Extends: GObject.Object,
	
	_init: function() {
		this.parent();
		this._connected_signals = [];
	},
	
	g_connect: function(obj, signame, func) {
		var sigid = obj.connect(signame, Lang.bind(this, func));
		this._connected_signals.push({'obj': obj, 'sigid': sigid});
	},
	
	destroy: function() {
		this._connected_signals.forEach((item, k, arr) => {
			item.obj.disconnect(item.sigid);
		});
	},
	
	disconnect_object: function(obj) {
		this._connected_signals.forEach((item, k, arr) => {
			if (item.obj == obj)
				item.obj.disconnect(item.sigid);
		});
	}
});

var PageThemeMarginStruct = new Lang.Class({
	Name: 'PageThemeMarginStruct',
	_init: function() {
		this.top = 0;
		this.bottom = 0;
		this.left = 0;
		this.right = 0;
	}
});

var PageThemeNotebookStruct =  new Lang.Class({
	Name: 'PageThemeNotebookStruct',
	_init: function() {
		this.margin = new PageThemeMarginStruct();
		this.margin.top = 4;
		this.margin.bottom = 4;
		this.margin.left = 4;
		this.margin.right = 4;
		this.tab_height = 22;
		this.iconic_tab_width = 33;
		this.selected_close_width = 48;
		this.selected_unbind_width = 20;
		this.menu_button_width = 40;
		this.close_width = 17;
		this.hsplit_width = 17;
		this.vsplit_width = 17;
		this.mark_width = 28;
		this.left_scroll_arrow_width = 16;
		this.right_scroll_arrow_width = 16;
	}
});

var PageThemeSplitStruct =  new Lang.Class({
	Name: 'PageThemeSplitStruct',
	_init: function() {
		this.margin = new PageThemeMarginStruct();
		this.margin.top = 0;
		this.margin.bottom = 0;
		this.margin.left = 0;
		this.margin.right = 0;
		this.width = 10;
	}
});

var PageThemeStruct =  new Lang.Class({
	Name: 'PageThemeStruct',
	_init: function() {
		this.notebook = new PageThemeNotebookStruct();
		this.split = new PageThemeSplitStruct();
	}
});

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
		},
		
		acquire: function(v) {
			if (this._current_owner_view === v)
				return;
			this._current_owner_view = v;
		},
		
		release: function(v) {
			if (this._current_owner_view === v)
				this._current_owner_view = null;
		},
		
		title: function() {
			return this._meta_window.get_title();
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
			t._parent = this;
			this._children.push(t);
		},
		
		clear: function() {
			this._children = [];
		},

		hide: function() {
			this._is_visible = false;
			for(let i = 0; i < this._children.length; ++i) {
				this._children[i].hide();
			}
		},
		
		remove: function(v) {
			this._children = this._children.filter((x) => { return x != v; });			
		},
		
		show: function() {
			this._is_visible = true;
			for(let i = 0; i < this._children.length; ++i) {
				this._children[i].show();
			}
		},
		
		_gather_children_root_first: function(type, out)
		{
			this._children.forEach((item, k, arr) => {
				if (item instanceof type) {
					out.push(item);
				}
				item._gather_children_root_first(type, out);
			});
		},
		
		gather_children_root_first: function(type) {
			var ret = [];
			this._gather_children_root_first(type, ret);
			return ret;
		}
		
});

var PageComponent = new Lang.Class({
		Name: 'PageComponent',
		Extends: PageTree,
		
		_init: function(ref) {
			this.parent(ref._root);
		},
		
		destroy: function() {
			
		},
		
		get_window_position: function() {
			return this._parent.get_window_position();
		}
		
});


var PageWorkspace = new Lang.Class({
		Name: 'PageWorkspace',
		Extends: PageTree,
		
		_init: function(ctx, meta_workspace) {
			this.parent(this);
			this._ctx =ctx;
			this._meta_workspace = meta_workspace;
			
			this._default_pop = null;
			this._stack_is_locked = true;
			
			this._viewport_outputs = [];

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
		
		update_viewports_layout: function()
		{
			this._viewport_layer.clear();

			var n_monitor = this._ctx._screen.get_n_monitors();
			var viewport_allocation = [];
			for (let monitor_id = 0; monitor_id < n_monitor; ++monitor_id) {
				let area = this._meta_workspace.get_work_area_for_monitor(monitor_id);
				viewport_allocation.push(area);
			}
			
			/** get old viewport_allocation to recycle old viewport, and keep unchanged outputs **/
			var old_layout = this._viewport_outputs;
			/** store the newer layout, to be able to cleanup obsolete viewports **/
			this._viewport_outputs = [];
			/** for each not overlaped rectangle **/
			for (let i = 0; i < viewport_allocation.length; ++i) {
				global.log("%p: found viewport (%d,%d,%d,%d)\n",
						this._meta_workspace,
						viewport_allocation[i].x, viewport_allocation[i].y,
						viewport_allocation[i].width, viewport_allocation[i].height);
				let vp = undefined;
				if (i < old_layout.length) {
					vp = old_layout[i];
					vp.update_work_area(viewport_allocation[i]);
				} else {
					vp = new PageViewport(this, viewport_allocation[i]);
				}
				this._viewport_outputs.push(vp);
				this._viewport_layer.push_back(vp);
			}

			/** clean up obsolete viewport_allocation **/
			for (let i = this._viewport_outputs.length; i < old_layout.length; ++i) {
				/** destroy this viewport **/
				this._remove_viewport(old_layout[i]);
				old_layout[i] = null;
			}

			// update visibility
			if (this._is_visible)
				this.show();
			else
				this.hide();

		},
		
		remove_viewport: function(v)
		{
			/* Transfer clients to a valid notebook */
			var notebooks = v.gather_children_root_first(PageViewNotebook);
			var default_notebook = this.ensure_default_notebook();
			for (let i = 0; i < notebooks.length; ++i) {
				default_notebook.add_client_from_view(notebooks[i], 0);
			}

			var floatings = v.gather_children_root_first(PageViewFloating);
			for (let i = 0; i < floatings.length; ++i) {
				this.insert_as_floating(floatings[i], 0);
			}
		},
		
		insert_as_notebook: function(client, time)
		{
			//printf("call %s\n", __PRETTY_FUNCTION__);
			this.ensure_default_notebook().add_client(client, time);
		},
		
		ensure_default_notebook: function() {
			var notebooks = this.gather_children_root_first(PageNotebook);
			if (notebooks.indexOf(this._default_pop) < 0) {				
				this._default_pop = notebooks[0];
				//notebooks[0].set_default(true);
				return notebooks[0];
			} else {
				return this._default_pop;
			}
		},
		
		unmanage: function(mw)
		{
			var v = this.lookup_view_for(mw);
			if (!v)
				return;
			/* if managed window have active clients */
			global.log("unmanaging : 0x%x '%s'\n", 0, mw.title());
			v.remove_this_view();
		},
		
		lookup_view_for: function(c)
		{
			var views = this.gather_children_root_first(PageView);
			var x = views.findIndex((x) => { return x._client == c; });
			if (x >= 0)
				return views[x];
			return null;
		}
		
});

var PageViewport = new Lang.Class({
	Name: 'PageViewport',
	Extends: PageComponent,
	
	_init: function(ref, area) {
		this.parent(ref._root);
		this._work_area = area,
		this._subtree = new PageNotebook(this);
		this.push_back(this._subtree);
		
		this._canvas = new Clutter.Canvas();
		this._canvas.ref_sink();
		this._default_view = new Clutter.Actor();
		this._default_view.ref_sink();
		this._default_view.set_content(this._canvas);
		this._default_view.set_content_scaling_filters(Clutter.ScalingFilter.NEAREST, Clutter.ScalingFilter.NEAREST);
		this._default_view.set_reactive(true);
		
		this._update_canvas();
	
//	g_connect(CLUTTER_CANVAS(_canvas), "draw", &viewport_t::draw);
//	
//	g_connect(_default_view, "button-press-event",
//			&viewport_t::_handler_button_press_event);
//	g_connect(_default_view, "button-release-event",
//			&viewport_t::_handler_button_release_event);
//	g_connect(_default_view, "motion-event",
//			&viewport_t::_handler_motion_event);
//	g_connect(_default_view, "enter-event",
//			&viewport_t::_handler_enter_event);
//	g_connect(_default_view, "leave-event",
//			&viewport_t::_handler_leave_event);
	
		this._subtree.set_allocation(new Meta.Rectangle({x:0,y:0,width:this._work_area.width,height:this._work_area.height}));

	},
	
	destroy: function() {
		
	},
	
	_update_canvas: function()
	{
		this._canvas.set_size(this._work_area.width, this._work_area.height);
		this._default_view.set_position(this._work_area.x, this._work_area.y);
		this._default_view.set_size(this._work_area.width, this._work_area.height);
		this._canvas.invalidate();
	},
	
	set_allocation: function(area) {
		this._work_area = area;
		this._update_canvas();
		if (this._subtree)
			this._subtree.set_allocation(make_rect(0, 0, this._work_area.width, this._work_area.height));
//		queue_redraw();
	},
	
	get_window_position: function() {
		return { x: this._work_area.x, y: this._work_area.y };
	},
	
	update_work_area: function(area) {
		this._work_area = area;
		if (this._subtree)
			this._subtree.set_allocation(make_rect(0, 0, this._work_area.width, this._work_area.height));
	}
});


var PageSplit = new Lang.Class({
		Name: 'PageSplit',
		Extends: PageComponent,
		
		_init: function(ref) {
			this.parent(ref._root);
		},
		
		destroy: function() {
			
		},
		
});

var PageNotebookLayout = new Lang.Class({
	Name: 'PageNotebookLayout',
	_init: function() {
		this.button_close = new Meta.Rectangle();
		this.button_vsplit = new Meta.Rectangle();
		this.button_hsplit = new Meta.Rectangle();
		this.button_select = new Meta.Rectangle();
		this.button_exposay = new Meta.Rectangle();
	
		this.left_scroll_arrow = new Meta.Rectangle();
		this.right_scroll_arrow = new Meta.Rectangle();
	
		this.close_client = new Meta.Rectangle();
		this.undck_client = new Meta.Rectangle();
	
		this.tab = new Meta.Rectangle();
		this.top = new Meta.Rectangle();
		this.bottom = new Meta.Rectangle();
		this.left = new Meta.Rectangle();
		this.right = new Meta.Rectangle();
	
		this.popup_top = new Meta.Rectangle();
		this.popup_bottom = new Meta.Rectangle();
		this.popup_left = new Meta.Rectangle();
		this.popup_right = new Meta.Rectangle();
		this.popup_center = new Meta.Rectangle();
	}
});


var PageNotebook = new Lang.Class({
		Name: 'PageNotebook',
		Extends: PageComponent,
		
		_init: function(ref) {
			this.parent(ref._root);
			
			this._ctx = ref._root._ctx;
			this._is_default = false;
			this._can_hsplit = true;
			this._can_vsplit = true;
			this._has_scroll_arrow = false;
			this._has_pending_fading_timeout = false;
			this._mouse_over = null;
			this._selected = null;
			
			this._stack_is_locked = true;
			
			this._notebook_view_layer = new PageTree(this._root);
			this.push_back(this._notebook_view_layer);
			this._notebook_view_layer.show();
			
			this._area = new PageNotebookLayout();
			this._client_area = make_rect(0, 0, 1, 1);
			this._allocation = make_rect(0, 0, 1, 1);
			
			this._clients_tab_order = [];

			// TODO
			//connect(_ctx->on_focus_changed, this, &notebook_t::_client_focus_change);
			
		},
		
		destroy: function() {
			
		},
		
		set_allocation: function(area) {
//			var width, height;
//			get_min_allocation(width, height);
//			assert(area.w >= width);
//			assert(area.h >= height);

			this._allocation = area;
			this._update_all_layout();
//			queue_redraw();
		},
		
		_update_all_layout: function() {

//			var min_width;
//			var min_height;
//			get_min_allocation(min_width, min_height);
//
//			if (this._allocation.width < min_width * 2 + this._ctx._theme.split.margin.left
//					+ this._ctx._theme.split.margin.right  + this._ctx._theme.split.width) {
//				_can_vsplit = false;
//			} else {
//				_can_vsplit = true;
//			}
//
//			if (this._allocation.height < min_height * 2 + this._ctx._theme.split.margin.top
//					+ this._ctx._theme.split.margin.bottom  + this._ctx._theme.split.width) {
//				_can_hsplit = false;
//			} else {
//				_can_hsplit = true;
//			}
			
			this._can_vsplit = true;
			this._can_hsplit = true;

			this._client_area.x = this._allocation.x
					+ this._ctx._theme.notebook.margin.left;
			this._client_area.y = this._allocation.y
					+ this._ctx._theme.notebook.margin.top
					+ this._ctx._theme.notebook.tab_height;
			this._client_area.width = this._allocation.width
					- this._ctx._theme.notebook.margin.left
					- this._ctx._theme.notebook.margin.right;
			this._client_area.height = this._allocation.height
					- this._ctx._theme.notebook.margin.top
					- this._ctx._theme.notebook.margin.bottom
					- this._ctx._theme.notebook.tab_height;
			
			global.log("client_area = ", this._client_area);

			var window_position = this.get_window_position();
			
			this._area.tab.x = this._allocation.x + window_position.x;
			this._area.tab.y = this._allocation.y + window_position.y;
			this._area.tab.width = this._allocation.width;
			this._area.tab.height = this._ctx._theme.notebook.tab_height;

			if (this._can_hsplit) {
				this._area.top.x = this._allocation.x + window_position.x;
				this._area.top.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
				this._area.top.width = this._allocation.width;
				this._area.top.height = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.2;

				this._area.bottom.x = this._allocation.x + window_position.x;
				this._area.bottom.y = this._allocation.y + window_position.y + (0.8 * (this._allocation.height - this._ctx._theme.notebook.tab_height));
				this._area.bottom.width = this._allocation.width;
				this._area.bottom.height = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.2;
			} else {
				this._area.top = make_rect(0, 0, 0, 0);
				this._area.bottom = make_rect(0, 0, 0, 0);
			}

			if (this._can_vsplit) {
				this._area.left.x = this._allocation.x
						+ window_position.x;
				this._area.left.y = this._allocation.y
						+ window_position.y + this._ctx._theme.notebook.tab_height;
				this._area.left.width = this._allocation.width * 0.2;
				this._area.left.h = this._allocation.height
					- this._ctx._theme.notebook.tab_height;

				this._area.right.x = this._allocation.x + window_position.x + this._allocation.width * 0.8;
				this._area.right.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
				this._area.right.width = this._allocation.width * 0.2;
				this._area.right.h = (this._allocation.height - this._ctx._theme.notebook.tab_height);
			} else {
				this._area.left = make_rect(0, 0, 0, 0);
				this._area.right = make_rect(0, 0, 0, 0);
			}

			this._area.popup_top.x = this._allocation.x + window_position.x;
			this._area.popup_top.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_top.width = this._allocation.width;
			this._area.popup_top.h = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.5;

			this._area.popup_bottom.x = this._allocation.x + window_position.x;
			this._area.popup_bottom.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height
					+ (0.5 * (this._allocation.height - this._ctx._theme.notebook.tab_height));
			this._area.popup_bottom.width = this._allocation.width;
			this._area.popup_bottom.h = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.5;

			this._area.popup_left.x = this._allocation.x + window_position.x;
			this._area.popup_left.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_left.width = this._allocation.width * 0.5;
			this._area.popup_left.h = (this._allocation.height - this._ctx._theme.notebook.tab_height);

			this._area.popup_right.x = this._allocation.x + window_position.x + this._allocation.width * 0.5;
			this._area.popup_right.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_right.width = this._allocation.width * 0.5;
			this._area.popup_right.h = (this._allocation.height - this._ctx._theme.notebook.tab_height);

			this._area.popup_center.x = this._allocation.x + window_position.x + this._allocation.width * 0.2;
			this._area.popup_center.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height + (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.2;
			this._area.popup_center.width = this._allocation.width * 0.6;
			this._area.popup_center.h = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.6;

			if (this._client_area.width <= 0) {
				this._client_area.width = 1;
			}

			if (this._client_area.height <= 0) {
				this._client_area.height = 1;
			}

			if (this._selected) {
				this.update_client_position(this._selected);
				this._selected.reconfigure();
			}

//			this._mouse_over_reset();
//			this._update_theme_notebook(this._theme_notebook);
//			this._update_notebook_buttons_area();
//
//			this._ctx.schedule_repaint();
		},
		
		add_client: function(c, time) {
			var vn = new PageViewNotebook(this, c);
			this._add_client_view(vn, time);
			return true;
		},
		
		_add_client_view(vn, time)
		{
			this._notebook_view_layer.push_back(vn);
			vn.acquire_client();

			this._clients_tab_order.unshift(vn);

//			g_connect(vn->_client->meta_window(), "unmanaged", &notebook_t::_meta_window_unmanaged);
//			g_connect(vn->_client->meta_window(), "notify::title", &notebook_t::_meta_window_notify_title);

			this.update_client_position(vn);

			/* remove current selected */
			if (this._selected) {
				this._selected.hide();
			}

			/* select the new one */
			this._selected = vn;
			if(this._is_visible) {
				this._selected.show();
				this._selected.raise();
			} else {
				this._selected.hide();
			}

			this._selected.reconfigure();
			this._update_all_layout();
			
		},
		
		update_client_position: function(vn) {
			var absolute_client_area = new Meta.Rectangle(this._client_area);
			var window_position = this.get_window_position();
			absolute_client_area.x += window_position.x;
			absolute_client_area.y += window_position.y;
			vn.set_client_area(absolute_client_area);
		},
		
		remove_view_notebook: function(vn)
		{
			/** update selection **/
			if (this._selected == vn) {
				this._selected.hide();
				this._selected = null;
			}

			// cleanup
			//g_disconnect_from_obj(vn->_client->meta_window());
			
			this._clients_tab_order =
				this._clients_tab_order.filter((x) => {
					return x != vn;
				});

//			_mouse_over_reset();

			if (!this._selected) {
				this._selected = this._clients_tab_order[0];
				if (this._selected && this._is_visible) {
					this._selected.show();
				}
			}

			this._notebook_view_layer.remove(vn);
			this._update_all_layout();
		}
		
});


var PageView = new Lang.Class({
		Name: 'PageView',
		Extends: PageTree,
		
		_init: function(ref, client) {
			this.parent(ref._root);
			this._client = client;
			this._stack_is_locked = true;
		},
		
		_is_client_owner: function() {
			return this._client._current_owner_view === this;
		},
		
		remove_this_view: function() {
			this._parent.remove(this);
		},
		
		acquire_client: undefined,
		release_client: undefined,
		
		/**
		 * tree_t API
		 **/
		
		hide: function() {
			PageTree.prototype.hide.call(this);
			this.reconfigure();
		},
		
		show: function() {
			PageTree.prototype.show.call(this);
			this.reconfigure();
		},

		reconfigure: undefined

});

var PageViewFullscreen = new Lang.Class({
		Name: 'PageViewFullscreen',
		Extends: PageView,
		
		_init: function(ref, client) {
			this.parent(ref._root, client);
		},
		
		destroy: function() {
			
		}
		
});

var PageViewFloating = new Lang.Class({
	Name: 'PageViewFloating',
	Extends: PageView,
	
	_init: function(ref, client) {
		this.parent(ref._root, client);
	},
	
	destroy: function() {
		
	}
});

var PageViewNotebook = new Lang.Class({
	Name: 'PageViewNotebook',
	Extends: PageView,
	
	_init: function(ref, client) {
		this.parent(ref._root, client);
		this._client_area = make_rect(0, 0, 1, 1);
	},
	
	destroy: function() {

	},
	
	is_iconic: function() {
		return ! this._is_visible;
	},

	has_focus: function()
	{
		return this._client._meta_window.has_focus();
	},

	title: function()
	{
		return this._client.title();
	},

	delete_window: function(t)
	{
		global.log("request close for '%s'\n", title().c_str());
		this._client.delete_window(t);
	},

	_handler_position_changed: function(window)
	{
		/* disable frame move */
//		if (this._is_client_owner())
//			window.move_resize_frame(window, false,
//					this._client_area.x,
//					this._client_area.y,
//					this._client_area.width,
//					this._client_area.height);
	},

	_handler_size_changed: function(window)
	{
		/* disable frame move */
//		if (this._is_client_owner())
//			window.move_resize_frame(window, false,
//					this._client_area.x,
//					this._client_area.y,
//					this._client_area.width,
//					this._client_area.height);
	},

	remove_this_view: function()
	{
		this._parent._parent.remove_view_notebook(this);
	},

	acquire_client: function()
	{
		/* we already are the owner */
		if (this._is_client_owner())
			return;

		/* release the previous owner and aquire the client */
		this._client.acquire(this);

		if (this._client._meta_window.is_fullscreen())
			this._client._meta_window.unmake_fullscreen();

		// Not available in main stream
		// TODO: detect when it's available.
		//this._client._meta_window.make_tiled(_client->meta_window());
		this._client._meta_window.move_resize_frame(false,
				this._client_area.x,
				this._client_area.y,
				this._client_area.width,
				this._client_area.height);

		// disable move/resizes.
		this._client._meta_window.connect("position-changed",
				Lang.bind(this, this._handler_position_changed));
		this._client._meta_window.connect("size-changed",
				Lang.bind(this, this._handler_size_changed));
		this.reconfigure();
	},

	release_client: function()
	{
		/* already released */
		if (! this._is_client_owner())
			return;

//		g_disconnect_from_obj(_client->meta_window());
		
		// Not available, TODO
//		if (this._client._meta_window.is_tiled(_client->meta_window()))
//			this._client._meta_window.unmake_tiled(_client->meta_window());

		this._client.release(this);
	},

	reconfigure: function()
	{
		if(! this._is_client_owner())
			return;
		this._client._meta_window.move_resize_frame(false,
				this._client_area.x,
				this._client_area.y,
				this._client_area.width,
				this._client_area.height);

		if (this._is_visible) {
			if (this._client._meta_window.minimized)
				this._client._meta_window.unminimize();
		} else {
			if (!this._client._meta_window.minimized)
				this._client._meta_window.minimize();
		}
	},
	
	set_client_area: function(area) {
		this._client_area = area;
		this.reconfigure();
	}
});



var PageShell = new Lang.Class({
    Name: 'PageShell',
    Extends: PageConnectable,
    Signals: {
//        'no-arguments': { },
        'on-focus-changed': { param_types: [ PageClientManaged ] },
//        'with-return': { param_types: [ GObject.TYPE_STRING, GObject.TYPE_INT ], return_type: GObject.TYPE_BOOLEAN ),
    },
    
   _init: function(display, screen, stage, shellwm) {
	   this.parent();
	   
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
	   this._theme = new PageThemeStruct();
	   
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

		this._viewport_group = new Clutter.Actor();
		this._viewport_group.show();

		this._overlay_group = new Clutter.Actor();
		this._overlay_group.show();
//
//		GSettings * setting_keybindings = g_settings_new("net.hzog.page.keybindings");
//		add_keybinding_helper(setting_keybindings, "make-notebook-window", &page_t::_handler_key_make_notebook_window);
//		add_keybinding_helper(setting_keybindings, "make-fullscreen-window", &page_t::_handler_key_make_fullscreen_window);
//		add_keybinding_helper(setting_keybindings, "make-floating-window", &page_t::_handler_key_make_floating_window);
//		add_keybinding_helper(setting_keybindings, "toggle-fullscreen-window", &page_t::_handler_key_toggle_fullscreen);
//
		this.g_connect(this._stage, "button-press-event",
				this._handler_stage_button_press_event);
		this.g_connect(this._stage, "button-release-event",
				this._handler_stage_button_release_event);
		this.g_connect(this._stage, "motion-event",
				this._handler_stage_motion_event);
		this.g_connect(this._stage, "key-press-event",
				this._handler_stage_key_press_event);
		this.g_connect(this._stage, "key-release-event", 
				this._handler_stage_key_release_event);

		this.g_connect(this._screen, "monitors-changed",
				this._handler_screen_monitors_changed);
		this.g_connect(this._screen, "workareas-changed",
				this._handler_screen_workareas_changed);
		this.g_connect(this._screen, "workspace-added",
				this._handler_screen_workspace_added);
		this.g_connect(this._screen, "workspace-removed",
				this._handler_screen_workspace_removed);

		this.g_connect(this._display, "accelerator-activated", 
				this._handler_meta_display_accelerator_activated);
//		this._display.connect("grab-op-begin”", 
//				Lang.bind(this, this._handler_meta_display_grab_op_begin));
//		this._display.connect("grab-op-end", 
//				Lang.bind(this, this._handler_meta_display_grab_op_end));
		this.g_connect(this._display, "modifiers-accelerator-activated", 
				this._handler_meta_display_modifiers_accelerator_activated);
		this.g_connect(this._display, "overlay-key",
				this._handler_meta_display_overlay_key);
		this.g_connect(this._display, "restart", 
				this._handler_meta_display_restart);
		this.g_connect(this._display, "window-created", 
				this._handler_meta_display_window_created);

		this.update_viewport_layout();
//
//		switch_to_workspace(meta_screen_get_active_workspace_index(_screen), 0);
	   
	   
       this.g_connect(this._shellwm, 'switch-workspace', Lang.bind(this, this._switchWorkspace));
       this.g_connect(this._shellwm, 'minimize', Lang.bind(this, this._minimizeWindow));
       this.g_connect(this._shellwm, 'unminimize', Lang.bind(this, this._unminimizeWindow));
       this.g_connect(this._shellwm, 'size-change', Lang.bind(this, this._sizeChangeWindow));
       this.g_connect(this._shellwm, 'size-changed', Lang.bind(this, this._sizeChangedWindow));
       this.g_connect(this._shellwm, 'map', Lang.bind(this, this._mapWindow));
       this.g_connect(this._shellwm, 'destroy', Lang.bind(this, this._destroyWindow));
       
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
	   //global.log("[PageShell] _sizeChangedWindow");
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
		var mw = this.lookup_client_managed_with_meta_window_actor(actor);
		if (mw) {
			this.unmanage(mw);
		}

		var meta_window = actor.get_meta_window();
		this.disconnect_object(meta_window);
		
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
	   var idx = this._net_client_list.findIndex(function(x) {
		  return x._meta_window_actor === w; 
	   });
	   
	   if (idx >= 0)
		   return this._net_client_list[idx];
	   return null;
   },
   
	lookup_client_managed_with_meta_window: function(w) {
	   var idx = this._net_client_list.findIndex(function(x) {
		  return x._meta_window === w; 
	   });
	   
	   if (idx >= 0)
		   return this._net_client_list[idx];
	   return null;
	},
   
   _handler_meta_window_focus: function(shellwm, actor) {
	   global.log("[PageShell] _handler_meta_window_focus");
		var c = this.lookup_client_managed_with_meta_window(actor);
		if (c) {
			this.emit('on-focus-changed', c);
		}
   },
   
   _handler_meta_window_unmanaged: function(shellwm, actor) {
	   global.log("[PageShell] _handler_meta_window_unmanaged");
   },
   
   _handler_stage_button_press_event: function(actor, event) { 
	   global.log("[PageShell] _handler_stage_button_press_event");
   },
   
   _handler_stage_button_release_event: function(actor, event) {
	   global.log("[PageShell] _handler_stage_button_release_event");
   },
   
   _handler_stage_motion_event: function(actor, event) { 
	   global.log("[PageShell] _handler_stage_motion_event");
   },
   
   _handler_stage_key_press_event: function(actor, event) { 
	   global.log("[PageShell] _handler_stage_key_press_event");
   },
   
   _handler_stage_key_release_event: function(actor, event) {
	   global.log("[PageShell] _handler_stage_key_release_event");
   },
   
	_handler_screen_in_fullscreen_changed : function(screen) {
		global.log("[PageShell] _handler_screen_in_fullscreen_changed");
	},
	
	_handler_screen_monitors_changed : function(screen) {
		global.log("[PageShell] _handler_screen_monitors_changed");
	},
	
	_handler_screen_restacked : function(screen) {
		global.log("[PageShell] _handler_screen_restacked");
	},
	
	_handler_screen_startup_sequence_changed : function(screen, arg1) {
		global
				.log("[PageShell] _handler_screen_startup_sequence_changed");
	},
	
	_handler_screen_window_entered_monitor : function(screen, monitor_id, meta_window) {
		global.log("[PageShell] _handler_screen_window_entered_monitor");
	},
	
	_handler_screen_window_left_monitor : function(screen, monitor_id, meta_window) {
		global.log("[PageShell] _handler_screen_window_left_monitor");
	},
	
	_handler_screen_workareas_changed : function(screen) {
		global.log("[PageShell] _handler_screen_workareas_changed");
	},
	
	_handler_screen_workspace_added : function(screen, workspace_id) {
		global.log("[PageShell] _handler_screen_workspace_added");
	},
	
	_handler_screen_workspace_removed : function(screen, workspace_id) {
		global.log("[PageShell] _handler_screen_workspace_removed");
	},
	
	_handler_screen_workspace_switched : function(Mscreen, from, to,
			direction) {
		global.log("[PageShell] _handler_screen_workspace_switched");
	},
	
	
	_handler_meta_display_accelerator_activated : function(display, arg1, arg2, arg3) {
		global.log("[PageShell] _handler_meta_display_accelerator_activated");
	},
	
	_handler_meta_display_grab_op_begin : function(display, screen, meta_window, grab_op) {
		global.log("[PageShell] _handler_meta_display_grab_op_begin");
	},
	
	_handler_meta_display_grab_op_end : function(display, screen, meta_window, grab_op) {
		global.log("[PageShell] _handler_meta_display_grab_op_end");
	},
	
	_handler_meta_display_modifiers_accelerator_activated : function(display) {
		global.log("[PageShell] _handler_meta_display_modifiers_accelerator_activated");
		return false;
	},
	
	_handler_meta_display_overlay_key : function(display) {
		global.log("[PageShell] _handler_meta_display_overlay_key");
	},
	
	_handler_meta_display_restart : function(display) {
		global.log("[PageShell] _handler_meta_display_restart");
		return false;
	},
	
	_handler_meta_display_window_created : function(display, meta_window) {
		global.log("[PageShell] _handler_meta_display_window_created");
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
   		d.update_viewports_layout();
   		return d;
   	}
   },
   
   update_viewport_layout: function()
   {

   	this._overlay_group.set_position(0.0, 0.0);
   	this._overlay_group.set_size(-1, -1);
   	this._viewport_group.set_position(0.0, 0.0);
   	this._viewport_group.set_size(-1, -1);

	this._workspace_map.forEach((v, k, m) => {
		v.update_viewports_layout();
	});
   	
   },
   
   insert_as_notebook: function(c, time) {
		// printf("call %s\n", __PRETTY_FUNCTION__);
		var workspace;
		if (!c._meta_window.is_always_on_all_workspaces()) {
			workspace = this.ensure_workspace(c._meta_window.get_workspace());
		} else {
			workspace = this._current_workspace;
		}
		workspace.insert_as_notebook(c, time);
	},
	
	unmanage: function(mw)
	{
		this._net_client_list =
			this._net_client_list.filter((x) => {
				return x != mw;
			});
		
		/* if window is in move/resize/notebook move, do cleanup */
//		cleanup_grab();

		this._workspace_map.forEach((v, k, m) => {
			v.unmanage(mw);
		});

//		schedule_repaint();
	}
   
});


