var debug = true;
var iconState = -1;
var tmData;

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Mink test!');
  chrome.tabs.executeScript(tab.id, {code: "var tmData = " + JSON.stringify(tmData)}, 
    function() {
	  chrome.tabs.executeScript(tab.id, {
	  // TODO: Account for data: URIs like the "connection unavailable" page.
	  //   Currently, because this scheme format is not in the manifest, an exception is   
	  //     thrown. Handle this more gracefully.
		file: "js/displayMinkUI.js"
	  });
  });
});


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
    	if(debug){console.log('Retrieving items from localStorage');}

      sendResponse({
        value: localStorage.getItem('minkURI'),
        mementos: localStorage.getItem('mementos'),
        memento_datetime: localStorage.getItem('memento_datetime')
      });
    }else if (request.method == 'nukeFromOrbit') {
    	localStorage.removeItem('minkURI');
    }else if (request.method == 'fetchSecureSitesTimeMap') {
      var tgURI = request.value;

      $.ajax({
    		url: tgURI,
    		type: "GET"
    	}).done(function(data,textStatus,xhr,a,b){
        getMementosWithTimemap(data.timemap_uri.json_format);
    	}).fail(function(xhr, data, error){
        getMementosWithTimemap(tgURI);
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
        chrome.pageAction.setIcon({tabId: tab.id, path: {'38':'images/minkLogo38_working.png'}});
    }else if(request.method == 'setBadgeText') {
        
        chrome.tabs.getSelected(null, function(tab) {
			chrome.browserAction.setBadgeText({text: request.value, tabId: tab.id});
		});
		//TODO: stop spinning
		//stopSpinningActionButton()
		
        sendResponse({
          value: 'stopAnimation'
      });
    }else if(request.method == 'setDropdownContents') {
      console.log('999');
      console.log(request.value);

      tmData = request.value;
      //for(var mm = 0; mm < request.value.mementos.list.length; mm++) {
      
      //}
    
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
    }
  }
);

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

if(debug) { // Only show contextual menu items in dev for now.
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


function displaySecureSiteMementos(mementos){
  chrome.tabs.query({
    'active': true,
    'currentWindow': true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      method: 'displaySecureSiteMementos',
      value: mementos
    });
  });
}


/* Duplicate of code in content.js so https URIs can be used to query timemaps.
   Is there a reason that the below should even be in content.js? */
function getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap,timemaploc){
	if(!timemaploc){ //use the aggregator
        // Redundant def of content.js constant, which cannot be accessed from here
        //var aggregator_wdi_json = 'http://labs.mementoweb.org/timemap/json/';
        var memgator_json = 'http://memgator.cs.odu.edu:1208/timemap/json/';
		timemaploc = memgator_json + window.location;
		if(debug) {
		  console.log('In getMementosWithTimemap');
		}
	}

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
			if(debug){console.log(numberOfMementos + ' mementos available');}

      if (numberOfMementos == 0) {
          if (debug) {console.log('We still need to fetch the TimeMap in mink.js');}
          revamp_fetchTimeMaps(data.timemap_index, displaySecureSiteMementos);

          return;
      }

      displaySecureSiteMementos(data);

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

	chrome.storage.local.set({
			'uri_r': arrayOfTimeMaps[0].original_uri,
			'timemaps': arrayOfTimeMaps
	}); //end set
}
