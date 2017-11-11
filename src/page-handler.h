/*
 * Copyright (2017) Benoit Gschwind
 *
 * page-handler.hxx is part of page-compositor.
 *
 * page-compositor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * page-compositor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with page-compositor.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#ifndef SRC_PAGE_HANDLER_H_
#define SRC_PAGE_HANDLER_H_

#include <glib-object.h>
#include <meta/meta-plugin.h>

#ifdef __cplusplus__
extern "C" {
#endif

G_BEGIN_DECLS

/*
 * NOTES: "page" is a prefix and "handler" is the name of the object type.
 */

#define PAGE_TYPE_HANDLER page_handler_get_type ()
G_DECLARE_FINAL_TYPE (PageHandler, page_handler, PAGE, HANDLER, GObject)

PageHandler *
page_handler_new(void);

void
page_handler_start(PageHandler * self, MetaDisplay * display, MetaScreen * screen, ClutterStage * stage);

void
page_handler_minimize(PageHandler * self, MetaWindowActor * actor);

void
page_handler_unminimize(PageHandler * self, MetaWindowActor * actor);

void
page_handler_size_changed(PageHandler * self, MetaWindowActor * window_actor);

void
page_handler_size_change(PageHandler * self, MetaWindowActor * window_actor, MetaSizeChange const which_change, MetaRectangle * old_frame_rect, MetaRectangle * old_buffer_rect);

void
page_handler_map(PageHandler * self, MetaWindowActor * window_actor);

void
page_handler_destroy(PageHandler * self, MetaWindowActor * actor);

void
page_handler_switch_workspace(PageHandler * self, gint from, gint to, MetaMotionDirection direction);

void
page_handler_kill_switch_workspace(PageHandler * self);

void
page_handler_kill_window_effects(PageHandler * self, MetaWindowActor * actor);

void
page_handler_show_tile_preview(PageHandler * self, MetaWindow * window, MetaRectangle *tile_rect, int tile_monitor_number);

void
page_handler_hide_tile_preview(PageHandler * self);

void
page_handler_show_window_menu(PageHandler * self, MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect);

gboolean
page_handler_keybinding_filter(PageHandler * self, MetaKeyBinding * binding);

void
page_handler_confirm_display_change(PageHandler * self);

//MetaCloseDialog *
//page_handler_create_close_dialog(PageHandler * self, MetaWindow * window);
//
//MetaInhibitShortcutsDialog *
//page_handler_create_inhibit_shortcuts_dialog(PageHandler * self, MetaWindow * window);


G_END_DECLS

#ifdef __cplusplus__
}
#endif

#endif /* SRC_PAGE_HANDLER_H_ */
