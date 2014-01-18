chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.method == "store"){

    	localStorage.setItem('nelsonURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
		localStorage.setItem('memento_datetime',request.memento_datetime);
		
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	console.log("RETRIEVING!");
    	//console.debug(localStorage.getItem("nelsonURI"));
      sendResponse({value: localStorage.getItem('nelsonURI'),mementos: localStorage.getItem('mementos'), memento_datetime: localStorage.getItem('memento_datetime')});
    }else if(request.method == "nukeFromOrbit"){
    	localStorage.removeItem('nelsonURI');
    }
  });