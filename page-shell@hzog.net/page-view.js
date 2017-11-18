
const Lang = imports.lang;

var PageView = new Lang.Class(
		Name: 'PageView',
		Extends: 'PageTree',
		
		_init: function() {
			/* client_managed_p */
			this._client;
		},
		
		_is_client_owner: function() { },
		remove_this_view: function() { },
		acquire_client: function() { },
		release_client: function() { },
		
		/**
		 * tree_t API
		 **/
		
		hide: function() { },
		show: function() { },
		get_node_name: function() { },
		reconfigure: function() { }

};