/*
 * Copyright (2017) Benoit Gschwind
 *
 * view_notebook.cxx is part of page-compositor.
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

#include "page-view-notebook.hxx"

#include "page-view.hxx"
#include "page-client-managed.hxx"
#include "page-workspace.hxx"
#include "page-page.hxx"
#include "page-grab-handlers.hxx"

namespace page {

view_notebook_t::view_notebook_t(tree_t * ref, client_managed_p client) :
	view_rebased_t{ref, client}
{

}

view_notebook_t::view_notebook_t(view_rebased_t * src) :
	view_rebased_t{src}
{

}

view_notebook_t::~view_notebook_t()
{

}

auto view_notebook_t::shared_from_this() -> view_notebook_p
{
	return static_pointer_cast<view_notebook_t>(tree_t::shared_from_this());
}

bool view_notebook_t::is_iconic() const
{
	return not _is_visible;
}

bool view_notebook_t::has_focus() const
{
	return meta_window_has_focus(_client->meta_window());
}

auto view_notebook_t::title() const -> string
{
	return _client->title();
}

void view_notebook_t::delete_window(xcb_timestamp_t t) {
	log::printf("request close for '%s'\n", title().c_str());
	_client->delete_window(t);
}

auto view_notebook_t::parent_notebook() -> notebook_p
{
	assert((_parent != nullptr) and (_parent->parent() != nullptr));
	return dynamic_pointer_cast<notebook_t>(_parent->parent()->shared_from_this());
}

void view_notebook_t::_handler_position_changed(MetaWindow * window)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
//	/* disable frame move */
	if (_is_client_owner())
		meta_window_move_resize_frame(window, FALSE,
				_client->_absolute_position.x,
				_client->_absolute_position.y,
				_client->_absolute_position.w,
				_client->_absolute_position.h);
}

void view_notebook_t::_handler_size_changed(MetaWindow * window)
{
	log::printf("call %s\n", __PRETTY_FUNCTION__);
//	/* disable frame resize */
	if (_is_client_owner())
		meta_window_move_resize_frame(window, FALSE,
				_client->_absolute_position.x,
				_client->_absolute_position.y,
				_client->_absolute_position.w,
				_client->_absolute_position.h);
}

void view_notebook_t::xxactivate(xcb_timestamp_t time)
{
	auto nbk = parent_notebook();
	nbk->activate(shared_from_this(), time);
}

void view_notebook_t::remove_this_view()
{
	auto nbk = parent_notebook();
	nbk->remove_view_notebook(shared_from_this());
}

void view_notebook_t::acquire_client()
{
	assert(_root->is_enable());

	/* we already are the owner */
	if (_is_client_owner())
		return;

	/* release the previous owner and aquire the client */
	_client->acquire(this);

	meta_window_change_workspace(_client->meta_window(), _root->_meta_workspace);

	if (meta_window_is_fullscreen(_client->meta_window()))
		meta_window_unmake_fullscreen(_client->meta_window());
	if (meta_window_is_shaded(_client->meta_window()))
		meta_window_unshade(_client->meta_window(), 0);

	meta_window_make_tiled(_client->meta_window());
	meta_window_move_resize_frame(_client->_meta_window, FALSE,
			_client->_absolute_position.x,
			_client->_absolute_position.y,
			_client->_absolute_position.w,
			_client->_absolute_position.h);

	// disable move/resizes.
	g_connect(_client->meta_window(), "position-changed", &view_notebook_t::_handler_position_changed);
	g_connect(_client->meta_window(), "size-changed", &view_notebook_t::_handler_size_changed);

	reconfigure();

}

void view_notebook_t::release_client()
{
	g_disconnect_from_obj(_client->meta_window());
	if (meta_window_is_tiled(_client->meta_window()))
		meta_window_unmake_tiled(_client->meta_window());
	meta_window_unminimize(_client->meta_window());
}

void view_notebook_t::set_focus_state(bool is_focused)
{
	view_rebased_t::set_focus_state(is_focused);
	if (is_focused)
		parent_notebook()->activate(shared_from_this(), 0);
	parent_notebook()->_client_focus_change(_client.get());
}

void view_notebook_t::reconfigure()
{
	if(not _is_client_owner())
		return;
	meta_window_move_resize_frame(_client->_meta_window, FALSE,
			_client->_absolute_position.x,
			_client->_absolute_position.y,
			_client->_absolute_position.w,
			_client->_absolute_position.h);

	if (_is_visible) {
		meta_window_unminimize(_client->meta_window());
	} else {
		meta_window_minimize(_client->meta_window());
	}

	meta_window_actor_sync_visibility(_client->meta_window_actor());

}

} /* namespace page */
