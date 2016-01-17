var debug = false;
var iconState = -1;
var tmData;
var maxBadgeDisplay = '999+';
var stillProcessingBadgeDisplay = 'WAIT';
var tabBadgeCount = {}; // Maintain tabId-->count association



var browserActionTitle_viewingMemento = 'Mink - Viewing Memento';
var browserActionTitle_normal = 'Mink - Integrating the Live and Archived Web';
var browserActionTitle_noMementos = 'Mink - No Mementos Available';

var badgeImages_disabled = {
  '38' : chrome.extension.getURL('images/minkLogo38_disabled.png'),
  '19' : chrome.extension.getURL('images/minkLogo19_disabled.png')
};

var badgeImages_blacklisted = {
  '38' : chrome.extension.getURL('images/minkLogo38_blacklisted.png'),
  '19' : chrome.extension.getURL('images/minkLogo19_blacklisted.png')
};

var badgeImages_noMementos = {
  '38' : chrome.extension.getURL('images/minkLogo38_noMementos2.png'),
  '19' : chrome.extension.getURL('images/minkLogo19_noMementos2.png')
};

var badgeImages_mink = {
  '38' : chrome.extension.getURL('images/minkLogo38.png'),
  '19' : chrome.extension.getURL('images/minkLogo19.png')
};

var badgeImages_isAMemento = {
  '38' : chrome.extension.getURL('images/mLogo38_isAMemento.png'),
  '19' : chrome.extension.getURL('images/mLogo19_isAMemento.png')
};



chrome.webNavigation.onCommitted.addListener(function(e) {
    if(debug) {
      console.warn('NAVIGATION OCCURRED!');
      console.log(e);
    }
});


chrome.browserAction.onClicked.addListener(function(tab) {
    var scheme = (new URL(tab.url)).origin.substr(0, 4);
    if(scheme !== 'http') {
      if(debug){console.log('Invalid scheme for Mink: ' + scheme);}
      return;
    }

    // Check if isA Memento
    chrome.storage.local.get('timemaps', function(items) {                
        if(items.timemaps && items.timemaps[tab.url]) {
	        if(debug){console.log('Clicked button and we are viewing a memento');}
	        displayMinkUI(tab.id);
	        return;
        }else {
	        if(debug){console.log('No timemap stored in cache for ' + tab.url);}
	        showMinkBadgeInfoBasedOnProcessingState(tab.id);
        }
	});
});

function setEnabledBasedOnURIInBlacklist(cb) {
  chrome.tabs.query({active: true}, function(tab) {
    if(debug){
      console.log('is URI in blacklist?');
      console.log(tab);
    }
    
    if(cb) {cb();}
  });


}

function showMinkBadgeInfoBasedOnProcessingState(tabid) {
	chrome.storage.local.get('disabled',function(items) {
		if(items.disabled) {
		  stopWatchingRequests();
		  //TODO: show alternate interface
		  return;
		}
				
		var cb = function() {setBadgeTextBasedOnBrowserActionState(tabid);};
		
		//TODO: check if URI is in blacklist
		if(debug){console.warn('about to call setEnabledBasedOnURIBlacklist');}
		setEnabledBasedOnURIInBlacklist(cb);       
	});
}

function setBadgeTextBasedOnBrowserActionState(tabid) {
	//TODO: This should not rely on the badge count to detect zero mementos, as badges are no longer used for no mementos present
	// - maybe rely on the title, since the icon's src path cannot be had.
	chrome.browserAction.getBadgeText({tabId: tabid}, function(result) {
		  if(!result.length && !Number.isInteger(result) && result != maxBadgeDisplay) {		  
			 chrome.browserAction.getTitle({tabId: tabid}, function(result) {
					// Only set badge text if not viewing a memento
					if(result === browserActionTitle_noMementos) {
					  displayMinkUI(tabid);
					  return;
					}
					
					if(result !== browserActionTitle_viewingMemento) {
					  setBadgeText(stillProcessingBadgeDisplay, tabid);
					} else {
					  console.log('Show "Viewing Memento" Mink UI in page content.');
					  displayMinkUI(tabid);
					}
			  });
					  
	          if(debug){console.log('x');}
			  return; // Badge has not yet been set
		  }
	      if(debug){console.log('u');}
	      displayMinkUI(tabid);
  
	});
}

function displayMinkUI(tabId) {
  if(debug){console.log('Injecting displayMinkUI.js');}
  chrome.tabs.executeScript(tabId, {code: "var tmData = " + JSON.stringify(tmData) + "; var tabId = " + tabId + ";"}, 
    function() {
	  chrome.tabs.executeScript(tabId, {
	  // TODO: Account for data: URIs like the "connection unavailable" page.
	  //   Currently, because this scheme format is not in the manifest, an exception is   
	  //     thrown. Handle this more gracefully.
		file: "js/displayMinkUI.js"
	  }, function(res) {
	    if(debug) {
	        console.log('mink ui injected. res = ');
	        console.log(res);
	    }
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
    }else if (request.method == 'fetchTimeMap') {
      fetchTimeMap(request.value, sender.tab.id);
    }else if (request.method == 'notify') {
		  var notify = chrome.notifications.create(
			  'id1',{
				  type:'basic',
				  title:request.title,
				  message:request.body,
				  iconUrl: 'images/icon128.png'
			  },function() {}
		   );
    }else if(request.method == 'setBadgeText') {
        setBadgeText(request.value, sender.tab.id)

        sendResponse({
          value: 'stopAnimation'
        });
    }else if(request.method == 'setDropdownContents' || request.method == 'setTMData') {
      tmData = request.value;
    }else if(request.method == 'setBadge') {
        setBadge(request.text, request.iconPath, sender.tab.id);
    }else if(request.method === 'openOptionsPage') {
      if(debug){console.log('opening options page');}
      chrome.runtime.openOptionsPage();
    }else if(request.method == 'stopWatchingRequests') {
      stopWatchingRequests()
    }else if(request.method == 'stopWatchingRequests_blacklisted') {
      stopWatchingRequests_blacklisted()
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

function fetchTimeMap(uri, tabid) {
    console.log('Fetching TimeMap for ' + uri + ' in tab ' + tabid);

	$.ajax({
		url: uri,
		type: "GET"
	}).done(function(data, textStatus, xhr, a, b){ 
      var numberOfMementos = xhr.getResponseHeader('X-Memento-Count');
      tmData = data;
      console.log(tmData);

      displaySecureSiteMementos(data.mementos.list, tabid);
      setTimemapInStorage(tmData, data.original_uri);
	}).fail(function(xhr, data, error) {
	  if(xhr.status === 404) {
		if(debug){console.log('querying secure FAILED, Display zero mementos interface');}
		showInterfaceForZeroMementos(tabid);
	  }
	  if(debug){console.log('Some error occurred with a secure site that was not a 404');console.log(xhr);}
	}).always(function() {
	  chrome.tabs.sendMessage(tabid, {
	      'method': 'stopAnimatingBrowserActionIcon'
	  });
	});
}

function setLocalStorage(){}

function setBadgeText(value, tabid) {
	var badgeValue = value;

	if(parseInt(badgeValue) > 999) {
			badgeValue = maxBadgeDisplay;
	}

    // Cache query data for eventually restoring when back button is hit (UNIMPLEMENTED)
	//chrome.tabs.get(tabid, function(tab) {
	//	tabBadgeCount['tab' + tabid] = {mementoCount: value, url: tab.url};
	//}); 
	
	var badgeColor = "#090";
	if(value === stillProcessingBadgeDisplay) {
	    badgeColor = "#900"
	}
	
	if(!badgeValue) {
	  badgeValue = '';
	}
	
	chrome.browserAction.setBadgeText({text: badgeValue + '', tabId: tabid});
	chrome.browserAction.setBadgeBackgroundColor({color: badgeColor, tabId: tabid});
}

function setBadgeTitle(newTitle, tabid) {
  if(debug){console.warn('setting badge title');}
  chrome.browserAction.setTitle({title: newTitle, tabId: tabid});
}

function setBadgeIcon(icons, tabid) {
    /*console.log('setting '+iconPath+ ' tab:'+tabid);
	
	var img = document.createElement('img');
	img.width = 38;
	img.height = 38;
	img.src = iconPath;
	var canvas = document.createElement('canvas');
	canvas.width = 38;
	canvas.height = 38;
	var context = canvas.getContext('2d');
	context.drawImage(img, 0, 0, 38, 38);
	
	chrome.browserAction.setIcon({tabId: tabid,
	  imageData: {'38': context.getImageData(0, 0, 38, 38)}
	});*/

    chrome.browserAction.setIcon({tabId: tabid, path: icons}); 
}

function setBadge(value, icon, tabid) {
    if(value === '') {
      chrome.browserAction.getBadgeText({tabId: tabid}, function(currentBadgeText) {
        setBadgeText(currentBadgeText + '', tabid);
      });
    }else {
      setBadgeText(value + '', tabid);
    }
    
    setBadgeIcon(icon, tabid);
    
    if(icon === badgeImages_isAMemento) {
      chrome.browserAction.setTitle({title: browserActionTitle_viewingMemento});
    }else {
      chrome.browserAction.setTitle({title: browserActionTitle_normal});
    }
}

function nextAnimationStep() {
	  if(iconState <= 0) {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-37_5'}});
		iconState = 1;
		if(debug){console.log('1');}
	  }else if(iconState == 1) {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-45.png'}});  
		iconState = 2;
		if(debug){console.log('2');}
	  }else {
		//chrome.pageAction.setIcon({tabId: tab.id, path: {'19':'images/mementoLogo-19px-30.png'}}); 
		iconState = 0;
		if(debug){console.log('0');}
	  }
	  
	  if(iconState == -1){ return;}
	  //setTimeout(nextAnimationStep, 250);
}

chrome.tabs.onActivated.addListener(function(activeTabInfo) {
  chrome.storage.local.get('disabled',function(items) {
    if(items.disabled) {
      stopWatchingRequests();
    }
  });
});


function startWatchingRequests() {
  chrome.storage.local.remove('disabled', function() {
	  chrome.contextMenus.update('mink_stopStartWatching', {
		  'title': 'Stop Watching Requests',
		  'onclick': stopWatchingRequests
	  });
	  
      chrome.tabs.query({
        active: true,
        'currentWindow': true
      }, function(tab) {
        setBadge('', badgeImages_mink, tab[0].id);
        setBadgeText('', tab[0].id);
      });
  });
}

function stopWatchingRequests() {
  if(debug){console.log('stopWatchingRequests() executing');}
  chrome.storage.local.set({'disabled': true}, function() {        
	  chrome.contextMenus.update('mink_stopStartWatching', {
		  'title': 'Restart Live-Archived Web Integration',
		  'onclick': startWatchingRequests
	  });
      
      
      
      chrome.tabs.query({
        active: true,
        'currentWindow': true
      }, function(tab) {
        setBadge(' ', badgeImages_disabled, tab[0].id);
        setBadgeText('', tab[0].id);
      });
  });
}

function stopWatchingRequests_blacklisted() {
  if(debug){console.log('stopWatchingRequests_blacklisted() executing');}
  
  
  chrome.tabs.query({active: true}, function(tab) {
	setBadge(' ', badgeImages_blacklisted, tab[0].id);
	setBadgeText('', tab[0].id);
  });

}



chrome.contextMenus.create({
    'id': 'mink_stopStartWatching',
	'title': 'Stop Watching Requests',
	'contexts': ['browser_action'],
	'onclick' : stopWatchingRequests
},function(err){
  if(err){console.log('error creating second contextmenu');}
});


chrome.contextMenus.create({
	'title': 'Add URL to Mink Blacklist',
	'contexts': ['browser_action', 'all'],
	'onclick' : addToBlackList
});

function addToBlackList(){
 	chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'addToBlacklist',
            'uri': tabs[0].url
        });

        setBadgeIcon(badgeImages_blacklisted, tabs[0].id);
        setBadgeText('', tabs[0].id);
    });
}

function nukeBlacklistCache(){
  chrome.storage.local.clear();
  if(debug){console.log('chrome.storage.local cleared');}
}

function nukeLocalStorage(){
  chrome.storage.local.clear();
  if(debug){console.log('chrome.storage.local cleared');}
}

function showArchiveNowUI(){
  if(debug){console.warn('showing archive now ui');}
 	chrome.tabs.query({
        'active': true,
        'currentWindow': true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            'method': 'showArchiveNowUI'
        });
    });
}

chrome.webRequest.onCompleted.addListener(function(deets){
   if(debug){console.log('*************');}
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


chrome.webRequest.onHeadersReceived.addListener(function(deets) {
	var url = deets.url;
	var timemap, timegate, original, url;

	var headers = deets.responseHeaders;
	var mementoDateTimeHeader;
	var linkHeaderAsString;
	
	// Enumerate through the HTTP response headers to grab those related to Memento (if applicable)
	for(var headerI = 0; headerI < headers.length; headerI++){
		if(headers[headerI].name == 'Memento-Datetime'){
			mementoDateTimeHeader = headers[headerI].value;
		}else if(headers[headerI].name == 'Link'){
			linkHeaderAsString = headers[headerI].value;
		}
	}
    
    if(debug) {
      console.log('Checking ' + url);
      console.log(headers);
    }
    
	if(linkHeaderAsString) {
	    if(debug) {
	      console.log('A link header exists:');
	      console.log(linkHeaderAsString);
	    }
	    
		var tm = new Timemap(linkHeaderAsString);
		if(debug){console.log('TG?: ' + tm.timegate);}
		if(tm.timegate) { //specified own TimeGate, query this
		  findTMURI(tm.timegate);
		}
		
		if(mementoDateTimeHeader){
			tm.datetime = mementoDateTimeHeader;
		}

        if(debug) {
          console.log('calling setTimemapInStorage with:');
          console.log(url);
          console.log(tm);
        }
        
		setTimemapInStorage(tm, url);
	} else if(debug) {
	  if(debug){console.log('The current page did not send a link header');}
	}
	
	
},
{urls: ['<all_urls>'],types: ['main_frame']},['responseHeaders', 'blocking']);


function findTMURI(uri) {
  if(debug){
    console.log('finding TM URI');
    console.log(uri);
  }
  $.ajax({
    url: uri,
    dataType: 'jsonp'
  }).done(function(data, status, xhr){
    //console.log('XXXXX');
    //console.log(xhr.getResponseHeader('link'));
    var tmX = new Timemap(xhr.getResponseHeader('link'));
    if(debug){
      console.warn(tmX.timemap);
      console.log(tmX);
    }
  });
}

function setTimemapInStorage(tm, url) {
	chrome.storage.local.get('timemaps', function(items) {
		var tms;
		var originalURI;
		if(tm.origin_uri) {
		  originalURI = tm.original_uri;
		}else if(tm.original) {
		  originalURI = tm.original;
		}
		
		console.log('setting TM for uri in storage, uri:' + url);
		
		
		if(!items.timemaps) {
			tms = {};
		}else {
			tms = items.timemaps;
		}
		tms[url] = tm;
		
		// Trim the cache if overfull
		if(items.timemaps) {
			if(debug){console.warn('******* Number of cached TMs:');}
			var cachedTMKeys = Object.keys(items.timemaps);
			if(cachedTMKeys.length > 10) { // Keep the cache to a reasonable size through random deletion
			  var indexToRemove = Math.floor(Math.random() * cachedTMKeys.length);
			  var keyOfIndex = cachedTMKeys[indexToRemove];
			  delete tms[keyOfIndex];
			}
        }
        
		
		chrome.storage.local.set({'timemaps':tms}, function() {
			chrome.storage.local.getBytesInUse('timemaps', function(bytesUsed) {
			  if(debug){console.log('current bytes used:' + bytesUsed);}
			});
			if(chrome.runtime.lastError) {
				if(debug){console.log('There was an error last time we tried to store a memento ' + chrome.runtime.lastError.message);}
				if(chrome.runtime.lastError.message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
					// Chicken wire and duct tape! Clear the cache, do it again, yeah!
					if(debug){console.warn('LOCALSTORAGE full! clearing!');}
					chrome.storage.local.clear();
					if(debug){
					  console.log('Re-setting chrome.storage.local with:');
					  console.log(tms);
					}
					chrome.storage.local.set({'timemaps':tms},function(){});
				}
			}
		});
	});
}



function displaySecureSiteMementos(mementos, tabid){
  setBadge(mementos.length, badgeImages_mink, tabid);
}


function showInterfaceForZeroMementos(tabid) {
  if(debug){console.log('Displaying zero mementos');}
  tmData = {};
  tmData.mementos = {};
  tmData.mementos.list = [];
  tmData.original_uri = 'doWeKnowThisHere';
  
  
  // TODO: Also set the badge icon to the red memento icon (or something else indicative)
  setBadgeText('', tabid);
  setBadgeIcon(badgeImages_noMementos, tabid);  
  setBadgeTitle(browserActionTitle_noMementos, tabid);
}
