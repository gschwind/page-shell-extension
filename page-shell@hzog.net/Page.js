
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;
const St = imports.gi.St;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio

var make_rect = function(x, y, width, height) {
	return new Meta.Rectangle({'x':x,'y':y,'width':width,'height':height});
};

var is_inside = function(r, x, y) {
	return (x>=r.x)&(y>=r.y)&(x<(r.x+r.width))&(y<(r.y+r.height));
};

var PageConnectable = new Lang.Class({
	Name: 'PageConnectable',
	Extends: GObject.Object,
	Signals: { },
	
	_init: function() {
		this.parent();
		this._connected_signals = [];
	},
	
	g_connect: function(obj, signame, func) {
		var sigid = obj.connect(signame, Lang.bind(this, func));
		this._connected_signals.push({'obj': obj, 'sigid': sigid});
	},
	
	destroy: function() {
		this.disconnect_all();
	},
	
	disconnect_object: function(obj) {
		this._connected_signals.forEach((item, k, arr) => {
			if (item.obj === obj)
				item.obj.disconnect(item.sigid);
		});
		
		this._connected_signals = this._connected_signals.filter((x) => { return !(x.obj === obj); });
		
	},
	
	disconnect_all: function() {
		this._connected_signals.forEach((item, k, arr) => {
			item.obj.disconnect(item.sigid);
		});
		this._connected_signals = [];
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
//		this.margin.top = 4;
//		this.margin.bottom = 4;
//		this.margin.left = 4;
//		this.margin.right = 4;
		
		// Include Shadow;
		this.margin.top = 20;
		this.margin.bottom = 20;
		this.margin.left = 20;
		this.margin.right = 20;
		
//		this.tab_height = 22;
		this.tab_height = 30;
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
		Extends: PageConnectable,
		
		_init: function(ctx, meta_window_actor) {
			this.parent();
			
			this._ctx = ctx;
			this._meta_window_actor = meta_window_actor;
			this._meta_window = this._meta_window_actor.get_meta_window();

			this._current_owner_view = null;

			this._floating_wished_position = this.position();
			
		    this.g_connect(this._meta_window, 'focus',
		    		this._handler_meta_window_focus);
		    this.g_connect(this._meta_window, 'position-changed',
		    		this._handler_meta_window_position_changed);
		    this.g_connect(this._meta_window, 'raised',
		    		this._handler_meta_window_raised);
		    this.g_connect(this._meta_window, 'size-changed',
		    		this._handler_meta_window_size_changed);
		    this.g_connect(this._meta_window, 'unmanaged',
		    		this._handler_meta_window_unmanaged);
		    this.g_connect(this._meta_window, 'workspace-changed',
		    		this._handler_meta_window_workspace_changed);

			
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
		Extends: PageConnectable,
		
		_init: function(root) {
			this.parent();
			
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
			v._parent = null;
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
		},
		
		disconnect_all: function() {
			this._children.forEach((item, k, arr) => {
				item.disconnect_all();
			});
			PageConnectable.prototype.disconnect_all.call(this);
		},
		
		raise: function(t) {

			if (this._parent) {
				this._parent.raise(this);
			}

			if (t && (!this._stack_is_locked)) {
				this._children = this._children.filter((x) => { return !(x === t); });
				this._children.push(t);
			}
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
		},
		
		get_parent_actor: function() {
			return this._parent.get_parent_actor();
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
		
		_remove_viewport: function(v)
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
		},
		
		switch_view_to_notebook:function (v)
		{
			if(v instanceof PageViewFloating) {
				this.switch_floating_to_notebook(v);
				return;
			}

			if(v instanceof PageViewFullscreen) {
				this.switch_fullscreen_to_notebook(v);
				return;
			}
		},

		switch_floating_to_notebook: function(vf)
		{
			vf.remove_this_view();
			var n = this.ensure_default_notebook();
			n.add_client(vf._client, 0);
		},
		
		switch_fullscreen_to_notebook:function (view)
		{
			view.remove_this_view();
			var n = ensure_default_notebook();
			n.add_client(view._client, time);
		},
		
		switch_view_to_floating: function(v, time)
		{
			if(v instanceof PageViewNotebook) {
				this.switch_notebook_to_floating(v, time);
				return;
			}

			if(v instanceof PageViewFullscreen) {
				this.switch_fullscreen_to_floating(v, time);
				return;
			}
		},
		
		switch_notebook_to_floating(vn, time)
		{
			vn.remove_this_view();
			vn._client._meta_window.move_resize_frame(false,
					vn._client._floating_wished_position.x,
					vn._client._floating_wished_position.y,
					vn._client._floating_wished_position.width,
					vn._client._floating_wished_position.height);
			var vf = new PageViewFloating(this, vn._client);
			this._insert_view_floating(vf, time);
		},
		
		switch_notebook_to_floating: function(vn, time)
		{
			vn.remove_this_view();
			vn._client._meta_window.move_resize_frame(false,
					vn._client._floating_wished_position.x,
					vn._client._floating_wished_position.y,
					vn._client._floating_wished_position.width,
					vn._client._floating_wished_position.height);
			global.log("[PageWorkspace] Switch to floating");
			var vf = new PageViewFloating(this, vn._client);
			this._insert_view_floating(vf, time);
		},
		
		_insert_view_floating: function(fv, time)
		{
			var c = fv._client;
			fv.acquire_client();
			this.add_floating(fv);
			fv.raise();
			fv.show();
			//this.set_focus(fv, time);
			this._ctx.schedule_repaint();
		},
		
		add_floating: function(view)
		{
			this._floating_layer.push_back(view);
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
		
		this._default_view = new Clutter.Actor();
		this._default_view.ref_sink();
		this._actor = this._default_view;

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
		this.update_actors();
		
	},
	
	destroy: function() {
		this._actor.unref();
	},
	
	_update_canvas: function()
	{
//		this._canvas.set_size(this._work_area.width, this._work_area.height);
		this._default_view.set_position(this._work_area.x, this._work_area.y);
		this._default_view.set_size(this._work_area.width, this._work_area.height);
//		this._canvas.invalidate();
	},
	
	set_allocation: function(area) {
		this._work_area = new Meta.Rectangle(area);
		this._update_canvas();
		if (this._subtree)
			this._subtree.set_allocation(make_rect(0, 0, this._work_area.width, this._work_area.height));
//		queue_redraw();
	},
	
	get_window_position: function() {
		return new Meta.Rectangle(this._work_area);
	},
	
	update_work_area: function(area) {
		this._work_area = new Meta.Rectangle(area);
		this._update_canvas();
		if (this._subtree)
			this._subtree.set_allocation(make_rect(0, 0, this._work_area.width, this._work_area.height));
	},
	
	get_parent_actor: function() {
		return this._default_view;
	},
	
	replace: function(src, by) {
		if (this._subtree === src) {
			this.remove(this._subtree);
			this._subtree = by;
			this.push_back(this._subtree);
			this.update_actors();
			this._subtree.set_allocation(make_rect(0, 0, this._work_area.width, this._work_area.height));
			if(this._is_visible)
				this._subtree.show();
			else
				this._subtree.hide();
		} 
	},
	
	remove: function(x) {
		if (this._subtree === x) {
			PageTree.prototype.remove.call(this, this._subtree);
			this._subtree = null;
			this.update_actors();
		} 
	},
	
	update_actors: function() {
		this._actor.remove_all_children();
		if (this._subtree)
			this._actor.add_child(this._subtree._actor);
	}
	
});

var HORIZONTAL_SPLIT = 0;
var VERTICAL_SPLIT = 1;

var PageSplit = new Lang.Class({
		Name: 'PageSplit',
		Extends: PageComponent,
		
		_init: function(ref, direction) {
			this.parent(ref._root);
			
			this._ctx = ref._root._ctx;
			this._direction = direction;
			this._ratio = 0.5;
			this._has_mouse_over = false;
			
			this._allocation = make_rect(0, 0, 1, 1);
			this._split_bar_area= make_rect(0, 0, 1, 1);
			
			this._pack0 = null;
			this._pack1 = null;

			this._bpack0 = make_rect(0, 0, 1, 1);
			this._bpack1 = make_rect(0, 0, 1, 1);
			
			this._actor = new Clutter.Actor();
			this._actor.ref_sink();
			
		},
		
		destroy: function() {
			this._actor.unref();
		},
		
		set_allocation: function(allocation) {
			this._allocation = new Meta.Rectangle(allocation);
			this.update_allocation();
		},

		replace: function(src, by) {
			if (this._pack0 === src) {
				this.set_pack0(by);
			} else if (this._pack1 === src) {
				this.set_pack1(by);
			}
			this.update_allocation();
		},

		set_split: function(split) {
			if(split < 0.05)
				split = 0.05;
			if(split > 0.95)
				split = 0.95;
			this._ratio = split;
			this.update_allocation();
		},

		compute_children_allocation: function(split) {

			var pack0_height = 20, pack0_width = 20;
			var pack1_height = 20, pack1_width = 20;
			
			var bpack0 = new Meta.Rectangle();
			var bpack1 = new Meta.Rectangle();

//			if(this._pack0 != null)
//				this._pack0->get_min_allocation(pack0_width, pack0_height);
//			if(this._pack1 != mull)
//				this._pack1->get_min_allocation(pack1_width, pack1_height);

			//cout << "pack0 = " << pack0_width << "," << pack0_height << endl;
			//cout << "pack1 = " << pack1_width << "," << pack1_height << endl;

			if (this._direction === VERTICAL_SPLIT) {

				var w = this._allocation.width
						- 2 * this._ctx._theme.split.margin.left
						- 2 * this._ctx._theme.split.margin.right
						- this._ctx._theme.split.width;

				var w0 = Math.floor(w * split + 0.5);
				var w1 = w - w0;


				if(w0 < pack0_width) {
					w1 -= pack0_width - w0;
					w0 = pack0_width;
				}

				if(w1 < pack1_width) {
					w0 -= pack1_width - w1;
					w1 = pack1_width;
				}

				bpack0.x = this._allocation.x + this._ctx._theme.split.margin.left;
				bpack0.y = this._allocation.y + this._ctx._theme.split.margin.top;
				bpack0.width = w0;
				bpack0.height = this._allocation.height - this._ctx._theme.split.margin.top - this._ctx._theme.split.margin.bottom;

				bpack1.x = this._allocation.x + this._ctx._theme.split.margin.left + w0 + this._ctx._theme.split.margin.right + this._ctx._theme.split.width + this._ctx._theme.split.margin.left;
				bpack1.y = this._allocation.y + this._ctx._theme.split.margin.top;
				bpack1.width = w1;
				bpack1.height = this._allocation.height - this._ctx._theme.split.margin.top - this._ctx._theme.split.margin.bottom;

//				if(_parent != nullptr) {
//					assert(bpack0.w >= pack0_width);
//					assert(bpack0.h >= pack0_height);
//					assert(bpack1.w >= pack1_width);
//					assert(bpack1.h >= pack1_height);
//				}

			} else {

				var h = this._allocation.height - 2 * this._ctx._theme.split.margin.top - 2 * this._ctx._theme.split.margin.bottom - this._ctx._theme.split.width;
				var h0 = Math.floor(h * split + 0.5);
				var h1 = h - h0;

				if(h0 < pack0_height) {
					h1 -= pack0_height - h0;
					h0 = pack0_height;
				}

				if(h1 < pack1_height) {
					h0 -= pack1_height - h1;
					h1 = pack1_height;
				}

				bpack0.x = this._allocation.x + this._ctx._theme.split.margin.left;
				bpack0.y = this._allocation.y + this._ctx._theme.split.margin.top;
				bpack0.width = this._allocation.width - this._ctx._theme.split.margin.left - this._ctx._theme.split.margin.right;
				bpack0.height = h0;

				bpack1.x = this._allocation.x + this._ctx._theme.split.margin.left;
				bpack1.y = this._allocation.y + this._ctx._theme.split.margin.top + h0 + this._ctx._theme.split.margin.bottom + this._ctx._theme.split.width + this._ctx._theme.split.margin.top;
				bpack1.width = this._allocation.width - this._ctx._theme.split.margin.left - this._ctx._theme.split.margin.right;
				bpack1.height = h1;

//				if(_parent != nullptr) {
//					assert(bpack0.w >= pack0_width);
//					assert(bpack0.h >= pack0_height);
//					assert(bpack1.w >= pack1_width);
//					assert(bpack1.h >= pack1_height);
//				}

			}
			
			return [bpack0, bpack1];
		},

		update_allocation: function() {
			//cout << "allocation = " << _allocation.to_string() << endl;
			[this._bpack0, this._bpack1] = this.compute_children_allocation(this._ratio);
			//cout << "allocation pack0 = " << _bpack0.to_string() << endl;
			//cout << "allocation pack1 = " << _bpack1.to_string() << endl;
			
			global.log("[PageSplit]", this._bpack0.x, this._bpack0.y, this._bpack0.width, this._bpack0.height);
			global.log("[PageSplit]", this._bpack1.x, this._bpack1.y, this._bpack1.width, this._bpack1.height);
			
			this._split_bar_area = this.compute_split_bar_location(this._bpack0, this._bpack1);
			
			if (this._pack0) {
				this._pack0.set_allocation(this._bpack0);
			}
			
			if (this._pack1) {
				this._pack1.set_allocation(this._bpack1);
			}

		},

		set_pack0: function(x) {
			if(this._pack0 != null) {
				this.remove(this._pack0);
			}
			this._pack0 = x;
			this.push_back(this._pack0);
			this.update_allocation();
			if(this._is_visible)
				this._pack0.show();
			else
				this._pack0.hide();
			
			this.update_actors();
		},

		set_pack1: function(x) {
			if(this._pack1 != null) {
				this.remove(this._pack1);
			}
			this._pack1 = x;
			this.push_back(this._pack1);
			this.update_allocation();
			if(this._is_visible)
				this._pack1.show();
			else
				this._pack1.hide();
			
			this.update_actors();
		},
		
		compute_split_bar_location: function(bpack0, bpack1) {
			var ret = new Meta.Rectangle();
			if (this._direction == VERTICAL_SPLIT) {
				ret.x = this._allocation.x + this._ctx._theme.split.margin.left + bpack0.width;
				ret.y = this._allocation.y;
				ret.w = this._ctx._theme.split.width + this._ctx._theme.split.margin.left + this._ctx._theme.split.margin.right;
				ret.h = this._allocation.height;
			} else {
				ret.x = this._allocation.x;
				ret.y = this._allocation.y + this._ctx._theme.split.margin.top + bpack0.height;
				ret.w = this._allocation.width;
				ret.h = this._ctx._theme.split.width + this._ctx._theme.split.margin.top + this._ctx._theme.split.margin.bottom;
			}
			return ret;
		},
		
		remove: function(t) {
			PageTree.prototype.remove.call(this, t);
			if (this._pack0 === t) {
				this._pack0 = null;
			} else if (this._pack1 === t) {
				this._pack1 = null;
			}
			
			this.update_actors();
		},
		
		update_actors: function() {
			this._actor.remove_all_children();
			this._children.forEach((item, k, arr) => {
				this._actor.add_child(item._actor);				
			});
		}
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
			
			this._actor = new Clutter.Actor();
			this._actor.ref_sink();

			this._st_close_button = new St.Button({label: 'X'});
			this._st_close_button.set_reactive(true);
			this._st_close_button.set_background_color(new Clutter.Color({red: 255, green: 0, blue: 0, alpha: 255}))
			this.g_connect(this._st_close_button, "clicked", this._on_button_close_clicked);
			this._actor.add_child(this._st_close_button);
			
			this._st_hsplit_button = new St.Button({label: 'H'});
			this._st_hsplit_button.set_reactive(true);
			this._st_hsplit_button.set_background_color(new Clutter.Color({red: 255, green: 255, blue: 0, alpha: 255}))
			this.g_connect(this._st_hsplit_button, "clicked", this._on_button_hsplit_clicked);
			this._actor.add_child(this._st_hsplit_button);
			
			this._st_vsplit_button = new St.Button({label: 'V'});
			this._st_vsplit_button.set_reactive(true);
			this._st_vsplit_button.set_background_color(new Clutter.Color({red: 255, green: 0, blue: 255, alpha: 255}))
			this.g_connect(this._st_vsplit_button, "clicked", this._on_button_vsplit_clicked);
			this._actor.add_child(this._st_vsplit_button);
			
			this._st_bookmark_button = new St.Button({label: 'B'});
			this._st_bookmark_button.set_reactive(true);
			this._st_bookmark_button.set_background_color(new Clutter.Color({red: 0, green: 255, blue: 0, alpha: 255}))
			this.g_connect(this._st_bookmark_button, "clicked", this._on_button_bookmark_clicked);
			this._actor.add_child(this._st_bookmark_button);
			
			this._st_select_client_button = new St.Button();
			this._st_select_client_button.set_reactive(true);
			this._st_select_client_button.set_background_color(new Clutter.Color({red: 0, green: 0, blue: 0, alpha: 200}))
			this.g_connect(this._st_select_client_button, "button-press-event", this._on_button_select_client_press);
			this._actor.add_child(this._st_select_client_button);
			
			this.g_connect(this._ctx, "on-focus-changed", this._client_focus_change);
			
		},
		
		destroy: function() {
			this.disconnect_all();
			if (this._actor.get_parent()) {
				var xparent = this.get_parent_actor();
				xparent.remove_child(this._actor);
			}
			
			this._actor.unref();
		},
		
		set_allocation: function(area) {
//			var width, height;
//			get_min_allocation(width, height);
//			assert(area.w >= width);
//			assert(area.h >= height);

			this._allocation = new Meta.Rectangle(area);
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
				this._area.left.height = this._allocation.height
					- this._ctx._theme.notebook.tab_height;

				this._area.right.x = this._allocation.x + window_position.x + this._allocation.width * 0.8;
				this._area.right.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
				this._area.right.width = this._allocation.width * 0.2;
				this._area.right.height = (this._allocation.height - this._ctx._theme.notebook.tab_height);
			} else {
				this._area.left = make_rect(0, 0, 0, 0);
				this._area.right = make_rect(0, 0, 0, 0);
			}

			this._area.popup_top.x = this._allocation.x + window_position.x;
			this._area.popup_top.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_top.width = this._allocation.width;
			this._area.popup_top.height = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.5;

			this._area.popup_bottom.x = this._allocation.x + window_position.x;
			this._area.popup_bottom.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height
					+ (0.5 * (this._allocation.height - this._ctx._theme.notebook.tab_height));
			this._area.popup_bottom.width = this._allocation.width;
			this._area.popup_bottom.height = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.5;

			this._area.popup_left.x = this._allocation.x + window_position.x;
			this._area.popup_left.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_left.width = this._allocation.width * 0.5;
			this._area.popup_left.height = (this._allocation.height - this._ctx._theme.notebook.tab_height);

			this._area.popup_right.x = this._allocation.x + window_position.x + this._allocation.width * 0.5;
			this._area.popup_right.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height;
			this._area.popup_right.width = this._allocation.width * 0.5;
			this._area.popup_right.height = (this._allocation.height - this._ctx._theme.notebook.tab_height);

			this._area.popup_center.x = this._allocation.x + window_position.x + this._allocation.width * 0.2;
			this._area.popup_center.y = this._allocation.y + window_position.y + this._ctx._theme.notebook.tab_height + (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.2;
			this._area.popup_center.width = this._allocation.width * 0.6;
			this._area.popup_center.height = (this._allocation.height - this._ctx._theme.notebook.tab_height) * 0.6;

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
		
			{
				let p = this._compute_notebook_close_position();
				this._st_close_button.set_position(p.x, p.y);
				this._st_close_button.set_size(p.width, p.height);
				this._st_close_button.show();
			}
			
			{
				let p = this._compute_notebook_hsplit_position();
				this._st_hsplit_button.set_position(p.x, p.y);
				this._st_hsplit_button.set_size(p.width, p.height);
				this._st_hsplit_button.show();
			}
			
			{
				let p = this._compute_notebook_vsplit_position();
				this._st_vsplit_button.set_position(p.x, p.y);
				this._st_vsplit_button.set_size(p.width, p.height);
				this._st_vsplit_button.show();
			}
			
			{
				let p = this._compute_notebook_bookmark_position();
				this._st_bookmark_button.set_position(p.x, p.y);
				this._st_bookmark_button.set_size(p.width, p.height);
				this._st_bookmark_button.show();
			}
			
			{
				this._st_select_client_button.set_position(this._allocation.x, this._allocation.y);
				this._st_select_client_button.set_size(this._allocation.width - 300, this._ctx._theme.notebook.tab_height);
				if (this._selected) {
					this._st_select_client_button.label = this._selected.title();
					this._st_select_client_button.show();
				} else {
					this._st_select_client_button.hide();
				}
			}
			
			this._ctx.schedule_repaint();
		},
		
		add_client: function(c, time) {
			var vn = new PageViewNotebook(this, c);
			this._add_client_view(vn, time);
			return true;
		},
		
		_add_client_view: function(vn, time)
		{
			this._notebook_view_layer.push_back(vn);
			this.update_client_position(vn);
			vn.acquire_client();

			this._clients_tab_order.unshift(vn);

//			g_connect(vn->_client->meta_window(), "unmanaged", &notebook_t::_meta_window_unmanaged);
//			g_connect(vn->_client->meta_window(), "notify::title", &notebook_t::_meta_window_notify_title);

			/* remove current selected */
			if (this._selected) {
				this._selected.hide();
				this._selected.reconfigure();
			}

			/* select the new one */
			this._selected = vn;
			if(this._is_visible) {
				this._selected.show();
				this._selected.xraise();
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
			this.disconnect_object(vn._client._meta_window);
			
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
		},
		
		_compute_notebook_bookmark_position: function() {
			return new Meta.Rectangle({
				x: this._allocation.x + this._allocation.width
				- this._ctx._theme.notebook.close_width
				- this._ctx._theme.notebook.hsplit_width
				- this._ctx._theme.notebook.vsplit_width
				- this._ctx._theme.notebook.mark_width,
				y: this._allocation.y,
				width: this._ctx._theme.notebook.mark_width,
				height: this._ctx._theme.notebook.tab_height
			});
		},

		_compute_notebook_vsplit_position: function() {
			return new Meta.Rectangle({
				x: this._allocation.x + this._allocation.width
					- this._ctx._theme.notebook.close_width
					- this._ctx._theme.notebook.hsplit_width
					- this._ctx._theme.notebook.vsplit_width,
				y: this._allocation.y,
				width: this._ctx._theme.notebook.vsplit_width,
				height: this._ctx._theme.notebook.tab_height
			});
		},

		_compute_notebook_hsplit_position: function() {
			return new Meta.Rectangle({
				x: this._allocation.x + this._allocation.width - this._ctx._theme.notebook.close_width - this._ctx._theme.notebook.hsplit_width,
				y: this._allocation.y,
				width: this._ctx._theme.notebook.hsplit_width,
				height: this._ctx._theme.notebook.tab_height
			});
		},
		
		_compute_notebook_close_position: function() {
			return new Meta.Rectangle({
				x: this._allocation.x + this._allocation.width - this._ctx._theme.notebook.close_width,
				y: this._allocation.y,
				width: this._ctx._theme.notebook.close_width,
				height: this._ctx._theme.notebook.tab_height
			});
		},
		
		_on_button_close_clicked: function(button, clicked_button) {
			global.log("[PageNotebook] _on_button_close_clicked", clicked_button);
			this._root._ctx.notebook_close(this, 0);
		},
		
		_on_button_hsplit_clicked: function(button, clicked_button) {
			global.log("[PageNotebook] _on_button_hsplit_clicked", clicked_button);
			this._root._ctx.split_bottom(this, null, 0);
		},
		
		_on_button_vsplit_clicked: function(button, clicked_button) {
			global.log("[PageNotebook] _on_button_vsplit_clicked", clicked_button);
			this._root._ctx.split_left(this, null, 0);
		},
		
		_on_button_bookmark_clicked: function(button, clicked_button) {
			global.log("[PageNotebook] _on_button_bookmark_clicked", clicked_button);
		},
		
		_client_focus_change: function(page_shell, c)
		{
			global.log("[PageNotebook] _client_focus_change", c);
			this._clients_tab_order.forEach((item, k, arr) => {
				if (item._client === c) {
					this.activate(item, 0);
				}				
			});
			this._update_all_layout();
		},
		
		activate: function(vn, time)
		{
			this._set_selected(vn);
			vn.xraise();
			this._ctx.schedule_repaint();
			//this._root.set_focus(vn, time);
		},
		

		_set_selected: function(c) {
			/** already selected **/
			if ((this._selected === c) && (!c.is_iconic()))
				return;

			if(this._selected && !(c === this._selected)) {
				this._selected.hide();
			}
			/** set selected **/
			this._selected = c;
			this.update_client_position(this._selected);
			if(this._is_visible) {
				this._selected.show();
			}
		},
		
		_on_button_select_client_press: function(actor, event) {
			global.log("[PageNotebook] _on_button_select_client_press");
			
			var time = event.get_time();
			var button = event.get_button();
			var x, y;
			[x, y] = event.get_coords();
			
			global.log("[PageNotebook] ", x, y, button, time);
			
			if (this._selected)
				this._root._ctx.grab_start(new PageGrabHandlerMoveNotebook(this._root._ctx, this._selected, button, {'x': x, 'y': y}));
			
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

		reconfigure: undefined,
		
		xraise: function() {
			this._parent.raise(this);
			this._root._ctx.sync_tree_view();
		}

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
		
	},
	
	acquire_client: function()
	{
		/* we already are the owner */
		if (this._is_client_owner())
			return;

		/* release the previous owner and aquire the client */
		this._client.acquire(this);

		this._client._meta_window.unminimize();
		if (this._client._meta_window.is_fullscreen())
			this._client._meta_window.unmake_fullscreen();
//		if (this._client._meta_window.is_tiled())
//			this._client._meta_window.unmake_tiled();

		this.g_connect(this._client._meta_window, "position-changed",
				this._handler_position_changed);
		this.g_connect(this._client._meta_window, "size-changed",
				this._handler_size_changed);
		
//		g_connect(_client->meta_window(), "position-changed", &view_floating_t::_handler_position_changed);
//		g_connect(_client->meta_window(), "size-changed", &view_floating_t::_handler_size_changed);
	},
	
	release_client: function()
	{
		if (!this._is_client_owner())
			return;
		this.disconnect_object(this._client._meta_window);
		this._client.release(this);
	},
	
	reconfigure: function()
	{
		// do nothing managed by gnome-shell
	},
	
	_handler_position_changed: function(window)
	{
		this._client._floating_wished_position = this._client.position();
	},

	_handler_size_changed: function(window)
	{
		this._client._floating_wished_position = this._client.position();
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
//		global.log("XXXX", this._client_area.x,
//				this._client_area.y,
//				this._client_area.width,
//				this._client_area.height);
		/* disable frame move */
		if (this._is_client_owner())
			this._client._meta_window.move_resize_frame(false,
					this._client_area.x,
					this._client_area.y,
					this._client_area.width,
					this._client_area.height);
	},

	_handler_size_changed: function(window)
	{
//		global.log("XXXX", this._client_area.x,
//				this._client_area.y,
//				this._client_area.width,
//				this._client_area.height);
		/* disable frame move */
		if (this._is_client_owner())
			this._client._meta_window.move_resize_frame(false,
					this._client_area.x,
					this._client_area.y,
					this._client_area.width,
					this._client_area.height);
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
		this.g_connect(this._client._meta_window, "position-changed",
				this._handler_position_changed);
		this.g_connect(this._client._meta_window, "size-changed",
				this._handler_size_changed);
		
		this.g_connect(this._client._meta_window_actor, "button-press-event",
				this._handler_button_press_event);
		
		this.reconfigure();
	},

	release_client: function()
	{
		/* already released */
		if (! this._is_client_owner())
			return;

		this.disconnect_object(this._client._meta_window);
		this.disconnect_object(this._client._meta_window_actor);
		
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
		
		this._root._ctx.schedule_repaint();
	},
	
	set_client_area: function(area) {
		this._client_area = new Meta.Rectangle(area);
		this.reconfigure();
	},
	
	_handler_button_press_event: function(actor, event) {
		global.log("[PageViewNotebook] _handler_button_press_event");
	}
});

const NOTEBOOK_AREA_NONE = 0;
const NOTEBOOK_AREA_TAB = 1;
const NOTEBOOK_AREA_TOP = 2;
const NOTEBOOK_AREA_BOTTOM = 3;
const NOTEBOOK_AREA_LEFT = 4;
const NOTEBOOK_AREA_RIGHT = 5;
const NOTEBOOK_AREA_CENTER = 6;

var PageGrabHandlerMoveNotebook = new Lang.Class({
    Name: 'PageGrabHandlerMoveNotebook',
    
    _init: function(ctx, view_notebook, button, pos) {
		this._view_notebook = view_notebook;
		this._button = button;
		this._ctx = ctx;
		this.pn0 = new Clutter.Actor();
		this.pn0.set_background_color(new Clutter.Color({red: 200, green: 0, blue: 0, alpha: 128}));
		this.pn0.ref_sink();
		
		this._target_notebook = null;
		this._zone = NOTEBOOK_AREA_NONE;
    },
    
    destroy: function() {
    		if (this.pn0.get_parent())
    			this.pn0.get_parent().remove_child(this.pn0);
    		this.pn0.unref();
    },
    
    _find_target_notebook: function(x, y) {

    	var target = null;
    	var zone = NOTEBOOK_AREA_NONE;

    	/* place the popup */
    	var ln = this._view_notebook._root.gather_children_root_first(PageNotebook);
    	ln.forEach((i, k, arr) => {
    		if (is_inside(i._area.tab, x, y)) {
    			zone = NOTEBOOK_AREA_TAB;
    			target = i;
    		} else if (is_inside(i._area.right, x, y)) {
    			zone = NOTEBOOK_AREA_RIGHT;
    			target = i;
    		} else if (is_inside(i._area.top, x, y)) {
    			zone = NOTEBOOK_AREA_TOP;
    			target = i;
    		} else if (is_inside(i._area.bottom, x, y)) {
    			zone = NOTEBOOK_AREA_BOTTOM;
    			target = i;
    		} else if (is_inside(i._area.left, x, y)) {
    			zone = NOTEBOOK_AREA_LEFT;
    			target = i;
    		} else if (is_inside(i._area.popup_center, x, y)) {
    			zone = NOTEBOOK_AREA_CENTER;
    			target = i;
    		}
    	});
    	
    	global.log("ZONE", target, zone);
    	return [target, zone];
    	
    },
    
    button_press_event: function(actor, e) {

    },

    button_motion_event: function(actor, e)
    {
    	var x, y;
    	[x, y] = e.get_coords();
    	var time = e.get_time(e);
    	global.log("[PageGrabHandlerMoveotebook] button_motion_event", x, y, time);

    	/* do not start drag&drop for small move */
    	if (/*!start_position.is_inside(x, y)&&*/ !this.pn0.get_parent()) {
    		this._ctx._overlay_group.insert_child_above(this.pn0, null);
    		this.pn0.show();
    	}

    	var new_target;
    	var new_zone;
    	[new_target, new_zone] = this._find_target_notebook(x, y);

    	if((new_target != this._target_notebook || new_zone != this._zone) && new_zone != NOTEBOOK_AREA_NONE) {
    		this._target_notebook = new_target;
    		this._zone = new_zone;
    		var geo = make_rect(0, 0, 0, 0);
    		switch(this._zone) {
    		case NOTEBOOK_AREA_TAB:
    			geo = new_target._area.tab;
    			break;
    		case NOTEBOOK_AREA_RIGHT:
    			geo = new_target._area.popup_right;
    			break;
    		case NOTEBOOK_AREA_TOP:
    			geo = new_target._area.popup_top;
    			break;
    		case NOTEBOOK_AREA_BOTTOM:
    			geo = new_target._area.popup_bottom;
    			break;
    		case NOTEBOOK_AREA_LEFT:
    			geo = new_target._area.popup_left;
    			break;
    		case NOTEBOOK_AREA_CENTER:
    			geo = new_target._area.popup_center;
    			break;
    		default:
    			geo = new_target._area.popup_center;
    			break;
    		}
    		this.pn0.save_easing_state();
    		this.pn0.set_easing_mode(Clutter.AnimationMode.EASE_IN_CUBIC);
    		this.pn0.set_easing_duration(100);
    		this.pn0.set_position(geo.x, geo.y);
    		this.pn0.set_size(geo.width, geo.height);
    		this.pn0.restore_easing_state();

    	}


    },

    button_release_event: function(actor, e)
    {
    	var x, y;
    	[x, y] = e.get_coords();
    	var time = e.get_time(e);
    	var button = e.get_button();

    	var c = this._view_notebook;

    	//if (button == this._button) {
    		
		this._ctx.grab_stop(time);
    		
		var new_target;
    		var new_zone;
    		[new_target, new_zone] = this._find_target_notebook(x, y);

    		/* if the mouse is no where, keep old location */
    		if ((!new_target || new_zone == NOTEBOOK_AREA_NONE)
    				&& this._target_notebook) {
    			new_zone = this._zone;
    			new_target = this._target_notebook;
    		}

//    		if (is_inside(start_position, x, y)) {
//    			c->parent_notebook()->activate(c, time);
//    			_ctx->grab_stop(time);
//    			return;
//    		}

    		switch (new_zone) {
    		case NOTEBOOK_AREA_TAB:
    		case NOTEBOOK_AREA_CENTER:
    			if(new_target != c._parent._parent) {
    				this._ctx.move_notebook_to_notebook(c, new_target, time);
    			}
    			break;
    		case NOTEBOOK_AREA_TOP:
    			this._ctx.split_top(new_target, c, time);
    			break;
    		case NOTEBOOK_AREA_LEFT:
    			this._ctx.split_left(new_target, c, time);
    			break;
    		case NOTEBOOK_AREA_BOTTOM:
    			this._ctx.split_bottom(new_target, c, time);
    			break;
    		case NOTEBOOK_AREA_RIGHT:
    			this._ctx.split_right(new_target, c, time);
    			break;
    		default:
    			c._parent._parent.activate(c, time);
    			break;
    		}


    	//}
    },
    
    key_press_event: function(actor, e) {
    	
    },
    
    key_release_event: function(actor, e) {
    	
    }
    
});


var PageShell = new Lang.Class({
    Name: 'PageShell',
    Extends: PageConnectable,
    Signals: {
//        'no-arguments': { },
        'on-focus-changed': { param_types: [ GObject.TYPE_OBJECT ] },
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
	   
		/* Not thread safe */
		this._sync_tree_view_guard = false;
	   
	   /* list<client_managed_p> */
	   this._net_client_list = [];
	   
	   this._shellwm = shellwm;
	   
		this._viewport_group = new Clutter.Actor();
		this._viewport_group.show();

		this._overlay_group = new Clutter.Actor();
		this._overlay_group.show();
	   
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

		let settings = new Gio.Settings({ schema: "net.hzog.page.keybindings" });
		
		this._display.add_keybinding("make-notebook-window", settings, 0,
				Lang.bind(this, this.make_notebook_window));
		this._display.add_keybinding("make-floating-window", settings, 0,
				Lang.bind(this, this.make_floating_window));

		
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
      
       Main.wm.allowKeybinding('make-notebook-window', Shell.ActionMode.ALL);
       Main.wm.allowKeybinding('make-floating-window', Shell.ActionMode.ALL);
       Main.layoutManager.uiGroup.insert_child_above(this._overlay_group, Main.layoutManager.modalDialogGroup);
       Main.layoutManager._backgroundGroup.add_child(this._viewport_group);
       
       this.schedule_repaint();
              
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

		this.disconnect_object(actor);
		var meta_window = actor.get_meta_window();
		this.disconnect_object(meta_window);
		
   },
   
   _switchWorkspace: function(shellwm, from, to, direction) {
	   global.log("[PageShell] _switchWorkspace");

		var meta_workspace_to = this._screen.get_workspace_by_index(to);
		var workspace = this.ensure_workspace(meta_workspace_to);
		if(!workspace)
			return;

		if (workspace != this._current_workspace) {
			//this._current_workspace.disable();
			this._current_workspace = workspace;
			//_current_workspace->enable();
			this.schedule_repaint();
		}
	   
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
   
   _handler_meta_window_focus: function(meta_window) {
	   global.log("[PageShell] _handler_meta_window_focus");
		var c = this.lookup_client_managed_with_meta_window(meta_window);
		if (c) {
			this.emit('on-focus-changed', c);
		}
   },
   
   _handler_meta_window_unmanaged: function(meta_window) {
	   global.log("[PageShell] _handler_meta_window_unmanaged");
   },
   
   _handler_stage_button_press_event: function(actor, event) { 
//	   global.log("[PageShell] _handler_stage_button_press_event");
	   if (this._grab_handler)
		   this._grab_handler.button_press_event(actor, event);
	   
   },
   
   _handler_stage_button_release_event: function(actor, event) {
//	   global.log("[PageShell] _handler_stage_button_release_event");
	   if (this._grab_handler)
		   this._grab_handler.button_release_event(actor, event);
   },
   
   _handler_stage_motion_event: function(actor, event) { 
//	   global.log("[PageShell] _handler_stage_motion_event");
	   if (this._grab_handler)
		   this._grab_handler.button_motion_event(actor, event);
   },
   
   _handler_stage_key_press_event: function(actor, event) { 
//	   global.log("[PageShell] _handler_stage_key_press_event");
	   if (this._grab_handler)
		   this._grab_handler.key_press_event(actor, event);
   },
   
   _handler_stage_key_release_event: function(actor, event) {
//	   global.log("[PageShell] _handler_stage_key_release_event");
	   if (this._grab_handler)
		   this._grab_handler.key_release_event(actor, event);
   },
   
	_handler_screen_in_fullscreen_changed : function(screen) {
//		global.log("[PageShell] _handler_screen_in_fullscreen_changed");
	},
	
	_handler_screen_monitors_changed : function(screen) {
//		global.log("[PageShell] _handler_screen_monitors_changed");
	},
	
	_handler_screen_restacked : function(screen) {
//		global.log("[PageShell] _handler_screen_restacked");
	},
	
	_handler_screen_startup_sequence_changed : function(screen, arg1) {
//		global.log("[PageShell] _handler_screen_startup_sequence_changed");
	},
	
	_handler_screen_window_entered_monitor : function(screen, monitor_id, meta_window) {
//		global.log("[PageShell] _handler_screen_window_entered_monitor");
	},
	
	_handler_screen_window_left_monitor : function(screen, monitor_id, meta_window) {
//		global.log("[PageShell] _handler_screen_window_left_monitor");
	},
	
	_handler_screen_workareas_changed : function(screen) {
		global.log("[PageShell] _handler_screen_workareas_changed");
		this.update_viewport_layout();
	},
	
	_handler_screen_workspace_added : function(screen, workspace_id) {
//		global.log("[PageShell] _handler_screen_workspace_added");
	},
	
	_handler_screen_workspace_removed : function(screen, workspace_id) {
//		global.log("[PageShell] _handler_screen_workspace_removed");
	},
	
	_handler_screen_workspace_switched : function(Mscreen, from, to,
			direction) {
//		global.log("[PageShell] _handler_screen_workspace_switched");
	},
	
	
	_handler_meta_display_accelerator_activated : function(display, arg1, arg2, arg3) {
//		global.log("[PageShell] _handler_meta_display_accelerator_activated");
	},
	
	_handler_meta_display_grab_op_begin : function(display, screen, meta_window, grab_op) {
//		global.log("[PageShell] _handler_meta_display_grab_op_begin");
	},
	
	_handler_meta_display_grab_op_end : function(display, screen, meta_window, grab_op) {
//		global.log("[PageShell] _handler_meta_display_grab_op_end");
	},
	
	_handler_meta_display_modifiers_accelerator_activated : function(display) {
//		global.log("[PageShell] _handler_meta_display_modifiers_accelerator_activated");
		return false;
	},
	
	_handler_meta_display_overlay_key : function(display) {
//		global.log("[PageShell] _handler_meta_display_overlay_key");
	},
	
	_handler_meta_display_restart : function(display) {
//		global.log("[PageShell] _handler_meta_display_restart");
		return false;
	},
	
	_handler_meta_display_window_created : function(display, meta_window) {
//		global.log("[PageShell] _handler_meta_display_window_created");
	},

   ensure_workspace: function(meta_workspace)
   {
   	if (this._workspace_map.has(meta_workspace)) {
   		return this._workspace_map.get(meta_workspace);
   	} else {
   		let d = new PageWorkspace(this, meta_workspace);
   		this._workspace_map.set(meta_workspace, d);
//   		d.disable();
   		d.show(); // make is visible by default
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

		this.schedule_repaint();
	},
	
	sync_tree_view: function() {
		if (this._sync_tree_view_guard)
			return;
		this._sync_tree_view_guard = true;
		
		global.log("[PageShell] syn_tree_view");

		var current_workspace = this.ensure_workspace(this._screen.get_active_workspace());
		this._viewport_group.remove_all_children();
		var viewports = current_workspace.gather_children_root_first(PageViewport);
		
		global.log("[PageShell] XXX", viewports);
		viewports.forEach((x) => {
			global.log("[PageShell] XXX", x);
			if (x._default_view) {
				global.log("[PageShell] XXX", x._default_view);
				this._viewport_group.add_child(x._default_view);
				x._default_view.show();
			}
		});

		var children = current_workspace.gather_children_root_first(PageView);
		children.forEach((x) => {
			x._client._meta_window.raise();
			x._client._meta_window_actor.sync_visibility();
		});

		//Main.layoutManager.uiGroup.set_child_above_sibling(this._overlay_group, Main.layoutManager.modalDialogGroup);
	    
		this._viewport_group.show();
		this._overlay_group.show();
		this._sync_tree_view_guard = false;
	},
	
	schedule_repaint: function()
	{
		this.sync_tree_view();
		this._stage.queue_redraw();
	},
	
	split_left: function(nbk, c, time) {
		var parent = nbk._parent;
		var n = new PageNotebook(nbk);
		var split = new PageSplit(nbk, VERTICAL_SPLIT);
		parent.replace(nbk, split);
		split.set_pack0(n);
		split.set_pack1(nbk);
		split.show();
		if (c)
			this.move_view_to_notebook(c, n, time);
	},

	split_right: function(nbk, c, time) {
		var parent = nbk._parent;
		var n = new PageNotebook(nbk);
		var split = new PageSplit(nbk, VERTICAL_SPLIT);
		parent.replace(nbk, split);
		split.set_pack0(nbk);
		split.set_pack1(n);
		split.show();
		if (c)
			this.move_view_to_notebook(c, n, time);
	},

	split_top: function(nbk, c, time) {
		var parent = nbk._parent;
		var n = new PageNotebook(nbk);
		var split = new PageSplit(nbk, HORIZONTAL_SPLIT);
		parent.replace(nbk, split);
		split.set_pack0(n);
		split.set_pack1(nbk);
		split.show();
		if (c)
			this.move_view_to_notebook(c, n, time);
	},

	split_bottom: function(nbk, c, time) {
		var parent = nbk._parent;
		var n = new PageNotebook(nbk);
		var split = new PageSplit(nbk, HORIZONTAL_SPLIT);
		parent.replace(nbk, split);
		split.set_pack0(nbk);
		split.set_pack1(n);
		split.show();
		if (c)
			this.move_view_to_notebook(c, n, time);
	},
	
	
	notebook_close: function(nbk, time) {
		/**
		 * Closing notebook mean destroying the split base of this
		 * notebook, plus this notebook.
		 **/
		
		if (! (nbk._parent instanceof PageSplit))
			return;

		var workspace = nbk._root;
		workspace._default_pop = null;

		var splt = nbk._parent;

		/* find the sibling branch of note that we want close */
		var dst = null;
		
		if (nbk === splt._pack0) {
			dst = splt._pack1;
		}
		
		if (nbk === splt._pack1) {
			dst = splt._pack0;
		}

		/* remove this split from tree  and replace it by sibling branch */
		splt.remove(dst);
		splt.remove(nbk);
		splt._parent.replace(splt, dst);

		/* move all client from destroyed notebook to new default pop */
		var clients = nbk.gather_children_root_first(PageViewNotebook);
		var default_notebook = workspace.ensure_default_notebook();
		clients.forEach((item, k, array) => {
			default_notebook.add_client(item._client, 0);
		});

//		workspace.set_focus(null, time);
		
		nbk.disconnect_all();

	},
	
	make_notebook_window: function() {
		global.log("[PageShell] make_notebook_window");
		
		var focussed = this._display.get_focus_window();
		var mw = this.lookup_client_managed_with_meta_window(focussed);
		if (!mw) {
			global.log("managed client not found\n");
			return;
		}

		/* windows on all workspaces are not alowed to be bound */
		if (mw._meta_window.is_on_all_workspaces())
			return;

		var v = this._current_workspace.lookup_view_for(mw);
		if (!v) {
			global.log("view not found\n");
			return;
		}
		this._current_workspace.switch_view_to_notebook(v);
	},
	
	make_floating_window: function() {
		global.log("[PageShell] make_floating_windon");
		var focussed = this._display.get_focus_window();
		var mw = this.lookup_client_managed_with_meta_window(focussed);
		if (!mw) {
			global.log("managed client not found\n");
			return;
		}

		/* windows on all workspaces are not alowed to be bound */
		if (mw._meta_window.is_on_all_workspaces())
			return;

		var v = this._current_workspace.lookup_view_for(mw);
		if (!v) {
			global.log("view not found\n");
			return;
		}
		this._current_workspace.switch_view_to_floating(v, 0);
	},
	
	_on_button_select_client_press: function(actor, event) {
		global.log("[PageNotebook] _on_button_select_client_press");
	},
	
	grab_start: function (handler, time) {
		global.log("[PageNotebook] grab_start");
		if (this._grab_handler)
			return;
		this._grab_handler = handler;
		this._stage.grab_key_focus();
		Main.pushModal(this._stage, {timestamp: time, options: Meta.ModalOptions.POINTER_ALREADY_GRABBED});
	},
	
	grab_stop: function (time) {
		global.log("[PageNotebook] grab_end");
		Main.popModal(this._stage, time);
		this._grab_handler.destroy();
		this._grab_handler = null;
	},
	
	move_notebook_to_notebook: function(vn, n, time)
	{
		//printf("call %s\n", __PRETTY_FUNCTION__);
		vn.remove_this_view();
		n.add_client(vn._client, time);
	},
	
	move_floating_to_notebook: function(vn, n, time)
	{
		//printf("call %s\n", __PRETTY_FUNCTION__);
		vn.remove_this_view();
		n.add_client(vn._client, time);
	},
	
	move_view_to_notebook: function(v, n, time)
	{
		if(v instanceof PageViewNotebook) {
			this.move_notebook_to_notebook(v, n, time);
			return;
		}

		if(v instanceof PageViewFloating) {
			this.move_floating_to_notebook(v, n, time);
			return;
		}
	}
	
});


