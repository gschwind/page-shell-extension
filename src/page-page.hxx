/*
 * page.hxx
 *
 * copyright (2010-2015) Benoit Gschwind
 *
 * This code is licensed under the GPLv3. see COPYING file for more details.
 *
 */

#ifndef PAGE_HXX_
#define PAGE_HXX_

#include <memory>
#include <list>
#include <vector>
#include <string>
#include <map>
#include <array>

extern "C" {
#include <meta/keybindings.h>
#include <meta/meta-plugin.h>
#include <shell-global.h>
}

#include "page-config-handler.hxx"

#include "page-theme.hxx"

#include "page-client-managed.hxx"

#include "page-popup-split.hxx"

#include "page-page-component.hxx"
#include "page-notebook.hxx"
#include "page-split.hxx"
#include "page-viewport.hxx"
#include "page-workspace.hxx"

#include "page-page.hxx"

namespace page {

using namespace std;

class page_t:
		public connectable_t,
		public g_connectable_t
{
	workspace_p _current_workspace;

public:
	map<MetaWorkspace *, workspace_p> _workspace_map;

private:
	shared_ptr<grab_handler_t> _grab_handler;

public:

	MetaDisplay * _display;
	MetaScreen * _screen;
	ClutterStage * _stage;
	theme_t * _theme;

	ClutterActor * _viewport_group;
	ClutterActor * _overlay_group;

	page_configuration_t configuration;

	config_handler_t _conf;

	string page_base_dir;
	string _theme_engine;

	signal_t<client_managed_p> on_focus_changed;

private:

	/** store all client in mapping order, older first **/
	list<client_managed_p> _net_client_list;

	using key_handler_func = void (page_t::*)(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding);

	struct _handler_key_binding {
		page_t * target;
		key_handler_func func;

		_handler_key_binding(page_t * target, key_handler_func func) :
			target{target}, func{func} { }

		static void call(MetaDisplay * display, MetaScreen * screen,
				MetaWindow * window, ClutterKeyEvent * event,
				MetaKeyBinding * binding, gpointer user_data);
	};

	void add_keybinding_helper(GSettings * settings, char const * name, key_handler_func func);
	void set_keybinding_custom_helper(char const * name, key_handler_func func);

	void _handler_key_make_notebook_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding);
	void _handler_key_make_fullscreen_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding);
	void _handler_key_make_floating_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding);
	void _handler_key_toggle_fullscreen(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding);

private:
	/* do no allow copy */
	page_t(page_t const &) = delete;
	page_t &operator=(page_t const &) = delete;

public:
	page_t();
	virtual ~page_t();

	void set_default_pop(shared_ptr<notebook_t> x);

private:
	void sync_tree_view();

	// Plugin API

public:
	void _handler_plugin_start(MetaDisplay * display, MetaScreen * screen, ClutterStage * stage);
	void _handler_plugin_minimize(MetaWindowActor * actor);
	void _handler_plugin_unminimize(MetaWindowActor * actor);
	void _handler_plugin_size_changed(MetaWindowActor * window_actor);
	void _handler_plugin_size_change(MetaWindowActor * window_actor, MetaSizeChange const which_change, MetaRectangle * old_frame_rect, MetaRectangle * old_buffer_rect);
	void _handler_plugin_map(MetaWindowActor * window_actor);
	void _handler_plugin_destroy(MetaWindowActor * actor);
	void _handler_plugin_switch_workspace(gint from, gint to, MetaMotionDirection direction);
	void _handler_plugin_show_tile_preview(MetaWindow * window, MetaRectangle *tile_rect, int tile_monitor_number);
	void _handler_plugin_hide_tile_preview();
	void _handler_plugin_show_window_menu(MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect);
	void _handler_plugin_show_window_menu_for_rect(MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect);
	void _handler_plugin_kill_window_effects(MetaWindowActor * actor);
	void _handler_plugin_kill_switch_workspace();
	//auto _handler_plugin_xevent_filter(void * wm, XEvent * event) -> gboolean;
	auto _handler_plugin_keybinding_filter(MetaKeyBinding * binding) -> gboolean;
	void _handler_plugin_confirm_display_change();
	//auto _handler_plugin_create_close_dialog(void * wm, MetaWindow * window) -> MetaCloseDialog *;
	//auto _handler_plugin_create_inhibit_shortcuts_dialog(void * wm, MetaWindow * window) -> MetaInhibitShortcutsDialog *;

private:
	auto _handler_stage_button_press_event(ClutterActor * actor, ClutterEvent * event) -> gboolean;
	auto _handler_stage_button_release_event(ClutterActor * actor, ClutterEvent * event) -> gboolean;
	auto _handler_stage_motion_event(ClutterActor * actor, ClutterEvent * event) -> gboolean;
	auto _handler_stage_key_press_event(ClutterActor * actor, ClutterEvent * event) -> gboolean;
	auto _handler_stage_key_release_event(ClutterActor * actor, ClutterEvent * event) -> gboolean;

	void _handler_screen_in_fullscreen_changed(MetaScreen *metascreen);
	void _handler_screen_monitors_changed(MetaScreen * screen);
	void _handler_screen_restacked(MetaScreen * screen);
	void _handler_screen_startup_sequence_changed(MetaScreen * screen, gpointer arg1);
	void _handler_screen_window_entered_monitor(MetaScreen *metascreen, gint arg1, MetaWindow *arg2);
	void _handler_screen_window_left_monitor(MetaScreen *metascreen, gint arg1, MetaWindow *arg2);
	void _handler_screen_workareas_changed(MetaScreen * screen);
	void _handler_screen_workspace_added(MetaScreen * screen, gint arg1);
	void _handler_screen_workspace_removed(MetaScreen * screen, gint arg1);
	void _handler_screen_workspace_switched(MetaScreen * screen, gint arg1, gint arg2, MetaMotionDirection arg3);

	void _handler_meta_window_focus(MetaWindow * window);
	void _handler_meta_window_unmanaged(MetaWindow * window);

	void _handler_meta_display_accelerator_activated(MetaDisplay * metadisplay, guint arg1, guint arg2, guint arg3);
	void _handler_meta_display_grab_op_begin(MetaDisplay * metadisplay, MetaScreen * arg1, MetaWindow * arg2, MetaGrabOp arg3);
	void _handler_meta_display_grab_op_end(MetaDisplay * metadisplay, MetaScreen * arg1, MetaWindow * arg2, MetaGrabOp arg3);
	auto _handler_meta_display_modifiers_accelerator_activated(MetaDisplay * display) -> gboolean;
	void _handler_meta_display_overlay_key(MetaDisplay * display);
	auto _handler_meta_display_restart(MetaDisplay * display) -> gboolean;
	void _handler_meta_display_window_created(MetaDisplay * display, MetaWindow * window);

	/* unmanage a managed window */
	void unmanage(client_managed_p mw);

public:

	/* toggle fullscreen */
	void toggle_fullscreen(view_p c, guint32 time);

	void move_view_to_notebook(view_p v, notebook_p n, guint32 time);
	void move_notebook_to_notebook(view_notebook_p v, notebook_p n, guint32 time);
	void move_floating_to_notebook(view_floating_p v, notebook_p n, guint32 time);

	/* split a notebook into two notebook */
	void split(shared_ptr<notebook_t> nbk, split_type_e type);


	void insert_as_floating(client_managed_p c, guint32 time = XCB_CURRENT_TIME);
	void insert_as_fullscreen(client_managed_p c, guint32 time = XCB_CURRENT_TIME);
	void insert_as_notebook(client_managed_p c, guint32 time = XCB_CURRENT_TIME);

	void grab_pointer();
	/* if grab is linked to a given window remove this grab */
	void cleanup_grab();

	void update_viewport_layout();

	auto lookup_client_managed_with(MetaWindow * w) const -> client_managed_p;
	auto lookup_client_managed_with(MetaWindowActor * actor) const -> client_managed_p;
	auto ensure_workspace(MetaWorkspace * w) -> workspace_p;

	bool check_for_managed_window(xcb_window_t w);
	bool check_for_destroyed_window(xcb_window_t w);

	void switch_to_workspace(unsigned int workspace, guint32 time);

	/**
	 * page_t virtual API
	 **/

	auto conf() const -> page_configuration_t const &;
	auto theme() const -> theme_t const *;
	auto dpy() const -> MetaDisplay *;
	auto current_workspace() const -> workspace_p const &;
	void grab_start(shared_ptr<grab_handler_t> handler, guint32 time);
	void grab_stop(guint32 time);
	void split_left(notebook_p nbk, view_p c, guint32 time);
	void split_right(notebook_p nbk, view_p c, guint32 time);
	void split_top(notebook_p nbk, view_p c, guint32 time);
	void split_bottom(notebook_p nbk, view_p c, guint32 time);
	void apply_focus(guint32 tfocus);
	void notebook_close(shared_ptr<notebook_t> nbk, guint32 time);
	auto net_client_list() -> list<client_managed_p> const &;
	void schedule_repaint();
	bool has_grab_handler();

};


}



#endif /* PAGE_HXX_ */
