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
//getBlacklist();



chrome.storage.sync.get('disabled',function(items) {
    if(items.disabled) {
      chrome.runtime.sendMessage({method: 'stopWatchingRequests'}, function(response) {});
    } else {
      displayUIBasedOnContext();
    }
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
    if(debug) {console.log("viewDifferentMemento()");}
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
    chrome.storage.sync.get('timemaps',function(items) {
	  if(items.timemaps && items.timemaps[document.URL]) {
	    chrome.runtime.sendMessage({method: 'setBadge', text: '', iconPath: chrome.extension.getURL('images/mLogo38_isAMemento.png')}, function(response) {});
	  }else {
	    getMementos();
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
    console.log('in listenenr with ' + request.method);
    
	if(request.method == "hideUI"){
		$("#minkContainer").fadeOut();
		return;
	}
	
	if(request.method == 'startMinkExecution') {
	    displayUIBasedOnContext();
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
		//displayUIBasedOnTimemap(tm);

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
			
			return;
			
			
			
			Promise.resolve(accumulatedArrayOfTimemaps.concat(tm)).then(function(tms){
				storeTimeMapData(tms,displayUIBasedOnStoredTimeMapData);
			});
		}
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

function storeTimeMapData(arrayOfTimeMaps, cbIn){
	var cb = cbIn ? cbIn : displayUIBasedOnStoredTimeMapData;
	if(debug){console.log('executing storeTimeMapData');}

	chrome.storage.local.set({
			'uri_r': arrayOfTimeMaps[0].original_uri,
			'timemaps': arrayOfTimeMaps
	}, cb); //end set
}

function displayUIBasedOnStoredTimeMapData() {
    alert('displayUIBasedOnStoredTImeMapData');
    return;
}


function getMementos(uri,alreadyAcquiredTimemaps,stopAtOneTimemap,timemaploc){
    if(debug) {console.log('getMementosWithTimemap()');}
	if(!timemaploc){ //use the aggregator
		timemaploc = memgator_json + window.location;
	}

	if(uri){
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}
    
    //TODO: set 'working' icon
    chrome.runtime.sendMessage({method: 'setBadge', text: '', iconPath: chrome.extension.getURL('images/minkLogo38_working.png')}, function(response) {});

	chrome.runtime.sendMessage({
	    method: 'fetchTimeMap',
	    value: timemaploc
	}, function(response) {});
}

function Memento(uri,datetime){
	this.uri = uri;
	this.datetime = datetime;
}
