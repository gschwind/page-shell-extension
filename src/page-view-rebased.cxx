/*
 * Copyright (2017) Benoit Gschwind
 *
 * view_rebased.cxx is part of page-compositor.
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

#include "page-view-rebased.hxx"

#include "page-page.hxx"
#include "page-workspace.hxx"

namespace page {

view_rebased_t::view_rebased_t(tree_t * ref, client_managed_p client) :
	view_t{ref, client}
{
//	_client->_client_proxy->set_border_width(0);
//	_base = std::unique_ptr<_base_frame_t>{new _base_frame_t(_root->_ctx, _client->_client_proxy->visualid(), _client->_client_proxy->visual_depth())};
//	_base->_window->select_input(MANAGED_BASE_WINDOW_EVENT_MASK);
//	_grab_button_unsafe();
//	xcb_flush(_root->_ctx->_dpy->xcb());
}

view_rebased_t::view_rebased_t(view_rebased_t * src) :
	view_t{src->_root, src->_client}
{

}

view_rebased_t::~view_rebased_t()
{

}

auto view_rebased_t::shared_from_this() -> view_rebased_p
{
	return static_pointer_cast<view_rebased_t>(tree_t::shared_from_this());
}

auto view_rebased_t::get_default_view() const -> ClutterActor *
{
	return CLUTTER_ACTOR(_client->_meta_window_actor);
}

} /* namespace page */
