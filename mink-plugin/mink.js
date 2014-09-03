var debug = false;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if(debug){console.log("hitting in mink.js");}
    if(request.method == "store"){
		console.log("storing!");
    	localStorage.setItem('minkURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
		localStorage.setItem('memento_datetime',request.memento_datetime);
		
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	if(debug){console.log("RETRIEVING!");}

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


chrome.contextMenus.create({
	"title": "Hide Mink until reload",
	"contexts": ["image"],
	"onclick" : hideMinkUI
	//,"targetUrlPatterns":["*://*/*"] //TODO: filter this solely to the Mink UI
});

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
				
	if(linkHeaderAsString){
		var tm = new Timemap(linkHeaderAsString);
		chrome.storage.local.clear(); 
		if(mementoDateTimeHeader){ 
			tm.datetime = mementoDateTimeHeader;
		}
		chrome.storage.local.set(tm);
		if(mementoDateTimeHeader){ 
			if(debug){console.log("You're viewing something in the archive! TODO: Show simpler interface.");}
			//var m = new Memento();
			//m.datetime = mementoDateTimeHeader; 
			//chrome.storage.local.set(m);
			return;	//if we ever want to show the standard interface regardless of the memento-datetime header, disable this
		}
	}else {	//e.g., http://matkelly.com
		if(debug){console.log("There is no HTTP link header, Mink will utilize a Memento aggregator instead.");	}
		chrome.storage.local.clear(); //get rid of previous timemaps, timegates, etc.
	}
	
	
},
{urls: ["<all_urls>"],types: ["main_frame"]},["responseHeaders"]);