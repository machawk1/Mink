var debug = false;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.method == "store"){
    	localStorage.setItem('minkURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
		localStorage.setItem('memento_datetime',request.memento_datetime);
		
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	if(debug){console.log("RETRIEVING!");}

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
    
    }else if(request.method == "getMementosForHTTPSSource"){
    	//ideally, we would talk to an HTTPS version of the aggregator,
    	// instead, we will communicate with Mink's bg script to get around scheme issue
    	var uri = "http"+request.value.substr(4);
		$.ajax({
			url: uri,
			type: "GET"
		}).done(function(data,textStatus,xhr){
			if(debug){
				console.log("We should parse and return the mementos here via a response");
				//console.log(data);
			}
			chrome.tabs.query({
				"active": true,
				"currentWindow": true
			}, function (tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					"method": "displayThisMementoData",
					"data": data
				});
			});
			
		}).fail(function(xhr,textStatus,error){
			if(debug){
				//console.log("There was an error from mink.js");
				//console.log(textStatus);
				//console.log(error);
			}
			if(error == "Not Found"){
				//console.log("We have "+[].length+" mementos from the call to the archives using an HTTPS source!");
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

function showArchiveNowUI(){
 	chrome.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            "method": "showArchiveNowUI"
        });
    });
}

function getMementosForHTTPSWebsite(){
 	chrome.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            "method": "getMementosFromSecureSource"
        });
    });
}

chrome.webRequest.onCompleted.addListener(function(deets){
   // console.log("onHeadersReceived()");
   // console.log(deets.url);
   // console.log(deets);
   
    chrome.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            "method": "displayUI"
        });
    });
},
{urls: ["*://twitter.com/*/status/*"],types: ["xmlhttprequest"]},["responseHeaders"]);

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
			//if(debug){console.log("You're viewing something in the archive! TODO: Show simpler interface.");}
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