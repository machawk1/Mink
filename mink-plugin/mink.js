chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	console.log("hitting in mink.js");
    if(request.method == "store"){
		console.log("storing!");
    	localStorage.setItem('minkURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
		localStorage.setItem('memento_datetime',request.memento_datetime);
		
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	console.log("RETRIEVING!");

    	//console.debug(localStorage.getItem("minkURI"));
      sendResponse({value: localStorage.getItem('minkURI'),mementos: localStorage.getItem('mementos'), memento_datetime: localStorage.getItem('memento_datetime')});
    }else if(request.method == "nukeFromOrbit"){
    	localStorage.removeItem('minkURI');
    }else if(request.method == "notify"){
		var notify = chrome.notifications.create(
			'id1',{   
				type:"basic",
				title:request.title,
				message:request.body,
				iconUrl: "images/icon128.png"
			},function() {} 
		 );
    
    }
  }
);



chrome.webRequest.onHeadersReceived.addListener(function(deets){
	var url = deets.url;
	var timemap, timegate, original, url;

	var headers = deets.responseHeaders;
	var mementoDateTimeHeader, linkHeaderAsString;
	for(var headerI=0; headerI<headers.length; headerI++){
		if(headers[headerI].name == "Memento-Datetime"){
			mementoDateTimeHeader = headers[headerI].value;
		}else if(headers[headerI].name == "Link"){
			linkHeaderAsString = headers[headerI].value;
		}
	}
	
	if(mementoDateTimeHeader){
		console.log("You're viewing something in the archive! TODO: Show simpler interface.");
		var m = new Memento();
		//m.uri = document.URL; // this won't work from mink.js and needs to be set elsewhere.
		m.datetime = mementoDateTimeHeader;
		chrome.storage.local.clear(); 
		chrome.storage.local.set(m);
		return;	//if we ever want to show the standard interface regardless of the memento-datetime header, disable this
	}
			
	if(linkHeaderAsString){
		var tm = new Timemap(linkHeaderAsString);
		chrome.storage.local.clear(); 
		chrome.storage.local.set(tm);
		console.log("Retained HTTP Link header data to local storage. TODO: re-read this value in the content script and perform UI display logic using saved data.");

	}else {	//e.g., http://matkelly.com
		console.log("There is no HTTP link header, Mink will utilize a Memento aggregator instead.");	
		chrome.storage.local.clear(); //get rid of previous timemaps, timegates, etc.
	}
},
{urls: ["<all_urls>"],types: ["main_frame"]},["responseHeaders"]);