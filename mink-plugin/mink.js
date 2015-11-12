var debug = true;
var iconState = -1;
var tmData;
var maxBadgeDisplay = '999+';
var stillProcessingBadgeDisplay = 'WAIT';
var tabBadgeCount = {}; // Maintain tabId-->count association


/*
chrome.webNavigation.onCommitted.addListener(function(e) {
    if(e.frameId !== 0) { // Not main frame
      return;
    }
    console.log("StartingX");
 

	 chrome.runtime.sendMessage({
	   'method': 'startMinkExecution'
	 });
   
    
    //displayUIBasedOnContext();
});*/


chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
    	chrome.storage.sync.get('disabled',function(items) {
    	    if(items.disabled) {
    	      stopWatchingRequests();
    	      //TODO: show alternate interface
    	      return;
    	    }

			chrome.browserAction.getBadgeText({tabId: tab.id}, function(result) {
			  if(!result.length && !Number.isInteger(result) && result != maxBadgeDisplay) {		              
				chrome.tabs.getSelected(null, function(tab) {
					console.log('Setting badge text based on getSelected tab id instead of origin tab');
					chrome.browserAction.setBadgeText({text: stillProcessingBadgeDisplay, tabId: tab.id});
				});
				return; // Badge has not yet been set
			  }
			  displayMinkUI(tab.id);
		  
			});
		});
	});
});

function displayMinkUI(tabId) {
  chrome.tabs.executeScript(tabId, {code: "var tmData = " + JSON.stringify(tmData)}, 
    function() {
	  chrome.tabs.executeScript(tabId, {
	  // TODO: Account for data: URIs like the "connection unavailable" page.
	  //   Currently, because this scheme format is not in the manifest, an exception is   
	  //     thrown. Handle this more gracefully.
		file: "js/displayMinkUI.js"
	  });
  });

}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == 'store') {
    	localStorage.setItem('minkURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
		localStorage.setItem('memento_datetime',request.memento_datetime);

    	sendResponse({value: 'noise'});
    } else if (request.method == 'retrieve'){
    	if(debug){console.log('Retrieving items from localStorage');}

      sendResponse({
        value: localStorage.getItem('minkURI'),
        mementos: localStorage.getItem('mementos'),
        memento_datetime: localStorage.getItem('memento_datetime')
      });
    } else if (request.method == 'retrieveFromLocalStorage'){
    	if(debug){console.log('Retrieving items from localStorageX');}

      sendResponse({
        value: localStorage.getItem('minkURI'),
        mementos: localStorage.getItem('mementos'),
        memento_datetime: localStorage.getItem('memento_datetime')
      });
    }else if (request.method == 'nukeFromOrbit') {
    	localStorage.removeItem('minkURI');
    }else if (request.method == 'fetchSecureSitesTimeMap') {
      var tgURI = request.value;
      if(debug) {console.log('method = fetchSecureSitesTimeMap');}
      
      console.log('about to fetch secure sites mementos');
      $.ajax({
    		url: tgURI,
    		type: "GET"
    	}).done(function(data,textStatus,xhr,a,b){
    	  console.log('success querying w/ secure URI');
          getMementosWithTimemap(data.timemap_uri.json_format, sender.tab.id);
          
    	}).fail(function(xhr, data, error){
    	  console.log('querying secure FAILED, mitigating');
    	  if(xhr.status === 404) {
    	    console.log('Display zero mementos here!');
    	    showInterfaceForZeroMementos();
    	    return;
    	  }
    	  
    	  // Should only get here if there is some sort of weird cross-scheme issue
          if(debug){alert('ERROR!');}
          getMementosWithTimemap(tgURI, sender.tab.id);
      });
    }else if (request.method == 'notify') {
		  var notify = chrome.notifications.create(
			  'id1',{
				  type:'basic',
				  title:request.title,
				  message:request.body,
				  iconUrl: 'images/icon128.png'
			  },function() {}
		   );
    }else if (request.method == 'refreshAggregatorTimeMap') {
      var refreshAggregatorTimeMapURI = request.value;
      $.ajax({
        method: 'HEAD',
        url: refreshAggregatorTimeMapURI,
        beforeSend: function(request) {
          request.setRequestHeader('cache-control', 'no-cache	')
        }
      }).done(function(data, textStatus, xhr) {
          if (debug) {
            console.log('success');
            console.log(data);
          }
      }).fail(function(xhr, textStatus, error) {
          if (debug){
            console.log('failed');
            console.log(error);
            console.log(textStatus);
          }
      });
    }else if(request.method == 'startSpinningActionButton') {
       console.log('starting animation.....');
       iconState = 0;
        setTimeout(nextAnimationStep, 250);
        /*chrome.tabs.getSelected(null, function (tab) {
		  chrome.tabs.sendMessage(tab.id, {
            "method": 'changeIcon'
           });
		});*/
        
        
    }else if(request.method == 'setBadgeText') {
        setBadgeText(request.value, sender.tab.id)

		//TODO: stop spinning
		//stopSpinningActionButton()
		
        sendResponse({
          value: 'stopAnimation'
        });
    }else if(request.method == 'setDropdownContents') {
      tmData = request.value;
    }else if(request.method == 'setBadge') {
      setBadge(request.text, request.iconPath, sender.tab.id);
    }else if(request.method === 'openOptionsPage') {
      console.log('opening options page');
      chrome.runtime.openOptionsPage();
    }else if(request.method == 'stopWatchingRequests') {
      stopWatchingRequests()
    }else if(request.method == 'getMementosForHTTPSSource') {
    	//ideally, we would talk to an HTTPS version of the aggregator,
    	// instead, we will communicate with Mink's bg script to get around scheme issue
    	var uri = 'http' + request.value.substr(4);
		  $.ajax({
			  url: uri,
			  type: 'GET'
		  }).done(function(data,textStatus,xhr){
			  if(debug){
				  console.log('We should parse and return the mementos here via a response');
				  //console.log(data);
			  }
			  chrome.tabs.query({
				  'active': true,
				  'currentWindow': true
			  }, function (tabs) {
				  chrome.tabs.sendMessage(tabs[0].id, {
					  'method': 'displayThisMementoData',
					  'data': data
				  });
			  });

	  	}).fail(function(xhr,textStatus,error){
			  if(debug){
			  	//console.log('There was an error from mink.js');
			  	//console.log(textStatus);
			  	//console.log(error);
			  }
		  	if(error == 'Not Found'){
				//console.log('We have '+[].length+' mementos from the call to the archives using an HTTPS source!');
				hideLogo = true;
				showArchiveNowUI();
			}

		});
    }else {
      if(debug){console.log('Message sent using chrome.runtime not caught: ' + request.method);}
    }
  }
);

function setBadgeText(value, tabid) {
        var badgeValue = value;

        if(parseInt(badgeValue) > 999) {
                badgeValue = maxBadgeDisplay;
        }

        console.log('Setting badge text for tab id '+tabid);

        chrome.tabs.get(tabid, function(tab) {
            tabBadgeCount['tab' + tabid] = {mementoCount: value, url: tab.url};
            console.log("We set: ");
            console.log(tabBadgeCount);
        }); 
        

		chrome.browserAction.setBadgeText({text: badgeValue + '', tabId: tabid});
		chrome.browserAction.setBadgeBackgroundColor({color: '#090', tabId: tabid});

		//TODO: stop spinning
		//stopSpinningActionButton()
}

function setBadge(value, icon, tabid) {
		chrome.browserAction.setBadgeText({text: value + '', tabId: tabid});
		chrome.browserAction.setIcon({tabId: tabid, path: {'38': icon}});  
}


chrome.contextMenus.create({
	"title": "Hide Mink until reload",
	"contexts": ["image"],
	"onclick" : hideMinkUI
	//,"targetUrlPatterns":["*://*/*"] //TODO: filter this solely to the Mink UI
});

function nextAnimationStep() {
	  if(iconState <= 0) {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-37_5'}});
		iconState = 1;
		console.log('1');
	  }else if(iconState == 1) {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-45.png'}});  
		iconState = 2;
		console.log('2');
	  }else {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-30.png'}}); 
		iconState = 0;
		console.log('0');
	  }
	  
	  if(iconState == -1){ return;}
	  //setTimeout(nextAnimationStep, 250);
}

function hideMinkUI(){
 	chrome.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            "method": "hideUI"
        });
    });
}

chrome.tabs.onActivated.addListener(function(activeTabInfo) {
  chrome.storage.sync.get('disabled',function(items) {
    if(items.disabled) {
      stopWatchingRequests();
    }
  });
});




function startWatchingRequests() {
  chrome.storage.sync.remove('disabled', function() {
	  chrome.contextMenus.update('mink_stopStartWatching', {
		  'title': 'Stop Watching Requests',
		  'onclick': stopWatchingRequests
	  });
  
	  setBadge('', chrome.extension.getURL('images/minkLogo38.png'), null);
  });
}

function stopWatchingRequests() {
  if(debug){console.log('stopWatchingRequests');}
  chrome.storage.sync.set({'disabled': true}, function() {        
	  chrome.contextMenus.update('mink_stopStartWatching', {
		  'title': 'Restart Live-Archived Web Integration',
		  'onclick': startWatchingRequests
	  });
  
	  setBadge('', chrome.extension.getURL('images/minkLogo38_disabled.png'), null);
	  // Without an id, the current tab's badge won't be updated
	  //chrome.tabs.getCurrent(function(tab) {
	  //    setBadge(' ', chrome.extension.getURL('images/minkLogo38_disabled.png'), tab.id);
	  //});
  });
}


if(debug) { // Only show contextual menu items in dev for now.
chrome.contextMenus.create({
    'id': 'mink_stopStartWatching',
	'title': 'Stop Watching Requests',
	'contexts': ['browser_action'],
	'onclick' : stopWatchingRequests
},function(err){
  if(err){console.log('error creating second contextmenu');}
});

chrome.contextMenus.create({
	'title': 'Add to Mink Blacklist',
	'contexts': ['image'],
	'onclick' : addToBlackList
	//,'targetUrlPatterns':['*://*/*'] //TODO: filter this solely to the Mink UI
});

chrome.contextMenus.create({
	'title': 'Nuke Blacklist Cache',
	'contexts': ['image'],
	'onclick' : nukeBlacklistCache
	//,'targetUrlPatterns':['*://*/*'] //TODO: filter this solely to the Mink UI
},function(err){
  if(err){console.log('error creating second contextmenu');}
});

chrome.contextMenus.create({
	'title': 'Clear LocalStorage',
	'contexts': ['image'],
	'onclick' : nukeLocalStorage
	//,'targetUrlPatterns':['*://*/*'] //TODO: filter this solely to the Mink UI
},function(err){
  if(err){console.log('error creating second contextmenu');}
});

}

function addToBlackList(){
 	chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'addToBlacklist',
            'uri': tabs[0].url
        });
    });
}

function nukeBlacklistCache(){
  chrome.storage.sync.clear();
  console.log('chrome.storage.sync cleared');
}

function nukeLocalStorage(){
  chrome.storage.local.clear();
  console.log('chrome.storage.local cleared');
}

function showArchiveNowUI(){
 	chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'showArchiveNowUI'
        });
    });
}

function getMementosForHTTPSWebsite(){
 	chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'getMementosFromSecureSource'
        });
    });
}

chrome.webRequest.onCompleted.addListener(function(deets){
   // console.log('onHeadersReceived()');
   // console.log(deets.url);
   // console.log(deets);

    chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'displayUI'
        });
    });
},
{urls: ['*://twitter.com/*/status/*'],types: ['xmlhttprequest']},['responseHeaders']);

chrome.webRequest.onHeadersReceived.addListener(function(deets){
	var url = deets.url;
	var timemap, timegate, original, url;

	var headers = deets.responseHeaders;
	var mementoDateTimeHeader, linkHeaderAsString;
	for(var headerI=0; headerI<headers.length; headerI++){
		if(headers[headerI].name == 'Memento-Datetime'){
			mementoDateTimeHeader = headers[headerI].value;
		}else if(headers[headerI].name == 'Link'){
			linkHeaderAsString = headers[headerI].value;
		}
	}

	if(linkHeaderAsString){
		var tm = new Timemap(linkHeaderAsString);
		chrome.storage.local.clear();
		if(mementoDateTimeHeader){
			tm.datetime = mementoDateTimeHeader;
		}
		chrome.storage.local.set(tm);
		if(mementoDateTimeHeader){
			//if(debug){console.log('You're viewing something in the archive! TODO: Show simpler interface.');}
			//var m = new Memento();
			//m.datetime = mementoDateTimeHeader;
			//chrome.storage.local.set(m);
			return;	//if we ever want to show the standard interface regardless of the memento-datetime header, disable this
		}
	}else {	//e.g., http://matkelly.com
		if(debug){console.log('There is no HTTP link header, Mink will utilize a Memento aggregator instead.');	}
		chrome.storage.local.clear(); //get rid of previous timemaps, timegates, etc.
	}


},
{urls: ['<all_urls>'],types: ['main_frame']},['responseHeaders']);


function displaySecureSiteMementos(mementos, tabid){
  console.log('in displaySecureSiteMementos()');
  console.log(mementos);
  setBadge(mementos.length, chrome.extension.getURL('images/minkLogo38.png'), tabid);
}


function showInterfaceForZeroMementos() {
  console.log('Displaying zero mementos');
  tmData = {};
  tmData.mementos = {};
  tmData.mementos.list = [];
  tmData.original_uri = 'doWeKnowThisHere';
  
  
  // TODO: Also set the badge icon to the red memento icon (or something else indicative)
  chrome.tabs.getSelected(null, function(tab) {
    chrome.browserAction.setBadgeText({text: '' + tmData.mementos.list.length, tabId: tab.id});
    chrome.browserAction.setIcon({tabId: tab.id, path: 'images/minkLogo38_noMementos.png'});
  });
  
}

/* Duplicate of code in content.js so https URIs can be used to query timemaps.
   Is there a reason that the below should even be in content.js? */
function getMementosWithTimemap(uri, tabid){
    var memgator_json = 'http://memgator.cs.odu.edu:1208/timemap/json/';
	var timemaploc = memgator_json + window.location;

    console.log('in getMementosWithTimemap with uri ' + uri + ' and tabid ' +tabid);

	if(uri){
	    if(debug) {
	      console.log('in uri ' + uri);
	    }
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}


	if(debug){console.log('Mink.js: About to fire off Ajax request for ' + timemaploc);}
	$.ajax({
		url: timemaploc,
		type: 'GET'
	}).done(function(data,textStatus,xhr){
		if(xhr.status == 200){
			if(debug){console.log(data);}
			if(debug){console.log(xhr.getAllResponseHeaders());}
			
			var numberOfMementos = xhr.getResponseHeader('X-Memento-Count');

	         // The MemGator service currently returns a 404 w/ no X-Memento-Count 
	         //    HTTP Header
	         //  Q: Does a 404 cause the above AJAX to invoke this "fail" handler
			if(debug){console.log(numberOfMementos + ' mementos availableX');}
            
			if (numberOfMementos == 0) {
				  if (debug) {console.log('We still need to fetch the TimeMap in mink.js');}
				  revamp_fetchTimeMaps(data.timemap_index, displaySecureSiteMementos);

				  return;
			}
           tmData = data;
           displaySecureSiteMementos(data.mementos.list, tabid);

      return;
		}
	}).fail(function(xhr,textStatus) {
	    // TODO: Handler the scenario when the user does not have an internet connection 
	    //   Also, Timeout from server
	    if(debug) {
	      console.log('we encountered an error');
	      console.log(xhr);
	      console.log(xhr.getResponseHeader('X-Memento-Count'));
	      console.log('fin');
	      return;
	    }
		if(debug){
			console.log('ERROR');
			console.log(textStatus);
			console.log(xhr);
		}
		if(xhr.status == 404){
      var tm = new Timemap();
      tm.original = uri;

      chrome.tabs.query({
        'active': true,
        'currentWindow': true
      }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          method: 'displaySecureSiteMementos',
          value: tm
        });
      });

			if(debug){console.log('404'); console.log("report no mementos, show appropriate interface");}
		}
	});
}

/* Redundant of content.js. Does content.js really need this function? */
function revamp_fetchTimeMaps(tms, cb) {
  if (debug) {console.log('mink.js revamp_fetchTimeMaps()');}
		var tmFetchPromises = [];
		for(var tm = 0; tm < tms.length; tm++){ // Generate Promises
			tmFetchPromises.push(fetchTimeMap(tms[tm].uri));
		}
		if(debug){console.log('Fetching ' + tms.length + ' TimeMaps');}
		Promise.all(tmFetchPromises).then(function(val){
        storeTimeMapData(val);
        var tm = val[0];

        for(var tmI = 0; tmI < val.length; tmI++) {
          Array.prototype.push.apply(tm.mementos.list, val[tmI].mementos.list);
        }

        if(cb) {cb(tm);}
    }).catch(function(e) {
			if(debug){
				console.log('A promise failed: ');
				console.log(e);
			}
		});

		return;
}

/* Redundant of content.js. Does content.js really need this function? */
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

/* Redundant of content.js. Does content.js really need this function? */
function storeTimeMapData(arrayOfTimeMaps, cbIn){
	//var cb = cbIn ? cbIn : displayUIBasedOnStoredTimeMapData;
	if(debug){console.log('executing storeTimeMapData');}
/*
	chrome.storage.local.set({
			'uri_r': arrayOfTimeMaps[0].original_uri,
			'timemaps': arrayOfTimeMaps
	}); //end set
*/
}
