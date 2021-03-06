/*
#include <page-handler.h>
 * Copyright (2017) Benoit Gschwind
 *
 * page-plugin.cxx is part of page-compositor.
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

#include "page-handler.h"

#include "page-page.hxx"

struct _PageHandler {
	GObject parent_instance;
};

typedef struct {
	page::page_t * ctx;
} PageHandlerPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (PageHandler, page_handler, G_TYPE_OBJECT)


enum
{
  PROP_0,
  PROP_VIEWPORT_GROUP,
  PROP_OVERLAY_GROUP
};

void
page_handler_start(PageHandler * self, MetaDisplay * display, MetaScreen * screen, ClutterStage * stage)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_start(display, screen, stage);
}

void
page_handler_minimize(PageHandler * self, MetaWindowActor * window_actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_minimize(window_actor);
}

void
page_handler_unminimize(PageHandler * self, MetaWindowActor * window_actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_unminimize(window_actor);
}

void
page_handler_size_changed(PageHandler * self, MetaWindowActor * window_actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_size_changed(window_actor);
}

void
page_handler_size_change(PageHandler * self, MetaWindowActor * window_actor, MetaSizeChange const which_change, MetaRectangle * old_frame_rect, MetaRectangle * old_buffer_rect)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_size_change(window_actor, which_change, old_frame_rect, old_buffer_rect);
}

void
page_handler_map(PageHandler * self, MetaWindowActor * window_actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_map(window_actor);
}

void
page_handler_destroy(PageHandler * self, MetaWindowActor * window_actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_destroy(window_actor);
}

void
page_handler_switch_workspace(PageHandler * self, gint from, gint to, MetaMotionDirection direction)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_switch_workspace(from, to, direction);
}

void
page_handler_kill_switch_workspace(PageHandler * self)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_kill_switch_workspace();
}

void
page_handler_kill_window_effects(PageHandler * self, MetaWindowActor * actor)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_kill_window_effects(actor);
}

void
page_handler_show_tile_preview(PageHandler * self, MetaWindow * window, MetaRectangle *tile_rect, int tile_monitor_number)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_show_tile_preview(window, tile_rect, tile_monitor_number);
}

void
page_handler_hide_tile_preview(PageHandler * self)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_hide_tile_preview();
}

void
page_handler_show_window_menu(PageHandler * self, MetaWindow * window, MetaWindowMenuType menu, MetaRectangle * rect)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_show_window_menu(window, menu, rect);
}

gboolean
page_handler_keybinding_filter(PageHandler * self, MetaKeyBinding * binding)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	return priv->ctx->_handler_plugin_keybinding_filter(binding);
}

void
page_handler_confirm_display_change(PageHandler * self)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx->_handler_plugin_confirm_display_change();
}

//MetaCloseDialog *
//page_handler_create_close_dialog(PageHandler * self, MetaWindow * window)
//{
//	PageHandlerPrivate * priv = page_handler_get_instance_private (self);
//	priv->ctx->_handler_plugin_create_close_dialog(window);
//}
//
//MetaInhibitShortcutsDialog *
//page_handler_create_inhibit_shortcuts_dialog(PageHandler * self, MetaWindow * window)
//{
//	PageHandlerPrivate * priv = page_handler_get_instance_private (self);
//	priv->ctx->_handler_plugin_create_inhibit_shortcuts_dialog(window);
//}

static void
page_handler_dispose(GObject *gobject)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (PAGE_HANDLER(gobject)));

	/* In dispose(), you are supposed to free all types referenced from this
	 * object which might themselves hold a reference to self. Generally,
	 * the most simple solution is to unref all members on which you own a
	 * reference.
	 */

	/* dispose() might be called multiple times, so we must guard against
	 * calling g_object_unref() on an invalid GObject by setting the member
	 * NULL; g_clear_object() does this for us.
	 */

	  delete priv->ctx;
	  priv->ctx = nullptr;

	/* Always chain up to the parent class; there is no need to check if
	 * the parent class implements the dispose() virtual function: it is
	 * always guaranteed to do so
	 */
	G_OBJECT_CLASS(page_handler_parent_class)->dispose(gobject);
}

static void
page_handler_finalize (GObject *gobject)
{
  /* Always chain up to the parent class; as with dispose(), finalize()
   * is guaranteed to exist on the parent's class virtual function table
   */
  G_OBJECT_CLASS (page_handler_parent_class)->finalize (gobject);
}

static void
page_handler_set_property(GObject         *object,
                          guint            prop_id,
                          const GValue    *value,
                          GParamSpec      *pspec)
{
  switch (prop_id)
    {
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

static void
page_handler_get_property(GObject         *object,
                          guint            prop_id,
                          GValue          *value,
                          GParamSpec      *pspec)
{
  PageHandler * self = PAGE_HANDLER (object);
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));

  switch (prop_id)
    {
    case PROP_VIEWPORT_GROUP:
      g_value_set_object (value, priv->ctx->_viewport_group);
      break;
    case PROP_OVERLAY_GROUP:
      g_value_set_object (value, priv->ctx->_overlay_group);
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

static void
page_handler_class_init (PageHandlerClass *klass)
{
	GObjectClass * gobject_class = G_OBJECT_CLASS(klass);
//	MetaPluginClass * meta_plugin_class = META_PLUGIN_CLASS(klass);

	gobject_class->finalize = page_handler_finalize;
	gobject_class->dispose = page_handler_dispose;
	gobject_class->set_property = page_handler_set_property;
	gobject_class->get_property = page_handler_get_property;

	g_object_class_install_property (gobject_class,
			PROP_VIEWPORT_GROUP,
			g_param_spec_object ("viewport-group",
								"Viewport Layer",
								"Actor holding viewport actors",
								CLUTTER_TYPE_ACTOR,
								G_PARAM_READABLE));

	g_object_class_install_property (gobject_class,
			PROP_OVERLAY_GROUP,
			g_param_spec_object ("overlay-group",
								"Overlay Layer",
								"Actor holding overlay actors",
								CLUTTER_TYPE_ACTOR,
								G_PARAM_READABLE));

	//g_type_class_add_private(gobject_class, sizeof(PagePluginPrivate));

}

static void page_handler_init(PageHandler * self)
{
	auto priv = reinterpret_cast<PageHandlerPrivate*>(page_handler_get_instance_private (self));
	priv->ctx = new page::page_t();
}
