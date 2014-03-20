# jQuery.miller.js

## An implementation of [Miller columns](http://en.wikipedia.org/wiki/Miller_columns) with [jQuery](http://jquery.com)!

It's a work in progress, so use it carefully!  
If you want to see this plugin in action, there is a [demo](http://mgbx.net/demomiller).

## Features

* Ajax call to retrieve data.
* Keyboard navigation.
* Full customizable preview pane.
* Full customizable toolbar.
* Redimensionable columns.

## How to use it ?

There is no dependencies needed to use this plugin. 
To use it:
1. Clone the repository or download the source in a directory.  
2. Add this line in the head of your html page:--

``` html
<link href="url/to/css/jquery.miller.css" media="screen" rel="stylesheet" type="text/css" />
```

3. Add a `div` in the body of your html page.  
4. Add these lines at the end of the body of your html page:  

``` html
<script type="text/javascript" src="url/to/js/jquery-1.8.2.min.js"></script>
<script type="text/javascript" src="url/to/js/jquery.miller.js"></script>
```

5. Create a JavaScript script with this content and add it t the end of the body of your html page:

``` JavaScript
$(document).ready(function() { $('div').miller() });
```

You can pass an object litteral to the `miller` function to customize behavior of the plugin.  
The default values are :

``` JavaScript
{
	url: function(id) { return id; }, // generate url for ajax call, id is the value of the node ID
	minWidth: 40, // minimum width of one column
	tabindex: 0, // default tabindex if it is undefined on the DOM element
	carroussel: false, // If set to true, the user will go to the first item of the column if it use ↓ on the last item
	toolbar: {
		options: {} // Add callbacks here to handle actions in the toolbar, see the demo for more informations
	},
	pane: {
		options: {} // Add callbacks here to handle actions in the pane, see the demo for more informations
	}
}
```

The ajax call must return a JSON array with the following structure:

``` JavaScript
[
   { 'id': 'ID of node 1', 'name': 'Name of node 1', 'parent': false }, // this node has no child
   { 'id': 'ID of node 2', 'name': 'Name of node 2', 'parent': true }, // this node has some children
   { 'id': 'ID of node 3', 'name': 'Name of node 3', 'parent': false }, // this node has no child
	// and so on…
]

```
