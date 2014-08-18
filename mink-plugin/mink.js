chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	console.log("hitting in mink.js");
    if(request.method == "store"){

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
	var timemap, timegate, url;

	var headers = deets.responseHeaders;
	var mementoDateTimeHeader, linkHeader;
	for(var headerI=0; headerI<headers.length; headerI++){
		if(headers[headerI].name == "Memento-Datetime"){
			mementoDateTimeHeader = headers[headerI].value;
		}else if(headers[headerI].name == "Link"){
			linkHeader = headers[headerI].value;
		}
	}

	if(linkHeader){
		console.log(url+" has a link header");
		//parse out timegate
		var linkHeaderEntries = linkHeader.split(",");

		var mementoUrlExpression = /<[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?>/gi;
		var murlregex = new RegExp(mementoUrlExpression);
		var mementoRelTimegateExpression = /rel=".*timegate.*"/gi;
		var mtimegateregex = new RegExp(mementoRelTimegateExpression);
		var mementoRelExpression = /rel=".*timemap.*"/gi;
		var mtimemapregex = new RegExp(mementoRelExpression);
		
		for(var lhe=0; lhe<linkHeaderEntries.length; lhe++){
			
			var partsOfEntry = linkHeaderEntries[lhe].split(";");
			
			for(var partOfEntry=0; partOfEntry<partsOfEntry.length; partOfEntry++){
				if(partsOfEntry[partOfEntry].match(murlregex)){
					url = partsOfEntry[partOfEntry];
				}else if(partsOfEntry[partOfEntry].match(mtimegateregex)){
					timegate = url;
				}else if(partsOfEntry[partOfEntry].match(mtimemapregex)){	
					timemap = url;
				}else {
				}
			}
			if(timemap){
				console.log("Timemap: "+timemap);
			}
			if(timegate){
				console.log("Timegate: "+timegate);
			}	
			
			if(timegate && timemap){
				sendTimemapAndTimegate(timemap,timegate,url);
				return;
			}		
			
		}
	}
},
{urls: ["<all_urls>"],types: ["main_frame"]},["responseHeaders"]);

function sendTimemapAndTimegate(tm,tg,url){
	//if(!tm || !tg){return;}
	console.log("ok, going");
	console.log(tm);
	
	//return;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		console.log("sending message");
		if(!tm){tm="NONE";}
		if(!tg){tg="NONE";}
		console.log(tabs[0].id);
		chrome.tabs.sendMessage(tabs[0].id,{method: "displayUI", uri: url, timemap: tm, timegate: tg}, function(response) {});
	});
}
