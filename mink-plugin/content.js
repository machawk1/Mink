var debug = false;

//var proxy = 'http://timetravel.mementoweb.org/timemap/link/';
var memgator_proxy = 'http://memgator.cs.odu.edu:1208/timemap/link/';
var aggregator_wdi_json = 'http://labs.mementoweb.org/timemap/json/';
var memgator_json = 'http://memgator.cs.odu.edu:1208/timemap/json/';

//var aggregator_wdi_link = 'http://labs.mementoweb.org/timemap/link/';
//var aggregator_diy_link = 'http://timetravel.mementoweb.org/timemap/link/';
//var aggregator_diy_json = 'http://timetravel.mementoweb.org/timemap/json/';

var numberOfTimemaps = 0;

var embeddedTimemapRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g;
var mementosURIsWithinTimemapsRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\".*memento.*\"/g;
var timemapsURIsWithinTimemapsRegex = /<https?:.*>;rel=\".*timemap.*\"/g;

var mementosInTimemapBasedOnRelAttributeRegex = /;rel=\".*memento.*\"/g;
var timemapsInTimemapBasedOnRelAttributeRegex = /;rel=\".*timemap.*\"/g;

var animateBrowserActionIcon = false;
var animationTimer;

//TODO: check if in blacklist
//getBlacklist();



// Faux promises for enabling/disabling UI
var setBlacklisted = function() {setActiveBasedOnBlacklistedProperty(displayUIBasedOnContext);};
var setInitialStateWithChecks = function() {setActiveBasedOnDisabledProperty(setBlacklisted);};

setInitialStateWithChecks();

function setActiveBasedOnDisabledProperty(cb) {
	chrome.storage.local.get('disabled', function(items) {
		if(items.disabled) {
		  chrome.runtime.sendMessage({method: 'stopWatchingRequests'}, function(response) {});
		} else {
		  cb();
		}
	});
}

function setActiveBasedOnBlacklistedProperty(cb) {
  chrome.storage.local.get('blacklist', function(items) {
    var inBlacklist = false;
    if(!items.blacklist) {cb(); return;}

    for(var ii = items.blacklist.length - 1; ii >= 0; ii--) {
      var documentHostname = (new URL(document.URL)).hostname;
      var blacklistEntryHostname = (new URL(items.blacklist[ii])).hostname;
      if(documentHostname === blacklistEntryHostname) {
        chrome.runtime.sendMessage({method: 'stopWatchingRequests_blacklisted'});
        return;
      }
    }

    cb();
  });
}


var jsonizedMementos = '[';
var jsonizedMementos;

function addToHistory(uri_r,memento_datetime,mementos,callback) {
	var mementosToStore = mementos;
	if(!mementosToStore){mementosToStore = jsonizedMementos;}
	chrome.runtime.sendMessage({method: "store", value: ""+uri_r, memento_datetime: memento_datetime, mementos: mementosToStore}, function(response) {
		if(callback){
			callback();
		}
	});
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
    if(debug) {console.log('displayUIBasedOnContext()'); console.log(document.URL);}
    chrome.storage.local.get('timemaps', function(items) {
      var hasATimeMapInCache = items.timemaps && items.timemaps[document.URL];

	  if(hasATimeMapInCache) {
	    var isAMemento = items.timemaps[document.URL].datetime;

        if(isAMemento) {
	      chrome.runtime.sendMessage({method: 'setBadge', text: '', iconPath: {
	          '38' : chrome.extension.getURL('images/mLogo38_isAMemento.png'),
	          '19' : chrome.extension.getURL('images/mLogo19_isAMemento.png')
	         }
	      });
	    }else { // Live web page revisited w/ a TM in cache
	      if(debug) {
	        console.log('Live web page revisited with a TM in cache');
	      }
	      
	      if(!items.timemaps[document.URL].timemap && items.timemaps[document.URL].timegate && items.timemaps[document.URL].mementos && items.timemaps[document.URL].mementos.length == 0) {
	        //DBPedia specifies its own TG but lists no mementos/TM 
	        getTMThenCall(document.URL, function() {displayUIBasedOnStoredTimeMap(items.timemaps[document.URL]);});
	      }else {
	           displayUIBasedOnStoredTimeMap(items.timemaps[document.URL]);
	      }
	    }
	  }else { // Not a Memento, no TM in cache
	    if(debug) {
	      console.log('not a memento, no TM in cache');
	    }
	    getMementos(document.URL);
	  }
	});
}

function getTMThenCall(uri, cb) {
  $.ajax({
	  url: uri
  }).done(function(data,textStatus,xhr) {
	  var tm = new Timemap(xhr.getResponseHeader('Link'));
	  var tmBody = new Timemap(data);
	  if(tm.timemap) {
	    chrome.runtime.sendMessage({
	        method: 'fetchTimeMap',
	        value: tm.timemap
	    },cb);
	    return;
	  }
	  
	  if(tm.mementos && tm.mementos.length < 3 && tm.timegate) {  
	    var nextURI = tm.timegate;
	    tm = null;
	    tmBody = null;
	    getTMThenCall(nextURI, cb);
	  
	  } else {
	    cb();
	  }
  });

}

function displayUIBasedOnStoredTimeMap(tmDataIn) {
  if(debug){console.log('displayUIBasedOnStoredTimeMap');}
  chrome.runtime.sendMessage({
	  method: 'setTMData',
	  value: tmDataIn
  });
 
  console.log(tmDataIn);
  if(debug){console.log(tmDataIn);}
  var mementoCountFromCache = tmDataIn.mementos.list.length;
  chrome.runtime.sendMessage({method: 'setBadgeText', value: '' + mementoCountFromCache});
}

function isEmpty(o) { //returns if empty object is passed in
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}


function getBlacklist(cb) {
	var callbackArguments = arguments;
	chrome.storage.local.get('blacklist', function(items){
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
		'blacklist': null
	};

	if($.isEmptyObject(currentBlacklist)){
			save.blacklist = [];
	} else {
		save.blacklist = currentBlacklist.blacklist;
	}

	if(!save.blacklist){
		save.blacklist = [];
	}

    //TODO (#191): Normalize uriIn?

	// Check if URI is already in blacklist before adding
	if(save.blacklist.indexOf(uriIn) > -1){
		if(debug){
			console.log('URI already in blacklist');
			console.log(save.blacklist);
		}
		return;
	}

	if(debug){
		console.log('Previous blacklist contents:');
		console.log(save.blacklist);
	}

	save.blacklist.push(uriIn);

	if(debug){
		console.log('Current blacklist contents:');
		console.log(save.blacklist);
	}

	chrome.storage.local.set(save,
		function() {
		    if(debug) {
			  console.log('done adding ' + uri + ' to blacklist. Prev blacklist:');
			  console.log(currentBlacklist);
			}
			getBlacklist();
		}
);
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(debug){console.log('in listener with ' + request.method);}

	if(request.method === 'addToBlacklist'){
		getBlacklist(addToBlacklist, request.uri); // And add uri
		return;
	}

    if(request.method === 'stopAnimatingBrowserActionIcon') {
        clearTimeout(animationTimer);
        animateBrowserActionIcon = false;
        return;
    }

	if(request.method === 'showArchiveNowUI') {
		if(debug){console.log('Hide logo here');}
		logoInFocus = true;
		hideLogo = true;

		return;
	}
	
	if(request.method === 'isSiteSolelyMadeUpOfFrames') {
	  var frameCount = $('frame').size();
	  var madeUpOfFrames = false;
	  if(frameCount && frameCount > 0) {
	    madeUpOfFrames = true;
	  }
	  sendResponse(madeUpOfFrames);
	  return;
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
		console.log('creating new TM');
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
			console.warn('no special handling, calling fallthrough');
		}
	}

    if(request.method === 'showViewingMementoInterface') {
      if(debug) {
        console.log('We will show the "return to live web" interface but it is not implemented yet');
      }
      return;
    }

    if(debug) {console.log('ppp');}
	displayUIBasedOnContext();
});


function processResponseFromAggregator(xhr) {
	if(debug){console.log('Done querying timegate');}
	if(xhr.status === 200){
		var linkHeaderStr = xhr.getResponseHeader('Link');
		console.log('creating new TM X');
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

function createTimemapFromURI(uri,accumulatedArrayOfTimemaps) {
	console.log('creatTimemapFromURI() - includes write to localstorage');
	if(!accumulatedArrayOfTimemaps){accumulatedArrayOfTimemaps = [];}

	$.ajax({
		url: uri,
		type: 'GET' /* The payload is in the response body, not the head */
	}).done(function(data,textStatus,xhr) {
		if(xhr.status === 200){
		    console.log('creating new tm ll');
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
		}
	});
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


function getMementos(uri) {
    if(debug) {console.log('getMementosWithTimemap()');}
	var timemapLocation = memgator_json + uri;

    chrome.runtime.sendMessage({method: 'setBadge', text: '', iconPath:
      {
        '38': clockIcons_38[clockIcons_38.length - 1],
        '19': clockIcons_19[clockIcons_19.length - 1]
      }
    });
    chrome.runtime.sendMessage({method: 'setBadgeText', text: ''}, function(response) {});

    animateBrowserActionIcon = true;

    setTimeout(animatePageActionIcon, 500);

    if(debug){console.log('in getMementos, sending "fetchTimeMap" message');}
	chrome.runtime.sendMessage({
	    method: 'fetchTimeMap',
	    value: timemapLocation
	});
}



var clockIcons_38 = [chrome.extension.getURL('images/mementoLogos/mLogo38_7.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_15.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_22.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_30.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_37.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_45.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_52.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo38_60.png')];
var clockIcons_19 = [chrome.extension.getURL('images/mementoLogos/mLogo19_7.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_15.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_22.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_30.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_37.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_45.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_52.5.png'),
	chrome.extension.getURL('images/mementoLogos/mLogo19_60.png')];
var iteration = clockIcons_38.length - 1;

function animatePageActionIcon() {
  if(!animateBrowserActionIcon) {
    clearTimeout(animationTimer);
  	return;
  }
  chrome.runtime.sendMessage({
    method: 'setBadge',
    text: '',
    iconPath: {'38': clockIcons_38[iteration], '19': clockIcons_19[iteration]}});
  iteration--;

  if(iteration < 0) {iteration = clockIcons_38.length - 1;}
  animationTimer = setTimeout(animatePageActionIcon, 250);
  //TODO: know when to stop this
}

function Memento(uri,datetime){
	this.uri = uri;
	this.datetime = datetime;
}
