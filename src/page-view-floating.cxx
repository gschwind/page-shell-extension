/*
 * Copyright (2017) Benoit Gschwind
 *
 * view_floating.cxx is part of page-compositor.
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

#include "page-view-floating.hxx"
#include "page-workspace.hxx"
#include "page-page.hxx"
#include "page-grab-handlers.hxx"

namespace page {

view_floating_t::view_floating_t(tree_t * ref, client_managed_p client) :
		view_t{ref, client}
{
	_init();
}

view_floating_t::view_floating_t(view_t * src) :
	view_t{src, src->_client}
{
	_init();
}

view_floating_t::~view_floating_t()
{
	release_client();
}

auto view_floating_t::shared_from_this() -> view_floating_p
{
	return static_pointer_cast<view_floating_t>(tree_t::shared_from_this());
}

void view_floating_t::_init()
{
	_client->_floating_wished_position = _client->position();

}

void view_floating_t::_handler_position_changed(MetaWindow * window)
{
	_client->_floating_wished_position = _client->position();
}

void view_floating_t::_handler_size_changed(MetaWindow * window)
{
	_client->_floating_wished_position = _client->position();
}

void view_floating_t::remove_this_view()
{
	view_t::remove_this_view();
	_root->_ctx->schedule_repaint();
}

void view_floating_t::acquire_client()
{
	/* we already are the owner */
	if (_is_client_owner())
		return;

	/* release the previous owner and aquire the client */
	_client->acquire(this);

	meta_window_unminimize(_client->meta_window());
	if (meta_window_is_fullscreen(_client->meta_window()))
		meta_window_unmake_fullscreen(_client->meta_window());
	if (meta_window_is_tiled(_client->meta_window()))
		meta_window_unmake_tiled(_client->meta_window());

	g_connect(_client->meta_window(), "position-changed", &view_floating_t::_handler_position_changed);
	g_connect(_client->meta_window(), "size-changed", &view_floating_t::_handler_size_changed);

}

void view_floating_t::release_client()
{
	/* already released */
	if (not _is_client_owner())
		return;

	g_disconnect_from_obj(_client->meta_window());

	_client->release(this);
}

void view_floating_t::reconfigure()
{
	// do nothing managed by gnome-shell
}

} /* namespace page */
