chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
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
  });
  

