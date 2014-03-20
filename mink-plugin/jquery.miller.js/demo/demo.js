$(document).ready(function() {
		$('#miller').miller({
				'url': function(id) {
					if (!id) {
						return 'data1.json';
					} else {
						var data = null;

						$.ajaxSetup({ "async": false });

						$.getJSON('data1.json', function(lines) {
								data = $.grep(lines, function(line) { return line['id'] == id; });
							}
						);

						if (data.length <= 0) {
							$.getJSON('data2.json', function(lines) {
									data = $.grep(lines, function(line) { return line['id'] == id; });
								}
							);
						}

						$.ajaxSetup({ "async": true });

						return (!data[0]['parent'] ? 'data3.json' : (Math.random() <= 0.5 ? 'data1.json' : 'data2.json'));
					}
				},
				'toolbar': {
					'options': {
						'Select': function(id) { alert('Select node or leaf ' + id); },
						'Quickview': function(id) { alert('Quickview on node or leaf ' + id); }
					}
				},
				'pane': {
					'options': {
						'Add': function(id) { alert('Add to leaf ' + id); },
						'Update': function(id) { alert('Update leaf ' + id); },
						'Delete': function(id) { alert('Delete leaf ' + id); }
					}
				}
			}
		);
	}
);
