/*
 * split.cxx
 *
 * copyright (2010-2014) Benoit Gschwind
 *
 * This code is licensed under the GPLv3. see COPYING file for more details.
 *
 */

#include <cstdio>
#include <cairo-xlib.h>
#include <X11/cursorfont.h>
#include <cmath>

#include "page-page.hxx"
#include "page-split.hxx"
#include "page-grab-handlers.hxx"
#include "page-workspace.hxx"

namespace page {

using namespace std;

split_t::split_t(tree_t * ref, split_type_e type) :
		page_component_t{ref},
		_ctx{ref->_root->_ctx},
		_type{type},
		_ratio{0.5},
		_has_mouse_over{false}
{

}

split_t::~split_t() {

}

void split_t::set_allocation(rect const & allocation) {
	_allocation = allocation;
	update_allocation();
}

void split_t::replace(shared_ptr<page_component_t> src, shared_ptr<page_component_t> by) {
	if (_pack0 == src) {
		log::printf("replace %p by %p\n", src.get(), by.get());
		set_pack0(by);
	} else if (_pack1 == src) {
		log::printf("replace %p by %p\n", src.get(), by.get());
		set_pack1(by);
	} else {
		throw std::runtime_error("split: bad child replacement!");
	}

	update_allocation();
}

void split_t::set_split(double split) {
	if(split < 0.05)
		split = 0.05;
	if(split > 0.95)
		split = 0.95;
	_ratio = split;
	update_allocation();
}

void split_t::compute_children_allocation(double split, rect & bpack0, rect & bpack1) {

	int pack0_height = 20, pack0_width = 20;
	int pack1_height = 20, pack1_width = 20;

	if(_pack0 != nullptr)
		_pack0->get_min_allocation(pack0_width, pack0_height);
	if(_pack1 != nullptr)
		_pack1->get_min_allocation(pack1_width, pack1_height);

	//cout << "pack0 = " << pack0_width << "," << pack0_height << endl;
	//cout << "pack1 = " << pack1_width << "," << pack1_height << endl;

	if (_type == VERTICAL_SPLIT) {

		int w = allocation().w
				- 2 * _ctx->theme()->split.margin.left
				- 2 * _ctx->theme()->split.margin.right
				- _ctx->theme()->split.width;

		int w0 = floor(w * split + 0.5);
		int w1 = w - w0;


		if(w0 < pack0_width) {
			w1 -= pack0_width - w0;
			w0 = pack0_width;
		}

		if(w1 < pack1_width) {
			w0 -= pack1_width - w1;
			w1 = pack1_width;
		}

		bpack0.x = allocation().x + _ctx->theme()->split.margin.left;
		bpack0.y = allocation().y + _ctx->theme()->split.margin.top;
		bpack0.w = w0;
		bpack0.h = allocation().h - _ctx->theme()->split.margin.top - _ctx->theme()->split.margin.bottom;

		bpack1.x = allocation().x + _ctx->theme()->split.margin.left + w0 + _ctx->theme()->split.margin.right + _ctx->theme()->split.width + _ctx->theme()->split.margin.left;
		bpack1.y = allocation().y + _ctx->theme()->split.margin.top;
		bpack1.w = w1;
		bpack1.h = allocation().h - _ctx->theme()->split.margin.top - _ctx->theme()->split.margin.bottom;

		if(_parent != nullptr) {
			assert(bpack0.w >= pack0_width);
			assert(bpack0.h >= pack0_height);
			assert(bpack1.w >= pack1_width);
			assert(bpack1.h >= pack1_height);
		}

	} else {

		int h = allocation().h - 2 * _ctx->theme()->split.margin.top - 2 * _ctx->theme()->split.margin.bottom - _ctx->theme()->split.width;
		int h0 = floor(h * split + 0.5);
		int h1 = h - h0;

		if(h0 < pack0_height) {
			h1 -= pack0_height - h0;
			h0 = pack0_height;
		}

		if(h1 < pack1_height) {
			h0 -= pack1_height - h1;
			h1 = pack1_height;
		}

		bpack0.x = allocation().x + _ctx->theme()->split.margin.left;
		bpack0.y = allocation().y + _ctx->theme()->split.margin.top;
		bpack0.w = allocation().w - _ctx->theme()->split.margin.left - _ctx->theme()->split.margin.right;
		bpack0.h = h0;

		bpack1.x = allocation().x + _ctx->theme()->split.margin.left;
		bpack1.y = allocation().y + _ctx->theme()->split.margin.top + h0 + _ctx->theme()->split.margin.bottom + _ctx->theme()->split.width + _ctx->theme()->split.margin.top;
		bpack1.w = allocation().w - _ctx->theme()->split.margin.left - _ctx->theme()->split.margin.right;
		bpack1.h = h1;

		if(_parent != nullptr) {
			assert(bpack0.w >= pack0_width);
			assert(bpack0.h >= pack0_height);
			assert(bpack1.w >= pack1_width);
			assert(bpack1.h >= pack1_height);
		}

	}
}

void split_t::update_allocation() {
	//cout << "allocation = " << _allocation.to_string() << endl;
	compute_children_allocation(_ratio, _bpack0, _bpack1);
	//cout << "allocation pack0 = " << _bpack0.to_string() << endl;
	//cout << "allocation pack1 = " << _bpack1.to_string() << endl;
	_split_bar_area = compute_split_bar_location();
	if(_pack0 != nullptr)
		_pack0->set_allocation(_bpack0);
	if(_pack1 != nullptr)
		_pack1->set_allocation(_bpack1);

}

void split_t::set_pack0(shared_ptr<page_component_t> x) {
	assert(x != nullptr);
	if(_pack0 != nullptr) {
		remove(_pack0);
	}
	_pack0 = x;
	push_back(_pack0);
	update_allocation();
	if(_is_visible)
		_pack0->show();
	else
		_pack0->hide();
}

void split_t::set_pack1(shared_ptr<page_component_t> x) {
	assert(x != nullptr);
	if(_pack1 != nullptr) {
		remove(_pack1);
	}
	_pack1 = x;
	push_back(_pack1);
	update_allocation();
	if(_is_visible)
		_pack1->show();
	else
		_pack1->hide();
}

void split_t::render_legacy(cairo_t * cr) const {
	theme_split_t ts;
	ts.split = _ratio;
	ts.type = _type;
	ts.allocation = compute_split_bar_location();
	ts.root_x = get_window_position().x;
	ts.root_y = get_window_position().y;
	ts.has_mouse_over = _has_mouse_over;
	_ctx->theme()->render_split(cr, &ts);
}

void split_t::remove(shared_ptr<tree_t> t) {
	tree_t::remove(t);
	if (_pack0 == t) {
		_pack0 = nullptr;
	} else if (_pack1 == t) {
		_pack1 = nullptr;
	}
}

rect split_t::compute_split_bar_location(rect const & bpack0, rect const & bpack1) const {
	rect ret;
	if (_type == VERTICAL_SPLIT) {
		ret.x = allocation().x + _ctx->theme()->split.margin.left + bpack0.w ;
		ret.y = allocation().y;
		ret.w = _ctx->theme()->split.width + _ctx->theme()->split.margin.left + _ctx->theme()->split.margin.right;
		ret.h = allocation().h;
	} else {
		ret.x = allocation().x;
		ret.y = allocation().y + _ctx->theme()->split.margin.top + bpack0.h ;
		ret.w = allocation().w;
		ret.h = _ctx->theme()->split.width + _ctx->theme()->split.margin.top + _ctx->theme()->split.margin.bottom;
	}
	return ret;
}

rect split_t::compute_split_bar_location() const {
	return compute_split_bar_location(_bpack0, _bpack1);
}

auto split_t::button_press(ClutterEvent const * e)  -> button_action_e
{
	gfloat x, y;
	clutter_event_get_coords(e, &x, &y);
	auto winpos = get_window_position();
	x -= winpos.x;
	y -= winpos.y;
	auto button = clutter_event_get_button(e);
	auto time = clutter_event_get_time(e);

	if (button == 1 and _split_bar_area.is_inside(x, y)) {
		_ctx->grab_start(make_shared<grab_split_t>(_ctx, shared_from_this()), time);
		return BUTTON_ACTION_HAS_ACTIVE_GRAB;
	} else {
		return BUTTON_ACTION_CONTINUE;
	}
}

shared_ptr<split_t> split_t::shared_from_this() {
	return dynamic_pointer_cast<split_t>(tree_t::shared_from_this());
}

auto split_t::get_node_name() const -> string {
	return _get_node_name<'S'>();
}

rect split_t::allocation() const {
	return _allocation;
}

void split_t::get_min_allocation(int & width, int & height) const {
	int pack0_height = 20, pack0_width = 20;
	int pack1_height = 20, pack1_width = 20;

	if(_pack0 != nullptr)
		_pack0->get_min_allocation(pack0_width, pack0_height);
	if(_pack1 != nullptr)
		_pack1->get_min_allocation(pack1_width, pack1_height);

	if (_type == VERTICAL_SPLIT) {
		width = pack0_width + pack1_width + _ctx->theme()->split.width;
		height = std::max(pack0_height, pack1_height);
	} else {
		width = std::max(pack0_width, pack1_width);
		height = pack0_height + pack1_height + _ctx->theme()->split.width;
	}
}

double split_t::compute_split_constaint(double split) {
	rect bpack0;
	rect bpack1;
	compute_children_allocation(split, bpack0, bpack1);
	rect tmp = compute_split_bar_location(bpack0, bpack1);

	//cout << "constraint allocation pack0 = " << bpack0.to_string() << endl;
	//cout << "constraint allocation pack1 = " << bpack1.to_string() << endl;

	if(_type == VERTICAL_SPLIT) {
		return ((tmp.x + (tmp.w/2)) - allocation().x)/(double)allocation().w;
	} else {
		return ((tmp.y + (tmp.h/2)) - allocation().y)/(double)allocation().h;
	}
}

rect split_t::root_location() {
	return to_root_position(_allocation);
}

void split_t::compute_children_root_allocation(double split, rect & bpack0, rect & bpack1) {
	compute_children_allocation(split, bpack0, bpack1);
	bpack0 = to_root_position(bpack0);
	bpack1 = to_root_position(bpack1);
}

bool split_t::button_motion(ClutterEvent const * e) {
	gfloat x, y;
	clutter_event_get_coords(e, &x, &y);
	auto winpos = get_window_position();
	x -= winpos.x;
	y -= winpos.y;

	if(_split_bar_area.is_inside(x, y)) {
		if(not _has_mouse_over) {
			_has_mouse_over = true;
			queue_redraw();
		}
	} else {
		if(_has_mouse_over) {
			_has_mouse_over = false;
			queue_redraw();
		}
	}

	return false;

}


bool split_t::leave(ClutterEvent const * ev) {
	if(_has_mouse_over) {
		_has_mouse_over = false;
		queue_redraw();
	}
	return false;
}


}
