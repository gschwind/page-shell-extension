/*
 * workspace.hxx
 *
 * copyright (2014) Benoit Gschwind
 *
 * This code is licensed under the GPLv3. see COPYING file for more details.
 *
 */

#ifndef DESKTOP_HXX_
#define DESKTOP_HXX_

#include <map>
#include <vector>

#include "page-utils.hxx"
#include "page-viewport.hxx"
#include "page-client-managed.hxx"
#include "page-page-types.hxx"

namespace page {

using namespace std;

enum workspace_switch_direction_e {
	WORKSPACE_SWITCH_LEFT,
	WORKSPACE_SWITCH_RIGHT
};

struct workspace_t: public tree_t {
	page_t * _ctx;

	MetaWorkspace * _meta_workspace;

private:

	string _name;

	/* list of viewports in creation order, to make a sane reconfiguration */
	vector<viewport_p> _viewport_outputs;

	tree_p _viewport_layer;
	tree_p _floating_layer;
	tree_p _fullscreen_layer;
	tree_p _overlays_layer;

	viewport_w _primary_viewport;
	notebook_w _default_pop;

	static time64_t const _switch_duration;

	time64_t _switch_start_time;

	workspace_switch_direction_e _switch_direction;

	list<view_w> _client_focus_history;

	bool _is_enable;

	void _init();

public:
	view_w _net_active_window;

	workspace_t(page_t * ctx, MetaWorkspace * workspace);
	workspace_t(page_t * ctx, guint time);
	workspace_t(workspace_t const & v) = delete;
	workspace_t & operator= (workspace_t const &) = delete;

	virtual ~workspace_t();

	auto shared_from_this() -> workspace_p;

	auto get_any_viewport() const -> viewport_p;
	void set_default_pop(notebook_p n);
	auto primary_viewport() const -> viewport_p;
	auto get_viewports() const -> vector<viewport_p> ;
	auto ensure_default_notebook() -> notebook_p;
	auto get_viewport_map() const -> vector<viewport_p>;
	void set_primary_viewport(viewport_p v);
	void update_viewports_layout();
	void remove_viewport(viewport_p v);
	void attach(shared_ptr<client_managed_t> c) __attribute__((deprecated));

	void enable(xcb_timestamp_t time);
	void disable();
	bool is_enable();

	void insert_as_floating(client_managed_p c, xcb_timestamp_t time);
	void insert_as_fullscreen(client_managed_p c, xcb_timestamp_t time);
	void insert_as_notebook(client_managed_p c, xcb_timestamp_t time);

	void insert_as_fullscreen(shared_ptr<client_managed_t> c, viewport_p v);

	void unfullscreen(view_fullscreen_p view, xcb_timestamp_t time);

	void switch_view_to_fullscreen(view_p v, xcb_timestamp_t time);
	void switch_view_to_floating(view_p v, xcb_timestamp_t time);
	void switch_view_to_notebook(view_p mw, xcb_timestamp_t time);

	void switch_notebook_to_floating(view_notebook_p v, xcb_timestamp_t time);
	void switch_notebook_to_fullscreen(view_notebook_p v, xcb_timestamp_t time);

	void switch_floating_to_fullscreen(view_floating_p v, xcb_timestamp_t time);
	void switch_floating_to_notebook(view_floating_p v, xcb_timestamp_t time);

	void switch_fullscreen_to_floating(view_fullscreen_p v, xcb_timestamp_t time);
	void switch_fullscreen_to_notebook(view_fullscreen_p v, xcb_timestamp_t time);

	/* switch a fullscreened and managed window into floating or notebook window */
	void switch_fullscreen_to_prefered_view_mode(view_p c, xcb_timestamp_t time);
	void switch_fullscreen_to_prefered_view_mode(view_fullscreen_p c, xcb_timestamp_t time);

	void add_floating(tree_p c);
	void add_fullscreen(tree_p c);
	void add_overlay(tree_p c);

	void set_name(string const & s);
	auto name() -> string const &;
	void set_to_default_name();

	auto client_focus_history() -> list<view_w>;
	bool client_focus_history_front(view_p & out);
	void client_focus_history_remove(view_p in);
	void client_focus_history_move_front(view_p in);
	bool client_focus_history_is_empty();

	auto lookup_view_for(client_managed_p c) const -> view_p;
	void set_focus(view_p new_focus, xcb_timestamp_t tfocus);
	void unmanage(client_managed_p mw);

	auto _find_viewport_of(tree_p t) -> viewport_p;
	void _insert_view_floating(view_floating_p view, xcb_timestamp_t time);

	/**
	 * tree_t virtual API
	 **/

	using tree_t::hide;
	using tree_t::show;
	virtual auto get_node_name() const -> string;
	//virtual void remove(shared_ptr<tree_t> t);

	using tree_t::reconfigure;
	using tree_t::on_workspace_enable;
	using tree_t::on_workspace_disable;

	//virtual auto button_press(xcb_button_press_event_t const * ev)  -> button_action_e;
	//virtual auto button_release(xcb_button_release_event_t const * ev)  -> button_action_e;
	//virtual bool button_motion(xcb_motion_notify_event_t const * ev);
	//virtual bool leave(xcb_leave_notify_event_t const * ev);
	//virtual bool enter(xcb_enter_notify_event_t const * ev);
	//virtual void expose(xcb_expose_event_t const * ev);
	//virtual void trigger_redraw();

	//virtual auto get_toplevel_xid() const -> xcb_window_t;
	//virtual rect get_window_position() const;
	//virtual void queue_redraw();

	/**
	 * page_component_t virtual API
	 **/

//	virtual void set_allocation(rect const & area);
//	virtual rect allocation() const;
//	virtual void replace(shared_ptr<page_component_t> src, shared_ptr<page_component_t> by);

};

}

#endif /* DESKTOP_HXX_ */
