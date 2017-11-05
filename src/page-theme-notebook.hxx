/*
 * notebook_base.hxx
 *
 *  Created on: 10 mai 2014
 *      Author: gschwind
 */

#ifndef THEME_NOTEBOOK_HXX_
#define THEME_NOTEBOOK_HXX_

#include <memory>

namespace page {

enum notebook_button_e {
	NOTEBOOK_BUTTON_NONE,
	NOTEBOOK_BUTTON_CLOSE,
	NOTEBOOK_BUTTON_VSPLIT,
	NOTEBOOK_BUTTON_HSPLIT,
	NOTEBOOK_BUTTON_MASK,
	NOTEBOOK_BUTTON_CLIENT_CLOSE,
	NOTEBOOK_BUTTON_CLIENT_UNBIND,
	NOTEBOOK_BUTTON_EXPOSAY,
	NOTEBOOK_BUTTON_LEFT_SCROLL_ARROW,
	NOTEBOOK_BUTTON_RIGHT_SCROLL_ARROW
};

struct theme_notebook_t {
	int root_x, root_y;
	notebook_button_e button_mouse_over;
	rect allocation;
	rect client_position;
	rect left_arrow_position;
	rect right_arrow_position;
	theme_tab_t selected_client;
	int client_count;
	bool is_default;
	bool has_selected_client;
	bool can_vsplit;
	bool can_hsplit;
	bool has_scroll_arrow;

	theme_notebook_t() :
		root_x{}, root_y{},
		button_mouse_over{NOTEBOOK_BUTTON_NONE},
		allocation{},
		client_position{},
		selected_client{},
		client_count{0},
		is_default{},
		has_selected_client{},
		can_vsplit{},
		can_hsplit{},
		has_scroll_arrow{false}
	{

	}

	theme_notebook_t(theme_notebook_t const & x) :
		root_x{x.root_x}, root_y{x.root_y},
		button_mouse_over{x.button_mouse_over},
		allocation{x.allocation},
		client_position{x.client_position},
		selected_client{x.selected_client},
		client_count{x.client_count},
		is_default{x.is_default},
		has_selected_client{x.has_selected_client},
		can_vsplit{x.can_vsplit},
		can_hsplit{x.can_hsplit},
		has_scroll_arrow{x.has_scroll_arrow}
	{

	}

};

}


#endif /* NOTEBOOK_BASE_HXX_ */
