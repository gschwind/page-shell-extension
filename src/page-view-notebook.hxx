/*
 * Copyright (2017) Benoit Gschwind
 *
 * view_notebook.hxx is part of page-compositor.
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

#ifndef SRC_VIEW_NOTEBOOK_HXX_
#define SRC_VIEW_NOTEBOOK_HXX_

extern "C" {
#include <meta/meta-plugin.h>
}

#include "page-page-types.hxx"

#include "page-view.hxx"
#include "page-icon-handler.hxx"

namespace page {

struct view_notebook_t :
	public view_t
{

	view_notebook_t(tree_t * ref, client_managed_p client);
	view_notebook_t(view_t * src);
	virtual ~view_notebook_t();

	auto shared_from_this() -> view_notebook_p;
	bool is_iconic() const;
	bool has_focus() const;
	auto title() const -> string;
	//auto icon() const -> shared_ptr<icon16>;
	void delete_window(xcb_timestamp_t t);

	auto parent_notebook() -> notebook_p;

	void _handler_position_changed(MetaWindow * window);
	void _handler_size_changed(MetaWindow * window);

	void set_client_area(rect const & area);

	/**
	 * view_t virtual API
	 **/

	virtual void remove_this_view() override;
	virtual void acquire_client() override;
	virtual void release_client() override;

	/**
	 * tree_t virtual API
	 **/

	using view_t::hide;
	using view_t::show;
	//virtual auto get_node_name() const -> string;
	//virtual void remove(shared_ptr<tree_t> t);

	virtual void reconfigure() override;

	//virtual auto button_press(xcb_button_press_event_t const * ev) -> button_action_e override;
	//virtual bool button_release(xcb_button_release_event_t const * ev);
	//virtual bool button_motion(xcb_motion_notify_event_t const * ev);
	//virtual bool leave(xcb_leave_notify_event_t const * ev);
	//virtual bool enter(xcb_enter_notify_event_t const * ev);
	//virtual void expose(xcb_expose_event_t const * ev);
	//virtual void trigger_redraw();

	//using view_rebased_t::get_toplevel_xid;
	//virtual rect get_window_position() const;
	//virtual void queue_redraw();

};

} /* namespace page */

#endif /* SRC_VIEW_NOTEBOOK_HXX_ */
