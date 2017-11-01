/*
 * notebook.cxx
 *
 * copyright (2010-2014) Benoit Gschwind
 *
 * This code is licensed under the GPLv3. see COPYING file for more details.
 *
 */

#include "page-notebook.hxx"

#include "page-page.hxx"
#include "page-workspace.hxx"
#include "page-dropdown-menu.hxx"
#include "page-grab-handlers.hxx"
#include "page-view-notebook.hxx"

namespace page {

using namespace std;

notebook_t::notebook_t(tree_t * ref) :
	page_component_t{ref},
	_ctx{ref->_root->_ctx},
	_is_default{false},
	_selected{nullptr},
	_exposay{false},
	_mouse_over{nullptr, nullptr},
	_can_hsplit{true},
	_can_vsplit{true},
	_theme_client_tabs_offset{0},
	_has_scroll_arrow{false},
	animation_duration{ref->_root->_ctx->conf()._fade_in_time},
	_has_pending_fading_timeout{false}
{
	//printf("call %s (%p)\n", __PRETTY_FUNCTION__, this);

	_stack_is_locked = true;

	_notebook_view_layer = make_shared<tree_t>(_root);
	_fading_notebook_layer = make_shared<tree_t>(_root);
	_tooltips_layer = make_shared<tree_t>(_root);

	push_back(_notebook_view_layer);
	push_back(_fading_notebook_layer);
	push_back(_tooltips_layer);

	_notebook_view_layer->show();
	_fading_notebook_layer->show();
	_tooltips_layer->show();

}

notebook_t::~notebook_t() {
	//printf("call %s (%p)\n", __PRETTY_FUNCTION__, this);
	_clients_tab_order.clear();
}

bool notebook_t::add_client(client_managed_p c, xcb_timestamp_t time) {
	assert(not _has_client(c));
	assert(c != nullptr);
	auto vn = make_shared<view_notebook_t>(this, c);
	_add_client_view(vn, time);
	return true;
}

void notebook_t::add_client_from_view(view_rebased_p vr, xcb_timestamp_t time)
{
	assert(not _has_client(vr->_client));
	assert(vr != nullptr);
	auto vn = make_shared<view_notebook_t>(vr.get());
	_add_client_view(vn, time);
}

void notebook_t::replace(shared_ptr<page_component_t> src, shared_ptr<page_component_t> by) {
	throw std::runtime_error("cannot replace in notebook");
}

void notebook_t::remove_view_notebook(view_notebook_p vn) {
	assert(has_key(_clients_tab_order, vn));

	/** update selection **/
	if (_selected == vn) {
		// TODO
		//_start_fading();
		_selected->hide();
		_selected = nullptr;
	}

	// cleanup

	disconnect(vn->_client->on_title_change);
	disconnect(vn->_client->on_destroy);

	_clients_tab_order.remove(vn);

	_mouse_over_reset();

	if(not _ctx->conf()._enable_shade_windows
			and not _clients_tab_order.empty()
			and _selected == nullptr
			and not _exposay) {

		// find the most rescent focussed tabs
		_root->client_focus_history_remove(vn);
		view_notebook_p xvn = nullptr;
		auto focus_history = filter_class<view_notebook_t>(lock(_root->client_focus_history()));
		for(auto &x: focus_history) {
			if(x->parent_notebook().get() == this) {
				xvn = x;
				break;
			}
		}

		if(xvn) {
			_selected = xvn;
		} else {
			_selected = _clients_tab_order.front();
		}

		if (_selected != nullptr and _is_visible) {
			_selected->show();
		}
	}

	_notebook_view_layer->remove(vn);
	_update_all_layout();
}

void notebook_t::_set_selected(view_notebook_p c) {
	/** already selected **/
	if(_selected == c and not c->is_iconic())
		return;

	if(_selected != nullptr and c != _selected) {
		_selected->hide();
	}
	/** set selected **/
	_selected = c;
	update_client_position(_selected);
	if(_is_visible) {
		_selected->show();
	}
}

void notebook_t::_add_client_view(view_notebook_p vn, xcb_timestamp_t time)
{
	_notebook_view_layer->push_back(vn);
	if(_root->is_enable())
		vn->acquire_client();

	_clients_tab_order.push_front(vn);

	connect(vn->_client->on_destroy, this, &notebook_t::_client_destroy);
	connect(vn->_client->on_title_change, this, &notebook_t::_client_title_change);

	update_client_position(vn);

	/* remove current selected */
	if (_selected != nullptr) {
		_selected->hide();
	}

	/* select the new one */
	_selected = vn;
	if(_is_visible) {
		_selected->show();
		_root->set_focus(_selected, time);
	} else {
		_selected->hide();
	}

	_selected->reconfigure();
	_update_all_layout();
}

void notebook_t::activate(view_notebook_p vn, xcb_timestamp_t time)
{
	assert(has_key(_clients_tab_order, vn));
	_set_selected(vn);
	vn->raise();
	_root->set_focus(vn, time);
	_ctx->schedule_repaint();
}

void notebook_t::update_client_position(view_notebook_p c) {
	/* compute the window placement within notebook */
	_client_position = _compute_client_size(c->_client);
	c->_client->_absolute_position = to_root_position(_client_position);
}

void notebook_t::iconify_client(view_notebook_p x) {
	if(_selected == x) {
		_selected->hide();
		queue_redraw();
	}
}

void notebook_t::set_allocation(rect const & area) {
	int width, height;
	get_min_allocation(width, height);
	assert(area.w >= width);
	assert(area.h >= height);

	_allocation = area;
	_update_all_layout();
	queue_redraw();
}

void notebook_t::_update_all_layout() {

	int min_width;
	int min_height;
	get_min_allocation(min_width, min_height);

	if (_allocation.w < min_width * 2 + _ctx->theme()->split.margin.left
			+ _ctx->theme()->split.margin.right  + _ctx->theme()->split.width) {
		_can_vsplit = false;
	} else {
		_can_vsplit = true;
	}

	if (_allocation.h < min_height * 2 + _ctx->theme()->split.margin.top
			+ _ctx->theme()->split.margin.bottom  + _ctx->theme()->split.width) {
		_can_hsplit = false;
	} else {
		_can_hsplit = true;
	}

	_client_area.x = _allocation.x + _ctx->theme()->notebook.margin.left;
	_client_area.y = _allocation.y + _ctx->theme()->notebook.margin.top + _ctx->theme()->notebook.tab_height;
	_client_area.w = _allocation.w - _ctx->theme()->notebook.margin.left - _ctx->theme()->notebook.margin.right;
	_client_area.h = _allocation.h - _ctx->theme()->notebook.margin.top - _ctx->theme()->notebook.margin.bottom - _ctx->theme()->notebook.tab_height;

	auto window_position = get_window_position();

	_area.tab.x = _allocation.x + window_position.x;
	_area.tab.y = _allocation.y + window_position.y;
	_area.tab.w = _allocation.w;
	_area.tab.h = _ctx->theme()->notebook.tab_height;

	if(_can_hsplit) {
		_area.top.x = _allocation.x + window_position.x;
		_area.top.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
		_area.top.w = _allocation.w;
		_area.top.h = (_allocation.h - _ctx->theme()->notebook.tab_height) * 0.2;

		_area.bottom.x = _allocation.x + window_position.x;
		_area.bottom.y = _allocation.y + window_position.y + (0.8 * (allocation().h - _ctx->theme()->notebook.tab_height));
		_area.bottom.w = _allocation.w;
		_area.bottom.h = (_allocation.h - _ctx->theme()->notebook.tab_height) * 0.2;
	} else {
		_area.top = rect{};
		_area.bottom = rect{};
	}

	if(_can_vsplit) {
		_area.left.x = _allocation.x + window_position.x;
		_area.left.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
		_area.left.w = _allocation.w * 0.2;
		_area.left.h = (_allocation.h - _ctx->theme()->notebook.tab_height);

		_area.right.x = _allocation.x + window_position.x + _allocation.w * 0.8;
		_area.right.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
		_area.right.w = _allocation.w * 0.2;
		_area.right.h = (_allocation.h - _ctx->theme()->notebook.tab_height);
	} else {
		_area.left = rect{};
		_area.right = rect{};
	}

	_area.popup_top.x = _allocation.x + window_position.x;
	_area.popup_top.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
	_area.popup_top.w = _allocation.w;
	_area.popup_top.h = (_allocation.h - _ctx->theme()->notebook.tab_height) * 0.5;

	_area.popup_bottom.x = _allocation.x + window_position.x;
	_area.popup_bottom.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height
			+ (0.5 * (_allocation.h - _ctx->theme()->notebook.tab_height));
	_area.popup_bottom.w = _allocation.w;
	_area.popup_bottom.h = (_allocation.h - _ctx->theme()->notebook.tab_height) * 0.5;

	_area.popup_left.x = _allocation.x + window_position.x;
	_area.popup_left.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
	_area.popup_left.w = _allocation.w * 0.5;
	_area.popup_left.h = (_allocation.h - _ctx->theme()->notebook.tab_height);

	_area.popup_right.x = _allocation.x + window_position.x + allocation().w * 0.5;
	_area.popup_right.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height;
	_area.popup_right.w = _allocation.w * 0.5;
	_area.popup_right.h = (_allocation.h - _ctx->theme()->notebook.tab_height);

	_area.popup_center.x = _allocation.x + window_position.x + allocation().w * 0.2;
	_area.popup_center.y = _allocation.y + window_position.y + _ctx->theme()->notebook.tab_height + (allocation().h - _ctx->theme()->notebook.tab_height) * 0.2;
	_area.popup_center.w = _allocation.w * 0.6;
	_area.popup_center.h = (_allocation.h - _ctx->theme()->notebook.tab_height) * 0.6;

	if(_client_area.w <= 0) {
		_client_area.w = 1;
	}

	if(_client_area.h <= 0) {
		_client_area.h = 1;
	}

	if (_selected) {
		update_client_position(_selected);
		_selected->reconfigure();
	}

	_mouse_over_reset();
	_update_theme_notebook(_theme_notebook);
	_update_notebook_buttons_area();

	_ctx->schedule_repaint();
	queue_redraw();
}

rect notebook_t::_compute_client_size(shared_ptr<client_managed_t> c) {
	dimention_t<unsigned> size(_client_area.w, _client_area.h);
			//c->compute_size_with_constrain(_client_area.w, _client_area.h);

	/** if the client cannot fit into client_area, clip it **/
	if(size.width > _client_area.w) {
		size.width = _client_area.w;
	}

	if(size.height > _client_area.h) {
		size.height = _client_area.h;
	}

	/* compute the window placement within notebook */
	rect client_size;
	client_size.x = floor((_client_area.w - size.width) / 2.0);
	client_size.y = floor((_client_area.h - size.height) / 2.0);
	client_size.w = size.width;
	client_size.h = size.height;

	client_size.x += _client_area.x;
	client_size.y += _client_area.y;

	return client_size;

}

auto notebook_t::selected() const -> view_notebook_p {
	return _selected;
}

bool notebook_t::is_default() const {
	return _is_default;
}

void notebook_t::set_default(bool x) {
	_is_default = x;
	_theme_notebook.is_default = _is_default;
	queue_redraw();
}

string notebook_t::get_node_name() const {
	ostringstream oss;
	oss << _get_node_name<'N'>() << " selected = " << _selected;
	return oss.str();
}

void notebook_t::render_legacy(cairo_t * cr) {
	_ctx->theme()->render_notebook(cr, &_theme_notebook);

	if(_theme_client_tabs.size() > 0) {
		cairo_surface_t * pix = cairo_image_surface_create(CAIRO_FORMAT_ARGB32,
				_theme_client_tabs.back().position.x + 100,
				_ctx->theme()->notebook.tab_height);
		cairo_t * xcr = cairo_create(pix);

		cairo_set_operator(xcr, CAIRO_OPERATOR_SOURCE);
		cairo_set_source_rgba(xcr, 0.0, 0.0, 0.0, 0.0);
		cairo_paint(xcr);

		_ctx->theme()->render_iconic_notebook(xcr, _theme_client_tabs);
		cairo_destroy(xcr);

		cairo_save(cr);
		cairo_set_source_surface(cr, pix,
				_theme_client_tabs_area.x - _theme_client_tabs_offset,
				_theme_client_tabs_area.y);
		cairo_clip(cr, _theme_client_tabs_area);
		cairo_paint(cr);

		cairo_restore(cr);
		cairo_surface_destroy(pix);
	}

}

rect notebook_t::_compute_notebook_bookmark_position() const {
	return rect(
		_allocation.x + _allocation.w
		- _ctx->theme()->notebook.close_width
		- _ctx->theme()->notebook.hsplit_width
		- _ctx->theme()->notebook.vsplit_width
		- _ctx->theme()->notebook.mark_width,
		_allocation.y,
		_ctx->theme()->notebook.mark_width,
		_ctx->theme()->notebook.tab_height
	);
}

rect notebook_t::_compute_notebook_vsplit_position() const {
	return rect(
		_allocation.x + _allocation.w
			- _ctx->theme()->notebook.close_width
			- _ctx->theme()->notebook.hsplit_width
			- _ctx->theme()->notebook.vsplit_width,
		_allocation.y,
		_ctx->theme()->notebook.vsplit_width,
		_ctx->theme()->notebook.tab_height
	);
}

rect notebook_t::_compute_notebook_hsplit_position() const {

	return rect(
		_allocation.x + _allocation.w - _ctx->theme()->notebook.close_width - _ctx->theme()->notebook.hsplit_width,
		_allocation.y,
		_ctx->theme()->notebook.hsplit_width,
		_ctx->theme()->notebook.tab_height
	);

}

rect notebook_t::_compute_notebook_close_position() const {
	return rect(
		_allocation.x + _allocation.w - _ctx->theme()->notebook.close_width,
		_allocation.y,
		_ctx->theme()->notebook.close_width,
		_ctx->theme()->notebook.tab_height
	);
}

rect notebook_t::_compute_notebook_menu_position() const {
	return rect(
		_allocation.x,
		_allocation.y,
		_ctx->theme()->notebook.menu_button_width,
		_ctx->theme()->notebook.tab_height
	);

}

void notebook_t::_update_notebook_buttons_area() {

	_client_buttons.clear();

	_area.button_close = _compute_notebook_close_position();
	_area.button_hsplit = _compute_notebook_hsplit_position();
	_area.button_vsplit = _compute_notebook_vsplit_position();
	_area.button_select = _compute_notebook_bookmark_position();
	_area.button_exposay = _compute_notebook_menu_position();

	if(_clients_tab_order.size() > 0) {

		if(_selected != nullptr) {
			rect & b = _theme_notebook.selected_client.position;

			_area.close_client.x = b.x + b.w
					- _ctx->theme()->notebook.selected_close_width;
			_area.close_client.y = b.y;
			_area.close_client.w =
					_ctx->theme()->notebook.selected_close_width;
			_area.close_client.h = _ctx->theme()->notebook.tab_height;

			_area.undck_client.x = b.x + b.w
					- _ctx->theme()->notebook.selected_close_width
					- _ctx->theme()->notebook.selected_unbind_width;
			_area.undck_client.y = b.y;
			_area.undck_client.w = _ctx->theme()->notebook.selected_unbind_width;
			_area.undck_client.h = _ctx->theme()->notebook.tab_height;

			_client_buttons.push_back(std::make_tuple(b, view_notebook_w{_selected}, &_theme_notebook.selected_client));

		} else {
			_area.close_client = rect{};
			_area.undck_client = rect{};
		}

		if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w) {
			_theme_client_tabs_offset = 0;
		}

		if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_offset) {
			_theme_client_tabs_offset = _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_area.w;
		}

		if(_theme_client_tabs_offset < 0)
			_theme_client_tabs_offset = 0;

		auto c = _clients_tab_order.begin();
		for (auto & tab: _theme_client_tabs) {
			rect pos = tab.position;
			pos.x += _theme_client_tabs_area.x - _theme_client_tabs_offset;
			pos.y += _theme_client_tabs_area.y;
			_client_buttons.push_back(make_tuple(pos,
					view_notebook_w{*c}, &tab));
			++c;
		}

	}
}

void notebook_t::_update_theme_notebook(theme_notebook_t & theme_notebook) {
	theme_notebook.root_x = get_window_position().x;
	theme_notebook.root_y = get_window_position().y;
	theme_notebook.can_hsplit = _can_hsplit;
	theme_notebook.can_vsplit = _can_vsplit;
	theme_notebook.client_count = _clients_tab_order.size();

	_theme_client_tabs.clear();

	if (_clients_tab_order.size() != 0) {
		int selected_box_width = ((int)_allocation.w
				- (int)_ctx->theme()->notebook.close_width
				- (int)_ctx->theme()->notebook.hsplit_width
				- (int)_ctx->theme()->notebook.vsplit_width
				- (int)_ctx->theme()->notebook.mark_width
				- (int)_ctx->theme()->notebook.menu_button_width)
				- (int)_clients_tab_order.size() * (int)_ctx->theme()->notebook.iconic_tab_width;

		if(selected_box_width < 200) {
			selected_box_width = 200;
		}

		_theme_client_tabs_area.x = _allocation.x
				+ _ctx->theme()->notebook.menu_button_width
				+ selected_box_width;
		_theme_client_tabs_area.y = _allocation.y;
		_theme_client_tabs_area.w = ((int)_allocation.w
				- (int)_ctx->theme()->notebook.close_width
				- (int)_ctx->theme()->notebook.hsplit_width
				- (int)_ctx->theme()->notebook.vsplit_width
				- (int)_ctx->theme()->notebook.mark_width
				- (int)_ctx->theme()->notebook.menu_button_width
				- (int)selected_box_width);
		_theme_client_tabs_area.h = _ctx->theme()->notebook.tab_height;

		if (_selected != nullptr) {
			/** copy the tab context **/
			theme_notebook.selected_client = theme_tab_t{};
			theme_notebook.selected_client.position = rect(
					_allocation.x + _ctx->theme()->notebook.menu_button_width,
					_allocation.y,
					selected_box_width,
					_ctx->theme()->notebook.tab_height);

			if(_selected->has_focus()) {
				theme_notebook.selected_client.tab_color =
						_ctx->theme()->get_focused_color();
			} else {
				theme_notebook.selected_client.tab_color =
						_ctx->theme()->get_selected_color();
			}

			theme_notebook.selected_client.title = _selected->title();
			//theme_notebook.selected_client.icon = _selected->icon();
			theme_notebook.selected_client.is_iconic = _selected->is_iconic();
			theme_notebook.has_selected_client = true;
		} else {
			theme_notebook.has_selected_client = false;
		}

		int offset = 0;
		for (auto const & i : _clients_tab_order) {
			_theme_client_tabs.push_back(theme_tab_t { });
			auto & tab = _theme_client_tabs.back();
			tab.position = rect(
				offset,
				0,
				_ctx->theme()->notebook.iconic_tab_width,
				_ctx->theme()->notebook.tab_height);

			if (i->has_focus()) {
				tab.tab_color = _ctx->theme()->get_focused_color();
			} else if (_selected == i) {
				tab.tab_color = _ctx->theme()->get_selected_color();
			} else {
				tab.tab_color = _ctx->theme()->get_normal_color();
			}
			tab.title = i->title();
			//tab.icon = i->icon();
			tab.is_iconic = i->is_iconic();
			offset += _ctx->theme()->notebook.iconic_tab_width;
		}

		_area.left_scroll_arrow = rect{};
		_area.right_scroll_arrow = rect{};
		if(_theme_client_tabs_area.w < _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w) {
			_has_scroll_arrow = true;
			theme_notebook.has_scroll_arrow = true;

			_area.left_scroll_arrow.x = _theme_client_tabs_area.x;
			_area.left_scroll_arrow.y = _allocation.y;
			_area.left_scroll_arrow.w = _ctx->theme()->notebook.left_scroll_arrow_width;
			_area.left_scroll_arrow.h = _ctx->theme()->notebook.tab_height;

			_area.right_scroll_arrow.x = _theme_client_tabs_area.x + _theme_client_tabs_area.w - _ctx->theme()->notebook.right_scroll_arrow_width;
			_area.right_scroll_arrow.y = _allocation.y;
			_area.right_scroll_arrow.w = _ctx->theme()->notebook.left_scroll_arrow_width;
			_area.right_scroll_arrow.h = _ctx->theme()->notebook.tab_height;

			theme_notebook.left_arrow_position = _area.left_scroll_arrow;
			theme_notebook.right_arrow_position = _area.right_scroll_arrow;

			_theme_client_tabs_area.w -= (_ctx->theme()->notebook.left_scroll_arrow_width + _ctx->theme()->notebook.right_scroll_arrow_width);
			_theme_client_tabs_area.x += _ctx->theme()->notebook.left_scroll_arrow_width;

		} else {
			_area.left_scroll_arrow = rect{};
			_area.right_scroll_arrow = rect{};
			_has_scroll_arrow = false;
			theme_notebook.has_scroll_arrow = false;
		}


	} else {
		theme_notebook.has_selected_client = false;
	}

	theme_notebook.allocation = _allocation;
	if(_selected != nullptr) {
		theme_notebook.client_position = _client_position;
	}
	theme_notebook.is_default = is_default();

}

auto notebook_t::button_press(ClutterEvent const * e) -> button_action_e
{
	auto button = clutter_event_get_button(e);
	gfloat x, y;
	clutter_event_get_coords(e, &x, &y);
	auto winpos = get_window_position();
	x -= winpos.x;
	y -= winpos.y;
	auto time = clutter_event_get_time(e);

//	log::printf("button_press_event time = %u, x = %f, y = %f, button = 0x%x\n", time, x, y, button);

	/* left click on page window */
	if (button == 1 /* TODO: find emun or define */) {
		if (_area.button_close.is_inside(x, y)) {
			_ctx->notebook_close(shared_from_this(), time);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.button_hsplit.is_inside(x, y)) {
			if(_can_hsplit)
				_ctx->split_bottom(shared_from_this(), nullptr, time);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.button_vsplit.is_inside(x, y)) {
			if(_can_vsplit)
				_ctx->split_right(shared_from_this(), nullptr, time);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.button_select.is_inside(x, y)) {
			_root->set_default_pop(shared_from_this());
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.button_exposay.is_inside(x, y)) {
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.close_client.is_inside(x, y)) {
			if(_selected != nullptr)
				_close_view_notebook(_selected, time);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.undck_client.is_inside(x, y)) {
			if (_selected != nullptr)
				_root->switch_notebook_to_floating(_selected, time);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.left_scroll_arrow.is_inside(x, y)) {
			_scroll_left(30);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else if (_area.right_scroll_arrow.is_inside(x, y)) {
			_scroll_right(30);
			return BUTTON_ACTION_GRAB_ASYNC;
		} else {
			for(auto & i: _client_buttons) {
				if(std::get<0>(i).is_inside(x, y)) {
					if (not std::get<1>(i).expired()) {
						auto c = std::get<1>(i).lock();
						_ctx->grab_start(make_shared<grab_bind_view_notebook_t>(_ctx, c, XCB_BUTTON_INDEX_1, to_root_position(std::get<0>(i))), time);
						_mouse_over_reset();
						return BUTTON_ACTION_HAS_ACTIVE_GRAB;
					}
					return BUTTON_ACTION_GRAB_ASYNC;
				}
			}

			for(auto & i: _exposay_buttons) {
				if(std::get<0>(i).is_inside(x, y) and not std::get<1>(i).expired()) {
					if (not std::get<1>(i).expired()) {
						auto c = std::get<1>(i).lock();
						_ctx->grab_start(make_shared<grab_bind_view_notebook_t>(_ctx, c, XCB_BUTTON_INDEX_1, to_root_position(std::get<0>(i))), time);
						return BUTTON_ACTION_HAS_ACTIVE_GRAB;
					}
					return BUTTON_ACTION_GRAB_ASYNC;
				}
			}
		}

	/* rigth click on page */
	} else if (button == 3) {

		if (_area.button_close.is_inside(x, y)) {

		} else if (_area.button_hsplit.is_inside(x, y)) {

		} else if (_area.button_vsplit.is_inside(x, y)) {

		} else if (_area.button_select.is_inside(x, y)) {

		} else if (_area.button_exposay.is_inside(x, y)) {

		} else if (_area.close_client.is_inside(x, y)) {

		} else if (_area.undck_client.is_inside(x, y)) {

		} else {
			for(auto & i: _client_buttons) {
				if(std::get<0>(i).is_inside(x, y)) {
					_start_client_menu(std::get<1>(i).lock(), button, x, y, time);
					return BUTTON_ACTION_HAS_ACTIVE_GRAB;
				}
			}

//			for(auto & i: _exposay_buttons) {
//				if(std::get<0>(i).is_inside(x, y)) {
//					_start_client_menu(std::get<1>(i).lock(), e->detail, e->root_x, e->root_y, e->time);
//					return BUTTON_ACTION_HAS_ACTIVE_GRAB;
//				}
//			}
		}
	}
//	else if (e->child == XCB_NONE and e->detail == XCB_BUTTON_INDEX_4) {
//		if(_theme_client_tabs_area.is_inside(x, e->event_y)) {
//			_scroll_left(15);
//			return BUTTON_ACTION_GRAB_ASYNC;
//		}
//	} else if (e->child == XCB_NONE and e->detail == XCB_BUTTON_INDEX_5) {
//		if(_theme_client_tabs_area.is_inside(e->event_x, e->event_y)) {
//			_scroll_right(15);
//			return BUTTON_ACTION_GRAB_ASYNC;
//		}
//	}

	return BUTTON_ACTION_CONTINUE;

}

void notebook_t::_start_client_menu(view_notebook_p c, xcb_button_t button, gfloat x, gfloat y, xcb_timestamp_t time) {
	std::vector<std::shared_ptr<dropdown_menu_t::item_t>> v;
	for(unsigned k = 0; k < _ctx->get_workspace_count(); ++k) {
		std::ostringstream os;
		if(k == meta_workspace_index(workspace()->_meta_workspace)) {
			os << "[[[ " << _ctx->get_workspace(k)->name() << " ]]]";
		} else {
			os << "Send to " << _ctx->get_workspace(k)->name();
		}
		auto func =
			[this, c, k] (xcb_timestamp_t t) {
				if (k != meta_workspace_index(workspace()->_meta_workspace)) {
					//c->_client->set_current_workspace(k);
					c->remove_this_view();
					_ctx->get_workspace(k)->insert_as_notebook(c->_client, t);
				}
			};
		v.push_back(std::make_shared<dropdown_menu_t::item_t>(nullptr, os.str(), func));
		log::printf("Add menu: %s\n", os.str().c_str());
	}

	{
		auto func = [this, c] (xcb_timestamp_t t) {
			_ctx->create_workspace(t);
			auto selected = _ctx->get_workspace_count()-1;
			//c->_client->set_current_workspace(selected);
			c->remove_this_view();
			_ctx->get_workspace(selected)->insert_as_notebook(c->_client, t);
		};
		v.push_back(std::make_shared<dropdown_menu_t::item_t>(nullptr, "To new workspace", func));
		log::printf("Add menu: %s\n", "To new workspace");
	}

	_ctx->grab_start(make_shared<dropdown_menu_t>(this, v, button, x, y+4, 300, rect(x-10, y-10, 20, 20)), time);

}

void notebook_t::_update_mouse_over(int x, int y) {

	if (_allocation.is_inside(x, y)) {

		notebook_button_e new_button_mouse_over = NOTEBOOK_BUTTON_NONE;
		tuple<rect, view_notebook_w, theme_tab_t *> * tab = nullptr;
		tuple<rect, view_notebook_w, int> * exposay = nullptr;

		if (_area.button_close.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_CLOSE;
		} else if (_area.button_hsplit.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_HSPLIT;
		} else if (_area.button_vsplit.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_VSPLIT;
		} else if (_area.button_select.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_MASK;
		} else if (_area.button_exposay.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_EXPOSAY;
		} else if (_area.close_client.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_CLIENT_CLOSE;
		} else if (_area.undck_client.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_CLIENT_UNBIND;
		} else if (_area.left_scroll_arrow.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_LEFT_SCROLL_ARROW;
		} else if (_area.right_scroll_arrow.is_inside(x, y)) {
			new_button_mouse_over = NOTEBOOK_BUTTON_RIGHT_SCROLL_ARROW;
		} else {
			for (auto & i : _client_buttons) {
				if (std::get<0>(i).is_inside(x, y)) {
					tab = &i;
					break;
				}
			}

			for (auto & i : _exposay_buttons) {
				if (std::get<0>(i).is_inside(x, y)) {
					exposay = &i;
					break;
				}
			}
		}

		if(_theme_notebook.button_mouse_over != new_button_mouse_over) {
			_mouse_over_reset();
			_theme_notebook.button_mouse_over = new_button_mouse_over;
			queue_redraw();
		} else if (_mouse_over.tab != tab) {
			_mouse_over_reset();
			_mouse_over.tab = tab;
			_mouse_over_set();
			queue_redraw();
		} else if (_mouse_over.exposay != exposay) {
			_mouse_over_reset();
			_mouse_over.exposay = exposay;
			_mouse_over_set();
			queue_redraw();
		}
	} else {
		if(_theme_notebook.button_mouse_over != NOTEBOOK_BUTTON_NONE
				or _mouse_over.tab != nullptr
				or _mouse_over.exposay != nullptr) {
			_mouse_over_reset();
			queue_redraw();
		}
	}

}

bool notebook_t::button_motion(ClutterEvent const * e)
{
//	log::printf("call %s\n", __PRETTY_FUNCTION__);
	gfloat x, y;
	clutter_event_get_coords(e, &x, &y);
	auto winpos = get_window_position();
	x -= winpos.x;
	y -= winpos.y;
//	log::printf("x = %f, y = %f\n", x, y);

	auto time = clutter_event_get_time(e);

	_update_mouse_over(x, y);
	if(_allocation.is_inside(x, y))
		return true;

	return false;
}

bool notebook_t::leave(ClutterEvent const * ev) {
	_update_mouse_over(-1, -1);
	return false;
}

void notebook_t::_mouse_over_reset() {
	if (_mouse_over.tab != nullptr) {
		if (std::get<1>(*_mouse_over.tab).lock()->has_focus()) {
			std::get<2>(*_mouse_over.tab)->tab_color =
					_ctx->theme()->get_focused_color();
		} else if (_selected == std::get<1>(*_mouse_over.tab).lock()) {
			std::get<2>(*_mouse_over.tab)->tab_color =
					_ctx->theme()->get_selected_color();
		} else {
			std::get<2>(*_mouse_over.tab)->tab_color =
					_ctx->theme()->get_normal_color();
		}
	}

	_theme_notebook.button_mouse_over = NOTEBOOK_BUTTON_NONE;
	_mouse_over.tab = nullptr;
	_mouse_over.exposay = nullptr;

}

void notebook_t::_mouse_over_set() {
	if (_mouse_over.tab != nullptr) {
		std::get<2>(*_mouse_over.tab)->tab_color = _ctx->theme()->get_mouse_over_color();
	}
}

void notebook_t::_client_title_change(client_managed_t * c) {
	for(auto & x: _client_buttons) {
		if(c == std::get<1>(x).lock()->_client.get()) {
			std::get<2>(x)->title = c->title();
		}
	}

	if(_selected and c == _selected->_client.get()) {
		_theme_notebook.selected_client.title = c->title();
	}
	queue_redraw();
}

void notebook_t::_client_destroy(client_managed_t * c) {
	for (auto & x: _clients_tab_order) {
		if (x->_client.get() == c) {
			remove(x);
		}
	}

	//throw exception_t("not expected call of %s", __PRETTY_FUNCTION__);
}

void notebook_t::_client_focus_change(client_managed_t * c) {
	_update_all_layout();
}

rect notebook_t::allocation() const {
	return _allocation;
}

void notebook_t::show() {
	_is_visible = true;

	for (auto & x: _clients_tab_order) {
		x->hide();
	}

	if(_selected != nullptr) {
		_selected->show();
	}

}

bool notebook_t::_has_client(client_managed_p c) {
	for (auto const & x: _clients_tab_order) {
		if (x->_client == c)
			return true;
	}
	return false;
}

void notebook_t::on_workspace_enable()
{
	for(auto & x: _clients_tab_order) {
		update_client_position(x);
		if (x != _selected) {
			x->hide();
		} else {
			x->show();
		}
	}
}

void notebook_t::on_workspace_disable()
{

}

auto notebook_t::shared_from_this() -> notebook_p {
	return static_pointer_cast<notebook_t>(tree_t::shared_from_this());
}

void notebook_t::get_min_allocation(int & width, int & height) const {
	height = _ctx->theme()->notebook.tab_height
			+ _ctx->theme()->notebook.margin.top
			+ _ctx->theme()->notebook.margin.bottom + 20;
	width = _ctx->theme()->notebook.margin.left
			+ _ctx->theme()->notebook.margin.right + 100
			+ _ctx->theme()->notebook.close_width
			+ _ctx->theme()->notebook.selected_close_width
			+ _ctx->theme()->notebook.selected_unbind_width
			+ _ctx->theme()->notebook.vsplit_width
			+ _ctx->theme()->notebook.hsplit_width
			+ _ctx->theme()->notebook.mark_width
			+ _ctx->theme()->notebook.menu_button_width
			+ _ctx->theme()->notebook.iconic_tab_width * 4;
}

void  notebook_t::_scroll_right(int x) {
	if(_theme_client_tabs_area.w == _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_offset) {
		return;
	}

	if(_theme_client_tabs.size() < 1)
		return;

	if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w)
		return;

	int target_offset = _theme_client_tabs_offset + x;

	if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - target_offset) {
		target_offset = _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_area.w;
	}

	if(_theme_client_tabs_offset < 0)
		target_offset = 0;

	_update_notebook_buttons_area();
	queue_redraw();
}

void  notebook_t::_scroll_left(int x) {
	if(_theme_client_tabs_offset == 0)
		return;

	if(_theme_client_tabs.size() < 1)
		return;

	if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w)
		return;

	int target_offset = _theme_client_tabs_offset - x;

	if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - target_offset) {
		target_offset = _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_area.w;
	}

	if(_theme_client_tabs_offset < 0)
		target_offset = 0;

	_update_notebook_buttons_area();
	queue_redraw();
}

void notebook_t::_close_view_notebook(view_notebook_p vn, xcb_timestamp_t time)
{

	if(_selected != vn)
		return;

//	move_back<view_notebook_p>(_clients_tab_order, vn);
//	if(not (_ctx->conf()._enable_shade_windows)
//		and (_clients_tab_order.size() > 1)
//		and (not _exposay)) {
//		activate(_clients_tab_order.front(), time);
//	}

	/* Note: do not actually close a view_notebook, but prepare the close by activating another notebook if avalaible */
	vn->delete_window(time);

}

void notebook_t::_set_theme_tab_offset(int x) {
	if(_theme_client_tabs.size() < 1) {
		_theme_client_tabs_offset = 0;
		return;
	}
	if(x < 0) {
		_theme_client_tabs_offset = 0;
		return;
	}
	if(_theme_client_tabs_area.w > _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - x) {
		_theme_client_tabs_offset = _theme_client_tabs.back().position.x + _theme_client_tabs.back().position.w - _theme_client_tabs_area.w;
		return;
	}
	_theme_client_tabs_offset = x;
}

void notebook_t::queue_redraw() {
	tree_t::queue_redraw();
}

}
