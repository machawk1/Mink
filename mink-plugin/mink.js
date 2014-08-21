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



function showUIFromThisScript(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		console.log("TEST");

		console.log(tabs[0].id);
		chrome.tabs.sendMessage(tabs[0].id,{method: "displayUI"}, function(response) {});
	});
}

chrome.webRequest.onHeadersReceived.addListener(function(deets){
	var url = deets.url;
	var timemap, timegate, url;

	var headers = deets.responseHeaders;
	var mementoDateTimeHeader, linkHeader;
	for(var headerI=0; headerI<headers.length; headerI++){
		if(headers[headerI].name == "Memento-Datetime"){
			mementoDateTimeHeader = headers[headerI].value;
			//displayReturnToLiveWeb(liveWebURI);
			console.log(mementoDateTimeHeader);
			//showUIFromThisScript();
			//break;
		}else if(headers[headerI].name == "Link"){
			linkHeader = headers[headerI].value;
		}
	}
	
	if(linkHeader){
		console.log(url+" has a link header");
		//parse out timegate
		var linkHeaderEntries = linkHeader.split(",");

		var mementoUrlExpression = /<[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?>/gi;
		var murlregex = new RegExp(mementoUrlExpression); //regex to get a memento URI
		
		var mementoRelTimegateExpression = /rel=".*timegate.*"/gi;
		var mtimegateregex = new RegExp(mementoRelTimegateExpression); //regex to get timegate
		
		var mementoRelTimemapExpression = /rel=".*timemap.*"/gi;
		var mtimemapregex = new RegExp(mementoRelTimemapExpression); //regex to get timemap
		
		var mementoRelOriginalExpression = /rel=".*original.*"/gi;
		var moriginalregex = new RegExp(mementoRelOriginalExpression); //regex to get original	
		
		for(var lhe=0; lhe<linkHeaderEntries.length; lhe++){
			
			var partsOfEntry = linkHeaderEntries[lhe].split(";");
			
			for(var partOfEntry=0; partOfEntry<partsOfEntry.length; partOfEntry++){
				if(partsOfEntry[partOfEntry].match(murlregex)){
					url = partsOfEntry[partOfEntry];
				}else if(partsOfEntry[partOfEntry].match(mtimegateregex)){
					timegate = url;
				}else if(partsOfEntry[partOfEntry].match(mtimemapregex)){	
					timemap = url;
				}else if(partsOfEntry[partOfEntry].match(moriginalregex)){	
					original = url;
				}else {
				}
			}
		}
		
		
		//TODO: document this function using standard syntax
		//sanitize timemap/gate URIs 
		function sanitizeMementoURI(mURI){
			var ret = mURI.trim();
			if(ret.substr(0,1) == "<" && ret.substr(ret.length-1,1) == ">"){
				ret = ret.substr(1,ret.length-2); //remove first and last characters
			}
			return ret;
		}
		
		
		var mementoMetadataObject = {};
		if(timemap){	timemap = sanitizeMementoURI(timemap); mementoMetadataObject.timemap = timemap;}
		if(timegate){	timegate = sanitizeMementoURI(timegate); mementoMetadataObject.timegate = timegate;}
		if(original){	original = sanitizeMementoURI(original); mementoMetadataObject.original = original;}
		
		saveObjectToLocalStorage(mementoMetadataObject);
			
	
	
		
		//store the values retrieved into localstorage for later retrieval and retrieval from content.js
		// P.S. Messaging to the content script won't work here, as the page hasn't loaded
		function saveObjectToLocalStorage(obj){
			console.log("Storing discovered metadata about the memento:");
			for(var a in obj){
				console.log(" "+a+" "+obj[a]);
				localStorage.setItem(a,obj[a]);
			}
		}

		
	}
},
{urls: ["<all_urls>"],types: ["main_frame"]},["responseHeaders"]);