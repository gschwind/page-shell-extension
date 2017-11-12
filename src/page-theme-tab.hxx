/*
 * theme_tab.hxx
 *
 *  Created on: 1 oct. 2014
 *      Author: gschwind
 */

#ifndef THEME_TAB_HXX_
#define THEME_TAB_HXX_

#include "page-color.hxx"

namespace page {

struct theme_tab_t {
	rect position;
	std::string title;
	color_t tab_color;
	bool is_iconic;

	theme_tab_t() :
		position{},
		title{},
		//icon{},
		tab_color{},
		is_iconic{}
	{ }

	theme_tab_t(theme_tab_t const & x) :
		position{x.position},
		title{x.title},
		//icon{x.icon},
		tab_color{x.tab_color},
		is_iconic{x.is_iconic}
	{ }

};

}



#endif /* THEME_TAB_HXX_ */
