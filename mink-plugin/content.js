var debug = true;

//var proxy = 'http://timetravel.mementoweb.org/timemap/link/';
var memgator_proxy = 'http://memgator.cs.odu.edu:1208/timemap/link/';
//var aggregator_wdi_link = 'http://labs.mementoweb.org/timemap/link/';
var aggregator_wdi_json = 'http://labs.mementoweb.org/timemap/json/';
var memgator_json = 'http://memgator.cs.odu.edu:1208/timemap/json/';
//var aggregator_diy_link = 'http://timetravel.mementoweb.org/timemap/link/';
//var aggregator_diy_json = 'http://timetravel.mementoweb.org/timemap/json/';
var numberOfTimemaps = 0;

var embeddedTimemapRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g;
var mementosURIsWithinTimemapsRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\".*memento.*\"/g;
var timemapsURIsWithinTimemapsRegex = /<https?:.*>;rel=\".*timemap.*\"/g;

var mementosInTimemapBasedOnRelAttributeRegex = /;rel=\".*memento.*\"/g;
var timemapsInTimemapBasedOnRelAttributeRegex = /;rel=\".*timemap.*\"/g;

//TODO: check if in blacklist
if(debug){console.log('blacklist test');}
//getBlacklist();


//PENDING, Issue #6, not possible w/o Chrome Canary: $.scoped(); //allows the usage of bootstrap without affecting the target page's style

$('body').append('<div id="minkContainer"></div>');
//PENDING, Issue #6, not possible w/o Chrome Canary: $("#minkContainer").append("<style scoped>\r\n@import url('"+bootstrapCSS+"');\r\n</style>");
$('#minkContainer').append('<style type="text/css" scoped="scoped">\r\n' +
	'#minkContainer * {font-size: 12px; font-family: Helvetica, sans-serif; text-transform: none;}\r\n' +
	'#minkContainer input[type=button] { background-color: white; border: 1px double black; padding: 2px 5px 2px 5px; border-radius: 5px; font-weight: bold;}\r\n' +
	'#minkContainer input[type=button]:enabled:hover {cursor: pointer; background-color: #ccc; }' +
	'#minkContainer input[type=button]:disabled:hover {cursor: not-allowed; }' +
	'#minkContainer input[type=button]:disabled {opacity: 0.25; }' +
'</style>');
//$.scoped();
$('#minkContainer').append('<div id="archiveOptions"></div>');
$('#minkContainer').append('<img src="' + iconUrl + '" id="mLogo" />');
//var shadow = document.querySelector("#minkContainer").createShadowRoot();


//setTimeout(flip, 1000);

$(document).ready(function() {
	$('#mLogo').click(function() {
		showArchiveOptions();
	});
	displayUIBasedOnContext();

});


var jsonizedMementos = '[';
var jsonizedMementos;

function addToHistory(uri_r,memento_datetime,mementos,callback){
	var mementosToStore = mementos;
	if(!mementosToStore){mementosToStore = jsonizedMementos;}
	chrome.runtime.sendMessage({method: "store", value: ""+uri_r, memento_datetime: memento_datetime, mementos: mementosToStore}, function(response) {
		if(callback){
			callback();
		}
	});
}

function clearHistory() {
	chrome.runtime.sendMessage({method: "nukeFromOrbit", value: "It's the only way to be sure"}, function(response) {});
}


/** When viewing a memento, handles the UI and navigation change of jumping to another memento
 *  @param index A value representative of the location of the new memento on the list, 1 = next, -1 = prev, 0/null = selected in UI
 */
function viewDifferentMemento(index){
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(index === null || index === 0){
			addToHistory(response.value,$('#mdts option:selected').text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function() {window.location = $('#mdts').val();}
			);
		}else if (index === 1) { //next Memento
			var nextMemento = $('#mdts option:nth-child(' + (parseInt($('#mdts').attr('alt')) + 2) + ')');
			addToHistory(response.value,nextMemento.text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function() {window.location = nextMemento.val();}
			);
		}else if (index === -1) { //prev Memento
			var prevMemento = $('#mdts option:nth-child(' + (parseInt($('#mdts').attr('alt'))) + ')');
			addToHistory(response.value,prevMemento.text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function() {window.location = prevMemento.val();}
			);
		}else {
			console.log('Bad index value in viewDifferentMemento, ' + index);
			console.log(index);
		}
	});
}

function ceaseQuery() { //stop everything (AND DANCE!)
	alert('Halting execution');
}

function displayUIBasedOnContext() {
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(response === null || response.value === window.location || response.value === null){ // ON A LIVE WEB PAGE, FETCH MEMENTOS
			$('#archiveOptions').html('Fetching Mementos...<!--<button onclick="ceaseQuery();" style="margin-left: 1.0em;">Halt and Catch Fire</button>-->');
			getMementos();
		}else if(response && response.value !== null && 										//ON AN ARCHIVED PAGE, SHOW RETURN TO LIVE WEB BUTTON
				( ((window.location + '').indexOf(response.value) > -1) ||					//check if URI-R is in URI-M
				  ((window.location + '').replace('www.','').indexOf(response.value) > -1) ||	// 3 hacky attempts at removing the www to further accomplish this
				  ((window.location + '').indexOf(response.value.replace('www.','')) > -1) ||
				  ((window.location + '').replace('www.','').indexOf(response.value.replace('www.', '')) > -1)
				) 																	// There were memento HTTP headers
			){
			logoInFocus = true;

			//Display UI For When Browsing An Archive Page
			displayReturnToLiveWebButton(response.value);

			//$('#archiveOptions').append(getMementosNavigationBasedOnJSON(response.mementos,response.memento_datetime));
			//$('#viewMementoButton').click(viewDifferentMemento); //this is different from the live web context, as we don't store the URI-M in localStorage but instead, remember the URI-R there

			//setMementoButtonInteractivityBasedOnMementoDropdown();
		}else {
			if(debug){console.log('There is no else, only if');}
			//ugh, we don't want to be here, let's nuke the localStorage
			clearHistory();
			displayUIBasedOnContext();
		}
	  });
}

function isEmpty(o){ //returns if empty object is passed in
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}


function displayReturnToLiveWebButton(uri){
		//Display UI For When Browsing An Archive Page
		$('#archiveOptions').html('<button id="liveWeb">Return to Live Web</button>');
		$('#liveWeb').click(function() {window.location = (uri ? uri : response.value);});
}


function getBlacklist(cb){
	var callbackArguments = arguments;
	chrome.storage.sync.get('uris', function(items){
		if(debug){
			console.log('Current blacklist: ');
			console.log(items);
		}

		if(!cb){
			if(debug){console.log('no callback specified for getBlacklist();'); }
			return;
		}

		cb(items, callbackArguments[1]);
	});
}



function addToBlacklist(currentBlacklist, uriIn){
	var uri = uriIn;
	var save = {
		'uris': null
	};

	if($.isEmptyObject(currentBlacklist)){
			save.uris = [];
	} else {
		save.uris = currentBlacklist.uris;
	}

	if(!save.uris){
		save.uris = [];
	}

	// Check if URI is already in blacklist before adding
	if(save.uris.indexOf(uriIn) > -1){
		if(debug){
			console.log('URI already in blacklist');
			console.log(save.uris);
		}
		return;
	}

	if(debug){
		console.log('Previous blacklist contents:');
		console.log(save.uris);
	}

	save.uris.push(uriIn);

	if(debug){
		console.log('Current blacklist contents:');
		console.log(save.uris);
	}

	chrome.storage.sync.set(save,
		function() {
			console.log('done adding ' + uri + ' to blacklist. Prev blacklist:');
			console.log(currentBlacklist);
			getBlacklist();
		}
);
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.method == "hideUI"){
		$("#minkContainer").fadeOut();
		return;
	}
	
	if(request.method === 'addToBlacklist'){
		// TODO: convert this to add to blacklist

	//	console.log('adding ' + request.uri + ' to blacklist');
		getBlacklist(addToBlacklist, request.uri); // And add uri

		//$('#minkContainer').fadeOut();
		return;
	}

	if(request.method === 'echoBlacklist') {
		console.log('Here is the current blacklist:');
		console.log(request.blacklist);
		return;
	}

	if(request.method === 'showArchiveNowUI'){
		if(debug){console.log('Hide logo here');}
		logoInFocus = true;
		hideLogo = true;

		return;
	}

	if(request.method === 'getMementosFromSecureSource'){
		logoInFocus = true;
		hideLogo = true;
	}

	if(request.method === 'displayThisMementoData'){
		//Parse the data received from the secure source and display the number of mementos
		if(request.data.timemap_uri) { // e.g., twitter.com
			chrome.runtime.sendMessage({
				method: 'fetchSecureSitesTimeMap',
				value: request.data.timemap_uri.json_format
			}, function(response) {
				if(debug) {console.log('We have a response!'); } // This will not occur due to async exec in mink.js
			});

			return;
		}
		var tm = new Timemap(request.data);
		displayUIBasedOnTimemap(tm);

		return;
	}

	if(request.method === 'displayUI') {
		if(debug){
			console.log(request.timegate);
			console.log(request.timemap);
			console.log(request.uri);
			console.log('-----');
		}
	}
    
	if(request.method === 'displaySecureSiteMementos') {
			if((!(request.value.mementos) && !(request.value.timemaps) && !(request.value.timemap_uri)) || request.value.mementos == []){
				hideLogo = true;
				logoInFocus = true;
			  //flip();
			}else {
				storeTimeMapData([request.value]);
				revamp_createUIShowingMementosInTimeMap(request.value);

				//hideLogo = true;
				//logoInFocus = true;
				//flip();
			}
			return;
	}

	displayUIBasedOnContext();
});


function processResponseFromAggregator(xhr) {
	if(debug){console.log('Done querying timegate');}
	if(xhr.status === 200){
		var linkHeaderStr = xhr.getResponseHeader('Link');
		var tm = new Timemap(linkHeaderStr);

		if(debug) {
			console.log('We have the ultimate timemap');
			console.log('From the timegate: ' + (tm.timegate ? 'TimeGate, ':'') + (tm.timemap ? ' TimeMap, ':'') + 'and ' + tm.mementos.length + ' mementos');
			console.log(tm);
		}

		if(tm.timemap) { // Paginated TimeMaps likely (e.g., http://mementoweb.org/guide/)
			if(debug){console.log('Recursing to find more TMs, last TM:' + tm.timemap.self);}
			Promise.resolve(createTimemapFromURI(tm.timemap));
		}
	}else if(xhr.status === 302) {
		console.log('Do something with 302 here');
	}
}


function queryTimegate(tgURI) {
	if(debug){console.log('Querying timegate at ' + tgURI);}
	// TODO: if tgURI's URI-R is https, take a different path so as to not have a cross-scheme violation
	var isHTTPSSite = tgURI.indexOf('https:') > -1;

	if (isHTTPSSite) {
			// Send message to mink.js to query https URI-R to aggregator

			chrome.runtime.sendMessage({
				method: 'fetchSecureSitesTimeMap',
				value: memgator_json + tgURI.substr(tgURI.indexOf('https:'))
			}, function(response) {
				if(debug) {console.log('We have a response!'); } // This will not occur due to async exec in mink.js
			});
			return;
	}

	$.ajax({
		url: tgURI,
		type: "HEAD"
	}).done(function(data,textStatus,xhr) {
		processResponseFromAggregator(xhr);
	});
}

function displayUIBasedOnTimemap(tm) {
	console.log('likely obsolete interface');

	if(tm.mementos.length > 0) {
		logoInFocus = true; //stop rotating the logo, we have a list of mementos
		chrome.runtime.sendMessage({
			method: 'notify',
			title: 'TimeMap fetching complete.',
			body: tm.mementos.length + '+ mementos returned.'
		}, function(response) {});
		displayMementoCountAtopLogo();

		var selectBox = '<select id="mdts"><option>Select a Memento to view</option>';
		$(tm.mementos).each(function(i,m){
			selectBox += '\t<option value="' + m.uri + '">' + moment(m.datetime) + '</option>\r\n';
		});
		selectBox += '</select>';

		console.log('Calling addInterfaceComponents from 1');
		//addInterfaceComponents(tm.mementos.length, 1, ' timemaps', selectBox);
		//$('#viewMementoButton').click(function() {viewDifferentMemento();});
		//setMementoButtonInteractivityBasedOnMementoDropdown();
	}
}

function createTimemapFromURI(uri,accumulatedArrayOfTimemaps) {
	console.log('creatTimemapFromURI() - includes write to localstorage');
	if(!accumulatedArrayOfTimemaps){accumulatedArrayOfTimemaps = [];}

	$.ajax({
		url: uri,
		type: 'GET' /* The payload is in the response body, not the head */
	}).done(function(data,textStatus,xhr){
		if(xhr.status === 200){
			var tm = new Timemap(data);
			// Move data from tm.mementos as array to tm.mementos as an object and
			//  tm.mementos.list as array to conform to JSON API from LANL aggregator
			var mementosFromTimeMap = tm.mementos;
			tm.mementos = null;
			tm.mementos = {};
			tm.mementos.list = mementosFromTimeMap;

			//delete tm.mementos;
			if(tm.timemap && tm.self && tm.timemap !== tm.self){ // Paginated TimeMaps likely
				//Recursing to find more TMs
				return createTimemapFromURI(tm.timemap, accumulatedArrayOfTimemaps.concat(tm));
			}
			if(debug){console.log('Executing set of promises');}
			Promise.resolve(accumulatedArrayOfTimemaps.concat(tm)).then(function(tms){
				storeTimeMapData(tms,displayUIBasedOnStoredTimeMapData);
			});
		}
	});
}

/**
 * TODO: update this old description since it is now a wrapper/router
 * Acquire all mementos from a timegate with either the current window URI
 *  or the URI of a value passed in
 * @param uri The target URI-R, if null then use window location
 * @param alreadyAcquiredTimemaps When function is called recursively, the
 *         previously acquired timemaps are passed in this argument
 * @param stopAtOneTimemap A boolean to specify whether additional pagination
 *         references should be followed and parsed before data is returned
 */
function getMementos(uri,alreadyAcquiredTimemaps,stopAtOneTimemap) {
	if(debug){console.log('In getMementos');}
	chrome.storage.local.get(null, function(keys){
		if(isEmpty(keys)) { 	// No link headers in the request. :(
			if(debug){console.log('No URI accessed did not have an HTTP link header');}
			getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap);
		}else {				//we have link headers!
			if(keys.datetime){ //isA memento
				if(debug){console.log('XWe are a memento!');}
				logoInFocus = true;
				if(debug){console.log(keys);}
				//Display UI For When Browsing An Archive Page
				console.log('Display "in the archives" interface');
				//displayReturnToLiveWebButton(keys.original);
			}else if(keys.timemap) {
				//prefer this, simply do a drop-in replacement from the previous implementation, which hit the aggregator
				if(debug){
					console.log('We have a timemap, lets do more! The timemap:');
					console.log(keys.timemap);
					console.log('We will need to call getMementosWithTimemap() here if we want the dropdown to be generated');
				}

				createTimemapFromURI(keys.timemap);

				if(debug){console.log('Starting call chain to generate dropdown HTML');}
				getMementosWithTimemap();
			}else if(keys.timegate) {
				if(debug){
					console.log('We have a timegate URI, lets fetch it and try to get mementos or a timemap');
				}
				//todo: set this up using promises to allow recursion, callback with returned arrays
				var prom = new Promise(
					function(resolve, reject) {
						queryTimegate(keys.timegate);
					}
				).then(function(tms){
					console.log('accepted:');
					console.log(tms);
					logoInFocus = true;
				},function(val){
					console.log('rejected');
				});
				return;
			}else { // We had some link headers but none that were related to memento, so act as if we had no link header
				getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap);
			}

			if (debug) {
			  console.log('TODO, change the timegate/map to that which was specified in the link headers.');
			}
		}
	});
}


function createSelectBoxContents(tms) {
	var selectBox = '<select id="mdts"><option>Select a Memento to view</option>';
	return selectBox;

	// Chrome does not like very large strings
/*	console.log(tms[0]);
	for(var tm = 0; tm < tms.length; m++) {

		for(var m = 0; m < tms[tm].mementos.list.length; m++){
			selectBox += '\t<option></option>\n';
			//selectBox += '\t<option value="' + tms[tm].mementos.list[m].uri + '">' + moment(tms[tm].mementos.list[m].datetime).format('MMMM Do YYYY, h:mm:ss a') + '</option>\r\n';
		}
	}
	selectBox += '</select>';

	return selectBox;
	*/
}

function revamp_createUIShowingMementosInTimeMap(tm) {
    console.log('Hitting revamp_createUIShowingMementoInTimeMap, returning because we are implementing browserActions.');
    console.log("We have "+ tm.mementos.list.length + mementos);
    logoInFocus = false;
    return;
	var selectBox = '<select id="mdts"><option>Select a Memento to view</option>';
	for(var m=0; m<tm.mementos.list.length; m++){
		selectBox += '\t<option value="' + tm.mementos.list[m].uri + '">' + moment(tm.mementos.list[m].datetime).format('MMMM Do YYYY, h:mm:ss a') + '</option>\r\n';
	}
	selectBox += '</select>';

	var numberOfTimeMaps = 1; // TODO: Looks to be an object an not an array, need example where multiple are defined
	addInterfaceComponents(tm.mementos.list.length, numberOfTimeMaps, 'TimeMap', selectBox);
	displayMementoCountAtopLogo();
	$('#countOverLogo').text($('#countOverLogo').html());
	logoInFocus = true; // Stop spinning the logo

	$('#fetchAllMementosButton').click(function() {
			logoInFocus = false;
			flip();
		});
}

function fetchTimeMap(uri) {
	  if(debug){console.log('Created promise to fetch TimeMap at '+uri);}
		var prom = new Promise(
			function(resolve, reject) {

				$.ajax({
					url: uri
				}).done(function(tmData){
					resolve(tmData);
				}).fail(function(xhr,status,err){
					if(debug){
						console.log('A ajax request within a promise failed!');
						console.log(xhr);
						console.log(status);
						console.log(err);
					}
				});
			}
		);
		return prom;
}

function revamp_fetchTimeMaps(tms) {
  if (debug) {console.log('revamp_fetchTimeMaps()');}
		var tmFetchPromises = [];
		for(var tm = 0; tm < tms.length; tm++){ // Generate Promises
			tmFetchPromises.push(fetchTimeMap(tms[tm].uri));
		}
		if(debug){console.log('Fetching ' + tms.length + ' TimeMaps');}
		Promise.all(tmFetchPromises).then(storeTimeMapData).catch(function(e) {
			if(debug){
				console.log('A promise failed: ');
				console.log(e);
			}
		});

		return;
}

function countNumberOfMementos(arrayOfTimeMaps) {
		if(debug){console.log('Counting mementos for ' + arrayOfTimeMaps.length + ' TimeMaps');}

		var totalNumberOfMementos = 0;
		for(var tm = arrayOfTimeMaps.length - 1; tm >= 0; tm--){
			totalNumberOfMementos += arrayOfTimeMaps[tm].mementos.list.length;
		}

		if(debug){console.log('Found ' + totalNumberOfMementos + ' mementos');}
		return totalNumberOfMementos;
}

function storeTimeMapData(tmData, cbIn){
	var cb = cbIn ? cbIn : displayUIBasedOnStoredTimeMapData;
	if(debug){console.log('executing storeTimeMapData');console.log(tmData);}

	chrome.storage.local.set({
			'uri_r': tmData.original_uri,
			'timemaps': tmData
	}, cb); //end set
}

function displayUIBasedOnStoredTimeMapData() {
	// Only executed with indexed TimeMaps
	chrome.storage.local.get('timemaps',
		function(localStore){
			var tms = localStore.timemaps;
			//if(debug){console.log('We got the data from localstorage in ' + displayUIBasedOnStoredTimeMapData());}
			var numberOfMementos = countNumberOfMementos(tms);
			var tmPlurality = 'TimeMap';
			if(tms.length > 1) {
				tmPlurality += 's';
			}
			var selectBoxContents = createSelectBoxContents(tms);

			addInterfaceComponents(numberOfMementos, tms.length, tmPlurality, selectBoxContents);
			displayMementoCountAtopLogo();

			if(tms[0].mementos.list.length > 500) {
				$('#largeNumberOfMementoOption1').attr('disabled','disabled').addClass('disabled');
			}

			logoInFocus = true;
		}
	);

}


function getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap,timemaploc){
	chrome.runtime.sendMessage({method: "startSpinningActionButton"}, function(response) {
		console.log('Animation started');
		//if(callback){
		//	callback();
		//}
	});

	if(!timemaploc){ //use the aggregator
		timemaploc = memgator_json + window.location;
	}

	if(uri){
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}

	if(timemaploc.indexOf('https:') > -1){	//the target URI is secure and we can't have cross-scheme calls for JS
		console.warn('Mink has issues with Cross-scheme querying (this is an https site).');
		chrome.runtime.sendMessage({
					method: 'fetchSecureSitesTimeMap',
					value: timemaploc
		}, function(response) {});
		//Cannot use above callback, will usually not execute due to a race condition from chrome messaging and the subsequent Ajax call.

		return;
	}

	if(debug){console.log('Content.js: About to fire off Ajax request for ' + timemaploc);}
	
	


	
	$.ajax({
		url: timemaploc,
		type: 'GET'
	}).done(function(data,textStatus,xhr){
		if(xhr.status === 200){
			if(debug){console.log(data);}
			if(debug){console.log(xhr.getAllResponseHeaders());}
			if(debug){console.log(xhr.getResponseHeader('X-Memento-Count'));}

			var memCount = xhr.getResponseHeader('X-Memento-Count');
			
			var numberOfMementos = memCount ? memCount : 0;
			if(debug){console.log(numberOfMementos + ' mementos');}

			if(numberOfMementos > 0) {
				chrome.runtime.sendMessage({method: "setBadgeText", value: numberOfMementos}, function(response) {
				    console.log('Badge text set!');
				    logoInFocus = true;
				    hideLogo = true;
				    console.log('TODO: populate the actionButton dropdown contents here.');
				    //console.log(data);
				    //console.log($('#mementosDropdown').html());
				    
				    chrome.runtime.sendMessage({method: "setDropdownContents", value: data}, function(response) {
				      console.log('done?');
				      console.log(response);
				    });
				    
					//if(callback){
					//	callback();
					//}
				});
				
			}else if(numberOfTimeMaps > 0){
			  if(debug){console.log('Show indexed TimeMap interface here');}
			  revamp_fetchTimeMaps(data.timemap_index);
			}else {
				if(debug){console.log(numberOfMementos + ' ' + numberOfTimeMaps);}
			}
			return;
		}

/* TODO: tie the history manipulation into the revamp design
			$("#viewMementoButton").click(function() {
				addToHistory(window.location,$("#mdts option:selected").text(),null,//save the URI-R and Memento-Datetime of option chosen to localStorage
					function() {
						window.location = $("#mdts").val();
					}
				);

			});
			*/
	}).fail(function(xhr,textStatus) {
		if(debug){
			console.log('ERROR');
			console.log(textStatus);
			console.log(xhr);
		}
		if(xhr.status === 404){
			if(debug){console.log('404');}
			//return; //prevent infinite loop. This is probably not the correct way to handle it
		}

		//check if we're currently viewing an archive
		if(debug){console.log('Are we viewing the archive? Basis 1: two http[s]*?://');}

		var schemeOccurances = (window.location + '').match(/http[s]*:\/\//g);
		if(schemeOccurances.length > 1){ //we likely have two URIs in window.location
			console.log('  It appears we are viewing the archive based on multiple instances of http[s]*:// in window.location');
			// - Attempt to extract the URI-R
			var URI_M = (window.location + '').substr((window.location + '').indexOf('http', 6)); //exclude the initial scheme, let's figure out where the URI-M starts
			URI_M = URI_M.replace('http://', 'http://'); //cross-protocol interaction is a no-no
			return getMementosWithTimemap(memgator_proxy + URI_M, null, true);
		}

		// hide the Memento logo
		hideLogo = true;
		logoInFocus = true;

		if(debug){console.log(xhr);}
	});
}

function Memento(uri,datetime){
	this.uri = uri;
	this.datetime = datetime;
}
