/*
 * page.cxx
 *
 * copyright (2010-2017) Benoit Gschwind
 *
 * This code is licensed under the GPLv3. see COPYING file for more details.
 *
 */

/* According to POSIX.1-2001 */
#include <sys/select.h>
#include <poll.h>

#include <cairo.h>
#include <cairo-xlib.h>

#include <cstdlib>
#include <cstring>
#include <cassert>

#include <string>
#include <sstream>
#include <limits>
#include <stdint.h>
#include <stdexcept>
#include <set>
#include <stack>
#include <vector>
#include <typeinfo>
#include <memory>

extern "C" {
#include <meta/keybindings.h>
#include <meta/meta-plugin.h>
}

#include "page-utils.hxx"

#include "page-page-types.hxx"
#include "page-key-desc.hxx"
#include "page-time.hxx"
#include "page-client-managed.hxx"
#include "page-grab-handlers.hxx"

#include "page-simple2-theme.hxx"
#include "page-tiny-theme.hxx"

#include "page-notebook.hxx"
#include "page-workspace.hxx"
#include "page-split.hxx"
#include "page-page.hxx"
#include "page-view.hxx"
#include "page-view-fullscreen.hxx"
#include "page-view-notebook.hxx"
#include "page-view-floating.hxx"

/* ICCCM definition */
#define _NET_WM_STATE_REMOVE 0
#define _NET_WM_STATE_ADD 1
#define _NET_WM_STATE_TOGGLE 2

namespace page {

time64_t const page_t::default_wait{1000000000L / 120L};

void page_t::_handler_key_binding::call(MetaDisplay * display,
		MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event,
		MetaKeyBinding * binding, gpointer user_data)
{
	auto tranpoline = reinterpret_cast<_handler_key_binding*>(user_data);
	((tranpoline->target)->*(tranpoline->func))(display, screen, window, event, binding);
}

void page_t::add_keybinding_helper(GSettings * settings, char const * name, key_handler_func func)
{
	auto tranpoline = new _handler_key_binding{this, func};
	meta_display_add_keybinding(_display, name, settings, META_KEY_BINDING_NONE,
				     &page_t::_handler_key_binding::call, tranpoline, [](gpointer userdata) { delete reinterpret_cast<_handler_key_binding*>(userdata); });
}

void page_t::set_keybinding_custom_helper(char const * name, key_handler_func func)
{
	auto tranpoline = new _handler_key_binding{this, func};
	meta_keybindings_set_custom_handler(name, &page_t::_handler_key_binding::call, tranpoline, [](gpointer userdata) { delete reinterpret_cast<_handler_key_binding*>(userdata); });
}

void page_t::_handler_key_make_notebook_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	log::printf("window = %p\n", window);
	log::printf("focus = %p\n", meta_display_get_focus_window(display));
	auto focussed = meta_display_get_focus_window(display);
	auto mw = lookup_client_managed_with(focussed);
	if (mw == nullptr) {
		log::printf("managed client not found\n");
		return;
	}

	/* windows on all workspaces are not alowed to be bound */
	if (meta_window_is_on_all_workspaces(mw->meta_window()))
		return;

	auto v = current_workspace()->lookup_view_for(mw);
	if (v == nullptr) {
		log::printf("view not found\n");
		return;
	}
	current_workspace()->switch_view_to_notebook(v, event->time);
}

void page_t::_handler_key_make_fullscreen_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_make_floating_window(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	auto focussed = meta_display_get_focus_window(display);
	auto mw = lookup_client_managed_with(focussed);
	if (mw == nullptr) {
		log::printf("managed client not found\n");
		return;
	}
	auto v = current_workspace()->lookup_view_for(mw);
	if (v == nullptr) {
		log::printf("view not found\n");
		return;
	}
	current_workspace()->switch_view_to_floating(v, event->time);
}

void page_t::_handler_key_page_quit(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	//meta_quit(META_EXIT_SUCCESS);
}

void page_t::_handler_key_toggle_fullscreen(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_debug_1(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_debug_2(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_debug_3(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_debug_4(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_key_run_cmd_0(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	run_cmd(bind_cmd[0].cmd);
}

void page_t::_handler_key_run_cmd_1(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	run_cmd(bind_cmd[1].cmd);
}

void page_t::_handler_key_run_cmd_2(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	run_cmd(bind_cmd[2].cmd);
}

void page_t::_handler_key_run_cmd_3(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	run_cmd(bind_cmd[3].cmd);
}

void page_t::_handler_key_run_cmd_4(MetaDisplay * display, MetaScreen * screen, MetaWindow * window, ClutterKeyEvent * event, MetaKeyBinding * binding)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	run_cmd(bind_cmd[4].cmd);
}

page_t::page_t() :
	_display{nullptr},
	_screen{nullptr},
	_stage{nullptr},
	_overlay_group{nullptr}
{

	_viewport_group = nullptr;
	_current_workspace = nullptr;
	_grab_handler = nullptr;

	char const * conf_file_name = 0;

	configuration._replace_wm = false;

	configuration._menu_drop_down_shadow = false;

	/* load configurations, from lower priority to high one */

	/* load default configuration */
	_conf.merge_from_file_if_exist(string{GNOME_SHELL_DATADIR "page.conf"});

	/* load homedir configuration */
	{
		char const * chome = getenv("HOME");
		if(chome != nullptr) {
			string xhome = chome;
			string file = xhome + "/.page.conf";
			_conf.merge_from_file_if_exist(file);
		}
	}

	/* load file in arguments if provided */
	if (conf_file_name != nullptr) {
		string s(conf_file_name);
		_conf.merge_from_file_if_exist(s);
	}

	page_base_dir = _conf.get_string("default", "theme_dir");
	_theme_engine = _conf.get_string("default", "theme_engine");

	_theme = nullptr;

	bind_page_quit           = _conf.get_string("default", "bind_page_quit");
	bind_close               = _conf.get_string("default", "bind_close");
	bind_exposay_all         = _conf.get_string("default", "bind_exposay_all");
	bind_toggle_fullscreen   = _conf.get_string("default", "bind_toggle_fullscreen");
	bind_toggle_compositor   = _conf.get_string("default", "bind_toggle_compositor");
	bind_right_workspace     = _conf.get_string("default", "bind_right_desktop");
	bind_left_workspace      = _conf.get_string("default", "bind_left_desktop");

	bind_bind_window         = _conf.get_string("default", "bind_bind_window");
	bind_fullscreen_window   = _conf.get_string("default", "bind_fullscreen_window");
	bind_float_window        = _conf.get_string("default", "bind_float_window");

	bind_debug_1 = _conf.get_string("default", "bind_debug_1");
	bind_debug_2 = _conf.get_string("default", "bind_debug_2");
	bind_debug_3 = _conf.get_string("default", "bind_debug_3");
	bind_debug_4 = _conf.get_string("default", "bind_debug_4");

	bind_cmd[0].key = _conf.get_string("default", "bind_cmd_0");
	bind_cmd[1].key = _conf.get_string("default", "bind_cmd_1");
	bind_cmd[2].key = _conf.get_string("default", "bind_cmd_2");
	bind_cmd[3].key = _conf.get_string("default", "bind_cmd_3");
	bind_cmd[4].key = _conf.get_string("default", "bind_cmd_4");
	bind_cmd[5].key = _conf.get_string("default", "bind_cmd_5");
	bind_cmd[6].key = _conf.get_string("default", "bind_cmd_6");
	bind_cmd[7].key = _conf.get_string("default", "bind_cmd_7");
	bind_cmd[8].key = _conf.get_string("default", "bind_cmd_8");
	bind_cmd[9].key = _conf.get_string("default", "bind_cmd_9");

	bind_cmd[0].cmd = _conf.get_string("default", "exec_cmd_0");
	bind_cmd[1].cmd = _conf.get_string("default", "exec_cmd_1");
	bind_cmd[2].cmd = _conf.get_string("default", "exec_cmd_2");
	bind_cmd[3].cmd = _conf.get_string("default", "exec_cmd_3");
	bind_cmd[4].cmd = _conf.get_string("default", "exec_cmd_4");
	bind_cmd[5].cmd = _conf.get_string("default", "exec_cmd_5");
	bind_cmd[6].cmd = _conf.get_string("default", "exec_cmd_6");
	bind_cmd[7].cmd = _conf.get_string("default", "exec_cmd_7");
	bind_cmd[8].cmd = _conf.get_string("default", "exec_cmd_8");
	bind_cmd[9].cmd = _conf.get_string("default", "exec_cmd_9");

	if(_conf.get_string("default", "auto_refocus") == "true") {
		configuration._auto_refocus = true;
	} else {
		configuration._auto_refocus = false;
	}

	if(_conf.get_string("default", "enable_shade_windows") == "true") {
		configuration._enable_shade_windows = true;
	} else {
		configuration._enable_shade_windows = false;
	}

	if(_conf.get_string("default", "mouse_focus") == "true") {
		configuration._mouse_focus = true;
	} else {
		configuration._mouse_focus = false;
	}

	if(_conf.get_string("default", "menu_drop_down_shadow") == "true") {
		configuration._menu_drop_down_shadow = true;
	} else {
		configuration._menu_drop_down_shadow = false;
	}

	configuration._fade_in_time = _conf.get_long("compositor", "fade_in_time");

}

page_t::~page_t() {
	// cleanup cairo, for valgrind happiness.
	//cairo_debug_reset_static_data();
}

void page_t::_handler_plugin_start(MetaDisplay * display, MetaScreen * screen, ClutterStage * stage)
{
	_display = display,
	_screen = screen,
	_stage = stage,

	_display = meta_screen_get_display(_screen);

	log::printf("call %s\n", __PRETTY_FUNCTION__);

	if (_theme_engine == "tiny") {
		cout << "using tiny theme engine" << endl;
		_theme = new tiny_theme_t{_conf};
	} else {
		/* The default theme engine */
		cout << "using simple theme engine" << endl;
		_theme = new simple2_theme_t{_conf};
	}

	log::printf("n_work_space =%d\n", meta_screen_get_n_workspaces(_screen));

	_current_workspace = ensure_workspace(meta_screen_get_active_workspace(_screen));

	_viewport_group = clutter_actor_new();
	clutter_actor_show(_viewport_group);

	_overlay_group = clutter_actor_new();
	clutter_actor_show(_overlay_group);

	GSettings * setting_keybindings = g_settings_new("net.hzog.page.keybindings");
	add_keybinding_helper(setting_keybindings, "make-notebook-window", &page_t::_handler_key_make_notebook_window);
	add_keybinding_helper(setting_keybindings, "make-fullscreen-window", &page_t::_handler_key_make_fullscreen_window);
	add_keybinding_helper(setting_keybindings, "make-floating-window", &page_t::_handler_key_make_floating_window);
	add_keybinding_helper(setting_keybindings, "toggle-fullscreen-window", &page_t::_handler_key_toggle_fullscreen);
	add_keybinding_helper(setting_keybindings, "debug-1", &page_t::_handler_key_debug_1);
	add_keybinding_helper(setting_keybindings, "debug-2", &page_t::_handler_key_debug_2);
	add_keybinding_helper(setting_keybindings, "debug-3", &page_t::_handler_key_debug_3);
	add_keybinding_helper(setting_keybindings, "debug-4", &page_t::_handler_key_debug_4);
	add_keybinding_helper(setting_keybindings, "run-cmd-0", &page_t::_handler_key_run_cmd_0);
	add_keybinding_helper(setting_keybindings, "run-cmd-1", &page_t::_handler_key_run_cmd_1);
	add_keybinding_helper(setting_keybindings, "run-cmd-2", &page_t::_handler_key_run_cmd_2);
	add_keybinding_helper(setting_keybindings, "run-cmd-3", &page_t::_handler_key_run_cmd_3);
	add_keybinding_helper(setting_keybindings, "run-cmd-4", &page_t::_handler_key_run_cmd_4);
	add_keybinding_helper(setting_keybindings, "page-quit", &page_t::_handler_key_page_quit);

	g_connect(CLUTTER_ACTOR(stage), "button-press-event", &page_t::_handler_stage_button_press_event);
	g_connect(CLUTTER_ACTOR(stage), "button-release-event", &page_t::_handler_stage_button_release_event);
	g_connect(CLUTTER_ACTOR(stage), "motion-event", &page_t::_handler_stage_motion_event);
	g_connect(CLUTTER_ACTOR(stage), "key-press-event", &page_t::_handler_stage_key_press_event);
	g_connect(CLUTTER_ACTOR(stage), "key-release-event", &page_t::_handler_stage_key_release_event);

	g_connect(_screen, "monitors-changed", &page_t::_handler_screen_monitors_changed);
	g_connect(_screen, "workareas-changed", &page_t::_handler_screen_workareas_changed);
	g_connect(_screen, "workspace-added", &page_t::_handler_screen_workspace_added);
	g_connect(_screen, "workspace-removed", &page_t::_handler_screen_workspace_removed);

	g_connect(_display, "accelerator-activated", &page_t::_handler_meta_display_accelerator_activated);
	g_connect(_display, "grab-op-begin”", &page_t::_handler_meta_display_grab_op_begin);
	g_connect(_display, "grab-op-end", &page_t::_handler_meta_display_grab_op_end);
	g_connect(_display, "modifiers-accelerator-activated", &page_t::_handler_meta_display_modifiers_accelerator_activated);
	g_connect(_display, "overlay-key", &page_t::_handler_meta_display_overlay_key);
	g_connect(_display, "restart", &page_t::_handler_meta_display_restart);
	g_connect(_display, "window-created", &page_t::_handler_meta_display_window_created);

	update_viewport_layout();
	sync_tree_view();

	switch_to_workspace(meta_screen_get_active_workspace_index(_screen), 0);

}

void page_t::_handler_plugin_minimize(MetaWindowActor * actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	log::printf("meta_window = %p\n", meta_window_actor_get_meta_window(actor));

	auto mw = lookup_client_managed_with(actor);
	if (not mw) {
		return;
	}

	auto fv = current_workspace()->lookup_view_for(mw);
	if (not fv) {
		return;
	}

	current_workspace()->switch_view_to_notebook(fv, 0);

}

void page_t::_handler_plugin_unminimize(MetaWindowActor * actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_size_changed(MetaWindowActor * window_actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_size_change(MetaWindowActor * window_actor, MetaSizeChange const which_change, MetaRectangle * old_frame_rect, MetaRectangle * old_buffer_rect)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);

	auto meta_window = meta_window_actor_get_meta_window(window_actor);
	log::printf("olf_frame_rect x=%d, y=%d, w=%d, h=%d\n", old_frame_rect->x, old_frame_rect->y, old_frame_rect->width, old_frame_rect->height);
	log::printf("old_buffer_rect x=%d, y=%d, w=%d, h=%d\n", old_buffer_rect->x, old_buffer_rect->y, old_buffer_rect->width, old_buffer_rect->height);
	log::printf("meta_window = %p\n", meta_window);
	MetaRectangle new_rect;
	meta_window_get_frame_rect(meta_window, &new_rect);
	log::printf("new_frame_rect x=%d, y=%d, w=%d, h=%d\n", new_rect.x, new_rect.y, new_rect.width, new_rect.height);
	switch(which_change) {
	case META_SIZE_CHANGE_MAXIMIZE:
		log::printf("META_SIZE_CHANGE_MAXIMIZE\n");
		break;
	case META_SIZE_CHANGE_UNMAXIMIZE:
		log::printf("META_SIZE_CHANGE_UNMAXIMIZE\n");
		break;
	case META_SIZE_CHANGE_FULLSCREEN:
		log::printf("META_SIZE_CHANGE_FULLSCREEN\n");
	{
		auto mw = lookup_client_managed_with(window_actor);
		if (mw) {
			for (auto & w : _workspace_map) {
				auto v = w.second->lookup_view_for(mw);
				if (v)
					w.second->switch_view_to_fullscreen(v, 0);
			}
		}
	}
		break;
	case META_SIZE_CHANGE_UNFULLSCREEN:
		log::printf("META_SIZE_CHANGE_UNFULLSCREEN\n");
	{
		auto mw = lookup_client_managed_with(window_actor);
		if (mw) {
			for (auto & w: _workspace_map) {
				auto v = w.second->lookup_view_for(mw);
				if (v)
					w.second->switch_fullscreen_to_prefered_view_mode(v, 0);
			}
		}
	}
		break;
	default:
		log::printf("UNKKNOWN %d\n", static_cast<int>(which_change));
		break;
	}

}

void page_t::_handler_plugin_map(MetaWindowActor * window_actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	MetaWindowType type;

	if(lookup_client_managed_with(window_actor) != nullptr)
		return;

	MetaWindow *meta_window = meta_window_actor_get_meta_window(window_actor);

	type = meta_window_get_window_type(meta_window);

	if (type == META_WINDOW_NORMAL) {
		log::printf("normal window\n");

		auto mw = make_shared<client_managed_t>(this, window_actor);
		_net_client_list.push_back(mw);

		auto meta_window = meta_window_actor_get_meta_window(window_actor);
		g_connect(meta_window, "focus", &page_t::_handler_meta_window_focus);
		g_connect(meta_window, "unmanaged", &page_t::_handler_meta_window_unmanaged);

		if (not meta_window_is_fullscreen(meta_window))
			insert_as_notebook(mw, 0);

	}
}

void page_t::_handler_plugin_destroy(MetaWindowActor * actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	auto mw = lookup_client_managed_with(actor);
	if (mw) {
		unmanage(mw);
	}

	g_disconnect_from_obj(meta_window_actor_get_meta_window(actor));

}

void page_t::_handler_plugin_switch_workspace(gint from, gint to, MetaMotionDirection direction)
{
	log::printf("call %s %d %d %d\n", __PRETTY_FUNCTION__, from, to, static_cast<int>(direction));
	switch_to_workspace(to, 0);
}

void page_t::_handler_plugin_show_tile_preview(MetaWindow * window, MetaRectangle *tile_rect, int tile_monitor_number)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_hide_tile_preview()
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_show_window_menu(MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_show_window_menu_for_rect(MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_kill_window_effects(MetaWindowActor * actor)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_plugin_kill_switch_workspace()
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

//auto page_t::_handler_plugin_xevent_filter(XEvent * event) -> gboolean
//{
//	//printf("call %s\n", __PRETTY_FUNCTION__);
//	return FALSE;
//}

auto page_t::_handler_plugin_keybinding_filter(MetaKeyBinding * binding) -> gboolean
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	log::printf("call %s %d\n", meta_key_binding_get_name(binding), meta_key_binding_get_modifiers(binding));
	return FALSE;
}

void page_t::_handler_plugin_confirm_display_change()
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

//auto page_t::_handler_plugin_create_close_dialog(void * wm, MetaWindow * window) -> MetaCloseDialog *
//{
//	log::printf("call %s\n", __PRETTY_FUNCTION__);
//	return NULL;
//}
//
//auto page_t::_handler_plugin_create_inhibit_shortcuts_dialog(void * wm, MetaWindow * window) -> MetaInhibitShortcutsDialog *
//{
//	log::printf("call %s\n", __PRETTY_FUNCTION__);
//	return NULL;
//}

auto page_t::_handler_stage_button_press_event(ClutterActor * actor, ClutterEvent * event) -> gboolean
{
	//printf("call %s\n", __PRETTY_FUNCTION__);

	if (_grab_handler) {
		_grab_handler->button_press(event);
		return TRUE;
	}

	return FALSE;
}

auto page_t::_handler_stage_button_release_event(ClutterActor * actor, ClutterEvent * event) -> gboolean
{
	//printf("call %s\n", __PRETTY_FUNCTION__);

	if (_grab_handler) {
		_grab_handler->button_release(event);
		return TRUE;
	}

	return FALSE;
}

auto page_t::_handler_stage_motion_event(ClutterActor * actor, ClutterEvent * event) -> gboolean
{
	//printf("call %s\n", __PRETTY_FUNCTION__);

	if (_grab_handler) {
		_grab_handler->button_motion(event);
		return TRUE;
	}

	return FALSE;
}

auto page_t::_handler_stage_key_press_event(ClutterActor * actor, ClutterEvent * event) -> gboolean
{
	//printf("call %s\n", __PRETTY_FUNCTION__);

	if (_grab_handler) {
		_grab_handler->key_press(event);
		return TRUE;
	}

	return FALSE;
}

auto page_t::_handler_stage_key_release_event(ClutterActor * actor, ClutterEvent * event) -> gboolean
{
	//printf("call %s\n", __PRETTY_FUNCTION__);

	if (_grab_handler) {
		_grab_handler->key_release(event);
		return TRUE;
	}

	return FALSE;
}

void page_t::_handler_screen_in_fullscreen_changed(MetaScreen *metascreen)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_monitors_changed(MetaScreen * screen)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	update_viewport_layout();
}

void page_t::_handler_screen_restacked(MetaScreen * screen)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_startup_sequence_changed(MetaScreen * screen, gpointer arg1)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_window_entered_monitor(MetaScreen *metascreen, gint arg1, MetaWindow *arg2)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_window_left_monitor(MetaScreen *metascreen, gint arg1, MetaWindow *arg2)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_workareas_changed(MetaScreen * screen)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	update_viewport_layout();
}

void page_t::_handler_screen_workspace_added(MetaScreen * screen, gint index)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	ensure_workspace(meta_screen_get_workspace_by_index(screen, index));
}

void page_t::_handler_screen_workspace_removed(MetaScreen * screen, gint index)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);

	{
		/* safest way to update workspace map, the index provided to remove is obsolete */
		map<MetaWorkspace *, workspace_p> new_map;
		for (auto wl = meta_screen_get_workspaces(screen); wl != NULL; wl = wl->next) {
			auto w = reinterpret_cast<MetaWorkspace *>(wl->data);
			if (has_key(_workspace_map, w))
				new_map[w] = _workspace_map[w];
		}
		std::swap(_workspace_map, new_map);
	}

	log::printf("exit %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_screen_workspace_switched(MetaScreen * screen, gint arg1, gint arg2, MetaMotionDirection arg3)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_meta_window_focus(MetaWindow * window)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	auto c = lookup_client_managed_with(window);
	if (c != nullptr) {
		on_focus_changed.signal(c);
	}
}

void page_t::_handler_meta_window_unmanaged(MetaWindow * window)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	auto mw = lookup_client_managed_with(window);
	if(mw) {
		unmanage(mw);
	}
}

void page_t::_handler_meta_display_accelerator_activated(MetaDisplay * metadisplay, guint arg1, guint arg2, guint arg3)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_meta_display_grab_op_begin(MetaDisplay * metadisplay, MetaScreen * arg1, MetaWindow * arg2, MetaGrabOp arg3)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::_handler_meta_display_grab_op_end(MetaDisplay * metadisplay, MetaScreen * arg1, MetaWindow * arg2, MetaGrabOp arg3)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

auto page_t::_handler_meta_display_modifiers_accelerator_activated(MetaDisplay * display) -> gboolean
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	return FALSE;
}

void page_t::_handler_meta_display_overlay_key(MetaDisplay * display)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

auto page_t::_handler_meta_display_restart(MetaDisplay * display) -> gboolean
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	return FALSE;
}

void page_t::_handler_meta_display_window_created(MetaDisplay * display, MetaWindow * window)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
}

void page_t::unmanage(client_managed_p mw)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
	assert(mw != nullptr);
	_net_client_list.remove(mw);

	/* if window is in move/resize/notebook move, do cleanup */
	cleanup_grab();

	for (auto & d : _workspace_map) {
		d.second->unmanage(mw);
	}

	sync_tree_view();
}

void page_t::insert_as_fullscreen(client_managed_p c, xcb_timestamp_t time) {
	//printf("call %s\n", __PRETTY_FUNCTION__);

	workspace_p workspace;
	if(not meta_window_is_always_on_all_workspaces(c->meta_window()))
		workspace = ensure_workspace(meta_window_get_workspace(c->meta_window()));
	else
		workspace = current_workspace();

	workspace->insert_as_fullscreen(c, time);
}

void page_t::insert_as_notebook(client_managed_p c, xcb_timestamp_t time)
{
	//printf("call %s\n", __PRETTY_FUNCTION__);
	workspace_p workspace;
	if(not meta_window_is_always_on_all_workspaces(c->meta_window()))
		workspace = ensure_workspace(meta_window_get_workspace(c->meta_window()));
	else
		workspace = current_workspace();

	workspace->insert_as_notebook(c, time);
	sync_tree_view();
}

void page_t::move_view_to_notebook(view_p v, notebook_p n, xcb_timestamp_t time)
{
	auto vn = dynamic_pointer_cast<view_notebook_t>(v);
	if(vn) {
		move_notebook_to_notebook(vn, n, time);
		return;
	}

	auto vf = dynamic_pointer_cast<view_floating_t>(v);
	if(vf) {
		move_floating_to_notebook(vf, n, time);
		return;
	}
}

void page_t::move_notebook_to_notebook(view_notebook_p vn, notebook_p n, xcb_timestamp_t time)
{
	//printf("call %s\n", __PRETTY_FUNCTION__);
	vn->remove_this_view();
	n->add_client_from_view(vn, time);
}

void page_t::move_floating_to_notebook(view_floating_p vf, notebook_p n, xcb_timestamp_t time)
{
	//printf("call %s\n", __PRETTY_FUNCTION__);
	vf->detach_myself();
	n->add_client_from_view(vf, time);
}

void page_t::toggle_fullscreen(view_p c, xcb_timestamp_t time) {
	auto vf = dynamic_pointer_cast<view_fullscreen_t>(c);
	if(vf) {
		vf->workspace()->switch_fullscreen_to_prefered_view_mode(vf, time);
	} else {
		c->workspace()->switch_view_to_fullscreen(c, time);
	}
}

void page_t::insert_window_in_notebook(
		client_managed_p x,
		notebook_p n,
		bool prefer_activate) {
	assert(x != nullptr);
	assert(n != nullptr);
	n->add_client(x, prefer_activate);
	sync_tree_view();
}

void page_t::apply_focus(xcb_timestamp_t time) {
	auto w = current_workspace();
	if(not w->_net_active_window.expired()) {
		meta_window_focus(w->_net_active_window.lock()->_client->meta_window(), time);
	}
}

void page_t::split_left(notebook_p nbk, view_p c, xcb_timestamp_t time) {
	auto parent = dynamic_pointer_cast<page_component_t>(nbk->parent()->shared_from_this());
	auto n = make_shared<notebook_t>(nbk.get());
	auto split = make_shared<split_t>(nbk.get(), VERTICAL_SPLIT);
	parent->replace(nbk, split);
	split->set_pack0(n);
	split->set_pack1(nbk);
	split->show();
	if (c != nullptr)
		move_view_to_notebook(c, n, time);
}

void page_t::split_right(notebook_p nbk, view_p c, xcb_timestamp_t time) {
	auto parent = dynamic_pointer_cast<page_component_t>(nbk->parent()->shared_from_this());
	auto n = make_shared<notebook_t>(nbk.get());
	auto split = make_shared<split_t>(nbk.get(), VERTICAL_SPLIT);
	parent->replace(nbk, split);
	split->set_pack0(nbk);
	split->set_pack1(n);
	split->show();
	if (c != nullptr)
		move_view_to_notebook(c, n, time);
}

void page_t::split_top(notebook_p nbk, view_p c, xcb_timestamp_t time) {
	auto parent = dynamic_pointer_cast<page_component_t>(nbk->parent()->shared_from_this());
	auto n = make_shared<notebook_t>(nbk.get());
	auto split = make_shared<split_t>(nbk.get(), HORIZONTAL_SPLIT);
	parent->replace(nbk, split);
	split->set_pack0(n);
	split->set_pack1(nbk);
	split->show();
	if (c != nullptr)
		move_view_to_notebook(c, n, time);
}

void page_t::split_bottom(notebook_p nbk, view_p c, xcb_timestamp_t time) {
	auto parent = dynamic_pointer_cast<page_component_t>(nbk->parent()->shared_from_this());
	auto n = make_shared<notebook_t>(nbk.get());
	auto split = make_shared<split_t>(nbk.get(), HORIZONTAL_SPLIT);
	parent->replace(nbk, split);
	split->set_pack0(nbk);
	split->set_pack1(n);
	split->show();
	if (c != nullptr)
		move_view_to_notebook(c, n, time);
}

void page_t::notebook_close(notebook_p nbk, xcb_timestamp_t time) {
	/**
	 * Closing notebook mean destroying the split base of this
	 * notebook, plus this notebook.
	 **/

	assert(nbk->parent() != nullptr);

	auto workspace = nbk->workspace();

	auto splt = dynamic_pointer_cast<split_t>(nbk->parent()->shared_from_this());

	/* if parent is _viewport then we cannot close current notebook */
	if(splt == nullptr)
		return;

	assert(nbk == splt->get_pack0() or nbk == splt->get_pack1());

	/* find the sibling branch of note that we want close */
	auto dst = dynamic_pointer_cast<page_component_t>((nbk == splt->get_pack0()) ? splt->get_pack1() : splt->get_pack0());

	assert(dst != nullptr);

	/* remove this split from tree  and replace it by sibling branch */
	dst->detach_myself();
	dynamic_pointer_cast<page_component_t>(splt->parent()->shared_from_this())->replace(splt, dst);

	/* move all client from destroyed notebook to new default pop */
	auto clients = nbk->gather_children_root_first<view_notebook_t>();
	auto default_notebook = workspace->ensure_default_notebook();
	for(auto i : clients) {
		default_notebook->add_client_from_view(i, XCB_CURRENT_TIME);
	}

	workspace->set_focus(nullptr, time);

}

vector<shared_ptr<tree_t>> page_t::get_all_children() const
{
	vector<shared_ptr<tree_t>> ret;
	for(auto const & x: _workspace_map) {
		auto tmp = x.second->get_all_children();
		ret.insert(ret.end(), tmp.begin(), tmp.end());
	}
	return ret;
}

void page_t::cleanup_grab() {
	_grab_handler = nullptr;
}

/* look for a notebook in tree base, that is deferent from nbk */
shared_ptr<notebook_t> page_t::get_another_notebook(shared_ptr<tree_t> base, shared_ptr<tree_t> nbk) {
	vector<shared_ptr<notebook_t>> l;

	if (base == nullptr) {
		l = current_workspace()->gather_children_root_first<notebook_t>();
	} else {
		l = base->gather_children_root_first<notebook_t>();
	}

	if (!l.empty()) {
		if (l.front() != nbk)
			return l.front();
		if (l.back() != nbk)
			return l.back();
	}

	return nullptr;

}

shared_ptr<workspace_t> page_t::find_workspace_of(shared_ptr<tree_t> n) {
	return n->workspace();
}

/**
 * This function will update _viewport layout on xrandr events.
 *
 * It cut the visible outputs area in rectangle, where _viewport will cover. The
 * rule is that the first output get the area first, the last one is cut in
 * sub-rectangle that do not overlap previous allocated area.
 **/
void page_t::update_viewport_layout()
{

	clutter_actor_set_position(_overlay_group, 0.0, 0.0);
	clutter_actor_set_size(_overlay_group, -1, -1);
	clutter_actor_set_position(_viewport_group, 0.0, 0.0);
	clutter_actor_set_size(_viewport_group, -1, -1);

	for(auto & w: _workspace_map) {
		w.second->update_viewports_layout();
	}
}

void page_t::remove_viewport(shared_ptr<workspace_t> d, shared_ptr<viewport_t> v) {

	/* Transfer clients to a valid notebook */
	for (auto x : v->gather_children_root_first<view_notebook_t>()) {
		d->ensure_default_notebook()->add_client_from_view(x, XCB_CURRENT_TIME);
	}

	for (auto x : v->gather_children_root_first<view_floating_t>()) {
		d->insert_as_floating(x->_client, XCB_CURRENT_TIME);
	}

}

void page_t::insert_as_floating(client_managed_p c, xcb_timestamp_t time) {
	//printf("call %s\n", __PRETTY_FUNCTION__);

	workspace_p workspace;
	if(not meta_window_is_always_on_all_workspaces(c->meta_window()))
		workspace = ensure_workspace(meta_window_get_workspace(c->meta_window()));
	else
		workspace = current_workspace();

	workspace->insert_as_floating(c, time);
	sync_tree_view();
}

auto page_t::lookup_client_managed_with(MetaWindow * w) const -> client_managed_p {
	for (auto & i: _net_client_list) {
		if (i->meta_window() == w) {
			return i;
		}
	}
	return nullptr;
}

auto page_t::lookup_client_managed_with(MetaWindowActor * w) const -> client_managed_p
{
	for (auto & i: _net_client_list) {
		if (i->meta_window_actor() == w) {
			return i;
		}
	}
	return nullptr;
}

auto page_t::ensure_workspace(MetaWorkspace * w) -> workspace_p
{
	if (has_key(_workspace_map, w)) {
		return _workspace_map[w];
	} else {
		auto d = make_shared<workspace_t>(this, w);
		_workspace_map[w] = d;
		d->disable();
		d->show(); // make is visible by default
		d->update_viewports_layout();
		return d;
	}
}


void replace(shared_ptr<page_component_t> const & src, shared_ptr<page_component_t> by) {
	throw exception_t{"Unexpectected use of page::replace function\n"};
}

/** debug function that try to print the state of page in stdout **/
void page_t::print_state() const {
	current_workspace()->print_tree(0);
	cout << "_current_workspace = " << _current_workspace << endl;

//	cout << "clients list:" << endl;
//	for(auto c: filter_class<client_base_t>(get_all_children())) {
//		cout << "client " << c->get_node_name() << " id = " << c->orig() << " ptr = " << c << " parent = " << c->parent() << endl;
//	}
//	cout << "end" << endl;

}

void page_t::switch_to_workspace(unsigned int workspace_id, xcb_timestamp_t time) {
	auto meta_workspace = meta_screen_get_workspace_by_index(_screen, workspace_id);
	auto workspace = ensure_workspace(meta_workspace);
	if(not workspace)
		return;

	if (workspace != current_workspace()) {
		log::printf("switch to workspace #%p\n", meta_workspace);
		_current_workspace->disable();
		_current_workspace = workspace;
		_current_workspace->enable();
		sync_tree_view();
	}
}

/* Inspired from openbox */
void page_t::run_cmd(std::string const & cmd_with_args)
{
	log::printf("executing %s\n", cmd_with_args.c_str());

    GError *e;
    gchar **argv = NULL;
    gchar *cmd;

    if (cmd_with_args == "null")
    	return;

    cmd = g_filename_from_utf8(cmd_with_args.c_str(), -1, NULL, NULL, NULL);
    if (!cmd) {
    	log::printf("Failed to convert the path \"%s\" from utf8\n", cmd_with_args.c_str());
        return;
    }

    e = NULL;
    if (!g_shell_parse_argv(cmd, NULL, &argv, &e)) {
    	log::printf("%s\n", e->message);
        g_error_free(e);
    } else {
        gchar *program = NULL;
        gboolean ok;

        e = NULL;
        ok = g_spawn_async(NULL, argv, NULL,
                           (GSpawnFlags)(G_SPAWN_SEARCH_PATH |
                           G_SPAWN_DO_NOT_REAP_CHILD),
                           NULL, NULL, NULL, &e);
        if (!ok) {
        	log::printf("%s\n", e->message);
            g_error_free(e);
        }

        g_free(program);
        g_strfreev(argv);
    }

    g_free(cmd);

    return;
}

shared_ptr<viewport_t> page_t::find_viewport_of(shared_ptr<tree_t> t) {
	while(t != nullptr) {
		auto ret = dynamic_pointer_cast<viewport_t>(t);
		if(ret != nullptr)
			return ret;
		t = t->parent()->shared_from_this();
	}

	return nullptr;
}

theme_t const * page_t::theme() const {
	return _theme;
}

auto page_t::dpy() const -> MetaDisplay *
{
	return _display;
}

void page_t::grab_start(shared_ptr<grab_handler_t> handler, guint32 time)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);

	auto global = shell_global_get();
	assert(_grab_handler == nullptr);
	if (shell_global_begin_modal(global, time, (MetaModalOptions)0)) {
		_grab_handler = handler;
	} else {
		log::printf("FAIL GRAB\n");
	}
}

void page_t::grab_stop(guint32 time)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);

	assert(_grab_handler != nullptr);
	_grab_handler = nullptr;

	auto global = shell_global_get();
	shell_global_end_modal(global, time);
}

void page_t::overlay_add(shared_ptr<tree_t> x) {
	current_workspace()->add_overlay(x);
}

shared_ptr<workspace_t> const & page_t::current_workspace() const {
	return _current_workspace;
}

auto page_t::conf() const -> page_configuration_t const & {
	return configuration;
}

auto page_t::net_client_list() -> list<client_managed_p> const &
{
	return _net_client_list;
}

void page_t::schedule_repaint()
{
	clutter_actor_queue_redraw(CLUTTER_ACTOR(_stage));
}

void page_t::damage_all() {
	schedule_repaint();
}

void page_t::sync_tree_view()
{
	/* Not thread safe */
	static bool guard = false;
	if (guard)
		return;
	guard = true;

	clutter_actor_remove_all_children(_viewport_group);
	auto viewport = current_workspace()->gather_children_root_first<viewport_t>();
	for (auto x : viewport) {
		if (x->get_default_view()) {
			clutter_actor_add_child(_viewport_group, x->get_default_view());
		}
	}

	auto children = current_workspace()->gather_children_root_first<view_t>();
	log::printf("found %lu children\n", children.size());
	for(auto x: children) {
		log::printf("raise %p\n", x->_client->meta_window());
		meta_window_raise(x->_client->meta_window());
		meta_window_actor_sync_visibility(x->_client->meta_window_actor());
	}

	guard = false;

}

bool page_t::has_grab_handler()
{
	return (_grab_handler != nullptr);
}

}

